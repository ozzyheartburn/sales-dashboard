/**
 * transform-fields.js
 *
 * MongoDB Change Stream listener that watches for new document insertions
 * in PG_Machine.PG_Machine. On each insert, scans ALL documents and ensures
 * "source", "priority", and "buyingSignalScore" are correctly populated
 * by parsing the "reports.chatGptAnalysis" field.
 *
 * Score format in chatGptAnalysis:
 *   "**Total account buying signal score:** **7.75/10**"  → normalized to /10
 *   "**Total account buying signal score:** **78/100**"   → normalized to /10
 *
 * Priority rules (based on normalized 0-10 score):
 *   >= 7.5  → "high"
 *   >= 5.0  → "medium"
 *   <  5.0  → "low"
 *
 * Source: set to "deep-research" (denotes data came from chatGptAnalysis pipeline)
 *
 * Usage:
 *   node transform-fields.js              # watch for new inserts + backfill all
 *   node transform-fields.js --backfill   # one-time backfill all docs, then exit
 *
 * Requires MONGODB_URI in .env (same as index.js).
 */

const { MongoClient, ServerApiVersion } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const BACKFILL_ONLY = process.argv.includes("--backfill");

// ─── Config from .env ─────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.TRANSFORM_DB_NAME || "PG_Machine";
const COLLECTION_NAME = process.env.TRANSFORM_COLLECTION || "PG_Machine";
const DEFAULT_SOURCE = process.env.TRANSFORM_DEFAULT_SOURCE || "deep-research";
const PRIORITY_HIGH_THRESHOLD = parseFloat(
  process.env.TRANSFORM_PRIORITY_HIGH || "7.5",
);
const PRIORITY_MEDIUM_THRESHOLD = parseFloat(
  process.env.TRANSFORM_PRIORITY_MEDIUM || "5.0",
);

if (!MONGODB_URI) {
  console.error("MONGODB_URI is required in .env");
  process.exit(1);
}

// ─── Extraction helpers ───────────────────────────────────────────────────────

/**
 * Parse the buying signal score from chatGptAnalysis text.
 * Handles "X/10" and "X/100" formats, normalizes to a 0-10 scale.
 */
function extractScore(text) {
  if (!text) return null;
  const match = text.match(
    /(?:buying\s+signal\s+score)[:\s*]*\*{0,2}\s*([\d]+\.?\d*)\s*[/]\s*([\d]+)/i,
  );
  if (!match) return null;

  const raw = parseFloat(match[1]);
  const scale = parseInt(match[2], 10);

  if (isNaN(raw) || isNaN(scale) || scale === 0) return null;

  // Normalize to 0-10 scale
  if (scale === 100) return Math.round((raw / 10) * 100) / 100;
  if (scale === 10) return raw;
  // Unknown scale — proportionally normalize to 10
  return Math.round((raw / scale) * 10 * 100) / 100;
}

/**
 * Derive priority label from a 0-10 score.
 */
function derivePriority(score) {
  if (score == null) return "unknown";
  if (score >= PRIORITY_HIGH_THRESHOLD) return "high";
  if (score >= PRIORITY_MEDIUM_THRESHOLD) return "medium";
  return "low";
}

// ─── Transform logic ──────────────────────────────────────────────────────────

/**
 * Process all documents: extract score, derive priority, set source.
 * Only updates docs where a value actually changed.
 */
async function transformAllDocuments(collection) {
  const docs = await collection
    .find({ "reports.chatGptAnalysis": { $exists: true, $ne: "" } })
    .toArray();

  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const analysis = doc.reports?.chatGptAnalysis || "";
    const extractedScore = extractScore(analysis);
    const extractedPriority = derivePriority(extractedScore);

    const updates = {};

    // Only update if the extracted value differs or field is missing/null
    if (extractedScore != null && doc.buyingSignalScore !== extractedScore) {
      updates.buyingSignalScore = extractedScore;
    }

    if (
      extractedPriority &&
      extractedPriority !== "unknown" &&
      doc.priority !== extractedPriority
    ) {
      updates.priority = extractedPriority;
    }

    if (!doc.source || doc.source !== DEFAULT_SOURCE) {
      updates.source = DEFAULT_SOURCE;
    }

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    await collection.updateOne({ _id: doc._id }, { $set: updates });
    updated++;
    console.log(
      `  Updated ${doc.companyName}: ` +
        Object.entries(updates)
          .map(([k, v]) => `${k}=${v}`)
          .join(", "),
    );
  }

  console.log(
    `Transform complete: ${updated} updated, ${skipped} already correct (${docs.length} total)\n`,
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const client = new MongoClient(MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  console.log("Connected to MongoDB");

  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  // Always run a backfill first
  console.log("Running backfill on all existing documents...");
  await transformAllDocuments(collection);

  if (BACKFILL_ONLY) {
    console.log("Backfill-only mode. Exiting.");
    await client.close();
    return;
  }

  // Watch for inserts via Change Stream
  console.log("Watching for new document inserts...");
  const changeStream = collection.watch(
    [{ $match: { operationType: { $in: ["insert", "replace", "update"] } } }],
    { fullDocument: "updateLookup" },
  );

  changeStream.on("change", async (change) => {
    const doc = change.fullDocument;
    if (!doc) return;

    console.log(
      `\nChange detected (${change.operationType}): ${doc.companyName || doc._id}`,
    );
    // Re-process all documents to ensure consistency
    await transformAllDocuments(collection);
  });

  changeStream.on("error", (err) => {
    console.error("Change stream error:", err.message);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\nShutting down...");
    await changeStream.close();
    await client.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log("Listening for changes. Press Ctrl+C to stop.\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

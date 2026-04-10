/**
 * normalize-schema.js
 *
 * Migrates all documents in PG_Machine.PG_Machine to the canonical schema.
 * Safe to run multiple times — already-normalized docs are left unchanged.
 * Missing fields get sensible defaults (empty string, empty array, null).
 *
 * Usage:  node normalize-schema.js [--dry-run]
 */

const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Canonical document shape ─────────────────────────────────────────────────
function canonicalShape() {
  return {
    companyName: "",
    website: "",
    timestamp: new Date().toISOString(),
    buyingSignalScore: null,
    priority: "",
    rationale: "",
    insights: {
      strategicContext: [],
      ecommercePriorities: [],
      activeInitiatives: [],
      keyChallenges: [],
      opportunityFrame: [],
    },
    reports: {
      chatGptAnalysis: "",
      perplexityResearch: "",
    },
    metadata: {
      citations: [],
      searchResults: [],
    },
  };
}

// ─── Field mapping: old field → new path ──────────────────────────────────────
// Handles both PascalCase legacy docs and flat-string fields
function mapLegacyFields(doc) {
  const mapped = {};

  // Top-level renames
  if (doc.CompanyName != null && doc.companyName == null)
    mapped.companyName = doc.CompanyName;
  if (doc.Website != null && doc.website == null) mapped.website = doc.Website;
  if (doc.score != null && doc.buyingSignalScore == null)
    mapped.buyingSignalScore = doc.score;
  if (doc.BuyingSignals != null && doc.buyingSignalScore == null)
    mapped.buyingSignalScore = doc.BuyingSignals;
  if (doc.created_at != null && doc.timestamp == null)
    mapped.timestamp = doc.created_at;

  // Flat strings → insights arrays (wrap string in array as single-item)
  if (
    typeof doc.strategicContext === "string" &&
    !doc.insights?.strategicContext
  ) {
    mapped["insights.strategicContext"] = doc.strategicContext
      ? [{ text: doc.strategicContext }]
      : [];
  }
  if (
    typeof doc.procurementPriorities === "string" &&
    !doc.insights?.ecommercePriorities
  ) {
    mapped["insights.ecommercePriorities"] = doc.procurementPriorities
      ? [{ text: doc.procurementPriorities }]
      : [];
  }
  if (
    typeof doc.activeInitiatives === "string" &&
    !doc.insights?.activeInitiatives
  ) {
    mapped["insights.activeInitiatives"] = doc.activeInitiatives
      ? [{ text: doc.activeInitiatives }]
      : [];
  }
  if (typeof doc.keyChallenges === "string" && !doc.insights?.keyChallenges) {
    mapped["insights.keyChallenges"] = doc.keyChallenges
      ? [{ text: doc.keyChallenges }]
      : [];
  }
  if (
    typeof doc.opportunityFrame === "string" &&
    !doc.insights?.opportunityFrame
  ) {
    mapped["insights.opportunityFrame"] = doc.opportunityFrame
      ? [{ text: doc.opportunityFrame }]
      : [];
  }

  return mapped;
}

// Fields to remove after migration
const LEGACY_FIELDS = [
  "CompanyName",
  "Website",
  "score",
  "BuyingSignals",
  "created_at",
  "strategicContext",
  "procurementPriorities",
  "activeInitiatives",
  "keyChallenges",
  "opportunityFrame",
];

// ─── Normalize a single document ──────────────────────────────────────────────
function buildUpdate(doc) {
  const defaults = canonicalShape();
  const legacy = mapLegacyFields(doc);

  const $set = {};
  const $unset = {};

  // 1. Apply legacy field mappings
  for (const [key, value] of Object.entries(legacy)) {
    $set[key] = value;
  }

  // 2. Ensure all canonical top-level fields exist
  for (const [key, defaultVal] of Object.entries(defaults)) {
    if (key === "insights" || key === "reports" || key === "metadata") {
      // Handle nested objects — set missing sub-fields
      const nested = defaultVal;
      for (const [subKey, subDefault] of Object.entries(nested)) {
        const dotPath = `${key}.${subKey}`;
        if (doc[key]?.[subKey] == null && !(dotPath in $set)) {
          $set[dotPath] = subDefault;
        }
      }
    } else {
      if (doc[key] == null && !(key in $set)) {
        $set[key] = defaultVal;
      }
    }
  }

  // 3. Remove legacy fields that have been migrated
  for (const field of LEGACY_FIELDS) {
    if (doc[field] != null) {
      $unset[field] = "";
    }
  }

  const update = {};
  if (Object.keys($set).length > 0) update.$set = $set;
  if (Object.keys($unset).length > 0) update.$unset = $unset;

  return Object.keys(update).length > 0 ? update : null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    const db = client.db("PG_Machine");
    const collection = db.collection("PG_Machine");

    const docs = await collection.find({}).toArray();
    console.log(`Found ${docs.length} documents in PG_Machine.PG_Machine`);

    let updated = 0;
    let skipped = 0;

    for (const doc of docs) {
      const update = buildUpdate(doc);
      if (!update) {
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(
          `\n[DRY RUN] ${doc.companyName || doc.CompanyName || doc._id}`,
        );
        if (update.$set)
          console.log("  $set:", Object.keys(update.$set).join(", "));
        if (update.$unset)
          console.log("  $unset:", Object.keys(update.$unset).join(", "));
      } else {
        await collection.updateOne({ _id: doc._id }, update);
      }
      updated++;
    }

    console.log(
      `\nDone${DRY_RUN ? " (dry run)" : ""}. Updated: ${updated}, Skipped: ${skipped}`,
    );
  } finally {
    await client.close();
  }
}

run().catch(console.dir);

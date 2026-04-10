const { MongoClient, ServerApiVersion } = require("mongodb");
const path = require("path");
const fs = require("fs");

// Load .env
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const idx = line.indexOf("=");
    if (idx > 0 && !line.startsWith("#")) {
      const key = line.slice(0, idx).trim();
      const val = line
        .slice(idx + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      process.env[key] = val;
    }
  }
}

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    const collection = client.db("PG_Machine").collection("PG_Machine");

    // List existing search indexes
    const existing = [];
    try {
      const cursor = collection.listSearchIndexes();
      while (await cursor.hasNext()) {
        existing.push(await cursor.next());
      }
    } catch (e) {
      console.log("Could not list existing indexes:", e.message);
    }

    const existingNames = existing.map((idx) => idx.name);
    console.log(
      "Existing search indexes:",
      existingNames.length ? existingNames.join(", ") : "(none)",
    );

    // 1. Create vector search index
    if (!existingNames.includes("vector_index")) {
      console.log("\n→ Creating vector_index...");
      await collection.createSearchIndex({
        name: "vector_index",
        type: "vectorSearch",
        definition: {
          fields: [
            {
              type: "vector",
              path: "embedding",
              numDimensions: 1536,
              similarity: "cosine",
            },
          ],
        },
      });
      console.log("  ✓ vector_index created (may take a few minutes to build)");
    } else {
      console.log("\n✓ vector_index already exists");
    }

    // 2. Create full-text search index
    if (!existingNames.includes("fulltext_index")) {
      console.log("\n→ Creating fulltext_index...");
      await collection.createSearchIndex({
        name: "fulltext_index",
        type: "search",
        definition: {
          mappings: {
            dynamic: false,
            fields: {
              companyName: { type: "string" },
              rationale: { type: "string" },
              reports: {
                type: "document",
                fields: {
                  chatGptAnalysis: { type: "string" },
                  perplexityResearch: { type: "string" },
                },
              },
            },
          },
        },
      });
      console.log(
        "  ✓ fulltext_index created (may take a few minutes to build)",
      );
    } else {
      console.log("\n✓ fulltext_index already exists");
    }

    // Wait and check status
    console.log("\n→ Waiting for indexes to become ready...");
    for (let i = 0; i < 30; i++) {
      const indexes = [];
      const cursor = collection.listSearchIndexes();
      while (await cursor.hasNext()) {
        indexes.push(await cursor.next());
      }
      const statuses = indexes.map((idx) => `${idx.name}: ${idx.status}`);
      console.log(`  [${i * 10}s] ${statuses.join(" | ")}`);

      const allReady =
        indexes.length >= 2 && indexes.every((idx) => idx.status === "READY");
      if (allReady) {
        console.log("\n✅ All indexes are READY!");
        break;
      }
      if (i < 29) await new Promise((r) => setTimeout(r, 10000));
    }
  } finally {
    await client.close();
  }
}

main().catch(console.error);

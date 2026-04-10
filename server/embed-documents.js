// One-time script: generate embeddings for all PG_Machine documents
// Run: node embed-documents.js
const { MongoClient, ServerApiVersion } = require("mongodb");
const OpenAI = require("openai");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 20; // OpenAI supports up to 2048 inputs per batch

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

function buildTextForEmbedding(doc) {
  const parts = [];

  if (doc.companyName) parts.push(`Company: ${doc.companyName}`);
  if (doc.website) parts.push(`Website: ${doc.website}`);
  if (doc.rationale) parts.push(`Rationale: ${doc.rationale}`);

  // Primary fields
  if (doc.reports?.chatGptAnalysis) {
    parts.push(`ChatGPT Analysis:\n${doc.reports.chatGptAnalysis}`);
  }
  if (doc.reports?.perplexityResearch) {
    parts.push(`Perplexity Research:\n${doc.reports.perplexityResearch}`);
  }

  // Include insight summaries for richer context
  if (doc.insights) {
    for (const [category, items] of Object.entries(doc.insights)) {
      if (Array.isArray(items) && items.length > 0) {
        const summaries = items
          .map((item) => `${item.title}: ${item.description}`)
          .join("\n");
        parts.push(`${category}:\n${summaries}`);
      }
    }
  }

  return parts.join("\n\n");
}

async function run() {
  try {
    await client.connect();
    const db = client.db("PG_Machine");
    const collection = db.collection("PG_Machine");

    // Find documents that have at least one report field and no embedding yet
    const docs = await collection
      .find({
        $and: [
          {
            $or: [
              { "reports.chatGptAnalysis": { $exists: true, $ne: "" } },
              { "reports.perplexityResearch": { $exists: true, $ne: "" } },
            ],
          },
          { embedding: { $exists: false } },
        ],
      })
      .toArray();

    console.log(`Found ${docs.length} documents to embed`);

    if (docs.length === 0) {
      console.log("All documents already have embeddings. Nothing to do.");
      return;
    }

    // Process in batches
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = docs.slice(i, i + BATCH_SIZE);
      const texts = batch.map((doc) => {
        const text = buildTextForEmbedding(doc);
        // text-embedding-3-small supports up to 8191 tokens; truncate long docs
        return text.slice(0, 30000);
      });

      console.log(
        `Embedding batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} docs)...`,
      );

      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
      });

      // Write embeddings back to MongoDB
      const bulkOps = batch.map((doc, idx) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              embedding: response.data[idx].embedding,
              embeddingModel: EMBEDDING_MODEL,
              embeddedAt: new Date().toISOString(),
            },
          },
        },
      }));

      const result = await collection.bulkWrite(bulkOps);
      console.log(`  → Updated ${result.modifiedCount} documents`);
    }

    console.log("✅ Embedding complete");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

run();

// Simple Node.js Express server for backend operations
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;
async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("PG_Machine");
  }
  return db;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Get accounts from PG_Machine collection
app.get("/api/accounts", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("PG_Machine");
    const accounts = await collection
      .find({ companyName: { $ne: null } })
      .toArray();
    res.json(accounts);
  } catch (err) {
    console.error("Error fetching accounts:", err);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});
// Save research result from n8n workflow into MongoDB
// Initiate research: call n8n webhook, save result to MongoDB
app.post("/api/research", async (req, res) => {
  try {
    const { account_name, website_url } = req.body;
    if (!account_name) {
      return res.status(400).json({ error: "Missing account_name in payload" });
    }

    console.log(`Research started for ${account_name}...`);

    // 1. Call n8n webhook and wait for the structured result
    const n8nUrl =
      "https://gtmbaltics.app.n8n.cloud/webhook/002eb43f-96f4-4046-86f3-d0129f19819d";
    const n8nRes = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_name, website_url }),
    });

    if (!n8nRes.ok) {
      const errText = await n8nRes.text();
      console.error(`n8n returned ${n8nRes.status}: ${errText}`);
      return res.status(502).json({ error: "n8n workflow failed" });
    }

    const rawData = await n8nRes.json();
    // n8n "All Incoming Items" returns an array — extract the first item
    const researchData = Array.isArray(rawData) ? rawData[0] : rawData;

    if (!researchData || !researchData.companyName) {
      console.error(
        "n8n response missing companyName:",
        Object.keys(researchData || {}),
      );
      return res
        .status(502)
        .json({ error: "n8n response missing companyName" });
    }

    // 2. Save to MongoDB
    const database = await connectDB();
    const collection = database.collection("PG_Machine");
    const result = await collection.updateOne(
      { companyName: researchData.companyName },
      {
        $set: {
          ...researchData,
          timestamp: researchData.timestamp || new Date().toISOString(),
        },
      },
      { upsert: true },
    );

    console.log(
      `Research saved for ${researchData.companyName}:`,
      result.upsertedId ? "inserted" : "updated",
    );

    res.json({
      success: true,
      companyName: researchData.companyName,
      upserted: !!result.upsertedId,
    });
  } catch (err) {
    console.error("Error in research workflow:", err);
    res.status(500).json({ error: "Research workflow failed" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

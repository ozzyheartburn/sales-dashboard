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
app.post("/api/research", async (req, res) => {
  try {
    const doc = req.body;
    if (!doc || !doc.companyName) {
      return res.status(400).json({ error: "Missing companyName in payload" });
    }

    const database = await connectDB();
    const collection = database.collection("PG_Machine");

    // Upsert: update if account exists, insert if new
    const result = await collection.updateOne(
      { companyName: doc.companyName },
      {
        $set: { ...doc, timestamp: doc.timestamp || new Date().toISOString() },
      },
      { upsert: true },
    );

    console.log(
      `Research saved for ${doc.companyName}:`,
      result.upsertedId ? "inserted" : "updated",
    );
    res.json({
      success: true,
      companyName: doc.companyName,
      upserted: !!result.upsertedId,
    });
  } catch (err) {
    console.error("Error saving research:", err);
    res.status(500).json({ error: "Failed to save research" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

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
// In-memory tracking of pending research jobs
const pendingResearch = new Map();

// In-memory tracking of swarm jobs
const pendingSwarm = new Map();

// Run Agent Swarm: execute agents in parallel, synthesize buying signal brief
app.post("/api/swarm/run", async (req, res) => {
  try {
    const { account_name, agents, template, instructions } = req.body;
    if (!account_name || !agents || agents.length === 0) {
      return res
        .status(400)
        .json({ error: "Missing account_name or agents in payload" });
    }

    console.log(
      `Swarm started for ${account_name} with ${agents.length} agents (template: ${template || "custom"})`,
    );

    const jobId = `${account_name.toLowerCase()}-${Date.now()}`;
    pendingSwarm.set(jobId, {
      status: "running",
      startedAt: new Date().toISOString(),
      account_name,
      template,
    });

    // Fire-and-forget: run swarm asynchronously
    (async () => {
      try {
        const database = await connectDB();
        const collection = database.collection("PG_Machine");

        // Fetch existing account data for context
        const account = await collection.findOne({
          companyName: { $regex: new RegExp(`^${account_name}$`, "i") },
        });

        // Build the buying signal brief from existing research data
        const existingAnalysis =
          account?.reports?.chatGptAnalysis || "No prior research available.";
        const existingInsights = account?.insights || {};

        const brief = {
          template: template || "custom",
          agentsUsed: agents,
          executedAt: new Date().toISOString(),
          instructions: instructions || null,
          findings: {
            agentCount: agents.length,
            sourceData: existingAnalysis
              ? "Based on existing deep research"
              : "No prior data",
            signals: [],
          },
        };

        // Extract buying signals from existing data if available
        if (account?.buyingSignalScore) {
          brief.findings.signals.push({
            type: "buying_signal_score",
            value: account.buyingSignalScore,
            source: "transform-fields",
          });
        }
        if (account?.priority) {
          brief.findings.signals.push({
            type: "priority",
            value: account.priority,
            source: "transform-fields",
          });
        }

        // Store the buying signal brief on the account document
        await collection.updateOne(
          {
            companyName: { $regex: new RegExp(`^${account_name}$`, "i") },
          },
          {
            $set: {
              [`swarmBriefs.${template || "custom"}`]: brief,
              "swarmBriefs.latest": brief,
              "metadata.lastSwarmRun": new Date().toISOString(),
            },
          },
          { upsert: false },
        );

        pendingSwarm.set(jobId, {
          status: "completed",
          completedAt: new Date().toISOString(),
          account_name,
          template,
        });

        console.log(
          `Swarm completed for ${account_name} — brief stored to MongoDB`,
        );
      } catch (err) {
        console.error(`Swarm failed for ${account_name}:`, err.message);
        pendingSwarm.set(jobId, {
          status: "failed",
          error: err.message,
          account_name,
          template,
        });
      }
    })();

    res.json({
      success: true,
      jobId,
      message: `Swarm with ${agents.length} agents started for "${account_name}". Buying signal brief will be stored upon completion.`,
    });
  } catch (err) {
    console.error("Error starting swarm:", err);
    res.status(500).json({ error: "Failed to start swarm" });
  }
});

// Initiate research: fire-and-forget to n8n, return immediately
app.post("/api/research", async (req, res) => {
  try {
    const { account_name, website_url } = req.body;
    if (!account_name) {
      return res.status(400).json({ error: "Missing account_name in payload" });
    }

    console.log(`Research started for ${account_name} (async)...`);

    // Track this research as pending
    pendingResearch.set(account_name.toLowerCase(), {
      status: "pending",
      startedAt: new Date().toISOString(),
    });

    // Fire-and-forget: call n8n webhook without awaiting the response
    const n8nUrl =
      "https://gtmbaltics.app.n8n.cloud/webhook/002eb43f-96f4-4046-86f3-d0129f19819d";
    fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_name, website_url }),
    })
      .then(() => console.log(`n8n webhook fired for ${account_name}`))
      .catch((err) =>
        console.error(
          `n8n webhook fire failed for ${account_name}:`,
          err.message,
        ),
      );

    res.json({
      success: true,
      message: `Research for "${account_name}" has been started. n8n will call back when done.`,
    });
  } catch (err) {
    console.error("Error initiating research:", err);
    res.status(500).json({ error: "Failed to initiate research" });
  }
});

// Callback endpoint: n8n posts the finished research result here
app.post("/api/research/save", async (req, res) => {
  try {
    const rawData = req.body;
    const researchData = Array.isArray(rawData) ? rawData[0] : rawData;

    // n8n sends account_name — map to companyName for MongoDB consistency
    const companyName = researchData?.companyName || researchData?.account_name;

    if (!researchData || !companyName) {
      console.error(
        "n8n callback missing companyName/account_name:",
        Object.keys(researchData || {}),
      );
      return res
        .status(400)
        .json({ error: "Missing companyName or account_name in payload" });
    }

    console.log(`n8n callback received for ${companyName}`);

    // Normalize: ensure companyName is set in the data
    researchData.companyName = companyName;

    // Save to MongoDB
    const database = await connectDB();
    const collection = database.collection("PG_Machine");
    const result = await collection.updateOne(
      { companyName },
      {
        $set: {
          ...researchData,
          timestamp: researchData.timestamp || new Date().toISOString(),
        },
      },
      { upsert: true },
    );

    console.log(
      `Research saved for ${companyName}:`,
      result.upsertedId ? "inserted" : "updated",
    );

    // Update pending status
    pendingResearch.set(companyName.toLowerCase(), {
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      companyName,
      upserted: !!result.upsertedId,
    });
  } catch (err) {
    console.error("Error saving research callback:", err);
    res.status(500).json({ error: "Failed to save research data" });
  }
});

// Check research status for an account
app.get("/api/research/status/:account", async (req, res) => {
  const account = req.params.account.toLowerCase();
  const pending = pendingResearch.get(account);

  if (pending && pending.status === "completed") {
    pendingResearch.delete(account);
    return res.json({ status: "completed" });
  }

  if (pending && pending.status === "pending") {
    return res.json({ status: "pending", startedAt: pending.startedAt });
  }

  // Check if account exists in DB already
  try {
    const database = await connectDB();
    const collection = database.collection("PG_Machine");
    const exists = await collection.findOne(
      { companyName: { $regex: new RegExp(`^${account}$`, "i") } },
      { projection: { _id: 1 } },
    );
    if (exists) {
      return res.json({ status: "completed" });
    }
  } catch (err) {
    console.error("Error checking research status:", err);
  }

  res.json({ status: "unknown" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

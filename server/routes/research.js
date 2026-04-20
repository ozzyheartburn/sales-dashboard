// Research routes — initiate research via n8n, save callbacks, check status
const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { connectDB } = require("../config/db");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory tracking of pending research jobs
const pendingResearch = new Map();

// Initiate research: fire-and-forget to n8n, return immediately
router.post("/", async (req, res) => {
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
router.post("/save", async (req, res) => {
  try {
    const rawData = req.body;
    const researchData = Array.isArray(rawData) ? rawData[0] : rawData;

    const companyName = researchData?.companyName;

    if (!researchData || !companyName) {
      console.error(
        "n8n callback missing companyName:",
        Object.keys(researchData || {}),
      );
      return res.status(400).json({ error: "Missing companyName in payload" });
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

    // Auto-generate vector embedding for the new document
    try {
      const parts = [];
      if (companyName) parts.push(`Company: ${companyName}`);
      if (researchData.website) parts.push(`Website: ${researchData.website}`);
      if (researchData.rationale)
        parts.push(`Rationale: ${researchData.rationale}`);
      if (researchData.reports?.chatGptAnalysis) {
        parts.push(
          `ChatGPT Analysis:\n${researchData.reports.chatGptAnalysis}`,
        );
      }
      if (researchData.reports?.perplexityResearch) {
        parts.push(
          `Perplexity Research:\n${researchData.reports.perplexityResearch}`,
        );
      }
      if (researchData.insights) {
        for (const [category, items] of Object.entries(researchData.insights)) {
          if (Array.isArray(items) && items.length > 0) {
            const summaries = items
              .map((item) => `${item.title}: ${item.description}`)
              .join("\n");
            parts.push(`${category}:\n${summaries}`);
          }
        }
      }
      const textForEmbedding = parts.join("\n\n").slice(0, 30000);

      if (textForEmbedding.length > 50) {
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: textForEmbedding,
        });
        await collection.updateOne(
          { companyName },
          {
            $set: {
              embedding: embeddingResponse.data[0].embedding,
              embeddingModel: "text-embedding-3-small",
              embeddedAt: new Date().toISOString(),
            },
          },
        );
        console.log(`Embedding generated for ${companyName}`);
      }
    } catch (embErr) {
      console.error(`Embedding failed for ${companyName}:`, embErr.message);
    }

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
router.get("/status/:account", async (req, res) => {
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

module.exports = router;

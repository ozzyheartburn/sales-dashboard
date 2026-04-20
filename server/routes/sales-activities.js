// Sales Activities routes — single source of truth per company
const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");

// Helper: sync all PG_Machine research data into a SalesActivities document
async function syncAccountToSalesActivities(companyName) {
  const database = await connectDB();
  const pgCollection = database.collection("PG_Machine");
  const saCollection = database.collection("SalesActivities");

  const account = await pgCollection.findOne(
    { companyName: { $regex: new RegExp(`^${companyName}$`, "i") } },
    { projection: { embedding: 0, championEmbedding: 0 } },
  );

  if (!account) return null;

  const researchSnapshot = {
    companyName: account.companyName,
    website: account.website,
    buyingSignalScore: account.buyingSignalScore,
    priority: account.priority,
    rationale: account.rationale,
    reports: account.reports || {},
    insights: account.insights || {},
    champion_cxo_candidates: account.champion_cxo_candidates || [],
    champion_vp_director_candidates:
      account.champion_vp_director_candidates || [],
    champion_enduser_candidates: account.champion_enduser_candidates || [],
    detractors: account.detractors || [],
    primary_champion_recommendation:
      account.primary_champion_recommendation || null,
    champion_overall_readiness: account.champion_overall_readiness || null,
    agentResults: account.agentResults || {},
    swarmBriefs: account.swarmBriefs || {},
    "agentic-xtra-iterations": account["agentic-xtra-iterations"] || {},
    orgChart: account.orgChart || null,
    metadata: account.metadata || {},
    timestamp: account.timestamp,
  };

  const result = await saCollection.updateOne(
    { companyName: { $regex: new RegExp(`^${companyName}$`, "i") } },
    {
      $set: {
        ...researchSnapshot,
        lastSyncedAt: new Date().toISOString(),
      },
      $setOnInsert: {
        activities: [],
        createdAt: new Date().toISOString(),
      },
    },
    { upsert: true },
  );

  return result;
}

// Sync all accounts from PG_Machine into SalesActivities
router.post("/sync", async (req, res) => {
  try {
    const database = await connectDB();
    const pgCollection = database.collection("PG_Machine");
    const accounts = await pgCollection
      .find({ companyName: { $ne: null } })
      .project({ companyName: 1 })
      .toArray();

    let synced = 0;
    for (const acc of accounts) {
      await syncAccountToSalesActivities(acc.companyName);
      synced++;
    }

    console.log(`SalesActivities synced: ${synced} accounts`);
    res.json({ success: true, synced });
  } catch (err) {
    console.error("Error syncing SalesActivities:", err);
    res.status(500).json({ error: "Failed to sync" });
  }
});

// Sync a single account
router.post("/sync/:companyName", async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);
    const result = await syncAccountToSalesActivities(companyName);
    if (!result) {
      return res
        .status(404)
        .json({ error: `Account "${companyName}" not found in PG_Machine` });
    }
    res.json({ success: true, companyName });
  } catch (err) {
    console.error("Error syncing single account:", err);
    res.status(500).json({ error: "Failed to sync account" });
  }
});

// Get the full SalesActivities document for a company (the single source of truth)
router.get("/:companyName", async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);
    const database = await connectDB();
    const saCollection = database.collection("SalesActivities");

    const doc = await saCollection.findOne({
      companyName: { $regex: new RegExp(`^${companyName}$`, "i") },
    });

    if (!doc) {
      return res
        .status(404)
        .json({ error: "No SalesActivities document found. Run sync first." });
    }

    res.json(doc);
  } catch (err) {
    console.error("Error fetching SalesActivities:", err);
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// Get all SalesActivities documents (lightweight — no full reports)
router.get("/", async (req, res) => {
  try {
    const database = await connectDB();
    const saCollection = database.collection("SalesActivities");

    const docs = await saCollection
      .find({})
      .project({
        companyName: 1,
        website: 1,
        buyingSignalScore: 1,
        priority: 1,
        champion_overall_readiness: 1,
        primary_champion_recommendation: 1,
        activities: 1,
        lastSyncedAt: 1,
      })
      .toArray();

    res.json(docs);
  } catch (err) {
    console.error("Error fetching all SalesActivities:", err);
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// Log a new sales activity for a company
router.post("/:companyName/activity", async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);
    const {
      activityType,
      activityDate,
      description,
      performedBy,
      contactName,
      contactRole,
      customerOutcome,
      outcomeType,
      outcomeDate,
      dealProgressed,
      notes,
    } = req.body;

    if (!activityType || !description) {
      return res
        .status(400)
        .json({ error: "Missing activityType or description" });
    }

    const allowedTypes = [
      "email",
      "call",
      "linkedin",
      "meeting",
      "demo",
      "proposal",
      "follow_up",
      "event",
      "referral",
      "other",
    ];
    if (!allowedTypes.includes(activityType)) {
      return res.status(400).json({
        error: `activityType must be one of: ${allowedTypes.join(", ")}`,
      });
    }

    const allowedOutcomes = [
      "no_response",
      "replied",
      "booked_meeting",
      "agreed_poc",
      "introduced_stakeholder",
      "requested_proposal",
      "verbal_commit",
      "declined",
      "pending",
    ];
    if (outcomeType && !allowedOutcomes.includes(outcomeType)) {
      return res.status(400).json({
        error: `outcomeType must be one of: ${allowedOutcomes.join(", ")}`,
      });
    }

    const database = await connectDB();
    const saCollection = database.collection("SalesActivities");

    // Ensure document exists (sync from PG_Machine if not)
    const existing = await saCollection.findOne({
      companyName: { $regex: new RegExp(`^${companyName}$`, "i") },
    });
    if (!existing) {
      await syncAccountToSalesActivities(companyName);
    }

    const activity = {
      _activityId: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      activityType,
      activityDate: activityDate || new Date().toISOString(),
      description,
      performedBy: performedBy || null,
      contactName: contactName || null,
      contactRole: contactRole || null,
      customerOutcome: customerOutcome || null,
      outcomeType: outcomeType || "pending",
      outcomeDate: outcomeDate || null,
      dealProgressed: dealProgressed != null ? dealProgressed : null,
      notes: notes || null,
      createdAt: new Date().toISOString(),
    };

    await saCollection.updateOne(
      { companyName: { $regex: new RegExp(`^${companyName}$`, "i") } },
      { $push: { activities: activity } },
    );

    console.log(
      `Activity logged for ${companyName}: ${activityType} — ${description.slice(0, 60)}`,
    );
    res.json({ success: true, activity });
  } catch (err) {
    console.error("Error logging activity:", err);
    res.status(500).json({ error: "Failed to log activity" });
  }
});

// Update an existing activity (e.g. add outcome after the fact)
router.put("/:companyName/activity/:activityId", async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);
    const activityId = req.params.activityId;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No update fields provided" });
    }

    const database = await connectDB();
    const saCollection = database.collection("SalesActivities");

    // Build $set fields for the matched array element
    const setFields = {};
    const allowedFields = [
      "activityType",
      "activityDate",
      "description",
      "performedBy",
      "contactName",
      "contactRole",
      "customerOutcome",
      "outcomeType",
      "outcomeDate",
      "dealProgressed",
      "notes",
    ];
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        setFields[`activities.$.${key}`] = updates[key];
      }
    }
    setFields["activities.$.updatedAt"] = new Date().toISOString();

    const result = await saCollection.updateOne(
      {
        companyName: { $regex: new RegExp(`^${companyName}$`, "i") },
        "activities._activityId": activityId,
      },
      { $set: setFields },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    res.json({ success: true, companyName, activityId });
  } catch (err) {
    console.error("Error updating activity:", err);
    res.status(500).json({ error: "Failed to update activity" });
  }
});

// Get aggregated activity summary for a company
router.get("/:companyName/summary", async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);
    const database = await connectDB();
    const saCollection = database.collection("SalesActivities");

    const doc = await saCollection.findOne(
      { companyName: { $regex: new RegExp(`^${companyName}$`, "i") } },
      {
        projection: {
          activities: 1,
          companyName: 1,
          buyingSignalScore: 1,
          priority: 1,
          champion_overall_readiness: 1,
        },
      },
    );

    if (!doc) {
      return res
        .status(404)
        .json({ error: "No SalesActivities document found" });
    }

    const activities = doc.activities || [];
    const totalActivities = activities.length;

    // Count by type
    const byType = {};
    activities.forEach((a) => {
      byType[a.activityType] = (byType[a.activityType] || 0) + 1;
    });

    // Count by outcome
    const byOutcome = {};
    activities.forEach((a) => {
      const ot = a.outcomeType || "pending";
      byOutcome[ot] = (byOutcome[ot] || 0) + 1;
    });

    // Deal progression rate
    const withOutcome = activities.filter((a) => a.dealProgressed != null);
    const progressed = withOutcome.filter(
      (a) => a.dealProgressed === true,
    ).length;
    const progressionRate =
      withOutcome.length > 0
        ? Math.round((progressed / withOutcome.length) * 100)
        : null;

    // Last activity date
    const sorted = [...activities].sort(
      (a, b) =>
        new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime(),
    );
    const lastActivityDate = sorted[0]?.activityDate || null;
    const daysSinceLastActivity = lastActivityDate
      ? Math.floor(
          (Date.now() - new Date(lastActivityDate).getTime()) / 86400000,
        )
      : null;

    res.json({
      companyName: doc.companyName,
      buyingSignalScore: doc.buyingSignalScore,
      priority: doc.priority,
      champion_overall_readiness: doc.champion_overall_readiness,
      totalActivities,
      byType,
      byOutcome,
      progressionRate,
      progressed,
      totalWithOutcome: withOutcome.length,
      lastActivityDate,
      daysSinceLastActivity,
    });
  } catch (err) {
    console.error("Error computing activity summary:", err);
    res.status(500).json({ error: "Failed to compute summary" });
  }
});

module.exports = router;

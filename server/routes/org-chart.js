// Org chart routes — save/retrieve org charts
const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");

// Save org chart (nodes + edges) for an account
router.post("/save", async (req, res) => {
  try {
    const { account_name, nodes, edges } = req.body;
    if (!account_name || !Array.isArray(nodes)) {
      return res
        .status(400)
        .json({ error: "Missing account_name or nodes in payload" });
    }

    const database = await connectDB();
    const collection = database.collection("PG_Machine");

    await collection.updateOne(
      { companyName: { $regex: new RegExp(`^${account_name}$`, "i") } },
      {
        $set: {
          orgChart: {
            nodes,
            edges: edges || [],
            savedAt: new Date().toISOString(),
          },
        },
      },
    );

    console.log(
      `Org chart saved for ${account_name}: ${nodes.length} nodes, ${(edges || []).length} edges`,
    );
    res.json({ success: true, account_name });
  } catch (err) {
    console.error("Error saving org chart:", err);
    res.status(500).json({ error: "Failed to save org chart" });
  }
});

// Get saved org chart for an account
router.get("/:accountName", async (req, res) => {
  try {
    const accountName = decodeURIComponent(req.params.accountName);

    const database = await connectDB();
    const collection = database.collection("PG_Machine");

    const account = await collection.findOne(
      { companyName: { $regex: new RegExp(`^${accountName}$`, "i") } },
      { projection: { orgChart: 1, companyName: 1 } },
    );

    if (!account || !account.orgChart) {
      return res.status(404).json({ error: "No org chart found" });
    }

    res.json({
      companyName: account.companyName,
      ...account.orgChart,
    });
  } catch (err) {
    console.error("Error fetching org chart:", err);
    res.status(500).json({ error: "Failed to fetch org chart" });
  }
});

module.exports = router;

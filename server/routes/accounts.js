// Account routes — CRUD + assignment
const express = require("express");
const router = express.Router();
const { connectDB, connectTenantDB } = require("../config/db");
const { resolveIdentity } = require("../services/identity.service");

// Get accounts from PG_Machine collection
// Supports role-based filtering via headers:
//   x-user-email, x-user-role, x-user-team, x-tenant
//   x-customer-company-id, x-customer-user-id-rbac (pg_identity cross-ref)
router.get("/", async (req, res) => {
  try {
    const tenantSlug = req.headers["x-tenant"] || "PG_Machine";
    const userRole = req.headers["x-user-role"];
    const userEmail = req.headers["x-user-email"];
    const userTeam = req.headers["x-user-team"];
    const customerCompanyId = req.headers["x-customer-company-id"];
    const customerRbac = req.headers["x-customer-user-id-rbac"];

    // If identity headers present, cross-reference pg_identity to verify
    if (userEmail) {
      const identity = await resolveIdentity(userEmail);
      if (identity) {
        // Enforce tenant isolation: user can only access their own company's database
        const allowedTenant = identity.databaseName || identity.companySlug;
        if (
          customerRbac !== "platform_admin" &&
          tenantSlug !== allowedTenant &&
          tenantSlug !== "PG_Machine"
        ) {
          return res.status(403).json({
            error: "Access denied: you cannot access this tenant's data",
          });
        }
      }
    }

    // Resolve database: use tenant DB if specified, else PG_Machine
    let database;
    if (tenantSlug && tenantSlug !== "PG_Machine") {
      database = await connectTenantDB(tenantSlug);
    } else {
      database = await connectDB();
    }
    const collection = database.collection("PG_Machine");

    // Build filter based on role (use RBAC level if available, fall back to role header)
    const effectiveRole = customerRbac || userRole;
    const filter = { companyName: { $ne: null } };

    if (effectiveRole === "end_user" && userEmail) {
      // End users only see accounts assigned to them
      filter.assignedTo = userEmail.toLowerCase();
    } else if (effectiveRole === "team_leader" && userTeam) {
      // Team leaders see accounts assigned to their team
      filter.assignedTeam = userTeam;
    }
    // platform_admin and company_admin see all accounts (no extra filter)

    const accounts = await collection.find(filter).toArray();
    res.json(accounts);
  } catch (err) {
    console.error("Error fetching accounts:", err);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

// Assign an account to a user/team
router.put("/:companyName/assign", async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);
    const { assignedTo, assignedTeam } = req.body;
    const tenantSlug = req.headers["x-tenant"] || "PG_Machine";

    if (!assignedTo && !assignedTeam) {
      return res
        .status(400)
        .json({ error: "Provide assignedTo (email) and/or assignedTeam" });
    }

    let database;
    if (tenantSlug && tenantSlug !== "PG_Machine") {
      database = await connectTenantDB(tenantSlug);
    } else {
      database = await connectDB();
    }
    const collection = database.collection("PG_Machine");

    const setFields = { updatedAt: new Date().toISOString() };
    if (assignedTo) setFields.assignedTo = assignedTo.toLowerCase();
    if (assignedTeam) setFields.assignedTeam = assignedTeam;

    const result = await collection.updateOne(
      { companyName: { $regex: new RegExp(`^${companyName}$`, "i") } },
      { $set: setFields },
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ error: `Account "${companyName}" not found` });
    }

    console.log(
      `Account "${companyName}" assigned to ${assignedTo || "(no user)"} / team: ${assignedTeam || "(no team)"}`,
    );
    res.json({ success: true, companyName, assignedTo, assignedTeam });
  } catch (err) {
    console.error("Error assigning account:", err);
    res.status(500).json({ error: "Failed to assign account" });
  }
});

// Bulk assign accounts to a user/team
router.post("/bulk-assign", async (req, res) => {
  try {
    const { assignments } = req.body;
    const tenantSlug = req.headers["x-tenant"] || "PG_Machine";

    // assignments: [{ companyName, assignedTo, assignedTeam }]
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: "Provide an assignments array" });
    }

    let database;
    if (tenantSlug && tenantSlug !== "PG_Machine") {
      database = await connectTenantDB(tenantSlug);
    } else {
      database = await connectDB();
    }
    const collection = database.collection("PG_Machine");

    const results = [];
    for (const a of assignments) {
      if (!a.companyName) {
        results.push({
          companyName: null,
          status: "skipped",
          reason: "missing companyName",
        });
        continue;
      }
      const setFields = { updatedAt: new Date().toISOString() };
      if (a.assignedTo) setFields.assignedTo = a.assignedTo.toLowerCase();
      if (a.assignedTeam) setFields.assignedTeam = a.assignedTeam;

      const result = await collection.updateOne(
        { companyName: { $regex: new RegExp(`^${a.companyName}$`, "i") } },
        { $set: setFields },
      );
      results.push({
        companyName: a.companyName,
        status: result.matchedCount > 0 ? "assigned" : "not_found",
      });
    }

    console.log(
      `Bulk assign: ${results.filter((r) => r.status === "assigned").length}/${assignments.length} accounts assigned`,
    );
    res.json({ success: true, results });
  } catch (err) {
    console.error("Error bulk assigning accounts:", err);
    res.status(500).json({ error: "Failed to bulk assign" });
  }
});

module.exports = router;

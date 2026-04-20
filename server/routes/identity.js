// Identity routes — pg_identity CRUD + RBAC policies
const express = require("express");
const router = express.Router();
const { connectIdentityDB } = require("../config/db");
const { resolveIdentity } = require("../services/identity.service");

// Get all companies from pg_identity
router.get("/companies", async (req, res) => {
  try {
    const identityDb = await connectIdentityDB();
    const companies = await identityDb
      .collection("companies")
      .find({})
      .project({
        customer_company_id: 1,
        companyName: 1,
        slug: 1,
        status: 1,
        "users.customer_user_id": 1,
        "users.name": 1,
        "users.email": 1,
        "users.role": 1,
        "users.customer_user_id_rbac": 1,
      })
      .toArray();
    res.json(companies);
  } catch (err) {
    console.error("Error fetching identity companies:", err);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

// Get a single company with full user details
router.get("/companies/:companyId", async (req, res) => {
  try {
    const identityDb = await connectIdentityDB();
    const company = await identityDb
      .collection("companies")
      .findOne({ customer_company_id: req.params.companyId });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.json(company);
  } catch (err) {
    console.error("Error fetching company:", err);
    res.status(500).json({ error: "Failed to fetch company" });
  }
});

// Add a user to a company
router.post("/companies/:companyId/users", async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      department,
      manager,
      backupEmail,
      customer_user_id_rbac,
    } = req.body;
    if (!name || !email || !role || !customer_user_id_rbac) {
      return res.status(400).json({
        error:
          "Missing required fields: name, email, role, customer_user_id_rbac",
      });
    }

    // Validate RBAC level exists
    const identityDb = await connectIdentityDB();
    const rbac = await identityDb
      .collection("rbac_policies")
      .findOne({ customer_user_id_rbac });
    if (!rbac) {
      return res
        .status(400)
        .json({ error: `Invalid RBAC level: ${customer_user_id_rbac}` });
    }

    const userId = `usr_${email
      .split("@")[0]
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}`;

    const newUser = {
      customer_user_id: userId,
      name,
      email: email.toLowerCase(),
      role,
      department: department || null,
      manager: manager || null,
      backupEmail: backupEmail || null,
      customer_user_id_rbac,
      createdAt: new Date().toISOString(),
    };

    // Check user doesn't already exist in this company
    const companiesCol = identityDb.collection("companies");
    const existing = await companiesCol.findOne({
      customer_company_id: req.params.companyId,
      "users.email": email.toLowerCase(),
    });
    if (existing) {
      return res
        .status(409)
        .json({ error: "User already exists in this company" });
    }

    const result = await companiesCol.updateOne(
      { customer_company_id: req.params.companyId },
      {
        $push: { users: newUser },
        $set: { updatedAt: new Date().toISOString() },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    console.log(
      `Identity: user ${email} added to ${req.params.companyId} with RBAC: ${customer_user_id_rbac}`,
    );
    res.json({ success: true, user: newUser });
  } catch (err) {
    console.error("Error adding identity user:", err);
    res.status(500).json({ error: "Failed to add user" });
  }
});

// Get RBAC policies
router.get("/rbac", async (req, res) => {
  try {
    const identityDb = await connectIdentityDB();
    const policies = await identityDb
      .collection("rbac_policies")
      .find({})
      .toArray();
    res.json(policies);
  } catch (err) {
    console.error("Error fetching RBAC policies:", err);
    res.status(500).json({ error: "Failed to fetch RBAC policies" });
  }
});

// Resolve identity for an email (used by frontend on login)
router.get("/resolve/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const identity = await resolveIdentity(email);
    if (!identity) {
      return res
        .status(404)
        .json({ error: "No identity found for this email" });
    }
    res.json(identity);
  } catch (err) {
    console.error("Error resolving identity:", err);
    res.status(500).json({ error: "Failed to resolve identity" });
  }
});

module.exports = router;

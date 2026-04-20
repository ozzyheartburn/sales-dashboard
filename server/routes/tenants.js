// Tenant management routes — provisioning, listing, user management
const express = require("express");
const router = express.Router();
const { connectPlatformDB, connectTenantDB } = require("../config/db");
const { provisionTenant } = require("../provision-tenant");

// List all tenants (platform admin only)
router.get("/", async (req, res) => {
  try {
    const platformDb = await connectPlatformDB();
    const tenants = await platformDb
      .collection("tenants")
      .find({})
      .project({ slug: 1, displayName: 1, status: 1, createdAt: 1 })
      .toArray();
    res.json(tenants);
  } catch (err) {
    console.error("Error listing tenants:", err);
    res.status(500).json({ error: "Failed to list tenants" });
  }
});

// Provision a new tenant
router.post("/provision", async (req, res) => {
  try {
    const { slug, displayName, adminEmail } = req.body;
    if (!slug || !displayName) {
      return res
        .status(400)
        .json({ error: "Missing slug or displayName in payload" });
    }

    // Validate slug format (alphanumeric + underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(slug)) {
      return res.status(400).json({
        error: "Slug must contain only letters, numbers, and underscores",
      });
    }

    await provisionTenant(slug, displayName, adminEmail || null);
    res.json({ success: true, slug, displayName });
  } catch (err) {
    console.error("Error provisioning tenant:", err);
    res.status(500).json({ error: "Failed to provision tenant" });
  }
});

// Get tenant info
router.get("/:slug", async (req, res) => {
  try {
    const platformDb = await connectPlatformDB();
    const tenant = await platformDb
      .collection("tenants")
      .findOne({ slug: req.params.slug });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.json(tenant);
  } catch (err) {
    console.error("Error fetching tenant:", err);
    res.status(500).json({ error: "Failed to fetch tenant" });
  }
});

// Get users for a tenant
router.get("/:slug/users", async (req, res) => {
  try {
    const tenantDb = await connectTenantDB(req.params.slug);
    const users = await tenantDb
      .collection("users")
      .find({})
      .project({ auth0Id: 0 })
      .toArray();
    res.json(users);
  } catch (err) {
    console.error("Error fetching tenant users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Add/invite a user to a tenant
router.post("/:slug/users", async (req, res) => {
  try {
    const { email, name, role, teamName } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: "Missing email or role" });
    }

    const allowedRoles = [
      "platform_admin",
      "company_admin",
      "team_leader",
      "end_user",
    ];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: `Role must be one of: ${allowedRoles.join(", ")}`,
      });
    }

    const tenantDb = await connectTenantDB(req.params.slug);
    const usersCol = tenantDb.collection("users");

    const setFields = {
      email: email.toLowerCase(),
      name: name || null,
      role,
      tenantSlug: req.params.slug,
      updatedAt: new Date().toISOString(),
    };

    // Only store teamName for team_leader role
    if (role === "team_leader" && teamName) {
      setFields.teamName = teamName.trim();
    } else {
      setFields.teamName = null;
    }

    await usersCol.updateOne(
      { email: email.toLowerCase() },
      {
        $set: setFields,
        $setOnInsert: {
          googleId: null,
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true },
    );

    console.log(
      `User ${email} added to tenant ${req.params.slug} with role: ${role}${role === "team_leader" && teamName ? " (team: " + teamName + ")" : ""}`,
    );
    res.json({
      success: true,
      email,
      role,
      teamName: setFields.teamName,
      tenantSlug: req.params.slug,
    });
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).json({ error: "Failed to add user" });
  }
});

// Get roles for a tenant
router.get("/:slug/roles", async (req, res) => {
  try {
    const tenantDb = await connectTenantDB(req.params.slug);
    const roles = await tenantDb.collection("roles").find({}).toArray();
    res.json(roles);
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

module.exports = router;

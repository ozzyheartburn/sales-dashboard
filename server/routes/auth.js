// Auth routes — email + password login, user creation, admin seeding
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const {
  connectPlatformDB,
  connectTenantDB,
} = require("../config/db");
const { resolveIdentity } = require("../services/identity.service");
const { PLATFORM_ADMIN_EMAILS } = require("../auth-middleware");

// Helper: resolve user tenants, roles, and identity for login response
async function resolveLoginUser(normalizedEmail) {
  const isPlatformAdmin = PLATFORM_ADMIN_EMAILS.includes(normalizedEmail);

  const platformDb = await connectPlatformDB();
  const tenants = await platformDb
    .collection("tenants")
    .find({ status: "active" })
    .toArray();

  const availableRoles = [];
  const linked = [];
  let userName = null;
  let primaryTenant = null;

  for (const tenant of tenants) {
    const tenantDb = await connectTenantDB(tenant.databaseName);
    const user = await tenantDb
      .collection("users")
      .findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { lastLoginAt: new Date().toISOString() } },
        { returnDocument: "after" },
      );
    if (user) {
      linked.push(tenant.slug);
      if (!userName && user.name) userName = user.name;
      if (!primaryTenant && user.primaryTenant)
        primaryTenant = user.primaryTenant;
      availableRoles.push({
        tenant: tenant.slug,
        role: user.role || "end_user",
        teamName: user.teamName || null,
      });
    }
  }

  // Platform admins always get PG_Machine access
  if (isPlatformAdmin && !linked.includes("PG_Machine")) {
    linked.push("PG_Machine");
    availableRoles.push({
      tenant: "PG_Machine",
      role: "platform_admin",
      teamName: null,
    });
  }

  if (linked.length === 0) {
    return null;
  }

  const resolvedTenant = primaryTenant || linked[0] || "PG_Machine";
  const identity = await resolveIdentity(normalizedEmail);

  // Pick initial role (platform_admin takes priority, then first available)
  const adminRole = availableRoles.find((r) => r.role === "platform_admin");
  const initialRole = adminRole || availableRoles[0];

  return {
    email: normalizedEmail,
    name: userName || normalizedEmail.split("@")[0],
    picture: null,
    role: isPlatformAdmin ? "platform_admin" : initialRole.role,
    isPlatformAdmin,
    tenant: resolvedTenant,
    linkedTenants: linked,
    teamName: initialRole.teamName,
    availableRoles,
    customer_company_id: identity?.customer_company_id || null,
    customer_user_id: identity?.customer_user_id || null,
    customer_user_id_rbac: identity?.customer_user_id_rbac || null,
  };
}

// Login with email + password
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const platformDb = await connectPlatformDB();
    const authUser = await platformDb
      .collection("auth_users")
      .findOne({ email: normalizedEmail });

    if (!authUser) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, authUser.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update last login
    await platformDb
      .collection("auth_users")
      .updateOne(
        { email: normalizedEmail },
        { $set: { lastLoginAt: new Date().toISOString() } },
      );

    const userData = await resolveLoginUser(normalizedEmail);
    if (!userData) {
      return res.status(403).json({
        error: "No tenant found for this email. Ask an admin to invite you.",
      });
    }

    // Use name from auth_users if tenant didn't have one
    if (authUser.name && userData.name === normalizedEmail.split("@")[0]) {
      userData.name = authUser.name;
    }

    const credential = `session-${Date.now()}-${normalizedEmail}`;

    console.log(
      `Login: ${normalizedEmail} → tenants: ${userData.linkedTenants.join(", ")}, roles: ${userData.availableRoles.map((r) => `${r.role}@${r.tenant}`).join(", ")}`,
    );

    res.json({ success: true, user: userData, credential });
  } catch (err) {
    console.error("Error with login:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Create a new user (only platform admins can do this)
router.post("/create-user", async (req, res) => {
  try {
    const { email, password, name, role, tenant } = req.body;
    const creatorEmail = req.headers["x-user-email"];
    const creatorRole = req.headers["x-user-role"];

    // Only platform admins can create users
    if (
      !PLATFORM_ADMIN_EMAILS.includes(creatorEmail?.toLowerCase()) &&
      creatorRole !== "platform_admin"
    ) {
      return res
        .status(403)
        .json({ error: "Only platform admins can create users" });
    }

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Cannot create platform_admin accounts
    if (role === "platform_admin") {
      return res
        .status(403)
        .json({ error: "Cannot create platform admin accounts" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const platformDb = await connectPlatformDB();

    // Check if already exists
    const existing = await platformDb
      .collection("auth_users")
      .findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await platformDb.collection("auth_users").insertOne({
      email: normalizedEmail,
      passwordHash,
      name: name || normalizedEmail.split("@")[0],
      createdAt: new Date().toISOString(),
      createdBy: creatorEmail || "system",
    });

    // If tenant specified, also add user to that tenant's users collection
    if (tenant) {
      const tenantDb = await connectTenantDB(tenant);
      await tenantDb.collection("users").updateOne(
        { email: normalizedEmail },
        {
          $set: {
            email: normalizedEmail,
            name: name || normalizedEmail.split("@")[0],
            role: role || "end_user",
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true },
      );
    }

    console.log(
      `User created: ${normalizedEmail} (by ${creatorEmail || "system"})${tenant ? ` → tenant: ${tenant}, role: ${role || "end_user"}` : ""}`,
    );

    res.json({
      success: true,
      email: normalizedEmail,
      name: name || normalizedEmail.split("@")[0],
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Seed platform admin accounts (run once)
router.post("/seed-admins", async (req, res) => {
  try {
    const platformDb = await connectPlatformDB();
    const col = platformDb.collection("auth_users");

    await col.createIndex(
      { email: 1 },
      { unique: true, collation: { locale: "en", strength: 2 } },
    );

    const results = [];
    for (const adminEmail of PLATFORM_ADMIN_EMAILS) {
      const existing = await col.findOne({ email: adminEmail });
      if (existing) {
        results.push({ email: adminEmail, status: "already_exists" });
        continue;
      }

      const passwordHash = await bcrypt.hash("pilluharja1", 12);
      await col.insertOne({
        email: adminEmail,
        passwordHash,
        name: adminEmail.split("@")[0],
        isPlatformAdmin: true,
        createdAt: new Date().toISOString(),
        createdBy: "system-seed",
      });
      results.push({ email: adminEmail, status: "created" });
    }

    console.log("Admin seed results:", results);
    res.json({ success: true, results });
  } catch (err) {
    console.error("Error seeding admins:", err);
    res.status(500).json({ error: "Failed to seed admins" });
  }
});

module.exports = router;

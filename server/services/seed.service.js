// Startup seed service — initializes platform registry, users, roles, and identity
const bcrypt = require("bcryptjs");
const {
  ensureConnected,
  connectDB,
  connectTenantDB,
  connectPlatformDB,
  connectIdentityDB,
} = require("../config/db");
const { registerExistingTenant } = require("../provision-tenant");
const { PLATFORM_ADMIN_EMAILS } = require("../auth-middleware");

// Seed users + roles collections for a tenant database
async function seedUsersAndRoles(database, tenantSlug) {
  // Ensure users collection exists with indexes
  const usersCol = database.collection("users");
  try {
    // Drop legacy googleId unique index if it exists (causes duplicate key errors)
    try {
      await usersCol.dropIndex("googleId_1");
    } catch (_) {
      // Index may not exist — that's fine
    }
    await usersCol.createIndex(
      { email: 1 },
      { unique: true, collation: { locale: "en", strength: 2 } },
    );
  } catch (_) {
    // Indexes may already exist
  }

  // Ensure roles collection exists with indexes
  const rolesCol = database.collection("roles");
  try {
    await rolesCol.createIndex({ name: 1 }, { unique: true });
  } catch (_) {}

  // Seed default roles (4-tier hierarchy)
  const DEFAULT_ROLES = [
    {
      name: "platform_admin",
      description:
        "Super Admin / Platform Owner — full platform access across all tenants",
      permissions: [
        "accounts:read",
        "accounts:write",
        "accounts:delete",
        "research:run",
        "swarm:run",
        "org_chart:read",
        "org_chart:write",
        "intelligence:read",
        "intelligence:write",
        "sales_activities:read",
        "sales_activities:write",
        "users:read",
        "users:write",
        "users:invite",
        "tenant:manage",
        "tenant:provision",
        "platform:manage",
      ],
    },
    {
      name: "company_admin",
      description:
        "Company Admin — manage users and data within their own tenant",
      permissions: [
        "accounts:read",
        "accounts:write",
        "accounts:delete",
        "research:run",
        "swarm:run",
        "org_chart:read",
        "org_chart:write",
        "intelligence:read",
        "intelligence:write",
        "sales_activities:read",
        "sales_activities:write",
        "users:read",
        "users:write",
        "users:invite",
        "tenant:manage",
      ],
    },
    {
      name: "team_leader",
      description: "Team Leader — sees their team's data, run research",
      permissions: [
        "accounts:read",
        "accounts:write",
        "research:run",
        "swarm:run",
        "org_chart:read",
        "org_chart:write",
        "intelligence:read",
        "intelligence:write",
        "sales_activities:read",
        "sales_activities:write",
        "users:read",
      ],
    },
    {
      name: "end_user",
      description: "End User — sees only their own accounts",
      permissions: [
        "accounts:read",
        "org_chart:read",
        "intelligence:read",
        "sales_activities:read",
        "sales_activities:write",
      ],
    },
  ];

  for (const role of DEFAULT_ROLES) {
    await rolesCol.updateOne(
      { name: role.name },
      {
        $set: { ...role, updatedAt: new Date().toISOString() },
        $setOnInsert: { createdAt: new Date().toISOString() },
      },
      { upsert: true },
    );
  }

  // Seed platform admin users with their primary tenants
  const platformAdmins = [
    {
      email: "alimelkkilaoskari@gmail.com",
      name: "Oskari Ali-Melkkilä",
      primaryTenant: "PG_Machine",
    },
    {
      email: "samuli.melart@gmail.com",
      name: "Samuli Melart",
      primaryTenant: "6gnordic",
    },
  ];

  for (const admin of platformAdmins) {
    await usersCol.updateOne(
      { email: admin.email },
      {
        $set: {
          email: admin.email,
          name: admin.name,
          role: "platform_admin",
          tenantSlug,
          isPlatformAdmin: true,
          primaryTenant: admin.primaryTenant,
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true },
    );
  }

  console.log(`  ✅ Users & roles seeded for ${tenantSlug}`);
}

// Seed the pg_identity database with companies, users, and RBAC policies
async function seedIdentityDB() {
  const identityDb = await connectIdentityDB();
  const companiesCol = identityDb.collection("companies");
  const rbacCol = identityDb.collection("rbac_policies");

  // Create indexes
  try {
    await companiesCol.createIndex(
      { customer_company_id: 1 },
      { unique: true },
    );
    await companiesCol.createIndex({ slug: 1 }, { unique: true });
    await companiesCol.createIndex({ "users.email": 1 });
    await companiesCol.createIndex({ "users.customer_user_id": 1 });
    await rbacCol.createIndex({ customer_user_id_rbac: 1 }, { unique: true });
  } catch (_) {}

  // Seed RBAC policies
  const RBAC_POLICIES = [
    {
      customer_user_id_rbac: "platform_admin",
      description:
        "Full platform access — all tenants, all views, impersonation",
      permissions: ["*"],
      dataScope: "all",
      canImpersonate: true,
      canAccessAdmin: true,
    },
    {
      customer_user_id_rbac: "company_admin",
      description: "Full access within own company/tenant",
      permissions: [
        "accounts:*",
        "research:*",
        "swarm:*",
        "org_chart:*",
        "intelligence:*",
        "sales_activities:*",
        "users:*",
        "tenant:manage",
      ],
      dataScope: "company",
      canImpersonate: false,
      canAccessAdmin: true,
    },
    {
      customer_user_id_rbac: "team_leader",
      description: "Access to own team's data",
      permissions: [
        "accounts:read",
        "accounts:write",
        "research:run",
        "swarm:run",
        "org_chart:*",
        "intelligence:read",
        "sales_activities:*",
        "users:read",
      ],
      dataScope: "team",
      canImpersonate: false,
      canAccessAdmin: false,
    },
    {
      customer_user_id_rbac: "end_user",
      description: "Access to own assigned accounts only",
      permissions: [
        "accounts:read",
        "org_chart:read",
        "intelligence:read",
        "sales_activities:read",
        "sales_activities:write",
      ],
      dataScope: "self",
      canImpersonate: false,
      canAccessAdmin: false,
    },
  ];

  for (const policy of RBAC_POLICIES) {
    await rbacCol.updateOne(
      { customer_user_id_rbac: policy.customer_user_id_rbac },
      {
        $set: { ...policy, updatedAt: new Date().toISOString() },
        $setOnInsert: { createdAt: new Date().toISOString() },
      },
      { upsert: true },
    );
  }

  // Seed company: PG Machine / Constructor (Oskari's workspace)
  await companiesCol.updateOne(
    { customer_company_id: "comp_pg_machine" },
    {
      $set: {
        customer_company_id: "comp_pg_machine",
        companyName: "PG Machine / Constructor",
        slug: "PG_Machine",
        databaseName: "PG_Machine",
        status: "active",
        updatedAt: new Date().toISOString(),
      },
      $setOnInsert: {
        createdAt: new Date().toISOString(),
        users: [
          {
            customer_user_id: "usr_oskari",
            name: "Oskari Ali-Melkkilä",
            email: "alimelkkilaoskari@gmail.com",
            role: "platform_admin",
            department: "Master Admin",
            manager: null,
            backupEmail: "oskari.ali-melkkila@hotmail.com",
            customer_user_id_rbac: "platform_admin",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    },
    { upsert: true },
  );

  // Ensure Oskari user exists in PG_Machine company (even if doc already existed)
  await companiesCol.updateOne(
    {
      customer_company_id: "comp_pg_machine",
      "users.email": { $ne: "alimelkkilaoskari@gmail.com" },
    },
    {
      $push: {
        users: {
          customer_user_id: "usr_oskari",
          name: "Oskari Ali-Melkkilä",
          email: "alimelkkilaoskari@gmail.com",
          role: "platform_admin",
          department: "Master Admin",
          manager: null,
          backupEmail: "oskari.ali-melkkila@hotmail.com",
          customer_user_id_rbac: "platform_admin",
          createdAt: new Date().toISOString(),
        },
      },
    },
  );

  // Seed company: 6G Nordic (Samuli's workspace)
  await companiesCol.updateOne(
    { customer_company_id: "comp_6gnordic" },
    {
      $set: {
        customer_company_id: "comp_6gnordic",
        companyName: "6G Nordic",
        slug: "6gnordic",
        databaseName: "6gnordic",
        status: "active",
        updatedAt: new Date().toISOString(),
      },
      $setOnInsert: {
        createdAt: new Date().toISOString(),
        users: [
          {
            customer_user_id: "usr_samuli",
            name: "Samuli Melart",
            email: "samuli.melart@gmail.com",
            role: "platform_admin",
            department: "Master Admin",
            manager: null,
            backupEmail: "alimelkkilaoskari@gmail.com",
            customer_user_id_rbac: "platform_admin",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    },
    { upsert: true },
  );

  // Ensure Samuli user exists in 6G Nordic company
  await companiesCol.updateOne(
    {
      customer_company_id: "comp_6gnordic",
      "users.email": { $ne: "samuli.melart@gmail.com" },
    },
    {
      $push: {
        users: {
          customer_user_id: "usr_samuli",
          name: "Samuli Melart",
          email: "samuli.melart@gmail.com",
          role: "platform_admin",
          department: "Master Admin",
          manager: null,
          backupEmail: "alimelkkilaoskari@gmail.com",
          customer_user_id_rbac: "platform_admin",
          createdAt: new Date().toISOString(),
        },
      },
    },
  );

  console.log("  ✅ pg_identity database seeded (companies + RBAC policies)");
}

// Main startup initialization
async function initializePlatform() {
  try {
    await ensureConnected();
    await registerExistingTenant();
    console.log("Platform tenant registry initialized");

    // Seed PG_Machine with users + roles collections
    const pgDb = await connectDB();
    await seedUsersAndRoles(pgDb, "PG_Machine");
    console.log("PG_Machine users & roles initialized");

    // Seed pg_identity database
    await seedIdentityDB();
    console.log("pg_identity database initialized");
  } catch (err) {
    console.error("Failed to initialize platform registry:", err.message);
  }
}

module.exports = { initializePlatform };

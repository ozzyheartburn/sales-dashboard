// Provision a new tenant database with all required collections, indexes, and seed data
// Usage: node provision-tenant.js <tenant_slug> <display_name> [admin_email]
// Example: node provision-tenant.js 6G_Nordics "6G Nordics" admin@6gnordics.com

const { MongoClient, ServerApiVersion } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const COLLECTIONS = [
  "accounts",
  "users",
  "roles",
  "intelligence_documents",
  "sales_activities",
  "org_charts",
];

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

async function provisionTenant(tenantSlug, displayName, adminEmail) {
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    console.log(`\nProvisioning tenant: ${tenantSlug} ("${displayName}")\n`);

    // 1. Register tenant in platform database
    const platformDb = client.db("platform");
    const tenantsCollection = platformDb.collection("tenants");

    const existing = await tenantsCollection.findOne({ slug: tenantSlug });
    if (existing) {
      console.log(
        `  Tenant "${tenantSlug}" already exists in platform.tenants — updating...`,
      );
    }

    await tenantsCollection.updateOne(
      { slug: tenantSlug },
      {
        $set: {
          slug: tenantSlug,
          displayName,
          databaseName: tenantSlug,
          status: "active",
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true },
    );
    console.log(`  ✅ Registered in platform.tenants`);

    // 2. Create tenant database and collections
    const tenantDb = client.db(tenantSlug);

    for (const collName of COLLECTIONS) {
      try {
        await tenantDb.createCollection(collName);
        console.log(`  ✅ Created collection: ${collName}`);
      } catch (err) {
        if (err.codeName === "NamespaceExists") {
          console.log(`  ⏭️  Collection already exists: ${collName}`);
        } else {
          throw err;
        }
      }
    }

    // 3. Create indexes
    const accountsCol = tenantDb.collection("accounts");
    await accountsCol.createIndex(
      { companyName: 1 },
      { unique: true, collation: { locale: "en", strength: 2 } },
    );
    console.log(`  ✅ Index: accounts.companyName (unique, case-insensitive)`);

    const usersCol = tenantDb.collection("users");
    await usersCol.createIndex({ googleId: 1 }, { unique: true, sparse: true });
    await usersCol.createIndex(
      { email: 1 },
      { unique: true, collation: { locale: "en", strength: 2 } },
    );
    console.log(`  ✅ Index: users.googleId (unique)`);
    console.log(`  ✅ Index: users.email (unique, case-insensitive)`);

    const rolesCol = tenantDb.collection("roles");
    await rolesCol.createIndex({ name: 1 }, { unique: true });
    console.log(`  ✅ Index: roles.name (unique)`);

    const intelCol = tenantDb.collection("intelligence_documents");
    await intelCol.createIndex({ companyName: 1, docType: 1 });
    await intelCol.createIndex({ createdAt: -1 });
    console.log(`  ✅ Index: intelligence_documents.companyName+docType`);
    console.log(`  ✅ Index: intelligence_documents.createdAt`);

    const saCol = tenantDb.collection("sales_activities");
    await saCol.createIndex(
      { companyName: 1 },
      { collation: { locale: "en", strength: 2 } },
    );
    console.log(`  ✅ Index: sales_activities.companyName`);

    const orgCol = tenantDb.collection("org_charts");
    await orgCol.createIndex(
      { companyName: 1 },
      { unique: true, collation: { locale: "en", strength: 2 } },
    );
    console.log(`  ✅ Index: org_charts.companyName (unique)`);

    // 4. Seed default roles
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
    console.log(`  ✅ Seeded ${DEFAULT_ROLES.length} default roles`);

    // 5. Create admin user if email provided
    if (adminEmail) {
      await usersCol.updateOne(
        { email: adminEmail.toLowerCase() },
        {
          $set: {
            email: adminEmail.toLowerCase(),
            role: "company_admin",
            tenantSlug,
            updatedAt: new Date().toISOString(),
          },
          $setOnInsert: {
            googleId: null, // Will be linked on first login
            name: null,
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true },
      );
      console.log(`  ✅ Admin user pre-registered: ${adminEmail}`);
    }

    console.log(`\n🎉 Tenant "${displayName}" (${tenantSlug}) provisioned!\n`);
    console.log(`Database: ${tenantSlug}`);
    console.log(`Collections: ${COLLECTIONS.join(", ")}`);
    console.log(`Roles: platform_admin, company_admin, team_leader, end_user`);
    if (adminEmail) console.log(`Admin: ${adminEmail}\n`);
  } catch (err) {
    console.error("Provisioning failed:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Also register PG_Machine as a tenant if not already
async function registerExistingTenant() {
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    const platformDb = client.db("platform");
    const tenantsCollection = platformDb.collection("tenants");

    await tenantsCollection.updateOne(
      { slug: "PG_Machine" },
      {
        $set: {
          slug: "PG_Machine",
          displayName: "PG Machine",
          databaseName: "PG_Machine",
          status: "active",
          isLegacy: true,
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true },
    );
    console.log(
      "✅ PG_Machine registered as legacy tenant in platform.tenants",
    );
  } finally {
    await client.close();
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      'Usage: node provision-tenant.js <tenant_slug> <display_name> [admin_email]\nExample: node provision-tenant.js 6G_Nordics "6G Nordics" admin@6gnordics.com',
    );
    process.exit(1);
  }

  const [tenantSlug, displayName, adminEmail] = args;

  (async () => {
    await registerExistingTenant();
    await provisionTenant(tenantSlug, displayName, adminEmail || null);
  })();
}

module.exports = {
  provisionTenant,
  registerExistingTenant,
  COLLECTIONS,
  DEFAULT_ROLES,
};

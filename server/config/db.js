// Database connection management — single MongoClient shared across the app
const { MongoClient, ServerApiVersion } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
});

// Database connection cache (per-tenant)
const dbCache = new Map();
let connected = false;

async function ensureConnected() {
  if (!connected) {
    await client.connect();
    connected = true;
  }
}

// Legacy: connect to PG_Machine (backward compat for existing routes)
let db;
async function connectDB() {
  await ensureConnected();
  if (!db) {
    db = client.db("PG_Machine");
  }
  return db;
}

// Multi-tenant: connect to a specific tenant database
async function connectTenantDB(tenantSlug) {
  await ensureConnected();
  if (!dbCache.has(tenantSlug)) {
    dbCache.set(tenantSlug, client.db(tenantSlug));
  }
  return dbCache.get(tenantSlug);
}

// Connect to platform database
async function connectPlatformDB() {
  await ensureConnected();
  return client.db("platform");
}

// Connect to pg_identity database (central identity + RBAC)
async function connectIdentityDB() {
  await ensureConnected();
  return client.db("pg_identity");
}

module.exports = {
  client,
  ensureConnected,
  connectDB,
  connectTenantDB,
  connectPlatformDB,
  connectIdentityDB,
};

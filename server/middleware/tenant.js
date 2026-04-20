// Tenant resolution middleware — resolves tenant DB and attaches to request
const { connectPlatformDB, connectTenantDB } = require("../config/db");

async function attachTenantDB(req, res, next) {
  try {
    const tenantSlug =
      req.tenantSlug || req.headers["x-tenant"] || "PG_Machine";
    req.tenantSlug = tenantSlug;

    // Verify tenant exists in platform registry
    const platformDb = await connectPlatformDB();
    const tenant = await platformDb
      .collection("tenants")
      .findOne({ slug: tenantSlug, status: "active" });
    if (!tenant) {
      return res
        .status(404)
        .json({ error: `Tenant "${tenantSlug}" not found or inactive` });
    }

    req.tenantDb = await connectTenantDB(tenant.databaseName);
    req.tenantInfo = tenant;
    next();
  } catch (err) {
    console.error("Tenant resolution error:", err);
    res.status(500).json({ error: "Failed to resolve tenant" });
  }
}

module.exports = { attachTenantDB };

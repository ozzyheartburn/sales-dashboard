// Analytics routes — platform performance metrics
const { Router } = require("express");
const { connectTenantDB, connectPlatformDB, connectIdentityDB } = require("../config/db");

const router = Router();

// GET /api/analytics/platform — aggregated platform-wide metrics
router.get("/platform", async (req, res) => {
  try {
    const platformDb = await connectPlatformDB();
    const identityDb = await connectIdentityDB();

    // Get all tenants
    const tenants = await platformDb.collection("tenants").find({}).toArray();
    const companies = await identityDb.collection("companies").find({}).toArray();

    // Aggregate per-tenant metrics
    const tenantMetrics = [];
    let totalAccounts = 0;
    let totalUsers = 0;
    let totalActivities = 0;
    let totalWithSwarm = 0;
    let totalWithResearch = 0;
    let totalWithEmbeddings = 0;
    const priorityBreakdown = { high: 0, medium: 0, low: 0, unset: 0 };
    const buyingSignalBuckets = { hot: 0, warm: 0, cold: 0, unknown: 0 };
    const championReadiness = { high: 0, medium: 0, low: 0, none: 0 };
    const activityByType = {};
    const activityByOutcome = {};
    let assignedAccounts = 0;
    let unassignedAccounts = 0;

    for (const tenant of tenants) {
      try {
        const tenantDb = await connectTenantDB(tenant.slug);

        // Accounts
        const accounts = await tenantDb.collection("PG_Machine").find({}).toArray();
        const users = await tenantDb.collection("users").find({}).toArray();

        const tenantAccountCount = accounts.length;
        const tenantUserCount = users.length;
        totalAccounts += tenantAccountCount;
        totalUsers += tenantUserCount;

        let tenantSwarmCount = 0;
        let tenantResearchCount = 0;
        let tenantEmbeddingCount = 0;

        for (const acc of accounts) {
          // Priority
          const p = (acc.priority || "").toLowerCase();
          if (p === "high") priorityBreakdown.high++;
          else if (p === "medium") priorityBreakdown.medium++;
          else if (p === "low") priorityBreakdown.low++;
          else priorityBreakdown.unset++;

          // Buying signal score
          const bss = acc.buyingSignalScore;
          if (bss >= 70) buyingSignalBuckets.hot++;
          else if (bss >= 40) buyingSignalBuckets.warm++;
          else if (bss > 0) buyingSignalBuckets.cold++;
          else buyingSignalBuckets.unknown++;

          // Champion readiness
          const cr = (acc.champion_overall_readiness || "").toLowerCase();
          if (cr.includes("high") || cr.includes("strong")) championReadiness.high++;
          else if (cr.includes("medium") || cr.includes("moderate")) championReadiness.medium++;
          else if (cr.includes("low") || cr.includes("weak")) championReadiness.low++;
          else championReadiness.none++;

          // Swarm coverage
          if (acc.metadata?.lastSwarmRun || acc.agentResults) {
            tenantSwarmCount++;
            totalWithSwarm++;
          }

          // Research / embedding coverage
          if (acc.embedding) {
            tenantEmbeddingCount++;
            totalWithEmbeddings++;
          }
          if (acc.research_results || acc.researchStatus === "completed") {
            tenantResearchCount++;
            totalWithResearch++;
          }

          // Assigned
          if (acc.assignedTo) assignedAccounts++;
          else unassignedAccounts++;
        }

        // Sales activities
        const salesActivities = await tenantDb.collection("SalesActivities").find({}).toArray();
        let tenantActivityCount = 0;
        for (const sa of salesActivities) {
          const acts = sa.activities || [];
          tenantActivityCount += acts.length;
          for (const a of acts) {
            activityByType[a.type] = (activityByType[a.type] || 0) + 1;
            if (a.outcome) {
              activityByOutcome[a.outcome] = (activityByOutcome[a.outcome] || 0) + 1;
            }
          }
        }
        totalActivities += tenantActivityCount;

        tenantMetrics.push({
          slug: tenant.slug,
          displayName: tenant.displayName,
          status: tenant.status,
          createdAt: tenant.createdAt,
          accounts: tenantAccountCount,
          users: tenantUserCount,
          swarmRuns: tenantSwarmCount,
          researchRuns: tenantResearchCount,
          embeddingCoverage: tenantEmbeddingCount,
          salesActivities: tenantActivityCount,
        });
      } catch (err) {
        tenantMetrics.push({
          slug: tenant.slug,
          displayName: tenant.displayName,
          status: tenant.status,
          error: err.message,
        });
      }
    }

    res.json({
      summary: {
        totalTenants: tenants.length,
        totalCompanies: companies.length,
        totalAccounts,
        totalUsers,
        totalActivities,
        totalWithSwarm,
        totalWithResearch,
        totalWithEmbeddings,
        assignedAccounts,
        unassignedAccounts,
      },
      priorityBreakdown,
      buyingSignalBuckets,
      championReadiness,
      activityByType,
      activityByOutcome,
      tenantMetrics,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

module.exports = router;

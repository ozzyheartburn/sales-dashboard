// Simple Node.js Express server for backend operations
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const path = require("path");
const OpenAI = require("openai");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { buildAgentPrompt, buildSynthesisPrompt } = require("./agent-prompts");
const {
  verifyGoogleToken,
  resolveUserTenant,
  requireRole,
  PLATFORM_ADMIN_EMAILS,
} = require("./auth-middleware");
const {
  provisionTenant,
  registerExistingTenant,
} = require("./provision-tenant");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
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

// Default n8n webhook URL (PG_Machine / GTM Baltics)
const DEFAULT_N8N_WEBHOOK =
  "https://gtmbaltics.app.n8n.cloud/webhook/002eb43f-96f4-4046-86f3-d0129f19819d";

// Tenant workflow config cache (1-min TTL)
const workflowCache = new Map();
async function getTenantWorkflow(slug) {
  const cached = workflowCache.get(slug);
  if (cached && Date.now() - cached.ts < 60_000) return cached.data;
  const platformDb = await connectPlatformDB();
  const doc = await platformDb.collection("tenant_workflows").findOne({ slug });
  workflowCache.set(slug, { data: doc, ts: Date.now() });
  return doc;
}

// Connect to pg_identity database (central identity + RBAC)
async function connectIdentityDB() {
  await ensureConnected();
  return client.db("pg_identity");
}

// Middleware: resolve tenant DB and attach to request
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

// Auth middleware stack: Google token → resolve user tenant → attach DB
// Use this for protected routes
const authStack = [
  verifyGoogleToken,
  resolveUserTenant(connectPlatformDB, connectTenantDB),
  attachTenantDB,
];

// Light auth: just tenant header (for backward compat during migration)
const tenantOnly = [attachTenantDB];

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Get accounts from PG_Machine collection
// Supports role-based filtering via headers:
//   x-user-email, x-user-role, x-user-team, x-tenant
//   x-customer-company-id, x-customer-user-id-rbac (pg_identity cross-ref)
app.get("/api/accounts", async (req, res) => {
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
app.put("/api/accounts/:companyName/assign", async (req, res) => {
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

// Delete a single account by companyName
app.delete("/api/accounts/:companyName", async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);
    const tenantSlug = req.headers["x-tenant"] || "PG_Machine";

    let database;
    if (tenantSlug && tenantSlug !== "PG_Machine") {
      database = await connectTenantDB(tenantSlug);
    } else {
      database = await connectDB();
    }
    const collection = database.collection("PG_Machine");

    const result = await collection.deleteOne({
      companyName: { $regex: new RegExp(`^${companyName}$`, "i") },
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: `Account "${companyName}" not found` });
    }

    console.log(`Account "${companyName}" deleted`);
    res.json({ success: true, companyName });
  } catch (err) {
    console.error("Error deleting account:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// Bulk assign accounts to a user/team
app.post("/api/accounts/bulk-assign", async (req, res) => {
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

// In-memory tracking of pending research jobs
const pendingResearch = new Map();

// In-memory tracking of swarm jobs
const pendingSwarm = new Map();

// Helper: run agentic extra iterations — web-grounded research via GPT-4o
async function runAgenticExtraIterations(
  account,
  agentResults,
  perplexityResearch,
) {
  const companyName = account.companyName;
  const championNames = [];
  for (const tier of [
    account.champion_cxo_candidates,
    account.champion_vp_director_candidates,
    account.champion_enduser_candidates,
  ]) {
    if (Array.isArray(tier)) {
      tier.forEach((c) => {
        if (c.full_name) championNames.push(c.full_name);
      });
    }
  }
  // Also check fresh agent results for champion data
  const champAgent = agentResults?.["champion-building-agent"];
  if (champAgent?.output && typeof champAgent.output === "object") {
    const o = champAgent.output;
    for (const arr of [
      o.champion_cxo_candidates,
      o.champion_vp_director_candidates,
      o.champion_enduser_candidates,
    ]) {
      if (Array.isArray(arr)) {
        arr.forEach((c) => {
          if (c.full_name && !championNames.includes(c.full_name))
            championNames.push(c.full_name);
        });
      }
    }
  }

  // Build context from Perplexity research + agent outputs
  const contextParts = [`Company: ${companyName}`];
  if (perplexityResearch) {
    contextParts.push(
      `PERPLEXITY RESEARCH:\n${perplexityResearch.slice(0, 8000)}`,
    );
  }
  if (agentResults) {
    for (const [agentId, result] of Object.entries(agentResults)) {
      if (result.output && typeof result.output === "object") {
        contextParts.push(
          `AGENT ${agentId} OUTPUT:\n${JSON.stringify(result.output).slice(0, 3000)}`,
        );
      } else if (result.rawText) {
        contextParts.push(
          `AGENT ${agentId} OUTPUT:\n${result.rawText.slice(0, 3000)}`,
        );
      }
    }
  }
  const existingContext = contextParts.join("\n\n");

  const championSearchInstructions =
    championNames.length > 0
      ? `\n\nCHAMPION NAMES TO RESEARCH: ${championNames.join(", ")}\nFor each champion, search for their LinkedIn profile, social media presence (Facebook, Instagram, X/Twitter), recent public mentions, conference talks, blog posts, and professional interests.`
      : "";

  const response = await openai.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: [
      {
        role: "system",
        content:
          "You are a senior sales intelligence researcher. Your task is to find the LATEST public information about a company and its key people from the last 6 months. " +
          "Search for: press releases, news articles, product launches, funding rounds, partnerships, executive changes, earnings reports, conference presentations, and any other public media. " +
          "Also search for key champions/contacts at the company — their LinkedIn profiles, social media activity, professional interests, speaking engagements, and public opinions. " +
          "Use the existing research data provided as context to focus your web searches on gaps and recent developments. " +
          'Return a JSON object with this structure: { "company_news": [{ "title": ..., "date": ..., "source_url": ..., "summary": ... }], "champion_profiles": [{ "name": ..., "linkedin_url": ..., "social_profiles": [...], "recent_activity": ..., "interests": ..., "key_findings": ... }], "market_signals": [{ "signal": ..., "relevance": ..., "source_url": ... }], "summary": "<comprehensive 2-3 paragraph summary of all findings>" }',
      },
      {
        role: "user",
        content: `Research the latest 6 months of public information about ${companyName}. Here is existing research context:\n\n${existingContext}${championSearchInstructions}\n\nSearch the web thoroughly and return your findings as JSON.`,
      },
    ],
  });

  // Extract text from the response
  const outputText = response.output_text || "";

  // Try to parse JSON from the response
  let parsed = null;
  try {
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
  } catch (_) {
    // Keep raw text if JSON parsing fails
  }

  return {
    customerName: companyName,
    summary: parsed?.summary || outputText.slice(0, 5000),
    company_news: parsed?.company_news || [],
    champion_profiles: parsed?.champion_profiles || [],
    market_signals: parsed?.market_signals || [],
    championsResearched: championNames,
    rawResponse: outputText,
    model: "gpt-4o",
    tool: "web_search_preview",
    executedAt: new Date().toISOString(),
  };
}

// Run Agent Swarm: execute agents in parallel via GPT-4o, synthesize buying signal brief
// Access: platform_admin, company_admin, sales_leader only
app.post("/api/swarm/run", async (req, res) => {
  try {
    const callerEmail = (req.headers["x-user-email"] || "").toLowerCase();
    const callerRole = req.headers["x-user-role"] || "";
    const RESEARCH_ROLES = ["platform_admin", "company_admin", "sales_leader"];
    if (
      !PLATFORM_ADMIN_EMAILS.includes(callerEmail) &&
      !RESEARCH_ROLES.includes(callerRole)
    ) {
      return res
        .status(403)
        .json({ error: "Only sales leaders and above can run agent swarms" });
    }

    const { account_name, agents, template, instructions } = req.body;
    if (!account_name || !agents || agents.length === 0) {
      return res
        .status(400)
        .json({ error: "Missing account_name or agents in payload" });
    }

    console.log(
      `Swarm started for ${account_name} with ${agents.length} agents (template: ${template || "custom"})`,
    );

    const jobId = `${account_name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    pendingSwarm.set(jobId, {
      status: "running",
      startedAt: new Date().toISOString(),
      account_name,
      template,
      progress: { completed: 0, total: agents.length },
    });

    // Fire-and-forget: run swarm asynchronously
    (async () => {
      try {
        const database = await connectDB();
        const collection = database.collection("PG_Machine");

        // Load tenant workflow overrides
        const tenantSlug = req.headers["x-tenant"] || "PG_Machine";
        const workflow = await getTenantWorkflow(tenantSlug);
        const overrides = workflow
          ? {
              agent_prompt_overrides: workflow.agent_prompt_overrides,
              template_injection_overrides:
                workflow.template_injection_overrides,
              synthesis_overrides: workflow.synthesis_overrides,
            }
          : undefined;

        // Fetch existing account data for context
        const account = await collection.findOne({
          companyName: { $regex: new RegExp(`^${account_name}$`, "i") },
        });

        if (!account) {
          pendingSwarm.set(jobId, {
            status: "failed",
            error: `Account "${account_name}" not found in database`,
            account_name,
            template,
          });
          return;
        }

        // Build account context for prompt builder (full Perplexity research as dedicated source)
        const fullPerplexity = account.reports?.perplexityResearch || "";
        const accountContext = {
          companyName: account.companyName,
          website: account.website || "Unknown",
          industry: account.industry || "Nordic ecommerce",
          knownStack: account.techStack || "Unknown — research required",
          perplexityResearch: fullPerplexity.slice(0, 15000),
          notes:
            [
              account.rationale,
              account.reports?.chatGptAnalysis?.slice(0, 4000),
              fullPerplexity.slice(0, 8000),
            ]
              .filter(Boolean)
              .join("\n\n") || "None",
        };

        // Run all agents in parallel via GPT-4o
        const agentResults = {};
        const agentPromises = agents.map(async (agentId) => {
          try {
            const prompt = buildAgentPrompt(
              agentId,
              template || null,
              accountContext,
              overrides,
            );

            const completion = await openai.chat.completions.create({
              model: "gpt-4o",
              temperature: 0.3,
              messages: [
                { role: "system", content: prompt },
                {
                  role: "user",
                  content: instructions
                    ? `Analyse ${account.companyName}. Additional instructions: ${instructions}`
                    : `Analyse ${account.companyName}. Return your findings in the JSON output format specified in your instructions.`,
                },
              ],
            });

            const raw = completion.choices[0]?.message?.content || "";

            // Try to parse JSON from the response
            let parsed = null;
            try {
              const jsonMatch = raw.match(/\{[\s\S]*\}/);
              if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
            } catch (_) {
              // Keep raw text if JSON parsing fails
            }

            agentResults[agentId] = {
              output: parsed || raw,
              rawText: raw,
              model: "gpt-4o",
              executedAt: new Date().toISOString(),
            };

            // Update progress
            const job = pendingSwarm.get(jobId);
            if (job?.progress) job.progress.completed++;

            console.log(
              `  Agent ${agentId} completed for ${account.companyName}`,
            );
          } catch (agentErr) {
            console.error(
              `  Agent ${agentId} failed for ${account.companyName}:`,
              agentErr.message,
            );
            agentResults[agentId] = {
              error: agentErr.message,
              executedAt: new Date().toISOString(),
            };
          }
        });

        await Promise.all(agentPromises);

        // Run synthesis if a template is provided
        let synthesisBrief = null;
        if (template) {
          try {
            const agentOutputs = {};
            for (const [id, result] of Object.entries(agentResults)) {
              agentOutputs[id] = result.output || result.error;
            }
            const synthesisPrompt = buildSynthesisPrompt(
              template,
              accountContext,
              agentOutputs,
              overrides,
            );

            const synthCompletion = await openai.chat.completions.create({
              model: "gpt-4o",
              temperature: 0.3,
              messages: [
                { role: "system", content: synthesisPrompt },
                {
                  role: "user",
                  content: "Generate the buying signal brief now.",
                },
              ],
            });

            synthesisBrief =
              synthCompletion.choices[0]?.message?.content || null;
            console.log(
              `  Synthesis completed for ${account.companyName} (template: ${template})`,
            );
          } catch (synthErr) {
            console.error(
              `  Synthesis failed for ${account.companyName}:`,
              synthErr.message,
            );
            synthesisBrief = `Synthesis failed: ${synthErr.message}`;
          }
        }

        // Store results to MongoDB
        const updateFields = {
          "metadata.lastSwarmRun": new Date().toISOString(),
        };

        // Store individual agent results
        for (const [agentId, result] of Object.entries(agentResults)) {
          updateFields[`agentResults.${agentId}`] = result;
        }

        // Extract champion tier fields to distinct top-level fields
        const championResult = agentResults["champion-building-agent"];
        if (
          championResult?.output &&
          typeof championResult.output === "object"
        ) {
          const o = championResult.output;
          if (o.champion_cxo_candidates)
            updateFields.champion_cxo_candidates = o.champion_cxo_candidates;
          if (o.champion_vp_director_candidates)
            updateFields.champion_vp_director_candidates =
              o.champion_vp_director_candidates;
          if (o.champion_enduser_candidates)
            updateFields.champion_enduser_candidates =
              o.champion_enduser_candidates;
          if (o.detractors) updateFields.detractors = o.detractors;
          if (o.primary_champion_recommendation)
            updateFields.primary_champion_recommendation =
              o.primary_champion_recommendation;
          if (o.overall_readiness)
            updateFields.champion_overall_readiness = o.overall_readiness;

          // Build champion text for vector embedding
          const champParts = [`Champion Map for ${account.companyName}`];
          const addCandidates = (label, arr) => {
            if (Array.isArray(arr) && arr.length > 0) {
              champParts.push(
                `${label}: ${arr.map((c) => `${c.full_name} (${c.title_role}) — ${c.pain_hypothesis || c.reason_for_resistance || ""}`).join("; ")}`,
              );
            }
          };
          addCandidates("CXO Candidates", o.champion_cxo_candidates);
          addCandidates(
            "VP/Director Candidates",
            o.champion_vp_director_candidates,
          );
          addCandidates("End-User Candidates", o.champion_enduser_candidates);
          addCandidates("Detractors", o.detractors);
          if (o.why_framework)
            champParts.push(
              `Why now: ${o.why_framework.why_now || ""} | Why us: ${o.why_framework.why_us || ""}`,
            );
          if (o.primary_champion_recommendation)
            champParts.push(
              `Primary champion: ${o.primary_champion_recommendation}`,
            );
          const champText = champParts.join("\n");

          // Generate embedding for champion data
          try {
            const embResp = await openai.embeddings.create({
              model: "text-embedding-3-small",
              input: champText.slice(0, 30000),
            });
            updateFields.championEmbedding = embResp.data[0].embedding;
            updateFields.championEmbeddedAt = new Date().toISOString();
          } catch (embErr) {
            console.error(
              `Champion embedding failed for ${account.companyName}:`,
              embErr.message,
            );
          }
        }

        // Store synthesis brief
        if (template && synthesisBrief) {
          updateFields[`swarmBriefs.${template}`] = {
            brief: synthesisBrief,
            template,
            agentsUsed: agents,
            executedAt: new Date().toISOString(),
          };
          updateFields["swarmBriefs.latest"] = {
            brief: synthesisBrief,
            template,
            agentsUsed: agents,
            executedAt: new Date().toISOString(),
          };
        }

        // Run agentic extra iterations — web-grounded research
        let xtraIterations = null;
        try {
          console.log(
            `  Running agentic extra iterations for ${account.companyName}...`,
          );
          xtraIterations = await runAgenticExtraIterations(
            account,
            agentResults,
            account.reports?.perplexityResearch,
          );
          updateFields["agentic-xtra-iterations"] = xtraIterations;
          console.log(
            `  Extra iterations completed for ${account.companyName}`,
          );
        } catch (xtraErr) {
          console.error(
            `  Extra iterations failed for ${account.companyName}:`,
            xtraErr.message,
          );
          updateFields["agentic-xtra-iterations"] = {
            customerName: account.companyName,
            summary: `Extra iterations failed: ${xtraErr.message}`,
            error: xtraErr.message,
            executedAt: new Date().toISOString(),
          };
        }

        await collection.updateOne(
          { companyName: { $regex: new RegExp(`^${account_name}$`, "i") } },
          { $set: updateFields },
          { upsert: false },
        );

        pendingSwarm.set(jobId, {
          status: "completed",
          completedAt: new Date().toISOString(),
          account_name,
          template,
          agentCount: agents.length,
          successCount: Object.values(agentResults).filter((r) => !r.error)
            .length,
        });

        console.log(
          `Swarm completed for ${account_name} — ${agents.length} agents + extra iterations, results stored to MongoDB`,
        );
      } catch (err) {
        console.error(`Swarm failed for ${account_name}:`, err.message);
        pendingSwarm.set(jobId, {
          status: "failed",
          error: err.message,
          account_name,
          template,
        });
      }
    })();

    res.json({
      success: true,
      jobId,
      message: `Swarm with ${agents.length} agents started for "${account_name}". GPT-4o will analyse the account and store results upon completion.`,
    });
  } catch (err) {
    console.error("Error starting swarm:", err);
    res.status(500).json({ error: "Failed to start swarm" });
  }
});

// Run agents on ALL accounts (batch mode, sequential to avoid rate limits)
// Access: platform_admin, company_admin, sales_leader only
app.post("/api/swarm/run-all", async (req, res) => {
  try {
    const callerEmail = (req.headers["x-user-email"] || "").toLowerCase();
    const callerRole = req.headers["x-user-role"] || "";
    const RESEARCH_ROLES = ["platform_admin", "company_admin", "sales_leader"];
    if (
      !PLATFORM_ADMIN_EMAILS.includes(callerEmail) &&
      !RESEARCH_ROLES.includes(callerRole)
    ) {
      return res
        .status(403)
        .json({ error: "Only sales leaders and above can run batch swarms" });
    }

    const {
      agents,
      template,
      instructions,
      concurrency = 2,
      account_names,
    } = req.body;
    if (!agents || agents.length === 0) {
      return res.status(400).json({ error: "Missing agents in payload" });
    }

    const safeConcurrency = Math.min(
      Math.max(parseInt(concurrency, 10) || 2, 1),
      5,
    );

    const database = await connectDB();
    const collection = database.collection("PG_Machine");

    // If specific account_names provided, use those; otherwise fetch all
    let accountNames;
    if (Array.isArray(account_names) && account_names.length > 0) {
      accountNames = account_names;
    } else {
      const accounts = await collection
        .find({ companyName: { $ne: null } })
        .project({ companyName: 1 })
        .toArray();
      if (accounts.length === 0) {
        return res.status(404).json({ error: "No accounts found in database" });
      }
      accountNames = accounts.map((a) => a.companyName);
    }

    const jobId = `batch-${Date.now()}`;

    pendingSwarm.set(jobId, {
      status: "running",
      startedAt: new Date().toISOString(),
      template,
      agents,
      progress: { completed: 0, failed: 0, total: accountNames.length },
      results: {},
    });

    console.log(
      `Batch swarm started: ${agents.length} agents × ${accountNames.length} accounts (concurrency: ${safeConcurrency})`,
    );

    // Fire-and-forget: process accounts with controlled concurrency
    (async () => {
      const queue = [...accountNames];

      const worker = async () => {
        while (queue.length > 0) {
          const accountName = queue.shift();
          if (!accountName) break;

          const job = pendingSwarm.get(jobId);
          if (!job) break; // job was cleared

          try {
            // Use internal fetch to reuse the /api/swarm/run logic
            const account = await collection.findOne({
              companyName: { $regex: new RegExp(`^${accountName}$`, "i") },
            });

            if (!account) {
              job.results[accountName] = {
                status: "skipped",
                reason: "not found",
              };
              job.progress.failed++;
              continue;
            }

            const fullPerplexity = account.reports?.perplexityResearch || "";
            const accountContext = {
              companyName: account.companyName,
              website: account.website || "Unknown",
              industry: account.industry || "Nordic ecommerce",
              knownStack: account.techStack || "Unknown — research required",
              perplexityResearch: fullPerplexity.slice(0, 15000),
              notes:
                [
                  account.rationale,
                  account.reports?.chatGptAnalysis?.slice(0, 4000),
                  fullPerplexity.slice(0, 8000),
                ]
                  .filter(Boolean)
                  .join("\n\n") || "None",
            };

            // Run agents in parallel for this account
            const agentResults = {};
            const agentPromises = agents.map(async (agentId) => {
              try {
                const prompt = buildAgentPrompt(
                  agentId,
                  template || null,
                  accountContext,
                );

                const completion = await openai.chat.completions.create({
                  model: "gpt-4o",
                  temperature: 0.3,
                  messages: [
                    { role: "system", content: prompt },
                    {
                      role: "user",
                      content: instructions
                        ? `Analyse ${account.companyName}. Additional instructions: ${instructions}`
                        : `Analyse ${account.companyName}. Return your findings in the JSON output format specified in your instructions.`,
                    },
                  ],
                });

                const raw = completion.choices[0]?.message?.content || "";
                let parsed = null;
                try {
                  const jsonMatch = raw.match(/\{[\s\S]*\}/);
                  if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
                } catch (_) {}

                agentResults[agentId] = {
                  output: parsed || raw,
                  rawText: raw,
                  model: "gpt-4o",
                  executedAt: new Date().toISOString(),
                };
              } catch (agentErr) {
                agentResults[agentId] = {
                  error: agentErr.message,
                  executedAt: new Date().toISOString(),
                };
              }
            });

            await Promise.all(agentPromises);

            // Run synthesis if template provided
            let synthesisBrief = null;
            if (template) {
              try {
                const agentOutputs = {};
                for (const [id, result] of Object.entries(agentResults)) {
                  agentOutputs[id] = result.output || result.error;
                }
                const synthesisPrompt = buildSynthesisPrompt(
                  template,
                  accountContext,
                  agentOutputs,
                );
                const synthCompletion = await openai.chat.completions.create({
                  model: "gpt-4o",
                  temperature: 0.3,
                  messages: [
                    { role: "system", content: synthesisPrompt },
                    {
                      role: "user",
                      content: "Generate the buying signal brief now.",
                    },
                  ],
                });
                synthesisBrief =
                  synthCompletion.choices[0]?.message?.content || null;
              } catch (synthErr) {
                synthesisBrief = `Synthesis failed: ${synthErr.message}`;
              }
            }

            // Store results to MongoDB
            const updateFields = {
              "metadata.lastSwarmRun": new Date().toISOString(),
            };
            for (const [agentId, result] of Object.entries(agentResults)) {
              updateFields[`agentResults.${agentId}`] = result;
            }

            // Extract champion tier fields to distinct top-level fields
            const championResult = agentResults["champion-building-agent"];
            if (
              championResult?.output &&
              typeof championResult.output === "object"
            ) {
              const o = championResult.output;
              if (o.champion_cxo_candidates)
                updateFields.champion_cxo_candidates =
                  o.champion_cxo_candidates;
              if (o.champion_vp_director_candidates)
                updateFields.champion_vp_director_candidates =
                  o.champion_vp_director_candidates;
              if (o.champion_enduser_candidates)
                updateFields.champion_enduser_candidates =
                  o.champion_enduser_candidates;
              if (o.detractors) updateFields.detractors = o.detractors;
              if (o.primary_champion_recommendation)
                updateFields.primary_champion_recommendation =
                  o.primary_champion_recommendation;
              if (o.overall_readiness)
                updateFields.champion_overall_readiness = o.overall_readiness;

              // Build champion text for vector embedding
              const champParts = [`Champion Map for ${account.companyName}`];
              const addCandidates = (label, arr) => {
                if (Array.isArray(arr) && arr.length > 0) {
                  champParts.push(
                    `${label}: ${arr.map((c) => `${c.full_name} (${c.title_role}) — ${c.pain_hypothesis || c.reason_for_resistance || ""}`).join("; ")}`,
                  );
                }
              };
              addCandidates("CXO Candidates", o.champion_cxo_candidates);
              addCandidates(
                "VP/Director Candidates",
                o.champion_vp_director_candidates,
              );
              addCandidates(
                "End-User Candidates",
                o.champion_enduser_candidates,
              );
              addCandidates("Detractors", o.detractors);
              if (o.why_framework)
                champParts.push(
                  `Why now: ${o.why_framework.why_now || ""} | Why us: ${o.why_framework.why_us || ""}`,
                );
              if (o.primary_champion_recommendation)
                champParts.push(
                  `Primary champion: ${o.primary_champion_recommendation}`,
                );
              const champText = champParts.join("\n");

              try {
                const embResp = await openai.embeddings.create({
                  model: "text-embedding-3-small",
                  input: champText.slice(0, 30000),
                });
                updateFields.championEmbedding = embResp.data[0].embedding;
                updateFields.championEmbeddedAt = new Date().toISOString();
              } catch (embErr) {
                console.error(
                  `Champion embedding failed for ${account.companyName}:`,
                  embErr.message,
                );
              }
            }

            if (template && synthesisBrief) {
              updateFields[`swarmBriefs.${template}`] = {
                brief: synthesisBrief,
                template,
                agentsUsed: agents,
                executedAt: new Date().toISOString(),
              };
              updateFields["swarmBriefs.latest"] = {
                brief: synthesisBrief,
                template,
                agentsUsed: agents,
                executedAt: new Date().toISOString(),
              };
            }

            // Run agentic extra iterations — web-grounded research
            try {
              console.log(
                `  Running agentic extra iterations for ${account.companyName}...`,
              );
              const xtraIterations = await runAgenticExtraIterations(
                account,
                agentResults,
                account.reports?.perplexityResearch,
              );
              updateFields["agentic-xtra-iterations"] = xtraIterations;
              console.log(
                `  Extra iterations completed for ${account.companyName}`,
              );
            } catch (xtraErr) {
              console.error(
                `  Extra iterations failed for ${account.companyName}:`,
                xtraErr.message,
              );
              updateFields["agentic-xtra-iterations"] = {
                customerName: account.companyName,
                summary: `Extra iterations failed: ${xtraErr.message}`,
                error: xtraErr.message,
                executedAt: new Date().toISOString(),
              };
            }

            await collection.updateOne(
              { companyName: account.companyName },
              { $set: updateFields },
            );

            job.results[accountName] = {
              status: "completed",
              agents: Object.keys(agentResults),
            };
            job.progress.completed++;
            console.log(
              `  Batch [${job.progress.completed + job.progress.failed}/${job.progress.total}] ${accountName} — done`,
            );
          } catch (accErr) {
            console.error(`  Batch failed for ${accountName}:`, accErr.message);
            job.results[accountName] = {
              status: "failed",
              error: accErr.message,
            };
            job.progress.failed++;
          }
        }
      };

      // Launch workers
      const workers = Array.from({ length: safeConcurrency }, () => worker());
      await Promise.all(workers);

      const job = pendingSwarm.get(jobId);
      if (job) {
        job.status = "completed";
        job.completedAt = new Date().toISOString();
        console.log(
          `Batch swarm completed: ${job.progress.completed} succeeded, ${job.progress.failed} failed out of ${job.progress.total}`,
        );
      }
    })();

    res.json({
      success: true,
      jobId,
      accountCount: accountNames.length,
      agents,
      template: template || null,
      message: `Batch swarm started: ${agents.length} agent(s) × ${accountNames.length} accounts. Use GET /api/swarm/status/${jobId} to track progress.`,
    });
  } catch (err) {
    console.error("Error starting batch swarm:", err);
    res.status(500).json({ error: "Failed to start batch swarm" });
  }
});

// Check swarm job status
app.get("/api/swarm/status/:jobId", (req, res) => {
  const job = pendingSwarm.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }
  res.json(job);
});

// Save org chart (nodes + edges) for an account
app.post("/api/org-chart/save", async (req, res) => {
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
app.get("/api/org-chart/:accountName", async (req, res) => {
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

// Initiate research: fire-and-forget to n8n, return immediately
// Access: platform_admin, company_admin, sales_leader only
app.post("/api/research", async (req, res) => {
  try {
    const callerEmail = (req.headers["x-user-email"] || "").toLowerCase();
    const callerRole = req.headers["x-user-role"] || "";
    const RESEARCH_ROLES = ["platform_admin", "company_admin", "sales_leader"];
    if (
      !PLATFORM_ADMIN_EMAILS.includes(callerEmail) &&
      !RESEARCH_ROLES.includes(callerRole)
    ) {
      return res
        .status(403)
        .json({ error: "Only sales leaders and above can trigger research" });
    }

    const { account_name, website_url, tenant } = req.body;
    if (!account_name) {
      return res.status(400).json({ error: "Missing account_name in payload" });
    }

    const tenantSlug = tenant || req.headers["x-tenant"] || "PG_Machine";
    console.log(
      `Research started for ${account_name} (tenant: ${tenantSlug}, async)...`,
    );

    // Track this research as pending (include tenant for later lookup)
    pendingResearch.set(account_name.toLowerCase(), {
      status: "pending",
      startedAt: new Date().toISOString(),
      tenant: tenantSlug,
    });

    // Fire-and-forget: call n8n webhook — no DB dependency before this point
    const n8nUrl = DEFAULT_N8N_WEBHOOK;
    fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_name, website_url, tenant: tenantSlug }),
    })
      .then(() =>
        console.log(
          `n8n webhook fired for ${account_name} (tenant: ${tenantSlug})`,
        ),
      )
      .catch((err) =>
        console.error(
          `n8n webhook fire failed for ${account_name}:`,
          err.message,
        ),
      );

    res.json({
      success: true,
      message: `Research for "${account_name}" has been started. n8n will call back when done.`,
      tenant: tenantSlug,
    });
  } catch (err) {
    console.error("Error initiating research:", err);
    res.status(500).json({ error: "Failed to initiate research" });
  }
});

// Callback endpoint: n8n posts the finished research result here
app.post("/api/research/save", async (req, res) => {
  try {
    const rawData = req.body;
    const researchData = Array.isArray(rawData) ? rawData[0] : rawData;

    const companyName = researchData?.companyName;

    if (!researchData || !companyName) {
      console.error(
        "n8n callback missing companyName:",
        Object.keys(researchData || {}),
      );
      return res.status(400).json({ error: "Missing companyName in payload" });
    }

    console.log(`n8n callback received for ${companyName}`);

    // Normalize: ensure companyName is set in the data
    researchData.companyName = companyName;

    // Save to legacy MongoDB only (temporary): always write to PG_Machine DB
    const database = await connectDB();
    const collection = database.collection("PG_Machine");
    // Remove tenant field from stored data to keep it clean
    delete researchData.tenant;
    const result = await collection.updateOne(
      { companyName },
      {
        $set: {
          ...researchData,
          timestamp: researchData.timestamp || new Date().toISOString(),
        },
      },
      { upsert: true },
    );

    console.log(
      `Research saved for ${companyName}:`,
      result.upsertedId ? "inserted" : "updated",
    );

    // Auto-generate vector embedding for the new document
    try {
      const parts = [];
      if (companyName) parts.push(`Company: ${companyName}`);
      if (researchData.website) parts.push(`Website: ${researchData.website}`);
      if (researchData.rationale)
        parts.push(`Rationale: ${researchData.rationale}`);
      if (researchData.reports?.chatGptAnalysis) {
        parts.push(
          `ChatGPT Analysis:\n${researchData.reports.chatGptAnalysis}`,
        );
      }
      if (researchData.reports?.perplexityResearch) {
        parts.push(
          `Perplexity Research:\n${researchData.reports.perplexityResearch}`,
        );
      }
      if (researchData.insights) {
        for (const [category, items] of Object.entries(researchData.insights)) {
          if (Array.isArray(items) && items.length > 0) {
            const summaries = items
              .map((item) => `${item.title}: ${item.description}`)
              .join("\n");
            parts.push(`${category}:\n${summaries}`);
          }
        }
      }
      const textForEmbedding = parts.join("\n\n").slice(0, 30000);

      if (textForEmbedding.length > 50) {
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: textForEmbedding,
        });
        await collection.updateOne(
          { companyName },
          {
            $set: {
              embedding: embeddingResponse.data[0].embedding,
              embeddingModel: "text-embedding-3-small",
              embeddedAt: new Date().toISOString(),
            },
          },
        );
        console.log(`Embedding generated for ${companyName}`);
      }
    } catch (embErr) {
      console.error(`Embedding failed for ${companyName}:`, embErr.message);
    }

    // Update pending status
    pendingResearch.set(companyName.toLowerCase(), {
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      companyName,
      upserted: !!result.upsertedId,
    });
  } catch (err) {
    console.error("Error saving research callback:", err);
    res.status(500).json({ error: "Failed to save research data" });
  }
});

// Check research status for an account
app.get("/api/research/status/:account", async (req, res) => {
  const account = req.params.account.toLowerCase();
  const pending = pendingResearch.get(account);

  if (pending && pending.status === "completed") {
    pendingResearch.delete(account);
    return res.json({ status: "completed" });
  }

  if (pending && pending.status === "pending") {
    return res.json({ status: "pending", startedAt: pending.startedAt });
  }

  // Check if account exists in DB already
  try {
    const tenantSlug =
      pending?.tenant || req.headers["x-tenant"] || "PG_Machine";
    let database;
    if (tenantSlug && tenantSlug !== "PG_Machine") {
      database = await connectTenantDB(tenantSlug);
    } else {
      database = await connectDB();
    }
    const collection = database.collection("PG_Machine");
    const exists = await collection.findOne(
      { companyName: { $regex: new RegExp(`^${account}$`, "i") } },
      { projection: { _id: 1 } },
    );
    if (exists) {
      return res.json({ status: "completed" });
    }
  } catch (err) {
    console.error("Error checking research status:", err);
  }

  res.json({ status: "unknown" });
});

// Vector Search + LLM reasoning endpoint
app.post("/api/vector-search", async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ error: "Missing or empty query" });
    }

    const sanitizedTopK = Math.min(Math.max(parseInt(topK, 10) || 5, 1), 20);

    // 1. Embed the query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query.trim(),
    });
    const queryVector = embeddingResponse.data[0].embedding;

    // 2. Run $vectorSearch aggregation against Atlas
    const database = await connectDB();
    const collection = database.collection("PG_Machine");

    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector,
            numCandidates: sanitizedTopK * 10,
            limit: sanitizedTopK,
          },
        },
        {
          $project: {
            _id: 1,
            companyName: 1,
            website: 1,
            buyingSignalScore: 1,
            priority: 1,
            rationale: 1,
            "reports.chatGptAnalysis": 1,
            "reports.perplexityResearch": 1,
            insights: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    if (results.length === 0) {
      return res.json({
        answer:
          "No matching documents found. Make sure embeddings have been generated (run `node embed-documents.js`).",
        sources: [],
      });
    }

    // 3. Build context from top results for GPT-4o
    const context = results
      .map((doc, i) => {
        const parts = [`[Source ${i + 1}: ${doc.companyName || "Unknown"}]`];
        if (doc.rationale) parts.push(`Rationale: ${doc.rationale}`);
        if (doc.reports?.chatGptAnalysis) {
          parts.push(
            `ChatGPT Analysis:\n${doc.reports.chatGptAnalysis.slice(0, 3000)}`,
          );
        }
        if (doc.reports?.perplexityResearch) {
          parts.push(
            `Perplexity Research:\n${doc.reports.perplexityResearch.slice(0, 3000)}`,
          );
        }
        return parts.join("\n");
      })
      .join("\n\n---\n\n");

    // 4. Reason with GPT-4o
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a senior sales intelligence analyst. You have access to research dossiers on enterprise ecommerce companies. " +
            "Answer the user's question based ONLY on the provided source documents. " +
            "Cite sources by company name. If the sources don't contain enough information, say so. " +
            "Be concise, analytical, and actionable.",
        },
        {
          role: "user",
          content: `Question: ${query.trim()}\n\n--- SOURCE DOCUMENTS ---\n\n${context}`,
        },
      ],
    });

    const answer =
      completion.choices[0]?.message?.content || "No response generated.";

    res.json({
      answer,
      sources: results.map((doc) => ({
        companyName: doc.companyName,
        website: doc.website,
        score: doc.score,
        buyingSignalScore: doc.buyingSignalScore,
        priority: doc.priority,
      })),
      model: "gpt-4o",
      embeddingModel: "text-embedding-3-small",
    });
  } catch (err) {
    console.error("Vector search error:", err);
    res.status(500).json({ error: "Vector search failed: " + err.message });
  }
});

// Hybrid search: combines full-text + vector search with reciprocal rank fusion
app.post("/api/hybrid-search", async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ error: "Missing or empty query" });
    }

    const sanitizedTopK = Math.min(Math.max(parseInt(topK, 10) || 5, 1), 20);
    const trimmedQuery = query.trim();

    // 1. Embed the query for vector search
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: trimmedQuery,
    });
    const queryVector = embeddingResponse.data[0].embedding;

    const database = await connectDB();
    const collection = database.collection("PG_Machine");

    // 2. Run vector search
    const vectorResults = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector,
            numCandidates: sanitizedTopK * 10,
            limit: sanitizedTopK,
          },
        },
        {
          $addFields: { vsScore: { $meta: "vectorSearchScore" } },
        },
        {
          $project: {
            _id: 1,
            companyName: 1,
            website: 1,
            buyingSignalScore: 1,
            priority: 1,
            rationale: 1,
            "reports.chatGptAnalysis": 1,
            "reports.perplexityResearch": 1,
            insights: 1,
            vsScore: 1,
          },
        },
      ])
      .toArray();

    // 3. Run full-text search (if index exists; fallback gracefully)
    let ftResults = [];
    try {
      ftResults = await collection
        .aggregate([
          {
            $search: {
              index: "fulltext_index",
              text: {
                query: trimmedQuery,
                path: [
                  "companyName",
                  "rationale",
                  "reports.chatGptAnalysis",
                  "reports.perplexityResearch",
                ],
                fuzzy: { maxEdits: 1 },
              },
            },
          },
          { $limit: sanitizedTopK },
          {
            $addFields: { ftScore: { $meta: "searchScore" } },
          },
          {
            $project: {
              _id: 1,
              companyName: 1,
              website: 1,
              buyingSignalScore: 1,
              priority: 1,
              rationale: 1,
              "reports.chatGptAnalysis": 1,
              "reports.perplexityResearch": 1,
              insights: 1,
              ftScore: 1,
            },
          },
        ])
        .toArray();
    } catch (ftErr) {
      console.warn(
        "Full-text search skipped (index may not exist):",
        ftErr.message,
      );
    }

    // 4. Reciprocal Rank Fusion (RRF) to merge results
    const k = 60; // RRF constant
    const scoreMap = new Map();

    vectorResults.forEach((doc, rank) => {
      const id = doc._id.toString();
      if (!scoreMap.has(id)) scoreMap.set(id, { doc, rrfScore: 0 });
      scoreMap.get(id).rrfScore += 1 / (k + rank + 1);
    });

    ftResults.forEach((doc, rank) => {
      const id = doc._id.toString();
      if (!scoreMap.has(id)) scoreMap.set(id, { doc, rrfScore: 0 });
      scoreMap.get(id).rrfScore += 1 / (k + rank + 1);
    });

    const merged = Array.from(scoreMap.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, sanitizedTopK);

    if (merged.length === 0) {
      return res.json({
        answer:
          "No matching documents found. Ensure embeddings and search indexes are set up.",
        sources: [],
      });
    }

    // 5. Build context for GPT-4o
    const context = merged
      .map(({ doc }, i) => {
        const parts = [`[Source ${i + 1}: ${doc.companyName || "Unknown"}]`];
        if (doc.rationale) parts.push(`Rationale: ${doc.rationale}`);
        if (doc.reports?.chatGptAnalysis) {
          parts.push(
            `ChatGPT Analysis:\n${doc.reports.chatGptAnalysis.slice(0, 3000)}`,
          );
        }
        if (doc.reports?.perplexityResearch) {
          parts.push(
            `Perplexity Research:\n${doc.reports.perplexityResearch.slice(0, 3000)}`,
          );
        }
        return parts.join("\n");
      })
      .join("\n\n---\n\n");

    // 6. Reason with GPT-4o
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a senior sales intelligence analyst. You have access to research dossiers on enterprise ecommerce companies. " +
            "Answer the user's question based ONLY on the provided source documents. " +
            "Cite sources by company name. If the sources don't contain enough information, say so. " +
            "Be concise, analytical, and actionable.",
        },
        {
          role: "user",
          content: `Question: ${trimmedQuery}\n\n--- SOURCE DOCUMENTS ---\n\n${context}`,
        },
      ],
    });

    const answer =
      completion.choices[0]?.message?.content || "No response generated.";

    res.json({
      answer,
      sources: merged.map(({ doc, rrfScore }) => ({
        companyName: doc.companyName,
        website: doc.website,
        rrfScore,
        buyingSignalScore: doc.buyingSignalScore,
        priority: doc.priority,
      })),
      searchMode: "hybrid",
      model: "gpt-4o",
      embeddingModel: "text-embedding-3-small",
    });
  } catch (err) {
    console.error("Hybrid search error:", err);
    res.status(500).json({ error: "Hybrid search failed: " + err.message });
  }
});

// =========================================================================
// SalesActivities — single source of truth per company for AI consumption
// Collection: "SalesActivities" in PG_Machine database
// =========================================================================

// Helper: sync all PG_Machine research data into a SalesActivities document
async function syncAccountToSalesActivities(companyName) {
  const database = await connectDB();
  const pgCollection = database.collection("PG_Machine");
  const saCollection = database.collection("SalesActivities");

  const account = await pgCollection.findOne(
    { companyName: { $regex: new RegExp(`^${companyName}$`, "i") } },
    { projection: { embedding: 0, championEmbedding: 0 } },
  );

  if (!account) return null;

  const researchSnapshot = {
    companyName: account.companyName,
    website: account.website,
    buyingSignalScore: account.buyingSignalScore,
    priority: account.priority,
    rationale: account.rationale,
    reports: account.reports || {},
    insights: account.insights || {},
    champion_cxo_candidates: account.champion_cxo_candidates || [],
    champion_vp_director_candidates:
      account.champion_vp_director_candidates || [],
    champion_enduser_candidates: account.champion_enduser_candidates || [],
    detractors: account.detractors || [],
    primary_champion_recommendation:
      account.primary_champion_recommendation || null,
    champion_overall_readiness: account.champion_overall_readiness || null,
    agentResults: account.agentResults || {},
    swarmBriefs: account.swarmBriefs || {},
    "agentic-xtra-iterations": account["agentic-xtra-iterations"] || {},
    orgChart: account.orgChart || null,
    metadata: account.metadata || {},
    timestamp: account.timestamp,
  };

  const result = await saCollection.updateOne(
    { companyName: { $regex: new RegExp(`^${companyName}$`, "i") } },
    {
      $set: {
        ...researchSnapshot,
        lastSyncedAt: new Date().toISOString(),
      },
      $setOnInsert: {
        activities: [],
        createdAt: new Date().toISOString(),
      },
    },
    { upsert: true },
  );

  return result;
}

// Sync all accounts from PG_Machine into SalesActivities
app.post("/api/sales-activities/sync", async (req, res) => {
  try {
    const database = await connectDB();
    const pgCollection = database.collection("PG_Machine");
    const accounts = await pgCollection
      .find({ companyName: { $ne: null } })
      .project({ companyName: 1 })
      .toArray();

    let synced = 0;
    for (const acc of accounts) {
      await syncAccountToSalesActivities(acc.companyName);
      synced++;
    }

    console.log(`SalesActivities synced: ${synced} accounts`);
    res.json({ success: true, synced });
  } catch (err) {
    console.error("Error syncing SalesActivities:", err);
    res.status(500).json({ error: "Failed to sync" });
  }
});

// Sync a single account
app.post("/api/sales-activities/sync/:companyName", async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);
    const result = await syncAccountToSalesActivities(companyName);
    if (!result) {
      return res
        .status(404)
        .json({ error: `Account "${companyName}" not found in PG_Machine` });
    }
    res.json({ success: true, companyName });
  } catch (err) {
    console.error("Error syncing single account:", err);
    res.status(500).json({ error: "Failed to sync account" });
  }
});

// Get the full SalesActivities document for a company (the single source of truth)
app.get("/api/sales-activities/:companyName", async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);
    const database = await connectDB();
    const saCollection = database.collection("SalesActivities");

    const doc = await saCollection.findOne({
      companyName: { $regex: new RegExp(`^${companyName}$`, "i") },
    });

    if (!doc) {
      return res
        .status(404)
        .json({ error: "No SalesActivities document found. Run sync first." });
    }

    res.json(doc);
  } catch (err) {
    console.error("Error fetching SalesActivities:", err);
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// Get all SalesActivities documents (lightweight — no full reports)
app.get("/api/sales-activities", async (req, res) => {
  try {
    const database = await connectDB();
    const saCollection = database.collection("SalesActivities");

    const docs = await saCollection
      .find({})
      .project({
        companyName: 1,
        website: 1,
        buyingSignalScore: 1,
        priority: 1,
        champion_overall_readiness: 1,
        primary_champion_recommendation: 1,
        activities: 1,
        lastSyncedAt: 1,
      })
      .toArray();

    res.json(docs);
  } catch (err) {
    console.error("Error fetching all SalesActivities:", err);
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// Log a new sales activity for a company
app.post("/api/sales-activities/:companyName/activity", async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);
    const {
      activityType,
      activityDate,
      description,
      performedBy,
      contactName,
      contactRole,
      customerOutcome,
      outcomeType,
      outcomeDate,
      dealProgressed,
      notes,
    } = req.body;

    if (!activityType || !description) {
      return res
        .status(400)
        .json({ error: "Missing activityType or description" });
    }

    const allowedTypes = [
      "email",
      "call",
      "linkedin",
      "meeting",
      "demo",
      "proposal",
      "follow_up",
      "event",
      "referral",
      "other",
    ];
    if (!allowedTypes.includes(activityType)) {
      return res.status(400).json({
        error: `activityType must be one of: ${allowedTypes.join(", ")}`,
      });
    }

    const allowedOutcomes = [
      "no_response",
      "replied",
      "booked_meeting",
      "agreed_poc",
      "introduced_stakeholder",
      "requested_proposal",
      "verbal_commit",
      "declined",
      "pending",
    ];
    if (outcomeType && !allowedOutcomes.includes(outcomeType)) {
      return res.status(400).json({
        error: `outcomeType must be one of: ${allowedOutcomes.join(", ")}`,
      });
    }

    const database = await connectDB();
    const saCollection = database.collection("SalesActivities");

    // Ensure document exists (sync from PG_Machine if not)
    const existing = await saCollection.findOne({
      companyName: { $regex: new RegExp(`^${companyName}$`, "i") },
    });
    if (!existing) {
      await syncAccountToSalesActivities(companyName);
    }

    const activity = {
      _activityId: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      activityType,
      activityDate: activityDate || new Date().toISOString(),
      description,
      performedBy: performedBy || null,
      contactName: contactName || null,
      contactRole: contactRole || null,
      customerOutcome: customerOutcome || null,
      outcomeType: outcomeType || "pending",
      outcomeDate: outcomeDate || null,
      dealProgressed: dealProgressed != null ? dealProgressed : null,
      notes: notes || null,
      createdAt: new Date().toISOString(),
    };

    await saCollection.updateOne(
      { companyName: { $regex: new RegExp(`^${companyName}$`, "i") } },
      { $push: { activities: activity } },
    );

    console.log(
      `Activity logged for ${companyName}: ${activityType} — ${description.slice(0, 60)}`,
    );
    res.json({ success: true, activity });
  } catch (err) {
    console.error("Error logging activity:", err);
    res.status(500).json({ error: "Failed to log activity" });
  }
});

// Update an existing activity (e.g. add outcome after the fact)
app.put(
  "/api/sales-activities/:companyName/activity/:activityId",
  async (req, res) => {
    try {
      const companyName = decodeURIComponent(req.params.companyName);
      const activityId = req.params.activityId;
      const updates = req.body;

      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No update fields provided" });
      }

      const database = await connectDB();
      const saCollection = database.collection("SalesActivities");

      // Build $set fields for the matched array element
      const setFields = {};
      const allowedFields = [
        "activityType",
        "activityDate",
        "description",
        "performedBy",
        "contactName",
        "contactRole",
        "customerOutcome",
        "outcomeType",
        "outcomeDate",
        "dealProgressed",
        "notes",
      ];
      for (const key of allowedFields) {
        if (updates[key] !== undefined) {
          setFields[`activities.$.${key}`] = updates[key];
        }
      }
      setFields["activities.$.updatedAt"] = new Date().toISOString();

      const result = await saCollection.updateOne(
        {
          companyName: { $regex: new RegExp(`^${companyName}$`, "i") },
          "activities._activityId": activityId,
        },
        { $set: setFields },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Activity not found" });
      }

      res.json({ success: true, companyName, activityId });
    } catch (err) {
      console.error("Error updating activity:", err);
      res.status(500).json({ error: "Failed to update activity" });
    }
  },
);

// Get aggregated activity summary for a company
app.get("/api/sales-activities/:companyName/summary", async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);
    const database = await connectDB();
    const saCollection = database.collection("SalesActivities");

    const doc = await saCollection.findOne(
      { companyName: { $regex: new RegExp(`^${companyName}$`, "i") } },
      {
        projection: {
          activities: 1,
          companyName: 1,
          buyingSignalScore: 1,
          priority: 1,
          champion_overall_readiness: 1,
        },
      },
    );

    if (!doc) {
      return res
        .status(404)
        .json({ error: "No SalesActivities document found" });
    }

    const activities = doc.activities || [];
    const totalActivities = activities.length;

    // Count by type
    const byType = {};
    activities.forEach((a) => {
      byType[a.activityType] = (byType[a.activityType] || 0) + 1;
    });

    // Count by outcome
    const byOutcome = {};
    activities.forEach((a) => {
      const ot = a.outcomeType || "pending";
      byOutcome[ot] = (byOutcome[ot] || 0) + 1;
    });

    // Deal progression rate
    const withOutcome = activities.filter((a) => a.dealProgressed != null);
    const progressed = withOutcome.filter(
      (a) => a.dealProgressed === true,
    ).length;
    const progressionRate =
      withOutcome.length > 0
        ? Math.round((progressed / withOutcome.length) * 100)
        : null;

    // Last activity date
    const sorted = [...activities].sort(
      (a, b) =>
        new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime(),
    );
    const lastActivityDate = sorted[0]?.activityDate || null;
    const daysSinceLastActivity = lastActivityDate
      ? Math.floor(
          (Date.now() - new Date(lastActivityDate).getTime()) / 86400000,
        )
      : null;

    res.json({
      companyName: doc.companyName,
      buyingSignalScore: doc.buyingSignalScore,
      priority: doc.priority,
      champion_overall_readiness: doc.champion_overall_readiness,
      totalActivities,
      byType,
      byOutcome,
      progressionRate,
      progressed,
      totalWithOutcome: withOutcome.length,
      lastActivityDate,
      daysSinceLastActivity,
    });
  } catch (err) {
    console.error("Error computing activity summary:", err);
    res.status(500).json({ error: "Failed to compute summary" });
  }
});

// =========================================================================
// Module Permissions — configurable module access per role
// =========================================================================

const DEFAULT_MODULE_PERMISSIONS = {
  platform_admin: [
    "dashboard",
    "research-hub",
    "war-room",
    "analytics",
    "integrations",
    "admin",
  ],
  company_admin: [
    "dashboard",
    "research-hub",
    "war-room",
    "analytics",
    "integrations",
  ],
  sales_leader: ["dashboard", "research-hub", "war-room", "analytics"],
  team_leader: ["dashboard", "research-hub", "war-room"],
  end_user: ["dashboard", "research-hub"],
  sdr: ["dashboard"],
  sdr_manager: ["dashboard", "analytics"],
};

// GET module permissions (public — needed by all authenticated users)
app.get("/api/module-permissions", async (req, res) => {
  try {
    const platformDb = await connectPlatformDB();
    const doc = await platformDb
      .collection("module_permissions")
      .findOne({ _key: "global" });
    res.json(doc?.permissions || DEFAULT_MODULE_PERMISSIONS);
  } catch (err) {
    console.error("Error fetching module permissions:", err);
    res.json(DEFAULT_MODULE_PERMISSIONS);
  }
});

// PUT module permissions (platform admin only)
app.put("/api/module-permissions", async (req, res) => {
  try {
    const callerEmail = (req.headers["x-user-email"] || "").toLowerCase();
    const callerRole = req.headers["x-user-role"];
    if (
      !PLATFORM_ADMIN_EMAILS.includes(callerEmail) &&
      callerRole !== "platform_admin"
    ) {
      return res
        .status(403)
        .json({ error: "Only platform admins can update module permissions" });
    }

    const { permissions } = req.body;
    if (!permissions || typeof permissions !== "object") {
      return res.status(400).json({ error: "permissions object is required" });
    }

    const platformDb = await connectPlatformDB();
    await platformDb.collection("module_permissions").updateOne(
      { _key: "global" },
      {
        $set: {
          _key: "global",
          permissions,
          updatedAt: new Date().toISOString(),
          updatedBy: callerEmail,
        },
      },
      { upsert: true },
    );

    res.json({ success: true, permissions });
  } catch (err) {
    console.error("Error updating module permissions:", err);
    res.status(500).json({ error: "Failed to update module permissions" });
  }
});

// GET per-user module overrides (returns all user overrides)
app.get("/api/module-permissions/users", async (req, res) => {
  try {
    const callerEmail = (req.headers["x-user-email"] || "").toLowerCase();
    const callerRole = req.headers["x-user-role"];
    if (
      !PLATFORM_ADMIN_EMAILS.includes(callerEmail) &&
      callerRole !== "platform_admin"
    ) {
      return res.status(403).json({ error: "Admin only" });
    }
    const platformDb = await connectPlatformDB();
    const overrides = await platformDb
      .collection("user_module_overrides")
      .find({})
      .toArray();
    res.json(overrides);
  } catch (err) {
    console.error("Error fetching user module overrides:", err);
    res.status(500).json({ error: "Failed to fetch user module overrides" });
  }
});

// GET module permissions for current user (merges role defaults + user overrides)
app.get("/api/module-permissions/me", async (req, res) => {
  try {
    const email = (req.headers["x-user-email"] || "").toLowerCase();
    const role = req.headers["x-user-role"] || "end_user";
    const platformDb = await connectPlatformDB();

    // Get role-based defaults
    const globalDoc = await platformDb
      .collection("module_permissions")
      .findOne({ _key: "global" });
    const roleModules =
      (globalDoc?.permissions || DEFAULT_MODULE_PERMISSIONS)[role] || [];

    // Get user-specific overrides
    const userOverride = await platformDb
      .collection("user_module_overrides")
      .findOne({ email });

    if (userOverride) {
      // Merge: start with role defaults, add user additions, remove user removals
      const added = userOverride.addedModules || [];
      const removed = userOverride.removedModules || [];
      const merged = [...new Set([...roleModules, ...added])].filter(
        (m) => !removed.includes(m),
      );
      res.json({ modules: merged, hasOverride: true });
    } else {
      res.json({ modules: roleModules, hasOverride: false });
    }
  } catch (err) {
    console.error("Error fetching user module permissions:", err);
    res.status(500).json({ error: "Failed" });
  }
});

// PUT per-user module override (platform admin only)
app.put("/api/module-permissions/users/:email", async (req, res) => {
  try {
    const callerEmail = (req.headers["x-user-email"] || "").toLowerCase();
    const callerRole = req.headers["x-user-role"];
    if (
      !PLATFORM_ADMIN_EMAILS.includes(callerEmail) &&
      callerRole !== "platform_admin"
    ) {
      return res.status(403).json({ error: "Admin only" });
    }

    const targetEmail = decodeURIComponent(req.params.email).toLowerCase();
    const { modules } = req.body;
    if (!Array.isArray(modules)) {
      return res.status(400).json({ error: "modules array is required" });
    }

    const platformDb = await connectPlatformDB();
    await platformDb.collection("user_module_overrides").updateOne(
      { email: targetEmail },
      {
        $set: {
          email: targetEmail,
          modules,
          updatedAt: new Date().toISOString(),
          updatedBy: callerEmail,
        },
      },
      { upsert: true },
    );

    res.json({ success: true, email: targetEmail, modules });
  } catch (err) {
    console.error("Error updating user module override:", err);
    res.status(500).json({ error: "Failed to update user module override" });
  }
});

// DELETE per-user module override (reverts to role defaults)
app.delete("/api/module-permissions/users/:email", async (req, res) => {
  try {
    const callerEmail = (req.headers["x-user-email"] || "").toLowerCase();
    const callerRole = req.headers["x-user-role"];
    if (
      !PLATFORM_ADMIN_EMAILS.includes(callerEmail) &&
      callerRole !== "platform_admin"
    ) {
      return res.status(403).json({ error: "Admin only" });
    }

    const targetEmail = decodeURIComponent(req.params.email).toLowerCase();
    const platformDb = await connectPlatformDB();
    await platformDb
      .collection("user_module_overrides")
      .deleteOne({ email: targetEmail });

    res.json({ success: true, email: targetEmail });
  } catch (err) {
    console.error("Error deleting user module override:", err);
    res.status(500).json({ error: "Failed" });
  }
});

// List all auth users (platform admin only)
app.get("/api/auth/list-users", async (req, res) => {
  try {
    const platformDb = await connectPlatformDB();
    const users = await platformDb
      .collection("auth_users")
      .find({}, { projection: { password: 0 } })
      .toArray();
    res.json(
      users.map((u) => ({ email: u.email, name: u.name, role: u.role })),
    );
  } catch (err) {
    console.error("Error listing auth users:", err);
    res.status(500).json({ error: "Failed" });
  }
});

// List all users across all tenants (platform admin only)
// Returns each user with their tenant, role, status, and auth status
app.get("/api/admin/all-users", async (req, res) => {
  try {
    const callerEmail = (req.headers["x-user-email"] || "").toLowerCase();
    const callerRole = req.headers["x-user-role"];
    if (
      !PLATFORM_ADMIN_EMAILS.includes(callerEmail) &&
      callerRole !== "platform_admin"
    ) {
      return res.status(403).json({ error: "Platform admin only" });
    }

    const platformDb = await connectPlatformDB();
    const tenants = await platformDb
      .collection("tenants")
      .find({ status: "active" })
      .toArray();

    // Get all auth_users for status lookup
    const authUsers = await platformDb
      .collection("auth_users")
      .find({}, { projection: { passwordHash: 0 } })
      .toArray();
    const authMap = new Map(authUsers.map((u) => [u.email?.toLowerCase(), u]));

    const allUsers = [];
    for (const tenant of tenants) {
      try {
        const tenantDb = await connectTenantDB(
          tenant.databaseName || tenant.slug,
        );
        const users = await tenantDb.collection("users").find({}).toArray();
        for (const u of users) {
          const authRecord = authMap.get(u.email?.toLowerCase());
          allUsers.push({
            _id: u._id,
            email: u.email,
            name: u.name || authRecord?.name || null,
            role: u.role || "end_user",
            teamName: u.teamName || null,
            tenant: tenant.slug,
            tenantDisplayName: tenant.displayName || tenant.slug,
            status: u.status || authRecord?.status || "active",
            hasAuthRecord: !!authRecord,
            lastLoginAt: u.lastLoginAt || null,
            createdAt: u.createdAt || authRecord?.createdAt || null,
          });
        }
      } catch (tenantErr) {
        console.error(
          `Error reading users from ${tenant.slug}:`,
          tenantErr.message,
        );
      }
    }

    res.json(allUsers);
  } catch (err) {
    console.error("Error listing all users:", err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

// =========================================================================
// Per-Tenant Role Permissions — configurable per-tenant RBAC overrides
// =========================================================================

// Default role permissions (what each role can do)
const DEFAULT_ROLE_PERMISSIONS = {
  company_admin: {
    canInviteUsers: true,
    canEditRoles: true,
    canRunResearch: true,
    canRunAgents: true,
    canViewAnalytics: true,
    canManageWorkflows: false,
    canAccessWarRoom: true,
    canExportData: true,
  },
  sales_leader: {
    canInviteUsers: false,
    canEditRoles: false,
    canRunResearch: true,
    canRunAgents: true,
    canViewAnalytics: true,
    canManageWorkflows: false,
    canAccessWarRoom: true,
    canExportData: true,
  },
  team_leader: {
    canInviteUsers: false,
    canEditRoles: false,
    canRunResearch: true,
    canRunAgents: false,
    canViewAnalytics: false,
    canManageWorkflows: false,
    canAccessWarRoom: true,
    canExportData: false,
  },
  end_user: {
    canInviteUsers: false,
    canEditRoles: false,
    canRunResearch: false,
    canRunAgents: false,
    canViewAnalytics: false,
    canManageWorkflows: false,
    canAccessWarRoom: false,
    canExportData: false,
  },
  sdr: {
    canInviteUsers: false,
    canEditRoles: false,
    canRunResearch: false,
    canRunAgents: false,
    canViewAnalytics: false,
    canManageWorkflows: false,
    canAccessWarRoom: false,
    canExportData: false,
  },
  sdr_manager: {
    canInviteUsers: false,
    canEditRoles: false,
    canRunResearch: false,
    canRunAgents: false,
    canViewAnalytics: true,
    canManageWorkflows: false,
    canAccessWarRoom: false,
    canExportData: false,
  },
};

// GET role permissions for a tenant (returns merged defaults + overrides)
app.get("/api/tenants/:slug/role-permissions", async (req, res) => {
  try {
    const callerEmail = (req.headers["x-user-email"] || "").toLowerCase();
    const callerRole = req.headers["x-user-role"];
    const isPlatAdmin =
      PLATFORM_ADMIN_EMAILS.includes(callerEmail) ||
      callerRole === "platform_admin";
    // company_admins can view their own tenant's permissions
    if (!isPlatAdmin && callerRole !== "company_admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const platformDb = await connectPlatformDB();
    const doc = await platformDb
      .collection("tenant_role_permissions")
      .findOne({ slug: req.params.slug });

    // Merge: start with defaults, overlay tenant overrides
    const merged = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    if (doc?.permissions) {
      for (const [role, perms] of Object.entries(doc.permissions)) {
        if (merged[role]) {
          Object.assign(merged[role], perms);
        } else {
          merged[role] = perms;
        }
      }
    }

    res.json({ permissions: merged, hasOverrides: !!doc });
  } catch (err) {
    console.error("Error fetching role permissions:", err);
    res.status(500).json({ error: "Failed" });
  }
});

// PUT role permissions for a tenant (platform admin only, or company_admin for their own tenant)
app.put("/api/tenants/:slug/role-permissions", async (req, res) => {
  try {
    const callerEmail = (req.headers["x-user-email"] || "").toLowerCase();
    const callerRole = req.headers["x-user-role"];
    const isPlatAdmin =
      PLATFORM_ADMIN_EMAILS.includes(callerEmail) ||
      callerRole === "platform_admin";

    if (!isPlatAdmin) {
      return res
        .status(403)
        .json({ error: "Only platform admins can update role permissions" });
    }

    const { permissions } = req.body;
    if (!permissions || typeof permissions !== "object") {
      return res.status(400).json({ error: "permissions object is required" });
    }

    const platformDb = await connectPlatformDB();
    await platformDb.collection("tenant_role_permissions").updateOne(
      { slug: req.params.slug },
      {
        $set: {
          slug: req.params.slug,
          permissions,
          updatedAt: new Date().toISOString(),
          updatedBy: callerEmail,
        },
      },
      { upsert: true },
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating role permissions:", err);
    res.status(500).json({ error: "Failed" });
  }
});

// GET current user's effective permissions for a tenant
app.get("/api/tenants/:slug/my-permissions", async (req, res) => {
  try {
    const callerEmail = (req.headers["x-user-email"] || "").toLowerCase();
    const callerRole = req.headers["x-user-role"] || "end_user";
    const isPlatAdmin =
      PLATFORM_ADMIN_EMAILS.includes(callerEmail) ||
      callerRole === "platform_admin";

    // Platform admins get all permissions
    if (isPlatAdmin) {
      const allTrue = {};
      for (const key of Object.keys(DEFAULT_ROLE_PERMISSIONS.company_admin)) {
        allTrue[key] = true;
      }
      allTrue.canManageWorkflows = true;
      return res.json({
        permissions: allTrue,
        role: "platform_admin",
        isOverride: true,
      });
    }

    const platformDb = await connectPlatformDB();
    const doc = await platformDb
      .collection("tenant_role_permissions")
      .findOne({ slug: req.params.slug });

    const defaults =
      DEFAULT_ROLE_PERMISSIONS[callerRole] || DEFAULT_ROLE_PERMISSIONS.end_user;
    const overrides = doc?.permissions?.[callerRole] || {};
    const merged = { ...defaults, ...overrides };

    res.json({ permissions: merged, role: callerRole, isOverride: !!doc });
  } catch (err) {
    console.error("Error fetching user permissions:", err);
    res.status(500).json({ error: "Failed" });
  }
});

// =========================================================================
// Tenant Management — provisioning, listing, user management
// =========================================================================

// List all tenants (platform admin only)
app.get("/api/tenants", async (req, res) => {
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
app.post("/api/tenants/provision", async (req, res) => {
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
app.get("/api/tenants/:slug", async (req, res) => {
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
app.get("/api/tenants/:slug/users", async (req, res) => {
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
app.post("/api/tenants/:slug/users", async (req, res) => {
  try {
    const { email, name, role, teamName } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: "Missing email or role" });
    }

    const allowedRoles = [
      "platform_admin",
      "company_admin",
      "sales_leader",
      "team_leader",
      "end_user",
      "sdr",
      "sdr_manager",
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
app.get("/api/tenants/:slug/roles", async (req, res) => {
  try {
    const tenantDb = await connectTenantDB(req.params.slug);
    const roles = await tenantDb.collection("roles").find({}).toArray();
    res.json(roles);
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

// Get prompt overrides for a tenant
app.get("/api/tenants/:slug/prompts", async (req, res) => {
  try {
    const platformDb = await connectPlatformDB();
    const config = await platformDb
      .collection("tenant_prompts")
      .findOne({ slug: req.params.slug });
    if (!config) {
      return res.json({ slug: req.params.slug, agents: [] });
    }
    res.json(config);
  } catch (err) {
    console.error("Error fetching tenant prompts:", err);
    res.status(500).json({ error: "Failed to fetch prompts" });
  }
});

// Save prompt overrides for a tenant
app.put("/api/tenants/:slug/prompts", async (req, res) => {
  try {
    const { agents } = req.body;
    if (!Array.isArray(agents)) {
      return res.status(400).json({ error: "agents must be an array" });
    }
    const platformDb = await connectPlatformDB();
    await platformDb.collection("tenant_prompts").updateOne(
      { slug: req.params.slug },
      {
        $set: {
          slug: req.params.slug,
          agents,
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: { createdAt: new Date().toISOString() },
      },
      { upsert: true },
    );
    console.log(
      `Prompts saved for tenant ${req.params.slug} (${agents.length} agents)`,
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving tenant prompts:", err);
    res.status(500).json({ error: "Failed to save prompts" });
  }
});

// =========================================================================
// Tenant Workflow Configuration (n8n, agent overrides, templates)
// Collection: "tenant_workflows" in platform database
// =========================================================================

// Get workflow config for a tenant
app.get("/api/tenants/:slug/workflow", async (req, res) => {
  try {
    const callerEmail = (req.headers["x-user-email"] || "").toLowerCase();
    const callerRole = req.headers["x-user-role"] || "";
    if (
      !PLATFORM_ADMIN_EMAILS.includes(callerEmail) &&
      callerRole !== "platform_admin" &&
      callerRole !== "company_admin"
    ) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const workflow = await getTenantWorkflow(req.params.slug);
    if (!workflow) {
      return res.json({
        slug: req.params.slug,
        n8n: { webhook_url: "" },
        enabled_agents: [],
        enabled_templates: [],
        agent_prompt_overrides: {},
        template_injection_overrides: {},
        synthesis_overrides: {},
      });
    }
    res.json(workflow);
  } catch (err) {
    console.error("Error fetching tenant workflow:", err);
    res.status(500).json({ error: "Failed to fetch workflow config" });
  }
});

// Save workflow config for a tenant
app.put("/api/tenants/:slug/workflow", async (req, res) => {
  try {
    const callerEmail = (req.headers["x-user-email"] || "").toLowerCase();
    const callerRole = req.headers["x-user-role"] || "";
    if (
      !PLATFORM_ADMIN_EMAILS.includes(callerEmail) &&
      callerRole !== "platform_admin"
    ) {
      return res.status(403).json({ error: "Platform admin required" });
    }

    const {
      n8n,
      enabled_agents,
      enabled_templates,
      agent_prompt_overrides,
      template_injection_overrides,
      synthesis_overrides,
    } = req.body;

    // Validate n8n webhook URL if provided
    if (n8n?.webhook_url && !n8n.webhook_url.startsWith("https://")) {
      return res.status(400).json({ error: "n8n webhook URL must use HTTPS" });
    }

    const slug = req.params.slug;
    const platformDb = await connectPlatformDB();
    await platformDb.collection("tenant_workflows").updateOne(
      { slug },
      {
        $set: {
          slug,
          n8n: n8n || { webhook_url: "" },
          enabled_agents: enabled_agents || [],
          enabled_templates: enabled_templates || [],
          agent_prompt_overrides: agent_prompt_overrides || {},
          template_injection_overrides: template_injection_overrides || {},
          synthesis_overrides: synthesis_overrides || {},
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: { createdAt: new Date().toISOString() },
      },
      { upsert: true },
    );

    // Bust cache
    workflowCache.delete(slug);

    console.log(`Workflow config saved for tenant ${slug}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving tenant workflow:", err);
    res.status(500).json({ error: "Failed to save workflow config" });
  }
});

// Delete workflow config for a tenant (revert to platform defaults)
app.delete("/api/tenants/:slug/workflow", async (req, res) => {
  try {
    const callerEmail = (req.headers["x-user-email"] || "").toLowerCase();
    const callerRole = req.headers["x-user-role"] || "";
    if (
      !PLATFORM_ADMIN_EMAILS.includes(callerEmail) &&
      callerRole !== "platform_admin"
    ) {
      return res.status(403).json({ error: "Platform admin required" });
    }

    const slug = req.params.slug;
    const platformDb = await connectPlatformDB();
    await platformDb.collection("tenant_workflows").deleteOne({ slug });
    workflowCache.delete(slug);

    console.log(`Workflow config deleted for tenant ${slug}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting tenant workflow:", err);
    res.status(500).json({ error: "Failed to delete workflow config" });
  }
});

// =========================================================================
// Auth: email + password login (replaces Google OAuth)
// Collection: "auth_users" in platform database
// =========================================================================

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

  // Platform admins always get all roles for PG_Machine
  if (isPlatformAdmin) {
    // Prevent cross-tenant role inheritance for platform admins.
    const pgOnlyRoles = availableRoles.filter((r) => r.tenant === "PG_Machine");
    availableRoles.length = 0;
    availableRoles.push(...pgOnlyRoles);
    linked.length = 0;
    linked.push("PG_Machine");

    if (!linked.includes("PG_Machine")) {
      linked.push("PG_Machine");
    }
    // Replace any existing PG_Machine roles with the full admin role set
    const pgRoles = availableRoles.filter((r) => r.tenant === "PG_Machine");
    const existingRoleNames = pgRoles.map((r) => r.role);
    const adminRoles = [
      "platform_admin",
      "sales_leader",
      "end_user",
      "sdr",
      "sdr_manager",
    ];
    for (const roleName of adminRoles) {
      if (!existingRoleNames.includes(roleName)) {
        availableRoles.push({
          tenant: "PG_Machine",
          role: roleName,
          teamName: null,
        });
      }
    }
    // Ensure platform_admin is present (upgrade if existing entry has lower role)
    const hasPlatformAdmin = availableRoles.some(
      (r) => r.tenant === "PG_Machine" && r.role === "platform_admin",
    );
    if (!hasPlatformAdmin) {
      availableRoles.push({
        tenant: "PG_Machine",
        role: "platform_admin",
        teamName: null,
      });
    }
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

// Helper: Generate random 6-digit code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Send verification code email
async function sendVerificationEmail(email, code, name = null) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(
      "SMTP_USER/SMTP_PASS not set — cannot send verification email",
    );
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"PG Machine" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your PG Machine login verification code",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #124af1; margin-bottom: 8px;">Verify your login</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Hi ${name || email.split("@")[0]},
          </p>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Use this code to verify your login to PG Machine. This code expires in 10 minutes.
          </p>
          <div style="background: #f5f7ff; border-radius: 12px; padding: 32px 20px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase;">Verification code</p>
            <p style="margin: 12px 0 0; font-size: 48px; font-weight: 700; color: #124af1; letter-spacing: 4px; font-family: 'Courier New', monospace;">${code}</p>
          </div>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            If you didn't request this code, you can safely ignore this email.
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 24px;">
            This code is valid for 10 minutes only.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Failed to send verification email:", err.message);
    return false;
  }
}

// Helper: Send password reset email
async function sendPasswordResetEmail(email, resetToken, name = null) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(
      "SMTP_USER/SMTP_PASS not set — cannot send password reset email",
    );
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetUrl = `https://sales-dashboard-liard.vercel.app/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"PG Machine" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset your PG Machine password",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #124af1; margin-bottom: 8px;">Reset your password</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Hi ${name || email.split("@")[0]},
          </p>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Click the button below to reset your password. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #124af1; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 20px 0;">
            Reset Password
          </a>
          <p style="color: #333; font-size: 15px; line-height: 1.6; margin-top: 20px;">
            Or copy this link:<br/>
            <code style="background: #f5f7ff; padding: 8px 12px; border-radius: 4px; word-break: break-all; font-size: 12px;">${resetUrl}</code>
          </p>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 24px;">
            This link is valid for 1 hour only.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Failed to send password reset email:", err.message);
    return false;
  }
}

// Login with email + password (single-step)
app.post("/api/auth/login", async (req, res) => {
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

    const userData = await resolveLoginUser(normalizedEmail);
    if (!userData) {
      return res.status(403).json({
        error: "No tenant found for this email. Ask an admin to invite you.",
      });
    }

    if (authUser.name && userData.name === normalizedEmail.split("@")[0]) {
      userData.name = authUser.name;
    }

    const credential = `session-${Date.now()}-${normalizedEmail}`;
    await platformDb
      .collection("auth_users")
      .updateOne(
        { email: normalizedEmail },
        { $set: { lastLoginAt: new Date().toISOString() } },
      );

    console.log(
      `Login successful: ${normalizedEmail} → tenants: ${userData.linkedTenants.join(", ")}`,
    );

    res.json({
      success: true,
      user: userData,
      credential,
    });
  } catch (err) {
    console.error("Error with login:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Verify email code (step 2: complete login)
app.post("/api/auth/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const platformDb = await connectPlatformDB();

    // Find and validate code
    const verificationDoc = await platformDb
      .collection("verification_codes")
      .findOne({ email: normalizedEmail });

    if (!verificationDoc) {
      return res
        .status(401)
        .json({ error: "Verification code not found or expired" });
    }

    if (new Date() > new Date(verificationDoc.expiresAt)) {
      await platformDb
        .collection("verification_codes")
        .deleteOne({ email: normalizedEmail });
      return res.status(401).json({ error: "Verification code expired" });
    }

    if (verificationDoc.code !== code) {
      return res.status(401).json({ error: "Invalid verification code" });
    }

    // Code is valid — complete login
    const authUser = await platformDb
      .collection("auth_users")
      .findOne({ email: normalizedEmail });

    if (!authUser) {
      return res.status(401).json({ error: "User not found" });
    }

    // Update last login
    await platformDb
      .collection("auth_users")
      .updateOne(
        { email: normalizedEmail },
        { $set: { lastLoginAt: new Date().toISOString() } },
      );

    // Delete used verification code
    await platformDb
      .collection("verification_codes")
      .deleteOne({ email: normalizedEmail });

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
      `Login verified: ${normalizedEmail} → tenants: ${userData.linkedTenants.join(", ")}, roles: ${userData.availableRoles.map((r) => `${r.role}@${r.tenant}`).join(", ")}`,
    );

    res.json({ success: true, user: userData, credential });
  } catch (err) {
    console.error("Error verifying email:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// Forgot password: send reset email
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const platformDb = await connectPlatformDB();

    // Check if user exists (don't reveal whether email exists for security)
    const authUser = await platformDb
      .collection("auth_users")
      .findOne({ email: normalizedEmail });

    if (!authUser) {
      // Still return success to prevent email enumeration
      return res.json({
        success: true,
        message:
          "If an account exists with this email, you will receive a reset link",
      });
    }

    // Generate reset token
    const resetToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await platformDb.collection("password_resets").updateOne(
      { email: normalizedEmail },
      {
        $set: {
          email: normalizedEmail,
          resetToken,
          expiresAt,
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true },
    );

    // Send reset email
    const emailSent = await sendPasswordResetEmail(
      normalizedEmail,
      resetToken,
      authUser.name,
    );

    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send reset email" });
    }

    console.log(`Password reset requested: ${normalizedEmail}`);

    res.json({
      success: true,
      message:
        "If an account exists with this email, you will receive a reset link",
    });
  } catch (err) {
    console.error("Error with forgot password:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// Reset password: set new password with reset token
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const platformDb = await connectPlatformDB();

    // Find reset token
    const resetDoc = await platformDb
      .collection("password_resets")
      .findOne({ resetToken: token });

    if (!resetDoc) {
      return res.status(401).json({ error: "Invalid or expired reset token" });
    }

    if (new Date() > new Date(resetDoc.expiresAt)) {
      await platformDb
        .collection("password_resets")
        .deleteOne({ resetToken: token });
      return res.status(401).json({ error: "Reset token expired" });
    }

    // Hash new password and update
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await platformDb.collection("auth_users").updateOne(
      { email: resetDoc.email },
      {
        $set: {
          passwordHash,
          passwordResetAt: new Date().toISOString(),
        },
      },
    );

    // Delete used reset token
    await platformDb
      .collection("password_resets")
      .deleteOne({ resetToken: token });

    console.log(`Password reset completed: ${resetDoc.email}`);

    res.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (err) {
    console.error("Error with password reset:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Create a new user (only platform admins can do this)
app.post("/api/auth/create-user", async (req, res) => {
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
app.post("/api/auth/seed-admins", async (req, res) => {
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

// ─── Invite user (create account + send email) ───────────────────────────────
app.post("/api/invite", async (req, res) => {
  try {
    const { email, name, role, tenant } = req.body;
    const creatorEmail = req.headers["x-user-email"];
    const creatorRole = req.headers["x-user-role"];

    // Only platform admins can invite users
    if (
      !PLATFORM_ADMIN_EMAILS.includes(creatorEmail?.toLowerCase()) &&
      creatorRole !== "platform_admin"
    ) {
      return res
        .status(403)
        .json({ error: "Only platform admins can invite users" });
    }

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate a random temporary password
    const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(
        (b) =>
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"[
            b % 66
          ],
      )
      .join("");

    const platformDb = await connectPlatformDB();

    // Check if already exists
    const existing = await platformDb
      .collection("auth_users")
      .findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Create auth record
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await platformDb.collection("auth_users").insertOne({
      email: normalizedEmail,
      passwordHash,
      name: name || normalizedEmail.split("@")[0],
      status: "invited",
      createdAt: new Date().toISOString(),
      createdBy: creatorEmail || "system",
    });

    // Add to tenant if specified
    if (tenant) {
      const tenantDb = await connectTenantDB(tenant);
      await tenantDb.collection("users").updateOne(
        { email: normalizedEmail },
        {
          $set: {
            email: normalizedEmail,
            name: name || normalizedEmail.split("@")[0],
            role: role || "end_user",
            status: "invited",
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true },
      );
    }

    // Send invite email via Gmail SMTP
    let emailSent = false;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const loginUrl = "https://sales-dashboard-liard.vercel.app/login";

        await transporter.sendMail({
          from: `"PG Machine" <${process.env.SMTP_USER}>`,
          to: normalizedEmail,
          subject: "You're invited to PG Machine",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #124af1; margin-bottom: 8px;">Welcome to PG Machine</h2>
              <p style="color: #333; font-size: 15px; line-height: 1.6;">
                Hi ${name || normalizedEmail.split("@")[0]},
              </p>
              <p style="color: #333; font-size: 15px; line-height: 1.6;">
                You've been invited to join PG Machine${tenant ? ` as ${role || "end_user"}` : ""}. Use the credentials below to log in:
              </p>
              <div style="background: #f5f7ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 8px; font-size: 14px;"><strong>Email:</strong> ${normalizedEmail}</p>
                <p style="margin: 0; font-size: 14px;"><strong>Temporary password:</strong> ${tempPassword}</p>
              </div>
              <a href="${loginUrl}" style="display: inline-block; background: #124af1; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Sign in to PG Machine
              </a>
              <p style="color: #888; font-size: 12px; margin-top: 24px;">
                Please change your password after your first login.
              </p>
            </div>
          `,
        });
        emailSent = true;
      } catch (emailErr) {
        console.error("Failed to send invite email:", emailErr.message);
      }
    } else {
      console.warn("SMTP_USER/SMTP_PASS not set — skipping invite email");
    }

    console.log(
      `User invited: ${normalizedEmail} (by ${creatorEmail || "system"})${tenant ? ` → tenant: ${tenant}, role: ${role || "end_user"}` : ""} | email: ${emailSent ? "sent" : "skipped"}`,
    );

    res.json({
      success: true,
      email: normalizedEmail,
      name: name || normalizedEmail.split("@")[0],
      emailSent,
      tempPassword: emailSent ? undefined : tempPassword,
    });
  } catch (err) {
    console.error("Error inviting user:", err);
    res.status(500).json({ error: "Failed to invite user" });
  }
});

// Seed users + roles collections for a tenant database on startup
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
      primaryTenant: "PG_Machine",
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

// =========================================================================
// pg_identity — central identity & RBAC database
// Collections: "companies" (one doc per customer company with embedded users)
//              "rbac_policies" (defines permission sets per RBAC level)
// =========================================================================

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

  // Ensure Samuli is not a platform_admin — update to end_user if present
  await companiesCol.updateOne(
    {
      customer_company_id: "comp_pg_machine",
      "users.email": "samuli.melart@gmail.com",
    },
    {
      $set: {
        "users.$.role": "end_user",
        "users.$.customer_user_id_rbac": "end_user",
      },
    },
  );

  // Ensure Ruth Valle exists as sales end_user
  await companiesCol.updateOne(
    {
      customer_company_id: "comp_pg_machine",
      "users.email": { $ne: "oskari.ali-melkkila@constructor.io" },
    },
    {
      $push: {
        users: {
          customer_user_id: "usr_ruth",
          name: "Ruth Valle",
          email: "oskari.ali-melkkila@constructor.io",
          role: "end_user",
          department: "Sales",
          manager: null,
          customer_user_id_rbac: "end_user",
          createdAt: new Date().toISOString(),
        },
      },
    },
  );

  console.log("  ✅ pg_identity database seeded (companies + RBAC policies)");
}

// Helper: look up a user's identity from pg_identity by email
async function resolveIdentity(email) {
  const identityDb = await connectIdentityDB();
  const companiesCol = identityDb.collection("companies");
  const rbacCol = identityDb.collection("rbac_policies");

  // Find which company this user belongs to
  const company = await companiesCol.findOne(
    { "users.email": email.toLowerCase(), status: "active" },
    {
      projection: {
        customer_company_id: 1,
        companyName: 1,
        slug: 1,
        databaseName: 1,
        users: { $elemMatch: { email: email.toLowerCase() } },
      },
    },
  );

  if (!company || !company.users || company.users.length === 0) {
    return null;
  }

  const user = company.users[0];

  // Look up RBAC policy
  const rbac = await rbacCol.findOne({
    customer_user_id_rbac: user.customer_user_id_rbac,
  });

  return {
    customer_company_id: company.customer_company_id,
    companyName: company.companyName,
    companySlug: company.slug,
    databaseName: company.databaseName,
    customer_user_id: user.customer_user_id,
    customer_user_id_rbac: user.customer_user_id_rbac,
    rbac: rbac || null,
    user,
  };
}

// =========================================================================
// Identity API endpoints
// =========================================================================

// Get all companies from pg_identity
app.get("/api/identity/companies", async (req, res) => {
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
app.get("/api/identity/companies/:companyId", async (req, res) => {
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
app.post("/api/identity/companies/:companyId/users", async (req, res) => {
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
app.get("/api/identity/rbac", async (req, res) => {
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
app.get("/api/identity/resolve/:email", async (req, res) => {
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

// Register PG_Machine as legacy tenant + seed users/roles on startup
(async () => {
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
})();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

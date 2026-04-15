// Simple Node.js Express server for backend operations
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const path = require("path");
const OpenAI = require("openai");
const { buildAgentPrompt, buildSynthesisPrompt } = require("./agent-prompts");
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

let db;
async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("PG_Machine");
  }
  return db;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Get accounts from PG_Machine collection
app.get("/api/accounts", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("PG_Machine");
    const accounts = await collection
      .find({ companyName: { $ne: null } })
      .toArray();
    res.json(accounts);
  } catch (err) {
    console.error("Error fetching accounts:", err);
    res.status(500).json({ error: "Failed to fetch accounts" });
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
app.post("/api/swarm/run", async (req, res) => {
  try {
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
app.post("/api/swarm/run-all", async (req, res) => {
  try {
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
app.post("/api/research", async (req, res) => {
  try {
    const { account_name, website_url } = req.body;
    if (!account_name) {
      return res.status(400).json({ error: "Missing account_name in payload" });
    }

    console.log(`Research started for ${account_name} (async)...`);

    // Track this research as pending
    pendingResearch.set(account_name.toLowerCase(), {
      status: "pending",
      startedAt: new Date().toISOString(),
    });

    // Fire-and-forget: call n8n webhook without awaiting the response
    const n8nUrl =
      "https://gtmbaltics.app.n8n.cloud/webhook/002eb43f-96f4-4046-86f3-d0129f19819d";
    fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_name, website_url }),
    })
      .then(() => console.log(`n8n webhook fired for ${account_name}`))
      .catch((err) =>
        console.error(
          `n8n webhook fire failed for ${account_name}:`,
          err.message,
        ),
      );

    res.json({
      success: true,
      message: `Research for "${account_name}" has been started. n8n will call back when done.`,
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

    // Save to MongoDB
    const database = await connectDB();
    const collection = database.collection("PG_Machine");
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
    const database = await connectDB();
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

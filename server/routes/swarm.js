// Swarm routes — AI agent swarm execution + status tracking
const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { connectDB } = require("../config/db");
const { buildAgentPrompt, buildSynthesisPrompt } = require("../agent-prompts");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

// Helper: run swarm for a single account (shared by /run and /run-all)
async function runSwarmForAccount(
  account,
  agents,
  template,
  instructions,
  collection,
) {
  const accountContext = buildAccountContext(account);

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

  // Build update fields for MongoDB
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
    { companyName: { $regex: new RegExp(`^${account.companyName}$`, "i") } },
    { $set: updateFields },
    { upsert: false },
  );

  return { agentResults, synthesisBrief };
}

// Helper: build account context object from account document
function buildAccountContext(account) {
  const fullPerplexity = account.reports?.perplexityResearch || "";
  return {
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
}

// Run Agent Swarm: execute agents in parallel via GPT-4o, synthesize buying signal brief
router.post("/run", async (req, res) => {
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

        const { agentResults } = await runSwarmForAccount(
          account,
          agents,
          template,
          instructions,
          collection,
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
router.post("/run-all", async (req, res) => {
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

            await runSwarmForAccount(
              account,
              agents,
              template,
              instructions,
              collection,
            );

            job.results[accountName] = {
              status: "completed",
              agents: agents,
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
router.get("/status/:jobId", (req, res) => {
  const job = pendingSwarm.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }
  res.json(job);
});

module.exports = router;

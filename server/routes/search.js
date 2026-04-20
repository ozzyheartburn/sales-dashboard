// Search routes — vector search + hybrid search with LLM reasoning
const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { connectDB } = require("../config/db");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Vector Search + LLM reasoning endpoint
router.post("/vector-search", async (req, res) => {
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
router.post("/hybrid-search", async (req, res) => {
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

module.exports = router;

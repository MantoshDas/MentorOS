// server.js
// MentorOS Backend - Final Hybrid RAG with Clean Citations

require("dotenv").config();

const fastify = require("fastify")({ logger: true });

// 2. REGISTER CORS (Add this right here)
fastify.register(require('@fastify/cors'), { 
  origin: "*", // This allows your local HTML files to talk to the server
  methods: ["GET"]
});


const axios = require("axios");
const pool = require("./db/pool");
const { QdrantClient } = require("@qdrant/js-client-rest");

const COLLECTION = "mentoros_chunks";

const qdrant = new QdrantClient({
  url: "http://localhost:6333",
});

// -----------------------------
// Health Route
// -----------------------------
fastify.get("/", async () => {
  return { message: "MentorOS backend is running" };
});

// -----------------------------
// Chunk scoring
// -----------------------------
function scoreChunk(chunk, query) {
  let score = 0;

  const text = chunk.content.toLowerCase();
  const q = query.toLowerCase();

  const words = q.split(" ");
  words.forEach((w) => {
    if (w.length > 4 && text.includes(w)) score += 1;
  });

  // boost numeric academic rules
  if (text.match(/\d+%|\d+\s*(credits|years|semesters|marks)/))
    score += 2;

  return score;
}

// -----------------------------
// RAG Route
// -----------------------------
fastify.get("/ask", async (request, reply) => {
  const { query } = request.query;

  if (!query) {
    return reply.status(400).send({ error: "Query parameter required" });
  }

  try {
    // Normalize
    const cleanQuery = query
      .replace(/</g, "less than")
      .replace(/>/g, "greater than");

    // Expand toward academic domain
    const expandedQuery =
      cleanQuery +
      " student course academic rule exam grade registration university policy regulation";

    // 1️⃣ Embed query using Ollama
    const embedResponse = await axios.post(
      "http://localhost:11434/api/embeddings",
      {
        model: "nomic-embed-text",
        prompt: expandedQuery,
      }
    );

    const queryVector = embedResponse.data.embedding;

    // 2️⃣ Vector search
    const vectorResults = await qdrant.search(COLLECTION, {
      vector: queryVector,
      limit: 20,
    });

    const vectorIds = vectorResults.map((r) => r.id);

    const vectorChunks =
      vectorIds.length > 0
        ? (
            await pool.query(
              `
SELECT c.id, c.content, c.page_number, d.filename
FROM chunks c
JOIN documents d ON c.document_id = d.id
WHERE c.id = ANY($1)
`,
              [vectorIds]
            )
          ).rows
        : [];

    // 3️⃣ Keyword search
    const keywordResults = await pool.query(
      `
SELECT c.id, c.content, c.page_number, d.filename
FROM chunks c
JOIN documents d ON c.document_id = d.id
WHERE c.content_tsv @@ plainto_tsquery('english', $1)
LIMIT 20
`,
      [expandedQuery]
    );

    // 4️⃣ Merge
    const merged = [...keywordResults.rows, ...vectorChunks];

    // 5️⃣ Score + rank
    const scored = merged.map((c) => ({
      ...c,
      score: scoreChunk(c, cleanQuery),
    }));

    scored.sort((a, b) => b.score - a.score);

    // Remove duplicates by chunk id
    const uniqueMap = new Map();
    scored.forEach((c) => uniqueMap.set(c.id, c));
    const finalChunks = Array.from(uniqueMap.values()).slice(0, 5);

    if (finalChunks.length === 0) {
      return {
        query,
        answer: "Not found in documents.",
        citations: [],
      };
    }

    // Build context
    const context = finalChunks
      .map((c) => `Chunk ${c.id}:\n${c.content}`)
      .join("\n\n");

    // Prompt
    const prompt = `
You are an academic policy assistant.

Unless the question clearly mentions staff, employee, faculty, or office,
assume the question refers to STUDENT academic rules.

Answer in 2 to 4 sentences maximum.
If a numerical rule exists, state it clearly.
Use ONLY the context below.
If answer not present, say "Not found in documents."

Context:
${context}

Question:
${query}

Answer:
`;

    // 6️⃣ Gemini answer
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      }
    );

    const answer =
      geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response.";

    // -----------------------------
    // Clean citations (unique pages)
    // -----------------------------
    const citationSet = new Set();
    const uniqueCitations = [];

    for (const c of finalChunks) {
      const key = `${c.filename}-${c.page_number}`;
      if (!citationSet.has(key)) {
        citationSet.add(key);
        uniqueCitations.push({
          document: c.filename,
          page: c.page_number,
        });
      }
    }

    return {
      query,
      answer,
      citations: uniqueCitations,
    };
  } catch (err) {
    return reply.status(500).send({
      error: "RAG pipeline failed",
      details: err.response?.data || err.message,
    });
  }
});

// -----------------------------
// Start Server
// -----------------------------
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server running at http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

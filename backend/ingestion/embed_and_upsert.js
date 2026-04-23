// ingestion/embed_and_upsert.js
// Generates embeddings using Ollama and inserts into Qdrant

const axios = require("axios");
const { QdrantClient } = require("@qdrant/js-client-rest");
const pool = require("../db/pool");

const qdrant = new QdrantClient({
  url: "http://localhost:6333",
});

const COLLECTION = "mentoros_chunks";
const BATCH_SIZE = 10;

// Fetch all chunks
async function getChunks() {
  const res = await pool.query(
    "SELECT id, content FROM chunks ORDER BY id"
  );
  return res.rows;
}

// Call Ollama embedding API
async function embedText(text) {
  const response = await axios.post("http://localhost:11434/api/embeddings", {
    model: "nomic-embed-text",
    prompt: text,
  });

  return response.data.embedding;
}

async function run() {
  const chunks = await getChunks();

  for (const chunk of chunks) {
    const embedding = await embedText(chunk.content);

    await qdrant.upsert(COLLECTION, {
      points: [
        {
          id: chunk.id,
          vector: embedding,
          payload: { chunk_id: chunk.id },
        },
      ],
    });

    console.log(`✅ Embedded chunk ${chunk.id}`);
  }

  console.log("🎉 All embeddings inserted into Qdrant.");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});

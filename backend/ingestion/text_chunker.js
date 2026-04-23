// ingestion/text_chunker.js
// General-purpose text chunker for RAG

function chunkText(text, options = {}) {
  const chunkSize = options.chunkSize || 1000; // bigger chunks
  const overlap = options.overlap || 200;

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to end at sentence boundary
    const slice = text.slice(start, end);
    const lastPeriod = slice.lastIndexOf(".");
    if (lastPeriod > 400) {
      end = start + lastPeriod + 1;
    }

    const chunk = text.slice(start, end).trim();

    if (chunk.length > 100) {
      chunks.push(chunk);
    }

    start += chunkSize - overlap;
  }

  return chunks;
}

module.exports = { chunkText };

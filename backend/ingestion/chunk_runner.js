// ingestion/chunk_runner.js
// End-to-end: read PDF → clean → chunk → inspect

const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const { cleanText } = require("./text_cleaner");
const { chunkText } = require("./text_chunker");

const docsPath = path.join(__dirname, "../../docs");

const pdfFiles = [
  "UG_RULEBOOK.pdf",
  "Administrative_Manual.pdf",
];

async function processPdf(fileName) {
  const filePath = path.join(docsPath, fileName);
  const buffer = fs.readFileSync(filePath);

  const pdfData = await pdf(buffer);
  const cleanedText = cleanText(pdfData.text);
  const chunks = chunkText(cleanedText);

  console.log("=================================");
  console.log(`FILE: ${fileName}`);
  console.log(`Total chunks: ${chunks.length}`);
  console.log("Sample chunk:");
  console.log(chunks[0].slice(0, 500));
  console.log("=================================\n");
}

async function run() {
  for (const file of pdfFiles) {
    await processPdf(file);
  }
}

run();

// ingestion/pdfReader.js
// Standalone script to read and extract text from PDFs

const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

// Path to docs folder (outside backend)
const docsPath = path.join(__dirname, "../../docs");

// PDFs to read
const pdfFiles = [
  "UG_RULEBOOK.pdf",
  "Administrative_Manual.pdf",
];

async function readPdf(fileName) {
  const filePath = path.join(docsPath, fileName);
  const fileBuffer = fs.readFileSync(filePath);

  const data = await pdf(fileBuffer);

  console.log("=================================");
  console.log(`FILE: ${fileName}`);
  console.log(`Number of pages: ${data.numpages}`);
  console.log(`Text length: ${data.text.length}`);
  console.log("Sample text (first 500 chars):");
  console.log(data.text.slice(0, 500));
  console.log("=================================\n");
}

async function run() {
  for (const file of pdfFiles) {
    await readPdf(file);
  }
}

run();

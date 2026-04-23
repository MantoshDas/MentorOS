// ingestion/ingest_to_db.js
// Reads PDFs → page-wise chunks → stores in PostgreSQL

const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

const pool = require("../db/pool");
const { cleanText } = require("./text_cleaner");
const { chunkText } = require("./text_chunker");

const DOCS_PATH = path.join(__dirname, "../../docs");

async function ingestPdf(fileName) {
  console.log(`\n📄 Processing: ${fileName}`);

  const filePath = path.join(DOCS_PATH, fileName);
  const buffer = fs.readFileSync(filePath);

  const pdfData = await pdf(buffer);

  // Insert document row
  const docResult = await pool.query(
    `INSERT INTO documents (filename, title, source, total_pages)
     VALUES ($1,$2,$3,$4)
     RETURNING id`,
    [
      fileName,
      path.parse(fileName).name,
      "University Documents",
      pdfData.numpages,
    ]
  );

  const documentId = docResult.rows[0].id;

  // Split pages manually
  const pages = pdfData.text.split("\f");

  let chunkIndex = 0;

  for (let p = 0; p < pages.length; p++) {
    const cleaned = cleanText(pages[p]);
    const chunks = chunkText(cleaned);

    for (const chunk of chunks) {
      await pool.query(
        `INSERT INTO chunks
         (document_id, chunk_index, content, page_number)
         VALUES ($1,$2,$3,$4)`,
        [documentId, chunkIndex++, chunk, p + 1]
      );
    }
  }

  console.log("✅ Stored chunks with page numbers.");
}

async function run() {
  const pdfFiles = fs
    .readdirSync(DOCS_PATH)
    .filter((file) => file.endsWith(".pdf"));

  for (const file of pdfFiles) {
    await ingestPdf(file);
  }

  console.log("\n🎉 Ingestion complete.");
  process.exit(0);
}

run();

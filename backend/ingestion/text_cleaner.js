// ingestion/text_cleaner.js
// Cleans raw PDF text before chunking

function cleanText(rawText) {
  return rawText
    // normalize line breaks
    .replace(/\r\n/g, "\n")
    // remove excessive blank lines
    .replace(/\n{3,}/g, "\n\n")
    // remove page numbers alone on lines
    .replace(/^\s*\d+\s*$/gm, "")
    // trim spaces
    .trim();
}

module.exports = { cleanText };

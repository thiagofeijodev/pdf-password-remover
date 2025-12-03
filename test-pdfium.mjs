#!/usr/bin/env node

import { pdfiumRemover } from './src/utils/pdfiumRemover.js';
import { readFileSync, writeFileSync } from 'fs';

const args = process.argv.slice(2);
const pdfPath = args[0] || '.pdf';
const password = args[1] || '';

async function testPdfium() {
  try {
    console.log('[Test] Starting PDFium test...');
    console.log('[Test] PDF file:', pdfPath);
    console.log('[Test] Password:', password || '(none)');

    // Read PDF file
    console.log('[Test] Reading PDF file...');
    const pdfData = readFileSync(pdfPath);
    console.log(`[Test] ✓ PDF loaded: ${pdfData.length} bytes`);

    // Use pdfiumRemover to decrypt the PDF
    console.log('[Test] Decrypting PDF...');
    const decryptedBlob = await pdfiumRemover(pdfData.buffer, password);

    // Convert blob to buffer
    const arrayBuffer = await decryptedBlob.arrayBuffer();
    const decryptedData = Buffer.from(arrayBuffer);

    console.log(`[Test] ✓ PDF decrypted: ${decryptedData.length} bytes`);

    // Write to file
    const outputPath = pdfPath.replace(/\.pdf$/i, '_decrypted.pdf');
    writeFileSync(outputPath, decryptedData);
    console.log(`[Test] ✓ Decrypted PDF saved to: ${outputPath}`);

    console.log('[Test] ✓ All tests passed!');
  } catch (error) {
    console.error('[Test] Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testPdfium();

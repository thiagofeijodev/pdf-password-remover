#!/usr/bin/env node

/**
 * Isolated WASM test script - Run directly: node test-wasm.js <pdf-file> [password]
 * This tests the WASM module without the browser or React complexity
 *
 * Usage:
 *   node test-wasm.js path/to/file.pdf
 *   node test-wasm.js path/to/file.pdf "password123"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);
const pdfFilePath = args[0] || '.pdf';
const testPassword = args[1] || '';

if (!pdfFilePath) {
  console.error('Usage: node test-wasm.js <pdf-file> [password]');
  console.error('\nExample:');
  console.error('  node test-wasm.js ./sample.pdf');
  console.error('  node test-wasm.js ./sample.pdf "mypassword"');
  process.exit(1);
}

// Resolve absolute path
const absolutePdfPath = path.isAbsolute(pdfFilePath)
  ? pdfFilePath
  : path.join(process.cwd(), pdfFilePath);

console.log(`PDF File: ${absolutePdfPath}`);
console.log(`Password: "${testPassword}"\n`);

(async () => {
  try {
    console.log('=== WASM Module Test ===\n');

    // Check if PDF file exists
    if (!fs.existsSync(absolutePdfPath)) {
      console.error(`✗ PDF file not found: ${absolutePdfPath}`);
      process.exit(1);
    }

    // Read PDF from disk
    console.log('Loading PDF from disk...');
    const pdfBuffer = fs.readFileSync(absolutePdfPath);
    console.log(`✓ PDF loaded: ${pdfBuffer.length} bytes`);

    // Load the WASM module
    console.log('\nLoading WASM module...');
    const wasmPath = path.join(__dirname, 'public/pdf-remover.js');
    const wasmModule = await import(wasmPath);

    console.log('✓ WASM module loaded');

    // Read the WASM binary
    const wasmBinaryPath = path.join(__dirname, 'public/pdf-remover.wasm');
    const wasmBinary = fs.readFileSync(wasmBinaryPath);
    console.log(`✓ WASM binary loaded: ${wasmBinary.length} bytes`);

    // Initialize the module with the binary
    console.log('\nInitializing WASM module...');
    const module = await wasmModule.default({
      wasmBinary: wasmBinary,
    });

    console.log('✓ Module initialized');

    // Check if PDFRemover class exists
    if (!module.PDFRemover) {
      console.error('✗ PDFRemover class not found in module');
      process.exit(1);
    }

    console.log('✓ PDFRemover class found');

    // Create an instance
    console.log('\nCreating PDFRemover instance...');
    const remover = new module.PDFRemover();

    console.log('✓ Instance created');
    console.log('\nAvailable methods:');
    Object.getOwnPropertyNames(Object.getPrototypeOf(remover)).forEach((method) => {
      console.log(`  - ${method}`);
    });

    // Test with loaded PDF
    console.log('\n=== Processing PDF ===\n');

    // Convert to Uint8Array
    const pdfArray = new Uint8Array(pdfBuffer);
    console.log(`Converted to Uint8Array: ${pdfArray.length} bytes`);
    console.log(`Password: "${testPassword}"\n`);

    // Process
    console.log('Calling processPDF()...');
    const success = remover.processPDF(pdfArray, testPassword);
    console.log(`✓ processPDF returned: ${success}`);

    // Get logs
    console.log('\nRetrieving logs...');
    if (typeof remover.getLog === 'function') {
      const logs = remover.getLog();
      console.log('✓ getLog() succeeded');
      console.log('\n--- WASM Debug Logs ---');
      console.log(logs);
      console.log('--- End Logs ---\n');
    } else {
      console.warn('⚠ getLog() not available');
    }

    // Get output
    console.log('Getting output...');
    const output = remover.getOutput();
    console.log(`✓ Output retrieved: ${output.length} bytes`);

    if (output.length > 0) {
      console.log(`✓ Output is not empty`);

      // Optionally save output
      const outputPath = absolutePdfPath.replace(/\.pdf$/i, '_processed.pdf');
      fs.writeFileSync(outputPath, Buffer.from(output));
      console.log(`✓ Output saved to: ${outputPath}`);
    } else {
      console.warn('⚠ Output is empty');
    }

    console.log('\n=== Test Complete ===');
  } catch (err) {
    console.error('✗ Error:', err);
    process.exit(1);
  }
})();

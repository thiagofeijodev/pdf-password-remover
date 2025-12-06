# Copilot Instructions for PDF Password Remover

## Project Overview

**PDF Password Remover** is a privacy-focused React web application for removing password protection from PDF files. The critical design principle: **all processing happens in the browser using WebAssembly—files never leave the user's device**.

The app uses `@embedpdf/pdfium` (a WebAssembly library) for robust PDF decryption with native password support, replacing previous attempts at lightweight solutions.

## Architecture & Data Flow

### Core Components

1. **`src/App.jsx`** - Main entry point that orchestrates two hooks:
   - Uses `usePdfiumPDFRemover()` to expose the PDF processing function
   - Uses `usePDFPasswordRemover()` to manage UI state (password, file, error handling)

2. **`src/hooks/usePdfiumPDFRemover.js`** - Low-level hook that:
   - Initializes pdfium.wasm on first use
   - Exposes `processPDFWithPdfium(pdfData, password)` async function
   - Returns status: `{ isLoading, processPDFWithPdfium, isPdfiumAvailable }`

3. **`src/hooks/usePDFPasswordRemover.js`** - High-level hook that:
   - Manages form state (password, file, error, fileName)
   - Handles localStorage persistence of passwords (base64 encoded) via `STORAGE_KEY: 'pdfPasswordRemover_data'`
   - Saves password option (`savePassword` checkbox) for next session
   - Calls `createPDFBuffer()` and `downloadBlob()` utilities

4. **`src/utils/pdfiumRemover.js`** - PDFium integration:
   - Fetches pdfium.wasm from external CDN (`https://feijo.dev/pdf-password-remover/pdfium.wasm`)
   - `initPdfium()` lazy-loads and caches the WASM module
   - `pdfiumRemover(pdfData, password)` performs actual decryption
   - Uses PDFium C API constants: `FPDF_REMOVE_SECURITY=3`, error codes for handling failures

5. **Utilities**:
   - `createPDFBuffer()` - Converts File to ArrayBuffer
   - `downloadBlob()` - Triggers browser download with filename
   - `createGoogleTag()` - Analytics initialization

### Data Flow

```
User selects PDF → File read to ArrayBuffer →
User enters password → pdfiumRemover(arrayBuffer, password) →
Decrypted Blob → downloadBlob() → Browser download
```

## Key Build & Runtime Details

### Build System

- **Bundler**: Rspack (faster Webpack alternative)
- **Config**: `.config/rspack/rspack.dev.mjs` and `.config/rspack/rspack.prod.mjs`
- **Base URL**: App deployed at `/pdf-password-remover/` path (see `homepage: "./"` in package.json)
- **Plugins**: React Refresh for HMR, compression for production

### Important Dev Commands

```bash
npm start          # Start dev server (Rspack), runs on port 3001
npm run build      # Production build (outputs to dist/)
npm run analyzer   # Bundle analyzer
npm test           # Jest unit tests (max 2 workers for stability)
npm run test:e2e   # Playwright e2e tests
npm run test:e2e:ui # Interactive Playwright UI
npm run lint       # ESLint with zero warnings tolerance
npm run format     # Prettier format all files
```

### Testing

- **Unit Tests**: Jest with SWC compiler, matches files `**/*.test.js` or `**/__tests__/**`
- **E2E Tests**: Playwright using test assets in `e2e/assets/` (includes protected PDF: `file-sample_150kB-protected.pdf`)
- **Default URL**: `http://localhost:3001/pdf-password-remover/` (configurable via `APP_URL` env var in `playwright.config.js`)
- **CI**: Jest outputs to `test-results/jest-results.json`, Playwright retries 2x with HTML reporting

## Code Conventions & Patterns

### React/Hooks

- **Functional components only** - no class components
- **Custom hooks** in `src/hooks/` expose focused APIs (e.g., separate hooks for pdfium init vs UI state)
- **useEffect** for side effects: watch dependencies carefully, pdfium lazy-loads once
- **CSS Modules**: Import as `import * as styles from './App.module.css'` and apply with `className={styles.className}`

### Error Handling

- Try/catch in async utils; errors bubble to UI via state
- Console logging uses prefixes: `[Hook]`, `[PDFium]`, etc. for debugging
- User-facing errors show in error div with className `styles.error`

### localStorage

- Key pattern: `pdfPasswordRemover_data` → JSON with base64-encoded sensitive data
- Always wrap in try/catch; warn (not throw) on failures to avoid breaking UX

### Testing Conventions

- Unit tests collocate with source: `usePDFPasswordRemover.test.js` next to `usePDFPasswordRemover.js`
- E2E tests use Playwright page object pattern: `page.getByRole()`, `page.getByLabel()` preferred over selectors
- Protected PDF fixture at `e2e/assets/file-sample_150kB-protected.pdf` with password: `'password'`

### Linting & Formatting

- ESLint config in `eslint.config.mjs` (flat config v9+)
- React rules: JSX scope rule off (React 19+), prop-types off
- **Zero warnings tolerance**: `npm run lint` enforces `--max-warnings 0`
- Prettier integrated with ESLint via `eslint-config-prettier`
- Commit linting via Husky + CommitLint (conventional commits)

## Critical Integration Points

1. **Pdfium WASM Module**:
   - Fetched from external CDN, not bundled
   - Lazy initialization on first password removal
   - Caching via module-level `pdfiumInstance` variable
   - Error resilience: handle network failures for WASM fetch

2. **Browser APIs**:
   - FileReader for PDF → ArrayBuffer conversion
   - Blob/URL.createObjectURL for downloads
   - localStorage for password persistence (user must enable if required)

3. **Analytics**:
   - Google Tag Manager initialized via `createGoogleTag()` in App useEffect
   - Check implementation before modifying tracking

4. **GitHub Pages Deployment**:
   - Automatic via main branch push
   - Production build at `./` homepage path
   - Verify base URL in routing/links

## Common Troubleshooting

- **Pdfium WASM 404**: Verify CDN URL in `pdfiumRemover.js` is accessible
- **PDF decryption fails**: Check password encoding, try rebuilding cache (localStorage clear)
- **E2E flakiness**: Increase timeouts in Playwright config if network-dependent
- **Build fails on lint**: Run `npm run format` before `npm run lint`
- **Tests fail with JSDOM errors**: Check `.config/tests/setupTests.js` for missing DOM mocks

## Files to Reference

| File                                 | Purpose                                 |
| ------------------------------------ | --------------------------------------- |
| `src/App.jsx`                        | UI orchestration, hook composition      |
| `src/hooks/usePdfiumPDFRemover.js`   | WASM initialization logic               |
| `src/hooks/usePDFPasswordRemover.js` | Form & state management                 |
| `src/utils/pdfiumRemover.js`         | PDFium C API wrapper                    |
| `.config/rspack/rspack.*.mjs`        | Build configuration                     |
| `playwright.config.js`               | E2E test setup, base URL, server config |
| `jest.config.mjs`                    | Unit test setup, module mocking         |

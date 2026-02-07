# PDF Password Remover

A privacy-focused web application for removing password protection from PDF files. Upload a password-protected PDF, enter the password, and download an unlocked version. All processing happens entirely in your browser — files never leave your device.

## Quick Summary

- Dev server: http://localhost:3001/ (configured in `.config/rspack/rspack.dev.mjs`)
- WASM: built from `rust-pdf-remover` with `wasm-pack` into `src/wasm` (prebuilt artifacts exist in the repo)
- Production build output: `docs/` (published by CI to GitHub Pages)

## Prerequisites

- Node >= 24 (CI uses Node 24)
- npm
- Rust toolchain (if you plan to build the wasm locally)
- `wasm-pack` (recommended for local wasm builds)

Install `wasm-pack`:

```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

Note: the repository includes prebuilt WASM artifacts in `src/wasm`. If you prefer not to install `wasm-pack`, you can use those artifacts, but the `npm start` script runs a wasm build step by default (see Development section).

## Installation

```bash
git clone https://github.com/thiagofeijodev/pdf-password-remover.git
cd pdf-password-remover
npm ci
```

## Development

Start the dev server (this runs a wasm dev build first):

```bash
npm start
```

What `npm start` does:

- Runs `npm run build:wasm:dev` (calls `wasm-pack` to build the Rust crate into `src/wasm` in dev mode)
- Starts the Rspack dev server via `node .config/rspack/rspack.dev.mjs`

Dev server details:

- Port: `3001`
- Static output during dev: `static/`

Advanced: skip the wasm-pack step (if `src/wasm` is already built):

```bash
node .config/rspack/rspack.dev.mjs
```

## Building (WASM + Production)

Build the Rust crate to WASM (release):

```bash
npm run build:wasm
```

Build the full production site (includes wasm build):

```bash
npm run build
```

Notes:

- `build:wasm` uses `wasm-pack build --target web --out-dir ../src/wasm --release rust-pdf-remover`.
- Production output is written to `docs/` (this is what CI publishes to GitHub Pages).
- Ensure `.wasm` files are served with `application/wasm` MIME type for best performance (enables `WebAssembly.instantiateStreaming`). The wasm JS includes a fallback to a slower instantiate if needed.

## Tests

### Unit tests (Jest)

```bash
npm test
```

CI-friendly Jest JSON output:

```bash
npm run test:ci
```

### E2E tests (Playwright)

Install Playwright browsers:

```bash
npm run test:prepare
```

Run Playwright tests:

```bash
npm run test:e2e
```

Interactive UI mode:

```bash
npm run test:e2e:ui
```

Notes:

- Playwright's config will start the dev server on port `3001` unless `APP_URL` is set.
- In CI Playwright runs with `CI=1` and may run multiple browser projects.

## Continuous Integration & Deployment

The GitHub Actions workflow is in `.github/workflows/main.yml` and runs on pushes to `main`. Key steps:

- Setup Node (Node 24) and cache `npm`
- Install `wasm-pack` (installer script)
- `npm ci`
- `npm run build:wasm`
- `npm run lint`
- `npm run test` (Jest)
- `npm run test:prepare` (Playwright browsers)
- `npm run test:e2e:ci` (Playwright)
- `npm run build` (production)
- Deploy `./docs` to `gh-pages` via `peaceiris/actions-gh-pages`

CI notes:

- `REACT_APP_GA_ID` is read from secrets during the production build when analytics are desired.

## Files of Interest

- `src/wasm/` — prebuilt wasm-bindgen artifacts (JS + .wasm + types)
- `rust-pdf-remover/` — Rust crate to build wasm
- `.config/rspack/rspack.dev.mjs` — dev server configuration (port 3001)
- `.config/rspack/rspack.prod.mjs` — production build configuration (writes to `docs/`)
- `.github/workflows/main.yml` — CI (build/test/deploy)

## Troubleshooting & Common Pitfalls

- wasm-pack not installed: `npm start` runs `build:wasm:dev` and will fail without `wasm-pack`. Install `wasm-pack` or use the prebuilt `src/wasm` and start the dev server directly.
- MIME type: ensure servers serve `.wasm` files using `application/wasm` to enable fast streaming instantiation.
- Node/npm versions: CI uses Node 24; if you get unexpected failures, try Node 24.
- Playwright: run `npm run test:prepare` locally to install browsers before running e2e tests.
- Prebuilt wasm: running `npm run build:wasm` will overwrite `src/wasm` with freshly built artifacts from the Rust crate.

## Quick Commands

```bash
# Install deps
npm ci

# Start dev (builds wasm in dev mode first)
npm start

# Build wasm (release)
npm run build:wasm

# Build production
npm run build

# Run unit tests
npm test

# Prepare Playwright browsers
npm run test:prepare

# Run e2e tests
npm run test:e2e
```

## License

This project is licensed under the MIT License.

## Contact

For questions, issues or contributions: https://github.com/thiagofeijodev/pdf-password-remover

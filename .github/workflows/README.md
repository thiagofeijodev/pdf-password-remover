# GitHub Workflows

This directory contains the CI/CD workflow configurations for the PDF Password Remover project.

## Available Workflows

### 1. `wasm-build.yml` - WASM Module Build

- **Trigger**: Push/PR to `main` or `develop` branches when changes touch `src/wasm/**`
- **Purpose**: Builds and validates the WebAssembly module
- **Outputs**: Uploads compiled WASM files as artifacts
- **Includes**: Build size reporting

### 2. `build.yml` - Full Build & Test

- **Trigger**: Push/PR to `main` or `develop` branches
- **Purpose**: Complete CI pipeline (WASM + app + tests)
- **Steps**:
  1. Install Emscripten and CMake
  2. Build WASM module
  3. Run linting
  4. Run unit tests
  5. Build the React application
- **Outputs**: Complete build artifacts

### 3. Other Existing Workflows

- `main.yml` - Main deployment workflow
- `e2e-tests.yml` - End-to-end testing
- `health-check.yml` - System health checks
- `pull_request.yml` - PR validation

## Local Testing

Before pushing, test locally to ensure workflows will pass:

```bash
# Test WASM build
npm run build:wasm

# Test full build
npm run build

# Test linting
npm run lint

# Test unit tests
npm run test
```

## Monitoring Workflows

1. Go to GitHub repository
2. Click "Actions" tab
3. Select workflow to view logs
4. Check individual job steps for details

## Troubleshooting

**WASM build fails in CI but works locally:**

- Check Emscripten versions match: `emcc --version`
- Verify CMake installation: `cmake --version`
- Check disk space in CI runner

**Artifacts not uploading:**

- Verify `build/` directory contains files after build
- Check workflow has write permissions

**Large file sizes:**

- Consider code splitting for WASM modules
- Review optimization flags in CMakeLists.txt

## Adding New Workflows

To add a new workflow:

1. Create `new-workflow.yml` in this directory
2. Use GitHub Actions marketplace: https://github.com/marketplace?type=actions
3. Test with `act` locally: https://github.com/nektos/act

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Actions Marketplace](https://github.com/marketplace?type=actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

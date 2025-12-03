# WebAssembly Setup Guide for PDF Password Remover

## What Has Been Set Up

Your project now has the initial infrastructure to support WebAssembly for PDF password removal. Here's what was created:

### 1. **C++ Source Files**

- `src/wasm/pdf-handler.cpp` - Core C++ class for PDF password removal
- `src/wasm/bindings.cpp` - Emscripten bindings to expose C++ to JavaScript
- `src/wasm/CMakeLists.txt` - Build configuration using CMake
- `src/wasm/build.sh` - Convenient build script

### 2. **JavaScript Integration**

- `src/hooks/useWasmPDFRemover.js` - React hook to use the WASM module
- Updated `package.json` with `build:wasm` script

### 3. **Build Directories**

- `build/` - Output directory for compiled WASM files

## Prerequisites

You need to install Emscripten, the toolchain that compiles C++ to WebAssembly.

### macOS Installation

```bash
brew install emscripten
```

### Verify Installation

```bash
emcc --version
```

If you see version info, you're ready to go!

## Building the WebAssembly Module

### Method 1: Automatic (Recommended)

```bash
npm run build:wasm
```

This will:

1. Create a build directory
2. Configure the CMake build system
3. Compile C++ to WebAssembly
4. Copy output files to `build/`

### Method 2: Manual Build

```bash
cd src/wasm
mkdir -p build_wasm
cd build_wasm
emcmake cmake ..
cmake --build .
```

### Full Application Build

To build both WASM and the React app:

```bash
npm run build
```

This runs `build:wasm` first, then the Rspack build.

## Next Steps: Implementing PDF Decryption

The current C++ code is a placeholder. To add actual PDF password removal:

### Option 1: Use QPDF (Recommended for simplicity)

1. **Install QPDF for Emscripten**:

   ```bash
   # QPDF is easier to compile to WASM
   # You'll need to compile it with Emscripten
   ```

2. **Update CMakeLists.txt**:

   ```cmake
   target_link_libraries(pdf-remover.js PRIVATE qpdf)
   ```

3. **Implement in pdf-handler.cpp**:

   ```cpp
   #include <qpdf/QPDF.hh>

   bool removePDFPassword(const std::string& inputData,
                         const std::string& password,
                         std::string& outputData) {
       QPDF pdf;
       pdf.processMemoryFile("input", inputData.c_str(),
                            inputData.length(), password.c_str());

       std::ostringstream output;
       QPDFWriter writer(pdf, output);
       writer.write();
       outputData = output.str();
       return true;
   }
   ```

### Option 2: Use PDFium

PDFium is more comprehensive but larger. It requires:

1. Building PDFium with Emscripten
2. Exposing the decryption API through bindings

### Option 3: Use mupdf

mupdf is lightweight and can be compiled to WASM. Similar integration process to QPDF.

## Using the WASM Module in Your App

### In a React Component

```javascript
import { useWasmPDFRemover } from './hooks/useWasmPDFRemover';

export function PDFProcessor() {
  const { processPDFWithWasm, isWasmAvailable, isLoading } = useWasmPDFRemover();

  const handleRemovePassword = async (file, password) => {
    if (!isWasmAvailable) {
      console.log('Falling back to JavaScript method');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const decryptedPDF = await processPDFWithWasm(arrayBuffer, password);
      // Use decryptedPDF...
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (isLoading) return <div>Loading WASM...</div>;

  return (
    // Your component JSX
  );
}
```

## Performance Considerations

- **Bundle Size**: A full PDF library compiled to WASM can be 5-10MB
- **Initial Load**: WASM module will be loaded on first use
- **Processing Speed**: WASM is significantly faster for encryption/decryption
- **Thread Safety**: For large files, consider using Web Workers

## Debugging WASM Code

### Enable Source Maps

Update the build command in `src/wasm/CMakeLists.txt`:

```cmake
set(EMSCRIPTEN_FLAGS
    -g  # Add debug info
    -s WASM=1
    # ... other flags
)
```

### Debug in Browser DevTools

1. Open Chrome DevTools (F12)
2. Go to Sources tab
3. You should see your C++ files if source maps are enabled
4. Set breakpoints directly in C++ code

### Useful Emscripten Tools

```bash
# Profile the WASM module
node --prof build/pdf-remover.js

# Generate intermediate artifacts
em++ -s WASM=1 -s SAFE_HEAP=1 bindings.cpp
```

## Testing WASM Integration

Create a test file `src/hooks/useWasmPDFRemover.test.js`:

```javascript
describe('useWasmPDFRemover', () => {
  it('should load WASM module', async () => {
    // Test module loading
  });

  it('should process PDF with password', async () => {
    // Test PDF processing
  });
});
```

## Common Issues

### 1. "Module not found" Error

Ensure WASM has been built:

```bash
npm run build:wasm
```

### 2. "Emscripten not found"

Install Emscripten:

```bash
brew install emscripten
```

### 3. Large Bundle Size

Use code splitting to lazy-load the WASM module:

```javascript
const useWasmPDFRemover = React.lazy(() => import('./hooks/useWasmPDFRemover'));
```

## Resources

- [Emscripten Documentation](https://emscripten.org/docs/)
- [WebAssembly MDN Guide](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [QPDF Documentation](http://qpdf.sourceforge.net/)
- [PDFium Guide](https://pdfium.googlesource.com/pdfium/)

## GitHub Workflows Integration

To automatically build the WASM module in your CI/CD pipeline, create a GitHub Actions workflow file.

### Setting Up GitHub Actions

1. **Create the workflow file**:

   ```bash
   mkdir -p .github/workflows
   ```

2. **Create `.github/workflows/wasm-build.yml`**:

   ```yaml
   name: Build WASM Module

   on:
     push:
       branches: [main, develop]
       paths:
         - 'src/wasm/**'
         - 'package.json'
         - '.github/workflows/wasm-build.yml'
     pull_request:
       branches: [main, develop]
       paths:
         - 'src/wasm/**'
         - 'package.json'

   jobs:
     build-wasm:
       runs-on: ubuntu-latest
       strategy:
         matrix:
           node-version: [24.x]

       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: ${{ matrix.node-version }}

         - name: Install Emscripten
           run: |
             git clone --depth 1 https://github.com/emscripten-core/emsdk.git
             cd emsdk
             ./emsdk install latest
             ./emsdk activate latest
             source ./emsdk_env.sh
             cd ..

         - name: Install CMake
           run: sudo apt-get update && sudo apt-get install -y cmake

         - name: Install dependencies
           run: npm ci

         - name: Build WASM module
           run: |
             source emsdk/emsdk_env.sh
             npm run build:wasm

         - name: Upload WASM artifacts
           uses: actions/upload-artifact@v4
           with:
             name: wasm-build
             path: build/pdf-remover.*
             retention-days: 30

         - name: Check build size
           run: |
             echo "WASM Binary Size:"
             ls -lh build/pdf-remover.wasm | awk '{print $5 " - " $9}'
   ```

3. **Optional: Full build workflow** (`.github/workflows/build.yml`):

   ```yaml
   name: Full Build & Test

   on:
     push:
       branches: [main, develop]
     pull_request:
       branches: [main, develop]

   jobs:
     build:
       runs-on: ubuntu-latest
       strategy:
         matrix:
           node-version: [24.x]

       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: ${{ matrix.node-version }}

         - name: Install Emscripten
           run: |
             git clone --depth 1 https://github.com/emscripten-core/emsdk.git
             cd emsdk
             ./emsdk install latest
             ./emsdk activate latest
             source ./emsdk_env.sh
             cd ..

         - name: Install CMake
           run: sudo apt-get update && sudo apt-get install -y cmake

         - name: Install dependencies
           run: npm ci

         - name: Build WASM module
           run: |
             source emsdk/emsdk_env.sh
             npm run build:wasm

         - name: Run linting
           run: npm run lint

         - name: Run tests
           run: npm run test

         - name: Build application
           run: npm run build

         - name: Upload build artifacts
           uses: actions/upload-artifact@v4
           with:
             name: build-output
             path: build/
             retention-days: 30
   ```

### Local Testing Before Push

To test your workflow locally before pushing:

```bash
# Verify build script works
npm run build:wasm

# Verify full build
npm run build

# Check file sizes
ls -lh build/pdf-remover.*
```

### Troubleshooting GitHub Actions

**If WASM build fails in CI:**

1. Check Emscripten version compatibility:

   ```bash
   emcc --version
   ```

2. Verify CMake is available:

   ```bash
   cmake --version
   ```

3. Check available disk space in the workflow

4. Review the workflow logs in GitHub Actions tab

## Next: Install Dependencies

If you choose to use QPDF or another PDF library, you'll need to either:

1. **Pre-compile** the library for Emscripten
2. **Use pre-built bindings** if available
3. **Build a custom toolchain** for compilation

For now, the placeholder implementation is ready for you to add the actual PDF decryption logic!

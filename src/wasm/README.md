# WebAssembly PDF Password Remover

This directory contains the C++ source code and build configuration for the WebAssembly module that handles PDF password removal.

## Directory Structure

- `pdf-handler.cpp` - Core PDF password removal logic
- `bindings.cpp` - Emscripten bindings for JavaScript integration
- `CMakeLists.txt` - Build configuration for Emscripten
- `build.sh` - Build script

## Prerequisites

Install Emscripten:

```bash
# macOS
brew install emscripten

# Or follow official installation: https://emscripten.org/docs/getting_started/downloads.html
```

## Building

### Option 1: Using build script

```bash
cd src/wasm
./build.sh
```

### Option 2: Using npm

```bash
npm run build:wasm
```

### Option 3: Manual build

```bash
cd src/wasm
mkdir -p build_wasm
cd build_wasm
emcmake cmake ..
cmake --build .
```

## Output

The compiled WebAssembly files will be generated in the `build/` directory:

- `pdf-remover.js` - JavaScript loader
- `pdf-remover.wasm` - WebAssembly binary

## Integration with React

The module is loaded and used through the `usePDFPasswordRemover` hook in `src/hooks/usePDFPasswordRemover.js`.

## C++ Implementation Notes

The `PDFPasswordRemover` class currently has a placeholder implementation. To add actual PDF decryption:

1. **Link QPDF library**:

   ```cpp
   target_link_libraries(pdf-remover.js PRIVATE qpdf)
   ```

2. **Implement decryption logic** in `pdf-handler.cpp`:
   - Parse PDF binary data
   - Extract encryption dictionary
   - Apply password-based decryption
   - Return decrypted PDF

3. **Alternative libraries**:
   - **QPDF**: Lightweight, good encryption support
   - **PDFium**: More comprehensive, used by Chromium
   - **mupdf**: Lightweight, good performance

## Performance Considerations

- WASM runs single-threaded by default; use Web Workers for large files
- Memory-intensive operations benefit from WASM's speed
- Keep the binary size reasonable for web distribution (~5-10MB max)

## Debugging

Enable debug symbols:

```bash
em++ -g bindings.cpp -o pdf-remover.js -s WASM=1 -s MODULARIZE=1 ...
```

View in browser DevTools with source maps support.

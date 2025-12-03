#!/bin/bash

# WebAssembly build script for pdf-password-remover
# This script compiles the C++ code to WebAssembly using Emscripten

set -e

echo "Building WebAssembly module..."

# Create build directory
mkdir -p build_wasm
cd build_wasm

# Configure with CMake using Emscripten toolchain
emcmake cmake ..

# Build
cmake --build .

# Copy output to the expected location
cp pdf-remover.js* ../../build/

echo "✓ WebAssembly build complete!"
echo "Output files:"
ls -lh ../../build/pdf-remover.*

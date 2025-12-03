cmake_minimum_required(VERSION 3.10)
project(pdf_password_remover_wasm)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add the WASM library
add_executable(pdf-remover.js bindings.cpp)

# Emscripten specific settings
set_target_properties(pdf-remover.js PROPERTIES SUFFIX "")

# Emscripten compiler and linker flags (must be passed as individual strings)
target_compile_options(pdf-remover.js PRIVATE 
    -O3
)

target_link_options(pdf-remover.js PRIVATE
    -O3
    "SHELL:-s WASM=1"
    "SHELL:-s MODULARIZE=1"
    "SHELL:-s EXPORT_ES6=1"
    "SHELL:-s ALLOW_MEMORY_GROWTH=1"
    "SHELL:-s TOTAL_MEMORY=268435456"
    "SHELL:-s ENVIRONMENT=web"
    "--bind"
)

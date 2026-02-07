use image::{load_from_memory, ImageFormat};
use std::io::Cursor;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

/// Converts image data to PNG format
/// Supports JPEG, PNG, and other image formats supported by image-rs
///
/// # Arguments
/// * `image_data` - Raw image bytes
///
/// # Returns
/// PNG image bytes or error message
#[wasm_bindgen]
pub fn convert_heic_to_png(image_data: &[u8]) -> Result<Vec<u8>, String> {
    // Load image from memory
    let img = match load_from_memory(image_data) {
        Ok(i) => i,
        Err(e) => return Err(format!("Failed to decode image: {}", e)),
    };
    
    // Encode as PNG
    let mut png_data = Vec::new();
    match img.write_to(&mut Cursor::new(&mut png_data), ImageFormat::Png) {
        Ok(_) => Ok(png_data),
        Err(e) => Err(format!("Failed to encode PNG: {}", e)),
    }
}

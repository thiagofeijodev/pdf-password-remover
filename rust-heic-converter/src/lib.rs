use heic::{DecoderConfig, PixelLayout};
use image::{load_from_memory, DynamicImage, ImageFormat, RgbaImage};
use std::io::Cursor;
use wasm_bindgen::prelude::*;
use image::imageops::FilterType;
use png::{Encoder, Compression, ColorType, BitDepth};

#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

fn decode_any_to_dynamic_image(image_data: &[u8]) -> Result<DynamicImage, String> {
    if let Ok(decoded) = load_from_memory(image_data) {
        return Ok(decoded);
    }

    let heic_output = DecoderConfig::new()
        .decode(image_data, PixelLayout::Rgba8)
        .map_err(|e| format!("Failed to decode HEIC image: {}", e))?;

    let rgba = RgbaImage::from_raw(heic_output.width, heic_output.height, heic_output.data)
        .ok_or_else(|| "Failed to construct RGBA image buffer from HEIC decode".to_string())?;

    Ok(DynamicImage::ImageRgba8(rgba))
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
    let img = decode_any_to_dynamic_image(image_data)?;
    
    // Encode as PNG
    let mut png_data = Vec::new();
    match img.write_to(&mut Cursor::new(&mut png_data), ImageFormat::Png) {
        Ok(_) => Ok(png_data),
        Err(e) => Err(format!("Failed to encode PNG: {}", e)),
    }
}

/// Convert HEIC to PNG and, if necessary, iteratively resize (keeping aspect)
/// until the produced PNG bytes are <= `max_bytes`.
#[wasm_bindgen]
pub fn convert_heic_to_png_under_size(image_data: &[u8], max_bytes: usize) -> Result<Vec<u8>, String> {
    let mut dyn_img = decode_any_to_dynamic_image(image_data)?;

    // Try several iterations: encode at current size, if too large then downscale and retry
    let mut last_buf = Vec::new();
    let mut width = dyn_img.width();
    let mut height = dyn_img.height();

    // Keep iterating until under size or until image dims reach 1px
    for _ in 0..50 {
        // Convert to RGBA8 bytes
        let rgba = dyn_img.to_rgba8();
        let rgba_buf = rgba.into_raw();
        let bytes = rgba_buf.as_slice();

        // Encode PNG with best compression
        last_buf.clear();
        {
            let mut encoder = Encoder::new(&mut last_buf, width, height);
            encoder.set_color(ColorType::Rgba);
            encoder.set_depth(BitDepth::Eight);
            encoder.set_compression(Compression::Best);
            let mut writer = match encoder.write_header() {
                Ok(w) => w,
                Err(e) => return Err(format!("PNG encoder header error: {}", e)),
            };
            if let Err(e) = writer.write_image_data(bytes) {
                return Err(format!("PNG write error: {}", e));
            }
        }

        if last_buf.len() <= max_bytes {
            return Ok(last_buf.clone());
        }

        // Need to downscale: reduce by factor
        let new_w = ((width as f32) * 0.75).max(1.0) as u32;
        let new_h = ((height as f32) * 0.75).max(1.0) as u32;
        if new_w >= width && new_h >= height { break; }
        let resized = image::imageops::resize(&dyn_img.to_rgba8(), new_w, new_h, FilterType::Lanczos3);
        dyn_img = image::DynamicImage::ImageRgba8(resized);
        width = dyn_img.width();
        height = dyn_img.height();
        // if we've reached 1px in any dimension, stop to avoid infinite loop
        if width <= 1 || height <= 1 { break; }
    }

    // If we exit loop without meeting size, return last produced PNG (possibly > max_bytes)
    Ok(last_buf.clone())
}

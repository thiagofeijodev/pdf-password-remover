use wasm_bindgen::prelude::*;
use lopdf::Document;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn remove_password(pdf_data: &[u8], password: &str) -> Result<Vec<u8>, JsValue> {
    // console_log!("Processing PDF of size: {}", pdf_data.len());

    let mut doc = Document::load_mem(pdf_data)
        .map_err(|e| JsValue::from_str(&format!("Failed to load PDF: {:?}", e)))?;

    if doc.is_encrypted() {
        // console_log!("PDF is encrypted, attempting to decrypt...");
        match doc.decrypt(password.as_bytes()) {
            Ok(_) => {
                // console_log!("Decryption successful");
            },
            Err(e) => {
                return Err(JsValue::from_str(&format!("Failed to decrypt PDF: {:?}", e)));
            }
        }
    } else {
        // console_log!("PDF is not encrypted");
    }

    // To "remove" the password, we just save the document. 
    // lopdf's save methods write the document structure. 
    // If it was decrypted in memory, saving it should write it out without encryption 
    // (unless we explicitly encrypt it again, which we aren't doing).
    // However, we need to make sure we strip the encryption dictionary if it persists.
    // lopdf's decrypt modifies the document state.
    
    // We need to remove the Encrypt dictionary from the trailer to be sure.
    doc.trailer.remove(b"Encrypt");
    
    // Also need to clean up objects if necessary, but usually removing from trailer is enough for readers to treat it as unencrypted.
    
    let mut buffer = Vec::new();
    doc.save_to(&mut buffer)
        .map_err(|e| JsValue::from_str(&format!("Failed to save PDF: {:?}", e)))?;

    Ok(buffer)
}

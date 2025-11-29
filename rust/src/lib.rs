//! High-Performance WASM Parser Library
//!
//! Provides 10-100x faster parsing for CSV, XML (ISO 20022), and SWIFT FIN formats.

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

pub mod csv_parser;
pub mod xml_parser;
pub mod fin_parser;
pub mod types;
pub mod utils;

use types::{ParsedData, ParserConfig, ParseProgress};

/// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn init() {
    // Set up panic hook for better error messages
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Check if WASM module is ready
#[wasm_bindgen]
pub fn is_ready() -> bool {
    true
}

/// Get parser version
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Main parse function - routes to appropriate parser
#[wasm_bindgen]
pub fn parse(data: &str, config_js: JsValue) -> Result<JsValue, JsError> {
    let config: ParserConfig = serde_wasm_bindgen::from_value(config_js)
        .map_err(|e| JsError::new(&format!("Invalid config: {}", e)))?;

    let result = match config.parser_type.as_str() {
        "csv" => csv_parser::parse_csv(data, &config),
        "iso20022" => xml_parser::parse_xml(data, &config),
        "fin" => fin_parser::parse_fin(data, &config),
        _ => csv_parser::parse_csv(data, &config), // Default to CSV
    };

    match result {
        Ok(parsed) => serde_wasm_bindgen::to_value(&parsed)
            .map_err(|e| JsError::new(&format!("Serialization error: {}", e))),
        Err(e) => Err(JsError::new(&e.to_string())),
    }
}

/// Parse CSV with streaming and progress callback
#[wasm_bindgen]
pub fn parse_csv_streaming(
    data: &str,
    config_js: JsValue,
    progress_callback: &js_sys::Function,
) -> Result<JsValue, JsError> {
    let config: ParserConfig = serde_wasm_bindgen::from_value(config_js)
        .map_err(|e| JsError::new(&format!("Invalid config: {}", e)))?;

    let progress_fn = |progress: ParseProgress| {
        if let Ok(progress_js) = serde_wasm_bindgen::to_value(&progress) {
            let _ = progress_callback.call1(&JsValue::NULL, &progress_js);
        }
    };

    let result = csv_parser::parse_csv_with_progress(data, &config, progress_fn);

    match result {
        Ok(parsed) => serde_wasm_bindgen::to_value(&parsed)
            .map_err(|e| JsError::new(&format!("Serialization error: {}", e))),
        Err(e) => Err(JsError::new(&e.to_string())),
    }
}

/// Parse XML (ISO 20022) with streaming
#[wasm_bindgen]
pub fn parse_xml_streaming(
    data: &str,
    config_js: JsValue,
    progress_callback: &js_sys::Function,
) -> Result<JsValue, JsError> {
    let config: ParserConfig = serde_wasm_bindgen::from_value(config_js)
        .map_err(|e| JsError::new(&format!("Invalid config: {}", e)))?;

    let progress_fn = |progress: ParseProgress| {
        if let Ok(progress_js) = serde_wasm_bindgen::to_value(&progress) {
            let _ = progress_callback.call1(&JsValue::NULL, &progress_js);
        }
    };

    let result = xml_parser::parse_xml_with_progress(data, &config, progress_fn);

    match result {
        Ok(parsed) => serde_wasm_bindgen::to_value(&parsed)
            .map_err(|e| JsError::new(&format!("Serialization error: {}", e))),
        Err(e) => Err(JsError::new(&e.to_string())),
    }
}

/// Detect parser type from data
#[wasm_bindgen]
pub fn detect_parser_type(data: &str) -> String {
    utils::detect_type(data).to_string()
}

/// Suggest CSV delimiter
#[wasm_bindgen]
pub fn suggest_delimiter(data: &str) -> String {
    utils::suggest_csv_delimiter(data).to_string()
}

/// Benchmark parsing speed (for testing)
#[wasm_bindgen]
pub fn benchmark_csv(data: &str, iterations: u32) -> f64 {
    let config = ParserConfig::default();
    let start = web_sys::window()
        .and_then(|w| w.performance())
        .map(|p| p.now())
        .unwrap_or(0.0);

    for _ in 0..iterations {
        let _ = csv_parser::parse_csv(data, &config);
    }

    let end = web_sys::window()
        .and_then(|w| w.performance())
        .map(|p| p.now())
        .unwrap_or(0.0);

    (end - start) / iterations as f64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_ready() {
        assert!(is_ready());
    }

    #[test]
    fn test_version() {
        assert!(!get_version().is_empty());
    }
}

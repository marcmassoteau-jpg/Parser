//! Shared types for WASM parsers
//! These mirror the TypeScript types for seamless interop

use serde::{Deserialize, Serialize};

/// Parser configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParserConfig {
    #[serde(rename = "type")]
    pub parser_type: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    // CSV specific
    #[serde(default = "default_delimiter")]
    pub delimiter: String,
    #[serde(default = "default_true")]
    pub has_header: bool,
    #[serde(default = "default_quote_char")]
    pub quote_char: String,
    #[serde(default = "default_escape_char")]
    pub escape_char: String,
    // Fixed width specific
    #[serde(default)]
    pub field_definitions: Option<Vec<FieldDefinition>>,
    // FIN specific
    #[serde(default)]
    pub message_type: Option<String>,
    // Performance options
    #[serde(default)]
    pub chunk_size: Option<usize>,
    #[serde(default)]
    pub encoding: Option<String>,
}

fn default_delimiter() -> String {
    ",".to_string()
}

fn default_quote_char() -> String {
    "\"".to_string()
}

fn default_escape_char() -> String {
    "\\".to_string()
}

fn default_true() -> bool {
    true
}

impl Default for ParserConfig {
    fn default() -> Self {
        Self {
            parser_type: "csv".to_string(),
            name: "Parser".to_string(),
            description: None,
            delimiter: ",".to_string(),
            has_header: true,
            quote_char: "\"".to_string(),
            escape_char: "\\".to_string(),
            field_definitions: None,
            message_type: None,
            chunk_size: None,
            encoding: None,
        }
    }
}

/// Field definition for fixed-width parsing
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldDefinition {
    pub id: String,
    pub name: String,
    pub start: usize,
    pub length: usize,
    #[serde(rename = "type")]
    pub field_type: String,
    #[serde(default)]
    pub format: Option<String>,
    #[serde(default)]
    pub required: bool,
    #[serde(default)]
    pub description: Option<String>,
}

/// Parsed field
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParsedField {
    pub id: String,
    pub name: String,
    pub value: FieldValue,
    #[serde(rename = "type")]
    pub field_type: String,
    pub original_value: String,
    #[serde(default)]
    pub position: Option<Position>,
}

/// Field value - can be string, number, boolean, or null
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum FieldValue {
    String(String),
    Number(f64),
    Integer(i64),
    Boolean(bool),
    Null,
}

impl From<&str> for FieldValue {
    fn from(s: &str) -> Self {
        FieldValue::String(s.to_string())
    }
}

impl From<String> for FieldValue {
    fn from(s: String) -> Self {
        FieldValue::String(s)
    }
}

impl From<f64> for FieldValue {
    fn from(n: f64) -> Self {
        FieldValue::Number(n)
    }
}

impl From<i64> for FieldValue {
    fn from(n: i64) -> Self {
        FieldValue::Integer(n)
    }
}

impl From<bool> for FieldValue {
    fn from(b: bool) -> Self {
        FieldValue::Boolean(b)
    }
}

/// Position in source
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub start: usize,
    pub end: usize,
}

/// Parsed record
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParsedRecord {
    pub id: String,
    pub index: usize,
    pub fields: Vec<ParsedField>,
    pub raw: String,
    #[serde(rename = "type")]
    pub record_type: String, // header, transaction, footer, data
    pub is_valid: bool,
    #[serde(default)]
    pub errors: Option<Vec<String>>,
}

/// Full parsed data result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParsedData {
    pub id: String,
    pub config: ParserConfig,
    pub records: Vec<ParsedRecord>,
    #[serde(default)]
    pub headers: Option<Vec<String>>,
    pub metadata: ParseMetadata,
}

/// Parse metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParseMetadata {
    pub total_records: usize,
    pub valid_records: usize,
    pub invalid_records: usize,
    pub parse_time: f64, // milliseconds
    #[serde(default)]
    pub file_size: Option<usize>,
    #[serde(default)]
    pub file_name: Option<String>,
    #[serde(default)]
    pub encoding: Option<String>,
    #[serde(default = "default_wasm")]
    pub parser_engine: String,
    #[serde(default)]
    pub chunks_processed: Option<usize>,
}

fn default_wasm() -> String {
    "wasm".to_string()
}

impl Default for ParseMetadata {
    fn default() -> Self {
        Self {
            total_records: 0,
            valid_records: 0,
            invalid_records: 0,
            parse_time: 0.0,
            file_size: None,
            file_name: None,
            encoding: None,
            parser_engine: "wasm".to_string(),
            chunks_processed: None,
        }
    }
}

/// Progress reporting
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParseProgress {
    pub phase: String, // initializing, detecting, parsing, finalizing, complete, error, cancelled
    pub bytes_processed: usize,
    pub total_bytes: usize,
    pub records_processed: usize,
    pub percentage: u8,
    #[serde(default)]
    pub current_chunk: Option<usize>,
    #[serde(default)]
    pub total_chunks: Option<usize>,
    #[serde(default)]
    pub estimated_time_remaining: Option<f64>,
    #[serde(default)]
    pub message: Option<String>,
}

impl ParseProgress {
    pub fn new(phase: &str, bytes_processed: usize, total_bytes: usize, records: usize) -> Self {
        let percentage = if total_bytes > 0 {
            ((bytes_processed as f64 / total_bytes as f64) * 100.0) as u8
        } else {
            0
        };

        Self {
            phase: phase.to_string(),
            bytes_processed,
            total_bytes,
            records_processed: records,
            percentage,
            current_chunk: None,
            total_chunks: None,
            estimated_time_remaining: None,
            message: None,
        }
    }

    pub fn with_message(mut self, message: &str) -> Self {
        self.message = Some(message.to_string());
        self
    }
}

/// Parser error types
#[derive(Debug, Clone, thiserror::Error)]
pub enum ParseError {
    #[error("Invalid CSV: {0}")]
    CsvError(String),

    #[error("Invalid XML: {0}")]
    XmlError(String),

    #[error("Invalid FIN message: {0}")]
    FinError(String),

    #[error("Encoding error: {0}")]
    EncodingError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Parse cancelled")]
    Cancelled,
}

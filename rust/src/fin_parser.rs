//! SWIFT FIN Message Parser
//!
//! High-performance parser for SWIFT MT messages (MT103, MT202, MT940, etc.)

use crate::types::*;
use regex::Regex;
use std::collections::HashMap;

/// SWIFT field tag mappings
lazy_static::lazy_static! {
    static ref FIN_FIELD_NAMES: HashMap<&'static str, &'static str> = {
        let mut m = HashMap::new();
        m.insert("20", "Transaction Reference Number");
        m.insert("21", "Related Reference");
        m.insert("23B", "Bank Operation Code");
        m.insert("23E", "Instruction Code");
        m.insert("25", "Account Identification");
        m.insert("25P", "Account Identification with Party");
        m.insert("28C", "Statement Number/Sequence Number");
        m.insert("32A", "Value Date/Currency/Amount");
        m.insert("33B", "Currency/Instructed Amount");
        m.insert("36", "Exchange Rate");
        m.insert("50A", "Ordering Customer (Account)");
        m.insert("50F", "Ordering Customer (Party)");
        m.insert("50K", "Ordering Customer (Name & Address)");
        m.insert("51A", "Sending Institution");
        m.insert("52A", "Ordering Institution (Account)");
        m.insert("52D", "Ordering Institution (Name & Address)");
        m.insert("53A", "Sender's Correspondent (Account)");
        m.insert("53B", "Sender's Correspondent (Location)");
        m.insert("53D", "Sender's Correspondent (Name & Address)");
        m.insert("54A", "Receiver's Correspondent (Account)");
        m.insert("54B", "Receiver's Correspondent (Location)");
        m.insert("54D", "Receiver's Correspondent (Name & Address)");
        m.insert("55A", "Third Reimbursement Institution (Account)");
        m.insert("55B", "Third Reimbursement Institution (Location)");
        m.insert("55D", "Third Reimbursement Institution (Name & Address)");
        m.insert("56A", "Intermediary Institution (Account)");
        m.insert("56C", "Intermediary Institution (Account)");
        m.insert("56D", "Intermediary Institution (Name & Address)");
        m.insert("57A", "Account With Institution (Account)");
        m.insert("57B", "Account With Institution (Location)");
        m.insert("57C", "Account With Institution (Account)");
        m.insert("57D", "Account With Institution (Name & Address)");
        m.insert("59", "Beneficiary Customer");
        m.insert("59A", "Beneficiary Customer (Account)");
        m.insert("59F", "Beneficiary Customer (Party)");
        m.insert("60F", "Opening Balance");
        m.insert("60M", "Opening Balance (Intermediate)");
        m.insert("61", "Statement Line");
        m.insert("62F", "Closing Balance");
        m.insert("62M", "Closing Balance (Intermediate)");
        m.insert("64", "Closing Available Balance");
        m.insert("65", "Forward Available Balance");
        m.insert("70", "Remittance Information");
        m.insert("71A", "Details of Charges");
        m.insert("71F", "Sender's Charges");
        m.insert("71G", "Receiver's Charges");
        m.insert("72", "Sender to Receiver Information");
        m.insert("77B", "Regulatory Reporting");
        m.insert("77T", "Envelope Contents");
        m.insert("86", "Information to Account Owner");
        m
    };

    static ref BLOCK_REGEX: Regex = Regex::new(r"\{(\d):([^}]*)\}").unwrap();
    static ref FIELD_REGEX: Regex = Regex::new(r":(\d{2}[A-Z]?):([^:]+?)(?=:\d{2}[A-Z]?:|$)").unwrap();
}

/// Parse SWIFT FIN message
pub fn parse_fin(data: &str, config: &ParserConfig) -> Result<ParsedData, ParseError> {
    let start_time = get_time();
    let total_bytes = data.len();

    let mut records = Vec::new();
    let mut headers = std::collections::HashSet::new();
    let mut record_index = 0usize;

    // Parse SWIFT blocks
    let blocks = parse_blocks(data);

    // Block 1: Basic Header
    if let Some(block1) = blocks.get("1") {
        let fields = parse_block1(block1);
        for field in &fields {
            headers.insert(field.name.clone());
        }
        records.push(ParsedRecord {
            id: format!("record-{}", record_index),
            index: record_index,
            fields,
            raw: format!("{{1:{}}}", block1),
            record_type: "header".to_string(),
            is_valid: true,
            errors: None,
        });
        record_index += 1;
    }

    // Block 2: Application Header
    if let Some(block2) = blocks.get("2") {
        let fields = parse_block2(block2);
        for field in &fields {
            headers.insert(field.name.clone());
        }
        records.push(ParsedRecord {
            id: format!("record-{}", record_index),
            index: record_index,
            fields,
            raw: format!("{{2:{}}}", block2),
            record_type: "header".to_string(),
            is_valid: true,
            errors: None,
        });
        record_index += 1;
    }

    // Block 3: User Header (optional)
    if let Some(block3) = blocks.get("3") {
        let fields = parse_block3(block3);
        for field in &fields {
            headers.insert(field.name.clone());
        }
        records.push(ParsedRecord {
            id: format!("record-{}", record_index),
            index: record_index,
            fields,
            raw: format!("{{3:{}}}", block3),
            record_type: "header".to_string(),
            is_valid: true,
            errors: None,
        });
        record_index += 1;
    }

    // Block 4: Text Block (Message Content)
    if let Some(block4) = blocks.get("4") {
        let message_fields = parse_block4(block4);

        for field_group in message_fields {
            for field in &field_group {
                headers.insert(field.name.clone());
            }
            records.push(ParsedRecord {
                id: format!("record-{}", record_index),
                index: record_index,
                fields: field_group,
                raw: block4.clone(),
                record_type: "transaction".to_string(),
                is_valid: true,
                errors: None,
            });
            record_index += 1;
        }
    }

    // Block 5: Trailer
    if let Some(block5) = blocks.get("5") {
        let fields = parse_block5(block5);
        for field in &fields {
            headers.insert(field.name.clone());
        }
        records.push(ParsedRecord {
            id: format!("record-{}", record_index),
            index: record_index,
            fields,
            raw: format!("{{5:{}}}", block5),
            record_type: "footer".to_string(),
            is_valid: true,
            errors: None,
        });
    }

    let end_time = get_time();

    Ok(ParsedData {
        id: format!("parsed-{}", js_sys::Date::now() as u64),
        config: config.clone(),
        records,
        headers: Some(headers.into_iter().collect()),
        metadata: ParseMetadata {
            total_records: record_index,
            valid_records: record_index,
            invalid_records: 0,
            parse_time: end_time - start_time,
            file_size: Some(total_bytes),
            parser_engine: "wasm".to_string(),
            ..Default::default()
        },
    })
}

/// Parse SWIFT blocks from raw message
fn parse_blocks(data: &str) -> HashMap<String, String> {
    let mut blocks = HashMap::new();

    for cap in BLOCK_REGEX.captures_iter(data) {
        let block_num = cap.get(1).map(|m| m.as_str()).unwrap_or("");
        let block_content = cap.get(2).map(|m| m.as_str()).unwrap_or("");
        blocks.insert(block_num.to_string(), block_content.to_string());
    }

    // Handle Block 4 which may span multiple lines with different format
    if !blocks.contains_key("4") {
        // Try alternate format: {4:\n...-}
        let block4_regex = Regex::new(r"\{4:\s*\n([\s\S]*?)-\}").unwrap();
        if let Some(cap) = block4_regex.captures(data) {
            blocks.insert("4".to_string(), cap.get(1).map(|m| m.as_str()).unwrap_or("").to_string());
        }
    }

    blocks
}

/// Parse Block 1: Basic Header
fn parse_block1(content: &str) -> Vec<ParsedField> {
    let mut fields = Vec::new();
    let chars: Vec<char> = content.chars().collect();

    if chars.len() >= 1 {
        fields.push(create_field(0, "Application ID", &chars[0..1].iter().collect::<String>()));
    }
    if chars.len() >= 3 {
        fields.push(create_field(1, "Service ID", &chars[1..3].iter().collect::<String>()));
    }
    if chars.len() >= 15 {
        fields.push(create_field(2, "Logical Terminal", &chars[3..15].iter().collect::<String>()));
    }
    if chars.len() >= 16 {
        fields.push(create_field(3, "Session Number", &chars[15..19].iter().collect::<String>()));
    }
    if chars.len() >= 25 {
        fields.push(create_field(4, "Sequence Number", &chars[19..25].iter().collect::<String>()));
    }

    fields
}

/// Parse Block 2: Application Header
fn parse_block2(content: &str) -> Vec<ParsedField> {
    let mut fields = Vec::new();
    let chars: Vec<char> = content.chars().collect();

    if chars.is_empty() {
        return fields;
    }

    let direction = chars[0];
    fields.push(create_field(0, "Direction", if direction == 'I' { "Input" } else { "Output" }));

    if direction == 'I' && chars.len() >= 4 {
        fields.push(create_field(1, "Message Type", &chars[1..4].iter().collect::<String>()));
        if chars.len() >= 16 {
            fields.push(create_field(2, "Destination", &chars[4..16].iter().collect::<String>()));
        }
    } else if direction == 'O' && chars.len() >= 4 {
        fields.push(create_field(1, "Message Type", &chars[1..4].iter().collect::<String>()));
        if chars.len() >= 8 {
            fields.push(create_field(2, "Input Time", &chars[4..8].iter().collect::<String>()));
        }
    }

    fields
}

/// Parse Block 3: User Header
fn parse_block3(content: &str) -> Vec<ParsedField> {
    let mut fields = Vec::new();
    let field_regex = Regex::new(r"\{(\d{3}):([^}]*)\}").unwrap();

    for (idx, cap) in field_regex.captures_iter(content).enumerate() {
        let tag = cap.get(1).map(|m| m.as_str()).unwrap_or("");
        let value = cap.get(2).map(|m| m.as_str()).unwrap_or("");

        let name = match tag {
            "103" => "Service Type Identifier",
            "108" => "Message User Reference",
            "111" => "Service Type Identifier",
            "113" => "Banking Priority",
            "115" => "Addressee Information",
            "119" => "Validation Flag",
            "121" => "Unique End-to-End Transaction Reference",
            "165" => "Payment Release Information",
            "433" => "Sanctions Screening Information",
            "434" => "Payment Controls Information",
            _ => tag,
        };

        fields.push(create_field(idx, name, value));
    }

    fields
}

/// Parse Block 4: Message Content
fn parse_block4(content: &str) -> Vec<Vec<ParsedField>> {
    let mut field_groups = Vec::new();
    let mut current_group = Vec::new();
    let mut field_idx = 0;

    for cap in FIELD_REGEX.captures_iter(content) {
        let tag = cap.get(1).map(|m| m.as_str()).unwrap_or("");
        let value = cap.get(2).map(|m| m.as_str()).unwrap_or("").trim();

        let name = FIN_FIELD_NAMES
            .get(tag)
            .map(|s| s.to_string())
            .unwrap_or_else(|| format!("Field {}", tag));

        current_group.push(ParsedField {
            id: format!("field-4-{}", field_idx),
            name: name.clone(),
            value: FieldValue::String(value.to_string()),
            field_type: infer_fin_type(tag, value),
            original_value: format!(":{}: {}", tag, value),
            position: None,
        });

        field_idx += 1;

        // Group certain fields together
        if is_group_boundary(tag) && !current_group.is_empty() {
            field_groups.push(std::mem::take(&mut current_group));
        }
    }

    if !current_group.is_empty() {
        field_groups.push(current_group);
    }

    if field_groups.is_empty() {
        field_groups.push(Vec::new());
    }

    field_groups
}

/// Parse Block 5: Trailer
fn parse_block5(content: &str) -> Vec<ParsedField> {
    let mut fields = Vec::new();
    let field_regex = Regex::new(r"\{([A-Z]{3}):([^}]*)\}").unwrap();

    for (idx, cap) in field_regex.captures_iter(content).enumerate() {
        let tag = cap.get(1).map(|m| m.as_str()).unwrap_or("");
        let value = cap.get(2).map(|m| m.as_str()).unwrap_or("");

        let name = match tag {
            "CHK" => "Checksum",
            "TNG" => "Training",
            "PDE" => "Possible Duplicate Emission",
            "DLM" => "Delayed Message",
            "MRF" => "Message Reference",
            "PDM" => "Possible Duplicate Message",
            "SYS" => "System Originated Message",
            _ => tag,
        };

        fields.push(create_field(idx, name, value));
    }

    fields
}

/// Create a parsed field
fn create_field(idx: usize, name: &str, value: &str) -> ParsedField {
    ParsedField {
        id: format!("field-{}", idx),
        name: name.to_string(),
        value: FieldValue::String(value.to_string()),
        field_type: "string".to_string(),
        original_value: value.to_string(),
        position: None,
    }
}

/// Check if tag marks a field group boundary
fn is_group_boundary(tag: &str) -> bool {
    matches!(tag, "59" | "59A" | "59F" | "61" | "86")
}

/// Infer field type from tag and value
fn infer_fin_type(tag: &str, value: &str) -> String {
    match tag {
        "32A" | "33B" | "60F" | "60M" | "62F" | "62M" | "64" | "65" => {
            // Amount fields
            if value.contains(|c: char| c.is_ascii_digit()) {
                "number".to_string()
            } else {
                "string".to_string()
            }
        }
        _ => "string".to_string(),
    }
}

/// Get current time in milliseconds
fn get_time() -> f64 {
    web_sys::window()
        .and_then(|w| w.performance())
        .map(|p| p.now())
        .unwrap_or(0.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_blocks() {
        let data = "{1:F01BANKUS33AXXX0000000000}{2:I103BANKGB2LXXXXN}";
        let blocks = parse_blocks(data);
        assert!(blocks.contains_key("1"));
        assert!(blocks.contains_key("2"));
    }

    #[test]
    fn test_parse_block1() {
        let content = "F01BANKUS33AXXX0000000000";
        let fields = parse_block1(content);
        assert!(!fields.is_empty());
        assert_eq!(fields[0].name, "Application ID");
    }
}

//! Utility functions for parser detection and helpers

/// Detect parser type from data content
pub fn detect_type(data: &str) -> &'static str {
    let trimmed = data.trim();

    // Check for XML (ISO 20022)
    if trimmed.starts_with("<?xml")
        || trimmed.starts_with("<Document")
        || trimmed.starts_with("<pain")
        || trimmed.starts_with("<camt")
        || trimmed.starts_with("<pacs")
    {
        return "iso20022";
    }

    // Check for SWIFT FIN message
    if trimmed.starts_with("{1:") || trimmed.contains("{4:") {
        return "fin";
    }

    // Check for CSV (has common delimiters)
    let first_line = trimmed.lines().next().unwrap_or("");
    let comma_count = first_line.matches(',').count();
    let semicolon_count = first_line.matches(';').count();
    let tab_count = first_line.matches('\t').count();
    let pipe_count = first_line.matches('|').count();

    if comma_count >= 2 || semicolon_count >= 2 || tab_count >= 2 || pipe_count >= 2 {
        return "csv";
    }

    // Check for fixed width (consistent line lengths)
    let lines: Vec<&str> = trimmed.lines().filter(|l| !l.is_empty()).collect();
    if lines.len() >= 3 {
        let lengths: Vec<usize> = lines.iter().take(10).map(|l| l.len()).collect();
        let avg_length: f64 = lengths.iter().sum::<usize>() as f64 / lengths.len() as f64;
        let all_similar = lengths.iter().all(|&l| (l as f64 - avg_length).abs() < 5.0);
        if all_similar && avg_length > 20.0 {
            return "fixed-width";
        }
    }

    // Default to custom
    "custom"
}

/// Suggest best CSV delimiter
pub fn suggest_csv_delimiter(data: &str) -> char {
    let first_lines: String = data.lines().take(5).collect::<Vec<_>>().join("\n");
    let delimiters = [',', ';', '\t', '|'];

    let mut best_delimiter = ',';
    let mut max_count = 0;

    for delimiter in delimiters {
        let count = first_lines.matches(delimiter).count();
        if count > max_count {
            max_count = count;
            best_delimiter = delimiter;
        }
    }

    best_delimiter
}

/// Calculate file size efficiently
pub fn calculate_size(data: &str) -> usize {
    data.len()
}

/// Generate unique ID
pub fn generate_id(prefix: &str) -> String {
    format!("{}-{}", prefix, js_sys::Date::now() as u64)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_csv() {
        let data = "name,age,city\nAlice,30,Paris";
        assert_eq!(detect_type(data), "csv");
    }

    #[test]
    fn test_detect_xml() {
        let data = "<?xml version=\"1.0\"?><Document></Document>";
        assert_eq!(detect_type(data), "iso20022");
    }

    #[test]
    fn test_detect_fin() {
        let data = "{1:F01BANK}{2:I103}";
        assert_eq!(detect_type(data), "fin");
    }

    #[test]
    fn test_suggest_delimiter() {
        assert_eq!(suggest_csv_delimiter("a,b,c\n1,2,3"), ',');
        assert_eq!(suggest_csv_delimiter("a;b;c\n1;2;3"), ';');
        assert_eq!(suggest_csv_delimiter("a\tb\tc\n1\t2\t3"), '\t');
    }
}

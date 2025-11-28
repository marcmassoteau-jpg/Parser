import type { ParserConfig, ParsedData, ParsedRecord, ParsedField, FieldDefinition } from '../types/parser'

export function parseFixedWidth(data: string, config: ParserConfig): ParsedData {
  const startTime = performance.now()
  const lines = data.split(/\r?\n/).filter((line) => line.trim().length > 0)
  const fieldDefs = config.fieldDefinitions || []

  if (fieldDefs.length === 0) {
    // Auto-detect field widths based on whitespace patterns
    const detectedFields = autoDetectFields(lines)
    fieldDefs.push(...detectedFields)
  }

  const records: ParsedRecord[] = lines.map((line, index) => {
    const fields: ParsedField[] = fieldDefs.map((def) => {
      const rawValue = line.substring(def.start, def.start + def.length)
      const value = parseFieldValue(rawValue.trim(), def)

      return {
        id: `field-${index}-${def.id}`,
        name: def.name,
        value,
        type: def.type,
        originalValue: rawValue,
        position: { start: def.start, end: def.start + def.length },
      }
    })

    const errors: string[] = []
    fieldDefs.forEach((def, fieldIndex) => {
      if (def.required && !fields[fieldIndex].value) {
        errors.push(`Required field "${def.name}" is empty`)
      }
    })

    return {
      id: `record-${index}`,
      index,
      fields,
      raw: line,
      type: determineRecordType(line, index, lines.length),
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  })

  const endTime = performance.now()
  const headers = fieldDefs.map((def) => def.name)

  return {
    id: `parsed-${Date.now()}`,
    config: { ...config, fieldDefinitions: fieldDefs },
    records,
    headers,
    metadata: {
      totalRecords: records.length,
      validRecords: records.filter((r) => r.isValid).length,
      invalidRecords: records.filter((r) => !r.isValid).length,
      parseTime: endTime - startTime,
      fileSize: new Blob([data]).size,
    },
  }
}

function parseFieldValue(value: string, def: FieldDefinition): string | number | boolean | null {
  if (!value) return null

  switch (def.type) {
    case 'number':
      const num = parseFloat(value.replace(/,/g, ''))
      return isNaN(num) ? null : num
    case 'boolean':
      return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'y'
    case 'date':
      return value // Keep as string, format can be applied later
    default:
      return value
  }
}

function determineRecordType(line: string, index: number, total: number): 'header' | 'transaction' | 'footer' | 'data' {
  // Common patterns for headers/footers in fixed-width files
  const headerPatterns = [/^HDR/i, /^HEADER/i, /^H /]
  const footerPatterns = [/^TRL/i, /^TRAILER/i, /^T /, /^EOF/i]
  const transactionPatterns = [/^TXN/i, /^DTL/i, /^D /]

  if (index === 0 || headerPatterns.some((p) => p.test(line))) {
    return 'header'
  }
  if (index === total - 1 || footerPatterns.some((p) => p.test(line))) {
    return 'footer'
  }
  if (transactionPatterns.some((p) => p.test(line))) {
    return 'transaction'
  }
  return 'data'
}

function autoDetectFields(lines: string[]): FieldDefinition[] {
  if (lines.length === 0) return []

  // Analyze the first few lines to detect field boundaries
  const sampleLines = lines.slice(0, Math.min(10, lines.length))
  const maxLength = Math.max(...sampleLines.map((l) => l.length))

  // Find positions where multiple consecutive spaces occur
  const boundaries: number[] = [0]
  const spaceCount: number[] = new Array(maxLength).fill(0)

  sampleLines.forEach((line) => {
    for (let i = 0; i < line.length; i++) {
      if (line[i] === ' ') {
        spaceCount[i]++
      }
    }
  })

  // Detect boundaries where most lines have spaces
  const threshold = sampleLines.length * 0.7
  let inSpace = false
  for (let i = 0; i < maxLength; i++) {
    if (spaceCount[i] >= threshold && !inSpace) {
      inSpace = true
    } else if (spaceCount[i] < threshold && inSpace) {
      boundaries.push(i)
      inSpace = false
    }
  }
  boundaries.push(maxLength)

  // Create field definitions
  return boundaries.slice(0, -1).map((start, index) => {
    const end = boundaries[index + 1]
    return {
      id: `field-${index}`,
      name: `Field ${index + 1}`,
      start,
      length: end - start,
      type: 'string' as const,
    }
  })
}

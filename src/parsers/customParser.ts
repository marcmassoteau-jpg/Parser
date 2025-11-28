import type { ParserConfig, ParsedData, ParsedRecord, ParsedField } from '../types/parser'

export function parseCustom(data: string, config: ParserConfig): ParsedData {
  const startTime = performance.now()

  // If a custom parse function is provided, use it
  if (config.parseFunction) {
    try {
      // Create a safe function context with limited access
      const parseFunc = new Function('data', 'config', `
        'use strict';
        ${config.parseFunction}
        return parse(data, config);
      `)
      const result = parseFunc(data, config)
      if (isValidParsedData(result)) {
        return {
          ...result,
          metadata: {
            ...result.metadata,
            parseTime: performance.now() - startTime,
          },
        }
      }
    } catch (error) {
      return createErrorResult(
        config,
        startTime,
        `Custom parser error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Pattern-based parsing
  if (config.customPattern) {
    return parseWithPattern(data, config, startTime)
  }

  // Default: line-by-line parsing with auto-detection
  return parseGeneric(data, config, startTime)
}

function parseWithPattern(data: string, config: ParserConfig, startTime: number): ParsedData {
  const records: ParsedRecord[] = []
  const headers: Set<string> = new Set()

  try {
    const pattern = new RegExp(config.customPattern!, 'gm')
    let match
    let index = 0

    while ((match = pattern.exec(data)) !== null) {
      const fields: ParsedField[] = []

      // Named groups or indexed groups
      if (match.groups) {
        Object.entries(match.groups).forEach(([name, value], fieldIndex) => {
          headers.add(name)
          fields.push({
            id: `field-${index}-${fieldIndex}`,
            name,
            value: value ?? null,
            type: inferType(value),
            originalValue: value ?? '',
          })
        })
      } else {
        match.slice(1).forEach((value, fieldIndex) => {
          const name = `Group ${fieldIndex + 1}`
          headers.add(name)
          fields.push({
            id: `field-${index}-${fieldIndex}`,
            name,
            value: value ?? null,
            type: inferType(value),
            originalValue: value ?? '',
          })
        })
      }

      records.push({
        id: `record-${index}`,
        index,
        fields,
        raw: match[0],
        type: 'data',
        isValid: true,
      })
      index++
    }
  } catch (error) {
    return createErrorResult(
      config,
      startTime,
      `Pattern error: ${error instanceof Error ? error.message : 'Invalid regex pattern'}`
    )
  }

  return {
    id: `parsed-${Date.now()}`,
    config,
    records,
    headers: Array.from(headers),
    metadata: {
      totalRecords: records.length,
      validRecords: records.length,
      invalidRecords: 0,
      parseTime: performance.now() - startTime,
      fileSize: new Blob([data]).size,
    },
  }
}

function parseGeneric(data: string, config: ParserConfig, startTime: number): ParsedData {
  const lines = data.split(/\r?\n/)
  const records: ParsedRecord[] = []
  const headers: string[] = []

  // Try to detect structure
  const structure = detectStructure(lines)

  lines.forEach((line, index) => {
    if (line.trim() === '') return

    const fields: ParsedField[] = []

    if (structure.type === 'key-value') {
      // Key-value pair format (e.g., "Key: Value" or "Key=Value")
      const pairs = parseKeyValuePairs(line, structure.separator)
      pairs.forEach(({ key, value }, fieldIndex) => {
        if (!headers.includes(key)) headers.push(key)
        fields.push({
          id: `field-${index}-${fieldIndex}`,
          name: key,
          value,
          type: inferType(value),
          originalValue: value,
        })
      })
    } else if (structure.type === 'json-lines') {
      // JSON Lines format
      try {
        const obj = JSON.parse(line)
        Object.entries(obj).forEach(([key, value], fieldIndex) => {
          if (!headers.includes(key)) headers.push(key)
          fields.push({
            id: `field-${index}-${fieldIndex}`,
            name: key,
            value: typeof value === 'object' ? JSON.stringify(value) : value as string | number | boolean,
            type: typeof value === 'object' ? 'string' : inferType(value),
            originalValue: String(value),
          })
        })
      } catch {
        fields.push({
          id: `field-${index}-0`,
          name: 'Raw',
          value: line,
          type: 'string',
          originalValue: line,
        })
        if (!headers.includes('Raw')) headers.push('Raw')
      }
    } else {
      // Plain text lines
      fields.push({
        id: `field-${index}-0`,
        name: `Line ${index + 1}`,
        value: line,
        type: 'string',
        originalValue: line,
      })
      if (!headers.includes(`Line ${index + 1}`)) headers.push(`Line ${index + 1}`)
    }

    records.push({
      id: `record-${index}`,
      index,
      fields,
      raw: line,
      type: determineLineType(line, index, lines.length),
      isValid: true,
    })
  })

  return {
    id: `parsed-${Date.now()}`,
    config,
    records,
    headers,
    metadata: {
      totalRecords: records.length,
      validRecords: records.length,
      invalidRecords: 0,
      parseTime: performance.now() - startTime,
      fileSize: new Blob([data]).size,
    },
  }
}

function detectStructure(lines: string[]): { type: 'key-value' | 'json-lines' | 'plain'; separator?: string } {
  const sampleLines = lines.filter((l) => l.trim()).slice(0, 10)

  // Check for JSON Lines
  if (sampleLines.every((line) => {
    try {
      JSON.parse(line)
      return true
    } catch {
      return false
    }
  })) {
    return { type: 'json-lines' }
  }

  // Check for key-value pairs
  const kvPatterns = [
    { pattern: /^[\w\s]+:\s*.+$/, separator: ':' },
    { pattern: /^[\w\s]+=.+$/, separator: '=' },
  ]

  for (const { pattern, separator } of kvPatterns) {
    if (sampleLines.filter((line) => pattern.test(line)).length > sampleLines.length * 0.5) {
      return { type: 'key-value', separator }
    }
  }

  return { type: 'plain' }
}

function parseKeyValuePairs(line: string, separator: string = ':'): { key: string; value: string }[] {
  const pairs: { key: string; value: string }[] = []

  // Handle multiple key-value pairs on the same line
  const regex = new RegExp(`([^${separator}]+)${separator}\\s*([^${separator}]+?)(?=\\s+[^${separator}]+${separator}|$)`, 'g')
  let match

  while ((match = regex.exec(line)) !== null) {
    pairs.push({
      key: match[1].trim(),
      value: match[2].trim(),
    })
  }

  // Fallback to simple split if regex didn't match
  if (pairs.length === 0) {
    const parts = line.split(separator)
    if (parts.length >= 2) {
      pairs.push({
        key: parts[0].trim(),
        value: parts.slice(1).join(separator).trim(),
      })
    }
  }

  return pairs
}

function determineLineType(line: string, index: number, total: number): 'header' | 'transaction' | 'footer' | 'data' {
  const lowerLine = line.toLowerCase()

  if (index === 0 || lowerLine.includes('header') || lowerLine.startsWith('#')) {
    return 'header'
  }
  if (index === total - 1 || lowerLine.includes('footer') || lowerLine.includes('trailer')) {
    return 'footer'
  }
  if (lowerLine.includes('transaction') || lowerLine.includes('txn')) {
    return 'transaction'
  }
  return 'data'
}

function inferType(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'

  const strValue = String(value)
  if (!isNaN(Number(strValue)) && strValue.trim() !== '') return 'number'
  if (strValue.toLowerCase() === 'true' || strValue.toLowerCase() === 'false') return 'boolean'

  return 'string'
}

function isValidParsedData(result: unknown): result is ParsedData {
  if (typeof result !== 'object' || result === null) return false
  const data = result as Record<string, unknown>
  return (
    'records' in data &&
    Array.isArray(data.records) &&
    'metadata' in data &&
    typeof data.metadata === 'object'
  )
}

function createErrorResult(config: ParserConfig, startTime: number, error: string): ParsedData {
  return {
    id: `parsed-${Date.now()}`,
    config,
    records: [{
      id: 'error-record',
      index: 0,
      fields: [{ id: 'error', name: 'Error', value: error, type: 'string', originalValue: error }],
      raw: '',
      type: 'data',
      isValid: false,
      errors: [error],
    }],
    headers: ['Error'],
    metadata: {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 1,
      parseTime: performance.now() - startTime,
    },
  }
}

import Papa from 'papaparse'
import type { ParserConfig, ParsedData, ParsedRecord, ParsedField } from '../types/parser'

export function parseCSV(data: string, config: ParserConfig): ParsedData {
  const startTime = performance.now()

  const result = Papa.parse(data, {
    delimiter: config.delimiter || ',',
    header: config.hasHeader ?? true,
    quoteChar: config.quoteChar || '"',
    escapeChar: config.escapeChar || '\\',
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  const firstRow = result.data[0] as string[] | Record<string, string> | undefined
  const headers: string[] = config.hasHeader
    ? (result.meta.fields || [])
    : (Array.isArray(firstRow) ? firstRow.map((_: unknown, i: number) => `Column ${i + 1}`) : [])

  const records: ParsedRecord[] = (result.data as Array<Record<string, string> | string[]>).map((row, index) => {
    const fields: ParsedField[] = headers.map((header: string, fieldIndex: number) => {
      const value = config.hasHeader
        ? (row as Record<string, string>)[header]
        : (row as string[])[fieldIndex]

      return {
        id: `field-${index}-${fieldIndex}`,
        name: header,
        value: value ?? null,
        type: inferType(value),
        originalValue: String(value ?? ''),
      }
    })

    const isValid = !result.errors.some((err) => err.row === index)
    const errors = result.errors
      .filter((err) => err.row === index)
      .map((err) => err.message)

    return {
      id: `record-${index}`,
      index,
      fields,
      raw: Array.isArray(row) ? row.join(config.delimiter || ',') : Object.values(row).join(config.delimiter || ','),
      type: index === 0 && config.hasHeader ? 'header' : 'data',
      isValid,
      errors: errors.length > 0 ? errors : undefined,
    }
  })

  const endTime = performance.now()

  return {
    id: `parsed-${Date.now()}`,
    config,
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

function inferType(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'null'
  const strValue = String(value)

  // Check for boolean
  if (strValue.toLowerCase() === 'true' || strValue.toLowerCase() === 'false') {
    return 'boolean'
  }

  // Check for number
  if (!isNaN(Number(strValue)) && strValue.trim() !== '') {
    return 'number'
  }

  // Check for date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{2}-\d{2}-\d{4}$/,
  ]
  if (datePatterns.some((pattern) => pattern.test(strValue))) {
    return 'date'
  }

  return 'string'
}

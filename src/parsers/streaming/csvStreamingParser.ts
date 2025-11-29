/**
 * Streaming CSV Parser
 * Processes CSV files in chunks for memory efficiency and progress reporting
 */

import Papa from 'papaparse'
import type {
  ParserConfig,
  ParsedData,
  ParsedRecord,
  ParsedField,
  ParseProgress,
} from '../../types/parser'

const DEFAULT_CHUNK_SIZE = 1024 * 64 // 64KB chunks

export async function parseCSVStreaming(
  data: string,
  config: ParserConfig,
  onProgress: (progress: ParseProgress) => void,
  isCancelled: () => boolean
): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const startTime = performance.now()
    const totalBytes = new Blob([data]).size
    const records: ParsedRecord[] = []
    const headerSet = new Set<string>()
    let headers: string[] = []
    let bytesProcessed = 0
    let recordIndex = 0
    let validCount = 0
    let invalidCount = 0
    let lastProgressUpdate = 0

    const chunkSize = config.chunkSize || DEFAULT_CHUNK_SIZE

    Papa.parse(data, {
      delimiter: config.delimiter || ',',
      header: config.hasHeader ?? true,
      quoteChar: config.quoteChar || '"',
      escapeChar: config.escapeChar || '\\',
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      chunkSize,
      chunk: (results: Papa.ParseResult<Record<string, string> | string[]>, parser: Papa.Parser) => {
        // Check for cancellation
        if (isCancelled()) {
          parser.abort()
          reject(new Error('Cancelled'))
          return
        }

        // Process headers on first chunk
        if (headers.length === 0 && results.meta.fields) {
          headers = results.meta.fields
          headers.forEach((h) => headerSet.add(h))
        }

        // Process rows
        const rows = results.data as Array<Record<string, string> | string[]>
        for (const row of rows) {
          const fields: ParsedField[] = headers.map((header, fieldIndex) => {
            const value = config.hasHeader
              ? (row as Record<string, string>)[header]
              : (row as string[])[fieldIndex]

            return {
              id: `field-${recordIndex}-${fieldIndex}`,
              name: header,
              value: value ?? null,
              type: inferTypeOptimized(value),
              originalValue: String(value ?? ''),
            }
          })

          const hasErrors = results.errors.some((e: Papa.ParseError) => e.row === recordIndex)

          records.push({
            id: `record-${recordIndex}`,
            index: recordIndex,
            fields,
            raw: Array.isArray(row)
              ? row.join(config.delimiter || ',')
              : Object.values(row).join(config.delimiter || ','),
            type: recordIndex === 0 && config.hasHeader ? 'header' : 'data',
            isValid: !hasErrors,
            errors: hasErrors
              ? results.errors.filter((e: Papa.ParseError) => e.row === recordIndex).map((e: Papa.ParseError) => e.message)
              : undefined,
          })

          if (hasErrors) {
            invalidCount++
          } else {
            validCount++
          }

          recordIndex++
        }

        // Update progress (throttled to every 100ms)
        bytesProcessed += results.meta.cursor - bytesProcessed
        const now = performance.now()
        if (now - lastProgressUpdate > 100) {
          lastProgressUpdate = now
          const elapsedSeconds = (now - startTime) / 1000
          const bytesPerSecond = bytesProcessed / elapsedSeconds
          const remainingBytes = totalBytes - bytesProcessed
          const estimatedTimeRemaining = remainingBytes / bytesPerSecond

          onProgress({
            phase: 'parsing',
            bytesProcessed,
            totalBytes,
            recordsProcessed: recordIndex,
            percentage: Math.round((bytesProcessed / totalBytes) * 100),
            estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
            message: `Parsed ${recordIndex.toLocaleString()} records...`,
          })
        }
      },
      complete: () => {
        const endTime = performance.now()

        onProgress({
          phase: 'complete',
          bytesProcessed: totalBytes,
          totalBytes,
          recordsProcessed: recordIndex,
          percentage: 100,
          message: 'Parsing complete',
        })

        resolve({
          id: `parsed-${Date.now()}`,
          config,
          records,
          headers,
          metadata: {
            totalRecords: records.length,
            validRecords: validCount,
            invalidRecords: invalidCount,
            parseTime: endTime - startTime,
            fileSize: totalBytes,
            parserEngine: 'js',
            encoding: config.encoding,
          },
        })
      },
      error: (error: Error) => {
        reject(new Error(`CSV Parse Error: ${error.message}`))
      },
    })
  })
}

// Optimized type inference using lookup table
const TRUE_VALUES = new Set(['true', 'yes', '1', 'on'])
const FALSE_VALUES = new Set(['false', 'no', '0', 'off'])
const DATE_REGEX = /^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})$/

function inferTypeOptimized(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'null'

  const strValue = String(value)
  const lower = strValue.toLowerCase()

  // Boolean check
  if (TRUE_VALUES.has(lower) || FALSE_VALUES.has(lower)) {
    return 'boolean'
  }

  // Number check (fast path)
  if (strValue.length > 0 && !isNaN(Number(strValue))) {
    return 'number'
  }

  // Date check
  if (DATE_REGEX.test(strValue)) {
    return 'date'
  }

  return 'string'
}

/**
 * Streaming parser for File/Blob input (even more memory efficient)
 */
export function parseCSVFile(
  file: File,
  config: ParserConfig,
  onProgress: (progress: ParseProgress) => void,
  isCancelled: () => boolean
): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const startTime = performance.now()
    const totalBytes = file.size
    const records: ParsedRecord[] = []
    let headers: string[] = []
    let recordIndex = 0
    let validCount = 0
    let invalidCount = 0
    let lastProgressUpdate = 0

    Papa.parse(file, {
      delimiter: config.delimiter || ',',
      header: config.hasHeader ?? true,
      quoteChar: config.quoteChar || '"',
      escapeChar: config.escapeChar || '\\',
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      worker: false, // We're already in a worker
      step: (results: Papa.ParseStepResult<Record<string, string> | string[]>, parser: Papa.Parser) => {
        if (isCancelled()) {
          parser.abort()
          reject(new Error('Cancelled'))
          return
        }

        // Get headers on first row
        if (headers.length === 0 && results.meta.fields) {
          headers = results.meta.fields
        }

        const row = results.data as Record<string, string> | string[]
        const fields: ParsedField[] = headers.map((header, fieldIndex) => {
          const value = config.hasHeader
            ? (row as Record<string, string>)[header]
            : (row as string[])[fieldIndex]

          return {
            id: `field-${recordIndex}-${fieldIndex}`,
            name: header,
            value: value ?? null,
            type: inferTypeOptimized(value),
            originalValue: String(value ?? ''),
          }
        })

        const hasErrors = results.errors.length > 0

        records.push({
          id: `record-${recordIndex}`,
          index: recordIndex,
          fields,
          raw: Array.isArray(row)
            ? row.join(config.delimiter || ',')
            : Object.values(row).join(config.delimiter || ','),
          type: recordIndex === 0 && config.hasHeader ? 'header' : 'data',
          isValid: !hasErrors,
          errors: hasErrors ? results.errors.map((e: Papa.ParseError) => e.message) : undefined,
        })

        if (hasErrors) {
          invalidCount++
        } else {
          validCount++
        }

        recordIndex++

        // Throttled progress updates
        const now = performance.now()
        if (now - lastProgressUpdate > 100) {
          lastProgressUpdate = now
          const bytesProcessed = results.meta.cursor
          const elapsedSeconds = (now - startTime) / 1000
          const bytesPerSecond = bytesProcessed / elapsedSeconds
          const remainingBytes = totalBytes - bytesProcessed
          const estimatedTimeRemaining = remainingBytes / bytesPerSecond

          onProgress({
            phase: 'parsing',
            bytesProcessed,
            totalBytes,
            recordsProcessed: recordIndex,
            percentage: Math.round((bytesProcessed / totalBytes) * 100),
            estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
            message: `Parsed ${recordIndex.toLocaleString()} records...`,
          })
        }
      },
      complete: () => {
        const endTime = performance.now()

        onProgress({
          phase: 'complete',
          bytesProcessed: totalBytes,
          totalBytes,
          recordsProcessed: recordIndex,
          percentage: 100,
          message: 'Parsing complete',
        })

        resolve({
          id: `parsed-${Date.now()}`,
          config,
          records,
          headers,
          metadata: {
            totalRecords: records.length,
            validRecords: validCount,
            invalidRecords: invalidCount,
            parseTime: endTime - startTime,
            fileSize: totalBytes,
            parserEngine: 'js',
          },
        })
      },
      error: (error: Error) => {
        reject(new Error(`CSV Parse Error: ${error.message}`))
      },
    })
  })
}

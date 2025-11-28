import type { ParserConfig, ParsedData } from '../types/parser'
import { parseCSV } from './csvParser'
import { parseFixedWidth } from './fixedWidthParser'
import { parseFIN } from './finParser'
import { parseISO20022 } from './iso20022Parser'
import { parseCustom } from './customParser'

export { parseCSV, parseFixedWidth, parseFIN, parseISO20022, parseCustom }

export function parse(data: string, config: ParserConfig): ParsedData {
  switch (config.type) {
    case 'csv':
      return parseCSV(data, config)
    case 'fixed-width':
      return parseFixedWidth(data, config)
    case 'fin':
      return parseFIN(data, config)
    case 'iso20022':
      return parseISO20022(data, config)
    case 'custom':
      return parseCustom(data, config)
    default:
      // Default to CSV if type is unknown
      return parseCSV(data, config)
  }
}

export function detectParserType(data: string): ParserConfig['type'] {
  const trimmedData = data.trim()

  // Check for XML (ISO 20022)
  if (trimmedData.startsWith('<?xml') || trimmedData.startsWith('<Document') || trimmedData.startsWith('<pain') || trimmedData.startsWith('<camt') || trimmedData.startsWith('<pacs')) {
    return 'iso20022'
  }

  // Check for SWIFT FIN message
  if (trimmedData.startsWith('{1:') || /\{4:\s*\n?:20:/.test(trimmedData)) {
    return 'fin'
  }

  // Check for CSV (has common delimiters)
  const firstLine = trimmedData.split('\n')[0]
  const commaCount = (firstLine.match(/,/g) || []).length
  const semicolonCount = (firstLine.match(/;/g) || []).length
  const tabCount = (firstLine.match(/\t/g) || []).length
  const pipeCount = (firstLine.match(/\|/g) || []).length

  if (commaCount >= 2 || semicolonCount >= 2 || tabCount >= 2 || pipeCount >= 2) {
    return 'csv'
  }

  // Check for fixed width (consistent line lengths)
  const lines = trimmedData.split('\n').filter((l) => l.length > 0)
  if (lines.length >= 3) {
    const lengths = lines.slice(0, 10).map((l) => l.length)
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length
    const allSimilarLength = lengths.every((l) => Math.abs(l - avgLength) < 5)
    if (allSimilarLength && avgLength > 20) {
      return 'fixed-width'
    }
  }

  // Default to custom
  return 'custom'
}

export function suggestDelimiter(data: string): string {
  const firstLines = data.split('\n').slice(0, 5).join('\n')
  const delimiters = [',', ';', '\t', '|']

  let bestDelimiter = ','
  let maxCount = 0

  for (const delimiter of delimiters) {
    const count = (firstLines.match(new RegExp(delimiter === '|' ? '\\|' : delimiter, 'g')) || []).length
    if (count > maxCount) {
      maxCount = count
      bestDelimiter = delimiter
    }
  }

  return bestDelimiter
}

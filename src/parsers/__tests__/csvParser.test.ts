import { describe, it, expect } from 'vitest'
import { parseCSV } from '../csvParser'
import type { ParserConfig } from '../../types/parser'

describe('CSV Parser', () => {
  const defaultConfig: ParserConfig = {
    type: 'csv',
    name: 'test-parser',
    delimiter: ',',
    hasHeader: true,
    quoteChar: '"',
    escapeChar: '\\',
  }

  it('should parse simple CSV data with headers', () => {
    const data = `name,age,email
John,30,john@example.com
Jane,25,jane@example.com`

    const result = parseCSV(data, defaultConfig)

    expect(result.records).toHaveLength(2)
    expect(result.headers).toEqual(['name', 'age', 'email'])
    expect(result.records[0].fields[0].value).toBe('John')
    expect(result.records[0].fields[1].value).toBe('30')
    expect(result.metadata.totalRecords).toBe(2)
    expect(result.metadata.validRecords).toBe(2)
  })

  it('should parse CSV without headers', () => {
    const data = `John,30,john@example.com
Jane,25,jane@example.com`

    const config: ParserConfig = { ...defaultConfig, hasHeader: false }
    const result = parseCSV(data, config)

    expect(result.records).toHaveLength(2)
    expect(result.headers).toEqual(['Column 1', 'Column 2', 'Column 3'])
  })

  it('should handle semicolon delimiter', () => {
    const data = `name;age;email
John;30;john@example.com`

    const config: ParserConfig = { ...defaultConfig, delimiter: ';' }
    const result = parseCSV(data, config)

    expect(result.records).toHaveLength(1)
    expect(result.records[0].fields[0].value).toBe('John')
  })

  it('should handle quoted values with commas', () => {
    const data = `name,address,city
"Doe, John","123 Main St, Apt 4",Chicago`

    const result = parseCSV(data, defaultConfig)

    expect(result.records[0].fields[0].value).toBe('Doe, John')
    expect(result.records[0].fields[1].value).toBe('123 Main St, Apt 4')
  })

  it('should infer types correctly', () => {
    const data = `string,number,boolean,date
hello,123,true,2024-01-15`

    const result = parseCSV(data, defaultConfig)

    expect(result.records[0].fields[0].type).toBe('string')
    expect(result.records[0].fields[1].type).toBe('number')
    expect(result.records[0].fields[2].type).toBe('boolean')
    expect(result.records[0].fields[3].type).toBe('date')
  })

  it('should handle empty values', () => {
    const data = `name,age,email
John,,john@example.com`

    const result = parseCSV(data, defaultConfig)

    expect(result.records[0].fields[1].value).toBe('')
    expect(result.records[0].fields[1].type).toBe('null')
  })

  it('should track parse time in metadata', () => {
    const data = `name,age
John,30`

    const result = parseCSV(data, defaultConfig)

    expect(result.metadata.parseTime).toBeGreaterThan(0)
    expect(result.metadata.fileSize).toBeGreaterThan(0)
  })
})

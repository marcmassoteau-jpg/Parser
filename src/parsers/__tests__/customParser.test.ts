import { describe, it, expect } from 'vitest'
import { parseCustom } from '../customParser'
import type { ParserConfig } from '../../types/parser'

describe('Custom Parser', () => {
  const defaultConfig: ParserConfig = {
    type: 'custom',
    name: 'test-custom-parser',
  }

  it('should parse with regex pattern and named groups', () => {
    const data = `ID:001 NAME:John AMOUNT:1500.00
ID:002 NAME:Jane AMOUNT:2300.50`

    const config: ParserConfig = {
      ...defaultConfig,
      customPattern: 'ID:(?<id>\\d+)\\s+NAME:(?<name>\\w+)\\s+AMOUNT:(?<amount>[\\d.]+)',
    }

    const result = parseCustom(data, config)

    expect(result.records).toHaveLength(2)
    expect(result.records[0].fields.find((f) => f.name === 'id')?.value).toBe('001')
    expect(result.records[0].fields.find((f) => f.name === 'name')?.value).toBe('John')
    expect(result.records[0].fields.find((f) => f.name === 'amount')?.value).toBe('1500.00')
  })

  it('should parse with indexed groups when no names', () => {
    const data = `001|John|1500
002|Jane|2300`

    const config: ParserConfig = {
      ...defaultConfig,
      customPattern: '(\\d+)\\|(\\w+)\\|(\\d+)',
    }

    const result = parseCustom(data, config)

    expect(result.records).toHaveLength(2)
    expect(result.records[0].fields[0].value).toBe('001')
    expect(result.records[0].fields[1].value).toBe('John')
  })

  it('should detect key-value format automatically', () => {
    const data = `name: John Doe
age: 30
email: john@example.com`

    const result = parseCustom(data, defaultConfig)

    expect(result.records.length).toBeGreaterThan(0)
    expect(result.records.some((r) => r.fields.some((f) => f.name === 'name'))).toBe(true)
  })

  it('should detect JSON Lines format', () => {
    const data = `{"id": 1, "name": "John"}
{"id": 2, "name": "Jane"}`

    const result = parseCustom(data, defaultConfig)

    expect(result.records).toHaveLength(2)
    expect(result.records[0].fields.find((f) => f.name === 'id')?.value).toBe(1)
    expect(result.records[0].fields.find((f) => f.name === 'name')?.value).toBe('John')
  })

  it('should handle plain text lines', () => {
    const data = `First line of text
Second line of text
Third line of text`

    const result = parseCustom(data, defaultConfig)

    expect(result.records).toHaveLength(3)
  })

  it('should handle invalid regex gracefully', () => {
    const data = `test data`
    const config: ParserConfig = {
      ...defaultConfig,
      customPattern: '[invalid(regex',
    }

    const result = parseCustom(data, config)

    expect(result.metadata.invalidRecords).toBe(1)
    expect(result.records[0].errors).toBeDefined()
  })

  it('should detect record types from content', () => {
    const data = `# Header line
Transaction: data here
Regular data line
Footer: end of file`

    const result = parseCustom(data, defaultConfig)

    expect(result.records.find((r) => r.raw.includes('Header'))?.type).toBe('header')
    expect(result.records.find((r) => r.raw.includes('Transaction'))?.type).toBe('transaction')
    expect(result.records.find((r) => r.raw.includes('Footer'))?.type).toBe('footer')
  })

  it('should infer types from values', () => {
    const data = `{"string": "hello", "number": 42, "boolean": true, "null": null}`

    const result = parseCustom(data, defaultConfig)

    const record = result.records[0]
    expect(record.fields.find((f) => f.name === 'string')?.type).toBe('string')
    expect(record.fields.find((f) => f.name === 'number')?.type).toBe('number')
    expect(record.fields.find((f) => f.name === 'boolean')?.type).toBe('boolean')
  })

  it('should handle key=value format', () => {
    const data = `name=John
age=30
active=true`

    const result = parseCustom(data, defaultConfig)

    expect(result.records.length).toBeGreaterThan(0)
    expect(result.records.some((r) => r.fields.some((f) => f.name === 'name'))).toBe(true)
  })
})

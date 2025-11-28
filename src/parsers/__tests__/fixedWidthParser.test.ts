import { describe, it, expect } from 'vitest'
import { parseFixedWidth } from '../fixedWidthParser'
import type { ParserConfig, FieldDefinition } from '../../types/parser'

describe('Fixed Width Parser', () => {
  const fieldDefinitions: FieldDefinition[] = [
    { id: 'f1', name: 'ID', start: 0, length: 5, type: 'string' },
    { id: 'f2', name: 'Name', start: 5, length: 20, type: 'string' },
    { id: 'f3', name: 'Amount', start: 25, length: 10, type: 'number' },
  ]

  const defaultConfig: ParserConfig = {
    type: 'fixed-width',
    name: 'test-parser',
    fieldDefinitions,
  }

  it('should parse fixed width data correctly', () => {
    const data = `00001John Doe            0000150000
00002Jane Smith          0000230050`

    const result = parseFixedWidth(data, defaultConfig)

    expect(result.records).toHaveLength(2)
    expect(result.records[0].fields[0].value).toBe('00001')
    expect(result.records[0].fields[1].value).toBe('John Doe')
    expect(result.records[0].fields[2].value).toBe(150000)
  })

  it('should auto-detect fields when none provided', () => {
    const data = `ID    NAME                AMOUNT
00001 John Doe            0000150000
00002 Jane Smith          0000230050`

    const config: ParserConfig = {
      type: 'fixed-width',
      name: 'test-parser',
    }

    const result = parseFixedWidth(data, config)

    expect(result.records.length).toBeGreaterThan(0)
    expect(result.config.fieldDefinitions).toBeDefined()
  })

  it('should determine record types correctly', () => {
    const data = `HDR  Header Record       0000000000
TXN01Transaction One     0000150000
TXN02Transaction Two     0000230050
TRL  Trailer Record      0000380050`

    const result = parseFixedWidth(data, defaultConfig)

    expect(result.records[0].type).toBe('header')
    expect(result.records[1].type).toBe('transaction')
    expect(result.records[2].type).toBe('transaction')
    expect(result.records[3].type).toBe('footer')
  })

  it('should handle required field validation', () => {
    const requiredFieldDefs: FieldDefinition[] = [
      { id: 'f1', name: 'ID', start: 0, length: 5, type: 'string', required: true },
      { id: 'f2', name: 'Name', start: 5, length: 20, type: 'string', required: true },
    ]

    const config: ParserConfig = {
      type: 'fixed-width',
      name: 'test-parser',
      fieldDefinitions: requiredFieldDefs,
    }

    const data = `00001John Doe
     Jane Smith          `

    const result = parseFixedWidth(data, config)

    expect(result.records[0].isValid).toBe(true)
    expect(result.records[1].isValid).toBe(false)
    expect(result.records[1].errors).toContain('Required field "ID" is empty')
  })

  it('should parse boolean fields', () => {
    const boolFieldDefs: FieldDefinition[] = [
      { id: 'f1', name: 'Active', start: 0, length: 5, type: 'boolean' },
    ]

    const config: ParserConfig = {
      type: 'fixed-width',
      name: 'test-parser',
      fieldDefinitions: boolFieldDefs,
    }

    const data = `true
false
1
Y    `

    const result = parseFixedWidth(data, config)

    expect(result.records[0].fields[0].value).toBe(true)
    expect(result.records[1].fields[0].value).toBe(false)
    expect(result.records[2].fields[0].value).toBe(true)
    expect(result.records[3].fields[0].value).toBe(true)
  })
})

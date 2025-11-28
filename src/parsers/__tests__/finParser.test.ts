import { describe, it, expect } from 'vitest'
import { parseFIN } from '../finParser'
import type { ParserConfig } from '../../types/parser'

describe('FIN Parser (SWIFT)', () => {
  const defaultConfig: ParserConfig = {
    type: 'fin',
    name: 'test-fin-parser',
  }

  it('should parse MT103 message correctly', () => {
    const data = `{1:F01BANKBEBBAXXX0000000000}{2:I103BANKDEFFXXXXN}{4:
:20:REFERENCE123456
:23B:CRED
:32A:240115EUR1500,00
:50K:/12345678
JOHN DOE
123 MAIN STREET
:59:/DE89370400440532013000
JANE SMITH
:70:PAYMENT FOR SERVICES
:71A:SHA
-}`

    const result = parseFIN(data, defaultConfig)

    expect(result.records.length).toBeGreaterThan(0)
    expect(result.metadata.totalRecords).toBeGreaterThan(0)
  })

  it('should parse block 1 (Basic Header) correctly', () => {
    const data = `{1:F01BANKBEBBAXXX0000000000}{2:I103BANKDEFFXXXXN}{4:
:20:REF123
-}`

    const result = parseFIN(data, defaultConfig)

    const block1Record = result.records.find((r) => r.id.includes('block-1'))
    expect(block1Record).toBeDefined()
    expect(block1Record?.fields.find((f) => f.name === 'Application ID')?.value).toBe('F')
  })

  it('should parse block 2 (Application Header) for Input', () => {
    const data = `{1:F01BANKBEBBAXXX0000000000}{2:I103BANKDEFFXXXXN}{4:
:20:REF123
-}`

    const result = parseFIN(data, defaultConfig)

    const block2Record = result.records.find((r) => r.id.includes('block-2'))
    expect(block2Record).toBeDefined()
    expect(block2Record?.fields.find((f) => f.name === 'Input/Output')?.value).toBe('Input')
    expect(block2Record?.fields.find((f) => f.name === 'Message Type')?.value).toBe('103')
  })

  it('should parse field tags from block 4', () => {
    const data = `{1:F01BANKBEBBAXXX0000000000}{2:I103BANKDEFFXXXXN}{4:
:20:REFERENCE123456
:32A:240115EUR1500,00
:50K:/12345678
JOHN DOE
-}`

    const result = parseFIN(data, defaultConfig)

    // Find the transaction reference field
    const refField = result.records.find((r) =>
      r.fields.some((f) => f.name.includes('Transaction Reference'))
    )
    expect(refField).toBeDefined()
  })

  it('should parse subfields correctly', () => {
    const data = `{1:F01BANKBEBBAXXX0000000000}{2:I103BANKDEFFXXXXN}{4:
:20:REF123
:50F:/ACC123
1/NAME LINE 1
2/ADDRESS LINE 1
-}`

    const result = parseFIN(data, defaultConfig)
    expect(result.metadata.totalRecords).toBeGreaterThan(0)
  })

  it('should handle empty message gracefully', () => {
    const data = ``
    const result = parseFIN(data, defaultConfig)
    expect(result.records).toHaveLength(0)
    expect(result.metadata.validRecords).toBe(0)
  })

  it('should recognize common FIN field names', () => {
    const data = `{1:F01BANKBEBBAXXX0000000000}{2:I103BANKDEFFXXXXN}{4:
:20:REF123
:59:BENEFICIARY NAME
:70:REMITTANCE INFO
:71A:SHA
-}`

    const result = parseFIN(data, defaultConfig)

    // Check that field names are humanized
    const hasHumanizedFields = result.records.some((r) =>
      r.fields.some((f) =>
        f.name.includes('Beneficiary') ||
        f.name.includes('Remittance') ||
        f.name.includes('Charges')
      )
    )
    expect(hasHumanizedFields).toBe(true)
  })
})

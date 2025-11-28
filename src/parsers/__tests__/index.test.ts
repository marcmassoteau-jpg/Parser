import { describe, it, expect } from 'vitest'
import { parse, detectParserType, suggestDelimiter } from '../index'
import type { ParserConfig } from '../../types/parser'

describe('Parser Index', () => {
  describe('detectParserType', () => {
    it('should detect CSV data', () => {
      const data = `name,age,email
John,30,john@example.com`
      expect(detectParserType(data)).toBe('csv')
    })

    it('should detect semicolon-delimited CSV', () => {
      const data = `name;age;email
John;30;john@example.com`
      expect(detectParserType(data)).toBe('csv')
    })

    it('should detect tab-delimited CSV', () => {
      const data = `name\tage\temail
John\t30\tjohn@example.com`
      expect(detectParserType(data)).toBe('csv')
    })

    it('should detect ISO 20022 XML', () => {
      const data = `<?xml version="1.0"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
</Document>`
      expect(detectParserType(data)).toBe('iso20022')
    })

    it('should detect SWIFT FIN message', () => {
      const data = `{1:F01BANKBEBBAXXX0000000000}{2:I103BANKDEFFXXXXN}{4:
:20:REF123
-}`
      expect(detectParserType(data)).toBe('fin')
    })

    it('should detect fixed-width data', () => {
      const data = `001John Doe            0000150000
002Jane Smith          0000230050
003Bob Wilson          0000340075`
      expect(detectParserType(data)).toBe('fixed-width')
    })

    it('should default to custom for unknown formats', () => {
      const data = `random text
that doesn't match
any known format`
      expect(detectParserType(data)).toBe('custom')
    })
  })

  describe('suggestDelimiter', () => {
    it('should suggest comma for comma-separated data', () => {
      const data = `a,b,c,d
1,2,3,4`
      expect(suggestDelimiter(data)).toBe(',')
    })

    it('should suggest semicolon when more common', () => {
      const data = `a;b;c;d
1;2;3;4`
      expect(suggestDelimiter(data)).toBe(';')
    })

    it('should suggest tab for TSV data', () => {
      const data = `a\tb\tc\td
1\t2\t3\t4`
      expect(suggestDelimiter(data)).toBe('\t')
    })

    it('should suggest pipe for pipe-delimited data', () => {
      const data = `a|b|c|d
1|2|3|4`
      expect(suggestDelimiter(data)).toBe('|')
    })
  })

  describe('parse', () => {
    it('should route to CSV parser', () => {
      const config: ParserConfig = {
        type: 'csv',
        name: 'test',
        delimiter: ',',
        hasHeader: true,
      }
      const data = `name,age
John,30`

      const result = parse(data, config)
      expect(result.records).toHaveLength(1)
    })

    it('should route to Fixed Width parser', () => {
      const config: ParserConfig = {
        type: 'fixed-width',
        name: 'test',
        fieldDefinitions: [
          { id: 'f1', name: 'Name', start: 0, length: 10, type: 'string' },
        ],
      }
      const data = `John Doe  `

      const result = parse(data, config)
      expect(result.records).toHaveLength(1)
    })

    it('should route to FIN parser', () => {
      const config: ParserConfig = {
        type: 'fin',
        name: 'test',
      }
      const data = `{1:F01BANKBEBBAXXX0000000000}{4:
:20:REF123
-}`

      const result = parse(data, config)
      expect(result.metadata).toBeDefined()
    })

    it('should route to ISO 20022 parser', () => {
      const config: ParserConfig = {
        type: 'iso20022',
        name: 'test',
      }
      const data = `<?xml version="1.0"?><Document><Test>value</Test></Document>`

      const result = parse(data, config)
      expect(result.metadata).toBeDefined()
    })

    it('should route to Custom parser', () => {
      const config: ParserConfig = {
        type: 'custom',
        name: 'test',
      }
      const data = `some custom data`

      const result = parse(data, config)
      expect(result.metadata).toBeDefined()
    })
  })
})

import { describe, it, expect } from 'vitest'
import { parseISO20022 } from '../iso20022Parser'
import type { ParserConfig } from '../../types/parser'

describe('ISO 20022 Parser', () => {
  const defaultConfig: ParserConfig = {
    type: 'iso20022',
    name: 'test-iso-parser',
  }

  it('should parse pain.001 message correctly', () => {
    const data = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>MSG-001</MsgId>
      <CreDtTm>2024-01-15T10:30:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
    </GrpHdr>
  </CstmrCdtTrfInitn>
</Document>`

    const result = parseISO20022(data, defaultConfig)

    expect(result.records.length).toBeGreaterThan(0)
    expect(result.metadata.totalRecords).toBeGreaterThan(0)
    expect(result.metadata.invalidRecords).toBe(0)
  })

  it('should detect message type from content', () => {
    const data = `<?xml version="1.0" encoding="UTF-8"?>
<Document>
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>MSG-001</MsgId>
    </GrpHdr>
  </CstmrCdtTrfInitn>
</Document>`

    const result = parseISO20022(data, defaultConfig)

    const headerRecord = result.records.find((r) => r.type === 'header')
    expect(headerRecord).toBeDefined()
  })

  it('should parse nested elements', () => {
    const data = `<?xml version="1.0" encoding="UTF-8"?>
<Document>
  <CstmrCdtTrfInitn>
    <PmtInf>
      <CdtTrfTxInf>
        <Amt>
          <InstdAmt Ccy="EUR">1500.00</InstdAmt>
        </Amt>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`

    const result = parseISO20022(data, defaultConfig)

    expect(result.records.length).toBeGreaterThan(0)
  })

  it('should handle XML attributes', () => {
    const data = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <PmtInf>
      <CdtTrfTxInf>
        <Amt>
          <InstdAmt Ccy="EUR">1500.00</InstdAmt>
        </Amt>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`

    const result = parseISO20022(data, defaultConfig)

    // Should have records with the Currency attribute
    const hasAmountFields = result.records.some((r) =>
      r.fields.some((f) => f.name.includes('Ccy') || f.name.includes('Currency'))
    )
    expect(hasAmountFields).toBe(true)
  })

  it('should humanize ISO 20022 field names', () => {
    const data = `<?xml version="1.0" encoding="UTF-8"?>
<Document>
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>MSG-001</MsgId>
      <CreDtTm>2024-01-15</CreDtTm>
      <NbOfTxs>5</NbOfTxs>
    </GrpHdr>
  </CstmrCdtTrfInitn>
</Document>`

    const result = parseISO20022(data, defaultConfig)

    // Check for humanized field names
    const hasHumanizedFields = result.records.some((r) =>
      r.fields.some((f) =>
        f.name === 'Message ID' ||
        f.name === 'Creation Date/Time' ||
        f.name === 'Number of Transactions'
      )
    )
    expect(hasHumanizedFields).toBe(true)
  })

  it('should handle invalid XML gracefully', () => {
    const data = `<invalid xml content`
    const result = parseISO20022(data, defaultConfig)

    expect(result.metadata.invalidRecords).toBe(1)
    expect(result.records[0].isValid).toBe(false)
  })

  it('should parse camt.053 statement message', () => {
    const data = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt>
    <GrpHdr>
      <MsgId>STMT-001</MsgId>
    </GrpHdr>
    <Stmt>
      <Id>STMT-2024-001</Id>
      <Bal>
        <Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="EUR">10000.00</Amt>
      </Bal>
    </Stmt>
  </BkToCstmrStmt>
</Document>`

    const result = parseISO20022(data, defaultConfig)

    expect(result.records.length).toBeGreaterThan(0)
    expect(result.metadata.validRecords).toBeGreaterThan(0)
  })
})

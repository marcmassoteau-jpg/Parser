/**
 * Sample Data Module
 * Provides preloaded sample data for testing the parser without uploading files
 */

import type { ParserType } from '../types/parser'

export type SampleFormat = 'csv' | 'fixed-width' | 'fin' | 'iso20022'

export interface SampleDataItem {
  id: string
  name: string
  description: string
  format: SampleFormat
  subType?: string
  fileName: string
  data: string
  fieldDefinitions?: Array<{
    id: string
    name: string
    start: number
    length: number
    type: 'string' | 'number' | 'date' | 'boolean'
  }>
  customPattern?: string
}

// =============================================================================
// CSV Sample Data
// =============================================================================

export const CSV_PAYMENTS_DATA = `transaction_id,date,debtor_iban,debtor_name,creditor_iban,creditor_name,amount,currency,reference
TXN-2024-001,2024-01-15,GB82WEST12345698765432,Acme Corporation Ltd,DE89370400440532013000,Global Tech GmbH,15000.00,EUR,INV-2024-0001
TXN-2024-002,2024-01-16,FR7630006000011234567890189,Societe Generale SA,CH9300762011623852957,Swiss Holdings AG,23500.50,CHF,CONTRACT-2024-789
TXN-2024-003,2024-01-17,NL91ABNA0417164300,Dutch Industries BV,ES9121000418450200051332,Madrid Trading SL,8900.25,EUR,PO-2024-0042
TXN-2024-004,2024-01-18,IT60X0542811101000000123456,Roma Finance SpA,BE68539007547034,Brussels Partners BVBA,32000.00,EUR,WIRE-2024-003
TXN-2024-005,2024-01-19,AT611904300234573201,Vienna Bank AG,LU280019400644750000,Luxembourg Capital SA,17500.75,EUR,PAYMENT-456`

// =============================================================================
// Fixed Width Sample Data
// =============================================================================

// Record Type (2) | Account (18) | Date (8) | Amount (15) | Currency (3) | Description (35) | Reference (16)
export const FIXED_WIDTH_STATEMENT_DATA = `HDACCOUNT_STATEMENT   20240120MONTHLY BANK STATEMENT                 REF-HEAD-2024001
01GB82WEST12345698762024011500000015000.00EURPayment to Acme Corporation        TXN-00001-2024
01GB82WEST12345698762024011600000023500.50CHFTransfer to Swiss Holdings         TXN-00002-2024
01GB82WEST12345698762024011700000008900.25EURContract payment Madrid            TXN-00003-2024
01GB82WEST12345698762024011800000032000.00EURWire transfer Brussels             TXN-00004-2024
01GB82WEST12345698762024011900000017500.75EURLuxembourg Capital payment         TXN-00005-2024
TRTRAILER_STATEMENT   2024012000000096901.50   5 TRANSACTIONS PROCESSED           REF-TAIL-2024001`

export const FIXED_WIDTH_FIELD_DEFINITIONS = [
  { id: 'f1', name: 'Record Type', start: 0, length: 2, type: 'string' as const },
  { id: 'f2', name: 'Account/Header', start: 2, length: 18, type: 'string' as const },
  { id: 'f3', name: 'Date', start: 20, length: 8, type: 'date' as const },
  { id: 'f4', name: 'Amount', start: 28, length: 15, type: 'number' as const },
  { id: 'f5', name: 'Currency', start: 43, length: 3, type: 'string' as const },
  { id: 'f6', name: 'Description', start: 46, length: 35, type: 'string' as const },
  { id: 'f7', name: 'Reference', start: 81, length: 16, type: 'string' as const },
]

// =============================================================================
// SWIFT FIN Sample Data
// =============================================================================

export const SWIFT_MT103_DATA = `{1:F01BANKDEFFAXXX0000000000}{2:I103ABORFRPPXXXXN}{3:{108:REF123456789}}{4:
:20:PAYMENT-REF-001
:23B:CRED
:32A:240115EUR15000,00
:33B:EUR15000,00
:50K:/DE89370400440532013000
ACME CORPORATION GMBH
FRIEDRICHSTRASSE 123
10117 BERLIN
:52A:BANKDEFFXXX
:53A:DEUTDEFF
:57A:ABORFRPP
:59:/FR7630006000011234567890189
SOCIETE GENERALE SA
15 BOULEVARD HAUSSMANN
75009 PARIS
:70:PAYMENT FOR INVOICE INV-2024-001
SERVICES RENDERED Q4 2023
:71A:SHA
:72:/ACC/REGULAR PAYMENT
-}`

export const SWIFT_MT202_DATA = `{1:F01BANKDEFFAXXX0000000000}{2:I202CHABORFRPPN}{3:{108:COVREF202401}}{4:
:20:COV-2024-001
:21:UNDERLYING-REF01
:32A:240116EUR50000,00
:52A:BANKDEFFXXX
:53A:DEUTDEFF
:56A:ABORFRPP
:57A:ABORFRPP
:58A:/FR7630006000011234567890189
ABORFRPP
:72:/BNF/COVER PAYMENT FOR MT103
//REF PAYMENT-REF-001
-}`

export const SWIFT_MT940_DATA = `{1:F01BANKDEFFAXXX0000000000}{2:O9401200240120BANKDEFFAXXX00000000002401200100N}{4:
:20:STMT-2024-01-20
:25:DE89370400440532013000
:28C:1/1
:60F:C240115EUR125000,00
:61:2401150115CR15000,00NTRFPAYMENT-REF-001//TXN001
:86:INCOMING TRANSFER FROM ACME CORPORATION
REFERENCE: INV-2024-001
:61:2401160116DR23500,50NTRFCOV-2024-001//TXN002
:86:OUTGOING TRANSFER TO SWISS HOLDINGS AG
REFERENCE: CONTRACT-789
:61:2401170117CR8900,25NTRFRCV-2024-003//TXN003
:86:INCOMING PAYMENT FROM MADRID TRADING SL
REFERENCE: PO-0042
:62F:C240120EUR125399,75
:64:C240120EUR125399,75
-}`

// =============================================================================
// ISO 20022 Sample Data
// =============================================================================

export const ISO20022_PAIN001_DATA = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>MSG-2024-001-INIT</MsgId>
      <CreDtTm>2024-01-15T10:30:00</CreDtTm>
      <NbOfTxs>2</NbOfTxs>
      <CtrlSum>38500.50</CtrlSum>
      <InitgPty>
        <Nm>Acme Corporation GmbH</Nm>
        <Id>
          <OrgId>
            <Othr>
              <Id>DE123456789</Id>
            </Othr>
          </OrgId>
        </Id>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>BATCH-2024-001</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>2</NbOfTxs>
      <CtrlSum>38500.50</CtrlSum>
      <ReqdExctnDt>
        <Dt>2024-01-16</Dt>
      </ReqdExctnDt>
      <Dbtr>
        <Nm>Acme Corporation GmbH</Nm>
        <PstlAdr>
          <Ctry>DE</Ctry>
          <AdrLine>Friedrichstrasse 123</AdrLine>
          <AdrLine>10117 Berlin</AdrLine>
        </PstlAdr>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>DE89370400440532013000</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BICFI>BANKDEFFXXX</BICFI>
        </FinInstnId>
      </DbtrAgt>
      <CdtTrfTxInf>
        <PmtId>
          <InstrId>INSTR-001</InstrId>
          <EndToEndId>E2E-2024-001</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">15000.00</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            <BICFI>ABORFRPPXXX</BICFI>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>Societe Generale SA</Nm>
          <PstlAdr>
            <Ctry>FR</Ctry>
            <AdrLine>15 Boulevard Haussmann</AdrLine>
            <AdrLine>75009 Paris</AdrLine>
          </PstlAdr>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>FR7630006000011234567890189</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>Invoice INV-2024-001 Payment</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>
      <CdtTrfTxInf>
        <PmtId>
          <InstrId>INSTR-002</InstrId>
          <EndToEndId>E2E-2024-002</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="CHF">23500.50</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            <BICFI>UBSWCHZHXXX</BICFI>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>Swiss Holdings AG</Nm>
          <PstlAdr>
            <Ctry>CH</Ctry>
            <AdrLine>Bahnhofstrasse 45</AdrLine>
            <AdrLine>8001 Zurich</AdrLine>
          </PstlAdr>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>CH9300762011623852957</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>Contract CONTRACT-789 Payment</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`

export const ISO20022_CAMT053_DATA = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08">
  <BkToCstmrStmt>
    <GrpHdr>
      <MsgId>STMT-2024-01-20-001</MsgId>
      <CreDtTm>2024-01-20T08:00:00</CreDtTm>
    </GrpHdr>
    <Stmt>
      <Id>ACCT-STMT-001</Id>
      <ElctrncSeqNb>1</ElctrncSeqNb>
      <CreDtTm>2024-01-20T08:00:00</CreDtTm>
      <Acct>
        <Id>
          <IBAN>DE89370400440532013000</IBAN>
        </Id>
        <Ccy>EUR</Ccy>
        <Ownr>
          <Nm>Acme Corporation GmbH</Nm>
        </Ownr>
        <Svcr>
          <FinInstnId>
            <BICFI>BANKDEFFXXX</BICFI>
            <Nm>Deutsche Bank AG</Nm>
          </FinInstnId>
        </Svcr>
      </Acct>
      <Bal>
        <Tp>
          <CdOrPrtry>
            <Cd>OPBD</Cd>
          </CdOrPrtry>
        </Tp>
        <Amt Ccy="EUR">125000.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Dt>
          <Dt>2024-01-15</Dt>
        </Dt>
      </Bal>
      <Bal>
        <Tp>
          <CdOrPrtry>
            <Cd>CLBD</Cd>
          </CdOrPrtry>
        </Tp>
        <Amt Ccy="EUR">125399.75</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Dt>
          <Dt>2024-01-20</Dt>
        </Dt>
      </Bal>
      <Ntry>
        <Amt Ccy="EUR">15000.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts>
          <Cd>BOOK</Cd>
        </Sts>
        <BookgDt>
          <Dt>2024-01-15</Dt>
        </BookgDt>
        <ValDt>
          <Dt>2024-01-15</Dt>
        </ValDt>
        <AcctSvcrRef>TXN-2024-001</AcctSvcrRef>
        <BkTxCd>
          <Domn>
            <Cd>PMNT</Cd>
            <Fmly>
              <Cd>RCDT</Cd>
              <SubFmlyCd>ESCT</SubFmlyCd>
            </Fmly>
          </Domn>
        </BkTxCd>
        <NtryDtls>
          <TxDtls>
            <Refs>
              <EndToEndId>E2E-2024-001</EndToEndId>
            </Refs>
            <RltdPties>
              <Dbtr>
                <Nm>Societe Generale SA</Nm>
              </Dbtr>
              <DbtrAcct>
                <Id>
                  <IBAN>FR7630006000011234567890189</IBAN>
                </Id>
              </DbtrAcct>
            </RltdPties>
            <RmtInf>
              <Ustrd>Incoming payment INV-2024-001</Ustrd>
            </RmtInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
      <Ntry>
        <Amt Ccy="EUR">23500.50</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <Sts>
          <Cd>BOOK</Cd>
        </Sts>
        <BookgDt>
          <Dt>2024-01-16</Dt>
        </BookgDt>
        <ValDt>
          <Dt>2024-01-16</Dt>
        </ValDt>
        <AcctSvcrRef>TXN-2024-002</AcctSvcrRef>
        <BkTxCd>
          <Domn>
            <Cd>PMNT</Cd>
            <Fmly>
              <Cd>ICDT</Cd>
              <SubFmlyCd>ESCT</SubFmlyCd>
            </Fmly>
          </Domn>
        </BkTxCd>
        <NtryDtls>
          <TxDtls>
            <Refs>
              <EndToEndId>E2E-2024-002</EndToEndId>
            </Refs>
            <RltdPties>
              <Cdtr>
                <Nm>Swiss Holdings AG</Nm>
              </Cdtr>
              <CdtrAcct>
                <Id>
                  <IBAN>CH9300762011623852957</IBAN>
                </Id>
              </CdtrAcct>
            </RltdPties>
            <RmtInf>
              <Ustrd>Outgoing payment CONTRACT-789</Ustrd>
            </RmtInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
    </Stmt>
  </BkToCstmrStmt>
</Document>`

// =============================================================================
// Sample Data Catalog
// =============================================================================

export const SAMPLE_DATA_CATALOG: SampleDataItem[] = [
  {
    id: 'csv-payments',
    name: 'Payment Transactions',
    description: '5 payment transactions with IBAN, amounts, references',
    format: 'csv',
    subType: 'payments',
    fileName: 'payment_transactions.csv',
    data: CSV_PAYMENTS_DATA,
  },
  {
    id: 'fixed-width-statement',
    name: 'Bank Statement',
    description: 'Header + 5 transactions + footer',
    format: 'fixed-width',
    subType: 'statement',
    fileName: 'bank_statement.txt',
    data: FIXED_WIDTH_STATEMENT_DATA,
    fieldDefinitions: FIXED_WIDTH_FIELD_DEFINITIONS,
  },
  {
    id: 'swift-mt103',
    name: 'MT103 Payment',
    description: 'Single customer credit transfer',
    format: 'fin',
    subType: 'MT103',
    fileName: 'mt103_payment.fin',
    data: SWIFT_MT103_DATA,
  },
  {
    id: 'swift-mt202',
    name: 'MT202 Cover',
    description: 'Bank-to-bank transfer',
    format: 'fin',
    subType: 'MT202',
    fileName: 'mt202_cover.fin',
    data: SWIFT_MT202_DATA,
  },
  {
    id: 'swift-mt940',
    name: 'MT940 Statement',
    description: 'Customer statement with 3 entries',
    format: 'fin',
    subType: 'MT940',
    fileName: 'mt940_statement.fin',
    data: SWIFT_MT940_DATA,
  },
  {
    id: 'iso20022-pain001',
    name: 'pain.001 Initiation',
    description: 'Credit transfer initiation (2 payments)',
    format: 'iso20022',
    subType: 'pain.001',
    fileName: 'pain001_initiation.xml',
    data: ISO20022_PAIN001_DATA,
  },
  {
    id: 'iso20022-camt053',
    name: 'camt.053 Statement',
    description: 'Bank statement with 2 entries',
    format: 'iso20022',
    subType: 'camt.053',
    fileName: 'camt053_statement.xml',
    data: ISO20022_CAMT053_DATA,
  },
]

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get a sample by its ID
 */
export function getSampleById(id: string): SampleDataItem | undefined {
  return SAMPLE_DATA_CATALOG.find((sample) => sample.id === id)
}

/**
 * Get samples filtered by format
 */
export function getSamplesByFormat(format: SampleFormat): SampleDataItem[] {
  return SAMPLE_DATA_CATALOG.filter((sample) => sample.format === format)
}

/**
 * Get all available formats
 */
export function getAvailableFormats(): SampleFormat[] {
  return ['csv', 'fixed-width', 'fin', 'iso20022']
}

/**
 * Map sample format to parser type
 */
export function mapFormatToParserType(format: SampleFormat): ParserType {
  return format as ParserType
}

/**
 * Get format display info (label, color, icon name)
 */
export function getFormatDisplayInfo(format: SampleFormat): {
  label: string
  color: string
  bgColor: string
  borderColor: string
} {
  switch (format) {
    case 'csv':
      return {
        label: 'CSV',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-300',
      }
    case 'fixed-width':
      return {
        label: 'Fixed Width',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-300',
      }
    case 'fin':
      return {
        label: 'SWIFT FIN',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-300',
      }
    case 'iso20022':
      return {
        label: 'ISO 20022',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-300',
      }
    default:
      return {
        label: format,
        color: 'text-slate-600',
        bgColor: 'bg-slate-100',
        borderColor: 'border-slate-300',
      }
  }
}

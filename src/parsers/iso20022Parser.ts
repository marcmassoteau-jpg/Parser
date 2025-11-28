import { XMLParser } from 'fast-xml-parser'
import type { ParserConfig, ParsedData, ParsedRecord, ParsedField } from '../types/parser'

export function parseISO20022(data: string, config: ParserConfig): ParsedData {
  const startTime = performance.now()

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
    isArray: (tagName) => {
      // Common repeating elements in ISO 20022
      const arrayTags = ['NtryDtls', 'TxDtls', 'Ntry', 'Stmts', 'Stmt', 'Bal', 'CdtTrfTxInf', 'PmtInf']
      return arrayTags.includes(tagName)
    },
  })

  let xmlDoc: Record<string, unknown>
  try {
    xmlDoc = parser.parse(data)
  } catch (error) {
    return createErrorResult(config, startTime, `XML Parse Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  const records: ParsedRecord[] = []
  const headers: Set<string> = new Set()

  // Extract the root document (skip XML declaration)
  const rootKey = Object.keys(xmlDoc).find((key) => key !== '?xml')
  if (!rootKey) {
    return createErrorResult(config, startTime, 'No root element found')
  }

  const root = xmlDoc[rootKey] as Record<string, unknown>
  const messageType = detectMessageType(rootKey, root)

  // Add document header
  records.push({
    id: 'document-header',
    index: 0,
    fields: [
      { id: 'msg-type', name: 'Message Type', value: messageType, type: 'string', originalValue: messageType },
      { id: 'root-element', name: 'Root Element', value: rootKey, type: 'string', originalValue: rootKey },
    ],
    raw: rootKey,
    type: 'header',
    isValid: true,
  })
  headers.add('Message Type')
  headers.add('Root Element')

  // Recursively extract all fields
  const flattenedRecords = flattenXML(root, '', 1)
  flattenedRecords.forEach((record) => {
    record.fields.forEach((field) => headers.add(field.name))
    records.push(record)
  })

  const endTime = performance.now()

  return {
    id: `parsed-${Date.now()}`,
    config,
    records,
    headers: Array.from(headers),
    metadata: {
      totalRecords: records.length,
      validRecords: records.filter((r) => r.isValid).length,
      invalidRecords: records.filter((r) => !r.isValid).length,
      parseTime: endTime - startTime,
      fileSize: new Blob([data]).size,
    },
  }
}

function detectMessageType(rootKey: string, root: Record<string, unknown>): string {
  // Common ISO 20022 message types
  const messageTypes: Record<string, string> = {
    'Document': extractDocumentType(root),
    'pain.001': 'Customer Credit Transfer Initiation',
    'pain.002': 'Customer Payment Status Report',
    'pain.008': 'Customer Direct Debit Initiation',
    'camt.052': 'Bank to Customer Account Report',
    'camt.053': 'Bank to Customer Statement',
    'camt.054': 'Bank to Customer Debit Credit Notification',
    'pacs.002': 'FI to FI Payment Status Report',
    'pacs.003': 'FI to FI Customer Direct Debit',
    'pacs.004': 'Payment Return',
    'pacs.008': 'FI to FI Customer Credit Transfer',
    'pacs.009': 'FI Credit Transfer',
  }

  // Check namespace for message type
  const xmlns = root['@_xmlns'] as string | undefined
  if (xmlns) {
    for (const [key, value] of Object.entries(messageTypes)) {
      if (xmlns.includes(key)) {
        return value
      }
    }
  }

  return messageTypes[rootKey] || 'ISO 20022 Message'
}

function extractDocumentType(root: Record<string, unknown>): string {
  // Look for specific child elements
  if ('CstmrCdtTrfInitn' in root) return 'pain.001 - Customer Credit Transfer Initiation'
  if ('CstmrPmtStsRpt' in root) return 'pain.002 - Customer Payment Status Report'
  if ('CstmrDrctDbtInitn' in root) return 'pain.008 - Customer Direct Debit Initiation'
  if ('BkToCstmrAcctRpt' in root) return 'camt.052 - Bank to Customer Account Report'
  if ('BkToCstmrStmt' in root) return 'camt.053 - Bank to Customer Statement'
  if ('BkToCstmrDbtCdtNtfctn' in root) return 'camt.054 - Bank to Customer Debit Credit Notification'
  if ('FIToFIPmtStsRpt' in root) return 'pacs.002 - FI to FI Payment Status Report'
  if ('FIToFICstmrCdtTrf' in root) return 'pacs.008 - FI to FI Customer Credit Transfer'
  return 'ISO 20022 Document'
}

function flattenXML(
  obj: unknown,
  path: string,
  startIndex: number,
  depth: number = 0
): ParsedRecord[] {
  const records: ParsedRecord[] = []
  let currentIndex = startIndex

  if (typeof obj !== 'object' || obj === null) {
    return records
  }

  const entries = Object.entries(obj as Record<string, unknown>)
  const fields: ParsedField[] = []
  const nestedRecords: ParsedRecord[] = []

  entries.forEach(([key, value]) => {
    const fieldPath = path ? `${path}.${key}` : key

    if (key.startsWith('@_')) {
      // XML attribute
      fields.push({
        id: `attr-${currentIndex}-${key}`,
        name: `${path}[${key.substring(2)}]`,
        value: String(value),
        type: typeof value === 'number' ? 'number' : 'string',
        originalValue: String(value),
      })
    } else if (key === '#text') {
      // Text content
      fields.push({
        id: `text-${currentIndex}`,
        name: path || 'Text',
        value: String(value),
        type: typeof value === 'number' ? 'number' : 'string',
        originalValue: String(value),
      })
    } else if (Array.isArray(value)) {
      // Array of elements
      value.forEach((item, idx) => {
        const itemRecords = flattenXML(item, `${fieldPath}[${idx}]`, currentIndex + 1, depth + 1)
        nestedRecords.push(...itemRecords)
        currentIndex += itemRecords.length
      })
    } else if (typeof value === 'object' && value !== null) {
      // Nested object
      const childRecords = flattenXML(value, fieldPath, currentIndex + 1, depth + 1)
      nestedRecords.push(...childRecords)
      currentIndex += childRecords.length
    } else {
      // Primitive value
      fields.push({
        id: `field-${currentIndex}-${key}`,
        name: humanizeISO20022Field(key, fieldPath),
        value: value as string | number | boolean,
        type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
        originalValue: String(value),
      })
    }
  })

  if (fields.length > 0) {
    records.push({
      id: `record-${startIndex}`,
      index: startIndex,
      fields,
      raw: path || 'Root',
      type: determineRecordType(path, depth),
      isValid: true,
    })
  }

  records.push(...nestedRecords)
  return records
}

function determineRecordType(path: string, depth: number): 'header' | 'transaction' | 'footer' | 'data' {
  const headerPaths = ['GrpHdr', 'MsgId', 'CreDtTm', 'NbOfTxs', 'CtrlSum']
  const transactionPaths = ['CdtTrfTxInf', 'DrctDbtTxInf', 'TxDtls', 'Ntry', 'NtryDtls']

  if (headerPaths.some((p) => path.includes(p))) return 'header'
  if (transactionPaths.some((p) => path.includes(p))) return 'transaction'
  if (depth <= 1) return 'header'
  return 'data'
}

function humanizeISO20022Field(key: string, _path: string): string {
  const fieldNames: Record<string, string> = {
    'MsgId': 'Message ID',
    'CreDtTm': 'Creation Date/Time',
    'NbOfTxs': 'Number of Transactions',
    'CtrlSum': 'Control Sum',
    'InitgPty': 'Initiating Party',
    'Nm': 'Name',
    'PmtInfId': 'Payment Information ID',
    'PmtMtd': 'Payment Method',
    'BtchBookg': 'Batch Booking',
    'ReqdExctnDt': 'Requested Execution Date',
    'Dbtr': 'Debtor',
    'DbtrAcct': 'Debtor Account',
    'DbtrAgt': 'Debtor Agent',
    'CdtTrfTxInf': 'Credit Transfer Transaction',
    'PmtId': 'Payment ID',
    'EndToEndId': 'End-to-End ID',
    'InstrId': 'Instruction ID',
    'Amt': 'Amount',
    'InstdAmt': 'Instructed Amount',
    'Ccy': 'Currency',
    'CdtrAgt': 'Creditor Agent',
    'Cdtr': 'Creditor',
    'CdtrAcct': 'Creditor Account',
    'RmtInf': 'Remittance Information',
    'Ustrd': 'Unstructured',
    'Strd': 'Structured',
    'IBAN': 'IBAN',
    'BIC': 'BIC',
    'BICFI': 'BIC/FI',
    'Id': 'ID',
    'Othr': 'Other',
    'FinInstnId': 'Financial Institution ID',
    'Bal': 'Balance',
    'Tp': 'Type',
    'CdOrPrtry': 'Code or Proprietary',
    'Cd': 'Code',
    'Prtry': 'Proprietary',
    'Dt': 'Date',
    'DtTm': 'Date/Time',
    'Ntry': 'Entry',
    'NtryDtls': 'Entry Details',
    'TxDtls': 'Transaction Details',
    'Refs': 'References',
    'AcctSvcrRef': 'Account Servicer Reference',
    'InstrRef': 'Instruction Reference',
    'BookgDt': 'Booking Date',
    'ValDt': 'Value Date',
    'Sts': 'Status',
    'CdtDbtInd': 'Credit/Debit Indicator',
    'BkTxCd': 'Bank Transaction Code',
    'Domn': 'Domain',
    'Fmly': 'Family',
    'SubFmlyCd': 'Sub-Family Code',
    'AddtlNtryInf': 'Additional Entry Info',
    'AddtlTxInf': 'Additional Transaction Info',
  }

  return fieldNames[key] || key.replace(/([A-Z])/g, ' $1').trim()
}

function createErrorResult(config: ParserConfig, startTime: number, error: string): ParsedData {
  return {
    id: `parsed-${Date.now()}`,
    config,
    records: [{
      id: 'error-record',
      index: 0,
      fields: [{ id: 'error', name: 'Error', value: error, type: 'string', originalValue: error }],
      raw: '',
      type: 'data',
      isValid: false,
      errors: [error],
    }],
    headers: ['Error'],
    metadata: {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 1,
      parseTime: performance.now() - startTime,
    },
  }
}

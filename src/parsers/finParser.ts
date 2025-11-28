import type { ParserConfig, ParsedData, ParsedRecord, ParsedField, FINBlock, FINField } from '../types/parser'

// SWIFT FIN Message Parser
export function parseFIN(data: string, config: ParserConfig): ParsedData {
  const startTime = performance.now()
  const blocks = parseFINBlocks(data)
  const records: ParsedRecord[] = []
  const allHeaders: Set<string> = new Set()

  // Process each block
  blocks.forEach((block, blockIndex) => {
    const fields: ParsedField[] = block.fields.map((field, fieldIndex) => {
      allHeaders.add(field.tag)
      return {
        id: `field-${blockIndex}-${fieldIndex}`,
        name: field.name,
        value: field.value,
        type: 'string',
        originalValue: field.value,
      }
    })

    records.push({
      id: `block-${block.type}-${blockIndex}`,
      index: blockIndex,
      fields,
      raw: block.content,
      type: getBlockType(block.type),
      isValid: true,
    })
  })

  // Parse Block 4 (message body) in detail
  const block4 = blocks.find((b) => b.type === '4')
  if (block4) {
    const messageFields = parseBlock4Fields(block4.content)
    messageFields.forEach((field, index) => {
      allHeaders.add(field.tag)

      const parsedField: ParsedField = {
        id: `msg-field-${index}`,
        name: `${field.tag} - ${field.name}`,
        value: field.value,
        type: 'string',
        originalValue: field.value,
      }

      // If field has subfields, add them as separate records
      if (field.subfields && field.subfields.length > 0) {
        field.subfields.forEach((subfield, subIndex) => {
          records.push({
            id: `subfield-${index}-${subIndex}`,
            index: records.length,
            fields: [{
              id: `subfield-${index}-${subIndex}-0`,
              name: `${field.tag}/${subfield.code}`,
              value: subfield.value,
              type: 'string',
              originalValue: subfield.value,
            }],
            raw: `/${subfield.code}/${subfield.value}`,
            type: 'data',
            isValid: true,
          })
        })
      }

      records.push({
        id: `message-field-${index}`,
        index: records.length,
        fields: [parsedField],
        raw: `:${field.tag}:${field.value}`,
        type: 'transaction',
        isValid: true,
      })
    })
  }

  const endTime = performance.now()

  return {
    id: `parsed-${Date.now()}`,
    config,
    records,
    headers: Array.from(allHeaders),
    metadata: {
      totalRecords: records.length,
      validRecords: records.filter((r) => r.isValid).length,
      invalidRecords: records.filter((r) => !r.isValid).length,
      parseTime: endTime - startTime,
      fileSize: new Blob([data]).size,
    },
  }
}

function parseFINBlocks(data: string): FINBlock[] {
  const blocks: FINBlock[] = []
  const blockPattern = /\{(\d):([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g
  let match

  while ((match = blockPattern.exec(data)) !== null) {
    const blockType = match[1] as '1' | '2' | '3' | '4' | '5'
    const content = match[2]

    blocks.push({
      type: blockType,
      name: getBlockName(blockType),
      content,
      fields: parseBlockFields(blockType, content),
    })
  }

  return blocks
}

function getBlockName(type: string): string {
  const names: Record<string, string> = {
    '1': 'Basic Header',
    '2': 'Application Header',
    '3': 'User Header',
    '4': 'Text Block (Message)',
    '5': 'Trailer',
  }
  return names[type] || `Block ${type}`
}

function getBlockType(blockType: string): 'header' | 'transaction' | 'footer' | 'data' {
  switch (blockType) {
    case '1':
    case '2':
    case '3':
      return 'header'
    case '4':
      return 'transaction'
    case '5':
      return 'footer'
    default:
      return 'data'
  }
}

function parseBlockFields(blockType: string, content: string): FINField[] {
  const fields: FINField[] = []

  switch (blockType) {
    case '1':
      // Basic Header: F01BANKBEBBAXXX0000000000
      if (content.length >= 25) {
        fields.push(
          { tag: 'AppID', name: 'Application ID', value: content.substring(0, 1), subfields: [] },
          { tag: 'ServiceID', name: 'Service ID', value: content.substring(1, 3), subfields: [] },
          { tag: 'LT', name: 'Logical Terminal', value: content.substring(3, 15), subfields: [] },
          { tag: 'Session', name: 'Session Number', value: content.substring(15, 19), subfields: [] },
          { tag: 'Sequence', name: 'Sequence Number', value: content.substring(19, 25), subfields: [] },
        )
      }
      break
    case '2':
      // Application Header: I103BANKDEFFXXXXN or O1031200010103BANKBEBBAXXX00000000001200010103N
      if (content.startsWith('I')) {
        fields.push(
          { tag: 'IO', name: 'Input/Output', value: 'Input', subfields: [] },
          { tag: 'MT', name: 'Message Type', value: content.substring(1, 4), subfields: [] },
          { tag: 'Receiver', name: 'Receiver BIC', value: content.substring(4, 16), subfields: [] },
        )
      } else if (content.startsWith('O')) {
        fields.push(
          { tag: 'IO', name: 'Input/Output', value: 'Output', subfields: [] },
          { tag: 'MT', name: 'Message Type', value: content.substring(1, 4), subfields: [] },
          { tag: 'InputTime', name: 'Input Time', value: content.substring(4, 8), subfields: [] },
        )
      }
      break
  }

  return fields
}

function parseBlock4Fields(content: string): FINField[] {
  const fields: FINField[] = []
  const fieldPattern = /:(\d{2}[A-Z]?):([^:]*?)(?=\r?\n:|$)/gs
  let match

  while ((match = fieldPattern.exec(content)) !== null) {
    const tag = match[1]
    const value = match[2].trim()
    const subfields = parseSubfields(value)

    fields.push({
      tag,
      name: getFINFieldName(tag),
      value,
      subfields,
    })
  }

  return fields
}

function parseSubfields(value: string): { code: string; value: string }[] {
  const subfields: { code: string; value: string }[] = []
  const subfieldPattern = /\/([A-Z0-9]+)\/([^/\n]*)/g
  let match

  while ((match = subfieldPattern.exec(value)) !== null) {
    subfields.push({
      code: match[1],
      value: match[2].trim(),
    })
  }

  return subfields
}

function getFINFieldName(tag: string): string {
  const fieldNames: Record<string, string> = {
    '20': 'Transaction Reference',
    '21': 'Related Reference',
    '23B': 'Bank Operation Code',
    '23E': 'Instruction Code',
    '25': 'Account Identification',
    '25A': 'Account Identification',
    '26T': 'Transaction Type Code',
    '28C': 'Statement Number',
    '28D': 'Statement Number',
    '32A': 'Value Date/Currency/Amount',
    '32B': 'Currency/Amount',
    '33B': 'Currency/Original Amount',
    '36': 'Exchange Rate',
    '50A': 'Ordering Customer (BIC)',
    '50F': 'Ordering Customer (Party)',
    '50K': 'Ordering Customer (Name/Address)',
    '51A': 'Sending Institution',
    '52A': 'Ordering Institution (BIC)',
    '52D': 'Ordering Institution (Name/Address)',
    '53A': 'Sender Correspondent (BIC)',
    '53B': 'Sender Correspondent (Location)',
    '54A': 'Receiver Correspondent (BIC)',
    '56A': 'Intermediary Institution (BIC)',
    '56D': 'Intermediary Institution (Name/Address)',
    '57A': 'Account With Institution (BIC)',
    '57D': 'Account With Institution (Name/Address)',
    '59': 'Beneficiary Customer',
    '59A': 'Beneficiary Customer (BIC)',
    '59F': 'Beneficiary Customer (Party)',
    '60F': 'Opening Balance',
    '60M': 'Opening Balance',
    '61': 'Statement Line',
    '62F': 'Closing Balance',
    '62M': 'Closing Balance',
    '64': 'Closing Available Balance',
    '65': 'Forward Available Balance',
    '70': 'Remittance Information',
    '71A': 'Details of Charges',
    '71F': 'Sender Charges',
    '71G': 'Receiver Charges',
    '72': 'Sender to Receiver Information',
    '77B': 'Regulatory Reporting',
    '77T': 'Envelope Contents',
    '79': 'Narrative',
    '86': 'Information to Account Owner',
  }
  return fieldNames[tag] || `Field ${tag}`
}

// Parser Types
export type ParserType = 'csv' | 'fixed-width' | 'fin' | 'iso20022' | 'custom'

export interface ParserConfig {
  type: ParserType
  name: string
  description?: string
  // CSV specific
  delimiter?: string
  hasHeader?: boolean
  quoteChar?: string
  escapeChar?: string
  // Fixed width specific
  fieldDefinitions?: FieldDefinition[]
  // FIN specific
  messageType?: string
  // Custom specific
  customPattern?: string
  parseFunction?: string
}

export interface FieldDefinition {
  id: string
  name: string
  start: number
  length: number
  type: 'string' | 'number' | 'date' | 'boolean'
  format?: string
  required?: boolean
  description?: string
}

export interface ParsedField {
  id: string
  name: string
  value: string | number | boolean | null
  type: string
  originalValue: string
  position?: { start: number; end: number }
}

export interface ParsedRecord {
  id: string
  index: number
  fields: ParsedField[]
  raw: string
  type: 'header' | 'transaction' | 'footer' | 'data'
  isValid: boolean
  errors?: string[]
}

export interface ParsedData {
  id: string
  config: ParserConfig
  records: ParsedRecord[]
  headers?: string[]
  metadata: {
    totalRecords: number
    validRecords: number
    invalidRecords: number
    parseTime: number
    fileSize?: number
    fileName?: string
  }
}

// Node Types for Visual Representation
export interface ParserNodeData {
  label: string
  type: 'source' | 'header' | 'transaction' | 'field' | 'output' | 'mapping'
  config?: Partial<ParserConfig>
  fields?: ParsedField[]
  record?: ParsedRecord
  isExpanded?: boolean
  color?: string
  icon?: string
}

// Mapping Types
export interface FieldMapping {
  id: string
  sourceField: string
  targetField: string
  transformation?: TransformationType
  defaultValue?: string
  condition?: string
}

export type TransformationType =
  | 'none'
  | 'uppercase'
  | 'lowercase'
  | 'trim'
  | 'pad-left'
  | 'pad-right'
  | 'substring'
  | 'replace'
  | 'date-format'
  | 'number-format'
  | 'custom'

export interface TargetSchema {
  id: string
  name: string
  fields: TargetField[]
}

export interface TargetField {
  id: string
  name: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'object' | 'array'
  required: boolean
  format?: string
  description?: string
  children?: TargetField[]
}

// FIN Message Types (SWIFT)
export interface FINBlock {
  type: '1' | '2' | '3' | '4' | '5'
  name: string
  content: string
  fields: FINField[]
}

export interface FINField {
  tag: string
  name: string
  value: string
  subfields?: FINSubfield[]
}

export interface FINSubfield {
  code: string
  value: string
}

// ISO 20022 Types
export interface ISO20022Message {
  namespace: string
  messageType: string
  header: Record<string, unknown>
  document: Record<string, unknown>
}

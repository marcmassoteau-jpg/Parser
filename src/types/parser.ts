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
  // Performance options
  chunkSize?: number
  useWasm?: boolean
  encoding?: string
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
  metadata: ParseMetadata
}

export interface ParseMetadata {
  totalRecords: number
  validRecords: number
  invalidRecords: number
  parseTime: number
  fileSize?: number
  fileName?: string
  encoding?: string
  parserEngine?: 'js' | 'wasm'
  chunksProcessed?: number
}

// Progress reporting for streaming
export interface ParseProgress {
  phase: 'initializing' | 'detecting' | 'parsing' | 'finalizing' | 'complete' | 'error' | 'cancelled'
  bytesProcessed: number
  totalBytes: number
  recordsProcessed: number
  percentage: number
  currentChunk?: number
  totalChunks?: number
  estimatedTimeRemaining?: number
  message?: string
}

export type ProgressCallback = (progress: ParseProgress) => void

// Cancelable parsing
export interface ParseController {
  cancel: () => void
  pause: () => void
  resume: () => void
  isPaused: boolean
  isCancelled: boolean
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

// Worker message types
export type WorkerMessageType =
  | 'parse'
  | 'progress'
  | 'result'
  | 'error'
  | 'cancel'
  | 'pause'
  | 'resume'
  | 'init'
  | 'ready'

export interface WorkerMessage {
  type: WorkerMessageType
  id: string
  payload?: unknown
}

export interface ParseRequest {
  id: string
  data: string | ArrayBuffer
  config: ParserConfig
  options?: {
    streaming?: boolean
    chunkSize?: number
    sampleSize?: number
  }
}

export interface ParseResult {
  id: string
  success: boolean
  data?: ParsedData
  error?: string
}

// Encoding detection
export type EncodingType =
  | 'utf-8'
  | 'utf-16'
  | 'utf-16be'
  | 'utf-16le'
  | 'iso-8859-1'
  | 'windows-1252'
  | 'ascii'

export interface EncodingInfo {
  encoding: EncodingType
  confidence: number
  hasBOM: boolean
}

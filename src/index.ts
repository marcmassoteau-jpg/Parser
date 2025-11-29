// Visual Parser Module v2.0 - High-Performance Parsing with WASM Acceleration
// Main Export API

// ============================================
// PARSER SERVICE (Primary API)
// ============================================
export { ParserService } from './parsers/ParserService'
export { useParser } from './hooks/useParser'

// ============================================
// CORE PARSERS
// ============================================
export { parse, detectParserType, suggestDelimiter } from './parsers'
export { parseCSV } from './parsers/csvParser'
export { parseFixedWidth } from './parsers/fixedWidthParser'
export { parseFIN } from './parsers/finParser'
export { parseISO20022 } from './parsers/iso20022Parser'
export { parseCustom } from './parsers/customParser'

// Streaming Parsers
export { parseCSVStreaming, parseCSVFile } from './parsers/streaming/csvStreamingParser'

// Utilities
export { detectEncoding, decodeBuffer, getEncodingDisplayName } from './parsers/utils/encodingDetector'

// ============================================
// STATE MANAGEMENT
// ============================================
export { useParserStore, selectIsReady, selectCanUseWasm, selectCanUseWorker, selectParseStats } from './store/parserStore'

// ============================================
// UI COMPONENTS
// ============================================
// Layout
export { Header } from './components/Layout/Header'
export { Sidebar } from './components/Layout/Sidebar'
export { MobileNav } from './components/Layout/MobileNav'

// Canvas
export { ParserCanvas } from './components/Canvas/ParserCanvas'
export { EmptyState } from './components/Canvas/EmptyState'

// Config & Preview
export { ConfigPanel } from './components/Config/ConfigPanel'
export { DataPreview } from './components/Preview/DataPreview'
export { MappingPanel } from './components/Mapping/MappingPanel'

// New High-Performance Components
export { ProgressBar } from './components/Progress/ProgressBar'
export { VirtualizedTable } from './components/Preview/VirtualizedTable'

// Node Components (for custom canvas implementations)
export { SourceNode } from './components/Canvas/nodes/SourceNode'
export { HeaderNode } from './components/Canvas/nodes/HeaderNode'
export { TransactionNode } from './components/Canvas/nodes/TransactionNode'
export { FieldNode } from './components/Canvas/nodes/FieldNode'
export { OutputNode } from './components/Canvas/nodes/OutputNode'

// ============================================
// TYPE EXPORTS
// ============================================
export type {
  // Core types
  ParserType,
  ParserConfig,
  FieldDefinition,
  ParsedField,
  ParsedRecord,
  ParsedData,
  ParseMetadata,

  // Progress & Control
  ParseProgress,
  ParseController,
  ProgressCallback,

  // Node types
  ParserNodeData,

  // Mapping types
  FieldMapping,
  TransformationType,
  TargetSchema,
  TargetField,

  // Financial message types
  FINBlock,
  FINField,
  FINSubfield,
  ISO20022Message,

  // Encoding types
  EncodingType,
  EncodingInfo,

  // Worker types
  WorkerMessage,
  WorkerMessageType,
  ParseRequest,
  ParseResult,
} from './types/parser'

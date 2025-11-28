// Visual Parser Module - Main Export
// This file provides a clean API for integrating the parser into other applications

// Core Parser Exports
export { parse, detectParserType, suggestDelimiter } from './parsers'
export { parseCSV } from './parsers/csvParser'
export { parseFixedWidth } from './parsers/fixedWidthParser'
export { parseFIN } from './parsers/finParser'
export { parseISO20022 } from './parsers/iso20022Parser'
export { parseCustom } from './parsers/customParser'

// Type Exports
export type {
  ParserType,
  ParserConfig,
  FieldDefinition,
  ParsedField,
  ParsedRecord,
  ParsedData,
  ParserNodeData,
  FieldMapping,
  TransformationType,
  TargetSchema,
  TargetField,
  FINBlock,
  FINField,
  FINSubfield,
  ISO20022Message,
} from './types/parser'

// Store Export (for state management integration)
export { useParserStore } from './store/parserStore'

// Component Exports (for custom UI integration)
export { Header } from './components/Layout/Header'
export { Sidebar } from './components/Layout/Sidebar'
export { MobileNav } from './components/Layout/MobileNav'
export { ParserCanvas } from './components/Canvas/ParserCanvas'
export { EmptyState } from './components/Canvas/EmptyState'
export { ConfigPanel } from './components/Config/ConfigPanel'
export { DataPreview } from './components/Preview/DataPreview'
export { MappingPanel } from './components/Mapping/MappingPanel'

// Node Components (for custom canvas implementations)
export { SourceNode } from './components/Canvas/nodes/SourceNode'
export { HeaderNode } from './components/Canvas/nodes/HeaderNode'
export { TransactionNode } from './components/Canvas/nodes/TransactionNode'
export { FieldNode } from './components/Canvas/nodes/FieldNode'
export { OutputNode } from './components/Canvas/nodes/OutputNode'

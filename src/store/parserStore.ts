import { create } from 'zustand'
import { Node, Edge } from 'reactflow'
import type {
  ParserConfig,
  ParsedData,
  ParserNodeData,
  FieldMapping,
  TargetSchema,
  ParseProgress,
  ParseController,
} from '../types/parser'

interface ParserState {
  // Parser Configuration
  config: ParserConfig
  setConfig: (config: Partial<ParserConfig>) => void

  // Raw Input Data
  rawData: string
  setRawData: (data: string) => void
  fileName: string | null
  setFileName: (name: string | null) => void

  // Parsed Data
  parsedData: ParsedData | null
  setParsedData: (data: ParsedData | null) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
  error: string | null
  setError: (error: string | null) => void

  // Progress tracking (new)
  progress: ParseProgress | null
  setProgress: (progress: ParseProgress | null) => void
  parseController: ParseController | null
  setParseController: (controller: ParseController | null) => void

  // Parser service status (new)
  serviceStatus: {
    workerReady: boolean
    wasmAvailable: boolean
    initialized: boolean
  }
  setServiceStatus: (status: Partial<ParserState['serviceStatus']>) => void

  // React Flow Nodes & Edges
  nodes: Node<ParserNodeData>[]
  edges: Edge[]
  setNodes: (nodes: Node<ParserNodeData>[]) => void
  setEdges: (edges: Edge[]) => void
  addNode: (node: Node<ParserNodeData>) => void
  updateNode: (id: string, data: Partial<ParserNodeData>) => void
  removeNode: (id: string) => void

  // Mapping
  mappings: FieldMapping[]
  setMappings: (mappings: FieldMapping[]) => void
  addMapping: (mapping: FieldMapping) => void
  updateMapping: (id: string, mapping: Partial<FieldMapping>) => void
  removeMapping: (id: string) => void

  // Target Schema
  targetSchema: TargetSchema | null
  setTargetSchema: (schema: TargetSchema | null) => void

  // UI State
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
  expandedNodes: Set<string>
  toggleNodeExpansion: (id: string) => void

  // Performance settings (new)
  performanceSettings: {
    useWorker: boolean
    useWasm: boolean
    streaming: boolean
    chunkSize: number
  }
  setPerformanceSettings: (settings: Partial<ParserState['performanceSettings']>) => void

  // Actions
  reset: () => void
  cancelParsing: () => void
}

const initialConfig: ParserConfig = {
  type: 'csv',
  name: 'New Parser',
  delimiter: ',',
  hasHeader: true,
  quoteChar: '"',
  escapeChar: '\\',
}

const initialServiceStatus = {
  workerReady: false,
  wasmAvailable: false,
  initialized: false,
}

const initialPerformanceSettings = {
  useWorker: true,
  useWasm: true,
  streaming: true,
  chunkSize: 64 * 1024, // 64KB
}

export const useParserStore = create<ParserState>((set, get) => ({
  // Parser Configuration
  config: initialConfig,
  setConfig: (newConfig) => set((state) => ({
    config: { ...state.config, ...newConfig }
  })),

  // Raw Input Data
  rawData: '',
  setRawData: (data) => set({ rawData: data }),
  fileName: null,
  setFileName: (name) => set({ fileName: name }),

  // Parsed Data
  parsedData: null,
  setParsedData: (data) => set({ parsedData: data }),
  isProcessing: false,
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  error: null,
  setError: (error) => set({ error }),

  // Progress tracking
  progress: null,
  setProgress: (progress) => set({ progress }),
  parseController: null,
  setParseController: (controller) => set({ parseController: controller }),

  // Service status
  serviceStatus: initialServiceStatus,
  setServiceStatus: (status) => set((state) => ({
    serviceStatus: { ...state.serviceStatus, ...status }
  })),

  // React Flow Nodes & Edges
  nodes: [],
  edges: [],
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id, data) => set((state) => ({
    nodes: state.nodes.map((node) =>
      node.id === id ? { ...node, data: { ...node.data, ...data } } : node
    ),
  })),
  removeNode: (id) => set((state) => ({
    nodes: state.nodes.filter((node) => node.id !== id),
    edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
  })),

  // Mapping
  mappings: [],
  setMappings: (mappings) => set({ mappings }),
  addMapping: (mapping) => set((state) => ({
    mappings: [...state.mappings, mapping]
  })),
  updateMapping: (id, mapping) => set((state) => ({
    mappings: state.mappings.map((m) =>
      m.id === id ? { ...m, ...mapping } : m
    ),
  })),
  removeMapping: (id) => set((state) => ({
    mappings: state.mappings.filter((m) => m.id !== id),
  })),

  // Target Schema
  targetSchema: null,
  setTargetSchema: (schema) => set({ targetSchema: schema }),

  // UI State
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  expandedNodes: new Set(),
  toggleNodeExpansion: (id) => set((state) => {
    const newExpanded = new Set(state.expandedNodes)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    return { expandedNodes: newExpanded }
  }),

  // Performance settings
  performanceSettings: initialPerformanceSettings,
  setPerformanceSettings: (settings) => set((state) => ({
    performanceSettings: { ...state.performanceSettings, ...settings }
  })),

  // Actions
  reset: () => set({
    config: initialConfig,
    rawData: '',
    fileName: null,
    parsedData: null,
    isProcessing: false,
    error: null,
    progress: null,
    parseController: null,
    nodes: [],
    edges: [],
    mappings: [],
    targetSchema: null,
    selectedNodeId: null,
    expandedNodes: new Set(),
  }),

  cancelParsing: () => {
    const { parseController } = get()
    if (parseController) {
      parseController.cancel()
      set({
        isProcessing: false,
        progress: null,
        parseController: null,
      })
    }
  },
}))

// Selectors for common use cases
export const selectIsReady = (state: ParserState) =>
  state.serviceStatus.initialized && !state.isProcessing

export const selectCanUseWasm = (state: ParserState) =>
  state.serviceStatus.wasmAvailable && state.performanceSettings.useWasm

export const selectCanUseWorker = (state: ParserState) =>
  state.serviceStatus.workerReady && state.performanceSettings.useWorker

export const selectParseStats = (state: ParserState) => {
  if (!state.parsedData) return null
  return {
    totalRecords: state.parsedData.metadata.totalRecords,
    validRecords: state.parsedData.metadata.validRecords,
    invalidRecords: state.parsedData.metadata.invalidRecords,
    parseTime: state.parsedData.metadata.parseTime,
    fileSize: state.parsedData.metadata.fileSize,
    engine: state.parsedData.metadata.parserEngine,
  }
}

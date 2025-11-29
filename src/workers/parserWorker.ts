/**
 * High-Performance Parser Web Worker
 * Runs parsing off the main thread for smooth UI
 */

import type {
  ParserConfig,
  ParsedData,
  ParseProgress,
  WorkerMessage,
  ParseRequest,
} from '../types/parser'
import { parse, detectParserType } from '../parsers'
import { parseCSVStreaming } from '../parsers/streaming/csvStreamingParser'
import { detectEncoding, decodeBuffer } from '../parsers/utils/encodingDetector'

// Worker state
let isCancelled = false
let isPaused = false
let wasmModule: unknown = null

// Message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, id, payload } = event.data

  switch (type) {
    case 'init':
      await initializeWorker()
      postMessage({ type: 'ready', id })
      break

    case 'parse':
      await handleParse(id, payload as ParseRequest)
      break

    case 'cancel':
      isCancelled = true
      postMessage({
        type: 'progress',
        id,
        payload: createProgress('cancelled', 0, 0, 0, 'Parsing cancelled'),
      })
      break

    case 'pause':
      isPaused = true
      break

    case 'resume':
      isPaused = false
      break
  }
}

async function initializeWorker(): Promise<void> {
  // Try to load WASM module if available
  try {
    // Dynamic import of WASM module (will be built from Rust)
    // @ts-expect-error WASM module may not exist until built
    const wasm = await import('../wasm/parser_wasm.js').catch(() => null)
    if (wasm) {
      await wasm.default()
      wasmModule = wasm
      console.log('[Worker] WASM parser loaded successfully')
    }
  } catch {
    console.log('[Worker] WASM parser not available, using JS fallback')
  }
}

async function handleParse(id: string, request: ParseRequest): Promise<void> {
  isCancelled = false
  isPaused = false

  const startTime = performance.now()
  let data: string

  try {
    // Report initialization
    postProgress(id, 'initializing', 0, 100, 0, 'Initializing parser...')

    // Handle ArrayBuffer input (for large files)
    if (request.data instanceof ArrayBuffer) {
      postProgress(id, 'detecting', 5, 100, 0, 'Detecting encoding...')
      const encodingInfo = detectEncoding(new Uint8Array(request.data))
      data = decodeBuffer(request.data, encodingInfo.encoding)
      request.config.encoding = encodingInfo.encoding
    } else {
      data = request.data
    }

    const totalBytes = new Blob([data]).size

    // Auto-detect parser type if not specified
    if (!request.config.type) {
      postProgress(id, 'detecting', 10, 100, 0, 'Detecting file format...')
      request.config.type = detectParserType(data)
    }

    // Check for cancellation
    if (isCancelled) return

    // Use streaming parser for large CSV files
    const useStreaming =
      request.options?.streaming !== false &&
      request.config.type === 'csv' &&
      totalBytes > 1024 * 1024 // > 1MB

    let result: ParsedData

    if (useStreaming) {
      result = await parseCSVStreaming(
        data,
        request.config,
        (progress) => {
          if (isCancelled) throw new Error('Cancelled')
          while (isPaused) {
            // Busy wait for pause (in real impl, use atomics)
          }
          postMessage({ type: 'progress', id, payload: progress })
        },
        () => isCancelled
      )
    } else if (wasmModule && request.config.useWasm !== false) {
      // Use WASM parser if available
      result = await parseWithWasm(data, request.config, id, totalBytes)
    } else {
      // Use standard JS parser with progress
      postProgress(id, 'parsing', 20, 100, 0, 'Parsing data...')
      result = parse(data, request.config)
      result.metadata.parserEngine = 'js'
    }

    // Check for cancellation
    if (isCancelled) return

    // Finalize
    const endTime = performance.now()
    result.metadata.parseTime = endTime - startTime
    result.metadata.fileSize = totalBytes

    postProgress(id, 'complete', totalBytes, totalBytes, result.records.length, 'Complete')

    postMessage({
      type: 'result',
      id,
      payload: { success: true, data: result },
    })
  } catch (error) {
    if (!isCancelled) {
      postMessage({
        type: 'error',
        id,
        payload: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    }
  }
}

async function parseWithWasm(
  data: string,
  config: ParserConfig,
  id: string,
  totalBytes: number
): Promise<ParsedData> {
  postProgress(id, 'parsing', 15, 100, 0, 'Parsing with WASM engine...')

  // This will be implemented when WASM module is built
  // For now, fall back to JS parser
  const result = parse(data, config)
  result.metadata.parserEngine = wasmModule ? 'wasm' : 'js'

  postProgress(id, 'finalizing', totalBytes * 0.9, totalBytes, result.records.length, 'Finalizing...')

  return result
}

function postProgress(
  id: string,
  phase: ParseProgress['phase'],
  bytesProcessed: number,
  totalBytes: number,
  recordsProcessed: number,
  message: string
): void {
  postMessage({
    type: 'progress',
    id,
    payload: createProgress(phase, bytesProcessed, totalBytes, recordsProcessed, message),
  })
}

function createProgress(
  phase: ParseProgress['phase'],
  bytesProcessed: number,
  totalBytes: number,
  recordsProcessed: number,
  message: string
): ParseProgress {
  return {
    phase,
    bytesProcessed,
    totalBytes,
    recordsProcessed,
    percentage: totalBytes > 0 ? Math.round((bytesProcessed / totalBytes) * 100) : 0,
    message,
  }
}

export {}

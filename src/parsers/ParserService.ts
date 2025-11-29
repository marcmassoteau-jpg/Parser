/**
 * High-Performance Parser Service
 * Unified API for parsing with automatic WASM/Worker/JS fallback
 */

import type {
  ParserConfig,
  ParsedData,
  ParseProgress,
  ParseController,
  ProgressCallback,
} from '../types/parser'
import { parse, detectParserType, suggestDelimiter } from './index'

// Singleton worker instance
let workerInstance: Worker | null = null
let workerReady = false
let wasmAvailable = false
let requestCounter = 0

// Active parse requests
const pendingRequests = new Map<
  string,
  {
    resolve: (data: ParsedData) => void
    reject: (error: Error) => void
    onProgress?: ProgressCallback
  }
>()

/**
 * Parser Service - Main API
 */
export const ParserService = {
  /**
   * Initialize the parser service
   * Call this once at app startup
   */
  async initialize(): Promise<{ workerSupported: boolean; wasmAvailable: boolean }> {
    const workerSupported = typeof Worker !== 'undefined'

    if (workerSupported) {
      try {
        workerInstance = new Worker(new URL('../workers/parserWorker.ts', import.meta.url), {
          type: 'module',
        })

        // Set up message handler
        workerInstance.onmessage = handleWorkerMessage

        // Initialize worker
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Worker init timeout')), 5000)

          const initHandler = (event: MessageEvent) => {
            if (event.data.type === 'ready') {
              clearTimeout(timeout)
              workerReady = true
              wasmAvailable = event.data.payload?.wasmAvailable ?? false
              workerInstance?.removeEventListener('message', initHandler)
              resolve()
            }
          }

          workerInstance?.addEventListener('message', initHandler)
          workerInstance?.postMessage({ type: 'init', id: 'init' })
        })

        console.log('[ParserService] Worker initialized', { wasmAvailable })
      } catch (error) {
        console.warn('[ParserService] Worker initialization failed, using main thread', error)
        workerInstance = null
        workerReady = false
      }
    }

    return { workerSupported: workerReady, wasmAvailable }
  },

  /**
   * Parse data with automatic engine selection
   */
  async parse(
    data: string | ArrayBuffer,
    config: ParserConfig,
    options?: {
      onProgress?: ProgressCallback
      useWorker?: boolean
      useWasm?: boolean
      streaming?: boolean
    }
  ): Promise<{ data: ParsedData; controller: ParseController }> {
    const requestId = `parse-${++requestCounter}-${Date.now()}`
    const useWorker = options?.useWorker !== false && workerReady && workerInstance

    // Create controller for cancellation
    const controller = createController(requestId)

    const parsePromise = new Promise<ParsedData>((resolve, reject) => {
      if (useWorker) {
        // Use Web Worker
        pendingRequests.set(requestId, {
          resolve,
          reject,
          onProgress: options?.onProgress,
        })

        workerInstance!.postMessage({
          type: 'parse',
          id: requestId,
          payload: {
            id: requestId,
            data,
            config: { ...config, useWasm: options?.useWasm },
            options: { streaming: options?.streaming },
          },
        })
      } else {
        // Main thread fallback
        try {
          options?.onProgress?.({
            phase: 'parsing',
            bytesProcessed: 0,
            totalBytes: typeof data === 'string' ? data.length : data.byteLength,
            recordsProcessed: 0,
            percentage: 0,
            message: 'Parsing on main thread...',
          })

          const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
          const result = parse(stringData, config)

          options?.onProgress?.({
            phase: 'complete',
            bytesProcessed: result.metadata.fileSize || 0,
            totalBytes: result.metadata.fileSize || 0,
            recordsProcessed: result.records.length,
            percentage: 100,
            message: 'Complete',
          })

          resolve(result)
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)))
        }
      }
    })

    return { data: await parsePromise, controller }
  },

  /**
   * Parse a File object with streaming
   */
  async parseFile(
    file: File,
    config: ParserConfig,
    options?: {
      onProgress?: ProgressCallback
      useWorker?: boolean
      useWasm?: boolean
    }
  ): Promise<{ data: ParsedData; controller: ParseController }> {
    // Read file as ArrayBuffer for encoding detection
    const buffer = await file.arrayBuffer()

    return this.parse(buffer, { ...config, name: file.name }, {
      ...options,
      streaming: file.size > 1024 * 1024, // Auto-stream for files > 1MB
    })
  },

  /**
   * Detect parser type from data
   */
  detectType(data: string): ParserConfig['type'] {
    return detectParserType(data)
  },

  /**
   * Suggest CSV delimiter
   */
  suggestDelimiter(data: string): string {
    return suggestDelimiter(data)
  },

  /**
   * Get service status
   */
  getStatus(): {
    workerReady: boolean
    wasmAvailable: boolean
    pendingRequests: number
  } {
    return {
      workerReady,
      wasmAvailable,
      pendingRequests: pendingRequests.size,
    }
  },

  /**
   * Terminate worker and cleanup
   */
  terminate(): void {
    if (workerInstance) {
      workerInstance.terminate()
      workerInstance = null
      workerReady = false
    }
    pendingRequests.clear()
  },
}

/**
 * Handle messages from worker
 */
function handleWorkerMessage(event: MessageEvent): void {
  const { type, id, payload } = event.data

  const request = pendingRequests.get(id)
  if (!request && type !== 'ready') return

  switch (type) {
    case 'progress':
      request?.onProgress?.(payload as ParseProgress)
      break

    case 'result':
      if (payload.success) {
        request?.resolve(payload.data)
      } else {
        request?.reject(new Error(payload.error || 'Parse failed'))
      }
      pendingRequests.delete(id)
      break

    case 'error':
      request?.reject(new Error(payload.error || 'Parse error'))
      pendingRequests.delete(id)
      break
  }
}

/**
 * Create parse controller for cancellation
 */
function createController(requestId: string): ParseController {
  let isPaused = false
  let isCancelled = false

  return {
    cancel: () => {
      isCancelled = true
      if (workerInstance) {
        workerInstance.postMessage({ type: 'cancel', id: requestId })
      }
      pendingRequests.delete(requestId)
    },
    pause: () => {
      isPaused = true
      if (workerInstance) {
        workerInstance.postMessage({ type: 'pause', id: requestId })
      }
    },
    resume: () => {
      isPaused = false
      if (workerInstance) {
        workerInstance.postMessage({ type: 'resume', id: requestId })
      }
    },
    get isPaused() {
      return isPaused
    },
    get isCancelled() {
      return isCancelled
    },
  }
}

// Export types for consumers
export type { ParseProgress, ParseController, ProgressCallback }

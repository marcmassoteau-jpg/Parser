/**
 * useParser Hook
 * React hook for using the high-performance parser service
 */

import { useCallback, useEffect, useRef } from 'react'
import { useParserStore } from '../store/parserStore'
import { ParserService } from '../parsers/ParserService'
import type { ParserConfig, ParseProgress } from '../types/parser'

interface UseParserOptions {
  autoInitialize?: boolean
}

interface UseParserReturn {
  // State
  isProcessing: boolean
  progress: ParseProgress | null
  parsedData: import('../types/parser').ParsedData | null
  error: string | null

  // Service status
  isReady: boolean
  isWasmAvailable: boolean
  isWorkerReady: boolean

  // Actions
  parse: (data: string | File, config?: Partial<ParserConfig>) => Promise<void>
  cancel: () => void
  reset: () => void

  // Settings
  setUseWasm: (enabled: boolean) => void
  setUseWorker: (enabled: boolean) => void
  setStreaming: (enabled: boolean) => void
}

export function useParser(options: UseParserOptions = {}): UseParserReturn {
  const { autoInitialize = true } = options

  const store = useParserStore()
  const initRef = useRef(false)

  // Initialize parser service
  useEffect(() => {
    if (!autoInitialize || initRef.current) return

    initRef.current = true

    ParserService.initialize().then((status) => {
      store.setServiceStatus({
        workerReady: status.workerSupported,
        wasmAvailable: status.wasmAvailable,
        initialized: true,
      })
    })

    return () => {
      // Don't terminate on unmount - other components might use it
    }
  }, [autoInitialize, store])

  // Parse function
  const parse = useCallback(
    async (data: string | File, configOverride?: Partial<ParserConfig>) => {
      const config = { ...store.config, ...configOverride }

      store.setIsProcessing(true)
      store.setError(null)
      store.setProgress(null)

      try {
        const onProgress = (progress: ParseProgress) => {
          store.setProgress(progress)
        }

        let result

        if (data instanceof File) {
          result = await ParserService.parseFile(data, config, {
            onProgress,
            useWorker: store.performanceSettings.useWorker,
            useWasm: store.performanceSettings.useWasm,
          })
        } else {
          result = await ParserService.parse(data, config, {
            onProgress,
            useWorker: store.performanceSettings.useWorker,
            useWasm: store.performanceSettings.useWasm,
            streaming: store.performanceSettings.streaming,
          })
        }

        store.setParseController(result.controller)
        store.setParsedData(result.data)
        store.setProgress({ ...store.progress!, phase: 'complete' } as ParseProgress)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Parse failed'
        store.setError(message)
        store.setProgress({
          phase: 'error',
          bytesProcessed: 0,
          totalBytes: 0,
          recordsProcessed: 0,
          percentage: 0,
          message,
        })
      } finally {
        store.setIsProcessing(false)
      }
    },
    [store]
  )

  // Cancel parsing
  const cancel = useCallback(() => {
    store.cancelParsing()
  }, [store])

  // Reset state
  const reset = useCallback(() => {
    store.reset()
  }, [store])

  // Settings
  const setUseWasm = useCallback(
    (enabled: boolean) => {
      store.setPerformanceSettings({ useWasm: enabled })
    },
    [store]
  )

  const setUseWorker = useCallback(
    (enabled: boolean) => {
      store.setPerformanceSettings({ useWorker: enabled })
    },
    [store]
  )

  const setStreaming = useCallback(
    (enabled: boolean) => {
      store.setPerformanceSettings({ streaming: enabled })
    },
    [store]
  )

  return {
    // State
    isProcessing: store.isProcessing,
    progress: store.progress,
    parsedData: store.parsedData,
    error: store.error,

    // Service status
    isReady: store.serviceStatus.initialized,
    isWasmAvailable: store.serviceStatus.wasmAvailable,
    isWorkerReady: store.serviceStatus.workerReady,

    // Actions
    parse,
    cancel,
    reset,

    // Settings
    setUseWasm,
    setUseWorker,
    setStreaming,
  }
}

export default useParser

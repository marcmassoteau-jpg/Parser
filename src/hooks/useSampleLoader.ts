/**
 * useSampleLoader Hook
 * Hook for loading sample data into the parser store
 */

import { useCallback } from 'react'
import { useParserStore } from '../store/parserStore'
import { parse, detectParserType, suggestDelimiter } from '../parsers'
import type { SampleDataItem } from '../data/sampleData'
import type { ParserConfig } from '../types/parser'

interface UseSampleLoaderReturn {
  loadSample: (sample: SampleDataItem) => Promise<void>
  isLoading: boolean
  error: string | null
}

export function useSampleLoader(): UseSampleLoaderReturn {
  const {
    config,
    setConfig,
    setRawData,
    setFileName,
    setParsedData,
    setIsProcessing,
    setError,
    isProcessing,
    error,
  } = useParserStore()

  const loadSample = useCallback(
    async (sample: SampleDataItem) => {
      setIsProcessing(true)
      setError(null)

      try {
        // Set raw data and file name
        setRawData(sample.data)
        setFileName(sample.fileName)

        // Detect parser type (use sample format as primary, fall back to detection)
        let detectedType = detectParserType(sample.data)

        // Override detection for explicit format types
        if (sample.format === 'fixed-width') {
          detectedType = 'fixed-width'
        } else if (sample.format === 'fin') {
          detectedType = 'fin'
        } else if (sample.format === 'iso20022') {
          detectedType = 'iso20022'
        } else if (sample.format === 'csv') {
          detectedType = 'csv'
        }

        // Build new config
        const newConfig: Partial<ParserConfig> = {
          ...config,
          type: detectedType,
          name: sample.fileName,
        }

        // CSV-specific: detect delimiter
        if (detectedType === 'csv') {
          newConfig.delimiter = suggestDelimiter(sample.data)
          newConfig.hasHeader = true
        }

        // Fixed-width specific: add field definitions
        if (sample.format === 'fixed-width' && sample.fieldDefinitions) {
          newConfig.fieldDefinitions = sample.fieldDefinitions
        }

        // Custom pattern if provided
        if (sample.customPattern) {
          newConfig.customPattern = sample.customPattern
        }

        // Update store config
        setConfig(newConfig)

        // Parse the data
        const result = parse(sample.data, { ...config, ...newConfig })
        setParsedData(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load sample data'
        setError(errorMessage)
      } finally {
        setIsProcessing(false)
      }
    },
    [config, setConfig, setRawData, setFileName, setParsedData, setIsProcessing, setError]
  )

  return {
    loadSample,
    isLoading: isProcessing,
    error,
  }
}

export default useSampleLoader

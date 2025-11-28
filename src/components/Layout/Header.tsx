import { useState } from 'react'
import { useParserStore } from '../../store/parserStore'
import { parse, detectParserType, suggestDelimiter } from '../../parsers'
import {
  DocumentTextIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

export function Header() {
  const {
    config,
    setConfig,
    rawData,
    setRawData,
    setFileName,
    setParsedData,
    setIsProcessing,
    setError,
    reset,
  } = useParserStore()

  const [showHelp, setShowHelp] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const text = await file.text()
      setRawData(text)
      setFileName(file.name)

      // Auto-detect parser type
      const detectedType = detectParserType(text)
      const newConfig = { ...config, type: detectedType, name: file.name }

      // If CSV, suggest delimiter
      if (detectedType === 'csv') {
        newConfig.delimiter = suggestDelimiter(text)
      }

      setConfig(newConfig)

      // Parse the data
      const result = parse(text, newConfig)
      setParsedData(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to read file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReparse = () => {
    if (!rawData) return
    setIsProcessing(true)
    setError(null)

    try {
      const result = parse(rawData, config)
      setParsedData(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to parse data')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = () => {
    const { parsedData, mappings, targetSchema } = useParserStore.getState()
    if (!parsedData) return

    const exportData = {
      config,
      parsedData,
      mappings,
      targetSchema,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `parser-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center px-6 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
          <DocumentTextIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Visual Parser</h1>
          <p className="text-xs text-slate-500">Parse & Map Any Format</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center gap-2">
        <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-full">
          <span className="text-xs font-medium text-slate-500">Format:</span>
          <span className="text-xs font-semibold text-slate-700 uppercase">{config.type}</span>
        </div>
        {config.name && (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 rounded-full">
            <span className="text-xs font-medium text-primary-600">{config.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="relative cursor-pointer">
          <input
            type="file"
            onChange={handleFileUpload}
            className="sr-only"
            accept=".csv,.txt,.xml,.mt,.fin,.json"
          />
          <span className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
            <CloudArrowUpIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Upload</span>
          </span>
        </label>

        <button
          onClick={handleReparse}
          disabled={!rawData}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Re-parse with current settings"
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>

        <button
          onClick={handleExport}
          disabled={!rawData}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export configuration"
        >
          <CloudArrowDownIcon className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-slate-200" />

        <button
          onClick={reset}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          title="Reset all"
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors relative"
          title="Help"
        >
          <InformationCircleIcon className="w-5 h-5" />
        </button>
      </div>

      {showHelp && (
        <div className="absolute top-16 right-6 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-fade-in">
          <h3 className="font-semibold text-slate-900 mb-2">Getting Started</h3>
          <ul className="text-sm text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary-500 font-bold">1.</span>
              Upload a file (CSV, Fixed Width, FIN, ISO 20022, or custom)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 font-bold">2.</span>
              The parser auto-detects the format and parses the data
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 font-bold">3.</span>
              Adjust configuration in the right panel if needed
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 font-bold">4.</span>
              Use the mapping tab to map fields to your target schema
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 font-bold">5.</span>
              Export your configuration for reuse
            </li>
          </ul>
          <button
            onClick={() => setShowHelp(false)}
            className="mt-4 w-full py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </header>
  )
}

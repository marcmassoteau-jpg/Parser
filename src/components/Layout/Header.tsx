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
  Bars3Icon,
  EllipsisVerticalIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface HeaderProps {
  isMobile?: boolean
  onMenuClick?: () => void
}

export function Header({ isMobile, onMenuClick }: HeaderProps) {
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
  const [showMobileActions, setShowMobileActions] = useState(false)

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
    <header className="h-14 md:h-16 border-b border-slate-200 bg-white flex items-center px-4 md:px-6 gap-3 md:gap-4 safe-area-top">
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Bars3Icon className="w-6 h-6 text-slate-600" />
        </button>
      )}

      {/* Logo */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
          <DocumentTextIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        {!isMobile && (
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Visual Parser</h1>
            <p className="text-xs text-slate-500">Parse & Map Any Format</p>
          </div>
        )}
      </div>

      {/* Center info - desktop only */}
      {!isMobile && (
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-full">
            <span className="text-xs font-medium text-slate-500">Format:</span>
            <span className="text-xs font-semibold text-slate-700 uppercase">{config.type}</span>
          </div>
          {config.name && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 rounded-full max-w-[200px]">
              <span className="text-xs font-medium text-primary-600 truncate">{config.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Mobile: format badge */}
      {isMobile && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full">
            <span className="text-xs font-semibold text-slate-700 uppercase">{config.type}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        <label className="relative cursor-pointer">
          <input
            type="file"
            onChange={handleFileUpload}
            className="sr-only"
            accept=".csv,.txt,.xml,.mt,.fin,.json"
          />
          <span className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
            <CloudArrowUpIcon className="w-5 h-5" />
            {!isMobile && <span className="text-sm font-medium">Upload</span>}
          </span>
        </label>

        {!isMobile && (
          <>
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
          </>
        )}

        {isMobile && (
          <button
            onClick={() => setShowMobileActions(!showMobileActions)}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              showMobileActions ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-700'
            )}
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mobile Actions Menu */}
      {isMobile && showMobileActions && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMobileActions(false)}
          />
          <div className="absolute top-14 right-3 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
            <button
              onClick={() => {
                handleReparse()
                setShowMobileActions(false)
              }}
              disabled={!rawData}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5 text-slate-500" />
              <span>Re-parse Data</span>
            </button>

            <button
              onClick={() => {
                handleExport()
                setShowMobileActions(false)
              }}
              disabled={!rawData}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CloudArrowDownIcon className="w-5 h-5 text-slate-500" />
              <span>Export Config</span>
            </button>

            <div className="h-px bg-slate-200 my-2" />

            <button
              onClick={() => {
                reset()
                setShowMobileActions(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Cog6ToothIcon className="w-5 h-5 text-slate-500" />
              <span>Reset All</span>
            </button>

            <button
              onClick={() => {
                setShowMobileActions(false)
                setShowHelp(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <InformationCircleIcon className="w-5 h-5 text-slate-500" />
              <span>Help & Tips</span>
            </button>
          </div>
        </>
      )}

      {/* Help Modal */}
      {showHelp && (
        <>
          {isMobile && (
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowHelp(false)}
            />
          )}
          <div className={clsx(
            'bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-fade-in',
            isMobile
              ? 'fixed top-1/2 left-4 right-4 -translate-y-1/2 max-h-[80vh] overflow-auto'
              : 'absolute top-16 right-6 w-80'
          )}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Getting Started</h3>
              {isMobile && (
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 rounded-lg hover:bg-slate-100"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-500" />
                </button>
              )}
            </div>
            <ul className="text-sm text-slate-600 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold min-w-[20px]">1.</span>
                <span>Upload a file (CSV, Fixed Width, FIN, ISO 20022, or custom)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold min-w-[20px]">2.</span>
                <span>The parser auto-detects the format and parses the data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold min-w-[20px]">3.</span>
                <span>Adjust configuration in the {isMobile ? 'bottom' : 'right'} panel if needed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold min-w-[20px]">4.</span>
                <span>Use the mapping tab to map fields to your target schema</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold min-w-[20px]">5.</span>
                <span>Export your configuration for reuse</span>
              </li>
            </ul>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors rounded-lg"
            >
              Got it
            </button>
          </div>
        </>
      )}
    </header>
  )
}

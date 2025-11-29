import { CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useParserStore } from '../../store/parserStore'
import { parse, detectParserType, suggestDelimiter } from '../../parsers'
import { SampleSelector } from '../SampleSelector/SampleSelector'
import { useSampleLoader } from '../../hooks/useSampleLoader'

export function EmptyState() {
  const { config, setConfig, setRawData, setFileName, setParsedData, setIsProcessing, setError, isProcessing, error } = useParserStore()
  const { loadSample } = useSampleLoader()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const text = await file.text()
      setRawData(text)
      setFileName(file.name)

      const detectedType = detectParserType(text)
      const newConfig = { ...config, type: detectedType, name: file.name }

      if (detectedType === 'csv') {
        newConfig.delimiter = suggestDelimiter(text)
      }

      setConfig(newConfig)
      const result = parse(text, newConfig)
      setParsedData(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to read file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const text = await file.text()
      setRawData(text)
      setFileName(file.name)

      const detectedType = detectParserType(text)
      const newConfig = { ...config, type: detectedType, name: file.name }

      if (detectedType === 'csv') {
        newConfig.delimiter = suggestDelimiter(text)
      }

      setConfig(newConfig)
      const result = parse(text, newConfig)
      setParsedData(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to read file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="max-w-2xl w-full mx-auto px-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <DocumentTextIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Visual Parser</h2>
          <p className="text-slate-600">
            Upload a file or try a sample to get started with parsing and mapping
          </p>
        </div>

        <label className="block cursor-pointer mb-8">
          <input
            type="file"
            onChange={handleFileUpload}
            className="sr-only"
            accept=".csv,.txt,.xml,.mt,.fin,.json"
          />
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-all">
            <CloudArrowUpIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-700 mb-1">
              Drop your file here or click to browse
            </p>
            <p className="text-sm text-slate-500">
              Supports CSV, Fixed Width, SWIFT FIN, ISO 20022 XML, and custom formats
            </p>
          </div>
        </label>

        {/* Loading indicator */}
        {isProcessing && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <span className="text-sm text-blue-600">Processing...</span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 font-medium">Error: {error}</p>
          </div>
        )}

        <div className="text-center">
          <span className="text-sm text-slate-500 block mb-4">Or try a sample</span>
          <SampleSelector onSelectSample={loadSample} disabled={isProcessing} />
        </div>
      </div>
    </div>
  )
}

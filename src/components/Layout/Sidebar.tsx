import { useParserStore } from '../../store/parserStore'
import type { ParserType } from '../../types/parser'
import {
  TableCellsIcon,
  Bars3BottomLeftIcon,
  BanknotesIcon,
  DocumentIcon,
  CodeBracketIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface ParserOption {
  type: ParserType
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  color: string
}

const parserOptions: ParserOption[] = [
  {
    type: 'csv',
    name: 'CSV',
    icon: TableCellsIcon,
    description: 'Comma, semicolon, or tab-separated values',
    color: 'bg-green-500',
  },
  {
    type: 'fixed-width',
    name: 'Fixed Width',
    icon: Bars3BottomLeftIcon,
    description: 'Fixed column positions',
    color: 'bg-blue-500',
  },
  {
    type: 'fin',
    name: 'SWIFT FIN',
    icon: BanknotesIcon,
    description: 'MT messages (103, 202, 940, etc.)',
    color: 'bg-amber-500',
  },
  {
    type: 'iso20022',
    name: 'ISO 20022',
    icon: DocumentIcon,
    description: 'pain, camt, pacs XML messages',
    color: 'bg-purple-500',
  },
  {
    type: 'custom',
    name: 'Custom',
    icon: CodeBracketIcon,
    description: 'Pattern-based or custom logic',
    color: 'bg-slate-500',
  },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { config, setConfig, rawData, setParsedData, setIsProcessing, setError } = useParserStore()

  const handleTypeChange = async (type: ParserType) => {
    setConfig({ type })

    if (rawData) {
      setIsProcessing(true)
      setError(null)

      try {
        const { parse } = await import('../../parsers')
        const result = parse(rawData, { ...config, type })
        setParsedData(result)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to parse data')
      } finally {
        setIsProcessing(false)
      }
    }

    // Close sidebar on mobile after selection
    onClose?.()
  }

  return (
    <aside className="w-64 md:w-64 h-full border-r border-slate-200 bg-white flex flex-col">
      {/* Mobile header with close button */}
      {onClose && (
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Parser Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      )}

      <div className="p-4 border-b border-slate-100">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Parser Type
        </h2>
        <div className="space-y-1">
          {parserOptions.map((option) => {
            const Icon = option.icon
            const isActive = config.type === option.type

            return (
              <button
                key={option.type}
                onClick={() => handleTypeChange(option.type)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left',
                  isActive
                    ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <div
                  className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                    isActive ? `${option.color} shadow-md` : 'bg-slate-100'
                  )}
                >
                  <Icon className={clsx('w-5 h-5', isActive ? 'text-white' : 'text-slate-500')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={clsx('text-sm font-medium', isActive && 'font-semibold')}>
                    {option.name}
                  </div>
                  <div className="text-xs text-slate-400 truncate">{option.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <SparklesIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-sm font-medium">Auto-detect Format</span>
              <p className="text-xs text-slate-400">Analyze and detect file type</p>
            </div>
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Pro Tips</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Drag nodes on the canvas to organize your parsing workflow. Use the mapping panel to
            transform data to your target schema.
          </p>
        </div>
      </div>
    </aside>
  )
}

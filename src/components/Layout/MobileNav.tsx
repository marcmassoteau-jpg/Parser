import {
  Cog6ToothIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { useParserStore } from '../../store/parserStore'

interface MobileNavProps {
  onPanelToggle: () => void
  isPanelOpen: boolean
}

export function MobileNav({ onPanelToggle, isPanelOpen }: MobileNavProps) {
  const { parsedData } = useParserStore()

  return (
    <nav className="h-16 bg-white border-t border-slate-200 flex items-center justify-around px-4 safe-area-bottom">
      <button
        onClick={onPanelToggle}
        className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors hover:bg-slate-100"
      >
        <Cog6ToothIcon className="w-6 h-6 text-slate-600" />
        <span className="text-xs text-slate-600">Config</span>
      </button>

      <button
        onClick={onPanelToggle}
        className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors hover:bg-slate-100"
      >
        <DocumentTextIcon className="w-6 h-6 text-slate-600" />
        <span className="text-xs text-slate-600">Preview</span>
      </button>

      <button
        onClick={onPanelToggle}
        className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors hover:bg-slate-100 relative"
      >
        <ArrowsRightLeftIcon className="w-6 h-6 text-slate-600" />
        <span className="text-xs text-slate-600">Mapping</span>
        {parsedData && (
          <span className="absolute top-1 right-2 w-2 h-2 bg-green-500 rounded-full" />
        )}
      </button>

      <button
        onClick={onPanelToggle}
        className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-primary-50 transition-colors"
      >
        {isPanelOpen ? (
          <ChevronDownIcon className="w-6 h-6 text-primary-600" />
        ) : (
          <ChevronUpIcon className="w-6 h-6 text-primary-600" />
        )}
        <span className="text-xs text-primary-600 font-medium">
          {isPanelOpen ? 'Close' : 'Panel'}
        </span>
      </button>
    </nav>
  )
}

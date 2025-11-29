import {
  Cog6ToothIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useParserStore } from '../../store/parserStore'
import clsx from 'clsx'

type PanelType = 'config' | 'preview' | 'mapping'

interface MobileNavProps {
  activePanel: PanelType
  onPanelChange: (panel: PanelType) => void
  isPanelOpen: boolean
  onPanelClose: () => void
}

export function MobileNav({ activePanel, onPanelChange, isPanelOpen, onPanelClose }: MobileNavProps) {
  const { parsedData } = useParserStore()

  const handlePanelSelect = (panel: PanelType) => {
    onPanelChange(panel)
  }

  return (
    <nav className="h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 safe-area-bottom shadow-lg">
      <button
        onClick={() => handlePanelSelect('config')}
        className={clsx(
          'flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all flex-1 max-w-[80px]',
          activePanel === 'config' && isPanelOpen
            ? 'bg-primary-100 text-primary-700'
            : 'text-slate-500 hover:bg-slate-50 active:bg-slate-100'
        )}
      >
        <Cog6ToothIcon className={clsx(
          'w-6 h-6',
          activePanel === 'config' && isPanelOpen ? 'text-primary-600' : 'text-slate-500'
        )} />
        <span className={clsx(
          'text-xs font-medium',
          activePanel === 'config' && isPanelOpen ? 'text-primary-700' : 'text-slate-500'
        )}>Config</span>
      </button>

      <button
        onClick={() => handlePanelSelect('preview')}
        className={clsx(
          'flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all flex-1 max-w-[80px]',
          activePanel === 'preview' && isPanelOpen
            ? 'bg-primary-100 text-primary-700'
            : 'text-slate-500 hover:bg-slate-50 active:bg-slate-100'
        )}
      >
        <DocumentTextIcon className={clsx(
          'w-6 h-6',
          activePanel === 'preview' && isPanelOpen ? 'text-primary-600' : 'text-slate-500'
        )} />
        <span className={clsx(
          'text-xs font-medium',
          activePanel === 'preview' && isPanelOpen ? 'text-primary-700' : 'text-slate-500'
        )}>Preview</span>
      </button>

      <button
        onClick={() => handlePanelSelect('mapping')}
        className={clsx(
          'flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all flex-1 max-w-[80px] relative',
          activePanel === 'mapping' && isPanelOpen
            ? 'bg-primary-100 text-primary-700'
            : 'text-slate-500 hover:bg-slate-50 active:bg-slate-100'
        )}
      >
        <ArrowsRightLeftIcon className={clsx(
          'w-6 h-6',
          activePanel === 'mapping' && isPanelOpen ? 'text-primary-600' : 'text-slate-500'
        )} />
        <span className={clsx(
          'text-xs font-medium',
          activePanel === 'mapping' && isPanelOpen ? 'text-primary-700' : 'text-slate-500'
        )}>Mapping</span>
        {parsedData && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>

      {isPanelOpen && (
        <button
          onClick={onPanelClose}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-all flex-1 max-w-[80px]"
        >
          <XMarkIcon className="w-6 h-6" />
          <span className="text-xs font-medium">Close</span>
        </button>
      )}
    </nav>
  )
}

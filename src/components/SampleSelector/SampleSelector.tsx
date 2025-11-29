/**
 * SampleSelector Component
 * Dropdown component for selecting and loading sample data
 */

import { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import {
  BeakerIcon,
  ChevronDownIcon,
  TableCellsIcon,
  Bars3BottomLeftIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  SAMPLE_DATA_CATALOG,
  getFormatDisplayInfo,
  type SampleDataItem,
  type SampleFormat,
} from '../../data/sampleData'

type FilterTab = 'all' | SampleFormat

interface SampleSelectorProps {
  onSelectSample: (sample: SampleDataItem) => void
  disabled?: boolean
}

const formatIcons: Record<SampleFormat, React.ComponentType<{ className?: string }>> = {
  csv: TableCellsIcon,
  'fixed-width': Bars3BottomLeftIcon,
  fin: DocumentTextIcon,
  iso20022: CodeBracketIcon,
}

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'csv', label: 'CSV' },
  { id: 'fixed-width', label: 'Fixed Width' },
  { id: 'fin', label: 'SWIFT FIN' },
  { id: 'iso20022', label: 'ISO 20022' },
]

export function SampleSelector({ onSelectSample, disabled }: SampleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const filteredSamples =
    activeFilter === 'all'
      ? SAMPLE_DATA_CATALOG
      : SAMPLE_DATA_CATALOG.filter((sample) => sample.format === activeFilter)

  const handleSelectSample = (sample: SampleDataItem) => {
    onSelectSample(sample)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl',
          'bg-white border border-slate-200 shadow-sm',
          'text-sm font-medium text-slate-700',
          'transition-all duration-200',
          'hover:border-primary-300 hover:shadow-md',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <BeakerIcon className="w-5 h-5 text-primary-500" />
        <span>Try a sample</span>
        <ChevronDownIcon
          className={clsx(
            'w-4 h-4 text-slate-400 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/10 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown content */}
          <div
            className={clsx(
              'absolute z-50 mt-2 w-80 md:w-96',
              'bg-white rounded-xl border border-slate-200 shadow-xl',
              'animate-scale-in origin-top-left'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Select Sample Data</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 px-3 py-2 border-b border-slate-100 overflow-x-auto">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap',
                    'transition-colors duration-150',
                    activeFilter === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sample List */}
            <div className="max-h-72 overflow-y-auto p-2">
              {filteredSamples.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No samples available for this format
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredSamples.map((sample) => {
                    const FormatIcon = formatIcons[sample.format]
                    const formatInfo = getFormatDisplayInfo(sample.format)

                    return (
                      <button
                        key={sample.id}
                        onClick={() => handleSelectSample(sample)}
                        className={clsx(
                          'w-full flex items-start gap-3 p-3 rounded-lg',
                          'text-left transition-all duration-150',
                          'hover:bg-slate-50 active:bg-slate-100',
                          'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500'
                        )}
                      >
                        {/* Format Icon */}
                        <div
                          className={clsx(
                            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                            formatInfo.bgColor
                          )}
                        >
                          <FormatIcon className={clsx('w-5 h-5', formatInfo.color)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 truncate">
                              {sample.name}
                            </span>
                            <span
                              className={clsx(
                                'flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase',
                                formatInfo.bgColor,
                                formatInfo.color
                              )}
                            >
                              {sample.subType || formatInfo.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {sample.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 rounded-b-xl">
              <p className="text-[11px] text-slate-400 text-center">
                Click a sample to load it into the parser
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SampleSelector

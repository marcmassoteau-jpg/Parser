import { useState } from 'react'
import { useParserStore } from '../../store/parserStore'
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TableCellsIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

export function DataPreview() {
  const { parsedData, rawData } = useParserStore()
  const [viewMode, setViewMode] = useState<'table' | 'raw' | 'json'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 20

  if (!parsedData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
        <TableCellsIcon className="w-16 h-16 mb-4 text-slate-300" />
        <p className="text-center">No data to preview. Upload a file to get started.</p>
      </div>
    )
  }

  const filteredRecords = parsedData.records.filter((record) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      record.raw.toLowerCase().includes(query) ||
      record.fields.some(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          String(f.value).toLowerCase().includes(query)
      )
    )
  })

  const totalPages = Math.ceil(filteredRecords.length / pageSize)
  const paginatedRecords = filteredRecords.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  )

  const headers = parsedData.headers || []

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(0)
              }}
              placeholder="Search records..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('table')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <TableCellsIcon className="w-4 h-4" />
            Table
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
              viewMode === 'raw'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <CodeBracketIcon className="w-4 h-4" />
            Raw
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
              viewMode === 'json'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <CodeBracketIcon className="w-4 h-4" />
            JSON
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {viewMode === 'table' && (
          <div className="min-w-full">
            {headers.length > 0 && (
              <div className="sticky top-0 bg-slate-50 border-b border-slate-200 flex text-xs font-medium text-slate-500 uppercase">
                <div className="w-12 px-3 py-2 text-center">#</div>
                {headers.slice(0, 5).map((header, index) => (
                  <div
                    key={index}
                    className="flex-1 min-w-[100px] px-3 py-2 truncate"
                    title={header}
                  >
                    {header}
                  </div>
                ))}
                {headers.length > 5 && (
                  <div className="px-3 py-2 text-slate-400">+{headers.length - 5} more</div>
                )}
              </div>
            )}
            <div className="divide-y divide-slate-100">
              {paginatedRecords.map((record) => (
                <div
                  key={record.id}
                  className={clsx(
                    'flex items-center hover:bg-slate-50 transition-colors',
                    !record.isValid && 'bg-red-50'
                  )}
                >
                  <div className="w-12 px-3 py-2 text-xs text-slate-400 text-center">
                    {record.index + 1}
                  </div>
                  {record.fields.slice(0, 5).map((field, index) => (
                    <div
                      key={field.id || index}
                      className="flex-1 min-w-[100px] px-3 py-2 text-sm truncate"
                      title={String(field.value)}
                    >
                      <span
                        className={clsx(
                          field.type === 'number' && 'text-blue-600 font-mono',
                          field.type === 'date' && 'text-amber-600',
                          field.type === 'boolean' && 'text-purple-600',
                          field.type === 'null' && 'text-slate-400 italic'
                        )}
                      >
                        {String(field.value ?? '-')}
                      </span>
                    </div>
                  ))}
                  {record.fields.length > 5 && (
                    <div className="px-3 py-2 text-xs text-slate-400">
                      +{record.fields.length - 5}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'raw' && (
          <pre className="p-4 text-xs font-mono text-slate-700 whitespace-pre-wrap">
            {rawData}
          </pre>
        )}

        {viewMode === 'json' && (
          <pre className="p-4 text-xs font-mono text-slate-700 whitespace-pre-wrap">
            {JSON.stringify(parsedData, null, 2)}
          </pre>
        )}
      </div>

      {viewMode === 'table' && totalPages > 1 && (
        <div className="p-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing {currentPage * pageSize + 1}-
            {Math.min((currentPage + 1) * pageSize, filteredRecords.length)} of{' '}
            {filteredRecords.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-600 px-2">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {parsedData && (
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-slate-900">
                {parsedData.metadata.totalRecords}
              </div>
              <div className="text-xs text-slate-500">Total Records</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {parsedData.metadata.validRecords}
              </div>
              <div className="text-xs text-slate-500">Valid</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-500">
                {parsedData.metadata.invalidRecords}
              </div>
              <div className="text-xs text-slate-500">Invalid</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Virtualized Table Component
 * Efficiently renders large datasets using virtual scrolling
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import type { ParsedRecord, ParsedField } from '../../types/parser'
import clsx from 'clsx'

interface VirtualizedTableProps {
  records: ParsedRecord[]
  headers: string[]
  rowHeight?: number
  overscan?: number
  className?: string
  onRowClick?: (record: ParsedRecord) => void
  selectedRowId?: string | null
}

export function VirtualizedTable({
  records,
  headers,
  rowHeight = 40,
  overscan = 5,
  className,
  onRowClick,
  selectedRowId,
}: VirtualizedTableProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // Calculate visible range
  const { startIndex, endIndex, offsetY, totalHeight } = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / rowHeight)
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
    const end = Math.min(records.length, start + visibleCount + overscan * 2)

    return {
      startIndex: start,
      endIndex: end,
      offsetY: start * rowHeight,
      totalHeight: records.length * rowHeight,
    }
  }, [scrollTop, containerHeight, rowHeight, records.length, overscan])

  // Visible records
  const visibleRecords = useMemo(
    () => records.slice(startIndex, endIndex),
    [records, startIndex, endIndex]
  )

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Update container height on resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })

    resizeObserver.observe(container)
    setContainerHeight(container.clientHeight)

    return () => resizeObserver.disconnect()
  }, [])

  // Get field value by header name
  const getFieldValue = useCallback((record: ParsedRecord, header: string): ParsedField | undefined => {
    return record.fields.find((f) => f.name === header)
  }, [])

  // Format cell value
  const formatValue = useCallback((field: ParsedField | undefined): string => {
    if (!field || field.value === null || field.value === undefined) {
      return ''
    }
    if (typeof field.value === 'boolean') {
      return field.value ? 'true' : 'false'
    }
    return String(field.value)
  }, [])

  // Get cell style based on type
  const getCellStyle = useCallback((field: ParsedField | undefined): string => {
    if (!field) return ''

    switch (field.type) {
      case 'number':
        return 'text-blue-600 font-mono text-right'
      case 'date':
        return 'text-amber-600'
      case 'boolean':
        return 'text-purple-600'
      case 'null':
        return 'text-gray-400 italic'
      default:
        return ''
    }
  }, [])

  if (records.length === 0) {
    return (
      <div className={clsx('flex items-center justify-center h-40 text-gray-500', className)}>
        No records to display
      </div>
    )
  }

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50">
        <div className="flex">
          {/* Row number column */}
          <div className="flex-shrink-0 w-16 px-3 py-2 text-xs font-medium text-gray-500 uppercase border-r border-gray-200">
            #
          </div>
          {/* Data columns */}
          {headers.map((header, i) => (
            <div
              key={i}
              className="flex-1 min-w-[120px] px-3 py-2 text-xs font-medium text-gray-500 uppercase truncate border-r border-gray-200 last:border-r-0"
              title={header}
            >
              {header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtualized body */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        {/* Spacer for total height */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible rows */}
          <div
            style={{
              position: 'absolute',
              top: offsetY,
              left: 0,
              right: 0,
            }}
          >
            {visibleRecords.map((record) => {
              const isSelected = record.id === selectedRowId
              const isInvalid = !record.isValid

              return (
                <div
                  key={record.id}
                  className={clsx(
                    'flex border-b border-gray-100 cursor-pointer transition-colors',
                    isSelected && 'bg-blue-50',
                    isInvalid && 'bg-red-50',
                    !isSelected && !isInvalid && 'hover:bg-gray-50'
                  )}
                  style={{ height: rowHeight }}
                  onClick={() => onRowClick?.(record)}
                >
                  {/* Row number */}
                  <div className="flex-shrink-0 w-16 px-3 flex items-center text-xs text-gray-400 font-mono border-r border-gray-100">
                    {record.index + 1}
                  </div>

                  {/* Data cells */}
                  {headers.map((header, i) => {
                    const field = getFieldValue(record, header)
                    const value = formatValue(field)
                    const cellStyle = getCellStyle(field)

                    return (
                      <div
                        key={i}
                        className={clsx(
                          'flex-1 min-w-[120px] px-3 flex items-center text-sm truncate border-r border-gray-100 last:border-r-0',
                          cellStyle
                        )}
                        title={value}
                      >
                        {value}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
        Showing {startIndex + 1}-{Math.min(endIndex, records.length)} of{' '}
        {records.length.toLocaleString()} records
        {records.length > 10000 && (
          <span className="ml-2 text-blue-600">(virtual scrolling enabled)</span>
        )}
      </div>
    </div>
  )
}

export default VirtualizedTable

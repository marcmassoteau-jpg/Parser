import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import type { ParserNodeData } from '../../../types/parser'
import { ChevronDownIcon, ChevronRightIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

export const TransactionNode = memo(({ data }: NodeProps<ParserNodeData>) => {
  const [isExpanded, setIsExpanded] = useState(data.isExpanded ?? false)
  const fields = data.fields || []
  const record = data.record
  const isValid = record?.isValid ?? true

  const bgColor = data.color || '#10b981'
  const isGreen = bgColor === '#10b981'
  const isPurple = bgColor === '#6366f1'

  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-node border-2 min-w-[280px] max-w-[400px] animate-scale-in transition-all hover:shadow-node-hover',
        isGreen && 'border-green-200',
        isPurple && 'border-indigo-200',
        !isGreen && !isPurple && 'border-slate-200'
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={clsx(
          '!border-white !w-3 !h-3',
          isGreen && '!bg-green-500',
          isPurple && '!bg-indigo-500',
          !isGreen && !isPurple && '!bg-slate-500'
        )}
      />

      <div
        className={clsx(
          'px-4 py-3 rounded-t-lg cursor-pointer',
          isGreen && 'bg-gradient-to-r from-green-500 to-green-600',
          isPurple && 'bg-gradient-to-r from-indigo-500 to-indigo-600',
          !isGreen && !isPurple && 'bg-gradient-to-r from-slate-500 to-slate-600'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{data.icon || '💳'}</span>
            <span className="font-semibold text-white">{data.label}</span>
            {isValid ? (
              <CheckCircleIcon className="w-4 h-4 text-white/80" />
            ) : (
              <XCircleIcon className="w-4 h-4 text-red-200" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white">
              {fields.length} fields
            </span>
            {isExpanded ? (
              <ChevronDownIcon className="w-5 h-5 text-white" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 py-2 max-h-[300px] overflow-auto">
          {record?.errors && record.errors.length > 0 && (
            <div className="mb-2 px-2 py-1.5 bg-red-50 border border-red-100 rounded-lg">
              {record.errors.map((error, i) => (
                <p key={i} className="text-xs text-red-600">{error}</p>
              ))}
            </div>
          )}
          <div className="space-y-1">
            {fields.map((field, index) => (
              <div
                key={field.id || index}
                className="flex items-center justify-between px-2 py-1.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-sm group"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'w-2 h-2 rounded-full',
                      field.type === 'number' && 'bg-blue-400',
                      field.type === 'date' && 'bg-amber-400',
                      field.type === 'boolean' && 'bg-purple-400',
                      field.type === 'string' && 'bg-green-400',
                      field.type === 'null' && 'bg-slate-300'
                    )}
                  />
                  <span className="text-slate-700 font-medium truncate max-w-[130px]" title={field.name}>
                    {field.name}
                  </span>
                </div>
                <span
                  className="text-slate-500 text-xs truncate max-w-[120px] font-mono bg-white px-2 py-0.5 rounded"
                  title={String(field.value)}
                >
                  {String(field.value ?? '-').substring(0, 20)}
                  {String(field.value ?? '').length > 20 && '...'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isExpanded && (
        <div className="px-4 py-2 text-sm text-slate-500 flex items-center gap-2">
          <span>Click to view</span>
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{fields.length} fields</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className={clsx(
          '!border-white !w-3 !h-3',
          isGreen && '!bg-green-500',
          isPurple && '!bg-indigo-500',
          !isGreen && !isPurple && '!bg-slate-500'
        )}
      />
    </div>
  )
})

TransactionNode.displayName = 'TransactionNode'

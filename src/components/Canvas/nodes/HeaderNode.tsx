import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import type { ParserNodeData } from '../../../types/parser'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

export const HeaderNode = memo(({ data }: NodeProps<ParserNodeData>) => {
  const [isExpanded, setIsExpanded] = useState(data.isExpanded ?? true)
  const fields = data.fields || []

  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-node border-2 min-w-[280px] max-w-[400px] animate-scale-in transition-all',
        'border-blue-200 hover:shadow-node-hover'
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-500 !border-white !w-3 !h-3"
      />

      <div
        className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 rounded-t-lg cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{data.icon || '📋'}</span>
            <span className="font-semibold text-white">{data.label}</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white">
              {fields.length} fields
            </span>
          </div>
          {isExpanded ? (
            <ChevronDownIcon className="w-5 h-5 text-white" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-white" />
          )}
        </div>
      </div>

      {isExpanded && fields.length > 0 && (
        <div className="px-3 py-2 max-h-[300px] overflow-auto">
          <div className="space-y-1">
            {fields.map((field, index) => (
              <div
                key={field.id || index}
                className="flex items-center justify-between px-2 py-1.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-sm"
              >
                <span className="text-slate-700 font-medium truncate max-w-[150px]" title={field.name}>
                  {field.name}
                </span>
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
        <div className="px-4 py-2 text-sm text-slate-500">
          Click to expand {fields.length} fields
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-blue-500 !border-white !w-3 !h-3"
      />
    </div>
  )
})

HeaderNode.displayName = 'HeaderNode'

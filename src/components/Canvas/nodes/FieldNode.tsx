import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import type { ParserNodeData } from '../../../types/parser'
import clsx from 'clsx'

export const FieldNode = memo(({ data }: NodeProps<ParserNodeData>) => {
  const field = data.fields?.[0]

  return (
    <div className="bg-white rounded-lg shadow-node border-2 border-amber-200 min-w-[180px] animate-scale-in hover:shadow-node-hover transition-all">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-amber-500 !border-white !w-3 !h-3"
      />

      <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-2 rounded-t-md">
        <div className="flex items-center gap-2">
          <span className="text-sm">📌</span>
          <span className="font-medium text-white text-sm">{data.label}</span>
        </div>
      </div>

      {field && (
        <div className="px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Value:</span>
            <span className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded truncate max-w-[100px]">
              {String(field.value ?? '-')}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-500">Type:</span>
            <span
              className={clsx(
                'px-2 py-0.5 rounded text-white',
                field.type === 'number' && 'bg-blue-400',
                field.type === 'date' && 'bg-amber-400',
                field.type === 'boolean' && 'bg-purple-400',
                field.type === 'string' && 'bg-green-400',
                field.type === 'null' && 'bg-slate-400'
              )}
            >
              {field.type}
            </span>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-amber-500 !border-white !w-3 !h-3"
      />
    </div>
  )
})

FieldNode.displayName = 'FieldNode'

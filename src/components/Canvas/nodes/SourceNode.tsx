import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import type { ParserNodeData } from '../../../types/parser'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

export const SourceNode = memo(({ data }: NodeProps<ParserNodeData>) => {
  return (
    <div className="bg-white rounded-xl shadow-node border-2 border-primary-200 min-w-[200px] animate-scale-in">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 rounded-t-lg">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-white" />
          <span className="font-semibold text-white">{data.label}</span>
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse-soft" />
          <span>Source Data</span>
        </div>
        {data.config && (
          <div className="mt-2 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Format:</span>
              <span className="font-medium uppercase">{data.config.type}</span>
            </div>
            {data.config.delimiter && (
              <div className="flex justify-between mt-1">
                <span>Delimiter:</span>
                <span className="font-mono bg-slate-100 px-1 rounded">
                  {data.config.delimiter === '\t' ? 'TAB' : data.config.delimiter}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-primary-500 !border-white !w-3 !h-3"
      />
    </div>
  )
})

SourceNode.displayName = 'SourceNode'

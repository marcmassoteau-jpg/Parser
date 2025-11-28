import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import type { ParserNodeData } from '../../../types/parser'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

interface OutputNodeData extends ParserNodeData {
  metadata?: {
    totalRecords: number
    validRecords: number
    invalidRecords: number
    parseTime: number
  }
}

export const OutputNode = memo(({ data }: NodeProps<OutputNodeData>) => {
  const metadata = data.metadata

  return (
    <div className="bg-white rounded-xl shadow-node border-2 border-purple-200 min-w-[220px] animate-scale-in hover:shadow-node-hover transition-all">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-purple-500 !border-white !w-3 !h-3"
      />

      <div className="bg-gradient-to-r from-purple-500 to-accent-500 px-4 py-3 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">{data.icon || '🎯'}</span>
          <span className="font-semibold text-white">{data.label}</span>
          <CheckCircleIcon className="w-5 h-5 text-white/80" />
        </div>
      </div>

      <div className="px-4 py-3">
        {metadata && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Total Records</span>
              <span className="font-semibold text-slate-700">{metadata.totalRecords}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Valid</span>
              <span className="font-semibold text-green-600">{metadata.validRecords}</span>
            </div>
            {metadata.invalidRecords > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Invalid</span>
                <span className="font-semibold text-red-500">{metadata.invalidRecords}</span>
              </div>
            )}
            <div className="pt-2 mt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Parse Time</span>
                <span className="font-mono text-slate-500">{metadata.parseTime.toFixed(2)}ms</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse-soft" />
            <span>Ready for mapping</span>
          </div>
        </div>
      </div>
    </div>
  )
})

OutputNode.displayName = 'OutputNode'

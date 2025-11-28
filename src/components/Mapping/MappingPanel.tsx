import { useState } from 'react'
import { useParserStore } from '../../store/parserStore'
import type { FieldMapping, TargetField, TransformationType } from '../../types/parser'
import {
  PlusIcon,
  TrashIcon,
  ArrowRightIcon,
  SparklesIcon,
  CloudArrowDownIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

const transformations: { value: TransformationType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'trim', label: 'Trim' },
  { value: 'pad-left', label: 'Pad Left' },
  { value: 'pad-right', label: 'Pad Right' },
  { value: 'substring', label: 'Substring' },
  { value: 'replace', label: 'Replace' },
  { value: 'date-format', label: 'Date Format' },
  { value: 'number-format', label: 'Number Format' },
  { value: 'custom', label: 'Custom' },
]

const sampleTargetFields: TargetField[] = [
  { id: 't1', name: 'transaction_id', type: 'string', required: true },
  { id: 't2', name: 'sender_name', type: 'string', required: true },
  { id: 't3', name: 'sender_account', type: 'string', required: true },
  { id: 't4', name: 'receiver_name', type: 'string', required: true },
  { id: 't5', name: 'receiver_account', type: 'string', required: true },
  { id: 't6', name: 'amount', type: 'number', required: true },
  { id: 't7', name: 'currency', type: 'string', required: true },
  { id: 't8', name: 'value_date', type: 'date', required: true },
  { id: 't9', name: 'reference', type: 'string', required: false },
  { id: 't10', name: 'description', type: 'string', required: false },
]

export function MappingPanel() {
  const {
    parsedData,
    mappings,
    addMapping,
    updateMapping,
    removeMapping,
    targetSchema,
    setTargetSchema,
  } = useParserStore()

  const [showAddMapping, setShowAddMapping] = useState(false)
  const [newMapping, setNewMapping] = useState<Partial<FieldMapping>>({})

  // Get available source fields from parsed data
  const sourceFields = parsedData?.headers || []
  const targetFields = targetSchema?.fields || sampleTargetFields

  const handleAddMapping = () => {
    if (newMapping.sourceField && newMapping.targetField) {
      addMapping({
        id: `mapping-${Date.now()}`,
        sourceField: newMapping.sourceField,
        targetField: newMapping.targetField,
        transformation: newMapping.transformation || 'none',
        defaultValue: newMapping.defaultValue,
      })
      setNewMapping({})
      setShowAddMapping(false)
    }
  }

  const handleAutoMap = () => {
    // Simple auto-mapping based on similar field names
    sourceFields.forEach((sourceField) => {
      const normalizedSource = sourceField.toLowerCase().replace(/[_\s-]/g, '')

      for (const targetField of targetFields) {
        const normalizedTarget = targetField.name.toLowerCase().replace(/[_\s-]/g, '')

        if (
          normalizedSource.includes(normalizedTarget) ||
          normalizedTarget.includes(normalizedSource)
        ) {
          // Check if mapping already exists
          const exists = mappings.some(
            (m) => m.sourceField === sourceField || m.targetField === targetField.name
          )
          if (!exists) {
            addMapping({
              id: `mapping-${Date.now()}-${sourceField}`,
              sourceField,
              targetField: targetField.name,
              transformation: 'none',
            })
          }
          break
        }
      }
    })
  }

  const handleExportMappings = () => {
    const exportData = {
      mappings,
      targetSchema: targetSchema || { id: 'default', name: 'Default Schema', fields: sampleTargetFields },
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mappings-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadDefaultSchema = () => {
    setTargetSchema({
      id: 'payment-schema',
      name: 'Payment Transaction Schema',
      fields: sampleTargetFields,
    })
  }

  if (!parsedData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
        <ArrowRightIcon className="w-16 h-16 mb-4 text-slate-300" />
        <p className="text-center">
          Parse data first to create field mappings to your target schema.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Field Mappings</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoMap}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
              title="Auto-map similar fields"
            >
              <SparklesIcon className="w-4 h-4" />
              Auto
            </button>
            <button
              onClick={handleExportMappings}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <CloudArrowDownIcon className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {!targetSchema && (
          <button
            onClick={loadDefaultSchema}
            className="w-full py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            Load Sample Target Schema
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {mappings.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No mappings defined. Click the + button to add a mapping or use Auto-map.
          </div>
        )}

        <div className="space-y-3">
          {mappings.map((mapping) => (
            <div
              key={mapping.id}
              className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500 mb-1">Source</div>
                  <select
                    value={mapping.sourceField}
                    onChange={(e) => updateMapping(mapping.id, { sourceField: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded bg-white"
                  >
                    {sourceFields.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </div>

                <ArrowRightIcon className="w-5 h-5 text-slate-400 flex-shrink-0 mt-5" />

                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500 mb-1">Target</div>
                  <select
                    value={mapping.targetField}
                    onChange={(e) => updateMapping(mapping.id, { targetField: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded bg-white"
                  >
                    {targetFields.map((field) => (
                      <option key={field.id} value={field.name}>
                        {field.name} {field.required && '*'}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => removeMapping(mapping.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors mt-5"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <select
                    value={mapping.transformation || 'none'}
                    onChange={(e) =>
                      updateMapping(mapping.id, { transformation: e.target.value as TransformationType })
                    }
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                  >
                    {transformations.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={mapping.defaultValue || ''}
                  onChange={(e) => updateMapping(mapping.id, { defaultValue: e.target.value })}
                  placeholder="Default value"
                  className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded"
                />
              </div>
            </div>
          ))}
        </div>

        {showAddMapping && (
          <div className="mt-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Source Field</label>
                <select
                  value={newMapping.sourceField || ''}
                  onChange={(e) => setNewMapping({ ...newMapping, sourceField: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded bg-white"
                >
                  <option value="">Select source...</option>
                  {sourceFields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </div>

              <ArrowRightIcon className="w-5 h-5 text-slate-400 flex-shrink-0 mt-5" />

              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Target Field</label>
                <select
                  value={newMapping.targetField || ''}
                  onChange={(e) => setNewMapping({ ...newMapping, targetField: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded bg-white"
                >
                  <option value="">Select target...</option>
                  {targetFields.map((field) => (
                    <option key={field.id} value={field.name}>
                      {field.name} {field.required && '*'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddMapping}
                disabled={!newMapping.sourceField || !newMapping.targetField}
                className="flex-1 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Mapping
              </button>
              <button
                onClick={() => {
                  setShowAddMapping(false)
                  setNewMapping({})
                }}
                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={() => setShowAddMapping(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          Add Mapping
        </button>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Mapped Fields</span>
          <span className={clsx(
            'font-semibold',
            mappings.length === targetFields.filter((f) => f.required).length
              ? 'text-green-600'
              : 'text-amber-600'
          )}>
            {mappings.length} / {targetFields.length}
          </span>
        </div>
        <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
          <div
            className={clsx(
              'h-2 rounded-full transition-all',
              mappings.length === targetFields.length ? 'bg-green-500' : 'bg-primary-500'
            )}
            style={{ width: `${(mappings.length / targetFields.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

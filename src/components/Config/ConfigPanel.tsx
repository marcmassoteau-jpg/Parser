import { useState } from 'react'
import { useParserStore } from '../../store/parserStore'
import { parse } from '../../parsers'
import type { FieldDefinition } from '../../types/parser'
import { PlusIcon, TrashIcon, PlayIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

export function ConfigPanel() {
  const {
    config,
    setConfig,
    rawData,
    setParsedData,
    setIsProcessing,
    setError,
  } = useParserStore()

  const [activeTab, setActiveTab] = useState<'general' | 'fields' | 'advanced'>('general')

  const handleReparse = () => {
    if (!rawData) return
    setIsProcessing(true)
    setError(null)

    try {
      const result = parse(rawData, config)
      setParsedData(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to parse data')
    } finally {
      setIsProcessing(false)
    }
  }

  const addFieldDefinition = () => {
    const newField: FieldDefinition = {
      id: `field-${Date.now()}`,
      name: `Field ${(config.fieldDefinitions?.length || 0) + 1}`,
      start: 0,
      length: 10,
      type: 'string',
    }
    setConfig({
      fieldDefinitions: [...(config.fieldDefinitions || []), newField],
    })
  }

  const updateFieldDefinition = (id: string, updates: Partial<FieldDefinition>) => {
    setConfig({
      fieldDefinitions: config.fieldDefinitions?.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })
  }

  const removeFieldDefinition = (id: string) => {
    setConfig({
      fieldDefinitions: config.fieldDefinitions?.filter((f) => f.id !== id),
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('general')}
          className={clsx(
            'flex-1 px-3 py-2 text-xs font-medium transition-colors',
            activeTab === 'general'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('fields')}
          className={clsx(
            'flex-1 px-3 py-2 text-xs font-medium transition-colors',
            activeTab === 'fields'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          Fields
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={clsx(
            'flex-1 px-3 py-2 text-xs font-medium transition-colors',
            activeTab === 'advanced'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          Advanced
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Parser Name
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                placeholder="Enter parser name"
              />
            </div>

            {config.type === 'csv' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Delimiter
                  </label>
                  <select
                    value={config.delimiter}
                    onChange={(e) => setConfig({ delimiter: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  >
                    <option value=",">Comma (,)</option>
                    <option value=";">Semicolon (;)</option>
                    <option value="\t">Tab</option>
                    <option value="|">Pipe (|)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Has Header Row
                  </label>
                  <button
                    onClick={() => setConfig({ hasHeader: !config.hasHeader })}
                    className={clsx(
                      'w-12 h-6 rounded-full transition-colors relative',
                      config.hasHeader ? 'bg-primary-500' : 'bg-slate-200'
                    )}
                  >
                    <span
                      className={clsx(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                        config.hasHeader ? 'right-1' : 'left-1'
                      )}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quote Character
                  </label>
                  <input
                    type="text"
                    value={config.quoteChar}
                    onChange={(e) => setConfig({ quoteChar: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-mono"
                    maxLength={1}
                  />
                </div>
              </>
            )}

            {config.type === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Custom Pattern (Regex)
                </label>
                <textarea
                  value={config.customPattern || ''}
                  onChange={(e) => setConfig({ customPattern: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-mono"
                  rows={3}
                  placeholder="Enter regex pattern with named groups"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use named groups: (?&lt;fieldName&gt;pattern)
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fields' && config.type === 'fixed-width' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700">Field Definitions</h3>
              <button
                onClick={addFieldDefinition}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Field
              </button>
            </div>

            <div className="space-y-2">
              {(config.fieldDefinitions || []).map((field, index) => (
                <div
                  key={field.id}
                  className="p-3 bg-slate-50 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      Field {index + 1}
                    </span>
                    <button
                      onClick={() => removeFieldDefinition(field.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateFieldDefinition(field.id, { name: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                    placeholder="Field name"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Start</label>
                      <input
                        type="number"
                        value={field.start}
                        onChange={(e) => updateFieldDefinition(field.id, { start: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Length</label>
                      <input
                        type="number"
                        value={field.length}
                        onChange={(e) => updateFieldDefinition(field.id, { length: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateFieldDefinition(field.id, { type: e.target.value as 'string' | 'number' | 'date' | 'boolean' })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(!config.fieldDefinitions || config.fieldDefinitions.length === 0) && (
              <div className="text-center py-8 text-slate-500 text-sm">
                No field definitions yet. Add fields or let the parser auto-detect them.
              </div>
            )}
          </div>
        )}

        {activeTab === 'fields' && config.type !== 'fixed-width' && (
          <div className="text-center py-8 text-slate-500 text-sm">
            Field definitions are only available for Fixed Width parser type.
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={config.description || ''}
                onChange={(e) => setConfig({ description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                rows={3}
                placeholder="Add a description for this parser configuration"
              />
            </div>

            {config.type === 'fin' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Message Type
                </label>
                <select
                  value={config.messageType || ''}
                  onChange={(e) => setConfig({ messageType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">Auto-detect</option>
                  <option value="MT103">MT103 - Single Customer Credit Transfer</option>
                  <option value="MT202">MT202 - General Financial Institution Transfer</option>
                  <option value="MT940">MT940 - Customer Statement Message</option>
                  <option value="MT950">MT950 - Statement Message</option>
                </select>
              </div>
            )}

            {config.type === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Custom Parse Function
                </label>
                <textarea
                  value={config.parseFunction || ''}
                  onChange={(e) => setConfig({ parseFunction: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-mono"
                  rows={10}
                  placeholder={`function parse(data, config) {\n  // Your custom parsing logic\n  return {\n    records: [],\n    metadata: { totalRecords: 0 }\n  };\n}`}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleReparse}
          disabled={!rawData}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <PlayIcon className="w-5 h-5" />
          Apply & Re-parse
        </button>
      </div>
    </div>
  )
}

/**
 * Progress Bar Component
 * Shows parsing progress with cancellation support
 */

import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/outline'
import type { ParseProgress, ParseController } from '../../types/parser'

interface ProgressBarProps {
  progress: ParseProgress | null
  controller: ParseController | null
  onCancel?: () => void
}

export function ProgressBar({ progress, controller, onCancel }: ProgressBarProps) {
  if (!progress || progress.phase === 'complete') {
    return null
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const isError = progress.phase === 'error'
  const isCancelled = progress.phase === 'cancelled'
  const isPaused = controller?.isPaused ?? false

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <div
          className={`
            rounded-lg shadow-lg border p-4
            ${isError ? 'bg-red-50 border-red-200' : isCancelled ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {getPhaseLabel(progress.phase)}
            </span>
            <div className="flex items-center gap-2">
              {/* Pause/Resume button */}
              {controller && !isError && !isCancelled && progress.phase === 'parsing' && (
                <button
                  onClick={() => (isPaused ? controller.resume() : controller.pause())}
                  className="p-1 rounded hover:bg-gray-100 text-gray-500"
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? (
                    <PlayIcon className="w-4 h-4" />
                  ) : (
                    <PauseIcon className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Cancel button */}
              {(onCancel || controller) && !isError && !isCancelled && (
                <button
                  onClick={() => {
                    controller?.cancel()
                    onCancel?.()
                  }}
                  className="p-1 rounded hover:bg-gray-100 text-gray-500"
                  title="Cancel"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <motion.div
              className={`h-full ${getProgressColor(progress.phase)}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {progress.recordsProcessed.toLocaleString()} records
              {progress.totalBytes > 0 && (
                <span className="ml-2">
                  ({formatBytes(progress.bytesProcessed)} / {formatBytes(progress.totalBytes)})
                </span>
              )}
            </span>
            <span className="flex items-center gap-2">
              {progress.percentage}%
              {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
                <span className="text-gray-400">
                  ~{formatTime(progress.estimatedTimeRemaining)} remaining
                </span>
              )}
            </span>
          </div>

          {/* Message */}
          {progress.message && (
            <p className={`text-xs mt-2 ${isError ? 'text-red-600' : 'text-gray-500'}`}>
              {progress.message}
            </p>
          )}

          {/* Paused indicator */}
          {isPaused && (
            <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1">
              <PauseIcon className="w-3 h-3" />
              Paused - Click play to resume
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function getPhaseLabel(phase: ParseProgress['phase']): string {
  const labels: Record<ParseProgress['phase'], string> = {
    initializing: 'Initializing...',
    detecting: 'Detecting format...',
    parsing: 'Parsing data...',
    finalizing: 'Finalizing...',
    complete: 'Complete',
    error: 'Error',
    cancelled: 'Cancelled',
  }
  return labels[phase] || phase
}

function getProgressColor(phase: ParseProgress['phase']): string {
  switch (phase) {
    case 'error':
      return 'bg-red-500'
    case 'cancelled':
      return 'bg-yellow-500'
    case 'complete':
      return 'bg-green-500'
    default:
      return 'bg-blue-500'
  }
}

export default ProgressBar

/**
 * Character Encoding Detection
 * Detects file encoding from byte patterns
 */

import type { EncodingType, EncodingInfo } from '../../types/parser'

/**
 * Byte Order Marks for different encodings
 */
const BOM_PATTERNS: Array<{ bom: number[]; encoding: EncodingType }> = [
  { bom: [0xef, 0xbb, 0xbf], encoding: 'utf-8' },
  { bom: [0xff, 0xfe], encoding: 'utf-16le' },
  { bom: [0xfe, 0xff], encoding: 'utf-16be' },
]

/**
 * Detect encoding from byte array
 */
export function detectEncoding(bytes: Uint8Array): EncodingInfo {
  // Check for BOM first
  for (const { bom, encoding } of BOM_PATTERNS) {
    if (startsWith(bytes, bom)) {
      return { encoding, confidence: 1.0, hasBOM: true }
    }
  }

  // Statistical analysis for encoding detection
  const stats = analyzeBytes(bytes)

  // UTF-16 detection (look for null bytes pattern)
  if (stats.nullBytes > bytes.length * 0.1) {
    if (stats.oddNulls > stats.evenNulls) {
      return { encoding: 'utf-16le', confidence: 0.8, hasBOM: false }
    } else {
      return { encoding: 'utf-16be', confidence: 0.8, hasBOM: false }
    }
  }

  // UTF-8 validation
  if (isValidUtf8(bytes)) {
    // Check if it's actually ASCII
    if (stats.highBytes === 0) {
      return { encoding: 'ascii', confidence: 1.0, hasBOM: false }
    }
    return { encoding: 'utf-8', confidence: 0.95, hasBOM: false }
  }

  // Windows-1252 vs ISO-8859-1 heuristics
  if (stats.windows1252Chars > stats.iso8859Chars) {
    return { encoding: 'windows-1252', confidence: 0.7, hasBOM: false }
  }

  // Default to ISO-8859-1 (Latin-1)
  return { encoding: 'iso-8859-1', confidence: 0.6, hasBOM: false }
}

/**
 * Decode ArrayBuffer to string with detected/specified encoding
 */
export function decodeBuffer(buffer: ArrayBuffer, encoding: EncodingType): string {
  const bytes = new Uint8Array(buffer)

  // Skip BOM if present
  let startOffset = 0
  for (const { bom, encoding: bomEncoding } of BOM_PATTERNS) {
    if (encoding === bomEncoding && startsWith(bytes, bom)) {
      startOffset = bom.length
      break
    }
  }

  const decoder = new TextDecoder(encodingToLabel(encoding))
  return decoder.decode(bytes.subarray(startOffset))
}

/**
 * Map our encoding type to TextDecoder label
 */
function encodingToLabel(encoding: EncodingType): string {
  const labels: Record<EncodingType, string> = {
    'utf-8': 'utf-8',
    'utf-16': 'utf-16',
    'utf-16be': 'utf-16be',
    'utf-16le': 'utf-16le',
    'iso-8859-1': 'iso-8859-1',
    'windows-1252': 'windows-1252',
    ascii: 'ascii',
  }
  return labels[encoding] || 'utf-8'
}

/**
 * Check if byte array starts with given pattern
 */
function startsWith(bytes: Uint8Array, pattern: number[]): boolean {
  if (bytes.length < pattern.length) return false
  for (let i = 0; i < pattern.length; i++) {
    if (bytes[i] !== pattern[i]) return false
  }
  return true
}

/**
 * Analyze byte statistics for encoding detection
 */
function analyzeBytes(bytes: Uint8Array): {
  nullBytes: number
  evenNulls: number
  oddNulls: number
  highBytes: number
  windows1252Chars: number
  iso8859Chars: number
} {
  let nullBytes = 0
  let evenNulls = 0
  let oddNulls = 0
  let highBytes = 0
  let windows1252Chars = 0
  let iso8859Chars = 0

  // Windows-1252 specific characters (0x80-0x9F range)
  const windows1252Range = new Set([
    0x80, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x8e, 0x91, 0x92, 0x93,
    0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9e, 0x9f,
  ])

  const sampleSize = Math.min(bytes.length, 65536) // Sample first 64KB

  for (let i = 0; i < sampleSize; i++) {
    const byte = bytes[i]

    if (byte === 0) {
      nullBytes++
      if (i % 2 === 0) evenNulls++
      else oddNulls++
    }

    if (byte > 127) {
      highBytes++
      if (windows1252Range.has(byte)) {
        windows1252Chars++
      } else if (byte >= 0xa0 && byte <= 0xff) {
        iso8859Chars++
      }
    }
  }

  return { nullBytes, evenNulls, oddNulls, highBytes, windows1252Chars, iso8859Chars }
}

/**
 * Validate UTF-8 encoding
 */
function isValidUtf8(bytes: Uint8Array): boolean {
  const sampleSize = Math.min(bytes.length, 65536)
  let i = 0

  while (i < sampleSize) {
    const byte = bytes[i]

    if (byte <= 0x7f) {
      // ASCII
      i++
    } else if ((byte & 0xe0) === 0xc0) {
      // 2-byte sequence
      if (i + 1 >= sampleSize) return true // End of sample, assume valid
      if ((bytes[i + 1] & 0xc0) !== 0x80) return false
      i += 2
    } else if ((byte & 0xf0) === 0xe0) {
      // 3-byte sequence
      if (i + 2 >= sampleSize) return true
      if ((bytes[i + 1] & 0xc0) !== 0x80 || (bytes[i + 2] & 0xc0) !== 0x80) return false
      i += 3
    } else if ((byte & 0xf8) === 0xf0) {
      // 4-byte sequence
      if (i + 3 >= sampleSize) return true
      if (
        (bytes[i + 1] & 0xc0) !== 0x80 ||
        (bytes[i + 2] & 0xc0) !== 0x80 ||
        (bytes[i + 3] & 0xc0) !== 0x80
      )
        return false
      i += 4
    } else {
      // Invalid UTF-8 start byte
      return false
    }
  }

  return true
}

/**
 * Get human-readable encoding name
 */
export function getEncodingDisplayName(encoding: EncodingType): string {
  const names: Record<EncodingType, string> = {
    'utf-8': 'UTF-8',
    'utf-16': 'UTF-16',
    'utf-16be': 'UTF-16 (Big Endian)',
    'utf-16le': 'UTF-16 (Little Endian)',
    'iso-8859-1': 'ISO-8859-1 (Latin-1)',
    'windows-1252': 'Windows-1252',
    ascii: 'ASCII',
  }
  return names[encoding] || encoding
}

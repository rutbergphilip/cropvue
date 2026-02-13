import { describe, it, expect } from 'vitest'
import {
  detectMimeType,
  supportsWebP,
  getMimeForFormat,
  hasTransparency,
} from '../utils/format-detect'

describe('detectMimeType', () => {
  it('detects from file type', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    expect(detectMimeType(file)).toBe('image/jpeg')
  })

  it('falls back to extension when type is empty', () => {
    const file = new File([''], 'test.png', { type: '' })
    expect(detectMimeType(file)).toBe('image/png')
  })

  it('returns image/jpeg as default fallback', () => {
    const file = new File([''], 'test', { type: '' })
    expect(detectMimeType(file)).toBe('image/jpeg')
  })
})

describe('getMimeForFormat', () => {
  it('maps format strings to MIME types', () => {
    expect(getMimeForFormat('jpeg')).toBe('image/jpeg')
    expect(getMimeForFormat('png')).toBe('image/png')
    expect(getMimeForFormat('webp')).toBe('image/webp')
  })

  it('returns jpeg for auto in node env (no canvas WebP support)', () => {
    // In Node.js test env, document is undefined so supportsWebP() returns false
    expect(getMimeForFormat('auto')).toBe('image/jpeg')
  })
})

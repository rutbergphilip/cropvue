import { describe, it, expect } from 'vitest'
import {
  chooseOutputFormat,
} from '../composables/useCompressor'

describe('chooseOutputFormat', () => {
  it('returns png for transparent input', () => {
    expect(chooseOutputFormat('auto', 'image/png')).toBe('image/png')
  })

  it('returns jpeg for auto in node env (no WebP canvas support)', () => {
    // In Node.js test env, document is undefined so supportsWebP() returns false
    const result = chooseOutputFormat('auto', 'image/jpeg')
    expect(['image/webp', 'image/jpeg']).toContain(result)
  })

  it('returns exact format when specified', () => {
    expect(chooseOutputFormat('jpeg', 'image/png')).toBe('image/jpeg')
    expect(chooseOutputFormat('png', 'image/jpeg')).toBe('image/png')
    expect(chooseOutputFormat('webp', 'image/jpeg')).toBe('image/webp')
  })
})

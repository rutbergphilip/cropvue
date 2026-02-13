import { describe, it, expect } from 'vitest'
import { validateFile } from '../composables/useDropzone'

describe('validateFile', () => {
  it('accepts valid file', () => {
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
    const result = validateFile(file, { accept: ['image/jpeg'], maxSize: 10_000_000 })
    expect(result).toBeNull()
  })

  it('rejects file too large', () => {
    const file = new File(['x'.repeat(100)], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 20_000_000 })
    const result = validateFile(file, { accept: ['image/jpeg'], maxSize: 10_000_000 })
    expect(result).not.toBeNull()
    expect(result!.type).toBe('file-too-large')
  })

  it('rejects invalid type', () => {
    const file = new File(['x'], 'test.txt', { type: 'text/plain' })
    const result = validateFile(file, { accept: ['image/jpeg', 'image/png'], maxSize: 10_000_000 })
    expect(result).not.toBeNull()
    expect(result!.type).toBe('invalid-type')
  })

  it('accepts wildcard image/*', () => {
    const file = new File(['x'], 'test.webp', { type: 'image/webp' })
    const result = validateFile(file, { accept: ['image/*'], maxSize: 10_000_000 })
    expect(result).toBeNull()
  })
})

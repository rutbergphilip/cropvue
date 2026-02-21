// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  detectMimeType,
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

  it('detects webp from extension', () => {
    const file = new File([''], 'photo.webp', { type: '' })
    expect(detectMimeType(file)).toBe('image/webp')
  })

  it('detects gif from extension', () => {
    const file = new File([''], 'animated.gif', { type: '' })
    expect(detectMimeType(file)).toBe('image/gif')
  })

  it('detects bmp from extension', () => {
    const file = new File([''], 'image.bmp', { type: '' })
    expect(detectMimeType(file)).toBe('image/bmp')
  })

  it('detects avif from extension', () => {
    const file = new File([''], 'photo.avif', { type: '' })
    expect(detectMimeType(file)).toBe('image/avif')
  })
})

describe('supportsWebP', () => {
  let originalCreateElement: typeof document.createElement

  beforeEach(() => {
    vi.resetModules()
    originalCreateElement = document.createElement.bind(document)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when canvas supports webp', async () => {
    const mockToDataURL = vi.fn().mockReturnValue('data:image/webp;base64,abc')
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const canvas = originalCreateElement('canvas') as HTMLCanvasElement
        canvas.toDataURL = mockToDataURL
        return canvas
      }
      return originalCreateElement(tag)
    })

    const { supportsWebP } = await import('../utils/format-detect')
    const result = supportsWebP()
    expect(result).toBe(true)
    expect(mockToDataURL).toHaveBeenCalledWith('image/webp')
  })

  it('returns false when canvas does not support webp', async () => {
    const mockToDataURL = vi.fn().mockReturnValue('data:image/png;base64,abc')
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const canvas = originalCreateElement('canvas') as HTMLCanvasElement
        canvas.toDataURL = mockToDataURL
        return canvas
      }
      return originalCreateElement(tag)
    })

    const { supportsWebP } = await import('../utils/format-detect')
    const result = supportsWebP()
    expect(result).toBe(false)
  })

  it('returns false when document is undefined (lines 28-29)', async () => {
    const originalDocument = globalThis.document
    // @ts-expect-error - deliberately removing document to test SSR/node path
    delete globalThis.document

    try {
      const { supportsWebP } = await import('../utils/format-detect')
      const result = supportsWebP()
      expect(result).toBe(false)
    } finally {
      globalThis.document = originalDocument
    }
  })

  it('caches the result on subsequent calls', async () => {
    const mockToDataURL = vi.fn().mockReturnValue('data:image/webp;base64,abc')
    const spy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const canvas = originalCreateElement('canvas') as HTMLCanvasElement
        canvas.toDataURL = mockToDataURL
        return canvas
      }
      return originalCreateElement(tag)
    })

    const { supportsWebP } = await import('../utils/format-detect')
    supportsWebP()
    supportsWebP()

    // createElement('canvas') should only be called once due to caching
    const canvasCalls = spy.mock.calls.filter(([tag]) => tag === 'canvas')
    expect(canvasCalls.length).toBe(1)
  })
})

describe('getMimeForFormat', () => {
  let originalCreateElement: typeof document.createElement

  beforeEach(() => {
    vi.resetModules()
    originalCreateElement = document.createElement.bind(document)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('maps format strings to MIME types', async () => {
    const { getMimeForFormat } = await import('../utils/format-detect')
    expect(getMimeForFormat('jpeg')).toBe('image/jpeg')
    expect(getMimeForFormat('png')).toBe('image/png')
    expect(getMimeForFormat('webp')).toBe('image/webp')
  })

  it('returns webp for auto when WebP is supported', async () => {
    const mockToDataURL = vi.fn().mockReturnValue('data:image/webp;base64,abc')
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const canvas = originalCreateElement('canvas') as HTMLCanvasElement
        canvas.toDataURL = mockToDataURL
        return canvas
      }
      return originalCreateElement(tag)
    })

    const { getMimeForFormat } = await import('../utils/format-detect')
    expect(getMimeForFormat('auto')).toBe('image/webp')
  })

  it('returns jpeg for auto when WebP is not supported', async () => {
    const mockToDataURL = vi.fn().mockReturnValue('data:image/png;base64,abc')
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const canvas = originalCreateElement('canvas') as HTMLCanvasElement
        canvas.toDataURL = mockToDataURL
        return canvas
      }
      return originalCreateElement(tag)
    })

    const { getMimeForFormat } = await import('../utils/format-detect')
    expect(getMimeForFormat('auto')).toBe('image/jpeg')
  })
})

describe('hasTransparency', () => {
  it('returns true for image/png', () => {
    expect(hasTransparency('image/png')).toBe(true)
  })

  it('returns true for image/webp', () => {
    expect(hasTransparency('image/webp')).toBe(true)
  })

  it('returns true for image/avif', () => {
    expect(hasTransparency('image/avif')).toBe(true)
  })

  it('returns false for image/jpeg', () => {
    expect(hasTransparency('image/jpeg')).toBe(false)
  })

  it('returns false for image/gif', () => {
    expect(hasTransparency('image/gif')).toBe(false)
  })

  it('returns false for image/bmp', () => {
    expect(hasTransparency('image/bmp')).toBe(false)
  })

  it('returns false for arbitrary mime type', () => {
    expect(hasTransparency('application/pdf')).toBe(false)
  })
})

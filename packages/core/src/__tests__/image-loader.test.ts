import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  loadImageFromFile,
  loadImageFromUrl,
  needsDownsample,
  getSafeDimensions,
} from '../utils/image-loader'

// Mock the canvas-limits module so tests are deterministic and don't depend
// on real canvas probing.
vi.mock('../utils/canvas-limits', () => ({
  getMaxCanvasSize: vi.fn(() => 4096),
  downsampleDimensions: vi.fn((w: number, h: number, max: number) => {
    if (w <= max && h <= max) return { width: w, height: h }
    const ratio = Math.min(max / w, max / h)
    return { width: Math.round(w * ratio), height: Math.round(h * ratio) }
  }),
}))

// ---------------------------------------------------------------------------
// Helpers for mocking the global Image constructor
// ---------------------------------------------------------------------------

/**
 * Installs a fake Image constructor that captures onload/onerror assignments
 * and allows tests to trigger them. Returns a handle with trigger helpers.
 */
function installImageMock(opts: {
  naturalWidth?: number
  naturalHeight?: number
  shouldError?: boolean
}) {
  const { naturalWidth = 800, naturalHeight = 600, shouldError = false } = opts
  let capturedSrc = ''
  let onloadFn: (() => void) | null = null
  let onerrorFn: (() => void) | null = null

  // Use a regular function (not arrow) so it can be called with `new Image()`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FakeImage = vi.fn(function (this: any) {
    Object.defineProperty(this, 'src', {
      get: () => capturedSrc,
      set: (v: string) => {
        capturedSrc = v
        queueMicrotask(() => {
          if (shouldError) {
            onerrorFn?.()
          } else {
            onloadFn?.()
          }
        })
      },
    })
    Object.defineProperty(this, 'onload', {
      get: () => onloadFn,
      set: (fn: (() => void) | null) => {
        onloadFn = fn
      },
    })
    Object.defineProperty(this, 'onerror', {
      get: () => onerrorFn,
      set: (fn: (() => void) | null) => {
        onerrorFn = fn
      },
    })
    Object.defineProperty(this, 'naturalWidth', { value: naturalWidth })
    Object.defineProperty(this, 'naturalHeight', { value: naturalHeight })
  })
  vi.stubGlobal('Image', FakeImage)

  return { getSrc: () => capturedSrc }
}

// ---------------------------------------------------------------------------
// loadImageFromFile
// ---------------------------------------------------------------------------

describe('loadImageFromFile', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => 'blob:mock-url')
    revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', {
      ...globalThis.URL,
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('creates an object URL from the file', async () => {
    installImageMock({ naturalWidth: 1024, naturalHeight: 768 })
    const file = new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' })

    await loadImageFromFile(file)

    expect(createObjectURLSpy).toHaveBeenCalledWith(file)
  })

  it('resolves with correct image data on successful load', async () => {
    installImageMock({ naturalWidth: 1024, naturalHeight: 768 })
    const file = new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' })

    const result = await loadImageFromFile(file)

    expect(result.naturalWidth).toBe(1024)
    expect(result.naturalHeight).toBe(768)
    expect(result.originalFile).toBe(file)
    expect(result.originalSize).toBe(file.size)
    expect(result.element).toBeDefined()
  })

  it('revokes the object URL after successful load', async () => {
    installImageMock({ naturalWidth: 500, naturalHeight: 500 })
    const file = new File(['data'], 'test.png', { type: 'image/png' })

    await loadImageFromFile(file)

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
  })

  it('sets img.src to the created object URL', async () => {
    const mock = installImageMock({ naturalWidth: 100, naturalHeight: 100 })
    const file = new File(['x'], 'img.jpg', { type: 'image/jpeg' })

    await loadImageFromFile(file)

    expect(mock.getSrc()).toBe('blob:mock-url')
  })

  it('rejects with an error message including the filename on load failure', async () => {
    installImageMock({ shouldError: true })
    const file = new File(['bad'], 'corrupt.jpg', { type: 'image/jpeg' })

    await expect(loadImageFromFile(file)).rejects.toThrow(
      'Failed to load image: corrupt.jpg'
    )
  })

  it('revokes the object URL even on error', async () => {
    installImageMock({ shouldError: true })
    const file = new File(['bad'], 'broken.png', { type: 'image/png' })

    await expect(loadImageFromFile(file)).rejects.toThrow()

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
  })
})

// ---------------------------------------------------------------------------
// loadImageFromUrl
// ---------------------------------------------------------------------------

describe('loadImageFromUrl', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => 'blob:fetched-url')
    revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', {
      ...globalThis.URL,
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('fetches the URL and converts response to blob', async () => {
    const mockBlob = new Blob(['image-bytes'], { type: 'image/jpeg' })
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
    })
    vi.stubGlobal('fetch', fetchSpy)
    installImageMock({ naturalWidth: 640, naturalHeight: 480 })

    await loadImageFromUrl('https://example.com/photo.jpg')

    expect(fetchSpy).toHaveBeenCalledWith('https://example.com/photo.jpg')
  })

  it('creates an object URL from the fetched blob', async () => {
    const mockBlob = new Blob(['data'], { type: 'image/png' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
    }))
    installImageMock({ naturalWidth: 200, naturalHeight: 200 })

    await loadImageFromUrl('https://example.com/img.png')

    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob)
  })

  it('resolves with correct image data on successful load', async () => {
    const mockBlob = new Blob(['image-bytes'], { type: 'image/jpeg' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
    }))
    installImageMock({ naturalWidth: 1920, naturalHeight: 1080 })

    const result = await loadImageFromUrl('https://example.com/hero.jpg')

    expect(result.naturalWidth).toBe(1920)
    expect(result.naturalHeight).toBe(1080)
    expect(result.originalSize).toBe(mockBlob.size)
    expect(result.element).toBeDefined()
    // loadImageFromUrl does NOT set originalFile
    expect(result.originalFile).toBeUndefined()
  })

  it('revokes the blob URL after successful load', async () => {
    const mockBlob = new Blob(['x'], { type: 'image/webp' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
    }))
    installImageMock({ naturalWidth: 300, naturalHeight: 300 })

    await loadImageFromUrl('https://example.com/img.webp')

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fetched-url')
  })

  it('sets img.src to the blob URL', async () => {
    const mockBlob = new Blob(['y'], { type: 'image/png' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
    }))
    const mock = installImageMock({ naturalWidth: 50, naturalHeight: 50 })

    await loadImageFromUrl('https://example.com/small.png')

    expect(mock.getSrc()).toBe('blob:fetched-url')
  })

  it('throws when fetch response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }))

    await expect(
      loadImageFromUrl('https://example.com/missing.jpg')
    ).rejects.toThrow(
      'Failed to fetch image: https://example.com/missing.jpg (404)'
    )
  })

  it('throws with status code for server errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }))

    await expect(
      loadImageFromUrl('https://example.com/error.jpg')
    ).rejects.toThrow('(500)')
  })

  it('rejects when image fails to load from blob URL', async () => {
    const mockBlob = new Blob(['corrupt'], { type: 'image/jpeg' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
    }))
    installImageMock({ shouldError: true })

    await expect(
      loadImageFromUrl('https://example.com/corrupt.jpg')
    ).rejects.toThrow('Failed to load image: https://example.com/corrupt.jpg')
  })

  it('revokes the blob URL even when image load fails', async () => {
    const mockBlob = new Blob(['bad'], { type: 'image/jpeg' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
    }))
    installImageMock({ shouldError: true })

    await expect(
      loadImageFromUrl('https://example.com/bad.jpg')
    ).rejects.toThrow()

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fetched-url')
  })

  it('propagates fetch network errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(
      loadImageFromUrl('https://unreachable.example.com/img.jpg')
    ).rejects.toThrow('Failed to fetch')
  })
})

// ---------------------------------------------------------------------------
// needsDownsample
// ---------------------------------------------------------------------------

describe('needsDownsample', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false when both dimensions are within the max canvas size', () => {
    // Mock returns 4096 as max size
    expect(needsDownsample(2000, 3000)).toBe(false)
  })

  it('returns false when dimensions are exactly at the limit', () => {
    expect(needsDownsample(4096, 4096)).toBe(false)
  })

  it('returns true when width exceeds the max canvas size', () => {
    expect(needsDownsample(5000, 3000)).toBe(true)
  })

  it('returns true when height exceeds the max canvas size', () => {
    expect(needsDownsample(3000, 5000)).toBe(true)
  })

  it('returns true when both dimensions exceed the max canvas size', () => {
    expect(needsDownsample(8000, 6000)).toBe(true)
  })

  it('returns false for very small images', () => {
    expect(needsDownsample(100, 100)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getSafeDimensions
// ---------------------------------------------------------------------------

describe('getSafeDimensions', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns original dimensions when within limits', () => {
    const result = getSafeDimensions(2000, 1500)
    expect(result).toEqual({ width: 2000, height: 1500 })
  })

  it('downsamples when width exceeds the limit', () => {
    const result = getSafeDimensions(8192, 4096)
    expect(result.width).toBeLessThanOrEqual(4096)
    expect(result.height).toBeLessThanOrEqual(4096)
  })

  it('downsamples when height exceeds the limit', () => {
    const result = getSafeDimensions(2048, 8192)
    expect(result.width).toBeLessThanOrEqual(4096)
    expect(result.height).toBeLessThanOrEqual(4096)
  })

  it('preserves aspect ratio when downsampling', () => {
    const originalRatio = 6000 / 3000
    const result = getSafeDimensions(6000, 3000)
    const resultRatio = result.width / result.height
    expect(resultRatio).toBeCloseTo(originalRatio, 1)
  })

  it('returns exact dimensions when at the limit', () => {
    const result = getSafeDimensions(4096, 4096)
    expect(result).toEqual({ width: 4096, height: 4096 })
  })

  it('handles landscape images that need downsampling', () => {
    const result = getSafeDimensions(10000, 2000)
    expect(result.width).toBe(4096)
    expect(result.height).toBe(Math.round(2000 * (4096 / 10000)))
  })

  it('handles portrait images that need downsampling', () => {
    const result = getSafeDimensions(2000, 10000)
    expect(result.height).toBe(4096)
    expect(result.width).toBe(Math.round(2000 * (4096 / 10000)))
  })
})

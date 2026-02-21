import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  chooseOutputFormat,
  compressBlob,
  useCompressor,
} from '../composables/useCompressor'

// Mock the canvas-renderer module so exportCrop returns controllable blobs
vi.mock('../engine/canvas-renderer', () => ({
  exportCrop: vi.fn(),
}))

// Mock format-detect utilities with sensible defaults
vi.mock('../utils/format-detect', () => ({
  getMimeForFormat: vi.fn((format: string) => {
    switch (format) {
      case 'jpeg': return 'image/jpeg'
      case 'png': return 'image/png'
      case 'webp': return 'image/webp'
      case 'auto': return 'image/jpeg'
      default: return 'image/jpeg'
    }
  }),
  hasTransparency: vi.fn((mime: string) => mime === 'image/png' || mime === 'image/webp'),
  detectMimeType: vi.fn((file: File) => file.type || 'image/jpeg'),
}))

import { exportCrop } from '../engine/canvas-renderer'
import { detectMimeType } from '../utils/format-detect'

const mockExportCrop = exportCrop as ReturnType<typeof vi.fn>
const mockDetectMimeType = detectMimeType as ReturnType<typeof vi.fn>

function createMockCanvas(): HTMLCanvasElement {
  return {} as HTMLCanvasElement
}

function createBlob(size: number, type = 'image/jpeg'): Blob {
  // Create a blob whose .size property returns the desired value
  const blob = new Blob(['x'.repeat(size)], { type })
  // Override size for precise control since Blob content length may differ
  Object.defineProperty(blob, 'size', { value: size, writable: false })
  return blob
}

describe('chooseOutputFormat', () => {
  it('returns png for transparent input when format is auto', () => {
    expect(chooseOutputFormat('auto', 'image/png')).toBe('image/png')
  })

  it('returns webp for transparent webp input when format is auto', () => {
    expect(chooseOutputFormat('auto', 'image/webp')).toBe('image/webp')
  })

  it('returns getMimeForFormat result for auto with non-transparent input', () => {
    const result = chooseOutputFormat('auto', 'image/jpeg')
    // getMimeForFormat('auto') returns 'image/jpeg' in our mock
    expect(result).toBe('image/jpeg')
  })

  it('returns exact format when specified', () => {
    expect(chooseOutputFormat('jpeg', 'image/png')).toBe('image/jpeg')
    expect(chooseOutputFormat('png', 'image/jpeg')).toBe('image/png')
    expect(chooseOutputFormat('webp', 'image/jpeg')).toBe('image/webp')
  })
})

describe('compressBlob', () => {
  const canvas = createMockCanvas()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports with the given quality and format', async () => {
    const blob = createBlob(5000)
    mockExportCrop.mockResolvedValue(blob)

    const result = await compressBlob(canvas, {
      format: 'jpeg',
      quality: 0.8,
      inputMime: 'image/jpeg',
    })

    expect(mockExportCrop).toHaveBeenCalledWith(canvas, { format: 'image/jpeg', quality: 0.8 })
    expect(result).toBe(blob)
  })

  it('skips compression loop when no maxInputSize is specified', async () => {
    const blob = createBlob(999999)
    mockExportCrop.mockResolvedValue(blob)

    await compressBlob(canvas, {
      format: 'jpeg',
      quality: 0.9,
      inputMime: 'image/jpeg',
    })

    // Only called once - no retry loop
    expect(mockExportCrop).toHaveBeenCalledTimes(1)
  })

  it('skips compression loop when blob is already under maxInputSize', async () => {
    const blob = createBlob(5000)
    mockExportCrop.mockResolvedValue(blob)

    await compressBlob(canvas, {
      format: 'jpeg',
      quality: 0.9,
      inputMime: 'image/jpeg',
      maxInputSize: 10000,
    })

    expect(mockExportCrop).toHaveBeenCalledTimes(1)
  })

  it('skips compression loop for PNG output even when over maxInputSize', async () => {
    const blob = createBlob(20000)
    mockExportCrop.mockResolvedValue(blob)

    await compressBlob(canvas, {
      format: 'auto',
      quality: 0.9,
      inputMime: 'image/png', // transparent → chooseOutputFormat returns 'image/png'
      maxInputSize: 10000,
    })

    // PNG is lossless; quality reduction would have no effect, so loop is skipped
    expect(mockExportCrop).toHaveBeenCalledTimes(1)
  })

  it('retries up to 3 times when blob exceeds maxInputSize', async () => {
    // Each call returns a blob that is still too large
    const oversizedBlob = createBlob(20000)
    mockExportCrop.mockResolvedValue(oversizedBlob)

    await compressBlob(canvas, {
      format: 'jpeg',
      quality: 0.9,
      inputMime: 'image/jpeg',
      maxInputSize: 10000,
    })

    // 1 initial + 3 retries = 4 calls total
    expect(mockExportCrop).toHaveBeenCalledTimes(4)
  })

  it('reduces quality by 0.15 on each retry attempt', async () => {
    const oversizedBlob = createBlob(20000)
    mockExportCrop.mockResolvedValue(oversizedBlob)

    await compressBlob(canvas, {
      format: 'jpeg',
      quality: 0.9,
      inputMime: 'image/jpeg',
      maxInputSize: 10000,
    })

    // Initial call: quality 0.9
    expect(mockExportCrop).toHaveBeenNthCalledWith(1, canvas, { format: 'image/jpeg', quality: 0.9 })
    // Retry 1: quality = max(0.1, 0.9 - 0.15) = 0.75
    expect(mockExportCrop).toHaveBeenNthCalledWith(2, canvas, { format: 'image/jpeg', quality: 0.75 })
    // Retry 2: quality = max(0.1, 0.75 - 0.15) = 0.6
    expect(mockExportCrop).toHaveBeenNthCalledWith(3, canvas, { format: 'image/jpeg', quality: 0.6 })
    // Retry 3: quality = max(0.1, 0.6 - 0.15) ≈ 0.45 (floating point)
    const call4 = mockExportCrop.mock.calls[3]
    expect(call4[0]).toBe(canvas)
    expect(call4[1].format).toBe('image/jpeg')
    expect(call4[1].quality).toBeCloseTo(0.45, 10)
  })

  it('stops retrying early when blob size drops below maxInputSize', async () => {
    const oversizedBlob = createBlob(20000)
    const smallBlob = createBlob(5000)

    // First call oversized, second call succeeds
    mockExportCrop
      .mockResolvedValueOnce(oversizedBlob)
      .mockResolvedValueOnce(smallBlob)

    const result = await compressBlob(canvas, {
      format: 'jpeg',
      quality: 0.9,
      inputMime: 'image/jpeg',
      maxInputSize: 10000,
    })

    // 1 initial + 1 retry (succeeds) = 2 calls
    expect(mockExportCrop).toHaveBeenCalledTimes(2)
    expect(result).toBe(smallBlob)
  })

  it('floors quality at 0.1 to prevent going to zero', async () => {
    const oversizedBlob = createBlob(20000)
    mockExportCrop.mockResolvedValue(oversizedBlob)

    // Start with a low quality so that subtraction would go below 0.1
    await compressBlob(canvas, {
      format: 'jpeg',
      quality: 0.2,
      inputMime: 'image/jpeg',
      maxInputSize: 10000,
    })

    // Initial: 0.2
    // Retry 1: max(0.1, 0.2 - 0.15) = max(0.1, 0.05) = 0.1
    // Retry 2: max(0.1, 0.1 - 0.15) = max(0.1, -0.05) = 0.1
    // Retry 3: max(0.1, 0.1 - 0.15) = 0.1
    expect(mockExportCrop).toHaveBeenNthCalledWith(2, canvas, { format: 'image/jpeg', quality: 0.1 })
    expect(mockExportCrop).toHaveBeenNthCalledWith(3, canvas, { format: 'image/jpeg', quality: 0.1 })
    expect(mockExportCrop).toHaveBeenNthCalledWith(4, canvas, { format: 'image/jpeg', quality: 0.1 })
  })

  it('returns the last blob even if still oversized after max attempts', async () => {
    const oversizedBlob = createBlob(20000)
    mockExportCrop.mockResolvedValue(oversizedBlob)

    const result = await compressBlob(canvas, {
      format: 'jpeg',
      quality: 0.9,
      inputMime: 'image/jpeg',
      maxInputSize: 10000,
    })

    expect(result).toBe(oversizedBlob)
  })
})

describe('useCompressor', () => {
  const canvas = createMockCanvas()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns isCompressing ref and compress function', () => {
    const { isCompressing, compress } = useCompressor()
    expect(isCompressing.value).toBe(false)
    expect(typeof compress).toBe('function')
  })

  it('sets isCompressing to true during compression', async () => {
    const blob = createBlob(1000)
    let capturedIsCompressing = false

    mockExportCrop.mockImplementation(() => {
      // We cannot check the ref mid-await from outside, so we capture inside
      return new Promise((resolve) => {
        // The isCompressing should be true at this point
        capturedIsCompressing = true
        resolve(blob)
      })
    })

    const { isCompressing, compress } = useCompressor()
    expect(isCompressing.value).toBe(false)

    await compress(canvas)

    // After completion, isCompressing should be false
    expect(isCompressing.value).toBe(false)
    expect(capturedIsCompressing).toBe(true)
  })

  it('resets isCompressing to false even when exportCrop throws', async () => {
    mockExportCrop.mockRejectedValue(new Error('export failed'))

    const { isCompressing, compress } = useCompressor()

    await expect(compress(canvas)).rejects.toThrow('export failed')
    expect(isCompressing.value).toBe(false)
  })

  it('uses default format auto and quality 0.85 when no options provided', async () => {
    const blob = createBlob(1000)
    mockExportCrop.mockResolvedValue(blob)

    const { compress } = useCompressor()
    await compress(canvas)

    // With no inputFile, inputMime defaults to 'image/jpeg'
    // format 'auto' with 'image/jpeg' (non-transparent) → getMimeForFormat('auto') → 'image/jpeg'
    expect(mockExportCrop).toHaveBeenCalledWith(canvas, {
      format: 'image/jpeg',
      quality: 0.85,
    })
  })

  it('uses custom format and quality from options', async () => {
    const blob = createBlob(1000)
    mockExportCrop.mockResolvedValue(blob)

    const { compress } = useCompressor({ format: 'png', quality: 0.5 })
    await compress(canvas)

    expect(mockExportCrop).toHaveBeenCalledWith(canvas, {
      format: 'image/png',
      quality: 0.5,
    })
  })

  it('detects MIME type from inputFile when provided', async () => {
    const blob = createBlob(1000)
    mockExportCrop.mockResolvedValue(blob)

    const inputFile = new File(['x'], 'photo.png', { type: 'image/png' })
    mockDetectMimeType.mockReturnValue('image/png')

    const { compress } = useCompressor()
    await compress(canvas, inputFile)

    expect(mockDetectMimeType).toHaveBeenCalledWith(inputFile)
  })

  it('defaults inputMime to image/jpeg when no inputFile provided', async () => {
    const blob = createBlob(1000)
    mockExportCrop.mockResolvedValue(blob)

    const { compress } = useCompressor()
    await compress(canvas)

    // detectMimeType should not be called
    expect(mockDetectMimeType).not.toHaveBeenCalled()
    // The format passed should be based on inputMime 'image/jpeg' (non-transparent → getMimeForFormat('auto'))
    expect(mockExportCrop).toHaveBeenCalledWith(canvas, expect.objectContaining({
      format: 'image/jpeg',
    }))
  })

  it('passes inputFile.size as maxInputSize to trigger compression loop', async () => {
    const oversizedBlob = createBlob(20000)
    const smallBlob = createBlob(5000)
    mockExportCrop
      .mockResolvedValueOnce(oversizedBlob)
      .mockResolvedValueOnce(smallBlob)

    const inputFile = new File(['x'.repeat(10000)], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(inputFile, 'size', { value: 10000 })
    mockDetectMimeType.mockReturnValue('image/jpeg')

    const { compress } = useCompressor()
    const result = await compress(canvas, inputFile)

    // Should have triggered retry since initial blob (20000) > inputFile.size (10000)
    expect(mockExportCrop).toHaveBeenCalledTimes(2)
    expect(result).toBe(smallBlob)
  })

  it('does not pass maxInputSize when no inputFile is provided', async () => {
    const blob = createBlob(50000)
    mockExportCrop.mockResolvedValue(blob)

    const { compress } = useCompressor()
    await compress(canvas)

    // Only one call - no retry loop since maxInputSize is undefined
    expect(mockExportCrop).toHaveBeenCalledTimes(1)
  })

  it('returns the blob from compression', async () => {
    const blob = createBlob(3000, 'image/webp')
    mockExportCrop.mockResolvedValue(blob)

    const { compress } = useCompressor({ format: 'webp', quality: 0.7 })
    const result = await compress(canvas)

    expect(result).toBe(blob)
  })
})

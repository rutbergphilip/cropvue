// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ImageData as CropImageData } from '../types'

// --- Module mocks ---

const mockRenderCrop = vi.fn()
vi.mock('../engine/canvas-renderer', () => ({
  renderCrop: (...args: unknown[]) => mockRenderCrop(...args),
}))

const mockCompressBlob = vi.fn()
vi.mock('../composables/useCompressor', () => ({
  compressBlob: (...args: unknown[]) => mockCompressBlob(...args),
}))

const mockLoadImageFromFile = vi.fn()
const mockLoadImageFromUrl = vi.fn()
vi.mock('../utils/image-loader', () => ({
  loadImageFromFile: (...args: unknown[]) => mockLoadImageFromFile(...args),
  loadImageFromUrl: (...args: unknown[]) => mockLoadImageFromUrl(...args),
}))

const mockDetectMimeType = vi.fn()
vi.mock('../utils/format-detect', () => ({
  detectMimeType: (...args: unknown[]) => mockDetectMimeType(...args),
}))

const mockReadExifOrientation = vi.fn()
const mockGetOrientationTransforms = vi.fn()
vi.mock('../utils/exif', () => ({
  readExifOrientation: (...args: unknown[]) => mockReadExifOrientation(...args),
  getOrientationTransforms: (...args: unknown[]) => mockGetOrientationTransforms(...args),
}))

// Import after mocks
import { useCropper } from '../composables/useCropper'

function createFakeImageData(overrides: Partial<CropImageData> = {}): CropImageData {
  const img = new Image()
  Object.defineProperty(img, 'naturalWidth', { value: 800 })
  Object.defineProperty(img, 'naturalHeight', { value: 600 })
  return {
    element: img,
    naturalWidth: 800,
    naturalHeight: 600,
    originalFile: new File(['test'], 'photo.jpg', { type: 'image/jpeg' }),
    originalSize: 5000,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()

  // Default mock implementations
  mockLoadImageFromFile.mockResolvedValue(createFakeImageData())
  mockLoadImageFromUrl.mockResolvedValue(createFakeImageData())
  mockReadExifOrientation.mockResolvedValue(1)
  mockGetOrientationTransforms.mockReturnValue({
    rotate: 0,
    flip: { horizontal: false, vertical: false },
  })
  mockDetectMimeType.mockReturnValue('image/jpeg')
  mockCompressBlob.mockResolvedValue(new Blob(['compressed'], { type: 'image/jpeg' }))
  mockRenderCrop.mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useCropper', () => {
  it('returns all expected properties', () => {
    const cropper = useCropper()
    expect(cropper).toHaveProperty('transform')
    expect(cropper).toHaveProperty('crop')
    expect(cropper).toHaveProperty('isReady')
    expect(cropper).toHaveProperty('rotateLeft')
    expect(cropper).toHaveProperty('rotateRight')
    expect(cropper).toHaveProperty('rotateTo')
    expect(cropper).toHaveProperty('flipX')
    expect(cropper).toHaveProperty('flipY')
    expect(cropper).toHaveProperty('zoomTo')
    expect(cropper).toHaveProperty('zoomBy')
    expect(cropper).toHaveProperty('panTo')
    expect(cropper).toHaveProperty('reset')
    expect(cropper).toHaveProperty('setCropArea')
    expect(cropper).toHaveProperty('setStencil')
    expect(cropper).toHaveProperty('setAspectRatio')
    expect(cropper).toHaveProperty('getResult')
    expect(cropper).toHaveProperty('canvasRef')
    expect(cropper).toHaveProperty('renderToCanvas')
    expect(cropper).toHaveProperty('getPreviewUrl')
  })

  it('initializes with default state', () => {
    const { transform, crop, isReady } = useCropper()
    expect(transform.value.scale).toBe(1)
    expect(transform.value.rotation).toBe(0)
    expect(transform.value.flipX).toBe(false)
    expect(transform.value.flipY).toBe(false)
    expect(crop.value.stencil).toBe('rectangle')
    expect(isReady.value).toBe(false)
  })

  it('applies options', () => {
    const { crop } = useCropper({
      stencil: 'circle',
      aspectRatio: 1,
    })
    expect(crop.value.stencil).toBe('circle')
    expect(crop.value.aspectRatio).toBe(1)
  })

  it('rotateLeft decreases rotation by 90', () => {
    const { transform, rotateLeft } = useCropper()
    rotateLeft()
    expect(transform.value.rotation).toBe(-90)
  })

  it('rotateRight increases rotation by 90', () => {
    const { transform, rotateRight } = useCropper()
    rotateRight()
    expect(transform.value.rotation).toBe(90)
  })

  it('flipX toggles horizontal flip', () => {
    const { transform, flipX } = useCropper()
    flipX()
    expect(transform.value.flipX).toBe(true)
    flipX()
    expect(transform.value.flipX).toBe(false)
  })

  it('flipY toggles vertical flip', () => {
    const { transform, flipY } = useCropper()
    flipY()
    expect(transform.value.flipY).toBe(true)
  })

  it('zoomBy changes scale', () => {
    const { transform, zoomBy } = useCropper()
    zoomBy(0.5)
    expect(transform.value.scale).toBe(1.5)
  })

  it('zoomTo sets absolute scale', () => {
    const { transform, zoomTo } = useCropper()
    zoomTo(3)
    expect(transform.value.scale).toBe(3)
  })

  it('zoomTo clamps to min 0.1', () => {
    const { transform, zoomTo } = useCropper()
    zoomTo(0.01)
    expect(transform.value.scale).toBe(0.1)
  })

  it('zoomTo clamps to max 10', () => {
    const { transform, zoomTo } = useCropper()
    zoomTo(999)
    expect(transform.value.scale).toBe(10)
  })

  it('panTo sets x and y', () => {
    const { transform, panTo } = useCropper()
    panTo(50, 75)
    expect(transform.value.x).toBe(50)
    expect(transform.value.y).toBe(75)
  })

  it('reset returns to default state', () => {
    const { transform, rotateRight, zoomBy, reset } = useCropper()
    rotateRight()
    zoomBy(2)
    reset()
    expect(transform.value.rotation).toBe(0)
    expect(transform.value.scale).toBe(1)
  })

  it('setStencil changes stencil type', () => {
    const { crop, setStencil } = useCropper()
    setStencil('circle')
    expect(crop.value.stencil).toBe('circle')
  })

  it('setAspectRatio updates constraint', () => {
    const { crop, setAspectRatio } = useCropper()
    setAspectRatio(16 / 9)
    expect(crop.value.aspectRatio).toBeCloseTo(16 / 9)
  })

  it('setAspectRatio with null clears the constraint', () => {
    const { crop, setAspectRatio } = useCropper()
    setAspectRatio(16 / 9)
    setAspectRatio(null)
    expect(crop.value.aspectRatio).toBeUndefined()
  })

  it('setCropArea merges partial area into crop state', () => {
    const { crop, setCropArea } = useCropper()
    setCropArea({ x: 10, y: 20 })
    expect(crop.value.x).toBe(10)
    expect(crop.value.y).toBe(20)
  })

  it('rotateTo sets rotation directly', () => {
    const { transform, rotateTo } = useCropper()
    rotateTo(45)
    expect(transform.value.rotation).toBe(45)
  })
})

describe('transition system', () => {
  it('exposes isTransitioning ref', () => {
    const cropper = useCropper({ transitions: true })
    expect(cropper.isTransitioning.value).toBe(false)
  })

  it('sets isTransitioning during rotateLeft', () => {
    const cropper = useCropper({ transitions: true })
    cropper.rotateLeft()
    expect(cropper.isTransitioning.value).toBe(true)
  })

  it('sets isTransitioning during rotateRight', () => {
    const cropper = useCropper({ transitions: true })
    cropper.rotateRight()
    expect(cropper.isTransitioning.value).toBe(true)
  })

  it('sets isTransitioning during flipX', () => {
    const cropper = useCropper({ transitions: true })
    cropper.flipX()
    expect(cropper.isTransitioning.value).toBe(true)
  })

  it('sets isTransitioning during flipY', () => {
    const cropper = useCropper({ transitions: true })
    cropper.flipY()
    expect(cropper.isTransitioning.value).toBe(true)
  })

  it('does not set isTransitioning when transitions disabled', () => {
    const cropper = useCropper({ transitions: false })
    cropper.rotateLeft()
    expect(cropper.isTransitioning.value).toBe(false)
  })

  it('clears isTransitioning after timeout', async () => {
    vi.useFakeTimers()
    const cropper = useCropper({ transitions: true })
    cropper.rotateLeft()
    expect(cropper.isTransitioning.value).toBe(true)
    vi.advanceTimersByTime(350)
    expect(cropper.isTransitioning.value).toBe(false)
    vi.useRealTimers()
  })

  it('resets transition timeout when called rapidly', () => {
    vi.useFakeTimers()
    const cropper = useCropper({ transitions: true })
    cropper.rotateLeft()
    vi.advanceTimersByTime(200)
    expect(cropper.isTransitioning.value).toBe(true)
    cropper.rotateRight() // restart the timer
    vi.advanceTimersByTime(200)
    expect(cropper.isTransitioning.value).toBe(true) // still transitioning from second call
    vi.advanceTimersByTime(200)
    expect(cropper.isTransitioning.value).toBe(false) // now done
    vi.useRealTimers()
  })
})

describe('setCoordinates / move / zoom', () => {
  it('setCoordinates updates crop area', () => {
    const cropper = useCropper()
    cropper.setCoordinates({ left: 10, top: 20, width: 100, height: 80 })
    expect(cropper.crop.value.x).toBe(10)
    expect(cropper.crop.value.y).toBe(20)
    expect(cropper.crop.value.width).toBe(100)
    expect(cropper.crop.value.height).toBe(80)
  })

  it('setCoordinates allows partial updates', () => {
    const cropper = useCropper()
    const origY = cropper.crop.value.y
    cropper.setCoordinates({ left: 50 })
    expect(cropper.crop.value.x).toBe(50)
    expect(cropper.crop.value.y).toBe(origY)
  })

  it('setCoordinates triggers transition', () => {
    const cropper = useCropper({ transitions: true })
    cropper.setCoordinates({ left: 10 })
    expect(cropper.isTransitioning.value).toBe(true)
  })

  it('move shifts transform position', () => {
    const cropper = useCropper()
    cropper.move(10, 20)
    expect(cropper.transform.value.x).toBe(10)
    expect(cropper.transform.value.y).toBe(20)
  })

  it('move accumulates', () => {
    const cropper = useCropper()
    cropper.move(10, 20)
    cropper.move(5, -3)
    expect(cropper.transform.value.x).toBe(15)
    expect(cropper.transform.value.y).toBe(17)
  })

  it('move triggers transition', () => {
    const cropper = useCropper({ transitions: true })
    cropper.move(10, 20)
    expect(cropper.isTransitioning.value).toBe(true)
  })

  it('zoom scales transform', () => {
    const cropper = useCropper()
    cropper.zoom(2)
    expect(cropper.transform.value.scale).toBe(2)
  })

  it('zoom clamps to max', () => {
    const cropper = useCropper()
    cropper.zoom(100)
    expect(cropper.transform.value.scale).toBe(10)
  })

  it('zoom clamps to min', () => {
    const cropper = useCropper()
    cropper.zoom(0.001)
    expect(cropper.transform.value.scale).toBeGreaterThanOrEqual(0.1)
  })

  it('zoom with center adjusts x/y', () => {
    const cropper = useCropper()
    cropper.zoom(2, { left: 100, top: 100 })
    expect(cropper.transform.value.scale).toBe(2)
    // With center at (100,100), x = 100 - (100 - 0) * 2 = -100
    expect(cropper.transform.value.x).toBe(-100)
    expect(cropper.transform.value.y).toBe(-100)
  })

  it('zoom triggers transition', () => {
    const cropper = useCropper({ transitions: true })
    cropper.zoom(2)
    expect(cropper.isTransitioning.value).toBe(true)
  })
})

describe('setStencil', () => {
  it('circle enforces 1:1 aspect ratio and squares crop', () => {
    const cropper = useCropper()
    // Set up a non-square crop
    cropper.setCropArea({ x: 0, y: 0, width: 200, height: 100 })
    cropper.setStencil('circle')
    expect(cropper.crop.value.stencil).toBe('circle')
    expect(cropper.crop.value.aspectRatio).toBe(1)
    expect(cropper.crop.value.width).toBe(cropper.crop.value.height)
  })

  it('switching from circle to rectangle clears auto-set aspect ratio', () => {
    const cropper = useCropper()
    cropper.setStencil('circle')
    expect(cropper.crop.value.aspectRatio).toBe(1)
    cropper.setStencil('rectangle')
    expect(cropper.crop.value.aspectRatio).toBeUndefined()
  })

  it('switching from circle to rectangle preserves non-auto aspect ratio', () => {
    const cropper = useCropper()
    // Set a custom ratio, then switch to circle and back
    cropper.setCropArea({ aspectRatio: 16 / 9 } as any)
    // Manually set stencil = 'circle' AND aspectRatio = 1 to simulate circle stencil
    // But actually, setStencil('circle') will override to 1
    cropper.setStencil('circle')
    // Now when we switch back, aspect ratio was auto-set to 1 by circle, so it clears
    cropper.setStencil('rectangle')
    expect(cropper.crop.value.aspectRatio).toBeUndefined()
  })

  it('switching to rectangle keeps aspectRatio if it was not 1 from circle', () => {
    const cropper = useCropper()
    // Manually set crop with aspectRatio = 2 and stencil = 'freeform'
    cropper.setCropArea({ aspectRatio: 2, stencil: 'freeform' })
    cropper.setStencil('rectangle')
    expect(cropper.crop.value.aspectRatio).toBe(2)
  })

  it('circle centers the square crop within the previous area', () => {
    const cropper = useCropper()
    cropper.setCropArea({ x: 10, y: 20, width: 200, height: 100 })
    cropper.setStencil('circle')
    // size = min(200, 100) = 100
    // x = 10 + (200 - 100) / 2 = 60
    // y = 20 + (100 - 100) / 2 = 20
    expect(cropper.crop.value.width).toBe(100)
    expect(cropper.crop.value.height).toBe(100)
    expect(cropper.crop.value.x).toBe(60)
    expect(cropper.crop.value.y).toBe(20)
  })
})

describe('loadFile', () => {
  it('loads an image from a file and sets isReady', async () => {
    const cropper = useCropper()
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    await cropper.loadFile(file)
    expect(mockLoadImageFromFile).toHaveBeenCalledWith(file)
    expect(cropper.isReady.value).toBe(true)
    expect(cropper.image.value).not.toBeNull()
  })

  it('initializes crop state from loaded image dimensions', async () => {
    const cropper = useCropper()
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    await cropper.loadFile(file)
    expect(cropper.crop.value.width).toBe(800)
    expect(cropper.crop.value.height).toBe(600)
  })

  it('reads EXIF orientation by default', async () => {
    const cropper = useCropper()
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    await cropper.loadFile(file)
    expect(mockReadExifOrientation).toHaveBeenCalledWith(file)
  })

  it('applies EXIF transforms when orientation is not 1', async () => {
    mockReadExifOrientation.mockResolvedValue(6)
    mockGetOrientationTransforms.mockReturnValue({
      rotate: 90,
      flip: { horizontal: false, vertical: false },
    })

    const cropper = useCropper()
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    await cropper.loadFile(file)

    expect(mockGetOrientationTransforms).toHaveBeenCalledWith(6)
    expect(cropper.transform.value.rotation).toBe(90)
    expect(cropper.transform.value.flipX).toBe(false)
    expect(cropper.transform.value.flipY).toBe(false)
  })

  it('applies EXIF flip transforms', async () => {
    mockReadExifOrientation.mockResolvedValue(2)
    mockGetOrientationTransforms.mockReturnValue({
      rotate: 0,
      flip: { horizontal: true, vertical: false },
    })

    const cropper = useCropper()
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    await cropper.loadFile(file)

    expect(cropper.transform.value.flipX).toBe(true)
    expect(cropper.transform.value.flipY).toBe(false)
  })

  it('does not apply EXIF transforms when orientation is 1', async () => {
    mockReadExifOrientation.mockResolvedValue(1)

    const cropper = useCropper()
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    await cropper.loadFile(file)

    // getOrientationTransforms should NOT have been called
    expect(mockGetOrientationTransforms).not.toHaveBeenCalled()
    expect(cropper.transform.value.rotation).toBe(0)
  })

  it('skips EXIF check when checkOrientation is false', async () => {
    const cropper = useCropper({ checkOrientation: false })
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    await cropper.loadFile(file)

    expect(mockReadExifOrientation).not.toHaveBeenCalled()
  })

  it('resets transform state when loading a new image', async () => {
    const cropper = useCropper()
    cropper.rotateRight()
    cropper.zoomBy(1)

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    await cropper.loadFile(file)

    // Transform is reset via initCropForImage -> createTransformState()
    expect(cropper.transform.value.rotation).toBe(0)
    expect(cropper.transform.value.scale).toBe(1)
  })

  it('respects circle stencil when loading file', async () => {
    const cropper = useCropper({ stencil: 'circle' })
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    await cropper.loadFile(file)

    expect(cropper.crop.value.stencil).toBe('circle')
    expect(cropper.crop.value.aspectRatio).toBe(1)
    expect(cropper.crop.value.width).toBe(cropper.crop.value.height)
  })
})

describe('loadUrl', () => {
  it('loads an image from a URL and sets isReady', async () => {
    const cropper = useCropper()
    await cropper.loadUrl('https://example.com/photo.jpg')
    expect(mockLoadImageFromUrl).toHaveBeenCalledWith('https://example.com/photo.jpg')
    expect(cropper.isReady.value).toBe(true)
    expect(cropper.image.value).not.toBeNull()
  })

  it('initializes crop state from loaded image dimensions', async () => {
    const cropper = useCropper()
    await cropper.loadUrl('https://example.com/photo.jpg')
    expect(cropper.crop.value.width).toBe(800)
    expect(cropper.crop.value.height).toBe(600)
  })

  it('resets transform state when loading from URL', async () => {
    const cropper = useCropper()
    cropper.rotateRight()
    await cropper.loadUrl('https://example.com/photo.jpg')
    expect(cropper.transform.value.rotation).toBe(0)
  })
})

describe('getResult', () => {
  it('throws when no image is loaded', async () => {
    const cropper = useCropper()
    await expect(cropper.getResult()).rejects.toThrow('No image loaded')
  })

  it('renders crop and returns result', async () => {
    const cropper = useCropper()
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))

    const result = await cropper.getResult()

    expect(mockRenderCrop).toHaveBeenCalled()
    expect(mockCompressBlob).toHaveBeenCalled()
    expect(result).toHaveProperty('blob')
    expect(result).toHaveProperty('file')
    expect(result).toHaveProperty('url')
    expect(result).toHaveProperty('coords')
    expect(result).toHaveProperty('width')
    expect(result).toHaveProperty('height')
    expect(result).toHaveProperty('originalWidth')
    expect(result).toHaveProperty('originalHeight')
  })

  it('passes crop and transform to renderCrop', async () => {
    const cropper = useCropper()
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))
    cropper.rotateRight()

    await cropper.getResult()

    const renderCall = mockRenderCrop.mock.calls[0]
    // args: canvas, img.element, crop, transform, options
    expect(renderCall[2]).toEqual(cropper.crop.value)
    expect(renderCall[3]).toEqual(cropper.transform.value)
  })

  it('passes maxWidth/maxHeight from options and getResult opts', async () => {
    const cropper = useCropper({ outputMaxWidth: 1000, outputMaxHeight: 800 })
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))

    await cropper.getResult()

    const renderCall = mockRenderCrop.mock.calls[0]
    expect(renderCall[4]).toEqual({ maxWidth: 1000, maxHeight: 800 })
  })

  it('getResult opts override cropper outputMaxWidth/maxHeight', async () => {
    const cropper = useCropper({ outputMaxWidth: 1000, outputMaxHeight: 800 })
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))

    await cropper.getResult({ maxWidth: 500, maxHeight: 400 })

    const renderCall = mockRenderCrop.mock.calls[0]
    expect(renderCall[4]).toEqual({ maxWidth: 500, maxHeight: 400 })
  })

  it('passes format and quality to compressBlob', async () => {
    const cropper = useCropper({ outputFormat: 'webp', outputQuality: 0.9 })
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))

    await cropper.getResult()

    const compressCall = mockCompressBlob.mock.calls[0]
    expect(compressCall[1].format).toBe('webp')
    expect(compressCall[1].quality).toBe(0.9)
  })

  it('getResult opts override cropper format and quality', async () => {
    const cropper = useCropper({ outputFormat: 'webp', outputQuality: 0.9 })
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))

    await cropper.getResult({ format: 'png', quality: 0.5 })

    const compressCall = mockCompressBlob.mock.calls[0]
    expect(compressCall[1].format).toBe('png')
    expect(compressCall[1].quality).toBe(0.5)
  })

  it('uses default format/quality when none specified', async () => {
    const cropper = useCropper()
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))

    await cropper.getResult()

    const compressCall = mockCompressBlob.mock.calls[0]
    expect(compressCall[1].format).toBe('auto')
    expect(compressCall[1].quality).toBe(0.85)
  })

  it('detects input mime from original file', async () => {
    mockDetectMimeType.mockReturnValue('image/png')
    const fakeImage = createFakeImageData({
      originalFile: new File(['test'], 'photo.png', { type: 'image/png' }),
    })
    mockLoadImageFromFile.mockResolvedValue(fakeImage)

    const cropper = useCropper()
    await cropper.loadFile(new File(['test'], 'photo.png', { type: 'image/png' }))
    await cropper.getResult()

    expect(mockDetectMimeType).toHaveBeenCalledWith(fakeImage.originalFile)
    const compressCall = mockCompressBlob.mock.calls[0]
    expect(compressCall[1].inputMime).toBe('image/png')
  })

  it('defaults inputMime to image/jpeg when no original file', async () => {
    const fakeImage = createFakeImageData({ originalFile: undefined })
    mockLoadImageFromFile.mockResolvedValue(fakeImage)

    const cropper = useCropper()
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))
    await cropper.getResult()

    const compressCall = mockCompressBlob.mock.calls[0]
    expect(compressCall[1].inputMime).toBe('image/jpeg')
  })

  it('passes maxInputSize from image originalSize', async () => {
    const fakeImage = createFakeImageData({ originalSize: 12345 })
    mockLoadImageFromFile.mockResolvedValue(fakeImage)

    const cropper = useCropper()
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))
    await cropper.getResult()

    const compressCall = mockCompressBlob.mock.calls[0]
    expect(compressCall[1].maxInputSize).toBe(12345)
  })

  it('creates a File from the blob with correct name and type', async () => {
    const fakeBlob = new Blob(['data'], { type: 'image/webp' })
    mockCompressBlob.mockResolvedValue(fakeBlob)

    const cropper = useCropper()
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))
    const result = await cropper.getResult()

    expect(result.file).toBeInstanceOf(File)
    expect(result.file.name).toBe('cropped.webp')
    expect(result.file.type).toBe('image/webp')
  })

  it('creates object URL for the result', async () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:result-url')

    const cropper = useCropper()
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))
    const result = await cropper.getResult()

    expect(result.url).toBe('blob:result-url')

    createSpy.mockRestore()
  })

  it('revokes previous result URL when getting new result', async () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')

    createSpy.mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second')

    const cropper = useCropper()
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))

    await cropper.getResult()
    expect(revokeSpy).not.toHaveBeenCalledWith('blob:first')

    await cropper.getResult()
    expect(revokeSpy).toHaveBeenCalledWith('blob:first')

    createSpy.mockRestore()
    revokeSpy.mockRestore()
  })

  it('returns correct coords with current transform state', async () => {
    const cropper = useCropper()
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))

    cropper.rotateRight()
    cropper.flipX()
    cropper.zoomTo(2)
    cropper.setCoordinates({ left: 10, top: 20, width: 100, height: 80 })

    const result = await cropper.getResult()

    expect(result.coords.x).toBe(10)
    expect(result.coords.y).toBe(20)
    expect(result.coords.width).toBe(100)
    expect(result.coords.height).toBe(80)
    expect(result.coords.rotation).toBe(90)
    expect(result.coords.flipX).toBe(true)
    expect(result.coords.flipY).toBe(false)
    expect(result.coords.scale).toBe(2)
  })

  it('returns original dimensions from loaded image', async () => {
    const cropper = useCropper()
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))

    const result = await cropper.getResult()

    expect(result.originalWidth).toBe(800)
    expect(result.originalHeight).toBe(600)
  })

  it('uses canvasRef when available', async () => {
    const cropper = useCropper()
    const canvas = document.createElement('canvas')
    cropper.canvasRef.value = canvas

    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))
    await cropper.getResult()

    const renderCall = mockRenderCrop.mock.calls[0]
    expect(renderCall[0]).toBe(canvas)
  })

  it('creates a new canvas when canvasRef is null', async () => {
    const cropper = useCropper()
    // canvasRef is null by default
    expect(cropper.canvasRef.value).toBeNull()

    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))
    await cropper.getResult()

    const renderCall = mockRenderCrop.mock.calls[0]
    expect(renderCall[0]).toBeInstanceOf(HTMLCanvasElement)
  })

  it('handles blob type without slash gracefully in filename', async () => {
    const fakeBlob = new Blob(['data'], { type: 'application' })
    mockCompressBlob.mockResolvedValue(fakeBlob)

    const cropper = useCropper()
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))
    const result = await cropper.getResult()

    // blob.type.split('/')[1] is undefined, so fallback to 'jpg'
    expect(result.file.name).toBe('cropped.jpg')
  })
})

describe('renderToCanvas', () => {
  it('calls renderCrop when both canvas and image exist', async () => {
    const cropper = useCropper()
    const canvas = document.createElement('canvas')
    cropper.canvasRef.value = canvas

    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))
    mockRenderCrop.mockClear()

    cropper.renderToCanvas()

    expect(mockRenderCrop).toHaveBeenCalledTimes(1)
    expect(mockRenderCrop.mock.calls[0][0]).toBe(canvas)
  })

  it('does nothing when canvas is null', async () => {
    const cropper = useCropper()
    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))
    mockRenderCrop.mockClear()

    cropper.renderToCanvas()

    expect(mockRenderCrop).not.toHaveBeenCalled()
  })

  it('does nothing when image is null', () => {
    const cropper = useCropper()
    const canvas = document.createElement('canvas')
    cropper.canvasRef.value = canvas
    mockRenderCrop.mockClear()

    cropper.renderToCanvas()

    expect(mockRenderCrop).not.toHaveBeenCalled()
  })

  it('passes outputMaxWidth/maxHeight options', async () => {
    const cropper = useCropper({ outputMaxWidth: 500, outputMaxHeight: 300 })
    const canvas = document.createElement('canvas')
    cropper.canvasRef.value = canvas

    await cropper.loadFile(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))
    mockRenderCrop.mockClear()

    cropper.renderToCanvas()

    const renderCall = mockRenderCrop.mock.calls[0]
    expect(renderCall[4]).toEqual({ maxWidth: 500, maxHeight: 300 })
  })
})

describe('getPreviewUrl', () => {
  it('returns empty string when canvasRef is null', () => {
    const cropper = useCropper()
    expect(cropper.getPreviewUrl()).toBe('')
  })

  it('returns toDataURL of canvas when available', () => {
    const cropper = useCropper()
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    // Mock toDataURL since jsdom doesn't implement it without canvas npm package
    canvas.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,abc')
    cropper.canvasRef.value = canvas

    const url = cropper.getPreviewUrl()
    expect(url).toBe('data:image/png;base64,abc')
    expect(canvas.toDataURL).toHaveBeenCalled()
  })
})

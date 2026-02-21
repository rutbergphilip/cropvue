// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderCrop, exportCrop } from '../engine/canvas-renderer'
import { createTransformState, createCropState } from '../engine/transform'
import type { CropState } from '../types'

function createMockCtx() {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
  }
}

function createMockCanvas(ctx: ReturnType<typeof createMockCtx> | null = null) {
  const canvas = document.createElement('canvas')
  const resolvedCtx = ctx ?? createMockCtx()
  vi.spyOn(canvas, 'getContext').mockReturnValue(resolvedCtx as unknown as CanvasRenderingContext2D)
  return { canvas, ctx: resolvedCtx }
}

function createMockImage(naturalWidth = 800, naturalHeight = 600): HTMLImageElement {
  const img = new Image()
  Object.defineProperty(img, 'naturalWidth', { value: naturalWidth, configurable: true })
  Object.defineProperty(img, 'naturalHeight', { value: naturalHeight, configurable: true })
  return img
}

describe('renderCrop', () => {
  it('sets canvas dimensions to crop size', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop = createCropState({ width: 200, height: 150 })
    const transform = createTransformState()
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform)

    expect(canvas.width).toBe(200)
    expect(canvas.height).toBe(150)
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 200, 150)
  })

  it('returns early when getContext returns null', () => {
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'getContext').mockReturnValue(null)
    const crop = createCropState({ width: 200, height: 150 })
    const transform = createTransformState()
    const img = createMockImage()

    // Should not throw
    renderCrop(canvas, img, crop, transform)

    // Canvas dimensions are still set before getContext check
    expect(canvas.width).toBe(200)
    expect(canvas.height).toBe(150)
  })

  it('applies circle stencil clipping', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop: CropState = {
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      stencil: 'circle',
      aspectRatio: 1,
    }
    const transform = createTransformState()
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform)

    expect(ctx.beginPath).toHaveBeenCalled()
    expect(ctx.arc).toHaveBeenCalledWith(100, 100, 100, 0, Math.PI * 2)
    expect(ctx.closePath).toHaveBeenCalled()
    expect(ctx.clip).toHaveBeenCalled()
  })

  it('applies circle stencil using smaller dimension for radius', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop: CropState = {
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      stencil: 'circle',
    }
    const transform = createTransformState()
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform)

    // radius = Math.min(300, 200) / 2 = 100
    expect(ctx.arc).toHaveBeenCalledWith(150, 100, 100, 0, Math.PI * 2)
  })

  it('applies freeform stencil clipping with 3+ points', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop: CropState = {
      x: 10,
      y: 10,
      width: 200,
      height: 200,
      stencil: 'freeform',
      points: [
        { x: 10, y: 10 },
        { x: 210, y: 10 },
        { x: 210, y: 210 },
        { x: 10, y: 210 },
      ],
    }
    const transform = createTransformState()
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform)

    // scaleX = 200/200 = 1, scaleY = 200/200 = 1
    // First point: (10-10)*1, (10-10)*1 = (0, 0)
    expect(ctx.beginPath).toHaveBeenCalled()
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0)
    // Second point: (210-10)*1, (10-10)*1 = (200, 0)
    expect(ctx.lineTo).toHaveBeenCalledWith(200, 0)
    // Third point: (210-10)*1, (210-10)*1 = (200, 200)
    expect(ctx.lineTo).toHaveBeenCalledWith(200, 200)
    // Fourth point: (10-10)*1, (210-10)*1 = (0, 200)
    expect(ctx.lineTo).toHaveBeenCalledWith(0, 200)
    expect(ctx.closePath).toHaveBeenCalled()
    expect(ctx.clip).toHaveBeenCalled()
  })

  it('does not apply freeform clipping with fewer than 3 points', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop: CropState = {
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      stencil: 'freeform',
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
    }
    const transform = createTransformState()
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform)

    // moveTo/lineTo should not be called for freeform path
    expect(ctx.moveTo).not.toHaveBeenCalled()
    expect(ctx.lineTo).not.toHaveBeenCalled()
    // clip is only called after freeform path, not for rectangle stencil
    expect(ctx.clip).not.toHaveBeenCalled()
  })

  it('does not apply freeform clipping when points is undefined', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop: CropState = {
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      stencil: 'freeform',
    }
    const transform = createTransformState()
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform)

    expect(ctx.moveTo).not.toHaveBeenCalled()
    expect(ctx.clip).not.toHaveBeenCalled()
  })

  it('applies transform operations in correct order', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop = createCropState({ width: 200, height: 150 })
    const transform = createTransformState({ x: 10, y: 20, scale: 1.5, rotation: 45 })
    const img = createMockImage(800, 600)

    renderCrop(canvas, img, crop, transform)

    // Verify the sequence of calls
    const callOrder: string[] = []
    ctx.save.mock.invocationCallOrder.forEach(() => callOrder.push('save'))
    ctx.scale.mock.invocationCallOrder.forEach(() => callOrder.push('scale'))
    ctx.translate.mock.invocationCallOrder.forEach(() => callOrder.push('translate'))
    ctx.rotate.mock.invocationCallOrder.forEach(() => callOrder.push('rotate'))
    ctx.drawImage.mock.invocationCallOrder.forEach(() => callOrder.push('drawImage'))
    ctx.restore.mock.invocationCallOrder.forEach(() => callOrder.push('restore'))

    callOrder.sort((a, b) => {
      const getOrder = (name: string) => {
        const mock = (ctx as any)[name].mock
        return mock.invocationCallOrder[callOrder.filter(c => c === name).indexOf(name) < mock.invocationCallOrder.length ? callOrder.slice(0, callOrder.indexOf(name) + 1).filter(c => c === name).length - 1 : 0]
      }
      return 0
    })

    // Verify save was called
    expect(ctx.save).toHaveBeenCalledTimes(1)

    // Verify the transform arguments:
    // scaleX = 200/200 = 1, scaleY = 150/150 = 1
    // 1. ctx.scale(scaleX, scaleY)
    expect(ctx.scale).toHaveBeenCalledWith(1, 1) // first scale call: map to crop region
    // 2. ctx.translate(-crop.x, -crop.y)
    expect(ctx.translate).toHaveBeenCalledWith(-0, -0) // crop.x=0, crop.y=0
    // 3. ctx.translate(imgW/2, imgH/2)
    expect(ctx.translate).toHaveBeenCalledWith(400, 300) // image center
    // 4. ctx.translate(transform.x, transform.y)
    expect(ctx.translate).toHaveBeenCalledWith(10, 20)
    // 5. ctx.scale(transform.scale, transform.scale) - no flip
    expect(ctx.scale).toHaveBeenCalledWith(1.5, 1.5)
    // 6. ctx.rotate(45 * Math.PI / 180)
    expect(ctx.rotate).toHaveBeenCalledWith((45 * Math.PI) / 180)
    // 7. ctx.translate(-imgW/2, -imgH/2)
    expect(ctx.translate).toHaveBeenCalledWith(-400, -300)
    // 8. ctx.drawImage(image, 0, 0)
    expect(ctx.drawImage).toHaveBeenCalledWith(img, 0, 0)
    // 9. ctx.restore
    expect(ctx.restore).toHaveBeenCalledTimes(1)
  })

  it('applies flipX transform with negated scale', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop = createCropState({ width: 200, height: 150 })
    const transform = createTransformState({ scale: 2, flipX: true, flipY: false })
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform)

    // flipX: -transform.scale, flipY stays positive
    expect(ctx.scale).toHaveBeenCalledWith(-2, 2)
  })

  it('applies flipY transform with negated scale', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop = createCropState({ width: 200, height: 150 })
    const transform = createTransformState({ scale: 2, flipX: false, flipY: true })
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform)

    // flipX stays positive, flipY: -transform.scale
    expect(ctx.scale).toHaveBeenCalledWith(2, -2)
  })

  it('applies both flipX and flipY together', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop = createCropState({ width: 200, height: 150 })
    const transform = createTransformState({ scale: 1.5, flipX: true, flipY: true })
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform)

    expect(ctx.scale).toHaveBeenCalledWith(-1.5, -1.5)
  })

  it('respects maxWidth downsampling', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop = createCropState({ width: 2000, height: 1000 })
    const transform = createTransformState()
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform, { maxWidth: 800 })

    // ratio = min(800/2000, Inf/1000, 1) = min(0.4, Inf, 1) = 0.4
    // outWidth = round(2000*0.4) = 800, outHeight = round(1000*0.4) = 400
    expect(canvas.width).toBe(800)
    expect(canvas.height).toBe(400)
  })

  it('respects maxHeight downsampling', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop = createCropState({ width: 1000, height: 2000 })
    const transform = createTransformState()
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform, { maxHeight: 500 })

    // ratio = min(Inf/1000, 500/2000, 1) = min(Inf, 0.25, 1) = 0.25
    // outWidth = round(1000*0.25) = 250, outHeight = round(2000*0.25) = 500
    expect(canvas.width).toBe(250)
    expect(canvas.height).toBe(500)
  })

  it('respects both maxWidth and maxHeight downsampling', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop = createCropState({ width: 2000, height: 1500 })
    const transform = createTransformState()
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform, { maxWidth: 800, maxHeight: 600 })

    expect(canvas.width).toBeLessThanOrEqual(800)
    expect(canvas.height).toBeLessThanOrEqual(600)
  })

  it('does not upsample when dimensions are within max limits', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop = createCropState({ width: 200, height: 150 })
    const transform = createTransformState()
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform, { maxWidth: 800, maxHeight: 600 })

    // ratio = min(800/200, 600/150, 1) = min(4, 4, 1) = 1 (clamped to 1)
    expect(canvas.width).toBe(200)
    expect(canvas.height).toBe(150)
  })

  it('does not apply rectangle stencil clipping', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop = createCropState({ width: 200, height: 200 })
    const transform = createTransformState()
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform)

    // Rectangle stencil should not trigger clip
    expect(ctx.clip).not.toHaveBeenCalled()
  })

  it('uses correct freeform scale factors when output is downsampled', () => {
    const { canvas, ctx } = createMockCanvas()
    const crop: CropState = {
      x: 0,
      y: 0,
      width: 400,
      height: 400,
      stencil: 'freeform',
      points: [
        { x: 0, y: 0 },
        { x: 400, y: 0 },
        { x: 200, y: 400 },
      ],
    }
    const transform = createTransformState()
    const img = createMockImage()

    renderCrop(canvas, img, crop, transform, { maxWidth: 200, maxHeight: 200 })

    // outWidth = 200, outHeight = 200; crop.width = 400, crop.height = 400
    // scaleX = 200/400 = 0.5, scaleY = 200/400 = 0.5
    // First point: (0-0)*0.5, (0-0)*0.5 = (0, 0)
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0)
    // Second point: (400-0)*0.5, (0-0)*0.5 = (200, 0)
    expect(ctx.lineTo).toHaveBeenCalledWith(200, 0)
    // Third point: (200-0)*0.5, (400-0)*0.5 = (100, 200)
    expect(ctx.lineTo).toHaveBeenCalledWith(100, 200)
  })
})

describe('exportCrop', () => {
  it('resolves with blob when toBlob succeeds', async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100

    const fakeBlob = new Blob(['test'], { type: 'image/png' })
    vi.spyOn(canvas, 'toBlob').mockImplementation((callback, format, quality) => {
      callback(fakeBlob)
    })

    const result = await exportCrop(canvas, { format: 'image/png', quality: 0.9 })
    expect(result).toBe(fakeBlob)
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', 0.9)
  })

  it('rejects when toBlob returns null', async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 50
    canvas.height = 50

    vi.spyOn(canvas, 'toBlob').mockImplementation((callback, format, quality) => {
      callback(null)
    })

    await expect(
      exportCrop(canvas, { format: 'image/webp', quality: 0.8 })
    ).rejects.toThrow('Canvas export failed: toBlob returned null (canvas size: 50x50, format: image/webp)')
  })

  it('passes format and quality to toBlob', async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100

    const fakeBlob = new Blob(['data'], { type: 'image/jpeg' })
    const toBlobSpy = vi.spyOn(canvas, 'toBlob').mockImplementation((callback, format, quality) => {
      callback(fakeBlob)
    })

    await exportCrop(canvas, { format: 'image/jpeg', quality: 0.75 })

    expect(toBlobSpy).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.75)
  })
})

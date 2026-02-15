import { describe, it, expect } from 'vitest'
import { useCropper } from '../composables/useCropper'

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
  })

  it('initializes with default state', () => {
    const { transform, crop, isReady } = useCropper()
    expect(transform.value.scale).toBe(1)
    expect(transform.value.rotation).toBe(0)
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

  it('does not set isTransitioning when transitions disabled', () => {
    const cropper = useCropper({ transitions: false })
    cropper.rotateLeft()
    expect(cropper.isTransitioning.value).toBe(false)
  })
})

describe('new methods', () => {
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

  it('move shifts transform position', () => {
    const cropper = useCropper()
    cropper.move(10, 20)
    expect(cropper.transform.value.x).toBe(10)
    expect(cropper.transform.value.y).toBe(20)
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
})

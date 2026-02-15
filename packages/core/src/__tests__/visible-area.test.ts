import { describe, it, expect } from 'vitest'
import {
  transformToVisibleArea,
  visibleAreaToTransform,
  fitVisibleArea,
} from '../engine/visible-area'
import { createTransformState } from '../engine/transform'

describe('transformToVisibleArea', () => {
  it('converts default transform to visible area', () => {
    const transform = createTransformState()
    const imageSize = { width: 1000, height: 800 }
    const boundaries = { width: 500, height: 400 }
    const area = transformToVisibleArea(transform, imageSize, boundaries)
    expect(area.width).toBeGreaterThan(0)
    expect(area.height).toBeGreaterThan(0)
  })

  it('zoomed-in transform produces smaller visible area', () => {
    const transform = { ...createTransformState(), scale: 2 }
    const imageSize = { width: 1000, height: 800 }
    const boundaries = { width: 500, height: 400 }
    const area = transformToVisibleArea(transform, imageSize, boundaries)
    const defaultArea = transformToVisibleArea(createTransformState(), imageSize, boundaries)
    expect(area.width).toBeLessThan(defaultArea.width)
    expect(area.height).toBeLessThan(defaultArea.height)
  })

  it('panned transform shifts visible area', () => {
    const transform = { ...createTransformState(), x: 50, y: 30 }
    const imageSize = { width: 1000, height: 800 }
    const boundaries = { width: 500, height: 400 }
    const area = transformToVisibleArea(transform, imageSize, boundaries)
    const defaultArea = transformToVisibleArea(createTransformState(), imageSize, boundaries)
    expect(area.left).toBeLessThan(defaultArea.left) // panning right shifts visible area left
  })
})

describe('visibleAreaToTransform', () => {
  it('roundtrips: transform -> visibleArea -> transform', () => {
    const original = createTransformState()
    const imageSize = { width: 1000, height: 800 }
    const boundaries = { width: 500, height: 400 }
    const area = transformToVisibleArea(original, imageSize, boundaries)
    const result = visibleAreaToTransform(area, imageSize, boundaries)
    expect(result.x).toBeCloseTo(original.x, 1)
    expect(result.y).toBeCloseTo(original.y, 1)
    expect(result.scale).toBeCloseTo(original.scale, 2)
  })

  it('roundtrips with zoomed transform', () => {
    const original = { ...createTransformState(), scale: 2, x: 50, y: -30 }
    const imageSize = { width: 1000, height: 800 }
    const boundaries = { width: 500, height: 400 }
    const area = transformToVisibleArea(original, imageSize, boundaries)
    const result = visibleAreaToTransform(area, imageSize, boundaries)
    expect(result.x).toBeCloseTo(original.x, 1)
    expect(result.y).toBeCloseTo(original.y, 1)
    expect(result.scale).toBeCloseTo(original.scale, 2)
  })
})

describe('fitVisibleArea', () => {
  it('clamps negative position to zero', () => {
    const area = { left: -100, top: -100, width: 500, height: 400 }
    const imageSize = { width: 1000, height: 800 }
    const fitted = fitVisibleArea(area, imageSize)
    expect(fitted.left).toBe(0)
    expect(fitted.top).toBe(0)
  })

  it('clamps position so area stays within image', () => {
    const area = { left: 900, top: 700, width: 500, height: 400 }
    const imageSize = { width: 1000, height: 800 }
    const fitted = fitVisibleArea(area, imageSize)
    expect(fitted.left + fitted.width).toBeLessThanOrEqual(imageSize.width)
    expect(fitted.top + fitted.height).toBeLessThanOrEqual(imageSize.height)
  })

  it('clamps area size to image dimensions', () => {
    const area = { left: 0, top: 0, width: 2000, height: 1600 }
    const imageSize = { width: 1000, height: 800 }
    const fitted = fitVisibleArea(area, imageSize)
    expect(fitted.width).toBeLessThanOrEqual(imageSize.width)
    expect(fitted.height).toBeLessThanOrEqual(imageSize.height)
  })
})

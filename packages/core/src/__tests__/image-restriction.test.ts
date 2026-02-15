import { describe, it, expect } from 'vitest'
import { computePanBounds, computeZoomBounds } from '../engine/image-restriction'

describe('computePanBounds', () => {
  const imageSize = { width: 1000, height: 800 }
  const visibleArea = { left: 0, top: 0, width: 500, height: 400 }

  it('returns unbounded for "none"', () => {
    const bounds = computePanBounds(imageSize, visibleArea, 'none')
    expect(bounds.minX).toBe(-Infinity)
    expect(bounds.maxX).toBe(Infinity)
    expect(bounds.minY).toBe(-Infinity)
    expect(bounds.maxY).toBe(Infinity)
  })

  it('returns fill-area bounds (image must fill viewport)', () => {
    const bounds = computePanBounds(imageSize, visibleArea, 'fill-area')
    expect(bounds.minX).toBe(0)
    expect(bounds.maxX).toBe(500)
    expect(bounds.minY).toBe(0)
    expect(bounds.maxY).toBe(400)
  })

  it('returns fit-area bounds', () => {
    const bounds = computePanBounds(imageSize, visibleArea, 'fit-area')
    expect(bounds.minX).toBeLessThanOrEqual(bounds.maxX)
    expect(bounds.minY).toBeLessThanOrEqual(bounds.maxY)
  })

  it('returns stencil bounds', () => {
    const stencil = { left: 100, top: 100, width: 200, height: 200 }
    const bounds = computePanBounds(imageSize, visibleArea, 'stencil', stencil)
    expect(bounds.minX).toBeLessThanOrEqual(stencil.left)
    expect(bounds.maxX).toBeGreaterThanOrEqual(stencil.left)
  })
})

describe('computeZoomBounds', () => {
  const imageSize = { width: 1000, height: 800 }
  const visibleArea = { left: 0, top: 0, width: 500, height: 400 }

  it('returns 0.1-10 for "none"', () => {
    const bounds = computeZoomBounds(imageSize, visibleArea, 'none')
    expect(bounds.minScale).toBe(0.1)
    expect(bounds.maxScale).toBe(10)
  })

  it('fill-area minScale prevents image from being smaller than viewport', () => {
    const bounds = computeZoomBounds(imageSize, visibleArea, 'fill-area')
    expect(bounds.minScale).toBeGreaterThan(0)
    expect(bounds.minScale * imageSize.width).toBeGreaterThanOrEqual(visibleArea.width)
  })
})

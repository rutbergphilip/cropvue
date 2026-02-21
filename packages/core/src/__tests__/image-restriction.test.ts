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

  it('computes fit-area zoom bounds (lines 79-83)', () => {
    const bounds = computeZoomBounds(imageSize, visibleArea, 'fit-area')
    // fitScale = min(500/1000, 400/800) = min(0.5, 0.5) = 0.5
    // minScale = max(0.1, 0.5 * 0.5) = max(0.1, 0.25) = 0.25
    expect(bounds.minScale).toBeCloseTo(0.25, 5)
    expect(bounds.maxScale).toBe(10)
  })

  it('computes stencil zoom bounds (same as fit-area branch)', () => {
    const bounds = computeZoomBounds(imageSize, visibleArea, 'stencil')
    // Same logic as fit-area for zoom bounds
    const fitScale = Math.min(500 / 1000, 400 / 800)
    expect(bounds.minScale).toBeCloseTo(Math.max(0.1, fitScale * 0.5), 5)
    expect(bounds.maxScale).toBe(10)
  })

  it('fit-area minScale is at least MIN_SCALE', () => {
    // Use a very large image relative to visible area so fitScale * 0.5 < 0.1
    const largeImage = { width: 10000, height: 8000 }
    const smallArea = { left: 0, top: 0, width: 100, height: 80 }
    const bounds = computeZoomBounds(largeImage, smallArea, 'fit-area')
    // fitScale = min(100/10000, 80/8000) = 0.01
    // minScale = max(0.1, 0.01 * 0.5) = max(0.1, 0.005) = 0.1
    expect(bounds.minScale).toBe(0.1)
  })

  it('fill-area uses the larger of the two axis ratios', () => {
    // Non-square aspect ratio: width ratio should dominate
    const wideArea = { left: 0, top: 0, width: 800, height: 200 }
    const squareImage = { width: 1000, height: 1000 }
    const bounds = computeZoomBounds(squareImage, wideArea, 'fill-area')
    // minScaleX = 800/1000 = 0.8, minScaleY = 200/1000 = 0.2
    // minScale = max(0.8, 0.2) = 0.8
    expect(bounds.minScale).toBeCloseTo(0.8, 5)
  })
})

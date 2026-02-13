import { describe, it, expect } from 'vitest'
import { getMaxCanvasSize, downsampleDimensions } from '../utils/canvas-limits'

describe('downsampleDimensions', () => {
  it('returns original dimensions when within limits', () => {
    const result = downsampleDimensions(1000, 1000, 4096)
    expect(result).toEqual({ width: 1000, height: 1000 })
  })

  it('downsamples width when exceeding limit', () => {
    const result = downsampleDimensions(8000, 4000, 4096)
    expect(result.width).toBe(4096)
    expect(result.height).toBe(2048)
  })

  it('downsamples height when exceeding limit', () => {
    const result = downsampleDimensions(2000, 8000, 4096)
    expect(result.width).toBe(1024)
    expect(result.height).toBe(4096)
  })

  it('preserves aspect ratio', () => {
    const result = downsampleDimensions(6000, 3000, 4096)
    expect(result.width / result.height).toBeCloseTo(2, 1)
  })
})

describe('getMaxCanvasSize', () => {
  it('returns a positive number', () => {
    const size = getMaxCanvasSize()
    expect(size).toBeGreaterThan(0)
  })
})

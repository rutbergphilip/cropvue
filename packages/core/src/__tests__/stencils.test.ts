import { describe, it, expect } from 'vitest'
import {
  getRectangleClipPath,
  getCircleClipPath,
  getFreeformClipPath,
  isPointInsideStencil,
} from '../engine/stencils'

describe('getRectangleClipPath', () => {
  it('returns inset clip-path CSS', () => {
    const result = getRectangleClipPath({ x: 10, y: 20, width: 100, height: 80 }, { containerWidth: 300, containerHeight: 300 })
    expect(result).toContain('inset(')
  })
})

describe('getCircleClipPath', () => {
  it('returns circle clip-path CSS', () => {
    const result = getCircleClipPath({ x: 50, y: 50, width: 100, height: 100 }, { containerWidth: 300, containerHeight: 300 })
    expect(result).toContain('circle(')
  })

  it('uses the smaller dimension as diameter', () => {
    const result = getCircleClipPath({ x: 50, y: 50, width: 200, height: 100 }, { containerWidth: 500, containerHeight: 500 })
    expect(result).toContain('50px')
  })
})

describe('getFreeformClipPath', () => {
  it('returns polygon clip-path CSS', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]
    const result = getFreeformClipPath(points)
    expect(result).toContain('polygon(')
  })

  it('returns empty string for fewer than 3 points', () => {
    const result = getFreeformClipPath([{ x: 0, y: 0 }, { x: 10, y: 10 }])
    expect(result).toBe('')
  })
})

describe('isPointInsideStencil', () => {
  it('detects point inside rectangle', () => {
    expect(isPointInsideStencil(50, 50, {
      stencil: 'rectangle',
      x: 0, y: 0, width: 100, height: 100,
    })).toBe(true)
  })

  it('detects point outside rectangle', () => {
    expect(isPointInsideStencil(150, 150, {
      stencil: 'rectangle',
      x: 0, y: 0, width: 100, height: 100,
    })).toBe(false)
  })

  it('detects point inside circle', () => {
    expect(isPointInsideStencil(50, 50, {
      stencil: 'circle',
      x: 0, y: 0, width: 100, height: 100,
    })).toBe(true)
  })

  it('detects point outside circle corners', () => {
    expect(isPointInsideStencil(1, 1, {
      stencil: 'circle',
      x: 0, y: 0, width: 100, height: 100,
    })).toBe(false)
  })
})

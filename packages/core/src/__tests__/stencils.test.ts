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

  // Freeform stencil tests (covers lines 58-76: isPointInsidePolygon)
  describe('freeform stencil', () => {
    const triangle = [
      { x: 50, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]

    it('detects point inside a freeform triangle', () => {
      expect(isPointInsideStencil(50, 50, {
        stencil: 'freeform',
        x: 0, y: 0, width: 100, height: 100,
        points: triangle,
      })).toBe(true)
    })

    it('detects point outside a freeform triangle', () => {
      expect(isPointInsideStencil(5, 5, {
        stencil: 'freeform',
        x: 0, y: 0, width: 100, height: 100,
        points: triangle,
      })).toBe(false)
    })

    it('detects point inside a freeform square polygon', () => {
      const square = [
        { x: 10, y: 10 },
        { x: 90, y: 10 },
        { x: 90, y: 90 },
        { x: 10, y: 90 },
      ]
      expect(isPointInsideStencil(50, 50, {
        stencil: 'freeform',
        x: 0, y: 0, width: 100, height: 100,
        points: square,
      })).toBe(true)
    })

    it('detects point outside a freeform square polygon', () => {
      const square = [
        { x: 10, y: 10 },
        { x: 90, y: 10 },
        { x: 90, y: 90 },
        { x: 10, y: 90 },
      ]
      expect(isPointInsideStencil(5, 5, {
        stencil: 'freeform',
        x: 0, y: 0, width: 100, height: 100,
        points: square,
      })).toBe(false)
    })

    it('detects point inside concave polygon (L-shape)', () => {
      // L-shaped polygon
      const lShape = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 50 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]
      // Inside the bottom-right part of the L
      expect(isPointInsideStencil(75, 75, {
        stencil: 'freeform',
        x: 0, y: 0, width: 100, height: 100,
        points: lShape,
      })).toBe(true)
      // Inside the top-left part of the L
      expect(isPointInsideStencil(25, 25, {
        stencil: 'freeform',
        x: 0, y: 0, width: 100, height: 100,
        points: lShape,
      })).toBe(true)
    })

    it('detects point outside concave polygon (in the notch)', () => {
      const lShape = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 50 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]
      // The concave notch: top-right area (75, 25) should be outside
      expect(isPointInsideStencil(75, 25, {
        stencil: 'freeform',
        x: 0, y: 0, width: 100, height: 100,
        points: lShape,
      })).toBe(false)
    })

    it('returns false for freeform with no points', () => {
      expect(isPointInsideStencil(50, 50, {
        stencil: 'freeform',
        x: 0, y: 0, width: 100, height: 100,
      })).toBe(false)
    })

    it('returns false for freeform with fewer than 3 points', () => {
      expect(isPointInsideStencil(50, 50, {
        stencil: 'freeform',
        x: 0, y: 0, width: 100, height: 100,
        points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
      })).toBe(false)
    })
  })

  it('returns false for unknown stencil type', () => {
    expect(isPointInsideStencil(50, 50, {
      stencil: 'unknown' as any,
      x: 0, y: 0, width: 100, height: 100,
    })).toBe(false)
  })
})

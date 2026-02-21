import { describe, it, expect } from 'vitest'
import {
  handlePan,
  handleZoom,
  handleCropResize,
  handleCropMove,
  handleKeyboard,
  handlePinchZoom,
} from '../engine/gestures'
import { createTransformState, createCropState } from '../engine/transform'

describe('handlePan', () => {
  it('moves image by delta', () => {
    const state = createTransformState()
    const result = handlePan(state, 10, 20)
    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
  })

  it('accumulates movement', () => {
    const state = { ...createTransformState(), x: 5, y: 5 }
    const result = handlePan(state, 10, -3)
    expect(result.x).toBe(15)
    expect(result.y).toBe(2)
  })
})

describe('handleZoom', () => {
  it('zooms in with positive delta', () => {
    const state = createTransformState()
    const result = handleZoom(state, 0.1, 0, 0)
    expect(result.scale).toBeGreaterThan(1)
  })

  it('zooms out with negative delta', () => {
    const state = createTransformState()
    const result = handleZoom(state, -0.1, 0, 0)
    expect(result.scale).toBeLessThan(1)
  })

  it('clamps scale to min', () => {
    const state = createTransformState()
    const result = handleZoom(state, -100, 0, 0)
    expect(result.scale).toBe(0.1)
  })

  it('clamps scale to max', () => {
    const state = createTransformState()
    const result = handleZoom(state, 100, 0, 0)
    expect(result.scale).toBe(10)
  })

  it('adjusts position when zooming around a point', () => {
    const state = createTransformState()
    const result = handleZoom(state, 1, 100, 100)
    // Position should shift toward the zoom center
    expect(result.x).not.toBe(0)
    expect(result.y).not.toBe(0)
  })
})

describe('handleCropResize', () => {
  it('resizes from SE corner', () => {
    const crop = { ...createCropState({ width: 800, height: 800 }), x: 100, y: 100, width: 200, height: 200 }
    const result = handleCropResize(crop, 'se', 10, 20, { width: 800, height: 800 })
    expect(result.width).toBe(210)
    expect(result.height).toBe(220)
  })

  it('resizes from NW corner', () => {
    const crop = { ...createCropState({ width: 800, height: 800 }), x: 100, y: 100, width: 200, height: 200 }
    const result = handleCropResize(crop, 'nw', -10, -10, { width: 800, height: 800 })
    expect(result.x).toBe(90)
    expect(result.y).toBe(90)
    expect(result.width).toBe(210)
    expect(result.height).toBe(210)
  })

  it('enforces minimum crop size', () => {
    const crop = createCropState({ width: 400, height: 400 })
    const result = handleCropResize(crop, 'se', -9999, -9999, { width: 400, height: 400 })
    expect(result.width).toBeGreaterThanOrEqual(32)
    expect(result.height).toBeGreaterThanOrEqual(32)
  })

  it('clamps width when resize exceeds right bound (line 183)', () => {
    const crop = { ...createCropState({ width: 400, height: 400 }), x: 300, y: 100, width: 80, height: 80 }
    // Expand SE so that x + width = 300 + 130 = 430 > 400
    const result = handleCropResize(crop, 'se', 50, 0, { width: 400, height: 400 })
    expect(result.width).toBe(100) // 400 - 300 = 100
    expect(result.x).toBe(300)
  })

  it('clamps height when resize exceeds bottom bound (line 184)', () => {
    const crop = { ...createCropState({ width: 400, height: 400 }), x: 100, y: 300, width: 80, height: 80 }
    // Expand SE so that y + height = 300 + 130 = 430 > 400
    const result = handleCropResize(crop, 'se', 0, 50, { width: 400, height: 400 })
    expect(result.height).toBe(100) // 400 - 300 = 100
    expect(result.y).toBe(300)
  })

  it('enforces minimum width and adjusts x for w handle (line 170)', () => {
    // Shrink from west so width goes below MIN_CROP_SIZE
    const crop = { ...createCropState({ width: 800, height: 800 }), x: 100, y: 100, width: 50, height: 200 }
    const result = handleCropResize(crop, 'w', 40, 0, { width: 800, height: 800 })
    // width = 50 - 40 = 10, which is < 32 (MIN_CROP_SIZE)
    expect(result.width).toBe(32)
    // x should be adjusted: crop.x + crop.width - MIN_CROP_SIZE = 100 + 50 - 32 = 118
    expect(result.x).toBe(118)
  })

  it('enforces minimum width and adjusts x for sw handle (line 170)', () => {
    const crop = { ...createCropState({ width: 800, height: 800 }), x: 100, y: 100, width: 50, height: 200 }
    const result = handleCropResize(crop, 'sw', 40, 0, { width: 800, height: 800 })
    expect(result.width).toBe(32)
    expect(result.x).toBe(118)
  })

  it('enforces minimum width and adjusts x for nw handle (line 170)', () => {
    const crop = { ...createCropState({ width: 800, height: 800 }), x: 100, y: 100, width: 50, height: 200 }
    const result = handleCropResize(crop, 'nw', 40, 0, { width: 800, height: 800 })
    expect(result.width).toBe(32)
    expect(result.x).toBe(118)
  })

  it('enforces minimum height and adjusts y for north handles (line 176)', () => {
    // Shrink from top so height goes below MIN_CROP_SIZE - covers line 175-176
    const crop = { ...createCropState({ width: 800, height: 800 }), x: 100, y: 100, width: 200, height: 50 }
    const result = handleCropResize(crop, 'n', 0, 40, { width: 800, height: 800 })
    // height would be 50 - 40 = 10, which is < MIN_CROP_SIZE (32)
    expect(result.height).toBe(32)
    // y should be adjusted: crop.y + crop.height - MIN_CROP_SIZE = 100 + 50 - 32 = 118
    expect(result.y).toBe(118)
  })

  it('enforces minimum height and adjusts y for ne handle', () => {
    const crop = { ...createCropState({ width: 800, height: 800 }), x: 100, y: 100, width: 200, height: 40 }
    const result = handleCropResize(crop, 'ne', 10, 30, { width: 800, height: 800 })
    // height = 40 - 30 = 10 < 32
    expect(result.height).toBe(32)
    expect(result.y).toBe(100 + 40 - 32)
  })

  it('enforces minimum height and adjusts y for nw handle', () => {
    const crop = { ...createCropState({ width: 800, height: 800 }), x: 100, y: 100, width: 200, height: 40 }
    const result = handleCropResize(crop, 'nw', 0, 30, { width: 800, height: 800 })
    expect(result.height).toBe(32)
    expect(result.y).toBe(100 + 40 - 32)
  })
})

describe('handleCropResize circle stencil', () => {
  it('only allows ne handle for circle', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 100, y: 100, width: 200, height: 200,
      stencil: 'circle' as const,
    }
    // Non-ne handle should return the crop unchanged
    const resultSW = handleCropResize(crop, 'sw', 10, 10, { width: 800, height: 800 })
    expect(resultSW).toEqual(crop)

    const resultSE = handleCropResize(crop, 'se', 10, 10, { width: 800, height: 800 })
    expect(resultSE).toEqual(crop)
  })

  it('resizes circle from ne handle maintaining 1:1', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 100, y: 100, width: 200, height: 200,
      stencil: 'circle' as const,
    }
    const result = handleCropResize(crop, 'ne', 20, -20, { width: 800, height: 800 })
    expect(result.width).toBe(result.height)
    expect(result.width).toBe(220)
  })

  it('enforces minimum size for circle', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 100, y: 100, width: 50, height: 50,
      stencil: 'circle' as const,
    }
    // Make delta large enough to shrink below MIN_CROP_SIZE
    const result = handleCropResize(crop, 'ne', -40, 40, { width: 800, height: 800 })
    expect(result.width).toBe(32)
    expect(result.height).toBe(32)
  })

  it('clamps circle when width exceeds right bound (line 68-73)', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 700, y: 100, width: 80, height: 80,
      stencil: 'circle' as const,
    }
    // dx=50 makes width=130, but x+width = 700+130 = 830 > 800
    const result = handleCropResize(crop, 'ne', 50, -50, { width: 800, height: 800 })
    expect(result.x + result.width).toBeLessThanOrEqual(800)
    expect(result.width).toBe(result.height)
  })

  it('clamps circle when y goes negative after width-bound clamp (line 74-79)', () => {
    // Scenario: after the x+width > bounds.width clamp recalculates y,
    // the new y = anchorBottom - height becomes negative.
    // x=10, y=5, w=80, h=80, bounds=400x400
    // anchorBottom = 85, big expand => width/height grow large
    // After width-bounds clamp: maxSize = 400-10 = 390, y = 85-390 = -305 < 0
    // Then y < 0 branch: maxSize = anchorBottom = 85, w=h=85, y=0
    const crop = {
      ...createCropState({ width: 400, height: 400 }),
      x: 10, y: 5, width: 80, height: 80,
      stencil: 'circle' as const,
    }
    const result = handleCropResize(crop, 'ne', 400, -400, { width: 400, height: 400 })
    expect(result.y).toBe(0)
    expect(result.width).toBe(result.height)
    // maxSize should be anchorBottom = 85
    expect(result.width).toBe(85)
  })

  it('clamps circle when y+height exceeds bottom bound (line 80-84)', () => {
    const crop = {
      ...createCropState({ width: 800, height: 400 }),
      x: 100, y: 350, width: 80, height: 80,
      stencil: 'circle' as const,
    }
    // After expanding, y stays at 350 (no negative clamp), but y+height could exceed bounds
    // anchorBottom = 350 + 80 = 430, delta = 40, newHeight = 120, newY = 430-120 = 310
    // 310+120=430 > 400, so this triggers line 80-84
    const result = handleCropResize(crop, 'ne', 40, -40, { width: 800, height: 400 })
    expect(result.y + result.height).toBeLessThanOrEqual(400)
    expect(result.width).toBe(result.height)
  })
})

describe('handleCropMove', () => {
  it('moves crop by delta', () => {
    const crop = { ...createCropState({ width: 800, height: 800 }), x: 100, y: 100, width: 200, height: 200 }
    const result = handleCropMove(crop, 10, 20, { width: 800, height: 800 })
    expect(result.x).toBe(110)
    expect(result.y).toBe(120)
  })

  it('clamps to left/top bounds', () => {
    const crop = { ...createCropState({ width: 800, height: 800 }), x: 5, y: 5, width: 200, height: 200 }
    const result = handleCropMove(crop, -50, -50, { width: 800, height: 800 })
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
  })

  it('clamps to right/bottom bounds', () => {
    const crop = { ...createCropState({ width: 800, height: 800 }), x: 590, y: 590, width: 200, height: 200 }
    const result = handleCropMove(crop, 50, 50, { width: 800, height: 800 })
    expect(result.x).toBe(600)
    expect(result.y).toBe(600)
  })

  it('preserves crop dimensions', () => {
    const crop = { ...createCropState({ width: 800, height: 800 }), x: 100, y: 100, width: 200, height: 150 }
    const result = handleCropMove(crop, 30, 40, { width: 800, height: 800 })
    expect(result.width).toBe(200)
    expect(result.height).toBe(150)
  })

  it('clamps both x and y simultaneously to bounds', () => {
    const crop = { ...createCropState({ width: 400, height: 400 }), x: 350, y: 350, width: 100, height: 100 }
    const result = handleCropMove(crop, 100, 100, { width: 400, height: 400 })
    // x clamped to 400-100 = 300, y clamped to 400-100 = 300
    expect(result.x).toBe(300)
    expect(result.y).toBe(300)
  })
})

describe('handleKeyboard', () => {
  it('pans with arrow keys', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, 'ArrowRight', false)
    expect(result.x).toBe(1)
  })

  it('pans faster with shift', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, 'ArrowRight', true)
    expect(result.x).toBe(10)
  })

  it('pans left with ArrowLeft', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, 'ArrowLeft', false)
    expect(result.x).toBe(-1)
  })

  it('pans up with ArrowUp (line 243)', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, 'ArrowUp', false)
    expect(result.y).toBe(-1)
  })

  it('pans up faster with shift + ArrowUp', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, 'ArrowUp', true)
    expect(result.y).toBe(-10)
  })

  it('pans down with ArrowDown (line 245)', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, 'ArrowDown', false)
    expect(result.y).toBe(1)
  })

  it('pans down faster with shift + ArrowDown', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, 'ArrowDown', true)
    expect(result.y).toBe(10)
  })

  it('zooms with + key', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, '+', false)
    expect(result.scale).toBeGreaterThan(1)
  })

  it('zooms in with = key (line 247)', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, '=', false)
    expect(result.scale).toBeGreaterThan(1)
    expect(result.scale).toBeCloseTo(1.05, 5)
  })

  it('zooms with - key', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, '-', false)
    expect(result.scale).toBeLessThan(1)
  })

  it('zooms out with _ key', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, '_', false)
    expect(result.scale).toBeLessThan(1)
    expect(result.scale).toBeCloseTo(0.95, 5)
  })

  it('returns same state for unhandled key', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, 'a', false)
    expect(result).toEqual(transform)
  })
})

describe('handlePinchZoom', () => {
  it('zooms in when fingers spread apart', () => {
    const state = createTransformState()
    const result = handlePinchZoom(state, 1.2, 100, 100, 0, 0)
    expect(result.scale).toBeGreaterThan(1)
  })

  it('zooms out when fingers pinch together', () => {
    const state = createTransformState()
    const result = handlePinchZoom(state, 0.8, 100, 100, 0, 0)
    expect(result.scale).toBeLessThan(1)
  })

  it('pans simultaneously with zoom', () => {
    const state = createTransformState()
    const result = handlePinchZoom(state, 1.0, 100, 100, 10, 20)
    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
  })

  it('clamps scale within bounds', () => {
    const state = createTransformState()
    const result = handlePinchZoom(state, 100, 0, 0, 0, 0)
    expect(result.scale).toBeLessThanOrEqual(10)
  })

  it('centers zoom on pinch center point', () => {
    const state = createTransformState()
    const result = handlePinchZoom(state, 1.5, 200, 150, 0, 0)
    expect(result.x).not.toBe(0)
    expect(result.y).not.toBe(0)
  })
})

describe('handleCropResize with aspect ratio', () => {
  it('enforces aspect ratio when resizing from east handle', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 100, y: 100, width: 200, height: 100,
      aspectRatio: 2,
    }
    const result = handleCropResize(crop, 'e', 50, 0, { width: 800, height: 800 })
    expect(result.width).toBe(250)
    expect(result.height).toBe(125)
  })

  it('enforces aspect ratio when resizing from south handle', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 100, y: 100, width: 200, height: 100,
      aspectRatio: 2,
    }
    const result = handleCropResize(crop, 's', 0, 50, { width: 800, height: 800 })
    expect(result.height).toBe(150)
    expect(result.width).toBe(300)
  })

  it('enforces aspect ratio when resizing from north handle', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 100, y: 200, width: 200, height: 100,
      aspectRatio: 2,
    }
    const result = handleCropResize(crop, 'n', 0, -50, { width: 800, height: 800 })
    expect(result.height).toBe(150)
    expect(result.width).toBe(300)
    expect(result.y).toBe(150)
  })

  it('enforces aspect ratio when resizing from west handle', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 200, y: 100, width: 200, height: 100,
      aspectRatio: 2,
    }
    const result = handleCropResize(crop, 'w', -50, 0, { width: 800, height: 800 })
    expect(result.width).toBe(250)
    expect(result.height).toBe(125)
    expect(result.x).toBe(150)
  })

  it('enforces aspect ratio for SE corner handle', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 100, y: 100, width: 200, height: 200,
      aspectRatio: 1,
    }
    const result = handleCropResize(crop, 'se', 50, 30, { width: 800, height: 800 })
    expect(result.width).toBe(result.height)
  })

  it('enforces aspect ratio for NE corner handle and adjusts y anchor', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 100, y: 200, width: 200, height: 200,
      aspectRatio: 1,
    }
    const result = handleCropResize(crop, 'ne', 50, -30, { width: 800, height: 800 })
    // Should anchor from the bottom
    expect(result.y + result.height).toBeCloseTo(crop.y + crop.height, 0)
    expect(result.width).toBe(result.height)
  })

  it('enforces aspect ratio for NW corner handle and adjusts anchors', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 200, y: 200, width: 200, height: 200,
      aspectRatio: 1,
    }
    const result = handleCropResize(crop, 'nw', -50, -30, { width: 800, height: 800 })
    // Should anchor from bottom-right
    expect(result.x + result.width).toBeCloseTo(crop.x + crop.width, 0)
    expect(result.y + result.height).toBeCloseTo(crop.y + crop.height, 0)
  })

  it('enforces aspect ratio for SW corner handle and adjusts x anchor', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 200, y: 100, width: 200, height: 200,
      aspectRatio: 1,
    }
    const result = handleCropResize(crop, 'sw', -50, 30, { width: 800, height: 800 })
    // Should anchor from the right
    expect(result.x + result.width).toBeCloseTo(crop.x + crop.width, 0)
  })

  it('uses targetHeight when targetHeight <= height for corner handles (line 142)', () => {
    // targetHeight = width / ratio. Need targetHeight <= height.
    // With ratio=2, width=250, height=250: targetHeight=125 <= 250, so height=125
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 100, y: 100, width: 200, height: 200,
      aspectRatio: 2,
    }
    const result = handleCropResize(crop, 'se', 50, 50, { width: 800, height: 800 })
    // width=250, height=250, targetHeight=250/2=125 <= 250, so height=125
    expect(result.width).toBe(250)
    expect(result.height).toBe(125)
    expect(result.width / result.height).toBeCloseTo(2, 1)
  })

  it('uses height to compute width when targetHeight > height for corner handles (line 144)', () => {
    // This triggers the `else` branch at line 144: width = height * ratio
    // We need a case where width / ratio > height, i.e. targetHeight > height
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 100, y: 100, width: 200, height: 100,
      aspectRatio: 0.5, // ratio = 0.5, so width should be half of height
    }
    // After SE resize: width=250, height=110, targetHeight = 250/0.5 = 500 > 110
    // So width = 110 * 0.5 = 55
    const result = handleCropResize(crop, 'se', 50, 10, { width: 800, height: 800 })
    expect(result.width / result.height).toBeCloseTo(0.5, 1)
  })
})

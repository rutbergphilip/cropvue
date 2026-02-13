import { describe, it, expect } from 'vitest'
import {
  handlePan,
  handleZoom,
  handleCropResize,
  handleCropMove,
  handleKeyboard,
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

  it('zooms with + key', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, '+', false)
    expect(result.scale).toBeGreaterThan(1)
  })

  it('zooms with - key', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, '-', false)
    expect(result.scale).toBeLessThan(1)
  })

  it('returns same state for unhandled key', () => {
    const transform = createTransformState()
    const result = handleKeyboard(transform, 'a', false)
    expect(result).toEqual(transform)
  })
})

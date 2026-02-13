import { describe, it, expect } from 'vitest'
import {
  createTransformState,
  createCropState,
  applyRotation,
  applyFlip,
  applyZoom,
  applyPan,
  clampTransform,
  resetTransform,
  SNAP_THRESHOLD_DEGREES,
  snapRotation,
} from '../engine/transform'

describe('createTransformState', () => {
  it('returns default state', () => {
    const state = createTransformState()
    expect(state).toEqual({
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      flipX: false,
      flipY: false,
    })
  })

  it('accepts partial overrides', () => {
    const state = createTransformState({ scale: 2, rotation: 90 })
    expect(state.scale).toBe(2)
    expect(state.rotation).toBe(90)
    expect(state.x).toBe(0)
  })
})

describe('createCropState', () => {
  it('returns default state', () => {
    const state = createCropState({ width: 100, height: 100 })
    expect(state.stencil).toBe('rectangle')
    expect(state.width).toBe(100)
  })
})

describe('applyRotation', () => {
  it('rotates left by 90 degrees', () => {
    const state = createTransformState()
    const result = applyRotation(state, -90)
    expect(result.rotation).toBe(-90)
  })

  it('rotates right by 90 degrees', () => {
    const state = createTransformState()
    const result = applyRotation(state, 90)
    expect(result.rotation).toBe(90)
  })

  it('wraps around at 360', () => {
    const state = createTransformState({ rotation: 350 })
    const result = applyRotation(state, 20)
    expect(result.rotation).toBe(10)
  })

  it('wraps around at -360', () => {
    const state = createTransformState({ rotation: -350 })
    const result = applyRotation(state, -20)
    expect(result.rotation).toBe(-10)
  })
})

describe('snapRotation', () => {
  it('snaps to 0 within threshold', () => {
    expect(snapRotation(2)).toBe(0)
    expect(snapRotation(-2)).toBe(0)
  })

  it('snaps to 90 within threshold', () => {
    expect(snapRotation(88)).toBe(90)
    expect(snapRotation(92)).toBe(90)
  })

  it('snaps to 180 within threshold', () => {
    expect(snapRotation(178)).toBe(180)
  })

  it('snaps to 270 within threshold', () => {
    expect(snapRotation(271)).toBe(270)
  })

  it('does not snap outside threshold', () => {
    expect(snapRotation(45)).toBe(45)
    expect(snapRotation(135)).toBe(135)
  })
})

describe('applyFlip', () => {
  it('toggles flipX', () => {
    const state = createTransformState()
    const result = applyFlip(state, 'x')
    expect(result.flipX).toBe(true)
    expect(result.flipY).toBe(false)
  })

  it('toggles flipY', () => {
    const state = createTransformState()
    const result = applyFlip(state, 'y')
    expect(result.flipY).toBe(true)
  })

  it('double flip returns to original', () => {
    const state = createTransformState()
    const flipped = applyFlip(state, 'x')
    const unflipped = applyFlip(flipped, 'x')
    expect(unflipped.flipX).toBe(false)
  })
})

describe('applyZoom', () => {
  it('zooms in', () => {
    const state = createTransformState()
    const result = applyZoom(state, 0.5)
    expect(result.scale).toBe(1.5)
  })

  it('zooms out', () => {
    const state = createTransformState({ scale: 2 })
    const result = applyZoom(state, -0.5)
    expect(result.scale).toBe(1.5)
  })

  it('clamps to minimum scale of 0.1', () => {
    const state = createTransformState({ scale: 0.2 })
    const result = applyZoom(state, -0.5)
    expect(result.scale).toBe(0.1)
  })

  it('clamps to maximum scale of 10', () => {
    const state = createTransformState({ scale: 9.8 })
    const result = applyZoom(state, 0.5)
    expect(result.scale).toBe(10)
  })
})

describe('applyPan', () => {
  it('pans by delta', () => {
    const state = createTransformState()
    const result = applyPan(state, 10, -5)
    expect(result.x).toBe(10)
    expect(result.y).toBe(-5)
  })

  it('accumulates pans', () => {
    const state = createTransformState({ x: 5, y: 5 })
    const result = applyPan(state, 10, 10)
    expect(result.x).toBe(15)
    expect(result.y).toBe(15)
  })
})

describe('resetTransform', () => {
  it('resets to default', () => {
    const state = createTransformState({ x: 50, y: 50, scale: 3, rotation: 45, flipX: true, flipY: true })
    const result = resetTransform(state)
    expect(result).toEqual(createTransformState())
  })
})

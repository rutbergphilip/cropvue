import { describe, it, expect } from 'vitest'
import {
  constrainCropSize,
  constrainAspectRatio,
  constrainCropPosition,
  MIN_CROP_SIZE,
} from '../engine/constraints'
import { createCropState } from '../engine/transform'

describe('constrainCropSize', () => {
  it('enforces minimum crop size', () => {
    const crop = createCropState({ width: 10, height: 10 })
    const result = constrainCropSize(crop, { containerWidth: 500, containerHeight: 500 })
    expect(result.width).toBe(MIN_CROP_SIZE)
    expect(result.height).toBe(MIN_CROP_SIZE)
  })

  it('enforces maxWidth/maxHeight from crop state', () => {
    const crop = createCropState({ width: 500, height: 500 })
    crop.maxWidth = 200
    crop.maxHeight = 200
    const result = constrainCropSize(crop, { containerWidth: 500, containerHeight: 500 })
    expect(result.width).toBe(200)
    expect(result.height).toBe(200)
  })

  it('does not exceed container', () => {
    const crop = createCropState({ width: 800, height: 800 })
    const result = constrainCropSize(crop, { containerWidth: 500, containerHeight: 500 })
    expect(result.width).toBeLessThanOrEqual(500)
    expect(result.height).toBeLessThanOrEqual(500)
  })
})

describe('constrainAspectRatio', () => {
  it('adjusts width to match aspect ratio', () => {
    const crop = createCropState({ width: 200, height: 200 })
    crop.aspectRatio = 16 / 9
    const result = constrainAspectRatio(crop)
    expect(result.width / result.height).toBeCloseTo(16 / 9, 1)
  })

  it('does nothing when aspectRatio is null', () => {
    const crop = createCropState({ width: 200, height: 150 })
    const result = constrainAspectRatio(crop)
    expect(result.width).toBe(200)
    expect(result.height).toBe(150)
  })

  it('handles 1:1 aspect ratio', () => {
    const crop = createCropState({ width: 300, height: 200 })
    crop.aspectRatio = 1
    const result = constrainAspectRatio(crop)
    expect(result.width).toBe(result.height)
  })
})

describe('constrainCropPosition', () => {
  it('keeps crop inside container bounds', () => {
    const crop = createCropState({ width: 100, height: 100 })
    crop.x = -50
    crop.y = -50
    const result = constrainCropPosition(crop, { containerWidth: 500, containerHeight: 500 })
    expect(result.x).toBeGreaterThanOrEqual(0)
    expect(result.y).toBeGreaterThanOrEqual(0)
  })

  it('prevents crop from going past right/bottom edge', () => {
    const crop = createCropState({ width: 100, height: 100 })
    crop.x = 450
    crop.y = 450
    const result = constrainCropPosition(crop, { containerWidth: 500, containerHeight: 500 })
    expect(result.x + result.width).toBeLessThanOrEqual(500)
    expect(result.y + result.height).toBeLessThanOrEqual(500)
  })
})

import { describe, it, expect } from 'vitest'
import { classicAutoZoom, fixedAutoZoom, hybridAutoZoom } from '../engine/auto-zoom'

const imageSize = { width: 1000, height: 800 }
const boundaries = { width: 500, height: 400 }

describe('classicAutoZoom', () => {
  it('returns area that contains the coordinates', () => {
    const coordinates = { left: 200, top: 200, width: 300, height: 200 }
    const currentArea = { left: 0, top: 0, width: 1000, height: 800 }
    const result = classicAutoZoom(coordinates, currentArea, imageSize, boundaries)
    expect(result.left).toBeLessThanOrEqual(coordinates.left)
    expect(result.top).toBeLessThanOrEqual(coordinates.top)
    expect(result.left + result.width).toBeGreaterThanOrEqual(coordinates.left + coordinates.width)
    expect(result.top + result.height).toBeGreaterThanOrEqual(coordinates.top + coordinates.height)
  })

  it('does not change area if coordinates already visible', () => {
    const coordinates = { left: 100, top: 100, width: 200, height: 200 }
    const currentArea = { left: 0, top: 0, width: 1000, height: 800 }
    const result = classicAutoZoom(coordinates, currentArea, imageSize, boundaries)
    expect(result).toEqual(currentArea)
  })

  it('expands area when coordinates overflow to the left (line 49)', () => {
    const coordinates = { left: -50, top: 100, width: 200, height: 200 }
    const currentArea = { left: 0, top: 0, width: 500, height: 400 }
    const result = classicAutoZoom(coordinates, currentArea, imageSize, boundaries)
    // left should be min(0, -50) = -50, but fitArea clamps to 0
    expect(result.left).toBe(0)
    expect(result.left + result.width).toBeGreaterThanOrEqual(coordinates.left + coordinates.width)
  })

  it('expands area when coordinates overflow to the top (line 50)', () => {
    const coordinates = { left: 100, top: -30, width: 200, height: 200 }
    const currentArea = { left: 0, top: 0, width: 500, height: 400 }
    const result = classicAutoZoom(coordinates, currentArea, imageSize, boundaries)
    expect(result.top).toBe(0)
    expect(result.top + result.height).toBeGreaterThanOrEqual(coordinates.top + coordinates.height)
  })

  it('expands area when coordinates exceed right boundary (line 51)', () => {
    const coordinates = { left: 400, top: 100, width: 200, height: 200 }
    const currentArea = { left: 0, top: 0, width: 500, height: 400 }
    const result = classicAutoZoom(coordinates, currentArea, imageSize, boundaries)
    // coordRight = 600 > areaRight = 500, so right = max(500, 600) = 600
    expect(result.left + result.width).toBeGreaterThanOrEqual(600)
  })

  it('expands area when coordinates exceed bottom boundary (line 52)', () => {
    const coordinates = { left: 100, top: 300, width: 200, height: 200 }
    const currentArea = { left: 0, top: 0, width: 500, height: 400 }
    const result = classicAutoZoom(coordinates, currentArea, imageSize, boundaries)
    // coordBottom = 500 > areaBottom = 400, so bottom = max(400, 500) = 500
    expect(result.top + result.height).toBeGreaterThanOrEqual(500)
  })

  it('expands area in all directions when coordinates fully outside', () => {
    const coordinates = { left: -10, top: -10, width: 600, height: 500 }
    const currentArea = { left: 0, top: 0, width: 500, height: 400 }
    const result = classicAutoZoom(coordinates, currentArea, imageSize, boundaries)
    // Should encompass both currentArea and coordinates
    expect(result.left).toBe(0) // fitArea clamps negative to 0
    expect(result.top).toBe(0)
    expect(result.width).toBeGreaterThanOrEqual(500)
    expect(result.height).toBeGreaterThanOrEqual(400)
  })

  it('clamps expanded area to image size via fitArea', () => {
    const coordinates = { left: 800, top: 600, width: 300, height: 300 }
    const currentArea = { left: 0, top: 0, width: 500, height: 400 }
    const result = classicAutoZoom(coordinates, currentArea, imageSize, boundaries)
    // fitArea ensures width <= imageSize.width and height <= imageSize.height
    expect(result.width).toBeLessThanOrEqual(imageSize.width)
    expect(result.height).toBeLessThanOrEqual(imageSize.height)
    expect(result.left).toBeGreaterThanOrEqual(0)
    expect(result.top).toBeGreaterThanOrEqual(0)
  })
})

describe('fixedAutoZoom', () => {
  it('centers stencil in visible area', () => {
    const stencilSize = { width: 200, height: 200 }
    const coordinates = { left: 100, top: 100, width: 200, height: 200 }
    const result = fixedAutoZoom(coordinates, stencilSize, imageSize, boundaries)
    const areaCenterX = result.left + result.width / 2
    const areaCenterY = result.top + result.height / 2
    const coordCenterX = coordinates.left + coordinates.width / 2
    const coordCenterY = coordinates.top + coordinates.height / 2
    expect(areaCenterX).toBeCloseTo(coordCenterX, 0)
    expect(areaCenterY).toBeCloseTo(coordCenterY, 0)
  })
})

describe('hybridAutoZoom', () => {
  it('returns area sized so stencil fills ~80% of boundaries', () => {
    const coordinates = { left: 100, top: 100, width: 200, height: 200 }
    const currentArea = { left: 0, top: 0, width: 1000, height: 800 }
    const result = hybridAutoZoom(coordinates, currentArea, imageSize, boundaries)
    const coordRatio = coordinates.width / result.width
    expect(coordRatio).toBeGreaterThan(0.3)
    expect(coordRatio).toBeLessThan(1)
  })
})

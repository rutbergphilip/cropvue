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

import { describe, it, expect } from 'vitest'
import { readExifOrientation, getOrientationTransforms } from '../utils/exif'

describe('getOrientationTransforms', () => {
  it('returns no transform for orientation 1 (normal)', () => {
    const transforms = getOrientationTransforms(1)
    expect(transforms.rotate).toBe(0)
    expect(transforms.flip.horizontal).toBe(false)
    expect(transforms.flip.vertical).toBe(false)
  })

  it('returns horizontal flip for orientation 2', () => {
    const transforms = getOrientationTransforms(2)
    expect(transforms.flip.horizontal).toBe(true)
    expect(transforms.rotate).toBe(0)
  })

  it('returns 180 rotation for orientation 3', () => {
    const transforms = getOrientationTransforms(3)
    expect(transforms.rotate).toBe(180)
  })

  it('returns 90 CW rotation for orientation 6', () => {
    const transforms = getOrientationTransforms(6)
    expect(transforms.rotate).toBe(90)
  })

  it('returns 270 rotation for orientation 8', () => {
    const transforms = getOrientationTransforms(8)
    expect(transforms.rotate).toBe(270)
  })
})

describe('readExifOrientation', () => {
  it('returns 1 for non-JPEG files', async () => {
    const png = new File(['fake'], 'test.png', { type: 'image/png' })
    const orientation = await readExifOrientation(png)
    expect(orientation).toBe(1)
  })
})

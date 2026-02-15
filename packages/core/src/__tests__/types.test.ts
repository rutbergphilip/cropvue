import { describe, it, expectTypeOf } from 'vitest'
import type {
  CropperMode,
  ImageRestriction,
  HandlersConfig,
  MoveImageConfig,
  ResizeImageConfig,
  VisibleArea,
  StencilSize,
  ImageTransforms,
} from '../types'

describe('new types compile', () => {
  it('CropperMode accepts valid values', () => {
    expectTypeOf<CropperMode>().toEqualTypeOf<'classic' | 'static' | 'hybrid'>()
  })

  it('ImageRestriction accepts valid values', () => {
    expectTypeOf<ImageRestriction>().toEqualTypeOf<'fill-area' | 'fit-area' | 'stencil' | 'none'>()
  })

  it('HandlersConfig has all 8 positions', () => {
    const config: HandlersConfig = { nw: true, n: false, ne: true, e: false, se: true, s: false, sw: true, w: false }
    expectTypeOf(config).toMatchTypeOf<HandlersConfig>()
  })

  it('VisibleArea has correct shape', () => {
    const area: VisibleArea = { left: 0, top: 0, width: 100, height: 100 }
    expectTypeOf(area).toMatchTypeOf<VisibleArea>()
  })

  it('MoveImageConfig supports boolean and object forms', () => {
    expectTypeOf<true>().toMatchTypeOf<MoveImageConfig>()
    expectTypeOf<{ mouse: true; touch: false }>().toMatchTypeOf<MoveImageConfig>()
  })

  it('ImageTransforms has rotate and flip', () => {
    const t: ImageTransforms = { rotate: 90, flip: { horizontal: false, vertical: true } }
    expectTypeOf(t).toMatchTypeOf<ImageTransforms>()
  })
})

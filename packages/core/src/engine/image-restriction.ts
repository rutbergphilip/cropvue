import type { VisibleArea, ImageRestriction } from '../types'
import { MIN_SCALE, MAX_SCALE } from './constants'

interface Size {
  width: number
  height: number
}

interface PanBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface ZoomBounds {
  minScale: number
  maxScale: number
}

export function computePanBounds(
  imageSize: Size,
  visibleArea: VisibleArea,
  restriction: ImageRestriction,
  stencil?: VisibleArea
): PanBounds {
  if (restriction === 'none') {
    return { minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity }
  }

  if (restriction === 'fill-area') {
    return {
      minX: 0,
      maxX: Math.max(0, imageSize.width - visibleArea.width),
      minY: 0,
      maxY: Math.max(0, imageSize.height - visibleArea.height),
    }
  }

  if (restriction === 'stencil' && stencil) {
    return {
      minX: stencil.left,
      maxX: Math.max(stencil.left, imageSize.width - stencil.width - stencil.left),
      minY: stencil.top,
      maxY: Math.max(stencil.top, imageSize.height - stencil.height - stencil.top),
    }
  }

  // fit-area
  const overflowX = Math.max(0, imageSize.width - visibleArea.width)
  const overflowY = Math.max(0, imageSize.height - visibleArea.height)
  return {
    minX: -overflowX * 0.5,
    maxX: overflowX * 0.5,
    minY: -overflowY * 0.5,
    maxY: overflowY * 0.5,
  }
}

export function computeZoomBounds(
  imageSize: Size,
  visibleArea: VisibleArea,
  restriction: ImageRestriction
): ZoomBounds {
  if (restriction === 'none') {
    return { minScale: MIN_SCALE, maxScale: MAX_SCALE }
  }

  if (restriction === 'fill-area') {
    const minScaleX = visibleArea.width / imageSize.width
    const minScaleY = visibleArea.height / imageSize.height
    return {
      minScale: Math.max(minScaleX, minScaleY),
      maxScale: MAX_SCALE,
    }
  }

  // fit-area and stencil
  const fitScale = Math.min(
    visibleArea.width / imageSize.width,
    visibleArea.height / imageSize.height
  )
  return {
    minScale: Math.max(MIN_SCALE, fitScale * 0.5),
    maxScale: MAX_SCALE,
  }
}

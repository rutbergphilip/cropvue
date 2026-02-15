import type { TransformState, VisibleArea } from '../types'

interface Size {
  width: number
  height: number
}

/**
 * Convert transform state (x, y, scale) to a visible area rectangle.
 * The visible area represents what portion of the image is currently displayed.
 */
export function transformToVisibleArea(
  transform: TransformState,
  imageSize: Size,
  boundaries: Size
): VisibleArea {
  const displayScale = Math.min(
    boundaries.width / imageSize.width,
    boundaries.height / imageSize.height,
    1
  )
  const effectiveScale = displayScale * transform.scale

  const width = boundaries.width / effectiveScale
  const height = boundaries.height / effectiveScale

  const centerX = imageSize.width / 2 - transform.x
  const centerY = imageSize.height / 2 - transform.y

  return {
    left: centerX - width / 2,
    top: centerY - height / 2,
    width,
    height,
  }
}

/**
 * Convert visible area back to transform state values (partial — x, y, scale only).
 */
export function visibleAreaToTransform(
  area: VisibleArea,
  imageSize: Size,
  boundaries: Size
): Partial<TransformState> {
  const displayScale = Math.min(
    boundaries.width / imageSize.width,
    boundaries.height / imageSize.height,
    1
  )

  const effectiveScale = boundaries.width / area.width / displayScale
  const centerX = area.left + area.width / 2
  const centerY = area.top + area.height / 2

  return {
    x: imageSize.width / 2 - centerX,
    y: imageSize.height / 2 - centerY,
    scale: effectiveScale,
  }
}

/**
 * Clamp visible area to stay within image bounds.
 */
export function fitVisibleArea(
  area: VisibleArea,
  imageSize: Size
): VisibleArea {
  let { left, top, width, height } = area

  width = Math.min(width, imageSize.width)
  height = Math.min(height, imageSize.height)

  left = Math.max(0, Math.min(left, imageSize.width - width))
  top = Math.max(0, Math.min(top, imageSize.height - height))

  return { left, top, width, height }
}

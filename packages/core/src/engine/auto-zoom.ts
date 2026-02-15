import type { VisibleArea } from '../types'

interface Size {
  width: number
  height: number
}

interface Coordinates {
  left: number
  top: number
  width: number
  height: number
}

const TARGET_STENCIL_RATIO = 0.8

function fitArea(area: VisibleArea, imageSize: Size): VisibleArea {
  let { left, top, width, height } = area
  width = Math.min(width, imageSize.width)
  height = Math.min(height, imageSize.height)
  left = Math.max(0, Math.min(left, imageSize.width - width))
  top = Math.max(0, Math.min(top, imageSize.height - height))
  return { left, top, width, height }
}

/**
 * Classic auto-zoom: only adjusts if coordinates are outside visible area.
 */
export function classicAutoZoom(
  coordinates: Coordinates,
  currentArea: VisibleArea,
  imageSize: Size,
  _boundaries: Size
): VisibleArea {
  const coordRight = coordinates.left + coordinates.width
  const coordBottom = coordinates.top + coordinates.height
  const areaRight = currentArea.left + currentArea.width
  const areaBottom = currentArea.top + currentArea.height

  if (
    coordinates.left >= currentArea.left &&
    coordinates.top >= currentArea.top &&
    coordRight <= areaRight &&
    coordBottom <= areaBottom
  ) {
    return currentArea
  }

  const left = Math.min(currentArea.left, coordinates.left)
  const top = Math.min(currentArea.top, coordinates.top)
  const right = Math.max(areaRight, coordRight)
  const bottom = Math.max(areaBottom, coordBottom)

  return fitArea(
    { left, top, width: right - left, height: bottom - top },
    imageSize
  )
}

/**
 * Fixed auto-zoom: for static croppers. Scales visible area so the stencil
 * exactly frames the crop coordinates.
 */
export function fixedAutoZoom(
  coordinates: Coordinates,
  stencilSize: Size,
  imageSize: Size,
  boundaries: Size
): VisibleArea {
  const scaleX = boundaries.width / stencilSize.width
  const scaleY = boundaries.height / stencilSize.height
  const scale = Math.min(scaleX, scaleY)

  const areaWidth = coordinates.width * scale
  const areaHeight = coordinates.height * scale

  const centerX = coordinates.left + coordinates.width / 2
  const centerY = coordinates.top + coordinates.height / 2

  return fitArea(
    { left: centerX - areaWidth / 2, top: centerY - areaHeight / 2, width: areaWidth, height: areaHeight },
    imageSize
  )
}

/**
 * Hybrid auto-zoom: calculates optimal stencil size (~80% of boundaries),
 * scales visible area to fit coordinates into that target.
 */
export function hybridAutoZoom(
  coordinates: Coordinates,
  currentArea: VisibleArea,
  imageSize: Size,
  boundaries: Size
): VisibleArea {
  const targetWidth = boundaries.width * TARGET_STENCIL_RATIO
  const targetHeight = boundaries.height * TARGET_STENCIL_RATIO
  const scaleX = targetWidth / coordinates.width
  const scaleY = targetHeight / coordinates.height
  const scale = Math.min(scaleX, scaleY)

  const areaWidth = boundaries.width / scale
  const areaHeight = boundaries.height / scale

  const centerX = coordinates.left + coordinates.width / 2
  const centerY = coordinates.top + coordinates.height / 2

  return fitArea(
    { left: centerX - areaWidth / 2, top: centerY - areaHeight / 2, width: areaWidth, height: areaHeight },
    imageSize
  )
}

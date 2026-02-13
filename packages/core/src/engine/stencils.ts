import type { CropState, Point } from '../types'

interface ContainerDimensions {
  containerWidth: number
  containerHeight: number
}

export function getRectangleClipPath(
  rect: { x: number; y: number; width: number; height: number },
  container: ContainerDimensions
): string {
  const top = rect.y
  const right = container.containerWidth - (rect.x + rect.width)
  const bottom = container.containerHeight - (rect.y + rect.height)
  const left = rect.x
  return `inset(${top}px ${right}px ${bottom}px ${left}px)`
}

export function getCircleClipPath(
  rect: { x: number; y: number; width: number; height: number },
  _container: ContainerDimensions
): string {
  const radius = Math.min(rect.width, rect.height) / 2
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  return `circle(${radius}px at ${cx}px ${cy}px)`
}

export function getFreeformClipPath(points: Point[]): string {
  if (points.length < 3) return ''
  const coords = points.map((p) => `${p.x}px ${p.y}px`).join(', ')
  return `polygon(${coords})`
}

export function isPointInsideStencil(
  px: number,
  py: number,
  crop: Pick<CropState, 'stencil' | 'x' | 'y' | 'width' | 'height' | 'points'>
): boolean {
  if (crop.stencil === 'rectangle') {
    return (
      px >= crop.x &&
      px <= crop.x + crop.width &&
      py >= crop.y &&
      py <= crop.y + crop.height
    )
  }

  if (crop.stencil === 'circle') {
    const cx = crop.x + crop.width / 2
    const cy = crop.y + crop.height / 2
    const r = Math.min(crop.width, crop.height) / 2
    const dx = px - cx
    const dy = py - cy
    return dx * dx + dy * dy <= r * r
  }

  if (crop.stencil === 'freeform' && crop.points && crop.points.length >= 3) {
    return isPointInsidePolygon(px, py, crop.points)
  }

  return false
}

function isPointInsidePolygon(px: number, py: number, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

import type { TransformState, CropState } from '../types'
import { MIN_SCALE, MAX_SCALE, MIN_CROP_SIZE } from './constants'

export function handlePan(
  state: TransformState,
  dx: number,
  dy: number
): TransformState {
  return {
    ...state,
    x: state.x + dx,
    y: state.y + dy,
  }
}

export function handleZoom(
  state: TransformState,
  delta: number,
  centerX: number,
  centerY: number
): TransformState {
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, state.scale + delta))
  const ratio = newScale / state.scale

  const newX = centerX - (centerX - state.x) * ratio
  const newY = centerY - (centerY - state.y) * ratio

  return {
    ...state,
    scale: newScale,
    x: newX,
    y: newY,
  }
}

export type HandlePosition = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'

export function handleCropResize(
  crop: CropState,
  handle: HandlePosition,
  dx: number,
  dy: number,
  bounds: { width: number; height: number }
): CropState {
  let { x, y, width, height } = crop

  // Circle: only NE handle, 1:1 constraint, anchor at bottom-left
  if (crop.stencil === 'circle') {
    if (handle !== 'ne') return crop

    // Average dx and -dy to get uniform delta
    const delta = (dx + (-dy)) / 2
    const anchorBottom = y + height
    width += delta
    height += delta
    y = anchorBottom - height

    // Enforce minimum
    if (width < MIN_CROP_SIZE) {
      width = MIN_CROP_SIZE
      height = MIN_CROP_SIZE
      y = anchorBottom - MIN_CROP_SIZE
    }

    // Enforce bounds
    x = Math.max(0, x)
    y = Math.max(0, y)
    if (x + width > bounds.width) {
      const maxSize = bounds.width - x
      width = maxSize
      height = maxSize
      y = anchorBottom - height
    }
    if (y < 0) {
      const maxSize = anchorBottom
      width = maxSize
      height = maxSize
      y = 0
    }
    if (y + height > bounds.height) {
      const maxSize = bounds.height - y
      width = maxSize
      height = maxSize
    }

    return { ...crop, x, y, width, height }
  }

  switch (handle) {
    case 'se':
      width += dx
      height += dy
      break
    case 'nw':
      x += dx
      y += dy
      width -= dx
      height -= dy
      break
    case 'ne':
      y += dy
      width += dx
      height -= dy
      break
    case 'sw':
      x += dx
      width -= dx
      height += dy
      break
    case 'n':
      y += dy
      height -= dy
      break
    case 's':
      height += dy
      break
    case 'e':
      width += dx
      break
    case 'w':
      x += dx
      width -= dx
      break
  }

  // Enforce aspect ratio when set (non-circle stencils only, circle handled above)
  if (crop.aspectRatio && crop.stencil !== 'circle') {
    const ratio = crop.aspectRatio

    if (handle === 'e' || handle === 'w') {
      // East/West edge: adjust height to maintain ratio
      const newHeight = width / ratio
      if (handle === 'w') {
        // Right edge stays fixed, so no y adjustment needed beyond centering
      }
      height = newHeight
    } else if (handle === 'n' || handle === 's') {
      // North/South edge: adjust width to maintain ratio
      const newWidth = height * ratio
      if (handle === 'n' || handle === 's') {
        // Center the width change
        const widthDiff = newWidth - width
        x -= widthDiff / 2
      }
      width = newWidth
    } else {
      // Corner handles (nw, ne, sw, se): constrain both dimensions
      const targetHeight = width / ratio
      if (targetHeight <= height) {
        height = targetHeight
      } else {
        width = height * ratio
      }
    }

    // Fix anchor points after aspect ratio adjustment
    if (handle === 'n') {
      // Bottom edge should stay fixed
      const anchorBottom = crop.y + crop.height
      y = anchorBottom - height
    } else if (handle === 'w') {
      // Right edge should stay fixed
      const anchorRight = crop.x + crop.width
      x = anchorRight - width
    } else if (handle === 'nw') {
      // Bottom-right corner stays fixed
      const anchorBottom = crop.y + crop.height
      const anchorRight = crop.x + crop.width
      x = anchorRight - width
      y = anchorBottom - height
    } else if (handle === 'ne') {
      // Bottom-left corner stays fixed
      const anchorBottom = crop.y + crop.height
      y = anchorBottom - height
    } else if (handle === 'sw') {
      // Top-right corner stays fixed
      const anchorRight = crop.x + crop.width
      x = anchorRight - width
    }
    // 'se', 's', 'e' - top-left corner stays fixed (x, y don't need adjustment)
  }

  if (width < MIN_CROP_SIZE) {
    if (handle === 'nw' || handle === 'sw' || handle === 'w') {
      x = crop.x + crop.width - MIN_CROP_SIZE
    }
    width = MIN_CROP_SIZE
  }
  if (height < MIN_CROP_SIZE) {
    if (handle === 'nw' || handle === 'ne' || handle === 'n') {
      y = crop.y + crop.height - MIN_CROP_SIZE
    }
    height = MIN_CROP_SIZE
  }

  x = Math.max(0, x)
  y = Math.max(0, y)
  if (x + width > bounds.width) width = bounds.width - x
  if (y + height > bounds.height) height = bounds.height - y

  return { ...crop, x, y, width, height }
}

export function handleCropMove(
  crop: CropState,
  dx: number,
  dy: number,
  bounds: { width: number; height: number }
): CropState {
  let x = crop.x + dx
  let y = crop.y + dy

  x = Math.max(0, Math.min(x, bounds.width - crop.width))
  y = Math.max(0, Math.min(y, bounds.height - crop.height))

  return { ...crop, x, y }
}

const STEP = 1
const SHIFT_STEP = 10
const ZOOM_STEP = 0.05

export function handlePinchZoom(
  state: TransformState,
  factor: number,
  centerX: number,
  centerY: number,
  panDx: number,
  panDy: number
): TransformState {
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, state.scale * factor))
  const ratio = newScale / state.scale

  const newX = centerX - (centerX - state.x) * ratio + panDx
  const newY = centerY - (centerY - state.y) * ratio + panDy

  return {
    ...state,
    scale: newScale,
    x: newX,
    y: newY,
  }
}

export function handleKeyboard(
  state: TransformState,
  key: string,
  shiftKey: boolean
): TransformState {
  const step = shiftKey ? SHIFT_STEP : STEP

  switch (key) {
    case 'ArrowLeft':
      return { ...state, x: state.x - step }
    case 'ArrowRight':
      return { ...state, x: state.x + step }
    case 'ArrowUp':
      return { ...state, y: state.y - step }
    case 'ArrowDown':
      return { ...state, y: state.y + step }
    case '+':
    case '=':
      return {
        ...state,
        scale: Math.min(MAX_SCALE, state.scale + ZOOM_STEP),
      }
    case '-':
    case '_':
      return {
        ...state,
        scale: Math.max(MIN_SCALE, state.scale - ZOOM_STEP),
      }
    default:
      return state
  }
}

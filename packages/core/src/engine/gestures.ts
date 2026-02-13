import type { TransformState, CropState } from '../types'

const MIN_SCALE = 0.1
const MAX_SCALE = 10
const MIN_CROP = 32

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

  if (width < MIN_CROP) {
    if (handle === 'nw' || handle === 'sw' || handle === 'w') {
      x = crop.x + crop.width - MIN_CROP
    }
    width = MIN_CROP
  }
  if (height < MIN_CROP) {
    if (handle === 'nw' || handle === 'ne' || handle === 'n') {
      y = crop.y + crop.height - MIN_CROP
    }
    height = MIN_CROP
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

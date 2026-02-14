import type { TransformState, CropState, StencilType } from '../types'

export const MIN_SCALE = 0.1
export const MAX_SCALE = 10
export const SNAP_THRESHOLD_DEGREES = 3

export function createTransformState(
  overrides: Partial<TransformState> = {}
): TransformState {
  return {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
    ...overrides,
  }
}

export function createCropState(
  dimensions: { width: number; height: number },
  overrides: Partial<CropState> = {}
): CropState {
  const state: CropState = {
    x: 0,
    y: 0,
    width: dimensions.width,
    height: dimensions.height,
    stencil: 'rectangle' as StencilType,
    ...overrides,
  }

  // Circle stencil always requires 1:1 aspect ratio
  if (state.stencil === 'circle') {
    state.aspectRatio = 1
    // Make initial crop square using smallest dimension
    const size = Math.min(state.width, state.height)
    if (state.width !== state.height) {
      state.x = state.x + (state.width - size) / 2
      state.y = state.y + (state.height - size) / 2
      state.width = size
      state.height = size
    }
  }

  return state
}

function normalizeAngle(degrees: number): number {
  let result = degrees % 360
  if (result > 180) result -= 360
  if (result < -180) result += 360
  return result
}

export function snapRotation(degrees: number): number {
  const snaps = [0, 90, 180, 270, 360]
  const normalized = ((degrees % 360) + 360) % 360
  for (const snap of snaps) {
    if (Math.abs(normalized - snap) <= SNAP_THRESHOLD_DEGREES) {
      return snap === 360 ? 0 : snap
    }
  }
  return degrees
}

export function applyRotation(
  state: TransformState,
  degrees: number
): TransformState {
  const raw = state.rotation + degrees
  const rotation = normalizeAngle(raw)
  return { ...state, rotation }
}

export function applyFlip(
  state: TransformState,
  axis: 'x' | 'y'
): TransformState {
  if (axis === 'x') {
    return { ...state, flipX: !state.flipX }
  }
  return { ...state, flipY: !state.flipY }
}

export function applyZoom(
  state: TransformState,
  delta: number
): TransformState {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, state.scale + delta))
  return { ...state, scale: Math.round(scale * 1000) / 1000 }
}

export function applyPan(
  state: TransformState,
  dx: number,
  dy: number
): TransformState {
  return { ...state, x: state.x + dx, y: state.y + dy }
}

export function clampTransform(
  state: TransformState,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): TransformState {
  return {
    ...state,
    x: Math.min(bounds.maxX, Math.max(bounds.minX, state.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, state.y)),
  }
}

export function resetTransform(_state: TransformState): TransformState {
  return createTransformState()
}

import type { CropState } from '../types'

export const MIN_CROP_SIZE = 32

interface ContainerBounds {
  containerWidth: number
  containerHeight: number
}

export function constrainCropSize(
  crop: CropState,
  bounds: ContainerBounds
): CropState {
  let { width, height } = crop
  const minW = crop.minWidth ?? MIN_CROP_SIZE
  const minH = crop.minHeight ?? MIN_CROP_SIZE
  const maxW = Math.min(crop.maxWidth ?? Infinity, bounds.containerWidth)
  const maxH = Math.min(crop.maxHeight ?? Infinity, bounds.containerHeight)

  width = Math.max(minW, Math.min(maxW, width))
  height = Math.max(minH, Math.min(maxH, height))

  return { ...crop, width, height }
}

export function constrainAspectRatio(crop: CropState): CropState {
  if (!crop.aspectRatio) return crop

  const ratio = crop.aspectRatio
  let { width, height } = crop

  // Adjust height to match aspect ratio, keeping width as reference
  const targetHeight = width / ratio
  if (targetHeight <= height) {
    height = Math.round(targetHeight)
  } else {
    width = Math.round(height * ratio)
  }

  return { ...crop, width, height }
}

export function constrainCropPosition(
  crop: CropState,
  bounds: ContainerBounds
): CropState {
  let { x, y } = crop

  x = Math.max(0, Math.min(bounds.containerWidth - crop.width, x))
  y = Math.max(0, Math.min(bounds.containerHeight - crop.height, y))

  return { ...crop, x, y }
}

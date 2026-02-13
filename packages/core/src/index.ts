// Composables
export { useCropper } from './composables/useCropper'
export { useDropzone, validateFile } from './composables/useDropzone'
export { useImageQueue, createQueue } from './composables/useImageQueue'
export { useUploader, createUploadHandler } from './composables/useUploader'
export { useCompressor, chooseOutputFormat, compressBlob } from './composables/useCompressor'

// Engine (for advanced usage)
export {
  createTransformState,
  createCropState,
  applyRotation,
  applyFlip,
  applyZoom,
  applyPan,
  clampTransform,
  resetTransform,
  snapRotation,
} from './engine/transform'
export { renderCrop, exportCrop } from './engine/canvas-renderer'
export { constrainCropSize, constrainAspectRatio, constrainCropPosition } from './engine/constraints'
export {
  handlePan,
  handleZoom,
  handleCropResize,
  handleKeyboard,
} from './engine/gestures'
export type { HandlePosition } from './engine/gestures'
export {
  getRectangleClipPath,
  getCircleClipPath,
  getFreeformClipPath,
  isPointInsideStencil,
} from './engine/stencils'

// Utils
export { getMaxCanvasSize, downsampleDimensions } from './utils/canvas-limits'
export { detectMimeType, supportsWebP, getMimeForFormat, hasTransparency } from './utils/format-detect'
export { loadImageFromFile, loadImageFromUrl, needsDownsample, getSafeDimensions } from './utils/image-loader'

// Types
export type * from './types'

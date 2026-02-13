import { ref, type Ref } from 'vue'
import type {
  TransformState,
  CropState,
  CropResult,
  CropperOptions,
  StencilType,
  ImageData as CropImageData,
} from '../types'
import {
  createTransformState,
  createCropState,
  applyRotation,
  applyFlip,
  applyZoom,
  resetTransform,
} from '../engine/transform'
import { renderCrop } from '../engine/canvas-renderer'
import { compressBlob } from './useCompressor'
import { loadImageFromFile, loadImageFromUrl } from '../utils/image-loader'
import { detectMimeType } from '../utils/format-detect'

export function useCropper(options: CropperOptions = {}) {
  const transform: Ref<TransformState> = ref(createTransformState())
  const crop: Ref<CropState> = ref(
    createCropState({ width: 0, height: 0 }, {
      stencil: options.stencil ?? 'rectangle',
      aspectRatio: options.aspectRatio ?? undefined,
      minWidth: options.minWidth,
      minHeight: options.minHeight,
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
    })
  )
  const image: Ref<CropImageData | null> = ref(null)
  const isReady = ref(false)
  const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)

  // --- Image loading ---

  async function loadFile(file: File) {
    image.value = await loadImageFromFile(file)
    isReady.value = true
  }

  async function loadUrl(url: string) {
    image.value = await loadImageFromUrl(url)
    isReady.value = true
  }

  // --- Transform operations ---

  function rotateLeft() {
    transform.value = applyRotation(transform.value, -90)
  }

  function rotateRight() {
    transform.value = applyRotation(transform.value, 90)
  }

  function rotateTo(degrees: number) {
    transform.value = { ...transform.value, rotation: degrees }
  }

  function flipX() {
    transform.value = applyFlip(transform.value, 'x')
  }

  function flipY() {
    transform.value = applyFlip(transform.value, 'y')
  }

  function zoomTo(scale: number) {
    transform.value = { ...transform.value, scale: Math.max(0.1, Math.min(10, scale)) }
  }

  function zoomBy(delta: number) {
    transform.value = applyZoom(transform.value, delta)
  }

  function panTo(x: number, y: number) {
    transform.value = { ...transform.value, x, y }
  }

  function reset() {
    transform.value = resetTransform(transform.value)
  }

  // --- Crop operations ---

  function setCropArea(area: Partial<CropState>) {
    crop.value = { ...crop.value, ...area }
  }

  function setStencil(stencil: StencilType) {
    crop.value = { ...crop.value, stencil }
  }

  function setAspectRatio(ratio: number | null) {
    crop.value = { ...crop.value, aspectRatio: ratio ?? undefined }
  }

  // --- Output ---

  async function getResult(opts?: {
    format?: 'auto' | 'webp' | 'jpeg' | 'png'
    quality?: number
    maxWidth?: number
    maxHeight?: number
  }): Promise<CropResult> {
    const canvas = canvasRef.value ?? document.createElement('canvas')
    const img = image.value

    if (!img) throw new Error('No image loaded')

    renderCrop(canvas, img.element, crop.value, transform.value, {
      maxWidth: opts?.maxWidth ?? options.outputMaxWidth,
      maxHeight: opts?.maxHeight ?? options.outputMaxHeight,
    })

    const inputMime = img.originalFile ? detectMimeType(img.originalFile) : 'image/jpeg'
    const blob = await compressBlob(canvas, {
      format: opts?.format ?? options.outputFormat ?? 'auto',
      quality: opts?.quality ?? options.outputQuality ?? 0.85,
      inputMime,
      maxInputSize: img.originalSize,
    })

    const url = URL.createObjectURL(blob)
    const file = new File([blob], `cropped.${blob.type.split('/')[1] ?? 'jpg'}`, {
      type: blob.type,
    })

    return {
      blob,
      file,
      url,
      coords: {
        x: crop.value.x,
        y: crop.value.y,
        width: crop.value.width,
        height: crop.value.height,
        rotation: transform.value.rotation,
        flipX: transform.value.flipX,
        flipY: transform.value.flipY,
        scale: transform.value.scale,
      },
      width: canvas.width,
      height: canvas.height,
      originalWidth: img.naturalWidth,
      originalHeight: img.naturalHeight,
    }
  }

  function getPreviewUrl(): string {
    const canvas = canvasRef.value
    if (!canvas) return ''
    return canvas.toDataURL()
  }

  function renderToCanvas() {
    const canvas = canvasRef.value
    if (!canvas || !image.value) return
    renderCrop(canvas, image.value.element, crop.value, transform.value, {
      maxWidth: options.outputMaxWidth,
      maxHeight: options.outputMaxHeight,
    })
  }

  return {
    // State
    image,
    transform,
    crop,
    isReady,

    // Image loading
    loadFile,
    loadUrl,

    // Manipulation
    rotateLeft,
    rotateRight,
    rotateTo,
    flipX,
    flipY,
    zoomTo,
    zoomBy,
    panTo,
    reset,

    // Crop area
    setCropArea,
    setStencil,
    setAspectRatio,

    // Output
    getResult,
    getPreviewUrl,

    // Canvas
    canvasRef,
    renderToCanvas,
  }
}

import { ref, type Ref } from 'vue'
import type {
  TransformState,
  CropState,
  CropResult,
  CropperOptions,
  StencilType,
  ImageData as CropImageData,
  ImageTransforms,
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
import { readExifOrientation, getOrientationTransforms } from '../utils/exif'

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

  const isTransitioning = ref(false)
  let transitionTimeout: ReturnType<typeof setTimeout> | null = null

  function startTransition() {
    if (options.transitions === false) return
    isTransitioning.value = true
    if (transitionTimeout) clearTimeout(transitionTimeout)
    transitionTimeout = setTimeout(() => {
      isTransitioning.value = false
    }, 350)
  }

  function initCropForImage(img: CropImageData) {
    const stencil = crop.value.stencil ?? options.stencil ?? 'rectangle'
    const aspectRatio = stencil === 'circle' ? 1 : (crop.value.aspectRatio ?? options.aspectRatio)
    crop.value = createCropState(
      { width: img.naturalWidth, height: img.naturalHeight },
      {
        stencil,
        aspectRatio,
        minWidth: options.minWidth,
        minHeight: options.minHeight,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
      }
    )
    transform.value = createTransformState()
  }

  async function loadFile(file: File) {
    let exifTransforms: ImageTransforms | null = null
    if (options.checkOrientation !== false) {
      const orientation = await readExifOrientation(file)
      if (orientation !== 1) {
        exifTransforms = getOrientationTransforms(orientation)
      }
    }
    image.value = await loadImageFromFile(file)
    initCropForImage(image.value)
    if (exifTransforms) {
      // Store EXIF transforms for canvas rendering correction
      // Modern browsers handle display, but canvas needs manual correction
      transform.value = {
        ...transform.value,
        rotation: exifTransforms.rotate,
        flipX: exifTransforms.flip.horizontal,
        flipY: exifTransforms.flip.vertical,
      }
    }
    isReady.value = true
  }

  async function loadUrl(url: string) {
    image.value = await loadImageFromUrl(url)
    initCropForImage(image.value)
    isReady.value = true
  }

  function rotateLeft() {
    startTransition()
    transform.value = applyRotation(transform.value, -90)
  }

  function rotateRight() {
    startTransition()
    transform.value = applyRotation(transform.value, 90)
  }

  function rotateTo(degrees: number) {
    transform.value = { ...transform.value, rotation: degrees }
  }

  function flipX() {
    startTransition()
    transform.value = applyFlip(transform.value, 'x')
  }

  function flipY() {
    startTransition()
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

  function setCoordinates(coords: { left?: number; top?: number; width?: number; height?: number }) {
    startTransition()
    crop.value = {
      ...crop.value,
      x: coords.left ?? crop.value.x,
      y: coords.top ?? crop.value.y,
      width: coords.width ?? crop.value.width,
      height: coords.height ?? crop.value.height,
    }
  }

  function move(dx: number, dy: number) {
    startTransition()
    transform.value = { ...transform.value, x: transform.value.x + dx, y: transform.value.y + dy }
  }

  function zoom(factor: number, center?: { left: number; top: number }) {
    startTransition()
    const cx = center?.left ?? 0
    const cy = center?.top ?? 0
    const newScale = Math.max(0.1, Math.min(10, transform.value.scale * factor))
    const ratio = newScale / transform.value.scale
    transform.value = {
      ...transform.value,
      scale: newScale,
      x: cx - (cx - transform.value.x) * ratio,
      y: cy - (cy - transform.value.y) * ratio,
    }
  }

  function setCropArea(area: Partial<CropState>) {
    crop.value = { ...crop.value, ...area }
  }

  function setStencil(stencil: StencilType) {
    const prev = crop.value
    if (stencil === 'circle') {
      // Enforce 1:1 aspect ratio and square crop area
      const size = Math.min(prev.width, prev.height)
      const x = prev.x + (prev.width - size) / 2
      const y = prev.y + (prev.height - size) / 2
      crop.value = { ...prev, stencil, aspectRatio: 1, x, y, width: size, height: size }
    } else {
      // Clear auto-set ratio when switching away from circle (only if it was 1)
      const aspectRatio = prev.aspectRatio === 1 && prev.stencil === 'circle'
        ? undefined
        : prev.aspectRatio
      crop.value = { ...prev, stencil, aspectRatio }
    }
  }

  function setAspectRatio(ratio: number | null) {
    crop.value = { ...crop.value, aspectRatio: ratio ?? undefined }
  }

  let lastResultUrl: string | null = null

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

    if (lastResultUrl) {
      URL.revokeObjectURL(lastResultUrl)
    }

    const url = URL.createObjectURL(blob)
    lastResultUrl = url
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
    image,
    transform,
    crop,
    isReady,
    isTransitioning,
    loadFile,
    loadUrl,
    rotateLeft,
    rotateRight,
    rotateTo,
    flipX,
    flipY,
    zoomTo,
    zoomBy,
    panTo,
    reset,
    setCoordinates,
    move,
    zoom,
    setCropArea,
    setStencil,
    setAspectRatio,
    getResult,
    getPreviewUrl,
    canvasRef,
    renderToCanvas,
  }
}

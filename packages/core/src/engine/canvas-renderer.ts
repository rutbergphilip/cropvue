import type { TransformState, CropState } from '../types'

export interface RenderOptions {
  maxWidth?: number
  maxHeight?: number
}

export interface ExportOptions {
  format: string
  quality: number
}

export function renderCrop(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  crop: CropState,
  transform: TransformState,
  options: RenderOptions = {}
): void {
  let outWidth = crop.width
  let outHeight = crop.height

  if (options.maxWidth || options.maxHeight) {
    const maxW = options.maxWidth ?? Infinity
    const maxH = options.maxHeight ?? Infinity
    const ratio = Math.min(maxW / outWidth, maxH / outHeight, 1)
    outWidth = Math.round(outWidth * ratio)
    outHeight = Math.round(outHeight * ratio)
  }

  canvas.width = outWidth
  canvas.height = outHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, outWidth, outHeight)

  if (crop.stencil === 'circle') {
    ctx.beginPath()
    ctx.arc(outWidth / 2, outHeight / 2, Math.min(outWidth, outHeight) / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
  }

  if (crop.stencil === 'freeform' && crop.points && crop.points.length >= 3) {
    const scaleX = outWidth / crop.width
    const scaleY = outHeight / crop.height
    ctx.beginPath()
    ctx.moveTo(
      (crop.points[0].x - crop.x) * scaleX,
      (crop.points[0].y - crop.y) * scaleY
    )
    for (let i = 1; i < crop.points.length; i++) {
      ctx.lineTo(
        (crop.points[i].x - crop.x) * scaleX,
        (crop.points[i].y - crop.y) * scaleY
      )
    }
    ctx.closePath()
    ctx.clip()
  }

  const scaleX = outWidth / crop.width
  const scaleY = outHeight / crop.height
  const imgW = image.naturalWidth
  const imgH = image.naturalHeight

  ctx.save()

  // 1. Map canvas output pixels → crop region in image space
  ctx.scale(scaleX, scaleY)
  ctx.translate(-crop.x, -crop.y)

  // 2. Move origin to image center (matches CSS transform-origin: center center)
  ctx.translate(imgW / 2, imgH / 2)

  // 3. Apply transforms in SAME order as CSS: translate → scale → rotate
  ctx.translate(transform.x, transform.y)
  ctx.scale(
    transform.flipX ? -transform.scale : transform.scale,
    transform.flipY ? -transform.scale : transform.scale
  )
  ctx.rotate((transform.rotation * Math.PI) / 180)

  // 4. Move back from center, draw image at its natural position
  ctx.translate(-imgW / 2, -imgH / 2)
  ctx.drawImage(image, 0, 0)

  ctx.restore()
}

export function exportCrop(
  canvas: HTMLCanvasElement,
  options: ExportOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Canvas export failed: toBlob returned null'))
        }
      },
      options.format,
      options.quality
    )
  })
}

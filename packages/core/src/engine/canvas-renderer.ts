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

  ctx.save()
  ctx.translate(outWidth / 2, outHeight / 2)
  ctx.rotate((transform.rotation * Math.PI) / 180)
  ctx.scale(transform.flipX ? -1 : 1, transform.flipY ? -1 : 1)

  const imgDrawWidth = image.naturalWidth * transform.scale * scaleX
  const imgDrawHeight = image.naturalHeight * transform.scale * scaleY

  // Compensate for crop center offset from image center
  const cropOffsetX = (crop.x + crop.width / 2 - image.naturalWidth / 2) * scaleX
  const cropOffsetY = (crop.y + crop.height / 2 - image.naturalHeight / 2) * scaleY

  const drawX = transform.x * scaleX - cropOffsetX - imgDrawWidth / 2
  const drawY = transform.y * scaleY - cropOffsetY - imgDrawHeight / 2

  ctx.drawImage(
    image,
    drawX,
    drawY,
    imgDrawWidth,
    imgDrawHeight
  )

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

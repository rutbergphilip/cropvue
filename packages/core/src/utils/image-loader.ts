import type { ImageData as CropImageData } from '../types'
import { getMaxCanvasSize, downsampleDimensions } from './canvas-limits'

export function loadImageFromFile(file: File): Promise<CropImageData> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      resolve({
        element: img,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        originalFile: file,
        originalSize: file.size,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Failed to load image: ${file.name}`))
    }

    img.src = url
  })
}

export async function loadImageFromUrl(url: string): Promise<CropImageData> {
  // Fetch as blob to ensure the editor and canvas renderer reference the same image data
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${url} (${response.status})`)
  }
  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      resolve({
        element: img,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        originalSize: blob.size,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      reject(new Error(`Failed to load image: ${url}`))
    }

    img.src = blobUrl
  })
}

export function needsDownsample(width: number, height: number): boolean {
  const maxSize = getMaxCanvasSize()
  return width > maxSize || height > maxSize
}

export function getSafeDimensions(
  width: number,
  height: number
): { width: number; height: number } {
  const maxSize = getMaxCanvasSize()
  return downsampleDimensions(width, height, maxSize)
}

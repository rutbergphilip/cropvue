let cachedMaxSize: number | null = null

export function getMaxCanvasSize(): number {
  if (cachedMaxSize !== null) return cachedMaxSize

  if (typeof document === 'undefined') {
    return 4096
  }

  // Binary search for max canvas dimension
  const canvas = document.createElement('canvas')
  let low = 1024
  let high = 16384

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2)
    canvas.width = mid
    canvas.height = 1
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillRect(0, 0, 1, 1)
      const pixel = ctx.getImageData(0, 0, 1, 1).data
      if (pixel[3] > 0) {
        low = mid
      } else {
        high = mid - 1
      }
    } else {
      high = mid - 1
    }
  }

  cachedMaxSize = low
  canvas.width = 0
  canvas.height = 0
  return cachedMaxSize
}

export function downsampleDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }

  const ratio = Math.min(maxDimension / width, maxDimension / height)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

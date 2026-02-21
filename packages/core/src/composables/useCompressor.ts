import { ref } from 'vue'
import type { OutputFormat, CompressorOptions } from '../types'
import { getMimeForFormat, hasTransparency, detectMimeType } from '../utils/format-detect'
import { exportCrop } from '../engine/canvas-renderer'

export function chooseOutputFormat(
  format: OutputFormat,
  inputMime: string
): string {
  if (format === 'auto' && hasTransparency(inputMime)) {
    return inputMime
  }

  return getMimeForFormat(format)
}

export async function compressBlob(
  canvas: HTMLCanvasElement,
  options: {
    format: OutputFormat
    quality: number
    inputMime: string
    maxInputSize?: number
  }
): Promise<Blob> {
  const outputMime = chooseOutputFormat(options.format, options.inputMime)
  let quality = options.quality

  let blob = await exportCrop(canvas, { format: outputMime, quality })

  if (options.maxInputSize && blob.size > options.maxInputSize && outputMime !== 'image/png') {
    const maxAttempts = 3
    for (let i = 0; i < maxAttempts && blob.size > options.maxInputSize; i++) {
      quality = Math.max(0.1, quality - 0.15)
      blob = await exportCrop(canvas, { format: outputMime, quality })
    }
  }

  return blob
}

export function useCompressor(options: CompressorOptions = {}) {
  const isCompressing = ref(false)

  async function compress(
    canvas: HTMLCanvasElement,
    inputFile?: File
  ): Promise<Blob> {
    isCompressing.value = true
    try {
      const inputMime = inputFile ? detectMimeType(inputFile) : 'image/jpeg'
      return await compressBlob(canvas, {
        format: options.format ?? 'auto',
        quality: options.quality ?? 0.85,
        inputMime,
        maxInputSize: inputFile?.size,
      })
    } finally {
      isCompressing.value = false
    }
  }

  return { compress, isCompressing }
}

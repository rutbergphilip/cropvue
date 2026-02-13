import type { OutputFormat } from '../types'

const EXTENSION_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  avif: 'image/avif',
}

export function detectMimeType(file: File): string {
  if (file.type && file.type.startsWith('image/')) {
    return file.type
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_MAP[ext] ?? 'image/jpeg'
}

let webpSupported: boolean | null = null

export function supportsWebP(): boolean {
  if (webpSupported !== null) return webpSupported

  if (typeof document === 'undefined') {
    webpSupported = false
    return false
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp')
  canvas.width = 0
  canvas.height = 0
  return webpSupported
}

export function getMimeForFormat(format: OutputFormat): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'auto':
      return supportsWebP() ? 'image/webp' : 'image/jpeg'
  }
}

export function hasTransparency(mime: string): boolean {
  return mime === 'image/png' || mime === 'image/webp' || mime === 'image/avif'
}

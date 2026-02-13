// === State Types ===

export interface TransformState {
  x: number
  y: number
  scale: number
  rotation: number
  flipX: boolean
  flipY: boolean
}

export interface CropState {
  x: number
  y: number
  width: number
  height: number
  stencil: StencilType
  points?: Point[]
  aspectRatio?: number | null
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

export type StencilType = 'rectangle' | 'circle' | 'freeform'

export interface Point {
  x: number
  y: number
}

// === Image Types ===

export interface ImageData {
  element: HTMLImageElement
  naturalWidth: number
  naturalHeight: number
  originalFile?: File
  originalSize?: number
}

// === Result Types ===

export interface CropResult {
  blob: Blob
  file: File
  url: string
  coords: CropCoordinates
  width: number
  height: number
  originalWidth: number
  originalHeight: number
}

export interface CropCoordinates {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  flipX: boolean
  flipY: boolean
  scale: number
}

// === Upload Types ===

export interface UploadResult {
  url?: string
  [key: string]: unknown
}

export type UploadFn = (
  file: File,
  options: { onProgress: (percent: number) => void; signal: AbortSignal }
) => Promise<UploadResult>

// === Queue Types ===

export interface QueueItem {
  id: string
  file: File
  thumbnail: string
  result?: CropResult
  status: 'pending' | 'cropping' | 'done'
}

// === Error Types ===

export type CropVueError =
  | { type: 'file-too-large'; maxSize: number; actualSize: number }
  | { type: 'invalid-type'; accepted: string[]; actual: string }
  | { type: 'load-failed'; message: string }
  | { type: 'canvas-limit'; maxDimension: number }
  | { type: 'upload-failed'; message: string }
  | { type: 'compress-failed'; message: string }

// === Options Types ===

export type OutputFormat = 'auto' | 'webp' | 'jpeg' | 'png'

export interface CropperOptions {
  stencil?: StencilType
  aspectRatio?: number | null
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  outputFormat?: OutputFormat
  outputQuality?: number
  outputMaxWidth?: number
  outputMaxHeight?: number
}

export interface DropzoneOptions {
  accept?: string[]
  maxSize?: number
  multiple?: boolean
  onFiles?: (files: File[]) => void
  onError?: (error: CropVueError) => void
}

export interface UploaderOptions {
  url?: string
  fieldName?: string
  headers?: Record<string, string>
  handler?: UploadFn
}

export interface CompressorOptions {
  format?: OutputFormat
  quality?: number
  maxWidth?: number
  maxHeight?: number
}

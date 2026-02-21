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

export interface ImageData {
  element: HTMLImageElement
  naturalWidth: number
  naturalHeight: number
  originalFile?: File
  originalSize?: number
}

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

export interface UploadResult {
  url?: string
  [key: string]: unknown
}

export type UploadFn = (
  file: File,
  options: { onProgress: (percent: number) => void; signal: AbortSignal }
) => Promise<UploadResult>

export interface QueueItem {
  id: string
  file: File
  thumbnail: string
  result?: CropResult
  status: 'pending' | 'cropping' | 'done'
}

export type CropVueError =
  | { type: 'file-too-large'; maxSize: number; actualSize: number }
  | { type: 'invalid-type'; accepted: string[]; actual: string }
  | { type: 'load-failed'; message: string }
  | { type: 'canvas-limit'; maxDimension: number }
  | { type: 'upload-failed'; message: string }
  | { type: 'compress-failed'; message: string }

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
  mode?: CropperMode
  moveImage?: MoveImageConfig
  resizeImage?: ResizeImageConfig
  transitions?: boolean
  handlers?: HandlersConfig
  checkOrientation?: boolean
  defaultTransforms?: ImageTransforms
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

export type CropperMode = 'classic' | 'static' | 'hybrid'

export type ImageRestriction = 'fill-area' | 'fit-area' | 'stencil' | 'none'

export interface HandlersConfig {
  nw?: boolean
  n?: boolean
  ne?: boolean
  e?: boolean
  se?: boolean
  s?: boolean
  sw?: boolean
  w?: boolean
}

export type MoveImageConfig = boolean | {
  mouse?: boolean
  touch?: boolean
}

export type ResizeImageConfig = boolean | {
  touch?: boolean
  wheel?: boolean | { ratio: number }
}

export interface VisibleArea {
  left: number
  top: number
  width: number
  height: number
}

export type StencilSize =
  | { width: number; height: number }
  | ((boundaries: { width: number; height: number }) => { width: number; height: number })

export interface ImageTransforms {
  rotate: number
  flip: { horizontal: boolean; vertical: boolean }
}

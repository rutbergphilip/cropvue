# Composables

All composables are exported from `@cropvue/core` and re-exported from `cropvue`.

## useCropper

The main composable that orchestrates image loading, transforms, and crop output.

```ts
import { useCropper } from '@cropvue/core'

const cropper = useCropper({
  stencil: 'rectangle',
  aspectRatio: 16 / 9,
  outputFormat: 'webp',
  outputQuality: 0.85,
  outputMaxWidth: 1920,
})
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `stencil` | `StencilType` | `'rectangle'` | Crop shape |
| `aspectRatio` | `number \| null` | `null` | Lock aspect ratio |
| `minWidth` | `number` | `0` | Min crop width (px) |
| `minHeight` | `number` | `0` | Min crop height (px) |
| `outputFormat` | `OutputFormat` | `'auto'` | Output format |
| `outputQuality` | `number` | `0.85` | Compression quality |
| `outputMaxWidth` | `number` | `Infinity` | Max output width |
| `outputMaxHeight` | `number` | `Infinity` | Max output height |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `image` | `Ref<ImageData \| null>` | Loaded image data |
| `transform` | `Ref<TransformState>` | Current transform state |
| `crop` | `Ref<CropState>` | Current crop state |
| `isReady` | `Ref<boolean>` | Whether an image is loaded |
| `loadFile(file)` | `(File) => Promise` | Load from File object |
| `loadUrl(url)` | `(string) => Promise` | Load from URL |
| `rotateLeft()` | `() => void` | Rotate -90 degrees |
| `rotateRight()` | `() => void` | Rotate +90 degrees |
| `rotateTo(deg)` | `(number) => void` | Set rotation |
| `flipX()` | `() => void` | Toggle horizontal flip |
| `flipY()` | `() => void` | Toggle vertical flip |
| `zoomTo(scale)` | `(number) => void` | Set absolute zoom |
| `zoomBy(delta)` | `(number) => void` | Relative zoom |
| `panTo(x, y)` | `(number, number) => void` | Set position |
| `reset()` | `() => void` | Reset all transforms |
| `getResult(opts?)` | `() => Promise<CropResult>` | Get crop result |

## useDropzone

File drop/select handling with validation.

```ts
import { useDropzone } from '@cropvue/core'

const { isDragging, files, dropzoneRef, open } = useDropzone({
  accept: ['image/*'],
  maxSize: 10_000_000,
  multiple: false,
  onFiles: (files) => console.log(files),
  onError: (error) => console.error(error),
})
```

## useImageQueue

Multi-image queue management for batch cropping.

```ts
import { useImageQueue } from '@cropvue/core'

const { images, current, add, remove, select, next, previous, clear } = useImageQueue()

// Add files
add([file1, file2])

// Navigate
next()
previous()
select(0)
```

## useUploader

Upload pipeline with progress tracking and abort support.

```ts
import { useUploader } from '@cropvue/core'

const { upload, isUploading, progress, error, abort } = useUploader({
  handler: async (file, { onProgress, signal }) => {
    // Custom upload logic
    return { url: 'https://example.com/image.jpg' }
  },
})
```

## useCompressor

Smart compression with format detection.

```ts
import { useCompressor } from '@cropvue/core'

const { compress, isCompressing } = useCompressor({
  format: 'auto',
  quality: 0.85,
})

const blob = await compress(canvas, originalFile)
```

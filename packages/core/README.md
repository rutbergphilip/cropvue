# @cropvue/core

Headless composables and pure logic for image cropping. Framework-agnostic core that powers the CropVue component library.

## Installation

```sh
pnpm add @cropvue/core
```

## Composables

- **`useCropper`** - Main composable: load images, transform, crop, export
- **`useDropzone`** - File drop/select with validation
- **`useImageQueue`** - Multi-image queue management
- **`useUploader`** - Upload with progress tracking
- **`useCompressor`** - Smart compression with format detection

## Engine (Advanced)

Pure functions for direct usage:

- `transform.ts` - Pan, zoom, rotate, flip state management
- `constraints.ts` - Aspect ratio, min/max size enforcement
- `stencils.ts` - Rectangle, circle, freeform clip paths
- `canvas-renderer.ts` - Canvas rendering (preview + export)
- `gestures.ts` - Pan, zoom, resize, keyboard handlers

## Usage

```ts
import { useCropper } from '@cropvue/core'

const cropper = useCropper({ aspectRatio: 1, stencil: 'circle' })

await cropper.loadFile(file)
cropper.rotateRight()
cropper.zoomBy(0.5)

const result = await cropper.getResult({ format: 'webp', quality: 0.85 })
```

## License

MIT

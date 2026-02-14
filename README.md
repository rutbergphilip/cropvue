# CropVue

[![npm version](https://img.shields.io/npm/v/@cropvue/vue)](https://www.npmjs.com/package/@cropvue/vue)
[![CI](https://github.com/rutbergphilip/cropvue/actions/workflows/ci.yml/badge.svg)](https://github.com/rutbergphilip/cropvue/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A headless, fully customizable **Vue 3 image cropper** with built-in file upload, drag and drop, image compression, and Nuxt support. Drop it into any Vue project and get a complete image cropping pipeline out of the box, or use the composables to build your own UI from scratch.

## Why CropVue?

Most Vue image cropping libraries give you a black box. You get a crop widget and that's it. CropVue is different. Every single part of the UI is replaceable through scoped slots, so you can make it look and behave exactly the way you want. No fighting with CSS overrides or wrapper hacks.

Built for real-world use cases like **avatar croppers**, **profile picture editors**, **photo uploaders**, **thumbnail generators**, and **image processing pipelines** in Vue 3 and Nuxt applications.

## Features

- **Headless and renderless** - Replace every visual element with scoped slots. Use the defaults or bring your own UI.
- **Full image pipeline** - File select, drag and drop, crop, rotate, flip, zoom, compress, and upload. All in one library.
- **Smart compression** - Outputs WebP, JPEG, or PNG. The result is guaranteed to never be larger than the original file.
- **Vue 3 components** - Ready-to-use crop editor, dropzone, toolbar, preview, and queue components for Vue 3.
- **Nuxt module** - First-class Nuxt integration with auto-imported components and composables. SSR-safe.
- **CSS custom properties** - Theme the entire component with CSS variables. No need to override internal styles.
- **TypeScript** - Written in TypeScript with full type exports for props, events, results, and composable returns.
- **Circle, rectangle, and freeform** - Three stencil shapes with configurable aspect ratios and size constraints.
- **Touch and gesture support** - Pinch to zoom, drag to pan, and resize handles all work on mobile and desktop.
- **Image queue** - Batch crop multiple images. Great for gallery uploads and bulk image processing.
- **Lightweight** - Zero runtime dependencies. The core package is just pure composables and canvas logic.

## Packages

| Package | Description |
|---------|-------------|
| [`@cropvue/core`](./packages/core) | Headless composables and utilities for image cropping, compression, upload, and file handling |
| [`@cropvue/vue`](./packages/vue) | Vue 3 renderless components: CropVue, CropEditor, CropDropzone, CropToolbar, CropPreview, CropQueue |
| [`@cropvue/nuxt`](./packages/nuxt) | Nuxt module with auto-imports and SSR handling |

## Quick Start

### Install

```sh
# npm
npm install @cropvue/vue

# yarn
yarn add @cropvue/vue

# pnpm
pnpm add @cropvue/vue
```

### Basic Usage

The simplest way to add an image cropper to your Vue 3 app:

```vue
<script setup>
import { CropVue } from '@cropvue/vue'
import '@cropvue/vue/styles'

const handleDone = (result) => {
  console.log(result.blob, result.file, result.url)
}
</script>

<template>
  <CropVue :aspect-ratio="1" stencil="circle" @done="handleDone" />
</template>
```

That gives you a drag-and-drop zone, a crop editor with toolbar, and a result preview. All with sensible defaults.

### Avatar / Profile Picture Cropper

A common pattern for user profile picture uploads:

```vue
<script setup>
import { CropVue } from '@cropvue/vue'
import '@cropvue/vue/styles'

async function uploadAvatar(file, { onProgress, signal }) {
  const form = new FormData()
  form.append('avatar', file)
  const res = await fetch('/api/avatar', {
    method: 'POST',
    body: form,
    signal,
  })
  return res.json()
}
</script>

<template>
  <CropVue
    stencil="circle"
    :aspect-ratio="1"
    :output-max-width="512"
    :output-max-height="512"
    output-format="webp"
    :upload="uploadAvatar"
    @uploaded="(res) => console.log('Uploaded:', res)"
    @error="(err) => console.error(err)"
  />
</template>
```

### Custom UI with Scoped Slots

Every part of the component is slottable. Build your own crop interface while CropVue handles all the logic:

```vue
<template>
  <CropVue :aspect-ratio="16 / 9" stencil="rectangle">
    <template #dropzone="{ open, isDragging }">
      <div
        :class="['my-dropzone', { active: isDragging }]"
        @click="open"
      >
        Click or drag an image here
      </div>
    </template>

    <template #toolbar="{ rotateLeft, rotateRight, flipX, zoomIn, zoomOut, reset }">
      <div class="my-toolbar">
        <button @click="rotateLeft">Rotate Left</button>
        <button @click="rotateRight">Rotate Right</button>
        <button @click="flipX">Mirror</button>
        <button @click="zoomIn">Zoom In</button>
        <button @click="zoomOut">Zoom Out</button>
        <button @click="reset">Reset</button>
      </div>
    </template>

    <template #actions="{ confirm, cancel }">
      <button @click="cancel">Back</button>
      <button @click="confirm">Save Crop</button>
    </template>

    <template #done="{ result, reedit, remove }">
      <img :src="result.url" />
      <button @click="reedit">Edit Again</button>
      <button @click="remove">Delete</button>
    </template>
  </CropVue>
</template>
```

### Load Image from URL

You can pass an image URL directly instead of using the file picker:

```vue
<CropVue src="https://example.com/photo.jpg" @done="handleDone" />
```

### v-model Support

Bind the crop result with v-model for two-way data flow:

```vue
<script setup>
import { ref } from 'vue'
const cropResult = ref(null)
</script>

<template>
  <CropVue v-model="cropResult" stencil="rectangle" :aspect-ratio="4 / 3" />
  <img v-if="cropResult" :src="cropResult.url" />
</template>
```

## Composable Usage

If you want full control and don't need the built-in components, use the `useCropper` composable directly. This is the headless approach that gives you all the image manipulation primitives as reactive Vue refs and functions:

```ts
import { useCropper } from '@cropvue/core'

const cropper = useCropper({
  stencil: 'rectangle',
  aspectRatio: 16 / 9,
  outputFormat: 'webp',
  outputQuality: 0.85,
  outputMaxWidth: 1920,
})

// Load an image
await cropper.loadFile(file)
// or
await cropper.loadUrl('https://example.com/photo.jpg')

// Manipulate
cropper.rotateLeft()
cropper.rotateRight()
cropper.rotateTo(45)
cropper.flipX()
cropper.flipY()
cropper.zoomBy(0.2)
cropper.zoomTo(1.5)
cropper.panTo(100, 50)
cropper.reset()

// Change crop area
cropper.setStencil('circle')
cropper.setAspectRatio(1)
cropper.setCropArea({ x: 0, y: 0, width: 500, height: 500 })

// Get the cropped result
const result = await cropper.getResult()
// result.blob - the cropped Blob
// result.file - a File object ready for upload
// result.url  - an object URL for preview
// result.coords - exact crop coordinates
// result.width, result.height - output dimensions
```

### Other Composables

```ts
import {
  useDropzone,    // Drag-and-drop file handling with validation
  useImageQueue,  // Batch image processing queue
  useUploader,    // File upload with progress tracking
  useCompressor,  // Image compression and format conversion
} from '@cropvue/core'
```

## Components

| Component | What it does |
|-----------|-------------|
| `CropVue` | All-in-one component. Dropzone, editor, toolbar, preview, and upload in a single tag. |
| `CropEditor` | The interactive crop canvas. Handles pan, zoom, resize handles, and stencil rendering. |
| `CropDropzone` | Drag-and-drop file input with validation for accepted types and max file size. |
| `CropToolbar` | Rotate, flip, zoom, and reset controls. |
| `CropPreview` | Live preview of the current crop area. |
| `CropQueue` | Multi-image queue for batch cropping. |
| `CropStencil` | The crop overlay shape (rectangle, circle, or freeform). |

## Stencil Shapes

Three built-in crop shapes to cover the most common use cases:

- **`rectangle`** - Standard rectangular crop. Set any aspect ratio (16:9, 4:3, 1:1, free) or leave it unconstrained.
- **`circle`** - Circular crop with enforced 1:1 ratio. Perfect for avatars, profile pictures, and round thumbnails.
- **`freeform`** - Draw a custom crop path. Useful for non-rectangular selections and creative image editing.

## Output Formats

Control the output with these options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `outputFormat` | `'auto' \| 'webp' \| 'jpeg' \| 'png'` | `'auto'` | Image format. `auto` picks the best format based on the input. |
| `outputQuality` | `number` | `0.85` | Compression quality from 0 to 1. |
| `outputMaxWidth` | `number` | - | Maximum pixel width of the output. |
| `outputMaxHeight` | `number` | - | Maximum pixel height of the output. |

The compression engine is smart about file size. If the compressed result ends up bigger than the original (which can happen with already-optimized images), it returns the smaller version automatically.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `stencil` | `'rectangle' \| 'circle' \| 'freeform'` | `'rectangle'` | Shape of the crop area |
| `aspectRatio` | `number \| null` | `null` | Fixed aspect ratio (e.g. `1` for square, `16/9` for widescreen) |
| `minWidth` | `number` | `0` | Minimum crop width in pixels |
| `minHeight` | `number` | `0` | Minimum crop height in pixels |
| `maxWidth` | `number` | `Infinity` | Maximum crop width in pixels |
| `maxHeight` | `number` | `Infinity` | Maximum crop height in pixels |
| `outputFormat` | `string` | `'auto'` | Output image format |
| `outputQuality` | `number` | `0.85` | Output compression quality |
| `outputMaxWidth` | `number` | - | Max output width |
| `outputMaxHeight` | `number` | - | Max output height |
| `accept` | `string[]` | `['image/*']` | Accepted file MIME types |
| `maxFileSize` | `number` | `Infinity` | Maximum file size in bytes |
| `multiple` | `boolean` | `false` | Allow selecting multiple files |
| `upload` | `function \| null` | `null` | Custom upload handler |
| `src` | `string \| null` | `null` | Load image from URL |
| `pannable` | `boolean` | `true` | Enable panning in the editor |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `{ width, height }` | Image loaded and ready for cropping |
| `@change` | `{ x, y, width, height }` | Crop area changed |
| `@done` | `CropResult` | Crop confirmed |
| `@cancel` | - | User cancelled editing |
| `@remove` | - | User removed the image |
| `@uploaded` | `UploadResult` | Upload completed |
| `@error` | `CropVueError` | Something went wrong (file too large, invalid type, load failed, etc.) |
| `@queue-change` | `QueueItem[]` | Queue items changed (when using multiple mode) |

## Theming with CSS Variables

Style everything through CSS custom properties. No need to fight specificity or dig into internal class names:

```css
.my-cropper {
  --cropvue-max-width: 600px;

  /* Dropzone */
  --cropvue-dropzone-border-color: #e5e7eb;
  --cropvue-dropzone-border-color-active: #3b82f6;
  --cropvue-dropzone-border-radius: 12px;
  --cropvue-dropzone-bg: #fafafa;
  --cropvue-dropzone-bg-active: rgba(59, 130, 246, 0.05);

  /* Buttons */
  --cropvue-btn-padding: 8px 20px;
  --cropvue-btn-radius: 6px;
  --cropvue-btn-confirm-bg: #3b82f6;
  --cropvue-btn-confirm-hover-bg: #2563eb;

  /* Preview */
  --cropvue-preview-border-radius: 8px;
}
```

## Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@cropvue/nuxt'],
})
```

All components (`CropVue`, `CropEditor`, `CropDropzone`, etc.) and composables (`useCropper`, `useDropzone`, etc.) are auto-imported. No manual imports needed. SSR is handled out of the box.

## Browser Support

Works in all modern browsers that support the Canvas API. This covers Chrome, Firefox, Safari, and Edge. Mobile browsers are fully supported with touch gestures for pinch-to-zoom and drag-to-pan.

## Development

```sh
pnpm install          # Install dependencies
pnpm dev              # Start playground
pnpm build            # Build all packages
pnpm test:run         # Run unit tests
pnpm test:e2e         # Run E2E tests
pnpm docs:dev         # Start docs dev server
```

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

## License

MIT

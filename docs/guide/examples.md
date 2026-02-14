---
outline: [2, 3]
---

# Examples

Practical recipes showing CropVue in real-world scenarios. Each example highlights the key lines so you can scan the code quickly.

## Avatar Crop (Circle + 1:1)

The most common use case — a circular avatar picker with locked aspect ratio and WebP output.

::: tip What you get
A circle-stencil cropper that outputs a square WebP image, perfect for profile pictures.
:::

```vue
<script setup>
import { CropVue } from 'cropvue' // [!code focus:2]
import 'cropvue/styles'

const handleDone = (result) => { // [!code focus:5]
  // result.blob  → WebP Blob
  // result.file  → File object
  // result.url   → Object URL for preview
  console.log(`${result.coords.width}x${result.coords.height}`)
}
</script>

<template>
  <CropVue
    stencil="circle"
    :aspect-ratio="1"
    output-format="webp"
    :output-quality="0.9"
    :output-max-width="512"
    @done="handleDone"
  />
</template>
```

The key props: `stencil="circle"` for the round mask, `:aspect-ratio="1"` to lock a square crop, and `output-format="webp"` for modern compression.

## Cover Image (16:9 + URL Loading)

Pre-load a remote image for cropping — ideal for editing existing cover photos or banners.

::: tip What you get
A 16:9 cropper that loads an image from a URL on mount, no file picker needed.
:::

```vue
<script setup>
import { CropVue } from 'cropvue'
import 'cropvue/styles'

const coverUrl = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' // [!code highlight]

const handleDone = (result) => {
  // Upload the cropped banner
}
</script>

<template>
  <CropVue
    :src="coverUrl"
    stencil="rectangle"
    :aspect-ratio="16 / 9"
    output-format="jpeg"
    :output-quality="0.85"
    :output-max-width="1920"
    @done="handleDone"
  />
</template>
```

Pass `:src` to skip the dropzone and load an image directly. Combine with `:aspect-ratio="16 / 9"` for banner-style crops.

## Custom Dropzone

Replace the default drop area with your own design using the `#dropzone` slot.

::: tip What you get
Full control over the file-selection UI while keeping all CropVue internals.
:::

```vue
<script setup>
import { CropVue } from 'cropvue'
import 'cropvue/styles'

const handleDone = (result) => {
  console.log(result.blob)
}
</script>

<template>
  <CropVue @done="handleDone">
    <template #dropzone="{ open, isDragging }">
      <div
        :class="[
          'border-2 border-dashed rounded-xl p-12 text-center',
          'transition-colors cursor-pointer',
          isDragging
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-gray-300 hover:border-gray-400'
        ]"
        @click="open"
      >
        <p class="text-lg font-medium">
          {{ isDragging ? 'Drop it!' : 'Click or drag an image' }}
        </p>
        <p class="text-sm text-gray-500 mt-2">
          PNG, JPG, or WebP up to 10 MB
        </p>
      </div>
    </template>
  </CropVue>
</template>
```

The `#dropzone` slot provides `open()` to trigger the file picker and `isDragging` to style the active drop state.

## Custom Toolbar

Replace the built-in toolbar with your own controls via the `#toolbar` slot.

::: tip What you get
A minimal toolbar with just rotate and zoom — skip controls you don't need.
:::

::: code-group

```vue [Custom Toolbar]
<script setup>
import { CropVue } from 'cropvue'
import 'cropvue/styles'

const handleDone = (result) => {
  console.log(result.blob)
}
</script>

<template>
  <CropVue stencil="rectangle" :aspect-ratio="1" @done="handleDone">
    <template #toolbar="{ rotateLeft, rotateRight, zoomIn, zoomOut, reset }">
      <div class="flex items-center gap-2 p-2 bg-white rounded-lg shadow">
        <button @click="rotateLeft" title="Rotate left">↶</button>
        <button @click="rotateRight" title="Rotate right">↷</button>
        <div class="w-px h-6 bg-gray-200" />
        <button @click="zoomIn" title="Zoom in">+</button>
        <button @click="zoomOut" title="Zoom out">−</button>
        <div class="w-px h-6 bg-gray-200" />
        <button @click="reset" title="Reset">Reset</button>
      </div>
    </template>
  </CropVue>
</template>
```

```vue [Default Events]
<script setup>
import { CropVue } from 'cropvue'
import 'cropvue/styles'

// Without a custom toolbar, the default toolbar emits these events:
// @rotate-left, @rotate-right, @flip-x, @flip-y
// @zoom-in, @zoom-out, @reset

const handleDone = (result) => {
  console.log(result)
}
</script>

<template>
  <CropVue
    stencil="rectangle"
    :aspect-ratio="1"
    @done="handleDone"
  />
</template>
```

:::

The `#toolbar` slot exposes action functions you can wire to any button. Pick only the controls your users need.

## Headless Composable Usage

Skip `CropVue` entirely and wire everything yourself with `useCropper` + `useDropzone`.

::: tip What you get
Full manual control — build your own UI from scratch using only the composables.
:::

```vue
<script setup>
import { useCropper, useDropzone } from '@cropvue/core' // [!code focus:2]
import { CropEditor } from 'cropvue'
import 'cropvue/styles'

const cropper = useCropper({ // [!code focus:5]
  stencil: 'rectangle',
  aspectRatio: 4 / 3,
  outputFormat: 'webp',
})

const { isDragging, open } = useDropzone({ // [!code focus:4]
  accept: ['image/*'],
  maxSize: 10_000_000,
  onFiles: (files) => cropper.loadFile(files[0]),
})

async function handleConfirm() {
  const result = await cropper.getResult() // [!code focus]
  console.log(result.blob, result.coords)
}
</script>

<template>
  <div>
    <!-- Your own dropzone -->
    <div v-if="!cropper.isReady.value" @click="open">
      {{ isDragging ? 'Drop here' : 'Select image' }}
    </div>

    <!-- CropEditor handles the interactive crop area -->
    <template v-else>
      <CropEditor
        :image="cropper.image.value"
        :transform="cropper.transform.value"
        :crop="cropper.crop.value"
      />
      <div class="flex gap-2 mt-4">
        <button @click="cropper.rotateLeft()">Rotate</button>
        <button @click="cropper.reset()">Reset</button>
        <button @click="handleConfirm">Confirm</button>
      </div>
    </template>
  </div>
</template>
```

## Upload Integration

CropVue can upload the cropped image automatically via the `upload` prop or manually via the `useUploader` composable.

::: tip What you get
Two approaches: a simple prop-based upload or a composable with progress tracking.
:::

::: code-group

```vue [Upload Prop]
<script setup>
import { CropVue } from 'cropvue'
import 'cropvue/styles'

async function uploadHandler(file, { onProgress, signal }) { // [!code focus:8]
  const form = new FormData()
  form.append('image', file)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: form,
    signal, // supports abort
  })
  return res.json()
}

const handleUploaded = (result) => { // [!code highlight]
  console.log('Uploaded:', result.url)
}
</script>

<template>
  <CropVue
    stencil="circle"
    :aspect-ratio="1"
    :upload="uploadHandler"
    @uploaded="handleUploaded"
    @error="console.error"
  />
</template>
```

```vue [useUploader Composable]
<script setup>
import { useCropper, useUploader } from '@cropvue/core'

const cropper = useCropper({ stencil: 'circle', aspectRatio: 1 })

const { upload, isUploading, progress, error, abort } = useUploader({ // [!code focus:6]
  handler: async (file, { onProgress, signal }) => {
    const form = new FormData()
    form.append('image', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form, signal })
    return res.json()
  },
})

async function handleConfirm() {
  const result = await cropper.getResult()
  const uploaded = await upload(result.file) // [!code focus]
  console.log('URL:', uploaded.url)
}
</script>

<template>
  <div>
    <!-- Your crop UI here... -->

    <div v-if="isUploading" class="flex items-center gap-2">
      <progress :value="progress" max="100" />
      <span>{{ progress }}%</span>
      <button @click="abort">Cancel</button>
    </div>
  </div>
</template>
```

:::

## Theming (Dark Mode)

Override CSS variables to match your design system. CropVue exposes variables for every visual element.

::: tip What you get
Drop-in dark mode and custom brand themes using only CSS — no JavaScript changes needed.
:::

::: code-group

```css [Dark Theme]
.dark {
  --cropvue-editor-bg: #0a0a0a; /* [!code highlight] */
  --cropvue-overlay-color: rgba(0, 0, 0, 0.7); /* [!code highlight] */
  --cropvue-toolbar-bg: #1f2937; /* [!code highlight] */
  --cropvue-toolbar-border-color: #374151; /* [!code highlight] */
  --cropvue-toolbar-btn-color: #d1d5db; /* [!code highlight] */
  --cropvue-toolbar-btn-hover-bg: #374151; /* [!code highlight] */
  --cropvue-dropzone-border-color: #4b5563; /* [!code highlight] */
  --cropvue-btn-bg: #1f2937; /* [!code highlight] */
  --cropvue-btn-color: #d1d5db; /* [!code highlight] */
  --cropvue-btn-border-color: #374151; /* [!code highlight] */
}
```

```css [Purple Brand Theme]
.purple-theme {
  --cropvue-crop-border-color: #a855f7; /* [!code highlight] */
  --cropvue-handle-color: #a855f7; /* [!code highlight] */
  --cropvue-grid-color: rgba(168, 85, 247, 0.3); /* [!code highlight] */
  --cropvue-dropzone-border-color: #c084fc; /* [!code highlight] */
  --cropvue-dropzone-border-color-active: #a855f7; /* [!code highlight] */
  --cropvue-dropzone-bg-active: rgba(168, 85, 247, 0.05); /* [!code highlight] */
  --cropvue-toolbar-btn-hover-bg: #f3e8ff; /* [!code highlight] */
  --cropvue-queue-active-border: #a855f7; /* [!code highlight] */
  --cropvue-btn-confirm-bg: #a855f7; /* [!code highlight] */
  --cropvue-btn-confirm-color: #fff; /* [!code highlight] */
}
```

:::

The variables above are just a subset. See the full list in the [Theming guide](/guide/theming).

## Error Handling

CropVue emits typed errors via the `@error` event. Use the discriminated `type` field to handle each case.

::: tip What you get
Exhaustive error handling with TypeScript-friendly discriminated unions.
:::

```vue
<script setup>
import { CropVue } from 'cropvue'
import type { CropVueError } from 'cropvue' // [!code focus]
import 'cropvue/styles'

function handleError(error: CropVueError) { // [!code focus:16]
  switch (error.type) {
    case 'file-type': // [!code highlight]
      alert(`Unsupported format: ${error.file.type}`)
      break
    case 'file-size': // [!code highlight]
      alert(`File too large: ${(error.file.size / 1e6).toFixed(1)} MB`)
      break
    case 'load': // [!code highlight]
      alert('Failed to load image — is the URL correct?')
      break
    case 'upload': // [!code highlight]
      alert(`Upload failed: ${error.message}`)
      break
    default:
      console.error('Unexpected error:', error)
  }
}
</script>

<template>
  <CropVue
    stencil="circle"
    :aspect-ratio="1"
    :accept="['image/png', 'image/jpeg', 'image/webp']"
    :max-file-size="5_000_000"
    @done="handleDone"
    @error="handleError"
  />
</template>
```

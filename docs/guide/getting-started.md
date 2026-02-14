# Getting Started

## Installation

::: code-group

```sh [pnpm]
pnpm add @cropvue/vue
```

```sh [npm]
npm install @cropvue/vue
```

```sh [yarn]
yarn add @cropvue/vue
```

:::

## Basic Usage

The simplest way to use CropVue is with the `CropVue` component:

```vue
<script setup>
import { CropVue } from '@cropvue/vue'
import '@cropvue/vue/styles'

const handleDone = (result) => {
  console.log(result.blob)   // Blob
  console.log(result.file)   // File
  console.log(result.url)    // Object URL
  console.log(result.coords) // { x, y, width, height, rotation, ... }
}
</script>

<template>
  <CropVue
    :aspect-ratio="1"
    stencil="circle"
    @done="handleDone"
  />
</template>
```

This gives you a complete flow: file dropzone, crop editor, toolbar, and result output.

## Composable Usage (Headless)

For full control, use the `useCropper` composable directly:

```ts
import { useCropper } from '@cropvue/core'

const {
  image, transform, crop, isReady,
  loadFile, loadUrl,
  rotateLeft, rotateRight, flipX, flipY,
  zoomTo, zoomBy, panTo, reset,
  setCropArea, setStencil, setAspectRatio,
  getResult, canvasRef,
} = useCropper({
  aspectRatio: 1,
  stencil: 'circle',
  outputFormat: 'webp',
  outputQuality: 0.85,
})
```

## Custom Slots

Every part of the UI is replaceable:

```vue
<CropVue @done="handleDone">
  <template #dropzone="{ open, isDragging }">
    <div :class="{ active: isDragging }" @click="open">
      Drop your image here
    </div>
  </template>

  <template #toolbar="{ rotateLeft, rotateRight, zoomIn, zoomOut }">
    <button @click="rotateLeft">↶</button>
    <button @click="rotateRight">↷</button>
    <button @click="zoomIn">+</button>
    <button @click="zoomOut">-</button>
  </template>

  <template #done="{ result, restart }">
    <img :src="result.url" />
    <button @click="restart">Try again</button>
  </template>
</CropVue>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `stencil` | `'rectangle' \| 'circle' \| 'freeform'` | `'rectangle'` | Crop shape |
| `aspectRatio` | `number \| null` | `null` | Lock aspect ratio |
| `outputFormat` | `'auto' \| 'webp' \| 'jpeg' \| 'png'` | `'auto'` | Output format |
| `outputQuality` | `number` | `0.85` | Compression quality (0-1) |
| `accept` | `string[]` | `['image/*']` | Accepted MIME types |
| `maxFileSize` | `number` | `Infinity` | Max input file size (bytes) |
| `multiple` | `boolean` | `false` | Allow multiple files |
| `src` | `string \| null` | `null` | Pre-load image URL |
| `upload` | `UploadFn \| null` | `null` | Upload handler |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `{ width, height }` | Image loaded |
| `@change` | `CropState` | Crop area changed |
| `@done` | `CropResult` | Crop confirmed |
| `@uploaded` | `UploadResult` | Upload completed |
| `@error` | `CropVueError` | Error occurred |

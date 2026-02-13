# Nuxt Integration

CropVue has a first-class Nuxt module that handles auto-imports, SSR, and client-only rendering.

## Installation

```sh
pnpm add cropvue @cropvue/core @cropvue/nuxt
```

## Configuration

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@cropvue/nuxt'],
  cropvue: {
    outputFormat: 'webp',
    outputQuality: 0.85,
  },
})
```

## What the Module Does

1. **Auto-imports all components** - `CropVue`, `CropEditor`, `CropPreview`, `CropDropzone`, `CropToolbar`, `CropQueue`, `CropStencil`
2. **Auto-imports composables** - `useCropper`, `useDropzone`, `useImageQueue`, `useUploader`, `useCompressor`
3. **Adds default CSS** - Imports `cropvue/styles` globally
4. **Client-only rendering** - All components are registered as `mode: 'client'` to avoid SSR issues with canvas

## Usage

No imports needed - everything is auto-imported:

```vue
<template>
  <CropVue
    stencil="circle"
    :aspect-ratio="1"
    @done="handleDone"
  />
</template>

<script setup>
const handleDone = (result) => {
  // Upload to your API
  const formData = new FormData()
  formData.append('image', result.file)
  await $fetch('/api/upload', { method: 'POST', body: formData })
}
</script>
```

## Using Composables

```vue
<script setup>
// Auto-imported, no import statement needed
const cropper = useCropper({
  stencil: 'rectangle',
  aspectRatio: 16 / 9,
})
</script>
```

## SSR Considerations

All CropVue components use client-only rendering since they depend on the Canvas API and DOM APIs. You don't need to wrap them in `<ClientOnly>` - the module handles this automatically.

If you use the composables directly in `<script setup>`, wrap canvas-dependent operations in `onMounted` or use `process.client`:

```vue
<script setup>
const cropper = useCropper()

onMounted(async () => {
  // Safe to use canvas APIs here
  await cropper.loadUrl('/images/photo.jpg')
})
</script>
```

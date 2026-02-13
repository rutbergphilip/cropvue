# @cropvue/nuxt

Nuxt module for CropVue. Auto-imports all components and composables with SSR-safe client-only rendering.

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

## Usage

All components and composables are auto-imported:

```vue
<template>
  <CropVue stencil="circle" @done="handleDone" />
</template>

<script setup>
const handleDone = (result) => {
  console.log(result.blob, result.url)
}
</script>
```

## License

MIT

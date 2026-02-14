# CropVue

[![npm version](https://img.shields.io/npm/v/@cropvue/vue)](https://www.npmjs.com/package/@cropvue/vue)
[![CI](https://github.com/rutbergphilip/cropvue/actions/workflows/ci.yml/badge.svg)](https://github.com/rutbergphilip/cropvue/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Headless, fully customizable image cropping and upload library for Vue 3 + Nuxt.

## Features

- **Headless & Renderless** - Every visual element is replaceable via scoped slots
- **Full Pipeline** - File select/drop, crop, compress, and upload in one library
- **Smart Compression** - Output guaranteed to never be larger than input
- **Vue 3 + Nuxt** - First-class Nuxt module with auto-imports and SSR handling
- **CSS Custom Properties** - Theme every aspect with CSS variables
- **TypeScript First** - Full type safety with exported types

## Packages

| Package | Description |
|---------|-------------|
| [`@cropvue/core`](./packages/core) | Headless composables and pure logic |
| [`@cropvue/vue`](./packages/vue) | Vue 3 renderless components |
| [`@cropvue/nuxt`](./packages/nuxt) | Nuxt module with auto-imports |

## Quick Start

```sh
pnpm add @cropvue/vue
```

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

## Composable Usage

```ts
import { useCropper } from '@cropvue/core'

const { loadFile, rotateLeft, flipX, zoomBy, getResult } = useCropper({
  aspectRatio: 16 / 9,
  outputFormat: 'webp',
})
```

## Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@cropvue/nuxt'],
})
```

All components and composables are auto-imported.

## Documentation

See the [full documentation](./docs/guide/getting-started.md) for detailed guides on:

- [Getting Started](./docs/guide/getting-started.md)
- [Composables API](./docs/guide/composables.md)
- [Components](./docs/guide/components.md)
- [Theming](./docs/guide/theming.md)
- [Nuxt Integration](./docs/guide/nuxt.md)

## Development

```sh
pnpm install          # Install dependencies
pnpm dev              # Start playground
pnpm build            # Build all packages
pnpm test:run         # Run unit tests
pnpm test:e2e         # Run E2E tests
pnpm docs:dev         # Start docs dev server
```

## License

MIT

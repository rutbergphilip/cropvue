# cropvue

Renderless Vue 3 components for image cropping and upload. Fully customizable via scoped slots and CSS custom properties.

## Installation

```sh
pnpm add cropvue @cropvue/core
```

## Components

- **`CropVue`** - Main orchestrator (dropzone -> editor -> result)
- **`CropEditor`** - Interactive crop editor with CSS transforms
- **`CropPreview`** - Real-time canvas preview
- **`CropDropzone`** - File drop area
- **`CropToolbar`** - Rotate/flip/zoom controls
- **`CropQueue`** - Multi-image queue
- **`CropStencil`** - Crop shape overlay

## Usage

```vue
<script setup>
import { CropVue } from 'cropvue'
import 'cropvue/styles'
</script>

<template>
  <CropVue stencil="circle" :aspect-ratio="1" @done="handleDone">
    <template #dropzone="{ open, isDragging }">
      <div @click="open">{{ isDragging ? 'Drop!' : 'Click to select' }}</div>
    </template>
  </CropVue>
</template>
```

## Theming

Override CSS custom properties:

```css
:root {
  --cropvue-overlay-color: rgba(0, 0, 0, 0.7);
  --cropvue-crop-border-color: #3b82f6;
  --cropvue-toolbar-bg: #1f2937;
}
```

## License

MIT

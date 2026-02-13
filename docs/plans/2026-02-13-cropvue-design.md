# CropVue Design Document

> Headless, fully customizable image cropping and upload library for Vue 3 + Nuxt.

**Date:** 2026-02-13
**Package name:** `cropvue` (npm: available)
**Status:** Approved

---

## Problem

Every Vue 3 image cropping library is either abandoned (last publish 2+ years ago), has critical bugs (output images ballooning 3-5x in size), breaks in SSR/Nuxt, or uses imperative APIs that feel foreign in Composition API codebases. There is no single package that handles the full pipeline: file select/drop, crop, compress, and upload.

## Solution

CropVue is a headless, renderless component library that provides the full image cropping and upload pipeline with zero UI opinions. Every visual element is replaceable via scoped slots, and every piece of logic is accessible via composables.

---

## Architecture

### Rendering strategy: CSS Transforms + Canvas Output

- **Editor viewport:** CSS transforms for smooth, GPU-accelerated interaction (pan, zoom, rotate)
- **Preview area:** Canvas-rendered in real-time (debounced). Uses the exact same rendering function as final export.
- **Final export:** Canvas rendering via `renderCrop()` -- identical code path to preview.

This guarantees zero visual mismatch between preview and output.

```
CropEditor (CSS transforms) ──reads──▶ TransformState ◀──reads── canvas-renderer.ts
                                            │                         │
                                            │                    ┌────┴────┐
                                            │                    │         │
                                         writes            CropPreview  export()
                                       (user gestures)     (same fn)   (same fn)
```

### Monorepo structure

```
cropvue/
├── packages/
│   ├── core/          # @cropvue/core - headless composables + logic
│   ├── vue/           # cropvue - renderless Vue components + slots
│   └── nuxt/          # @cropvue/nuxt - Nuxt module (auto-imports, SSR)
├── docs/              # VitePress documentation
├── playground/        # Dev playground (Vite + Vue)
└── package.json       # pnpm workspace root
```

### Core package (`@cropvue/core`)

```
src/
├── composables/
│   ├── useCropper.ts        # Main composable - transform state, crop math
│   ├── useDropzone.ts       # File drop/select handling
│   ├── useImageQueue.ts     # Multi-image queue management
│   ├── useUploader.ts       # Upload pipeline with progress
│   └── useCompressor.ts     # Smart compress + format conversion
├── engine/
│   ├── transform.ts         # TransformState: position, scale, rotation, flip
│   ├── canvas-renderer.ts   # Canvas rendering (preview + export share this)
│   ├── constraints.ts       # Aspect ratio, min/max size, bounds
│   └── stencils.ts          # Crop shape definitions (rect, circle, freeform)
├── utils/
│   ├── image-loader.ts      # Load + auto-downsample large images
│   ├── canvas-limits.ts     # Detect max canvas size per browser
│   └── format-detect.ts     # Input format detection + output optimization
└── types.ts
```

### Vue package (`cropvue`)

```
src/
├── components/
│   ├── CropVue.vue          # Main orchestrator
│   ├── CropEditor.vue       # Interactive editor (CSS transforms)
│   ├── CropPreview.vue      # Real-time canvas preview
│   ├── CropDropzone.vue     # File drop area
│   ├── CropToolbar.vue      # Rotate/flip/zoom controls
│   ├── CropQueue.vue        # Multi-image queue
│   └── CropStencil.vue      # Crop shape overlay (SVG clip-path)
├── css/
│   └── variables.css        # --cropvue-* custom properties
└── index.ts
```

---

## Core State

### TransformState (single source of truth)

```ts
interface TransformState {
  x: number           // Image position relative to crop area center
  y: number
  scale: number       // 1 = original, 2 = 200%
  rotation: number    // Degrees (arbitrary, snaps to 90 available)
  flipX: boolean
  flipY: boolean
}
```

### CropState

```ts
interface CropState {
  x: number
  y: number
  width: number
  height: number
  stencil: 'rectangle' | 'circle' | 'freeform'
  points?: Array<{ x: number; y: number }>  // freeform only
  aspectRatio?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}
```

---

## API Design

### Simple usage

```vue
<script setup>
import { CropVue } from 'cropvue'
import 'cropvue/styles'

const handleDone = (result) => {
  console.log(result.blob, result.file, result.url, result.coords)
}
</script>

<template>
  <CropVue :aspect-ratio="1" stencil="circle" @done="handleDone" />
</template>
```

### Composable usage (headless)

```ts
import { useCropper } from '@cropvue/core'

const {
  image, transform, crop, isReady,
  loadFile, loadUrl,
  rotateLeft, rotateRight, rotateTo, flipX, flipY,
  zoomTo, zoomBy, panTo, reset,
  setCropArea, setStencil, setAspectRatio,
  getResult, getPreviewUrl,
  canvasRef, renderToCanvas,
} = useCropper({
  aspectRatio: 1,
  stencil: 'circle',
  outputFormat: 'webp',
  outputQuality: 0.85,
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `stencil` | `'rectangle' \| 'circle' \| 'freeform'` | `'rectangle'` | Crop shape |
| `aspectRatio` | `number \| null` | `null` | Lock aspect ratio |
| `minWidth` | `number` | `0` | Min crop width (px) |
| `minHeight` | `number` | `0` | Min crop height (px) |
| `maxWidth` | `number` | `Infinity` | Max crop width (px) |
| `maxHeight` | `number` | `Infinity` | Max crop height (px) |
| `outputFormat` | `'auto' \| 'webp' \| 'jpeg' \| 'png'` | `'auto'` | Output format |
| `outputQuality` | `number` | `0.85` | Compression quality (0-1) |
| `outputMaxWidth` | `number` | `Infinity` | Max output dimension |
| `outputMaxHeight` | `number` | `Infinity` | Max output dimension |
| `accept` | `string[]` | `['image/*']` | Accepted MIME types |
| `maxFileSize` | `number` | `Infinity` | Max input file size (bytes) |
| `multiple` | `boolean` | `false` | Allow multiple files |
| `upload` | `UploadFn \| null` | `null` | Upload handler |
| `src` | `string \| null` | `null` | Pre-load image URL |
| `modelValue` | `CropResult \| null` | `null` | v-model binding |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `{ width, height }` | Image loaded |
| `@change` | `CropState` | Crop area changed |
| `@done` | `CropResult` | Crop confirmed |
| `@uploaded` | `UploadResult` | Upload completed |
| `@error` | `CropVueError` | Error (type-discriminated) |
| `@queue-change` | `QueueItem[]` | Queue updated |
| `update:modelValue` | `CropResult` | v-model update |

### Slots

| Slot | Scoped Props | Purpose |
|------|-------------|---------|
| `#dropzone` | `{ open, isDragging, error }` | File selection area |
| `#editor` | `{ transform, crop, handlers }` | Crop editor |
| `#stencil` | `{ crop, stencil, points }` | Crop shape overlay |
| `#handles` | `{ positions, onDrag }` | Resize handles |
| `#toolbar` | `{ rotateLeft, rotateRight, flipX, flipY, zoom, reset }` | Controls |
| `#preview` | `{ src, crop, dimensions }` | Live preview |
| `#queue` | `{ images, current, select, remove }` | Image queue |
| `#actions` | `{ confirm, cancel, isUploading, progress }` | Action buttons |
| `#loading` | `{ progress }` | Loading state |
| `#error` | `{ error, retry, dismiss }` | Error display |

---

## Interaction Design

### Gesture mapping

| Gesture | Desktop | Mobile | Action |
|---------|---------|--------|--------|
| Pan image | Click + drag on image | One finger drag | Move image |
| Zoom | Scroll wheel / trackpad pinch | Pinch | Scale around gesture center |
| Resize crop | Drag corner/edge handles | Drag handles | Resize crop area |
| Move crop | Click + drag inside crop | One finger drag inside crop | Reposition crop |
| Freeform point | Click | Tap | Add polygon vertex |
| Rotate (free) | Shift + drag | Two finger rotate | Arbitrary rotation |

### Smart defaults

- **Auto-fit on load:** Image scales to fill crop area with minimal overflow
- **Bounce-back:** Rubber-band animation if user pans to empty space
- **Snap rotation:** Snaps to 0/90/180/270 within 3 degrees
- **Minimum crop guard:** 32x32px default minimum
- **Keyboard:** Arrow keys (1px, Shift=10px), +/- zoom, R rotate, Esc cancel
- **Cursor feedback:** Grab on image, crosshair on edges, rotate cursor near corners

### Freeform mode flow

1. Switch to freeform stencil
2. Click/tap to place points, line draws between them
3. Close shape by clicking first point (or double-click to auto-close)
4. Drag individual points to adjust
5. Pan/zoom/rotate still work on the image behind the mask

---

## Smart Compression Engine

```
Input → Detect format → Read EXIF → Check dimensions
  └─ Too large? → Downsample to safe canvas size
      │
      ▼
  [ User crops ]
      │
      ▼
  Render to canvas → Choose format:
    ├─ Has transparency? → PNG
    ├─ Browser supports WebP? → WebP at quality setting
    └─ Fallback → JPEG at quality setting
      │
      ▼
  Compare: output > input?
    └─ Yes → Re-encode at lower quality (max 3 attempts)
      │
      ▼
  CropResult.blob ← Guaranteed ≤ input size
```

---

## Nuxt Module

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@cropvue/nuxt'],
  cropvue: {
    outputFormat: 'webp',
    outputQuality: 0.85,
  }
})
```

1. Auto-imports all components and composables
2. Handles SSR (client-only canvas plugin)
3. Global defaults via module options

---

## Theming (CSS Custom Properties)

```css
:root {
  --cropvue-overlay-color: rgba(0, 0, 0, 0.5);
  --cropvue-crop-border-color: #fff;
  --cropvue-crop-border-width: 2px;
  --cropvue-grid-color: rgba(255, 255, 255, 0.3);
  --cropvue-grid-display: block;
  --cropvue-handle-color: #fff;
  --cropvue-handle-size: 10px;
  --cropvue-handle-border-radius: 50%;
  --cropvue-dropzone-border-color: #d1d5db;
  --cropvue-dropzone-border-color-active: #3b82f6;
  --cropvue-dropzone-bg: transparent;
  --cropvue-dropzone-border-style: dashed;
  --cropvue-dropzone-border-radius: 8px;
}
```

---

## Build & Tooling

| Tool | Purpose |
|------|---------|
| pnpm workspaces | Monorepo |
| Vite | Build + dev |
| vite-plugin-dts | TypeScript declarations |
| unbuild | Library build (ESM + CJS) |
| Vitest | Unit + integration tests |
| Playwright | E2E gesture/output tests |
| VitePress | Documentation |
| changesets | Versioning + changelogs |
| GitHub Actions | CI/CD + npm publish |

## Performance Targets

| Metric | Target |
|--------|--------|
| Interaction FPS | 60fps |
| Preview render | <50ms at 30fps |
| Final export (2000x2000) | <200ms |
| Image load + downsample | <500ms for 20MP |
| Bundle (core) | <15kB gzipped |
| Bundle (vue) | <10kB gzipped |

---

## Package Exports

**cropvue:**
- `cropvue` → components (ESM + CJS + types)
- `cropvue/styles` → CSS custom properties

**@cropvue/core:**
- `@cropvue/core` → composables + engine (ESM + CJS + types)

**@cropvue/nuxt:**
- `@cropvue/nuxt` → Nuxt module

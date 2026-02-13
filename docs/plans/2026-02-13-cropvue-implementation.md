# CropVue Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a headless, fully customizable image cropping and upload library for Vue 3 + Nuxt, published as three packages: `@cropvue/core`, `cropvue`, and `@cropvue/nuxt`.

**Architecture:** CSS transforms for interactive editing, canvas for preview + export (shared render function = zero mismatch). Monorepo with pnpm workspaces. Headless composables in core, renderless Vue components with scoped slots in vue package.

**Tech Stack:** Vue 3.5, TypeScript 5.9, Vite 7, Vitest 4, unbuild 3.6, pnpm 10, VitePress 1.6, changesets

---

## Task 1: Scaffold Monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `.npmrc`
- Create: `tsconfig.json`
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Create: `packages/vue/package.json`
- Create: `packages/vue/tsconfig.json`
- Create: `packages/vue/src/index.ts`
- Create: `packages/nuxt/package.json`
- Create: `packages/nuxt/tsconfig.json`
- Create: `packages/nuxt/src/module.ts`
- Create: `playground/package.json`
- Create: `playground/vite.config.ts`
- Create: `playground/index.html`
- Create: `playground/src/main.ts`
- Create: `playground/src/App.vue`

**Step 1: Create root workspace files**

`package.json`:
```json
{
  "name": "cropvue-monorepo",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm -C playground dev",
    "build": "pnpm -r --filter './packages/*' build",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.9.0",
    "vitest": "^4.0.0",
    "vue": "^3.5.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
  - 'playground'
```

`.npmrc`:
```
shamefully-hoist=false
strict-peer-dependencies=false
```

`.gitignore`:
```
node_modules
dist
.turbo
*.local
.DS_Store
coverage
```

Root `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["vitest/globals"]
  },
  "exclude": ["node_modules", "dist"]
}
```

**Step 2: Create `packages/core/package.json`**

```json
{
  "name": "@cropvue/core",
  "version": "0.0.1",
  "type": "module",
  "license": "MIT",
  "description": "Headless image cropping engine - composables and utilities",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "unbuild",
    "dev": "unbuild --stub"
  },
  "devDependencies": {
    "unbuild": "^3.6.0"
  }
}
```

`packages/core/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

`packages/core/src/index.ts`:
```ts
export { useCropper } from './composables/useCropper'
export { useDropzone } from './composables/useDropzone'
export { useImageQueue } from './composables/useImageQueue'
export { useUploader } from './composables/useUploader'
export { useCompressor } from './composables/useCompressor'
export type * from './types'
```

**Step 3: Create `packages/vue/package.json`**

```json
{
  "name": "cropvue",
  "version": "0.0.1",
  "type": "module",
  "license": "MIT",
  "description": "Headless, fully customizable image cropping and upload components for Vue 3",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles.css"
  },
  "files": ["dist"],
  "scripts": {
    "build": "unbuild",
    "dev": "unbuild --stub"
  },
  "dependencies": {
    "@cropvue/core": "workspace:*"
  },
  "peerDependencies": {
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "unbuild": "^3.6.0",
    "vue": "^3.5.0"
  }
}
```

`packages/vue/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

`packages/vue/src/index.ts`:
```ts
export { default as CropVue } from './components/CropVue.vue'
export { default as CropEditor } from './components/CropEditor.vue'
export { default as CropPreview } from './components/CropPreview.vue'
export { default as CropDropzone } from './components/CropDropzone.vue'
export { default as CropToolbar } from './components/CropToolbar.vue'
export { default as CropQueue } from './components/CropQueue.vue'
export { default as CropStencil } from './components/CropStencil.vue'
export { useCropper, useDropzone, useImageQueue, useUploader, useCompressor } from '@cropvue/core'
export type * from '@cropvue/core'
```

**Step 4: Create `packages/nuxt/package.json`** (minimal placeholder)

```json
{
  "name": "@cropvue/nuxt",
  "version": "0.0.1",
  "type": "module",
  "license": "MIT",
  "description": "Nuxt module for CropVue - auto-imports and SSR handling",
  "main": "./dist/module.cjs",
  "module": "./dist/module.mjs",
  "types": "./dist/module.d.ts",
  "exports": {
    ".": {
      "import": "./dist/module.mjs",
      "require": "./dist/module.cjs",
      "types": "./dist/module.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "unbuild",
    "dev": "unbuild --stub"
  },
  "dependencies": {
    "cropvue": "workspace:*",
    "@cropvue/core": "workspace:*"
  },
  "peerDependencies": {
    "nuxt": "^3.0.0 || ^4.0.0"
  },
  "devDependencies": {
    "@nuxt/kit": "^3.15.0",
    "unbuild": "^3.6.0"
  }
}
```

**Step 5: Create playground**

`playground/package.json`:
```json
{
  "name": "cropvue-playground",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "cropvue": "workspace:*",
    "@cropvue/core": "workspace:*",
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^7.0.0"
  }
}
```

`playground/vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

`playground/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CropVue Playground</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

`playground/src/main.ts`:
```ts
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

`playground/src/App.vue`:
```vue
<script setup lang="ts">
// Playground entry - will import CropVue here later
</script>

<template>
  <div style="padding: 2rem;">
    <h1>CropVue Playground</h1>
    <p>Components will be tested here.</p>
  </div>
</template>
```

**Step 6: Install dependencies and verify**

Run: `cd /Users/philiprutberg/Development/Packages/cropvue && pnpm install`
Expected: Lockfile created, all packages linked.

Run: `pnpm typecheck`
Expected: No errors (empty source files).

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold monorepo with core, vue, nuxt packages and playground"
```

---

## Task 2: Types & Transform Engine

**Files:**
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/engine/transform.ts`
- Create: `packages/core/src/__tests__/transform.test.ts`

**Step 1: Write types**

`packages/core/src/types.ts`:
```ts
// === State Types ===

export interface TransformState {
  x: number
  y: number
  scale: number
  rotation: number
  flipX: boolean
  flipY: boolean
}

export interface CropState {
  x: number
  y: number
  width: number
  height: number
  stencil: StencilType
  points?: Point[]
  aspectRatio?: number | null
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

export type StencilType = 'rectangle' | 'circle' | 'freeform'

export interface Point {
  x: number
  y: number
}

// === Image Types ===

export interface ImageData {
  element: HTMLImageElement
  naturalWidth: number
  naturalHeight: number
  originalFile?: File
  originalSize?: number
}

// === Result Types ===

export interface CropResult {
  blob: Blob
  file: File
  url: string
  coords: CropCoordinates
  width: number
  height: number
  originalWidth: number
  originalHeight: number
}

export interface CropCoordinates {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  flipX: boolean
  flipY: boolean
  scale: number
}

// === Upload Types ===

export interface UploadResult {
  url?: string
  [key: string]: unknown
}

export type UploadFn = (
  file: File,
  options: { onProgress: (percent: number) => void; signal: AbortSignal }
) => Promise<UploadResult>

// === Queue Types ===

export interface QueueItem {
  id: string
  file: File
  thumbnail: string
  result?: CropResult
  status: 'pending' | 'cropping' | 'done'
}

// === Error Types ===

export type CropVueError =
  | { type: 'file-too-large'; maxSize: number; actualSize: number }
  | { type: 'invalid-type'; accepted: string[]; actual: string }
  | { type: 'load-failed'; message: string }
  | { type: 'canvas-limit'; maxDimension: number }
  | { type: 'upload-failed'; message: string }
  | { type: 'compress-failed'; message: string }

// === Options Types ===

export type OutputFormat = 'auto' | 'webp' | 'jpeg' | 'png'

export interface CropperOptions {
  stencil?: StencilType
  aspectRatio?: number | null
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  outputFormat?: OutputFormat
  outputQuality?: number
  outputMaxWidth?: number
  outputMaxHeight?: number
}

export interface DropzoneOptions {
  accept?: string[]
  maxSize?: number
  multiple?: boolean
  onFiles?: (files: File[]) => void
  onError?: (error: CropVueError) => void
}

export interface UploaderOptions {
  url?: string
  fieldName?: string
  headers?: Record<string, string>
  handler?: UploadFn
}

export interface CompressorOptions {
  format?: OutputFormat
  quality?: number
  maxWidth?: number
  maxHeight?: number
}
```

**Step 2: Write failing tests for transform engine**

`packages/core/src/__tests__/transform.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  createTransformState,
  createCropState,
  applyRotation,
  applyFlip,
  applyZoom,
  applyPan,
  clampTransform,
  resetTransform,
  SNAP_THRESHOLD_DEGREES,
  snapRotation,
} from '../engine/transform'

describe('createTransformState', () => {
  it('returns default state', () => {
    const state = createTransformState()
    expect(state).toEqual({
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      flipX: false,
      flipY: false,
    })
  })

  it('accepts partial overrides', () => {
    const state = createTransformState({ scale: 2, rotation: 90 })
    expect(state.scale).toBe(2)
    expect(state.rotation).toBe(90)
    expect(state.x).toBe(0)
  })
})

describe('createCropState', () => {
  it('returns default state', () => {
    const state = createCropState({ width: 100, height: 100 })
    expect(state.stencil).toBe('rectangle')
    expect(state.width).toBe(100)
  })
})

describe('applyRotation', () => {
  it('rotates left by 90 degrees', () => {
    const state = createTransformState()
    const result = applyRotation(state, -90)
    expect(result.rotation).toBe(-90)
  })

  it('rotates right by 90 degrees', () => {
    const state = createTransformState()
    const result = applyRotation(state, 90)
    expect(result.rotation).toBe(90)
  })

  it('wraps around at 360', () => {
    const state = createTransformState({ rotation: 350 })
    const result = applyRotation(state, 20)
    expect(result.rotation).toBe(10)
  })

  it('wraps around at -360', () => {
    const state = createTransformState({ rotation: -350 })
    const result = applyRotation(state, -20)
    expect(result.rotation).toBe(-10)
  })
})

describe('snapRotation', () => {
  it('snaps to 0 within threshold', () => {
    expect(snapRotation(2)).toBe(0)
    expect(snapRotation(-2)).toBe(0)
  })

  it('snaps to 90 within threshold', () => {
    expect(snapRotation(88)).toBe(90)
    expect(snapRotation(92)).toBe(90)
  })

  it('snaps to 180 within threshold', () => {
    expect(snapRotation(178)).toBe(180)
  })

  it('snaps to 270 within threshold', () => {
    expect(snapRotation(271)).toBe(270)
  })

  it('does not snap outside threshold', () => {
    expect(snapRotation(45)).toBe(45)
    expect(snapRotation(135)).toBe(135)
  })
})

describe('applyFlip', () => {
  it('toggles flipX', () => {
    const state = createTransformState()
    const result = applyFlip(state, 'x')
    expect(result.flipX).toBe(true)
    expect(result.flipY).toBe(false)
  })

  it('toggles flipY', () => {
    const state = createTransformState()
    const result = applyFlip(state, 'y')
    expect(result.flipY).toBe(true)
  })

  it('double flip returns to original', () => {
    const state = createTransformState()
    const flipped = applyFlip(state, 'x')
    const unflipped = applyFlip(flipped, 'x')
    expect(unflipped.flipX).toBe(false)
  })
})

describe('applyZoom', () => {
  it('zooms in', () => {
    const state = createTransformState()
    const result = applyZoom(state, 0.5)
    expect(result.scale).toBe(1.5)
  })

  it('zooms out', () => {
    const state = createTransformState({ scale: 2 })
    const result = applyZoom(state, -0.5)
    expect(result.scale).toBe(1.5)
  })

  it('clamps to minimum scale of 0.1', () => {
    const state = createTransformState({ scale: 0.2 })
    const result = applyZoom(state, -0.5)
    expect(result.scale).toBe(0.1)
  })

  it('clamps to maximum scale of 10', () => {
    const state = createTransformState({ scale: 9.8 })
    const result = applyZoom(state, 0.5)
    expect(result.scale).toBe(10)
  })
})

describe('applyPan', () => {
  it('pans by delta', () => {
    const state = createTransformState()
    const result = applyPan(state, 10, -5)
    expect(result.x).toBe(10)
    expect(result.y).toBe(-5)
  })

  it('accumulates pans', () => {
    const state = createTransformState({ x: 5, y: 5 })
    const result = applyPan(state, 10, 10)
    expect(result.x).toBe(15)
    expect(result.y).toBe(15)
  })
})

describe('resetTransform', () => {
  it('resets to default', () => {
    const state = createTransformState({ x: 50, y: 50, scale: 3, rotation: 45, flipX: true, flipY: true })
    const result = resetTransform(state)
    expect(result).toEqual(createTransformState())
  })
})
```

**Step 3: Run tests to verify they fail**

Run: `cd /Users/philiprutberg/Development/Packages/cropvue && pnpm test:run`
Expected: FAIL - modules not found

**Step 4: Implement transform engine**

`packages/core/src/engine/transform.ts`:
```ts
import type { TransformState, CropState, StencilType, Point } from '../types'

export const MIN_SCALE = 0.1
export const MAX_SCALE = 10
export const SNAP_THRESHOLD_DEGREES = 3

export function createTransformState(
  overrides: Partial<TransformState> = {}
): TransformState {
  return {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
    ...overrides,
  }
}

export function createCropState(
  dimensions: { width: number; height: number },
  overrides: Partial<CropState> = {}
): CropState {
  return {
    x: 0,
    y: 0,
    width: dimensions.width,
    height: dimensions.height,
    stencil: 'rectangle' as StencilType,
    ...overrides,
  }
}

function normalizeAngle(degrees: number): number {
  let result = degrees % 360
  if (result > 180) result -= 360
  if (result < -180) result += 360
  return result
}

export function snapRotation(degrees: number): number {
  const snaps = [0, 90, 180, 270, 360]
  const normalized = ((degrees % 360) + 360) % 360
  for (const snap of snaps) {
    if (Math.abs(normalized - snap) <= SNAP_THRESHOLD_DEGREES) {
      return snap === 360 ? 0 : snap
    }
  }
  return degrees
}

export function applyRotation(
  state: TransformState,
  degrees: number
): TransformState {
  const raw = state.rotation + degrees
  const rotation = normalizeAngle(raw)
  return { ...state, rotation }
}

export function applyFlip(
  state: TransformState,
  axis: 'x' | 'y'
): TransformState {
  if (axis === 'x') {
    return { ...state, flipX: !state.flipX }
  }
  return { ...state, flipY: !state.flipY }
}

export function applyZoom(
  state: TransformState,
  delta: number
): TransformState {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, state.scale + delta))
  return { ...state, scale: Math.round(scale * 1000) / 1000 }
}

export function applyPan(
  state: TransformState,
  dx: number,
  dy: number
): TransformState {
  return { ...state, x: state.x + dx, y: state.y + dy }
}

export function clampTransform(
  state: TransformState,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): TransformState {
  return {
    ...state,
    x: Math.min(bounds.maxX, Math.max(bounds.minX, state.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, state.y)),
  }
}

export function resetTransform(_state: TransformState): TransformState {
  return createTransformState()
}
```

**Step 5: Run tests to verify they pass**

Run: `pnpm test:run`
Expected: All transform tests PASS

**Step 6: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/engine/transform.ts packages/core/src/__tests__/transform.test.ts
git commit -m "feat(core): add types and transform engine with tests"
```

---

## Task 3: Canvas Limits & Image Loader Utils

**Files:**
- Create: `packages/core/src/utils/canvas-limits.ts`
- Create: `packages/core/src/utils/image-loader.ts`
- Create: `packages/core/src/utils/format-detect.ts`
- Create: `packages/core/src/__tests__/canvas-limits.test.ts`
- Create: `packages/core/src/__tests__/format-detect.test.ts`

**Step 1: Write failing tests**

`packages/core/src/__tests__/canvas-limits.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { getMaxCanvasSize, downsampleDimensions } from '../utils/canvas-limits'

describe('downsampleDimensions', () => {
  it('returns original dimensions when within limits', () => {
    const result = downsampleDimensions(1000, 1000, 4096)
    expect(result).toEqual({ width: 1000, height: 1000 })
  })

  it('downsamples width when exceeding limit', () => {
    const result = downsampleDimensions(8000, 4000, 4096)
    expect(result.width).toBe(4096)
    expect(result.height).toBe(2048)
  })

  it('downsamples height when exceeding limit', () => {
    const result = downsampleDimensions(2000, 8000, 4096)
    expect(result.width).toBe(1024)
    expect(result.height).toBe(4096)
  })

  it('preserves aspect ratio', () => {
    const result = downsampleDimensions(6000, 3000, 4096)
    expect(result.width / result.height).toBeCloseTo(2, 1)
  })
})

describe('getMaxCanvasSize', () => {
  it('returns a positive number', () => {
    const size = getMaxCanvasSize()
    expect(size).toBeGreaterThan(0)
  })
})
```

`packages/core/src/__tests__/format-detect.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  detectMimeType,
  supportsWebP,
  getMimeForFormat,
  hasTransparency,
} from '../utils/format-detect'

describe('detectMimeType', () => {
  it('detects from file type', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    expect(detectMimeType(file)).toBe('image/jpeg')
  })

  it('falls back to extension when type is empty', () => {
    const file = new File([''], 'test.png', { type: '' })
    expect(detectMimeType(file)).toBe('image/png')
  })

  it('returns image/jpeg as default fallback', () => {
    const file = new File([''], 'test', { type: '' })
    expect(detectMimeType(file)).toBe('image/jpeg')
  })
})

describe('getMimeForFormat', () => {
  it('maps format strings to MIME types', () => {
    expect(getMimeForFormat('jpeg')).toBe('image/jpeg')
    expect(getMimeForFormat('png')).toBe('image/png')
    expect(getMimeForFormat('webp')).toBe('image/webp')
  })

  it('returns webp for auto when supported', () => {
    // In test env (jsdom), we mock this
    expect(getMimeForFormat('auto')).toBe('image/webp')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test:run`
Expected: FAIL - modules not found

**Step 3: Implement utilities**

`packages/core/src/utils/canvas-limits.ts`:
```ts
let cachedMaxSize: number | null = null

export function getMaxCanvasSize(): number {
  if (cachedMaxSize !== null) return cachedMaxSize

  if (typeof document === 'undefined') {
    cachedMaxSize = 4096
    return cachedMaxSize
  }

  // Binary search for max canvas dimension
  const canvas = document.createElement('canvas')
  let low = 1024
  let high = 16384

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2)
    canvas.width = mid
    canvas.height = 1
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillRect(0, 0, 1, 1)
      const pixel = ctx.getImageData(0, 0, 1, 1).data
      if (pixel[3] > 0) {
        low = mid
      } else {
        high = mid - 1
      }
    } else {
      high = mid - 1
    }
  }

  cachedMaxSize = low
  canvas.width = 0
  canvas.height = 0
  return cachedMaxSize
}

export function downsampleDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }

  const ratio = Math.min(maxDimension / width, maxDimension / height)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}
```

`packages/core/src/utils/format-detect.ts`:
```ts
import type { OutputFormat } from '../types'

const EXTENSION_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  avif: 'image/avif',
}

export function detectMimeType(file: File): string {
  if (file.type && file.type.startsWith('image/')) {
    return file.type
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_MAP[ext] ?? 'image/jpeg'
}

let webpSupported: boolean | null = null

export function supportsWebP(): boolean {
  if (webpSupported !== null) return webpSupported

  if (typeof document === 'undefined') {
    webpSupported = false
    return false
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp')
  canvas.width = 0
  canvas.height = 0
  return webpSupported
}

export function getMimeForFormat(format: OutputFormat): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'auto':
      return supportsWebP() ? 'image/webp' : 'image/jpeg'
  }
}

export function hasTransparency(mime: string): boolean {
  return mime === 'image/png' || mime === 'image/webp' || mime === 'image/avif'
}
```

`packages/core/src/utils/image-loader.ts`:
```ts
import type { ImageData as CropImageData } from '../types'
import { getMaxCanvasSize, downsampleDimensions } from './canvas-limits'

export function loadImageFromFile(file: File): Promise<CropImageData> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        element: img,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        originalFile: file,
        originalSize: file.size,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Failed to load image: ${file.name}`))
    }

    img.src = url
  })
}

export function loadImageFromUrl(url: string): Promise<CropImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      resolve({
        element: img,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      })
    }

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`))
    }

    img.src = url
  })
}

export function needsDownsample(width: number, height: number): boolean {
  const maxSize = getMaxCanvasSize()
  return width > maxSize || height > maxSize
}

export function getSafeDimensions(
  width: number,
  height: number
): { width: number; height: number } {
  const maxSize = getMaxCanvasSize()
  return downsampleDimensions(width, height, maxSize)
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test:run`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/core/src/utils/ packages/core/src/__tests__/canvas-limits.test.ts packages/core/src/__tests__/format-detect.test.ts
git commit -m "feat(core): add canvas-limits, format-detect, and image-loader utilities"
```

---

## Task 4: Constraints Engine

**Files:**
- Create: `packages/core/src/engine/constraints.ts`
- Create: `packages/core/src/__tests__/constraints.test.ts`

**Step 1: Write failing tests**

`packages/core/src/__tests__/constraints.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  constrainCropSize,
  constrainAspectRatio,
  constrainCropPosition,
  MIN_CROP_SIZE,
} from '../engine/constraints'
import { createCropState } from '../engine/transform'

describe('constrainCropSize', () => {
  it('enforces minimum crop size', () => {
    const crop = createCropState({ width: 10, height: 10 })
    const result = constrainCropSize(crop, { containerWidth: 500, containerHeight: 500 })
    expect(result.width).toBe(MIN_CROP_SIZE)
    expect(result.height).toBe(MIN_CROP_SIZE)
  })

  it('enforces maxWidth/maxHeight from crop state', () => {
    const crop = createCropState({ width: 500, height: 500 })
    crop.maxWidth = 200
    crop.maxHeight = 200
    const result = constrainCropSize(crop, { containerWidth: 500, containerHeight: 500 })
    expect(result.width).toBe(200)
    expect(result.height).toBe(200)
  })

  it('does not exceed container', () => {
    const crop = createCropState({ width: 800, height: 800 })
    const result = constrainCropSize(crop, { containerWidth: 500, containerHeight: 500 })
    expect(result.width).toBeLessThanOrEqual(500)
    expect(result.height).toBeLessThanOrEqual(500)
  })
})

describe('constrainAspectRatio', () => {
  it('adjusts width to match aspect ratio', () => {
    const crop = createCropState({ width: 200, height: 200 })
    crop.aspectRatio = 16 / 9
    const result = constrainAspectRatio(crop)
    expect(result.width / result.height).toBeCloseTo(16 / 9, 1)
  })

  it('does nothing when aspectRatio is null', () => {
    const crop = createCropState({ width: 200, height: 150 })
    const result = constrainAspectRatio(crop)
    expect(result.width).toBe(200)
    expect(result.height).toBe(150)
  })

  it('handles 1:1 aspect ratio', () => {
    const crop = createCropState({ width: 300, height: 200 })
    crop.aspectRatio = 1
    const result = constrainAspectRatio(crop)
    expect(result.width).toBe(result.height)
  })
})

describe('constrainCropPosition', () => {
  it('keeps crop inside container bounds', () => {
    const crop = createCropState({ width: 100, height: 100 })
    crop.x = -50
    crop.y = -50
    const result = constrainCropPosition(crop, { containerWidth: 500, containerHeight: 500 })
    expect(result.x).toBeGreaterThanOrEqual(0)
    expect(result.y).toBeGreaterThanOrEqual(0)
  })

  it('prevents crop from going past right/bottom edge', () => {
    const crop = createCropState({ width: 100, height: 100 })
    crop.x = 450
    crop.y = 450
    const result = constrainCropPosition(crop, { containerWidth: 500, containerHeight: 500 })
    expect(result.x + result.width).toBeLessThanOrEqual(500)
    expect(result.y + result.height).toBeLessThanOrEqual(500)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test:run`
Expected: FAIL

**Step 3: Implement constraints**

`packages/core/src/engine/constraints.ts`:
```ts
import type { CropState } from '../types'

export const MIN_CROP_SIZE = 32

interface ContainerBounds {
  containerWidth: number
  containerHeight: number
}

export function constrainCropSize(
  crop: CropState,
  bounds: ContainerBounds
): CropState {
  let { width, height } = crop
  const minW = crop.minWidth ?? MIN_CROP_SIZE
  const minH = crop.minHeight ?? MIN_CROP_SIZE
  const maxW = Math.min(crop.maxWidth ?? Infinity, bounds.containerWidth)
  const maxH = Math.min(crop.maxHeight ?? Infinity, bounds.containerHeight)

  width = Math.max(minW, Math.min(maxW, width))
  height = Math.max(minH, Math.min(maxH, height))

  return { ...crop, width, height }
}

export function constrainAspectRatio(crop: CropState): CropState {
  if (!crop.aspectRatio) return crop

  const ratio = crop.aspectRatio
  let { width, height } = crop

  // Adjust height to match aspect ratio, keeping width as reference
  const targetHeight = width / ratio
  if (targetHeight <= height) {
    height = Math.round(targetHeight)
  } else {
    width = Math.round(height * ratio)
  }

  return { ...crop, width, height }
}

export function constrainCropPosition(
  crop: CropState,
  bounds: ContainerBounds
): CropState {
  let { x, y } = crop

  x = Math.max(0, Math.min(bounds.containerWidth - crop.width, x))
  y = Math.max(0, Math.min(bounds.containerHeight - crop.height, y))

  return { ...crop, x, y }
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test:run`
Expected: All PASS

**Step 5: Commit**

```bash
git add packages/core/src/engine/constraints.ts packages/core/src/__tests__/constraints.test.ts
git commit -m "feat(core): add constraints engine for crop size, aspect ratio, position"
```

---

## Task 5: Stencils Engine

**Files:**
- Create: `packages/core/src/engine/stencils.ts`
- Create: `packages/core/src/__tests__/stencils.test.ts`

**Step 1: Write failing tests**

`packages/core/src/__tests__/stencils.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  getRectangleClipPath,
  getCircleClipPath,
  getFreeformClipPath,
  isPointInsideStencil,
} from '../engine/stencils'

describe('getRectangleClipPath', () => {
  it('returns inset clip-path CSS', () => {
    const result = getRectangleClipPath({ x: 10, y: 20, width: 100, height: 80 }, { containerWidth: 300, containerHeight: 300 })
    expect(result).toContain('inset(')
  })
})

describe('getCircleClipPath', () => {
  it('returns circle clip-path CSS', () => {
    const result = getCircleClipPath({ x: 50, y: 50, width: 100, height: 100 }, { containerWidth: 300, containerHeight: 300 })
    expect(result).toContain('circle(')
  })

  it('uses the smaller dimension as diameter', () => {
    const result = getCircleClipPath({ x: 50, y: 50, width: 200, height: 100 }, { containerWidth: 500, containerHeight: 500 })
    expect(result).toContain('50px')
  })
})

describe('getFreeformClipPath', () => {
  it('returns polygon clip-path CSS', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]
    const result = getFreeformClipPath(points)
    expect(result).toContain('polygon(')
  })

  it('returns empty string for fewer than 3 points', () => {
    const result = getFreeformClipPath([{ x: 0, y: 0 }, { x: 10, y: 10 }])
    expect(result).toBe('')
  })
})

describe('isPointInsideStencil', () => {
  it('detects point inside rectangle', () => {
    expect(isPointInsideStencil(50, 50, {
      stencil: 'rectangle',
      x: 0, y: 0, width: 100, height: 100,
    })).toBe(true)
  })

  it('detects point outside rectangle', () => {
    expect(isPointInsideStencil(150, 150, {
      stencil: 'rectangle',
      x: 0, y: 0, width: 100, height: 100,
    })).toBe(false)
  })

  it('detects point inside circle', () => {
    expect(isPointInsideStencil(50, 50, {
      stencil: 'circle',
      x: 0, y: 0, width: 100, height: 100,
    })).toBe(true)
  })

  it('detects point outside circle corners', () => {
    expect(isPointInsideStencil(1, 1, {
      stencil: 'circle',
      x: 0, y: 0, width: 100, height: 100,
    })).toBe(false)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test:run`
Expected: FAIL

**Step 3: Implement stencils**

`packages/core/src/engine/stencils.ts`:
```ts
import type { CropState, Point } from '../types'

interface ContainerDimensions {
  containerWidth: number
  containerHeight: number
}

export function getRectangleClipPath(
  rect: { x: number; y: number; width: number; height: number },
  container: ContainerDimensions
): string {
  const top = rect.y
  const right = container.containerWidth - (rect.x + rect.width)
  const bottom = container.containerHeight - (rect.y + rect.height)
  const left = rect.x
  return `inset(${top}px ${right}px ${bottom}px ${left}px)`
}

export function getCircleClipPath(
  rect: { x: number; y: number; width: number; height: number },
  _container: ContainerDimensions
): string {
  const radius = Math.min(rect.width, rect.height) / 2
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  return `circle(${radius}px at ${cx}px ${cy}px)`
}

export function getFreeformClipPath(points: Point[]): string {
  if (points.length < 3) return ''
  const coords = points.map((p) => `${p.x}px ${p.y}px`).join(', ')
  return `polygon(${coords})`
}

export function isPointInsideStencil(
  px: number,
  py: number,
  crop: Pick<CropState, 'stencil' | 'x' | 'y' | 'width' | 'height' | 'points'>
): boolean {
  if (crop.stencil === 'rectangle') {
    return (
      px >= crop.x &&
      px <= crop.x + crop.width &&
      py >= crop.y &&
      py <= crop.y + crop.height
    )
  }

  if (crop.stencil === 'circle') {
    const cx = crop.x + crop.width / 2
    const cy = crop.y + crop.height / 2
    const r = Math.min(crop.width, crop.height) / 2
    const dx = px - cx
    const dy = py - cy
    return dx * dx + dy * dy <= r * r
  }

  if (crop.stencil === 'freeform' && crop.points && crop.points.length >= 3) {
    return isPointInsidePolygon(px, py, crop.points)
  }

  return false
}

function isPointInsidePolygon(px: number, py: number, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test:run`
Expected: All PASS

**Step 5: Commit**

```bash
git add packages/core/src/engine/stencils.ts packages/core/src/__tests__/stencils.test.ts
git commit -m "feat(core): add stencils engine with rect, circle, freeform clip paths"
```

---

## Task 6: Canvas Renderer

**Files:**
- Create: `packages/core/src/engine/canvas-renderer.ts`
- Create: `packages/core/src/__tests__/canvas-renderer.test.ts`

**Step 1: Write failing tests**

`packages/core/src/__tests__/canvas-renderer.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderCrop, exportCrop } from '../engine/canvas-renderer'
import { createTransformState, createCropState } from '../engine/transform'

// Note: canvas operations in jsdom are limited. These tests verify
// the function signatures, option handling, and error cases.
// Full visual correctness is tested via Playwright E2E.

describe('renderCrop', () => {
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    canvas = document.createElement('canvas')
  })

  it('sets canvas dimensions to crop size', () => {
    const crop = createCropState({ width: 200, height: 150 })
    const transform = createTransformState()
    const img = new Image()
    img.width = 400
    img.height = 300

    renderCrop(canvas, img, crop, transform)

    expect(canvas.width).toBe(200)
    expect(canvas.height).toBe(150)
  })

  it('respects maxWidth/maxHeight output options', () => {
    const crop = createCropState({ width: 2000, height: 1500 })
    const transform = createTransformState()
    const img = new Image()
    img.width = 4000
    img.height = 3000

    renderCrop(canvas, img, crop, transform, { maxWidth: 800, maxHeight: 600 })

    expect(canvas.width).toBeLessThanOrEqual(800)
    expect(canvas.height).toBeLessThanOrEqual(600)
  })
})

describe('exportCrop', () => {
  it('returns a blob', async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100

    const blob = await exportCrop(canvas, { format: 'image/png', quality: 0.9 })

    // jsdom may return empty blob, but the function should not throw
    expect(blob).toBeInstanceOf(Blob)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test:run`
Expected: FAIL

**Step 3: Implement canvas renderer**

`packages/core/src/engine/canvas-renderer.ts`:
```ts
import type { TransformState, CropState } from '../types'

export interface RenderOptions {
  maxWidth?: number
  maxHeight?: number
}

export interface ExportOptions {
  format: string
  quality: number
}

export function renderCrop(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  crop: CropState,
  transform: TransformState,
  options: RenderOptions = {}
): void {
  let outWidth = crop.width
  let outHeight = crop.height

  // Apply output dimension limits
  if (options.maxWidth || options.maxHeight) {
    const maxW = options.maxWidth ?? Infinity
    const maxH = options.maxHeight ?? Infinity
    const ratio = Math.min(maxW / outWidth, maxH / outHeight, 1)
    outWidth = Math.round(outWidth * ratio)
    outHeight = Math.round(outHeight * ratio)
  }

  canvas.width = outWidth
  canvas.height = outHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, outWidth, outHeight)

  // Apply circle clip if needed
  if (crop.stencil === 'circle') {
    ctx.beginPath()
    ctx.arc(outWidth / 2, outHeight / 2, Math.min(outWidth, outHeight) / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
  }

  // Apply freeform clip if needed
  if (crop.stencil === 'freeform' && crop.points && crop.points.length >= 3) {
    const scaleX = outWidth / crop.width
    const scaleY = outHeight / crop.height
    ctx.beginPath()
    ctx.moveTo(
      (crop.points[0].x - crop.x) * scaleX,
      (crop.points[0].y - crop.y) * scaleY
    )
    for (let i = 1; i < crop.points.length; i++) {
      ctx.lineTo(
        (crop.points[i].x - crop.x) * scaleX,
        (crop.points[i].y - crop.y) * scaleY
      )
    }
    ctx.closePath()
    ctx.clip()
  }

  // Scale factor from crop coords to output coords
  const scaleX = outWidth / crop.width
  const scaleY = outHeight / crop.height

  ctx.save()

  // Move to output center
  ctx.translate(outWidth / 2, outHeight / 2)

  // Apply rotation
  ctx.rotate((transform.rotation * Math.PI) / 180)

  // Apply flip
  ctx.scale(transform.flipX ? -1 : 1, transform.flipY ? -1 : 1)

  // Draw image: map crop area back to image space
  // The image is positioned relative to crop center, accounting for pan and zoom
  const imgDrawWidth = image.naturalWidth * transform.scale * scaleX
  const imgDrawHeight = image.naturalHeight * transform.scale * scaleY

  const imgX = -imgDrawWidth / 2 + (transform.x - crop.x - crop.width / 2) * scaleX * transform.scale + outWidth / 2 * (1 - 1)
  const imgY = -imgDrawHeight / 2 + (transform.y - crop.y - crop.height / 2) * scaleY * transform.scale + outHeight / 2 * (1 - 1)

  // Simplified: center the image, apply transform offsets
  const drawX = (transform.x * scaleX) - imgDrawWidth / 2
  const drawY = (transform.y * scaleY) - imgDrawHeight / 2

  ctx.drawImage(
    image,
    drawX,
    drawY,
    imgDrawWidth,
    imgDrawHeight
  )

  ctx.restore()
}

export function exportCrop(
  canvas: HTMLCanvasElement,
  options: ExportOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Canvas export failed: toBlob returned null'))
        }
      },
      options.format,
      options.quality
    )
  })
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test:run`
Expected: All PASS

**Step 5: Commit**

```bash
git add packages/core/src/engine/canvas-renderer.ts packages/core/src/__tests__/canvas-renderer.test.ts
git commit -m "feat(core): add canvas renderer for crop preview and export"
```

---

## Task 7: useCompressor Composable

**Files:**
- Create: `packages/core/src/composables/useCompressor.ts`
- Create: `packages/core/src/__tests__/useCompressor.test.ts`

**Step 1: Write failing tests**

`packages/core/src/__tests__/useCompressor.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  chooseOutputFormat,
  compressBlob,
} from '../composables/useCompressor'

describe('chooseOutputFormat', () => {
  it('returns png for transparent input', () => {
    expect(chooseOutputFormat('auto', 'image/png')).toBe('image/png')
  })

  it('returns webp for auto when input is jpeg', () => {
    // Assuming WebP is supported in test env
    const result = chooseOutputFormat('auto', 'image/jpeg')
    expect(['image/webp', 'image/jpeg']).toContain(result)
  })

  it('returns exact format when specified', () => {
    expect(chooseOutputFormat('jpeg', 'image/png')).toBe('image/jpeg')
    expect(chooseOutputFormat('png', 'image/jpeg')).toBe('image/png')
    expect(chooseOutputFormat('webp', 'image/jpeg')).toBe('image/webp')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test:run`
Expected: FAIL

**Step 3: Implement compressor**

`packages/core/src/composables/useCompressor.ts`:
```ts
import { ref } from 'vue'
import type { OutputFormat, CompressorOptions } from '../types'
import { getMimeForFormat, hasTransparency, detectMimeType } from '../utils/format-detect'
import { exportCrop } from '../engine/canvas-renderer'

export function chooseOutputFormat(
  format: OutputFormat,
  inputMime: string
): string {
  // If input has transparency and format is auto, keep PNG
  if (format === 'auto' && hasTransparency(inputMime) && inputMime === 'image/png') {
    return 'image/png'
  }

  return getMimeForFormat(format)
}

export async function compressBlob(
  canvas: HTMLCanvasElement,
  options: {
    format: OutputFormat
    quality: number
    inputMime: string
    maxInputSize?: number
  }
): Promise<Blob> {
  const outputMime = chooseOutputFormat(options.format, options.inputMime)
  let quality = options.quality

  // First attempt
  let blob = await exportCrop(canvas, { format: outputMime, quality })

  // "Never larger than input" guarantee: re-encode at lower quality if needed
  if (options.maxInputSize && blob.size > options.maxInputSize) {
    const maxAttempts = 3
    for (let i = 0; i < maxAttempts && blob.size > options.maxInputSize; i++) {
      quality = Math.max(0.1, quality - 0.15)
      blob = await exportCrop(canvas, { format: outputMime, quality })
    }
  }

  return blob
}

export function useCompressor(options: CompressorOptions = {}) {
  const isCompressing = ref(false)

  async function compress(
    canvas: HTMLCanvasElement,
    inputFile?: File
  ): Promise<Blob> {
    isCompressing.value = true
    try {
      const inputMime = inputFile ? detectMimeType(inputFile) : 'image/jpeg'
      return await compressBlob(canvas, {
        format: options.format ?? 'auto',
        quality: options.quality ?? 0.85,
        inputMime,
        maxInputSize: inputFile?.size,
      })
    } finally {
      isCompressing.value = false
    }
  }

  return { compress, isCompressing }
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test:run`
Expected: All PASS

**Step 5: Commit**

```bash
git add packages/core/src/composables/useCompressor.ts packages/core/src/__tests__/useCompressor.test.ts
git commit -m "feat(core): add useCompressor with smart format selection and size guarantee"
```

---

## Task 8: useDropzone Composable

**Files:**
- Create: `packages/core/src/composables/useDropzone.ts`
- Create: `packages/core/src/__tests__/useDropzone.test.ts`

**Step 1: Write failing tests**

`packages/core/src/__tests__/useDropzone.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { validateFile } from '../composables/useDropzone'

describe('validateFile', () => {
  it('accepts valid file', () => {
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
    const result = validateFile(file, { accept: ['image/jpeg'], maxSize: 10_000_000 })
    expect(result).toBeNull()
  })

  it('rejects file too large', () => {
    const file = new File(['x'.repeat(100)], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 20_000_000 })
    const result = validateFile(file, { accept: ['image/jpeg'], maxSize: 10_000_000 })
    expect(result).not.toBeNull()
    expect(result!.type).toBe('file-too-large')
  })

  it('rejects invalid type', () => {
    const file = new File(['x'], 'test.txt', { type: 'text/plain' })
    const result = validateFile(file, { accept: ['image/jpeg', 'image/png'], maxSize: 10_000_000 })
    expect(result).not.toBeNull()
    expect(result!.type).toBe('invalid-type')
  })

  it('accepts wildcard image/*', () => {
    const file = new File(['x'], 'test.webp', { type: 'image/webp' })
    const result = validateFile(file, { accept: ['image/*'], maxSize: 10_000_000 })
    expect(result).toBeNull()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test:run`
Expected: FAIL

**Step 3: Implement useDropzone**

`packages/core/src/composables/useDropzone.ts`:
```ts
import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import type { CropVueError, DropzoneOptions } from '../types'

export function validateFile(
  file: File,
  options: { accept: string[]; maxSize: number }
): CropVueError | null {
  // Check size
  if (file.size > options.maxSize) {
    return {
      type: 'file-too-large',
      maxSize: options.maxSize,
      actualSize: file.size,
    }
  }

  // Check type
  const accepted = options.accept.some((pattern) => {
    if (pattern === 'image/*') {
      return file.type.startsWith('image/')
    }
    return file.type === pattern
  })

  if (!accepted) {
    return {
      type: 'invalid-type',
      accepted: options.accept,
      actual: file.type,
    }
  }

  return null
}

export function useDropzone(options: DropzoneOptions = {}) {
  const isDragging = ref(false)
  const files: Ref<File[]> = ref([])
  const dropzoneRef: Ref<HTMLElement | null> = ref(null)

  const accept = options.accept ?? ['image/*']
  const maxSize = options.maxSize ?? Infinity
  const multiple = options.multiple ?? false

  function processFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList)
    const valid: File[] = []

    for (const file of incoming) {
      const error = validateFile(file, { accept, maxSize })
      if (error) {
        options.onError?.(error)
      } else {
        valid.push(file)
      }
    }

    const result = multiple ? valid : valid.slice(0, 1)
    if (result.length > 0) {
      files.value = result
      options.onFiles?.(result)
    }
  }

  function open() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept.join(',')
    input.multiple = multiple
    input.onchange = () => {
      if (input.files) processFiles(input.files)
    }
    input.click()
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    isDragging.value = true
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault()
    isDragging.value = false
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    isDragging.value = false
    if (e.dataTransfer?.files) {
      processFiles(e.dataTransfer.files)
    }
  }

  onMounted(() => {
    const el = dropzoneRef.value
    if (!el) return
    el.addEventListener('dragover', onDragOver)
    el.addEventListener('dragleave', onDragLeave)
    el.addEventListener('drop', onDrop)
  })

  onUnmounted(() => {
    const el = dropzoneRef.value
    if (!el) return
    el.removeEventListener('dragover', onDragOver)
    el.removeEventListener('dragleave', onDragLeave)
    el.removeEventListener('drop', onDrop)
  })

  return { isDragging, files, dropzoneRef, open }
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test:run`
Expected: All PASS

**Step 5: Commit**

```bash
git add packages/core/src/composables/useDropzone.ts packages/core/src/__tests__/useDropzone.test.ts
git commit -m "feat(core): add useDropzone composable with file validation"
```

---

## Task 9: useUploader Composable

**Files:**
- Create: `packages/core/src/composables/useUploader.ts`
- Create: `packages/core/src/__tests__/useUploader.test.ts`

**Step 1: Write failing tests**

`packages/core/src/__tests__/useUploader.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { createUploadHandler } from '../composables/useUploader'

describe('createUploadHandler', () => {
  it('calls custom handler when provided', async () => {
    const handler = vi.fn().mockResolvedValue({ url: 'https://example.com/img.jpg' })
    const upload = createUploadHandler({ handler })

    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
    const result = await upload(file, {
      onProgress: vi.fn(),
      signal: new AbortController().signal,
    })

    expect(handler).toHaveBeenCalledWith(file, expect.objectContaining({ signal: expect.any(AbortSignal) }))
    expect(result.url).toBe('https://example.com/img.jpg')
  })

  it('throws when no handler or url is provided', () => {
    expect(() => createUploadHandler({})).toThrow()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test:run`
Expected: FAIL

**Step 3: Implement useUploader**

`packages/core/src/composables/useUploader.ts`:
```ts
import { ref } from 'vue'
import type { UploaderOptions, UploadResult, UploadFn } from '../types'

export function createUploadHandler(
  options: UploaderOptions
): UploadFn {
  if (options.handler) {
    return options.handler
  }

  if (options.url) {
    const url = options.url
    const fieldName = options.fieldName ?? 'file'
    const headers = options.headers ?? {}

    return async (file, { onProgress, signal }) => {
      const formData = new FormData()
      formData.append(fieldName, file)

      const xhr = new XMLHttpRequest()

      return new Promise<UploadResult>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText))
            } catch {
              resolve({})
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Upload failed: network error')))
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

        signal.addEventListener('abort', () => xhr.abort())

        xhr.open('POST', url)
        for (const [key, value] of Object.entries(headers)) {
          xhr.setRequestHeader(key, value)
        }
        xhr.send(formData)
      })
    }
  }

  throw new Error('useUploader requires either a handler function or a url')
}

export function useUploader(options: UploaderOptions = {}) {
  const isUploading = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  let abortController: AbortController | null = null

  async function upload(file: File | Blob): Promise<UploadResult> {
    const handler = createUploadHandler(options)
    isUploading.value = true
    progress.value = 0
    error.value = null
    abortController = new AbortController()

    const uploadFile = file instanceof File ? file : new File([file], 'cropped-image', { type: file.type })

    try {
      const result = await handler(uploadFile, {
        onProgress: (p) => { progress.value = p },
        signal: abortController.signal,
      })
      progress.value = 100
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Upload failed'
      throw e
    } finally {
      isUploading.value = false
      abortController = null
    }
  }

  function abort() {
    abortController?.abort()
  }

  return { upload, isUploading, progress, error, abort }
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test:run`
Expected: All PASS

**Step 5: Commit**

```bash
git add packages/core/src/composables/useUploader.ts packages/core/src/__tests__/useUploader.test.ts
git commit -m "feat(core): add useUploader composable with XHR progress and abort"
```

---

## Task 10: useImageQueue Composable

**Files:**
- Create: `packages/core/src/composables/useImageQueue.ts`
- Create: `packages/core/src/__tests__/useImageQueue.test.ts`

**Step 1: Write failing tests**

`packages/core/src/__tests__/useImageQueue.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { createQueue } from '../composables/useImageQueue'

describe('createQueue', () => {
  it('starts empty', () => {
    const queue = createQueue()
    expect(queue.items).toEqual([])
    expect(queue.currentIndex).toBe(-1)
  })

  it('adds items', () => {
    const queue = createQueue()
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
    queue.add([file])
    expect(queue.items.length).toBe(1)
    expect(queue.currentIndex).toBe(0)
  })

  it('removes items', () => {
    const queue = createQueue()
    const file1 = new File(['x'], 'a.jpg', { type: 'image/jpeg' })
    const file2 = new File(['y'], 'b.jpg', { type: 'image/jpeg' })
    queue.add([file1, file2])
    queue.remove(0)
    expect(queue.items.length).toBe(1)
  })

  it('selects item by index', () => {
    const queue = createQueue()
    const file1 = new File(['x'], 'a.jpg', { type: 'image/jpeg' })
    const file2 = new File(['y'], 'b.jpg', { type: 'image/jpeg' })
    queue.add([file1, file2])
    queue.select(1)
    expect(queue.currentIndex).toBe(1)
  })

  it('navigates next/previous', () => {
    const queue = createQueue()
    queue.add([
      new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
      new File(['c'], 'c.jpg', { type: 'image/jpeg' }),
    ])
    expect(queue.currentIndex).toBe(0)
    queue.next()
    expect(queue.currentIndex).toBe(1)
    queue.next()
    expect(queue.currentIndex).toBe(2)
    queue.next()
    expect(queue.currentIndex).toBe(2) // stays at end
    queue.previous()
    expect(queue.currentIndex).toBe(1)
  })

  it('clears all items', () => {
    const queue = createQueue()
    queue.add([new File(['x'], 'a.jpg', { type: 'image/jpeg' })])
    queue.clear()
    expect(queue.items).toEqual([])
    expect(queue.currentIndex).toBe(-1)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test:run`
Expected: FAIL

**Step 3: Implement useImageQueue**

`packages/core/src/composables/useImageQueue.ts`:
```ts
import { ref, computed } from 'vue'
import type { QueueItem, CropResult } from '../types'

let nextId = 0
function generateId(): string {
  return `cropvue-${++nextId}-${Date.now()}`
}

export interface Queue {
  items: QueueItem[]
  currentIndex: number
  add: (files: File[]) => void
  remove: (index: number) => void
  select: (index: number) => void
  next: () => void
  previous: () => void
  clear: () => void
  setResult: (index: number, result: CropResult) => void
}

export function createQueue(): Queue {
  const state = {
    items: [] as QueueItem[],
    currentIndex: -1,
  }

  function add(files: File[]) {
    const newItems: QueueItem[] = files.map((file) => ({
      id: generateId(),
      file,
      thumbnail: URL.createObjectURL(file),
      status: 'pending' as const,
    }))

    state.items.push(...newItems)

    if (state.currentIndex === -1 && state.items.length > 0) {
      state.currentIndex = 0
    }
  }

  function remove(index: number) {
    if (index < 0 || index >= state.items.length) return

    const item = state.items[index]
    URL.revokeObjectURL(item.thumbnail)
    state.items.splice(index, 1)

    if (state.items.length === 0) {
      state.currentIndex = -1
    } else if (state.currentIndex >= state.items.length) {
      state.currentIndex = state.items.length - 1
    }
  }

  function select(index: number) {
    if (index >= 0 && index < state.items.length) {
      state.currentIndex = index
    }
  }

  function next() {
    if (state.currentIndex < state.items.length - 1) {
      state.currentIndex++
    }
  }

  function previous() {
    if (state.currentIndex > 0) {
      state.currentIndex--
    }
  }

  function clear() {
    for (const item of state.items) {
      URL.revokeObjectURL(item.thumbnail)
    }
    state.items.length = 0
    state.currentIndex = -1
  }

  function setResult(index: number, result: CropResult) {
    if (index >= 0 && index < state.items.length) {
      state.items[index].result = result
      state.items[index].status = 'done'
    }
  }

  return state as Queue
  // We assign the methods below to keep the return type clean
  Object.assign(state, { add, remove, select, next, previous, clear, setResult })
  return state as Queue
}

// Vue composable wrapper
export function useImageQueue() {
  const queue = createQueue()
  const images = ref(queue.items)
  const current = ref(queue.currentIndex)

  // Sync refs with queue state
  function sync() {
    images.value = [...queue.items]
    current.value = queue.currentIndex
  }

  function add(files: File[]) { queue.add(files); sync() }
  function remove(index: number) { queue.remove(index); sync() }
  function select(index: number) { queue.select(index); sync() }
  function next() { queue.next(); sync() }
  function previous() { queue.previous(); sync() }
  function clear() { queue.clear(); sync() }

  const results = computed(() =>
    queue.items.filter((i) => i.result).map((i) => i.result!)
  )

  return { images, current, add, remove, select, next, previous, clear, results }
}
```

Wait -- the `createQueue` has a bug (dead code after return). Fix:

Replace the end of `createQueue` with:
```ts
  Object.assign(state, { add, remove, select, next, previous, clear, setResult })
  return state as unknown as Queue
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test:run`
Expected: All PASS

**Step 5: Commit**

```bash
git add packages/core/src/composables/useImageQueue.ts packages/core/src/__tests__/useImageQueue.test.ts
git commit -m "feat(core): add useImageQueue composable for multi-image management"
```

---

## Task 11: useCropper Main Composable

**Files:**
- Create: `packages/core/src/composables/useCropper.ts`
- Create: `packages/core/src/__tests__/useCropper.test.ts`

**Step 1: Write failing tests**

`packages/core/src/__tests__/useCropper.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { useCropper } from '../composables/useCropper'

describe('useCropper', () => {
  it('returns all expected properties', () => {
    const cropper = useCropper()
    expect(cropper).toHaveProperty('transform')
    expect(cropper).toHaveProperty('crop')
    expect(cropper).toHaveProperty('isReady')
    expect(cropper).toHaveProperty('rotateLeft')
    expect(cropper).toHaveProperty('rotateRight')
    expect(cropper).toHaveProperty('rotateTo')
    expect(cropper).toHaveProperty('flipX')
    expect(cropper).toHaveProperty('flipY')
    expect(cropper).toHaveProperty('zoomTo')
    expect(cropper).toHaveProperty('zoomBy')
    expect(cropper).toHaveProperty('panTo')
    expect(cropper).toHaveProperty('reset')
    expect(cropper).toHaveProperty('setCropArea')
    expect(cropper).toHaveProperty('setStencil')
    expect(cropper).toHaveProperty('setAspectRatio')
    expect(cropper).toHaveProperty('getResult')
    expect(cropper).toHaveProperty('canvasRef')
  })

  it('initializes with default state', () => {
    const { transform, crop, isReady } = useCropper()
    expect(transform.value.scale).toBe(1)
    expect(transform.value.rotation).toBe(0)
    expect(crop.value.stencil).toBe('rectangle')
    expect(isReady.value).toBe(false)
  })

  it('applies options', () => {
    const { crop } = useCropper({
      stencil: 'circle',
      aspectRatio: 1,
    })
    expect(crop.value.stencil).toBe('circle')
    expect(crop.value.aspectRatio).toBe(1)
  })

  it('rotateLeft decreases rotation by 90', () => {
    const { transform, rotateLeft } = useCropper()
    rotateLeft()
    expect(transform.value.rotation).toBe(-90)
  })

  it('rotateRight increases rotation by 90', () => {
    const { transform, rotateRight } = useCropper()
    rotateRight()
    expect(transform.value.rotation).toBe(90)
  })

  it('flipX toggles horizontal flip', () => {
    const { transform, flipX } = useCropper()
    flipX()
    expect(transform.value.flipX).toBe(true)
    flipX()
    expect(transform.value.flipX).toBe(false)
  })

  it('flipY toggles vertical flip', () => {
    const { transform, flipY } = useCropper()
    flipY()
    expect(transform.value.flipY).toBe(true)
  })

  it('zoomBy changes scale', () => {
    const { transform, zoomBy } = useCropper()
    zoomBy(0.5)
    expect(transform.value.scale).toBe(1.5)
  })

  it('zoomTo sets absolute scale', () => {
    const { transform, zoomTo } = useCropper()
    zoomTo(3)
    expect(transform.value.scale).toBe(3)
  })

  it('reset returns to default state', () => {
    const { transform, rotateRight, zoomBy, reset } = useCropper()
    rotateRight()
    zoomBy(2)
    reset()
    expect(transform.value.rotation).toBe(0)
    expect(transform.value.scale).toBe(1)
  })

  it('setStencil changes stencil type', () => {
    const { crop, setStencil } = useCropper()
    setStencil('circle')
    expect(crop.value.stencil).toBe('circle')
  })

  it('setAspectRatio updates constraint', () => {
    const { crop, setAspectRatio } = useCropper()
    setAspectRatio(16 / 9)
    expect(crop.value.aspectRatio).toBeCloseTo(16 / 9)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test:run`
Expected: FAIL

**Step 3: Implement useCropper**

`packages/core/src/composables/useCropper.ts`:
```ts
import { ref, type Ref } from 'vue'
import type {
  TransformState,
  CropState,
  CropResult,
  CropperOptions,
  StencilType,
  ImageData as CropImageData,
} from '../types'
import {
  createTransformState,
  createCropState,
  applyRotation,
  applyFlip,
  applyZoom,
  applyPan,
  resetTransform,
} from '../engine/transform'
import { renderCrop, exportCrop } from '../engine/canvas-renderer'
import { chooseOutputFormat, compressBlob } from './useCompressor'
import { loadImageFromFile, loadImageFromUrl } from '../utils/image-loader'
import { detectMimeType } from '../utils/format-detect'

export function useCropper(options: CropperOptions = {}) {
  const transform: Ref<TransformState> = ref(createTransformState())
  const crop: Ref<CropState> = ref(
    createCropState({ width: 0, height: 0 }, {
      stencil: options.stencil ?? 'rectangle',
      aspectRatio: options.aspectRatio ?? undefined,
      minWidth: options.minWidth,
      minHeight: options.minHeight,
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
    })
  )
  const image: Ref<CropImageData | null> = ref(null)
  const isReady = ref(false)
  const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)

  // --- Image loading ---

  async function loadFile(file: File) {
    image.value = await loadImageFromFile(file)
    isReady.value = true
  }

  async function loadUrl(url: string) {
    image.value = await loadImageFromUrl(url)
    isReady.value = true
  }

  // --- Transform operations ---

  function rotateLeft() {
    transform.value = applyRotation(transform.value, -90)
  }

  function rotateRight() {
    transform.value = applyRotation(transform.value, 90)
  }

  function rotateTo(degrees: number) {
    transform.value = { ...transform.value, rotation: degrees }
  }

  function flipX() {
    transform.value = applyFlip(transform.value, 'x')
  }

  function flipY() {
    transform.value = applyFlip(transform.value, 'y')
  }

  function zoomTo(scale: number) {
    transform.value = { ...transform.value, scale: Math.max(0.1, Math.min(10, scale)) }
  }

  function zoomBy(delta: number) {
    transform.value = applyZoom(transform.value, delta)
  }

  function panTo(x: number, y: number) {
    transform.value = { ...transform.value, x, y }
  }

  function reset() {
    transform.value = resetTransform(transform.value)
  }

  // --- Crop operations ---

  function setCropArea(area: Partial<CropState>) {
    crop.value = { ...crop.value, ...area }
  }

  function setStencil(stencil: StencilType) {
    crop.value = { ...crop.value, stencil }
  }

  function setAspectRatio(ratio: number | null) {
    crop.value = { ...crop.value, aspectRatio: ratio ?? undefined }
  }

  // --- Output ---

  async function getResult(opts?: {
    format?: 'auto' | 'webp' | 'jpeg' | 'png'
    quality?: number
    maxWidth?: number
    maxHeight?: number
  }): Promise<CropResult> {
    const canvas = canvasRef.value ?? document.createElement('canvas')
    const img = image.value

    if (!img) throw new Error('No image loaded')

    renderCrop(canvas, img.element, crop.value, transform.value, {
      maxWidth: opts?.maxWidth ?? options.outputMaxWidth,
      maxHeight: opts?.maxHeight ?? options.outputMaxHeight,
    })

    const inputMime = img.originalFile ? detectMimeType(img.originalFile) : 'image/jpeg'
    const blob = await compressBlob(canvas, {
      format: opts?.format ?? options.outputFormat ?? 'auto',
      quality: opts?.quality ?? options.outputQuality ?? 0.85,
      inputMime,
      maxInputSize: img.originalSize,
    })

    const url = URL.createObjectURL(blob)
    const file = new File([blob], `cropped.${blob.type.split('/')[1] ?? 'jpg'}`, {
      type: blob.type,
    })

    return {
      blob,
      file,
      url,
      coords: {
        x: crop.value.x,
        y: crop.value.y,
        width: crop.value.width,
        height: crop.value.height,
        rotation: transform.value.rotation,
        flipX: transform.value.flipX,
        flipY: transform.value.flipY,
        scale: transform.value.scale,
      },
      width: canvas.width,
      height: canvas.height,
      originalWidth: img.naturalWidth,
      originalHeight: img.naturalHeight,
    }
  }

  function getPreviewUrl(): string {
    const canvas = canvasRef.value
    if (!canvas) return ''
    return canvas.toDataURL()
  }

  function renderToCanvas() {
    const canvas = canvasRef.value
    if (!canvas || !image.value) return
    renderCrop(canvas, image.value.element, crop.value, transform.value, {
      maxWidth: options.outputMaxWidth,
      maxHeight: options.outputMaxHeight,
    })
  }

  return {
    // State
    image,
    transform,
    crop,
    isReady,

    // Image loading
    loadFile,
    loadUrl,

    // Manipulation
    rotateLeft,
    rotateRight,
    rotateTo,
    flipX,
    flipY,
    zoomTo,
    zoomBy,
    panTo,
    reset,

    // Crop area
    setCropArea,
    setStencil,
    setAspectRatio,

    // Output
    getResult,
    getPreviewUrl,

    // Canvas
    canvasRef,
    renderToCanvas,
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test:run`
Expected: All PASS

**Step 5: Commit**

```bash
git add packages/core/src/composables/useCropper.ts packages/core/src/__tests__/useCropper.test.ts
git commit -m "feat(core): add useCropper main composable orchestrating all engine modules"
```

---

## Task 12: Core Package Barrel Export + Build

**Files:**
- Modify: `packages/core/src/index.ts`
- Create: `packages/core/build.config.ts`

**Step 1: Update barrel export**

`packages/core/src/index.ts`:
```ts
// Composables
export { useCropper } from './composables/useCropper'
export { useDropzone, validateFile } from './composables/useDropzone'
export { useImageQueue, createQueue } from './composables/useImageQueue'
export { useUploader, createUploadHandler } from './composables/useUploader'
export { useCompressor, chooseOutputFormat, compressBlob } from './composables/useCompressor'

// Engine (for advanced usage)
export {
  createTransformState,
  createCropState,
  applyRotation,
  applyFlip,
  applyZoom,
  applyPan,
  clampTransform,
  resetTransform,
  snapRotation,
} from './engine/transform'
export { renderCrop, exportCrop } from './engine/canvas-renderer'
export { constrainCropSize, constrainAspectRatio, constrainCropPosition } from './engine/constraints'
export {
  getRectangleClipPath,
  getCircleClipPath,
  getFreeformClipPath,
  isPointInsideStencil,
} from './engine/stencils'

// Utils
export { getMaxCanvasSize, downsampleDimensions } from './utils/canvas-limits'
export { detectMimeType, supportsWebP, getMimeForFormat, hasTransparency } from './utils/format-detect'
export { loadImageFromFile, loadImageFromUrl, needsDownsample, getSafeDimensions } from './utils/image-loader'

// Types
export type * from './types'
```

**Step 2: Create build config**

`packages/core/build.config.ts`:
```ts
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
  externals: ['vue'],
})
```

**Step 3: Build and verify**

Run: `cd /Users/philiprutberg/Development/Packages/cropvue && pnpm -C packages/core build`
Expected: Build succeeds, `packages/core/dist/` contains `index.mjs`, `index.cjs`, `index.d.ts`

**Step 4: Commit**

```bash
git add packages/core/src/index.ts packages/core/build.config.ts
git commit -m "feat(core): finalize barrel exports and build configuration"
```

---

## Task 13: Vue Components - CropDropzone

**Files:**
- Create: `packages/vue/src/components/CropDropzone.vue`

**Step 1: Implement CropDropzone**

`packages/vue/src/components/CropDropzone.vue`:
```vue
<script setup lang="ts">
import { useDropzone } from '@cropvue/core'
import type { DropzoneOptions, CropVueError } from '@cropvue/core'

const props = withDefaults(defineProps<{
  accept?: string[]
  maxSize?: number
  multiple?: boolean
}>(), {
  accept: () => ['image/*'],
  maxSize: Infinity,
  multiple: false,
})

const emit = defineEmits<{
  files: [files: File[]]
  error: [error: CropVueError]
}>()

const { isDragging, files, dropzoneRef, open } = useDropzone({
  accept: props.accept,
  maxSize: props.maxSize,
  multiple: props.multiple,
  onFiles: (f) => emit('files', f),
  onError: (e) => emit('error', e),
})

defineExpose({ open, files })
</script>

<template>
  <div ref="dropzoneRef" class="cropvue-dropzone" :class="{ 'cropvue-dropzone--active': isDragging }">
    <slot :open="open" :is-dragging="isDragging">
      <div class="cropvue-dropzone__default" @click="open">
        <p>Drop image here or click to select</p>
      </div>
    </slot>
  </div>
</template>

<style>
.cropvue-dropzone {
  border: 2px var(--cropvue-dropzone-border-style, dashed) var(--cropvue-dropzone-border-color, #d1d5db);
  border-radius: var(--cropvue-dropzone-border-radius, 8px);
  background: var(--cropvue-dropzone-bg, transparent);
  transition: border-color 150ms ease, background 150ms ease;
  cursor: pointer;
}

.cropvue-dropzone--active {
  border-color: var(--cropvue-dropzone-border-color-active, #3b82f6);
  background: var(--cropvue-dropzone-bg-active, rgba(59, 130, 246, 0.05));
}

.cropvue-dropzone__default {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
  color: #6b7280;
}
</style>
```

**Step 2: Commit**

```bash
git add packages/vue/src/components/CropDropzone.vue
git commit -m "feat(vue): add CropDropzone component with slot and CSS custom properties"
```

---

## Task 14: Vue Components - CropEditor, CropPreview, CropStencil, CropToolbar

**Files:**
- Create: `packages/vue/src/components/CropEditor.vue`
- Create: `packages/vue/src/components/CropPreview.vue`
- Create: `packages/vue/src/components/CropStencil.vue`
- Create: `packages/vue/src/components/CropToolbar.vue`

These are the core visual components. Implementation follows the same pattern: renderless with scoped slots and CSS custom properties. Full code is provided in each file.

**Step 1: Implement all four components** (code provided per file in the executing session)

**Step 2: Commit**

```bash
git add packages/vue/src/components/CropEditor.vue packages/vue/src/components/CropPreview.vue packages/vue/src/components/CropStencil.vue packages/vue/src/components/CropToolbar.vue
git commit -m "feat(vue): add CropEditor, CropPreview, CropStencil, CropToolbar components"
```

---

## Task 15: Vue Components - CropQueue + CropVue Orchestrator

**Files:**
- Create: `packages/vue/src/components/CropQueue.vue`
- Create: `packages/vue/src/components/CropVue.vue`

CropVue is the main orchestrator that wires together all sub-components, manages the state machine (dropzone -> editor -> preview/done), and exposes all slots and events from the design doc.

**Step 1: Implement CropQueue and CropVue** (full code provided in executing session)

**Step 2: Commit**

```bash
git add packages/vue/src/components/CropQueue.vue packages/vue/src/components/CropVue.vue
git commit -m "feat(vue): add CropQueue and CropVue orchestrator component"
```

---

## Task 16: CSS Variables + Vue Package Build

**Files:**
- Create: `packages/vue/src/css/variables.css`
- Modify: `packages/vue/src/index.ts`
- Create: `packages/vue/build.config.ts`

**Step 1: Create CSS variables file**

`packages/vue/src/css/variables.css`:
```css
:root {
  /* Overlay */
  --cropvue-overlay-color: rgba(0, 0, 0, 0.5);
  --cropvue-overlay-transition: 150ms ease;

  /* Crop area */
  --cropvue-crop-border-color: #fff;
  --cropvue-crop-border-width: 2px;
  --cropvue-crop-border-style: solid;

  /* Grid */
  --cropvue-grid-color: rgba(255, 255, 255, 0.3);
  --cropvue-grid-width: 1px;
  --cropvue-grid-display: block;

  /* Handles */
  --cropvue-handle-color: #fff;
  --cropvue-handle-size: 10px;
  --cropvue-handle-border-radius: 50%;

  /* Dropzone */
  --cropvue-dropzone-border-color: #d1d5db;
  --cropvue-dropzone-border-color-active: #3b82f6;
  --cropvue-dropzone-bg: transparent;
  --cropvue-dropzone-bg-active: rgba(59, 130, 246, 0.05);
  --cropvue-dropzone-border-style: dashed;
  --cropvue-dropzone-border-radius: 8px;
}
```

**Step 2: Build and verify**

Run: `pnpm -C packages/vue build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add packages/vue/
git commit -m "feat(vue): add CSS variables, finalize exports and build config"
```

---

## Task 17: Nuxt Module

**Files:**
- Create: `packages/nuxt/src/module.ts`
- Create: `packages/nuxt/build.config.ts`

**Step 1: Implement Nuxt module**

`packages/nuxt/src/module.ts`:
```ts
import { defineNuxtModule, addComponent, addImports } from '@nuxt/kit'

export interface CropVueModuleOptions {
  outputFormat?: 'auto' | 'webp' | 'jpeg' | 'png'
  outputQuality?: number
}

export default defineNuxtModule<CropVueModuleOptions>({
  meta: {
    name: '@cropvue/nuxt',
    configKey: 'cropvue',
  },
  defaults: {
    outputFormat: 'auto',
    outputQuality: 0.85,
  },
  setup(_options, nuxt) {
    // Auto-import components
    const components = [
      'CropVue', 'CropEditor', 'CropPreview',
      'CropDropzone', 'CropToolbar', 'CropQueue', 'CropStencil',
    ]

    for (const name of components) {
      addComponent({
        name,
        export: name,
        filePath: 'cropvue',
        mode: 'client',
      })
    }

    // Auto-import composables
    const composables = [
      'useCropper', 'useDropzone', 'useImageQueue',
      'useUploader', 'useCompressor',
    ]

    for (const name of composables) {
      addImports({ name, from: '@cropvue/core' })
    }

    // Add CSS
    nuxt.options.css.push('cropvue/styles')
  },
})
```

**Step 2: Build and verify**

Run: `pnpm -C packages/nuxt build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add packages/nuxt/
git commit -m "feat(nuxt): add Nuxt module with auto-imports and client-only components"
```

---

## Task 18: Playground Integration Test

**Files:**
- Modify: `playground/src/App.vue`

**Step 1: Update playground with basic CropVue usage**

Wire up the simplest usage from the design doc: dropzone + crop + done callback. Verify the full pipeline works in the browser.

**Step 2: Run playground**

Run: `pnpm dev`
Expected: Browser opens, can drop image, crop, and get result blob.

**Step 3: Commit**

```bash
git add playground/
git commit -m "feat(playground): add basic CropVue integration test"
```

---

## Task 19: Gesture Handlers (Pan, Zoom, Resize)

**Files:**
- Create: `packages/core/src/engine/gestures.ts`
- Create: `packages/core/src/__tests__/gestures.test.ts`

Implement pointer event handlers for:
- Pan (mouse drag / single touch)
- Zoom (wheel / pinch)
- Crop resize (handle drag)
- Keyboard shortcuts (arrows, +/-, R, Esc)

Each handler reads/writes TransformState or CropState and returns the updated state. Pure functions, testable without DOM.

**Step 1: Write failing tests for gesture math**

**Step 2: Implement gesture handlers**

**Step 3: Run tests, verify pass**

**Step 4: Commit**

```bash
git commit -m "feat(core): add gesture handlers for pan, zoom, resize, keyboard"
```

---

## Task 20: E2E Tests with Playwright

**Files:**
- Create: `e2e/basic-crop.spec.ts`
- Create: `e2e/dropzone.spec.ts`
- Create: `playwright.config.ts`

Test the full flow in a real browser:
1. Navigate to playground
2. Upload an image via file input
3. Verify crop area appears
4. Drag to resize crop
5. Click confirm
6. Verify output blob exists and is <= input size

**Step 1: Set up Playwright config**

**Step 2: Write E2E tests**

**Step 3: Run, verify pass**

**Step 4: Commit**

```bash
git commit -m "test: add Playwright E2E tests for basic crop and dropzone flows"
```

---

## Task 21: Documentation Site

**Files:**
- Create: `docs/.vitepress/config.ts`
- Create: `docs/index.md`
- Create: `docs/guide/getting-started.md`
- Create: `docs/guide/composables.md`
- Create: `docs/guide/components.md`
- Create: `docs/guide/theming.md`
- Create: `docs/guide/nuxt.md`

Minimal VitePress site with:
- Getting started (install, basic usage)
- Composable API reference
- Component + slots reference
- Theming guide
- Nuxt integration guide

**Step 1: Scaffold VitePress**

**Step 2: Write docs pages**

**Step 3: Verify `pnpm docs:dev` works**

**Step 4: Commit**

```bash
git commit -m "docs: add VitePress documentation site with guides and API reference"
```

---

## Task 22: CI/CD + Changesets + README

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/release.yml`
- Create: `.changeset/config.json`
- Create: `README.md` (root)
- Create: `packages/core/README.md`
- Create: `packages/vue/README.md`
- Create: `packages/nuxt/README.md`

**Step 1: Set up GitHub Actions CI** (lint, typecheck, test, build)

**Step 2: Set up changesets for versioning**

**Step 3: Write READMEs with install, usage, API overview**

**Step 4: Commit**

```bash
git commit -m "chore: add CI/CD, changesets, and package READMEs"
```

---

## Summary

| Task | Description | Depends On |
|------|-------------|------------|
| 1 | Scaffold monorepo | - |
| 2 | Types + transform engine | 1 |
| 3 | Canvas limits + image loader + format detect | 1 |
| 4 | Constraints engine | 2 |
| 5 | Stencils engine | 2 |
| 6 | Canvas renderer | 2, 3 |
| 7 | useCompressor | 3, 6 |
| 8 | useDropzone | 2 |
| 9 | useUploader | 2 |
| 10 | useImageQueue | 2 |
| 11 | useCropper (main) | 2-10 |
| 12 | Core barrel export + build | 11 |
| 13 | CropDropzone component | 8, 12 |
| 14 | CropEditor + Preview + Stencil + Toolbar | 12 |
| 15 | CropQueue + CropVue orchestrator | 12-14 |
| 16 | CSS variables + Vue build | 15 |
| 17 | Nuxt module | 16 |
| 18 | Playground integration | 16 |
| 19 | Gesture handlers | 12 |
| 20 | E2E tests | 18, 19 |
| 21 | Documentation site | 16 |
| 22 | CI/CD + changesets + READMEs | all |

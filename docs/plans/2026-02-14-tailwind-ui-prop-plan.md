# Tailwind `ui` Prop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Nuxt UI-style `ui` prop to all 7 cropvue components for Tailwind class customization, with app-level theming via provide/inject and optional `tailwind-merge` support.

**Architecture:** Each component accepts a typed `ui` prop mapping element keys to class strings. A `useComponentUI` composable handles inject + merge logic. `createCropVueTheme()` Vue plugin provides app-level defaults. The user optionally passes a `merger` function (e.g., `twMerge`) for smart conflict resolution - zero library imports of tailwind-merge.

**Tech Stack:** Vue 3 (provide/inject, computed, defineProps), TypeScript, Vite library build

**Design Doc:** `docs/plans/2026-02-14-tailwind-ui-prop-design.md`

---

### Task 1: Create UI Type Definitions

**Files:**
- Create: `packages/vue/src/types/ui.ts`

**Step 1: Create the types file**

```ts
// packages/vue/src/types/ui.ts

export interface CropVueUI {
  root?: string
  dropzone?: string
  dropzoneActive?: string
  actions?: string
  cancelButton?: string
  confirmButton?: string
  done?: string
  resultImage?: string
}

export interface CropEditorUI {
  root?: string
  viewport?: string
  image?: string
  overlay?: string
  cropArea?: string
  grid?: string
  gridLine?: string
  handle?: string
}

export interface CropToolbarUI {
  root?: string
  default?: string
  button?: string
  separator?: string
}

export interface CropDropzoneUI {
  root?: string
  default?: string
}

export interface CropPreviewUI {
  root?: string
  canvas?: string
}

export interface CropQueueUI {
  root?: string
  list?: string
  item?: string
  itemActive?: string
  thumbnail?: string
  removeButton?: string
  checkIcon?: string
}

export interface CropStencilUI {
  root?: string
  shape?: string
}

export interface CropVueTheme {
  CropVue?: CropVueUI
  CropEditor?: CropEditorUI
  CropToolbar?: CropToolbarUI
  CropDropzone?: CropDropzoneUI
  CropPreview?: CropPreviewUI
  CropQueue?: CropQueueUI
  CropStencil?: CropStencilUI
}
```

**Step 2: Verify types compile**

Run: `cd packages/vue && npx vue-tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/vue/src/types/ui.ts
git commit -m "feat(vue): add UI type definitions for Tailwind customization"
```

---

### Task 2: Create Class Merging Utility

**Files:**
- Create: `packages/vue/src/utils/merge-classes.ts`

**Step 1: Create the merge utility**

This utility takes an optional `merger` function (provided by the theme system). When no merger is provided, classes are concatenated with a space. When a merger like `twMerge` is provided, it handles Tailwind class conflicts.

```ts
// packages/vue/src/utils/merge-classes.ts

/**
 * Merge two class strings. If a merger function is provided (e.g., twMerge),
 * it handles Tailwind class conflict resolution. Otherwise, naive concatenation.
 */
export function mergeClasses(
  merger: ((...classes: string[]) => string) | undefined,
  ...classes: (string | undefined | false)[]
): string {
  const filtered = classes.filter(Boolean) as string[]
  if (filtered.length === 0) return ''
  if (filtered.length === 1) return filtered[0]
  if (merger) return merger(...filtered)
  return filtered.join(' ')
}
```

**Step 2: Verify types compile**

Run: `cd packages/vue && npx vue-tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/vue/src/utils/merge-classes.ts
git commit -m "feat(vue): add mergeClasses utility with optional merger support"
```

---

### Task 3: Create Theme Provider + useComponentUI Composable

**Files:**
- Create: `packages/vue/src/theme/index.ts`
- Create: `packages/vue/src/composables/useComponentUI.ts`

**Step 1: Create the theme provider**

```ts
// packages/vue/src/theme/index.ts
import type { App, InjectionKey } from 'vue'
import type { CropVueTheme } from '../types/ui'

export interface CropVueThemeConfig extends CropVueTheme {
  /** Optional class merger function (e.g., twMerge from tailwind-merge) */
  merger?: (...classes: string[]) => string
}

export const CROPVUE_THEME_KEY: InjectionKey<CropVueThemeConfig> = Symbol('cropvue-theme')

/**
 * Create a CropVue theme plugin for Vue.
 *
 * @example
 * // Basic usage (naive class concatenation)
 * app.use(createCropVueTheme({
 *   CropEditor: { root: 'rounded-xl' },
 * }))
 *
 * @example
 * // With tailwind-merge for smart conflict resolution
 * import { twMerge } from 'tailwind-merge'
 * app.use(createCropVueTheme({
 *   merger: twMerge,
 *   CropEditor: { root: 'rounded-xl' },
 * }))
 */
export function createCropVueTheme(config: CropVueThemeConfig = {}) {
  return {
    install(app: App) {
      app.provide(CROPVUE_THEME_KEY, config)
    },
  }
}
```

**Step 2: Create the useComponentUI composable**

```ts
// packages/vue/src/composables/useComponentUI.ts
import { inject, computed } from 'vue'
import type { ComputedRef } from 'vue'
import { CROPVUE_THEME_KEY } from '../theme'
import type { CropVueTheme } from '../types/ui'
import { mergeClasses } from '../utils/merge-classes'

/**
 * Composable that merges app-level theme defaults with instance `ui` prop.
 * Resolution order: theme defaults → instance ui prop (wins).
 */
export function useComponentUI<K extends keyof CropVueTheme>(
  name: K,
  ui: () => CropVueTheme[K] | undefined,
): ComputedRef<Partial<NonNullable<CropVueTheme[K]>>> {
  const config = inject(CROPVUE_THEME_KEY, undefined)

  return computed(() => {
    type UI = NonNullable<CropVueTheme[K]>
    const themeUi = (config?.[name] ?? {}) as Partial<UI>
    const propUi = (ui() ?? {}) as Partial<UI>
    const merger = config?.merger

    const themeKeys = Object.keys(themeUi)
    const propKeys = Object.keys(propUi)

    // Fast paths
    if (!propKeys.length && !themeKeys.length) return {} as Partial<UI>
    if (!propKeys.length) return themeUi
    if (!themeKeys.length && !merger) return propUi

    const allKeys = new Set([...themeKeys, ...propKeys])
    const result: Record<string, string> = {}

    for (const key of allKeys) {
      const base = (themeUi as Record<string, string | undefined>)[key]
      const override = (propUi as Record<string, string | undefined>)[key]
      const merged = mergeClasses(merger, base, override)
      if (merged) result[key] = merged
    }

    return result as Partial<UI>
  })
}
```

**Step 3: Verify types compile**

Run: `cd packages/vue && npx vue-tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/vue/src/theme/index.ts packages/vue/src/composables/useComponentUI.ts
git commit -m "feat(vue): add theme provider and useComponentUI composable"
```

---

### Task 4: Add `ui` Prop to CropStencil

Simplest component (2 elements). Establishes the pattern for all other components.

**Files:**
- Modify: `packages/vue/src/components/CropStencil.vue`

**Step 1: Add ui prop + composable**

In the `<script setup>` block, add the import and the `ui` prop:

```ts
// Add these imports at top
import type { CropStencilUI } from '../types/ui'
import { useComponentUI } from '../composables/useComponentUI'
```

Add `ui` to the defineProps:

```ts
const props = defineProps<{
  crop: CropState
  containerWidth: number
  containerHeight: number
  ui?: CropStencilUI
}>()
```

Add the composable after props:

```ts
const mergedUi = useComponentUI('CropStencil', () => props.ui)
```

**Step 2: Apply :class bindings in template**

Replace:
```html
<div class="cropvue-stencil">
```
With:
```html
<div class="cropvue-stencil" :class="mergedUi.value.root">
```

Replace:
```html
<div class="cropvue-stencil__shape" :style="stencilStyle" />
```
With:
```html
<div class="cropvue-stencil__shape" :class="mergedUi.value.shape" :style="stencilStyle" />
```

**Step 3: Verify types compile**

Run: `cd packages/vue && npx vue-tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/vue/src/components/CropStencil.vue
git commit -m "feat(vue): add ui prop to CropStencil"
```

---

### Task 5: Add `ui` Prop to CropDropzone

**Files:**
- Modify: `packages/vue/src/components/CropDropzone.vue`

**Step 1: Add ui prop + composable**

Add imports:
```ts
import type { CropDropzoneUI } from '../types/ui'
import { useComponentUI } from '../composables/useComponentUI'
```

Update defineProps — add `ui` to the existing interface:
```ts
const props = withDefaults(defineProps<{
  accept?: string[]
  maxSize?: number
  multiple?: boolean
  ui?: CropDropzoneUI
}>(), {
  accept: () => ['image/*'],
  maxSize: Infinity,
  multiple: false,
})
```

Add composable:
```ts
const mergedUi = useComponentUI('CropDropzone', () => props.ui)
```

**Step 2: Apply :class bindings in template**

Root element:
```html
<div ref="dropzoneRef" class="cropvue-dropzone" :class="[mergedUi.value.root, { 'cropvue-dropzone--active': isDragging }]">
```

Default content:
```html
<div class="cropvue-dropzone__default" :class="mergedUi.value.default" @click="open">
```

**Step 3: Verify types compile**

Run: `cd packages/vue && npx vue-tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/vue/src/components/CropDropzone.vue
git commit -m "feat(vue): add ui prop to CropDropzone"
```

---

### Task 6: Add `ui` Prop to CropPreview

**Files:**
- Modify: `packages/vue/src/components/CropPreview.vue`

**Step 1: Add ui prop + composable**

Add imports:
```ts
import type { CropPreviewUI } from '../types/ui'
import { useComponentUI } from '../composables/useComponentUI'
```

Update defineProps — add `ui`:
```ts
const props = withDefaults(defineProps<{
  image: CropImageData | null
  transform: TransformState
  crop: CropState
  maxWidth?: number
  maxHeight?: number
  debounce?: number
  ui?: CropPreviewUI
}>(), {
  maxWidth: undefined,
  maxHeight: undefined,
  debounce: 50,
})
```

Add composable:
```ts
const mergedUi = useComponentUI('CropPreview', () => props.ui)
```

**Step 2: Apply :class bindings in template**

```html
<div class="cropvue-preview" :class="mergedUi.value.root">
```
```html
<canvas ref="canvasRef" class="cropvue-preview__canvas" :class="mergedUi.value.canvas" />
```

**Step 3: Verify types compile**

Run: `cd packages/vue && npx vue-tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/vue/src/components/CropPreview.vue
git commit -m "feat(vue): add ui prop to CropPreview"
```

---

### Task 7: Add `ui` Prop to CropToolbar

**Files:**
- Modify: `packages/vue/src/components/CropToolbar.vue`

**Step 1: Add ui prop + composable**

Add imports:
```ts
import type { CropToolbarUI } from '../types/ui'
import { useComponentUI } from '../composables/useComponentUI'
```

Update defineProps:
```ts
const props = defineProps<{
  transform: TransformState
  ui?: CropToolbarUI
}>()
```

Add composable:
```ts
const mergedUi = useComponentUI('CropToolbar', () => props.ui)
```

**Step 2: Apply :class bindings in template**

Root:
```html
<div class="cropvue-toolbar" :class="mergedUi.value.root">
```

Default row:
```html
<div class="cropvue-toolbar__default" :class="mergedUi.value.default">
```

All 7 buttons (rotateLeft, rotateRight, flipX, flipY, zoomOut, zoomIn, reset):
```html
<button type="button" class="cropvue-toolbar__btn" :class="mergedUi.value.button" ...>
```

All 3 separators:
```html
<span class="cropvue-toolbar__separator" :class="mergedUi.value.separator" />
```

**Step 3: Verify types compile**

Run: `cd packages/vue && npx vue-tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/vue/src/components/CropToolbar.vue
git commit -m "feat(vue): add ui prop to CropToolbar"
```

---

### Task 8: Add `ui` Prop to CropQueue

**Files:**
- Modify: `packages/vue/src/components/CropQueue.vue`

**Step 1: Add ui prop + composable**

Add imports:
```ts
import type { CropQueueUI } from '../types/ui'
import { useComponentUI } from '../composables/useComponentUI'
```

Add `ui` prop — CropQueue doesn't currently use `defineProps` with withDefaults. Add it:
```ts
const props = defineProps<{
  ui?: CropQueueUI
}>()

const mergedUi = useComponentUI('CropQueue', () => props.ui)
```

Note: the emit and queue references remain unchanged.

**Step 2: Apply :class bindings in template**

Root:
```html
<div class="cropvue-queue" :class="mergedUi.value.root">
```

List:
```html
<div class="cropvue-queue__list" :class="mergedUi.value.list">
```

Item (keep existing dynamic classes, add ui):
```html
<div
  v-for="(item, index) in queue.images.value"
  :key="item.id"
  class="cropvue-queue__item"
  :class="[
    mergedUi.value.item,
    {
      'cropvue-queue__item--active': queue.current.value === index,
      'cropvue-queue__item--done': item.status === 'done',
    },
    queue.current.value === index && mergedUi.value.itemActive,
  ]"
  @click="selectItem(index)"
>
```

Thumbnail:
```html
<img ... class="cropvue-queue__thumbnail" :class="mergedUi.value.thumbnail" />
```

Remove button:
```html
<button ... class="cropvue-queue__remove" :class="mergedUi.value.removeButton" ...>
```

Check icon:
```html
<div v-if="item.status === 'done'" class="cropvue-queue__check" :class="mergedUi.value.checkIcon">
```

**Step 3: Verify types compile**

Run: `cd packages/vue && npx vue-tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/vue/src/components/CropQueue.vue
git commit -m "feat(vue): add ui prop to CropQueue"
```

---

### Task 9: Add `ui` Prop to CropEditor

Most complex component — 8 customizable elements.

**Files:**
- Modify: `packages/vue/src/components/CropEditor.vue`

**Step 1: Add ui prop + composable**

Add imports:
```ts
import type { CropEditorUI } from '../types/ui'
import { useComponentUI } from '../composables/useComponentUI'
```

Update defineProps — add `ui`:
```ts
const props = withDefaults(defineProps<{
  image: CropImageData | null
  transform: TransformState
  crop: CropState
  pannable?: boolean
  ui?: CropEditorUI
}>(), {
  pannable: true,
})
```

Add composable:
```ts
const mergedUi = useComponentUI('CropEditor', () => props.ui)
```

**Step 2: Apply :class bindings in template**

Root container:
```html
<div ref="containerRef" class="cropvue-editor" :class="mergedUi.value.root">
```

Viewport:
```html
<div
  ref="editorRef"
  class="cropvue-editor__viewport"
  :class="[mergedUi.value.viewport, { 'cropvue-editor__viewport--panning': isPanning }]"
  tabindex="0"
  @pointerup="onViewportPointerUp"
>
```

Image:
```html
<img
  v-if="image"
  :src="image.element.src"
  class="cropvue-editor__image"
  :class="mergedUi.value.image"
  :style="imageStyle"
  draggable="false"
  alt=""
/>
```

Overlay:
```html
<div class="cropvue-editor__overlay" :class="mergedUi.value.overlay" :style="overlayStyle" />
```

Crop area:
```html
<div
  class="cropvue-editor__crop-area"
  :class="[mergedUi.value.cropArea, { 'cropvue-editor__crop-area--circle': crop.stencil === 'circle' }]"
  :style="cropStyle"
>
```

Grid:
```html
<div class="cropvue-editor__grid" :class="mergedUi.value.grid">
```

Grid lines (all 4):
```html
<div class="cropvue-editor__grid-line cropvue-editor__grid-line--h1" :class="mergedUi.value.gridLine" />
<div class="cropvue-editor__grid-line cropvue-editor__grid-line--h2" :class="mergedUi.value.gridLine" />
<div class="cropvue-editor__grid-line cropvue-editor__grid-line--v1" :class="mergedUi.value.gridLine" />
<div class="cropvue-editor__grid-line cropvue-editor__grid-line--v2" :class="mergedUi.value.gridLine" />
```

Handles (all — circle single handle and rectangle 4 handles):
```html
<div class="cropvue-editor__handle cropvue-editor__handle--ne" :class="mergedUi.value.handle" data-handle="ne" />
```
(Apply `:class="mergedUi.value.handle"` to all handle divs)

**Step 3: Verify types compile**

Run: `cd packages/vue && npx vue-tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/vue/src/components/CropEditor.vue
git commit -m "feat(vue): add ui prop to CropEditor"
```

---

### Task 10: Add `ui` Prop to CropVue

The orchestrator component — most elements, delegates to child components.

**Files:**
- Modify: `packages/vue/src/components/CropVue.vue`

**Step 1: Add ui prop + composable**

Add imports:
```ts
import type { CropVueUI } from '../types/ui'
import { useComponentUI } from '../composables/useComponentUI'
```

Add `ui` to defineProps (after `pannable`):
```ts
ui?: CropVueUI
```

Add composable after the props block:
```ts
const mergedUi = useComponentUI('CropVue', () => props.ui)
```

**Step 2: Apply :class bindings in template**

Root:
```html
<div class="cropvue" :class="mergedUi.value.root">
```

Dropzone:
```html
<div
  class="cropvue__dropzone"
  :class="[mergedUi.value.dropzone, { 'cropvue__dropzone--active': dropzone.isDragging.value }, dropzone.isDragging.value && mergedUi.value.dropzoneActive]"
  @click="dropzone.open"
>
```

Actions container:
```html
<div class="cropvue__actions" :class="mergedUi.value.actions">
```

Cancel button:
```html
<button type="button" class="cropvue__btn cropvue__btn--cancel" :class="mergedUi.value.cancelButton" @click="cancel">Cancel</button>
```

Confirm button:
```html
<button type="button" class="cropvue__btn cropvue__btn--confirm" :class="mergedUi.value.confirmButton" :disabled="isUploading" @click="confirm">
```

Done wrapper:
```html
<div class="cropvue__done" :class="mergedUi.value.done">
```

Result image:
```html
<img v-if="result" :src="result.url" alt="Cropped result" class="cropvue__result-image" :class="mergedUi.value.resultImage" />
```

**Step 3: Verify types compile**

Run: `cd packages/vue && npx vue-tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/vue/src/components/CropVue.vue
git commit -m "feat(vue): add ui prop to CropVue"
```

---

### Task 11: Update Exports

**Files:**
- Modify: `packages/vue/src/index.ts`

**Step 1: Add theme and type exports**

Add these lines to `packages/vue/src/index.ts`:

```ts
// Theme system
export { createCropVueTheme, CROPVUE_THEME_KEY } from './theme'
export type { CropVueThemeConfig } from './theme'

// UI types
export type {
  CropVueUI,
  CropEditorUI,
  CropToolbarUI,
  CropDropzoneUI,
  CropPreviewUI,
  CropQueueUI,
  CropStencilUI,
  CropVueTheme,
} from './types/ui'

// Composables
export { useComponentUI } from './composables/useComponentUI'
```

**Step 2: Verify types compile**

Run: `cd packages/vue && npx vue-tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/vue/src/index.ts
git commit -m "feat(vue): export theme system, UI types, and useComponentUI"
```

---

### Task 12: Update package.json

**Files:**
- Modify: `packages/vue/package.json`

**Step 1: Add optional peer dependency for tailwind-merge**

Add to `packages/vue/package.json`:

```json
"peerDependencies": {
  "vue": "^3.5.0",
  "tailwind-merge": "^2.0.0 || ^3.0.0"
},
"peerDependenciesMeta": {
  "tailwind-merge": {
    "optional": true
  }
}
```

This replaces the existing `peerDependencies` block (which only had `vue`).

**Step 2: Commit**

```bash
git add packages/vue/package.json
git commit -m "chore(vue): add tailwind-merge as optional peer dependency"
```

---

### Task 13: Update Nuxt Module

**Files:**
- Modify: `packages/nuxt/src/module.ts`

**Step 1: Add theme config to module options**

Update the module to support a `theme` option and auto-import theme utilities:

```ts
import { defineNuxtModule, addComponent, addImports, addPlugin, createResolver, addTemplate } from '@nuxt/kit'
import type { CropVueTheme } from '@cropvue/vue'

export interface CropVueModuleOptions {
  outputFormat?: 'auto' | 'webp' | 'jpeg' | 'png'
  outputQuality?: number
  theme?: CropVueTheme
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
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Auto-import components
    const components = [
      'CropVue', 'CropEditor', 'CropPreview',
      'CropDropzone', 'CropToolbar', 'CropQueue', 'CropStencil',
    ]

    for (const name of components) {
      addComponent({
        name,
        export: name,
        filePath: '@cropvue/vue',
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

    // Auto-import theme utilities
    addImports({ name: 'createCropVueTheme', from: '@cropvue/vue' })
    addImports({ name: 'useComponentUI', from: '@cropvue/vue' })

    // Add CSS
    nuxt.options.css.push('@cropvue/vue/styles')

    // If theme is provided, generate a plugin that provides it
    if (options.theme) {
      const themeJson = JSON.stringify(options.theme)
      addTemplate({
        filename: 'cropvue-theme.mjs',
        getContents: () => `
import { createCropVueTheme } from '@cropvue/vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createCropVueTheme(${themeJson}))
})
`,
      })
      addPlugin({ src: '#build/cropvue-theme' })
    }
  },
})
```

**Step 2: Verify Nuxt module builds**

Run: `cd packages/nuxt && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add packages/nuxt/src/module.ts
git commit -m "feat(nuxt): add theme config support and auto-import theme utilities"
```

---

### Task 14: Full Build Verification

**Files:** None (verification only)

**Step 1: Build all packages**

Run: `pnpm build` (from monorepo root)
Expected: All 3 packages build successfully

**Step 2: Verify dist output**

Check that `packages/vue/dist/index.d.ts` includes the exported types:
- `CropVueThemeConfig`
- `createCropVueTheme`
- `CropVueUI`, `CropEditorUI`, etc.
- `useComponentUI`

Run: `grep -c 'CropVueTheme\|createCropVueTheme\|useComponentUI' packages/vue/dist/index.d.ts`
Expected: Multiple matches

**Step 3: Commit any final adjustments**

If build reveals issues, fix and commit.

---

### Summary of Changes

| Package | New Files | Modified Files |
|---------|-----------|----------------|
| `@cropvue/vue` | `src/types/ui.ts`, `src/utils/merge-classes.ts`, `src/theme/index.ts`, `src/composables/useComponentUI.ts` | All 7 components, `src/index.ts`, `package.json` |
| `@cropvue/nuxt` | — | `src/module.ts` |
| `@cropvue/core` | — | — (untouched) |

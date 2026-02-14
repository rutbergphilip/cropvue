# Tailwind `ui` Prop Customization

Add a Nuxt UI-style `ui` prop to every cropvue component, enabling Tailwind class customization of every internal element while preserving the zero-dependency, unopinionated core.

## Constraints

- Zero required dependencies. `tailwind-merge` is optional (enhances DX when installed).
- Existing CSS variables + BEM classes remain the base styling layer.
- Non-Tailwind users are completely unaffected.
- Works at both per-instance and app-level scope.

## Architecture

### Resolution Order

```
BEM defaults (CSS vars + scoped styles)
  → App-level theme (provide/inject)
    → Instance `ui` prop (highest priority)
```

Classes are additive. They layer on top of BEM classes, not replace them. Users who want pure Tailwind can skip importing `@cropvue/vue/styles`.

### Class Merging

A small internal utility (`mergeClasses`) dynamically imports `tailwind-merge` at runtime:

- **Installed**: smart conflict resolution (e.g., user's `rounded-xl` beats theme's `rounded-lg`).
- **Not installed**: naive concatenation. Works for adding new utilities; overriding requires Tailwind's `!` prefix.

```ts
// packages/vue/src/utils/merge-classes.ts
let twMerge: ((...classes: string[]) => string) | null = null

try {
  const mod = await import('tailwind-merge')
  twMerge = mod.twMerge
} catch {
  // Not installed — naive fallback
}

export function mergeClasses(base: string, override?: string): string {
  if (!override) return base
  if (twMerge) return twMerge(base, override)
  return `${base} ${override}`
}
```

`tailwind-merge` is declared as `peerDependencies` with `"optional": true` in `peerDependenciesMeta`.

### `mergeUiProps` Helper

Merges two `ui` objects (theme defaults + instance prop) key-by-key using `mergeClasses`:

```ts
export function mergeUiProps<T extends Record<string, string>>(
  base: Partial<T>,
  override?: Partial<T>
): Partial<T> {
  if (!override) return base
  const result = { ...base }
  for (const key of Object.keys(override) as (keyof T)[]) {
    result[key] = mergeClasses(
      (base[key] as string) ?? '',
      override[key] as string
    ) as T[keyof T]
  }
  return result
}
```

## `ui` Prop Type Definitions

### CropVue

```ts
interface CropVueUI {
  root?: string
  dropzone?: string
  dropzoneActive?: string // additive when dragging
  actions?: string
  cancelButton?: string
  confirmButton?: string
  done?: string
  resultImage?: string
}
```

### CropEditor

```ts
interface CropEditorUI {
  root?: string
  viewport?: string
  image?: string
  overlay?: string
  cropArea?: string
  grid?: string
  gridLine?: string
  handle?: string
}
```

### CropToolbar

```ts
interface CropToolbarUI {
  root?: string
  default?: string
  button?: string
  separator?: string
}
```

### CropDropzone

```ts
interface CropDropzoneUI {
  root?: string
  default?: string
}
```

### CropPreview

```ts
interface CropPreviewUI {
  root?: string
  canvas?: string
}
```

### CropQueue

```ts
interface CropQueueUI {
  root?: string
  list?: string
  item?: string
  itemActive?: string  // additive when selected
  thumbnail?: string
  removeButton?: string
  checkIcon?: string
}
```

### CropStencil

```ts
interface CropStencilUI {
  root?: string
  shape?: string
}
```

## App-Level Theming

### Vue Plugin

```ts
import { createCropVueTheme } from '@cropvue/vue'

app.use(createCropVueTheme({
  CropEditor: {
    root: 'rounded-xl',
    handle: 'bg-indigo-500 w-3 h-3',
  },
  CropToolbar: {
    button: 'hover:bg-gray-100 rounded-lg',
  },
}))
```

Implementation: `createCropVueTheme` returns an `install` function that calls `app.provide(CROPVUE_THEME_KEY, theme)`.

### Component Consumption

Each component injects the theme and merges with its `ui` prop:

```ts
const theme = inject(CROPVUE_THEME_KEY, {} as CropVueTheme)
const componentTheme = computed(() => theme.CropEditor ?? {})
const mergedUi = computed(() => mergeUiProps(componentTheme.value, props.ui))
```

Template usage:

```html
<div class="cropvue-editor" :class="mergedUi.root">
```

### Theme Type

```ts
interface CropVueTheme {
  CropVue?: Partial<CropVueUI>
  CropEditor?: Partial<CropEditorUI>
  CropToolbar?: Partial<CropToolbarUI>
  CropDropzone?: Partial<CropDropzoneUI>
  CropPreview?: Partial<CropPreviewUI>
  CropQueue?: Partial<CropQueueUI>
  CropStencil?: Partial<CropStencilUI>
}
```

## Nuxt Module Integration

The module gains a `theme` config option:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  cropvue: {
    theme: {
      CropEditor: { root: 'rounded-xl' },
      CropToolbar: { button: 'rounded-lg' },
    }
  }
})
```

The module generates a Nuxt plugin that provides the theme via `createCropVueTheme()`. It also auto-imports `createCropVueTheme` and the UI type interfaces for users who want programmatic access.

## Usage Examples

### Minimal (zero config)

```vue
<CropVue />
<!-- Works exactly as before. No changes needed. -->
```

### Per-Instance Tailwind Styling

```vue
<CropVue :ui="{
  dropzone: 'rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/30 hover:bg-blue-50/60',
  confirmButton: 'bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-6 py-2',
  cancelButton: 'text-gray-500 hover:text-gray-700',
}" />
```

### Editor with Custom Handles

```vue
<CropEditor :ui="{
  root: 'rounded-xl shadow-lg',
  overlay: 'bg-black/70',
  handle: 'bg-white w-3 h-3 rounded-sm shadow-md',
  cropArea: 'border-white/80 border-2',
  grid: 'opacity-40',
}" />
```

### App-Level Theme (Nuxt)

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  cropvue: {
    theme: {
      CropEditor: {
        root: 'rounded-xl',
        handle: 'bg-primary-500 w-3 h-3',
      },
      CropVue: {
        confirmButton: 'bg-primary-500 text-white rounded-lg',
        cancelButton: 'text-gray-500',
        dropzone: 'rounded-xl border-primary-200',
      },
    }
  }
})
```

### App-Level Theme (Vue)

```ts
import { createApp } from 'vue'
import { createCropVueTheme } from '@cropvue/vue'

const app = createApp(App)
app.use(createCropVueTheme({
  CropEditor: { root: 'rounded-xl' },
}))
```

### Composable-Only (Headless)

No changes needed. The `useCropper` composable from `@cropvue/core` remains completely independent of the `ui` system. Users building fully custom UIs via composables + scoped slots don't interact with the `ui` prop at all.

## New Files

| File | Purpose |
|------|---------|
| `packages/vue/src/utils/merge-classes.ts` | `mergeClasses` + `mergeUiProps` utilities |
| `packages/vue/src/theme/index.ts` | `createCropVueTheme`, injection key, types |
| `packages/vue/src/types/ui.ts` | All `*UI` interface types |

## Modified Files

| File | Change |
|------|--------|
| `packages/vue/src/components/*.vue` (all 7) | Add `ui` prop, inject theme, apply `:class` bindings |
| `packages/vue/src/index.ts` | Export theme utilities and UI types |
| `packages/vue/package.json` | Add `tailwind-merge` as optional peer dep |
| `packages/nuxt/src/module.ts` | Add `theme` option, generate plugin, auto-import theme utils |

## What Does NOT Change

- `@cropvue/core` — untouched, stays zero-dependency
- CSS variables system — fully preserved
- Scoped slots — fully preserved
- Existing BEM classes — fully preserved
- Default visual appearance — identical without `ui` prop

# CropVue Feature Parity with vue-advanced-cropper

**Date:** 2026-02-15
**Approach:** Incremental feature addition to existing architecture

## Context

CropVue needs feature parity with vue-advanced-cropper while preserving its existing strengths (file upload pipeline, compression, batch queue, headless architecture, Tailwind `ui` prop).

## Decisions

| Decision | Choice |
|----------|--------|
| Cropper types | All 3: Classic, Static, Hybrid |
| Image panning | Configurable via `moveImage` prop |
| Transitions | On by default, `transitions` prop to disable |
| Resize handles | 8 directional, configurable via `handlers` prop |
| EXIF orientation | Auto-correction on load |
| Custom stencils | Full pluggable system via `stencilComponent` prop |

---

## 1. Cropper Mode System

### New Type

```typescript
type CropperMode = 'classic' | 'static' | 'hybrid'
```

### Behavior Matrix

| Action | Classic | Static | Hybrid |
|--------|---------|--------|--------|
| Stencil drag | Moves stencil | Disabled | Moves stencil |
| Stencil resize | Via handles | Disabled | Via handles |
| Image pan | Via `moveImage` prop | Primary action | Via `moveImage` prop |
| Image zoom | Wheel + pinch | Wheel + pinch (primary) | Wheel + pinch |
| Auto-zoom | Off | On (fixed strategy) | On (hybrid strategy) |
| Stencil position | User-controlled | Fixed center | User-controlled, auto-snaps back |

### Props

- `mode`: `CropperMode` — default `'classic'`
- `moveImage`: `boolean | { mouse: boolean; touch: boolean; wheel: boolean | { ratio: number } }` — default `true`
- `resizeImage`: `boolean | { touch: boolean; wheel: boolean | { ratio: number } }` — default `true`
- `stencilSize`: `Size | ((boundaries: Size) => Size)` — required for static mode

### Impact

- `usePointerHandler` gets mode-aware drag routing
- `useCropper` gets `mode`, `moveImage`, `resizeImage` options
- Existing behavior (classic + moveImage true) preserved as default

---

## 2. Multi-Touch / Pinch-to-Zoom

### Changes to `usePointerHandler`

- Track multiple pointers via `Map<number, {x, y}>` instead of single `activePointerId`
- 2+ pointers → pinch mode:
  - Center of mass (average of pointer positions)
  - Spread (average distance from center)
  - Move: compare new/old spread → zoom factor; new/old center → pan delta
- Single-pointer behavior unchanged

### New Engine Function

```typescript
// engine/gestures.ts
export function handlePinchZoom(
  state: TransformState,
  factor: number,
  centerX: number, centerY: number,
  panDx: number, panDy: number
): TransformState
```

Controlled by `resizeImage.touch` (default: `true`).

---

## 3. Auto-Zoom System

### New Module: `engine/auto-zoom.ts`

Three strategies:

1. **`classicAutoZoom`** — Triggers on `setCoordinates()` only. Ensures stencil stays visible.
2. **`fixedAutoZoom`** — For static mode. Scales visible area so stencil frames the crop exactly.
3. **`hybridAutoZoom`** — For hybrid mode. Calculates optimal stencil size (~80% of boundaries), scales to fit, centers. Skips during manual drag.

### Visible Area Abstraction

Layered on top of existing transform (not replacing it):

```typescript
interface VisibleArea {
  left: number
  top: number
  width: number
  height: number
}
```

Auto-zoom operates on visible area, which maps back to transform x/y/scale.

### Triggers

- After `rotate()`, `flip()`, `setAspectRatio()`, `setStencil()`
- After `setCoordinates()` (classic)
- After stencil resize/move settles (hybrid, debounced)
- NOT during manual drag/pinch

---

## 4. Transitions

### CSS Transition System

- `transitions` prop: `boolean` — default `true`
- Reactive `isTransitioning` ref → adds `.cropvue-editor--transitioning` class
- CSS: `transition: transform 300ms ease-out` only when class present
- Manual drag never triggers transitions

### Trigger Points

Programmatic methods (`rotateLeft`, `flipX`, `zoomTo`, auto-zoom adjustments) set `isTransitioning = true`. Resets after `transitionend` event or 350ms timeout.

---

## 5. 8-Directional Handles

### Type

```typescript
type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface HandlersConfig {
  nw?: boolean; n?: boolean; ne?: boolean; e?: boolean
  se?: boolean; s?: boolean; sw?: boolean; w?: boolean
}
```

### Defaults

- Rectangle: all 8 enabled
- Circle: `ne` only (can be overridden)
- Static mode: all disabled

### Aspect Ratio with Edge Handles

Edge handles (N, S, E, W) with fixed aspect ratio: perpendicular dimension auto-adjusts proportionally.

### Min/Max Aspect Ratio Range

```typescript
minAspectRatio?: number
maxAspectRatio?: number
```

Allows flexible ratio within bounds, not just fixed.

---

## 6. Image Restriction Modes

### Type

```typescript
type ImageRestriction = 'fill-area' | 'fit-area' | 'stencil' | 'none'
```

### Behavior

| Mode | Description |
|------|-------------|
| `fill-area` | Image must fill viewport. No empty space. Pan/zoom clamped. |
| `fit-area` | Image fits within viewport. Some empty space allowed. Default for classic. |
| `stencil` | Image confined to stencil area. Default for static mode. |
| `none` | No restrictions. Current CropVue behavior. |

### New Module: `engine/image-restriction.ts`

- `computePanBounds(imageSize, visibleArea, restriction)` → `{minX, maxX, minY, maxY}`
- `computeZoomBounds(imageSize, visibleArea, restriction)` → `{minScale, maxScale}`
- Applied by `handlePan` and `handleZoom`

---

## 7. EXIF Orientation

### New Utility: `utils/exif.ts`

- `readExifOrientation(file: File): Promise<number>` — reads orientation tag (1-8) from JPEG
- On `loadFile()`, if orientation detected: apply corrective rotation/flip to `defaultTransforms`
- Canvas rendering applies correction manually
- `checkOrientation` prop: `boolean` — default `true`
- Only processes JPEG files

---

## 8. Pluggable Stencil System

### Stencil Contract

Custom stencils must:

1. Accept props: `image`, `coordinates`, `stencilCoordinates`, `transitions`
2. Expose method: `aspectRatios(): { minimum?: number; maximum?: number }`
3. Emit events: `move`, `resize`, `move-end`, `resize-end`

### Props

- `stencilComponent`: `Component` — overrides `stencil` prop
- `stencilProps`: `Record<string, any>` — forwarded to stencil

### Built-in Stencils Refactored

- Extract into `RectangleStencil.vue` and `CircleStencil.vue` implementing the contract
- `stencil: 'rectangle'` is sugar for `stencilComponent: RectangleStencil`

### Service Components (exported)

- `BoundingBox` — container with configurable handles and lines
- `DraggableArea` — emits move events on drag
- `StencilPreview` — shows cropped image portion

---

## New Props Summary

### CropperOptions Additions

| Prop | Type | Default |
|------|------|---------|
| `mode` | `'classic' \| 'static' \| 'hybrid'` | `'classic'` |
| `moveImage` | `boolean \| MoveImageConfig` | `true` |
| `resizeImage` | `boolean \| ResizeImageConfig` | `true` |
| `stencilSize` | `Size \| Function` | — |
| `transitions` | `boolean` | `true` |
| `autoZoom` | `boolean` | mode-dependent |
| `imageRestriction` | `ImageRestriction` | `'fit-area'` |
| `handlers` | `HandlersConfig` | all 8 |
| `checkOrientation` | `boolean` | `true` |
| `stencilComponent` | `Component` | — |
| `stencilProps` | `Record<string, any>` | `{}` |
| `defaultPosition` | `Position \| Function` | centered |
| `defaultSize` | `Size \| Function` | — |
| `defaultTransforms` | `Transforms \| Function` | — |
| `minAspectRatio` | `number` | — |
| `maxAspectRatio` | `number` | — |

### New Methods on `useCropper`

| Method | Purpose |
|--------|---------|
| `setCoordinates(transform)` | Programmatic crop positioning |
| `move(dx, dy)` | Translate visible area |
| `zoom(factor, center?)` | Scale visible area |
| `refresh()` | Recalculate layout on container resize |

### New Engine Modules

| Module | Purpose |
|--------|---------|
| `engine/auto-zoom.ts` | Three auto-zoom strategies |
| `engine/image-restriction.ts` | Pan/zoom bounds computation |
| `engine/visible-area.ts` | Visible area ↔ transform conversion |
| `utils/exif.ts` | EXIF orientation reading |

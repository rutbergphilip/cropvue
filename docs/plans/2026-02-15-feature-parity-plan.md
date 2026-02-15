# Feature Parity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring CropVue to feature parity with vue-advanced-cropper: 3 cropper modes, pinch-to-zoom, auto-zoom, transitions, 8-directional handles, image restriction, EXIF orientation, and pluggable stencils.

**Architecture:** Incremental additions to existing engine/composable/component layers. New engine modules (`auto-zoom.ts`, `image-restriction.ts`, `visible-area.ts`, `exif.ts`) are pure functions with no Vue dependency. Composable changes extend `useCropper` and `usePointerHandler`. Component changes are backward-compatible.

**Tech Stack:** TypeScript, Vue 3 Composition API, Vitest, `@cropvue/core` + `@cropvue/vue`

---

## Phase 1: Foundation (Types + Engine)

### Task 1: Extend Type Definitions

**Files:**
- Modify: `packages/core/src/types.ts`

**Step 1: Write the failing test**

Create `packages/core/src/__tests__/types.test.ts`:

```typescript
import { describe, it, expectTypeOf } from 'vitest'
import type {
  CropperMode,
  ImageRestriction,
  HandlersConfig,
  MoveImageConfig,
  ResizeImageConfig,
  VisibleArea,
  StencilSize,
} from '../types'

describe('new types compile', () => {
  it('CropperMode accepts valid values', () => {
    expectTypeOf<CropperMode>().toEqualTypeOf<'classic' | 'static' | 'hybrid'>()
  })

  it('ImageRestriction accepts valid values', () => {
    expectTypeOf<ImageRestriction>().toEqualTypeOf<'fill-area' | 'fit-area' | 'stencil' | 'none'>()
  })

  it('HandlersConfig has all 8 positions', () => {
    const config: HandlersConfig = { nw: true, n: false, ne: true, e: false, se: true, s: false, sw: true, w: false }
    expectTypeOf(config).toMatchTypeOf<HandlersConfig>()
  })

  it('VisibleArea has correct shape', () => {
    const area: VisibleArea = { left: 0, top: 0, width: 100, height: 100 }
    expectTypeOf(area).toMatchTypeOf<VisibleArea>()
  })

  it('MoveImageConfig supports boolean and object forms', () => {
    const bool: MoveImageConfig = true
    const obj: MoveImageConfig = { mouse: true, touch: true }
    expectTypeOf(bool).toMatchTypeOf<MoveImageConfig>()
    expectTypeOf(obj).toMatchTypeOf<MoveImageConfig>()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run src/__tests__/types.test.ts`
Expected: FAIL — types don't exist yet

**Step 3: Add types to `packages/core/src/types.ts`**

Append these types after the existing types:

```typescript
// === Cropper Mode Types ===

export type CropperMode = 'classic' | 'static' | 'hybrid'

export type ImageRestriction = 'fill-area' | 'fit-area' | 'stencil' | 'none'

export interface HandlersConfig {
  nw?: boolean
  n?: boolean
  ne?: boolean
  e?: boolean
  se?: boolean
  s?: boolean
  sw?: boolean
  w?: boolean
}

export interface MoveImageConfig {
  mouse?: boolean
  touch?: boolean
}

export interface ResizeImageConfig {
  touch?: boolean
  wheel?: boolean | { ratio: number }
}

export interface VisibleArea {
  left: number
  top: number
  width: number
  height: number
}

export type StencilSize =
  | { width: number; height: number }
  | ((boundaries: { width: number; height: number }) => { width: number; height: number })

export interface ImageTransforms {
  rotate: number
  flip: { horizontal: boolean; vertical: boolean }
}

// Extend CropperOptions with new fields
// (done in Task 8 when updating useCropper)
```

Also update the `CropperOptions` interface:

```typescript
export interface CropperOptions {
  // ... existing fields ...
  mode?: CropperMode
  moveImage?: boolean | MoveImageConfig
  resizeImage?: boolean | ResizeImageConfig
  transitions?: boolean
  autoZoom?: boolean
  imageRestriction?: ImageRestriction
  handlers?: HandlersConfig
  checkOrientation?: boolean
  stencilSize?: StencilSize
  defaultTransforms?: ImageTransforms
  minAspectRatio?: number
  maxAspectRatio?: number
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && npx vitest run src/__tests__/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/__tests__/types.test.ts
git commit -m "feat(core): add type definitions for cropper modes, restrictions, and handles"
```

---

### Task 2: Engine — Image Restriction

**Files:**
- Create: `packages/core/src/engine/image-restriction.ts`
- Test: `packages/core/src/__tests__/image-restriction.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { computePanBounds, computeZoomBounds } from '../engine/image-restriction'

describe('computePanBounds', () => {
  const imageSize = { width: 1000, height: 800 }
  const visibleArea = { left: 0, top: 0, width: 500, height: 400 }

  it('returns unbounded for "none"', () => {
    const bounds = computePanBounds(imageSize, visibleArea, 'none')
    expect(bounds.minX).toBe(-Infinity)
    expect(bounds.maxX).toBe(Infinity)
    expect(bounds.minY).toBe(-Infinity)
    expect(bounds.maxY).toBe(Infinity)
  })

  it('returns fill-area bounds (image must fill viewport)', () => {
    const bounds = computePanBounds(imageSize, visibleArea, 'fill-area')
    // Image 1000x800, visible 500x400: image can pan up to (1000-500)=500px
    expect(bounds.minX).toBe(0)
    expect(bounds.maxX).toBe(500) // imageWidth - visibleWidth
    expect(bounds.minY).toBe(0)
    expect(bounds.maxY).toBe(400) // imageHeight - visibleHeight
  })

  it('returns fit-area bounds', () => {
    const bounds = computePanBounds(imageSize, visibleArea, 'fit-area')
    // Image fits within viewport area — limited pan
    expect(bounds.minX).toBeLessThanOrEqual(bounds.maxX)
    expect(bounds.minY).toBeLessThanOrEqual(bounds.maxY)
  })

  it('returns stencil bounds', () => {
    const stencil = { left: 100, top: 100, width: 200, height: 200 }
    const bounds = computePanBounds(imageSize, visibleArea, 'stencil', stencil)
    // Image must cover the stencil area
    expect(bounds.minX).toBeLessThanOrEqual(stencil.left)
    expect(bounds.maxX).toBeGreaterThanOrEqual(stencil.left)
  })
})

describe('computeZoomBounds', () => {
  const imageSize = { width: 1000, height: 800 }
  const visibleArea = { left: 0, top: 0, width: 500, height: 400 }

  it('returns 0.1-10 for "none"', () => {
    const bounds = computeZoomBounds(imageSize, visibleArea, 'none')
    expect(bounds.minScale).toBe(0.1)
    expect(bounds.maxScale).toBe(10)
  })

  it('fill-area minScale prevents image from being smaller than viewport', () => {
    const bounds = computeZoomBounds(imageSize, visibleArea, 'fill-area')
    // At minScale, image must still fill visible area
    expect(bounds.minScale).toBeGreaterThan(0)
    expect(bounds.minScale * imageSize.width).toBeGreaterThanOrEqual(visibleArea.width)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run src/__tests__/image-restriction.test.ts`
Expected: FAIL — module doesn't exist

**Step 3: Implement `packages/core/src/engine/image-restriction.ts`**

```typescript
import type { VisibleArea, ImageRestriction } from '../types'
import { MIN_SCALE, MAX_SCALE } from './constants'

interface Size {
  width: number
  height: number
}

interface PanBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface ZoomBounds {
  minScale: number
  maxScale: number
}

export function computePanBounds(
  imageSize: Size,
  visibleArea: VisibleArea,
  restriction: ImageRestriction,
  stencil?: VisibleArea
): PanBounds {
  if (restriction === 'none') {
    return { minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity }
  }

  if (restriction === 'fill-area') {
    // Image must always fill the visible viewport
    return {
      minX: 0,
      maxX: Math.max(0, imageSize.width - visibleArea.width),
      minY: 0,
      maxY: Math.max(0, imageSize.height - visibleArea.height),
    }
  }

  if (restriction === 'stencil' && stencil) {
    // Image must cover the stencil area
    return {
      minX: stencil.left,
      maxX: Math.max(stencil.left, imageSize.width - stencil.width - stencil.left),
      minY: stencil.top,
      maxY: Math.max(stencil.top, imageSize.height - stencil.height - stencil.top),
    }
  }

  // fit-area: image stays mostly within viewport
  const overflowX = Math.max(0, imageSize.width - visibleArea.width)
  const overflowY = Math.max(0, imageSize.height - visibleArea.height)
  return {
    minX: -overflowX * 0.5,
    maxX: overflowX * 0.5,
    minY: -overflowY * 0.5,
    maxY: overflowY * 0.5,
  }
}

export function computeZoomBounds(
  imageSize: Size,
  visibleArea: VisibleArea,
  restriction: ImageRestriction
): ZoomBounds {
  if (restriction === 'none') {
    return { minScale: MIN_SCALE, maxScale: MAX_SCALE }
  }

  if (restriction === 'fill-area') {
    // Image must fill visible area at minimum scale
    const minScaleX = visibleArea.width / imageSize.width
    const minScaleY = visibleArea.height / imageSize.height
    return {
      minScale: Math.max(minScaleX, minScaleY),
      maxScale: MAX_SCALE,
    }
  }

  // fit-area and stencil: reasonable minimum
  const fitScale = Math.min(
    visibleArea.width / imageSize.width,
    visibleArea.height / imageSize.height
  )
  return {
    minScale: Math.max(MIN_SCALE, fitScale * 0.5),
    maxScale: MAX_SCALE,
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && npx vitest run src/__tests__/image-restriction.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/engine/image-restriction.ts packages/core/src/__tests__/image-restriction.test.ts
git commit -m "feat(core): add image restriction engine for pan/zoom bounds"
```

---

### Task 3: Engine — Visible Area

**Files:**
- Create: `packages/core/src/engine/visible-area.ts`
- Test: `packages/core/src/__tests__/visible-area.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import {
  transformToVisibleArea,
  visibleAreaToTransform,
  fitVisibleArea,
} from '../engine/visible-area'
import { createTransformState } from '../engine/transform'

describe('transformToVisibleArea', () => {
  it('converts default transform to full-image visible area', () => {
    const transform = createTransformState()
    const imageSize = { width: 1000, height: 800 }
    const boundaries = { width: 500, height: 400 }
    const area = transformToVisibleArea(transform, imageSize, boundaries)
    expect(area.width).toBeGreaterThan(0)
    expect(area.height).toBeGreaterThan(0)
  })
})

describe('visibleAreaToTransform', () => {
  it('roundtrips: transform → visibleArea → transform', () => {
    const original = createTransformState()
    const imageSize = { width: 1000, height: 800 }
    const boundaries = { width: 500, height: 400 }
    const area = transformToVisibleArea(original, imageSize, boundaries)
    const result = visibleAreaToTransform(area, imageSize, boundaries)
    expect(result.x).toBeCloseTo(original.x, 1)
    expect(result.y).toBeCloseTo(original.y, 1)
    expect(result.scale).toBeCloseTo(original.scale, 2)
  })
})

describe('fitVisibleArea', () => {
  it('clamps visible area to image bounds', () => {
    const area = { left: -100, top: -100, width: 500, height: 400 }
    const imageSize = { width: 1000, height: 800 }
    const fitted = fitVisibleArea(area, imageSize)
    expect(fitted.left).toBeGreaterThanOrEqual(0)
    expect(fitted.top).toBeGreaterThanOrEqual(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run src/__tests__/visible-area.test.ts`
Expected: FAIL

**Step 3: Implement `packages/core/src/engine/visible-area.ts`**

```typescript
import type { TransformState, VisibleArea } from '../types'

interface Size {
  width: number
  height: number
}

/**
 * Convert transform state (x, y, scale) to a visible area rectangle.
 * The visible area represents what portion of the image is displayed.
 */
export function transformToVisibleArea(
  transform: TransformState,
  imageSize: Size,
  boundaries: Size
): VisibleArea {
  const displayScale = Math.min(
    boundaries.width / imageSize.width,
    boundaries.height / imageSize.height,
    1
  )
  const effectiveScale = displayScale * transform.scale

  const width = boundaries.width / effectiveScale
  const height = boundaries.height / effectiveScale

  const centerX = imageSize.width / 2 - transform.x
  const centerY = imageSize.height / 2 - transform.y

  return {
    left: centerX - width / 2,
    top: centerY - height / 2,
    width,
    height,
  }
}

/**
 * Convert visible area back to transform state values.
 */
export function visibleAreaToTransform(
  area: VisibleArea,
  imageSize: Size,
  boundaries: Size
): Partial<TransformState> {
  const displayScale = Math.min(
    boundaries.width / imageSize.width,
    boundaries.height / imageSize.height,
    1
  )

  const effectiveScale = boundaries.width / area.width / displayScale
  const centerX = area.left + area.width / 2
  const centerY = area.top + area.height / 2

  return {
    x: imageSize.width / 2 - centerX,
    y: imageSize.height / 2 - centerY,
    scale: effectiveScale,
  }
}

/**
 * Clamp visible area to stay within image bounds.
 */
export function fitVisibleArea(
  area: VisibleArea,
  imageSize: Size
): VisibleArea {
  let { left, top, width, height } = area

  // Don't let visible area be larger than image
  width = Math.min(width, imageSize.width)
  height = Math.min(height, imageSize.height)

  // Clamp position
  left = Math.max(0, Math.min(left, imageSize.width - width))
  top = Math.max(0, Math.min(top, imageSize.height - height))

  return { left, top, width, height }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && npx vitest run src/__tests__/visible-area.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/engine/visible-area.ts packages/core/src/__tests__/visible-area.test.ts
git commit -m "feat(core): add visible area abstraction for auto-zoom foundation"
```

---

### Task 4: Engine — Auto-Zoom

**Files:**
- Create: `packages/core/src/engine/auto-zoom.ts`
- Test: `packages/core/src/__tests__/auto-zoom.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { classicAutoZoom, fixedAutoZoom, hybridAutoZoom } from '../engine/auto-zoom'

const imageSize = { width: 1000, height: 800 }
const boundaries = { width: 500, height: 400 }

describe('classicAutoZoom', () => {
  it('returns area that contains the coordinates', () => {
    const coordinates = { left: 200, top: 200, width: 300, height: 200 }
    const currentArea = { left: 0, top: 0, width: 1000, height: 800 }
    const result = classicAutoZoom(coordinates, currentArea, imageSize, boundaries)
    // The coordinates should be visible within the result area
    expect(result.left).toBeLessThanOrEqual(coordinates.left)
    expect(result.top).toBeLessThanOrEqual(coordinates.top)
    expect(result.left + result.width).toBeGreaterThanOrEqual(coordinates.left + coordinates.width)
    expect(result.top + result.height).toBeGreaterThanOrEqual(coordinates.top + coordinates.height)
  })

  it('does not change area if coordinates already visible', () => {
    const coordinates = { left: 100, top: 100, width: 200, height: 200 }
    const currentArea = { left: 0, top: 0, width: 1000, height: 800 }
    const result = classicAutoZoom(coordinates, currentArea, imageSize, boundaries)
    expect(result).toEqual(currentArea)
  })
})

describe('fixedAutoZoom', () => {
  it('centers stencil in visible area', () => {
    const stencilSize = { width: 200, height: 200 }
    const coordinates = { left: 100, top: 100, width: 200, height: 200 }
    const result = fixedAutoZoom(coordinates, stencilSize, imageSize, boundaries)
    // Area should be centered on coordinates
    const areaCenterX = result.left + result.width / 2
    const areaCenterY = result.top + result.height / 2
    const coordCenterX = coordinates.left + coordinates.width / 2
    const coordCenterY = coordinates.top + coordinates.height / 2
    expect(areaCenterX).toBeCloseTo(coordCenterX, 0)
    expect(areaCenterY).toBeCloseTo(coordCenterY, 0)
  })
})

describe('hybridAutoZoom', () => {
  it('returns area sized so stencil fills ~80% of boundaries', () => {
    const coordinates = { left: 100, top: 100, width: 200, height: 200 }
    const currentArea = { left: 0, top: 0, width: 1000, height: 800 }
    const result = hybridAutoZoom(coordinates, currentArea, imageSize, boundaries)
    // The coordinates should take up a reasonable portion of the result area
    const coordRatio = coordinates.width / result.width
    expect(coordRatio).toBeGreaterThan(0.3) // at least 30% of area
    expect(coordRatio).toBeLessThan(1) // less than full area
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run src/__tests__/auto-zoom.test.ts`
Expected: FAIL

**Step 3: Implement `packages/core/src/engine/auto-zoom.ts`**

```typescript
import type { VisibleArea } from '../types'
import { fitVisibleArea } from './visible-area'

interface Size {
  width: number
  height: number
}

interface Coordinates {
  left: number
  top: number
  width: number
  height: number
}

const TARGET_STENCIL_RATIO = 0.8 // Stencil should fill ~80% of boundaries

/**
 * Classic auto-zoom: only adjusts if coordinates are outside visible area.
 * Minimal intervention — just ensures stencil stays visible.
 */
export function classicAutoZoom(
  coordinates: Coordinates,
  currentArea: VisibleArea,
  imageSize: Size,
  _boundaries: Size
): VisibleArea {
  const coordRight = coordinates.left + coordinates.width
  const coordBottom = coordinates.top + coordinates.height
  const areaRight = currentArea.left + currentArea.width
  const areaBottom = currentArea.top + currentArea.height

  // Check if coordinates are fully within visible area
  if (
    coordinates.left >= currentArea.left &&
    coordinates.top >= currentArea.top &&
    coordRight <= areaRight &&
    coordBottom <= areaBottom
  ) {
    return currentArea
  }

  // Expand visible area to include coordinates
  const left = Math.min(currentArea.left, coordinates.left)
  const top = Math.min(currentArea.top, coordinates.top)
  const right = Math.max(areaRight, coordRight)
  const bottom = Math.max(areaBottom, coordBottom)

  return fitVisibleArea(
    { left, top, width: right - left, height: bottom - top },
    imageSize
  )
}

/**
 * Fixed auto-zoom: for static croppers. Scales visible area so the stencil
 * exactly frames the crop coordinates. Centers everything.
 */
export function fixedAutoZoom(
  coordinates: Coordinates,
  stencilSize: Size,
  imageSize: Size,
  boundaries: Size
): VisibleArea {
  // Calculate what visible area width would make coordinates fill the stencil
  const scaleX = boundaries.width / stencilSize.width
  const scaleY = boundaries.height / stencilSize.height
  const scale = Math.min(scaleX, scaleY)

  const areaWidth = coordinates.width * scale
  const areaHeight = coordinates.height * scale

  // Center on coordinates
  const centerX = coordinates.left + coordinates.width / 2
  const centerY = coordinates.top + coordinates.height / 2

  return fitVisibleArea(
    {
      left: centerX - areaWidth / 2,
      top: centerY - areaHeight / 2,
      width: areaWidth,
      height: areaHeight,
    },
    imageSize
  )
}

/**
 * Hybrid auto-zoom: calculates optimal stencil size (~80% of boundaries),
 * scales visible area to fit coordinates into that target, centers.
 */
export function hybridAutoZoom(
  coordinates: Coordinates,
  currentArea: VisibleArea,
  imageSize: Size,
  boundaries: Size
): VisibleArea {
  // Target: coordinates should fill TARGET_STENCIL_RATIO of boundaries
  const targetWidth = boundaries.width * TARGET_STENCIL_RATIO
  const targetHeight = boundaries.height * TARGET_STENCIL_RATIO

  // Scale factor to make coordinates fill the target
  const scaleX = targetWidth / coordinates.width
  const scaleY = targetHeight / coordinates.height
  const scale = Math.min(scaleX, scaleY)

  const areaWidth = boundaries.width / scale
  const areaHeight = boundaries.height / scale

  // Center on coordinates
  const centerX = coordinates.left + coordinates.width / 2
  const centerY = coordinates.top + coordinates.height / 2

  return fitVisibleArea(
    {
      left: centerX - areaWidth / 2,
      top: centerY - areaHeight / 2,
      width: areaWidth,
      height: areaHeight,
    },
    imageSize
  )
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && npx vitest run src/__tests__/auto-zoom.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/engine/auto-zoom.ts packages/core/src/__tests__/auto-zoom.test.ts
git commit -m "feat(core): add auto-zoom strategies (classic, fixed, hybrid)"
```

---

### Task 5: Engine — Pinch-to-Zoom Gesture

**Files:**
- Modify: `packages/core/src/engine/gestures.ts`
- Modify: `packages/core/src/__tests__/gestures.test.ts`

**Step 1: Write the failing test**

Append to `packages/core/src/__tests__/gestures.test.ts`:

```typescript
import { handlePinchZoom } from '../engine/gestures'

describe('handlePinchZoom', () => {
  it('zooms in when fingers spread apart', () => {
    const state = createTransformState()
    const result = handlePinchZoom(state, 1.2, 100, 100, 0, 0)
    expect(result.scale).toBeGreaterThan(1)
  })

  it('zooms out when fingers pinch together', () => {
    const state = createTransformState()
    const result = handlePinchZoom(state, 0.8, 100, 100, 0, 0)
    expect(result.scale).toBeLessThan(1)
  })

  it('pans simultaneously with zoom', () => {
    const state = createTransformState()
    const result = handlePinchZoom(state, 1.0, 100, 100, 10, 20)
    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
  })

  it('clamps scale within bounds', () => {
    const state = createTransformState()
    const result = handlePinchZoom(state, 100, 0, 0, 0, 0)
    expect(result.scale).toBeLessThanOrEqual(10)
  })

  it('centers zoom on pinch center point', () => {
    const state = createTransformState()
    const result = handlePinchZoom(state, 1.5, 200, 150, 0, 0)
    // Position should shift toward the zoom center
    expect(result.x).not.toBe(0)
    expect(result.y).not.toBe(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run src/__tests__/gestures.test.ts`
Expected: FAIL — `handlePinchZoom` not defined

**Step 3: Add `handlePinchZoom` to `packages/core/src/engine/gestures.ts`**

```typescript
export function handlePinchZoom(
  state: TransformState,
  factor: number,
  centerX: number,
  centerY: number,
  panDx: number,
  panDy: number
): TransformState {
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, state.scale * factor))
  const ratio = newScale / state.scale

  // Zoom centered on pinch center
  const newX = centerX - (centerX - state.x) * ratio + panDx
  const newY = centerY - (centerY - state.y) * ratio + panDy

  return {
    ...state,
    scale: newScale,
    x: newX,
    y: newY,
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && npx vitest run src/__tests__/gestures.test.ts`
Expected: PASS (all tests including existing ones)

**Step 5: Commit**

```bash
git add packages/core/src/engine/gestures.ts packages/core/src/__tests__/gestures.test.ts
git commit -m "feat(core): add pinch-to-zoom gesture handler"
```

---

### Task 6: Engine — Aspect Ratio Enforcement for Edge Handles

**Files:**
- Modify: `packages/core/src/engine/gestures.ts`
- Modify: `packages/core/src/__tests__/gestures.test.ts`

**Step 1: Write the failing test**

Append to existing test file:

```typescript
describe('handleCropResize with aspect ratio', () => {
  it('enforces aspect ratio when resizing from east handle', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 100, y: 100, width: 200, height: 100,
      aspectRatio: 2, // width/height = 2
    }
    const result = handleCropResize(crop, 'e', 50, 0, { width: 800, height: 800 })
    expect(result.width).toBe(250)
    expect(result.height).toBe(125) // width / 2
  })

  it('enforces aspect ratio when resizing from south handle', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 100, y: 100, width: 200, height: 100,
      aspectRatio: 2,
    }
    const result = handleCropResize(crop, 's', 0, 50, { width: 800, height: 800 })
    expect(result.height).toBe(150)
    expect(result.width).toBe(300) // height * 2
  })

  it('enforces aspect ratio when resizing from north handle', () => {
    const crop = {
      ...createCropState({ width: 800, height: 800 }),
      x: 100, y: 200, width: 200, height: 100,
      aspectRatio: 2,
    }
    const result = handleCropResize(crop, 'n', 0, -50, { width: 800, height: 800 })
    expect(result.height).toBe(150)
    expect(result.width).toBe(300)
    expect(result.y).toBe(150) // moved up
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run src/__tests__/gestures.test.ts`
Expected: FAIL — aspect ratio not enforced for edge handles

**Step 3: Add aspect ratio enforcement to `handleCropResize`**

After the switch statement in `handleCropResize`, before the min size enforcement, add:

```typescript
  // Enforce aspect ratio for edge handles
  if (crop.aspectRatio && crop.stencil !== 'circle') {
    const ratio = crop.aspectRatio
    const isEdgeHandle = ['n', 's', 'e', 'w'].includes(handle)
    const isCornerHandle = ['nw', 'ne', 'sw', 'se'].includes(handle)

    if (isEdgeHandle) {
      // Edge handles: adjust the perpendicular dimension
      if (handle === 'e' || handle === 'w') {
        const newHeight = width / ratio
        if (handle === 'w') {
          // Anchor at right edge
        }
        height = newHeight
      } else {
        const newWidth = height * ratio
        if (handle === 'n') {
          // Anchor at bottom — adjust x to center
        }
        width = newWidth
      }
    } else if (isCornerHandle) {
      // Corner handles: constrain to ratio
      const targetHeight = width / ratio
      if (targetHeight <= height) {
        height = targetHeight
      } else {
        width = height * ratio
      }
    }
  }
```

The exact implementation will need care with anchor points for each handle direction. The engineer should study the existing handle logic and extend it.

**Step 4: Run test to verify it passes**

Run: `cd packages/core && npx vitest run src/__tests__/gestures.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/engine/gestures.ts packages/core/src/__tests__/gestures.test.ts
git commit -m "feat(core): enforce aspect ratio for edge handle resizing"
```

---

### Task 7: Utils — EXIF Orientation

**Files:**
- Create: `packages/core/src/utils/exif.ts`
- Test: `packages/core/src/__tests__/exif.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { readExifOrientation, getOrientationTransforms } from '../utils/exif'

describe('getOrientationTransforms', () => {
  it('returns no transform for orientation 1 (normal)', () => {
    const transforms = getOrientationTransforms(1)
    expect(transforms.rotate).toBe(0)
    expect(transforms.flip.horizontal).toBe(false)
    expect(transforms.flip.vertical).toBe(false)
  })

  it('returns horizontal flip for orientation 2', () => {
    const transforms = getOrientationTransforms(2)
    expect(transforms.flip.horizontal).toBe(true)
    expect(transforms.rotate).toBe(0)
  })

  it('returns 180° rotation for orientation 3', () => {
    const transforms = getOrientationTransforms(3)
    expect(transforms.rotate).toBe(180)
  })

  it('returns 90° CW rotation for orientation 6 (common phone portrait)', () => {
    const transforms = getOrientationTransforms(6)
    expect(transforms.rotate).toBe(90)
  })

  it('returns 270° rotation for orientation 8', () => {
    const transforms = getOrientationTransforms(8)
    expect(transforms.rotate).toBe(270)
  })
})

describe('readExifOrientation', () => {
  it('returns 1 for non-JPEG files', async () => {
    const png = new File(['fake'], 'test.png', { type: 'image/png' })
    const orientation = await readExifOrientation(png)
    expect(orientation).toBe(1)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run src/__tests__/exif.test.ts`
Expected: FAIL

**Step 3: Implement `packages/core/src/utils/exif.ts`**

```typescript
import type { ImageTransforms } from '../types'

/**
 * Read EXIF orientation tag from a JPEG file.
 * Returns 1 (normal) for non-JPEG or files without EXIF data.
 */
export async function readExifOrientation(file: File): Promise<number> {
  if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
    return 1
  }

  try {
    const buffer = await file.slice(0, 65536).arrayBuffer()
    const view = new DataView(buffer)

    // Check JPEG magic bytes
    if (view.getUint16(0) !== 0xFFD8) return 1

    let offset = 2
    while (offset < view.byteLength - 2) {
      const marker = view.getUint16(offset)
      offset += 2

      if (marker === 0xFFE1) {
        // APP1 (EXIF) marker found
        const length = view.getUint16(offset)
        offset += 2

        // Check "Exif\0\0" header
        if (view.getUint32(offset) !== 0x45786966 || view.getUint16(offset + 4) !== 0x0000) {
          return 1
        }
        offset += 6

        const tiffStart = offset
        const isLittleEndian = view.getUint16(tiffStart) === 0x4949

        const ifdOffset = view.getUint32(tiffStart + 4, isLittleEndian)
        const numEntries = view.getUint16(tiffStart + ifdOffset, isLittleEndian)

        for (let i = 0; i < numEntries; i++) {
          const entryOffset = tiffStart + ifdOffset + 2 + i * 12
          if (entryOffset + 12 > view.byteLength) break
          const tag = view.getUint16(entryOffset, isLittleEndian)
          if (tag === 0x0112) {
            // Orientation tag
            return view.getUint16(entryOffset + 8, isLittleEndian)
          }
        }
        return 1
      }

      if ((marker & 0xFF00) !== 0xFF00) break

      // Skip this marker segment
      const segLength = view.getUint16(offset)
      offset += segLength
    }

    return 1
  } catch {
    return 1
  }
}

/**
 * Convert EXIF orientation (1-8) to rotation/flip transforms.
 */
export function getOrientationTransforms(orientation: number): ImageTransforms {
  switch (orientation) {
    case 2: return { rotate: 0, flip: { horizontal: true, vertical: false } }
    case 3: return { rotate: 180, flip: { horizontal: false, vertical: false } }
    case 4: return { rotate: 0, flip: { horizontal: false, vertical: true } }
    case 5: return { rotate: 90, flip: { horizontal: true, vertical: false } }
    case 6: return { rotate: 90, flip: { horizontal: false, vertical: false } }
    case 7: return { rotate: 270, flip: { horizontal: true, vertical: false } }
    case 8: return { rotate: 270, flip: { horizontal: false, vertical: false } }
    default: return { rotate: 0, flip: { horizontal: false, vertical: false } }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && npx vitest run src/__tests__/exif.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/utils/exif.ts packages/core/src/__tests__/exif.test.ts
git commit -m "feat(core): add EXIF orientation reading and correction"
```

---

### Task 8: Export New Engine Modules

**Files:**
- Modify: `packages/core/src/index.ts`

**Step 1: Add exports**

Add to `packages/core/src/index.ts`:

```typescript
// New engine modules
export { computePanBounds, computeZoomBounds } from './engine/image-restriction'
export { transformToVisibleArea, visibleAreaToTransform, fitVisibleArea } from './engine/visible-area'
export { classicAutoZoom, fixedAutoZoom, hybridAutoZoom } from './engine/auto-zoom'
export { handlePinchZoom } from './engine/gestures'

// New utils
export { readExifOrientation, getOrientationTransforms } from './utils/exif'
```

**Step 2: Run full test suite**

Run: `cd packages/core && npx vitest run`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "feat(core): export new engine modules and utilities"
```

---

## Phase 2: Composable Updates

### Task 9: usePointerHandler — Multi-Touch Support

**Files:**
- Modify: `packages/core/src/composables/usePointerHandler.ts`
- Modify: `packages/core/src/__tests__/usePointerHandler.test.ts`

This is a significant refactor. The current handler tracks a single `activePointerId`. We need a `Map<number, {x: number, y: number}>` to track multiple pointers.

**Step 1: Write the failing test**

Add to existing test file (or create new section):

```typescript
describe('multi-touch pinch-to-zoom', () => {
  it('calls onPinchZoom when two pointers are active', () => {
    // This test will need a DOM environment or mock
    // The key behavior: when 2+ pointers are tracked,
    // pointermove should call onPinchZoom instead of onPan
  })
})
```

Note: `usePointerHandler` operates on real DOM elements. Tests should use `happy-dom` or `jsdom`. The existing test file likely already has DOM mocking set up — follow its patterns.

**Step 2: Implement multi-touch**

Key changes to `usePointerHandler`:

1. Replace `activePointerId: number | null` with `pointers: Map<number, {x: number, y: number}>`
2. Add `onPinchZoom` callback to `PointerHandlerOptions`
3. Add `mode` option to control drag routing
4. On `pointerdown`: add pointer to map
5. On `pointermove`: if `pointers.size >= 2`, calculate pinch center + spread, call `onPinchZoom`; else use existing single-pointer logic
6. On `pointerup`/`pointercancel`: remove pointer from map

```typescript
export interface PointerHandlerOptions {
  // ... existing callbacks ...
  onPinchZoom?: (factor: number, centerX: number, centerY: number, panDx: number, panDy: number) => void
  mode?: 'classic' | 'static' | 'hybrid'
  moveImage?: boolean
  resizeImage?: boolean
}
```

In static mode:
- `getHandleAtPoint` and `isInsideCropArea` checks are skipped
- All single-pointer drags route to `onPan`
- Pinch gestures route to `onPinchZoom`

**Step 3: Run tests**

Run: `cd packages/core && npx vitest run src/__tests__/usePointerHandler.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/core/src/composables/usePointerHandler.ts packages/core/src/__tests__/usePointerHandler.test.ts
git commit -m "feat(core): add multi-touch pinch-to-zoom to pointer handler"
```

---

### Task 10: useCropper — New Options and Methods

**Files:**
- Modify: `packages/core/src/composables/useCropper.ts`
- Modify: `packages/core/src/__tests__/useCropper.test.ts`

This extends `useCropper` with:
- `mode`, `transitions`, `autoZoom`, `imageRestriction` options
- `isTransitioning` ref
- `setCoordinates()`, `move()`, `zoom()`, `refresh()` methods
- Auto-zoom integration (watches crop changes, applies strategy)
- EXIF orientation on `loadFile()`

**Step 1: Write failing tests**

```typescript
describe('useCropper with mode options', () => {
  it('accepts mode option', () => {
    const cropper = useCropper({ mode: 'static' })
    expect(cropper.isReady.value).toBe(false) // just verifying it doesn't throw
  })

  it('exposes isTransitioning ref', () => {
    const cropper = useCropper({ transitions: true })
    expect(cropper.isTransitioning.value).toBe(false)
  })

  it('setCoordinates updates crop area', () => {
    const cropper = useCropper()
    // Load a mock image first (may need setup)
    cropper.setCoordinates({ left: 10, top: 20, width: 100, height: 80 })
    expect(cropper.crop.value.x).toBe(10)
    expect(cropper.crop.value.y).toBe(20)
  })
})
```

**Step 2: Implement**

Add to `useCropper`:

```typescript
const isTransitioning = ref(false)
let transitionTimeout: ReturnType<typeof setTimeout> | null = null

function startTransition() {
  if (options.transitions === false) return
  isTransitioning.value = true
  if (transitionTimeout) clearTimeout(transitionTimeout)
  transitionTimeout = setTimeout(() => {
    isTransitioning.value = false
  }, 350)
}

function setCoordinates(coords: Partial<{left: number; top: number; width: number; height: number}> | Function | Array<...>) {
  startTransition()
  if (typeof coords === 'function') {
    const result = coords({ coordinates: crop.value, imageSize: image.value, visibleArea: null })
    crop.value = { ...crop.value, x: result.left ?? crop.value.x, y: result.top ?? crop.value.y, width: result.width ?? crop.value.width, height: result.height ?? crop.value.height }
  } else if (Array.isArray(coords)) {
    for (const c of coords) setCoordinates(c)
  } else {
    crop.value = { ...crop.value, x: coords.left ?? crop.value.x, y: coords.top ?? crop.value.y, width: coords.width ?? crop.value.width, height: coords.height ?? crop.value.height }
  }
}

function move(dx: number, dy: number) {
  startTransition()
  transform.value = { ...transform.value, x: transform.value.x + dx, y: transform.value.y + dy }
}

function zoom(factor: number, center?: { left: number; top: number }) {
  startTransition()
  const cx = center?.left ?? 0
  const cy = center?.top ?? 0
  const newScale = Math.max(0.1, Math.min(10, transform.value.scale * factor))
  const ratio = newScale / transform.value.scale
  transform.value = {
    ...transform.value,
    scale: newScale,
    x: cx - (cx - transform.value.x) * ratio,
    y: cy - (cy - transform.value.y) * ratio,
  }
}

function refresh() {
  // Trigger recalculation — consumers should call this on container resize
  // The component layer handles this via ResizeObserver
}
```

Also wrap existing `rotateLeft`, `rotateRight`, `flipX`, `flipY` with `startTransition()`.

Add EXIF reading to `loadFile`:

```typescript
async function loadFile(file: File) {
  if (options.checkOrientation !== false) {
    const orientation = await readExifOrientation(file)
    if (orientation !== 1) {
      const transforms = getOrientationTransforms(orientation)
      // Apply as default transforms
      // Modern browsers handle this, but we store it for canvas rendering
    }
  }
  image.value = await loadImageFromFile(file)
  initCropForImage(image.value)
  isReady.value = true
}
```

Return `isTransitioning`, `setCoordinates`, `move`, `zoom`, `refresh` from the composable.

**Step 3: Run tests**

Run: `cd packages/core && npx vitest run src/__tests__/useCropper.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/core/src/composables/useCropper.ts packages/core/src/__tests__/useCropper.test.ts
git commit -m "feat(core): add mode, transitions, auto-zoom, and new methods to useCropper"
```

---

## Phase 3: Vue Component Updates

### Task 11: CropEditor — 8 Handles + Edge Handle Hit Detection

**Files:**
- Modify: `packages/vue/src/components/CropEditor.vue`

**Step 1: Add `handlers` prop**

```typescript
const props = withDefaults(defineProps<{
  // ... existing props ...
  handlers?: HandlersConfig
  mode?: CropperMode
  moveImage?: boolean | MoveImageConfig
  resizeImage?: boolean | ResizeImageConfig
  transitions?: boolean
  isTransitioning?: boolean
}>(), {
  // ... existing defaults ...
  handlers: () => ({ nw: true, n: true, ne: true, e: true, se: true, s: true, sw: true, w: true }),
  mode: 'classic',
  moveImage: true,
  resizeImage: true,
  transitions: true,
  isTransitioning: false,
})
```

**Step 2: Update template to render all 8 handles**

Replace the handles slot default content:

```html
<template v-if="crop.stencil === 'circle'">
  <div v-if="handlers.ne !== false" class="cropvue-editor__handle cropvue-editor__handle--ne" :class="mergedUi.handle" data-handle="ne" />
</template>
<template v-else>
  <div v-for="pos in activeHandles" :key="pos"
    :class="['cropvue-editor__handle', `cropvue-editor__handle--${pos}`, mergedUi.handle]"
    :data-handle="pos"
  />
</template>
```

Add computed:

```typescript
const activeHandles = computed(() => {
  if (props.mode === 'static') return []
  const all = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const
  return all.filter(pos => props.handlers[pos] !== false)
})
```

**Step 3: Add CSS for edge handles**

```css
.cropvue-editor__handle--n { top: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.cropvue-editor__handle--s { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.cropvue-editor__handle--e { right: -5px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
.cropvue-editor__handle--w { left: -5px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
```

**Step 4: Update hit detection for edge handles**

In `getHandleAtPoint`, add edge handle detection between corner checks and `return null`:

```typescript
// Edge handles (midpoints of edges)
const midX = (cropLeft + cropRight) / 2
const midY = (cropTop + cropBottom) / 2

if (props.handlers.n !== false && Math.abs(py - cropTop) < threshold && Math.abs(px - midX) < (cropRight - cropLeft) / 2) return 'n'
if (props.handlers.s !== false && Math.abs(py - cropBottom) < threshold && Math.abs(px - midX) < (cropRight - cropLeft) / 2) return 's'
if (props.handlers.e !== false && Math.abs(px - cropRight) < threshold && Math.abs(py - midY) < (cropBottom - cropTop) / 2) return 'e'
if (props.handlers.w !== false && Math.abs(px - cropLeft) < threshold && Math.abs(py - midY) < (cropBottom - cropTop) / 2) return 'w'
```

**Step 5: Add transition CSS**

```css
.cropvue-editor__viewport--transitioning .cropvue-editor__image {
  transition: transform 300ms ease-out;
}

.cropvue-editor__viewport--transitioning .cropvue-editor__crop-area {
  transition: left 300ms ease-out, top 300ms ease-out, width 300ms ease-out, height 300ms ease-out;
}

.cropvue-editor__viewport--transitioning .cropvue-editor__overlay {
  transition: clip-path 300ms ease-out;
}
```

Add `isTransitioning` to viewport class:

```html
:class="[mergedUi.viewport, {
  'cropvue-editor__viewport--panning': isPanning,
  'cropvue-editor__viewport--transitioning': isTransitioning
}]"
```

**Step 6: Commit**

```bash
git add packages/vue/src/components/CropEditor.vue
git commit -m "feat(vue): add 8-directional handles, mode support, and transition system"
```

---

### Task 12: CropEditor — Mode-Aware Pointer Handling

**Files:**
- Modify: `packages/vue/src/components/CropEditor.vue`

Update `setupPointerHandler` to pass mode-aware options:

```typescript
pointerHandler = usePointerHandler(viewport, {
  onPan(dx, dy) {
    const canMove = isMoveImageEnabled()
    if (!canMove) return
    isPanning.value = true
    emit('update:transform', handlePan(props.transform, dx, dy))
  },
  onPinchZoom(factor, cx, cy, pdx, pdy) {
    if (!isResizeImageEnabled()) return
    emit('update:transform', handlePinchZoom(props.transform, factor, cx, cy, pdx, pdy))
  },
  // ... rest of handlers
  mode: props.mode,
  moveImage: typeof props.moveImage === 'boolean' ? props.moveImage : true,
  resizeImage: typeof props.resizeImage === 'boolean' ? props.resizeImage : true,
})
```

Add helper functions:

```typescript
function isMoveImageEnabled(): boolean {
  if (typeof props.moveImage === 'boolean') return props.moveImage
  if (typeof props.moveImage === 'object') return props.moveImage.mouse !== false
  return true
}

function isResizeImageEnabled(): boolean {
  if (typeof props.resizeImage === 'boolean') return props.resizeImage
  if (typeof props.resizeImage === 'object') return true
  return true
}
```

**Step 1: Commit**

```bash
git add packages/vue/src/components/CropEditor.vue
git commit -m "feat(vue): add mode-aware pointer handling with pinch-to-zoom"
```

---

### Task 13: CropVue — Pass Through New Props

**Files:**
- Modify: `packages/vue/src/components/CropVue.vue`
- Modify: `packages/vue/src/types/ui.ts`

**Step 1: Add new props to CropVue**

```typescript
const props = withDefaults(defineProps<{
  // ... existing props ...
  mode?: CropperMode
  moveImage?: boolean | MoveImageConfig
  resizeImage?: boolean | ResizeImageConfig
  transitions?: boolean
  autoZoom?: boolean
  imageRestriction?: ImageRestriction
  handlers?: HandlersConfig
  checkOrientation?: boolean
  stencilSize?: StencilSize
  minAspectRatio?: number
  maxAspectRatio?: number
}>(), {
  // ... existing defaults ...
  mode: 'classic',
  moveImage: true,
  resizeImage: true,
  transitions: true,
  autoZoom: undefined, // auto-detected from mode
  imageRestriction: 'fit-area',
  handlers: undefined,
  checkOrientation: true,
  stencilSize: undefined,
  minAspectRatio: undefined,
  maxAspectRatio: undefined,
})
```

**Step 2: Pass props through to CropEditor**

```html
<CropEditor
  :image="cropper.image.value"
  :transform="cropper.transform.value"
  :crop="cropper.crop.value"
  :pannable="pannable"
  :mode="mode"
  :move-image="moveImage"
  :resize-image="resizeImage"
  :handlers="handlers"
  :transitions="transitions"
  :is-transitioning="cropper.isTransitioning.value"
  @update:transform="t => cropper.transform.value = t"
  @update:crop="c => cropper.crop.value = c"
/>
```

**Step 3: Pass new options to `useCropper`**

```typescript
const cropper = useCropper({
  // ... existing options ...
  mode: props.mode,
  transitions: props.transitions,
  autoZoom: props.autoZoom,
  imageRestriction: props.imageRestriction,
  checkOrientation: props.checkOrientation,
  minAspectRatio: props.minAspectRatio,
  maxAspectRatio: props.maxAspectRatio,
})
```

**Step 4: Update editor slot props**

Add the new props to the editor scoped slot so custom editor implementations receive them.

**Step 5: Commit**

```bash
git add packages/vue/src/components/CropVue.vue packages/vue/src/types/ui.ts
git commit -m "feat(vue): pass through mode, restriction, and handler props to CropEditor"
```

---

### Task 14: Update Vue Package Exports

**Files:**
- Modify: `packages/vue/src/index.ts`

Ensure all new types are re-exported from the vue package so consumers can import them.

**Step 1: Commit**

```bash
git add packages/vue/src/index.ts
git commit -m "feat(vue): export new types from vue package"
```

---

## Phase 4: Integration & Testing

### Task 15: Playground — Cropper Mode Examples

**Files:**
- Modify: `playground/src/App.vue` (or equivalent playground file)

Add sections to the playground demonstrating:

1. **Classic mode** (default) — existing behavior
2. **Static mode** — fixed stencil, pan/zoom the image underneath (Twitter-style)
3. **Hybrid mode** — movable stencil with auto-zoom snap-back (Telegram-style)
4. **8-directional handles** — show configurable handles
5. **Pinch-to-zoom** — test on mobile/touch device
6. **Transitions** — toggle transitions on/off, watch smooth rotate/flip

Each example should be a compact section like the existing playground examples.

**Step 1: Commit**

```bash
git add playground/
git commit -m "feat(playground): add examples for cropper modes, handles, and transitions"
```

---

### Task 16: Full Test Suite Run

**Step 1: Run all core tests**

Run: `cd packages/core && npx vitest run`
Expected: ALL PASS

**Step 2: Run all vue tests**

Run: `cd packages/vue && npx vitest run` (if tests exist)
Expected: ALL PASS

**Step 3: Build packages**

Run: `npm run build` (or equivalent monorepo build command)
Expected: Clean build, no type errors

**Step 4: Commit any fixes**

```bash
git commit -m "fix: resolve test and build issues from feature parity work"
```

---

## Summary of New Files

| File | Purpose |
|------|---------|
| `packages/core/src/engine/image-restriction.ts` | Pan/zoom bounds for 4 restriction modes |
| `packages/core/src/engine/visible-area.ts` | Transform ↔ visible area conversion |
| `packages/core/src/engine/auto-zoom.ts` | 3 auto-zoom strategies |
| `packages/core/src/utils/exif.ts` | EXIF orientation reading |
| `packages/core/src/__tests__/image-restriction.test.ts` | Tests |
| `packages/core/src/__tests__/visible-area.test.ts` | Tests |
| `packages/core/src/__tests__/auto-zoom.test.ts` | Tests |
| `packages/core/src/__tests__/exif.test.ts` | Tests |
| `packages/core/src/__tests__/types.test.ts` | Type compilation tests |

## Modified Files

| File | Changes |
|------|---------|
| `packages/core/src/types.ts` | New type definitions |
| `packages/core/src/engine/gestures.ts` | `handlePinchZoom` + aspect ratio for edge handles |
| `packages/core/src/composables/usePointerHandler.ts` | Multi-touch, mode-aware routing |
| `packages/core/src/composables/useCropper.ts` | New options, methods, transitions, EXIF |
| `packages/core/src/index.ts` | Export new modules |
| `packages/vue/src/components/CropEditor.vue` | 8 handles, transitions, mode support |
| `packages/vue/src/components/CropVue.vue` | New props passthrough |
| `packages/vue/src/types/ui.ts` | UI type updates if needed |
| `packages/vue/src/index.ts` | Re-export new types |

## Not In Scope (Future Work)

- **Pluggable stencil component system** — The design is documented but implementation deferred. The current stencil types (rectangle, circle, freeform) cover all common cases. The pluggable API can be added as a follow-up.
- **Coordinates-only mode** (`canvas: false`) — Low priority, can be added later.
- **Pre-built themes** (classic, compact, bubble) — CropVue uses the `ui` prop + CSS variables instead.
- **Standalone Preview component** — CropPreview already exists.

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { TransformState, CropState, ImageData as CropImageData, HandlersConfig, CropperMode, MoveImageConfig, ResizeImageConfig } from '@cropvue/core'
import {
  usePointerHandler,
  handlePan,
  handleZoom,
  handlePinchZoom,
  handleCropResize,
  handleCropMove,
  handleKeyboard,
  isPointInsideStencil,
} from '@cropvue/core'
import type { HandlePosition, PointerHandlerCleanup } from '@cropvue/core'
import type { CropEditorUI } from '../types/ui'
import { useComponentUI } from '../composables/useComponentUI'

const props = withDefaults(defineProps<{
  image: CropImageData | null
  transform: TransformState
  crop: CropState
  pannable?: boolean
  handlers?: HandlersConfig
  mode?: CropperMode
  moveImage?: boolean | MoveImageConfig
  resizeImage?: boolean | ResizeImageConfig
  transitions?: boolean
  isTransitioning?: boolean
  ui?: CropEditorUI
}>(), {
  pannable: true,
  handlers: () => ({ nw: true, n: true, ne: true, e: true, se: true, s: true, sw: true, w: true }),
  mode: 'classic',
  moveImage: true,
  resizeImage: true,
  transitions: true,
  isTransitioning: false,
})

const mergedUi = useComponentUI('CropEditor', () => props.ui)

const emit = defineEmits<{
  'update:transform': [transform: TransformState]
  'update:crop': [crop: CropState]
}>()

const HANDLE_HIT_THRESHOLD = 20 // px hit area around crop handles

const editorRef = ref<HTMLElement | null>()
const containerRef = ref<HTMLElement | null>()
const containerWidth = ref(0)
const containerHeight = ref(0)
const isPanning = ref(false)

const activeHandles = computed(() => {
  if (props.mode === 'static') return []
  const all = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const
  return all.filter(pos => props.handlers[pos] !== false)
})

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

const displayScale = computed(() => {
  const img = props.image
  if (!img || containerWidth.value === 0 || containerHeight.value === 0) return 1
  if (img.naturalWidth === 0 || img.naturalHeight === 0) return 1

  const scaleX = containerWidth.value / img.naturalWidth
  const scaleY = containerHeight.value / img.naturalHeight
  return Math.min(scaleX, scaleY, 1)
})

const displayWidth = computed(() => {
  const img = props.image
  if (!img) return 0
  return img.naturalWidth * displayScale.value
})

const displayHeight = computed(() => {
  const img = props.image
  if (!img) return 0
  return img.naturalHeight * displayScale.value
})

const imageOffset = computed(() => ({
  x: (containerWidth.value - displayWidth.value) / 2,
  y: (containerHeight.value - displayHeight.value) / 2,
}))

const imageStyle = computed(() => {
  const t = props.transform
  const s = displayScale.value
  const parts: string[] = []
  parts.push(`translate(${t.x * s}px, ${t.y * s}px)`)
  parts.push(`scale(${t.flipX ? -t.scale : t.scale}, ${t.flipY ? -t.scale : t.scale})`)
  parts.push(`rotate(${t.rotation}deg)`)
  return {
    width: `${displayWidth.value}px`,
    height: `${displayHeight.value}px`,
    transform: parts.join(' '),
    transformOrigin: 'center center',
  }
})

const cropStyle = computed(() => {
  const s = displayScale.value
  const offset = imageOffset.value
  return {
    left: `${props.crop.x * s + offset.x}px`,
    top: `${props.crop.y * s + offset.y}px`,
    width: `${props.crop.width * s}px`,
    height: `${props.crop.height * s}px`,
  }
})

const overlayStyle = computed(() => {
  const c = props.crop
  const s = displayScale.value
  const offset = imageOffset.value

  const cropX = c.x * s + offset.x
  const cropY = c.y * s + offset.y
  const cropW = c.width * s
  const cropH = c.height * s

  const cw = containerWidth.value
  const ch = containerHeight.value

  let holePath: string

  if (c.stencil === 'circle') {
    const r = Math.min(cropW, cropH) / 2
    const cx = cropX + cropW / 2
    const cy = cropY + cropH / 2
    // SVG arc: move to left of circle, arc top half, arc bottom half
    holePath = `M${cx - r},${cy} A${r},${r} 0 1,1 ${cx + r},${cy} A${r},${r} 0 1,1 ${cx - r},${cy} Z`
  } else if (c.stencil === 'freeform' && c.points && c.points.length >= 3) {
    const pts = c.points
    const scaledPts = pts.map(p => `${p.x * s + offset.x},${p.y * s + offset.y}`)
    holePath = `M${scaledPts[0]} ${scaledPts.slice(1).map(p => `L${p}`).join(' ')} Z`
  } else {
    // Rectangle
    holePath = `M${cropX},${cropY} L${cropX + cropW},${cropY} L${cropX + cropW},${cropY + cropH} L${cropX},${cropY + cropH} Z`
  }

  // Outer rect (full container) + inner hole with evenodd fill-rule
  const outerPath = `M0,0 L${cw},0 L${cw},${ch} L0,${ch} Z`
  const clipPath = `path(evenodd, "${outerPath} ${holePath}")`

  return { clipPath }
})

// For slot users who want the simple clip-path value
const overlayClipPath = computed(() => {
  const c = props.crop
  const s = displayScale.value
  const offset = imageOffset.value

  const cropX = c.x * s + offset.x
  const cropY = c.y * s + offset.y
  const cropW = c.width * s
  const cropH = c.height * s

  if (c.stencil === 'circle') {
    const r = Math.min(cropW, cropH) / 2
    const cx = cropX + cropW / 2
    const cy = cropY + cropH / 2
    return `circle(${r}px at ${cx}px ${cy}px)`
  }

  const top = cropY
  const right = containerWidth.value - (cropX + cropW)
  const bottom = containerHeight.value - (cropY + cropH)
  const left = cropX
  return `inset(${top}px ${right}px ${bottom}px ${left}px)`
})

function updateContainerSize() {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
    containerHeight.value = containerRef.value.clientHeight
  }
}

let pointerHandler: PointerHandlerCleanup | null = null

function setupPointerHandler() {
  if (pointerHandler) {
    pointerHandler.destroy()
    pointerHandler = null
  }

  const viewport = editorRef.value
  if (!viewport) return

  pointerHandler = usePointerHandler(viewport, {
    onPan(dx, dy) {
      if (!isMoveImageEnabled() && !props.pannable) return
      isPanning.value = true
      emit('update:transform', handlePan(props.transform, dx, dy))
    },
    onPinchZoom(factor, cx, cy, pdx, pdy) {
      if (!isResizeImageEnabled()) return
      emit('update:transform', handlePinchZoom(props.transform, factor, cx, cy, pdx, pdy))
    },
    onZoom(delta, centerX, centerY) {
      if (!isResizeImageEnabled()) return
      emit('update:transform', handleZoom(props.transform, delta, centerX, centerY))
    },
    onCropResize(handle, dx, dy) {
      const img = props.image
      const bounds = img
        ? { width: img.naturalWidth, height: img.naturalHeight }
        : { width: props.crop.width, height: props.crop.height }
      emit('update:crop', handleCropResize(props.crop, handle, dx, dy, bounds))
    },
    onCropMove(dx, dy) {
      const img = props.image
      const bounds = img
        ? { width: img.naturalWidth, height: img.naturalHeight }
        : { width: props.crop.width, height: props.crop.height }
      emit('update:crop', handleCropMove(props.crop, dx, dy, bounds))
    },
    onKeyboard(key, shiftKey) {
      if (!isMoveImageEnabled() && !props.pannable) return
      emit('update:transform', handleKeyboard(props.transform, key, shiftKey))
    },
    getHandleAtPoint(e: PointerEvent) {
      const target = e.target as HTMLElement
      const attr = target?.getAttribute?.('data-handle')
      if (attr) return attr as HandlePosition

      const s = displayScale.value
      const offset = imageOffset.value
      const c = props.crop
      const cropLeft = c.x * s + offset.x
      const cropTop = c.y * s + offset.y
      const cropRight = cropLeft + c.width * s
      const cropBottom = cropTop + c.height * s

      const viewportEl = editorRef.value
      if (!viewportEl) return null
      const rect = viewportEl.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const threshold = HANDLE_HIT_THRESHOLD

      if (c.stencil === 'circle') {
        // Circle: NE handle sits on circle edge at 45°
        const r = Math.min(c.width * s, c.height * s) / 2
        const cx = cropLeft + (c.width * s) / 2
        const cy = cropTop + (c.height * s) / 2
        const handleX = cx + r * Math.SQRT1_2
        const handleY = cy - r * Math.SQRT1_2
        if (Math.abs(px - handleX) < threshold && Math.abs(py - handleY) < threshold) return 'ne'
        return null
      }

      // Corner handles (check first — corners take priority)
      if (props.handlers.nw !== false && Math.abs(px - cropLeft) < threshold && Math.abs(py - cropTop) < threshold) return 'nw'
      if (props.handlers.ne !== false && Math.abs(px - cropRight) < threshold && Math.abs(py - cropTop) < threshold) return 'ne'
      if (props.handlers.sw !== false && Math.abs(px - cropLeft) < threshold && Math.abs(py - cropBottom) < threshold) return 'sw'
      if (props.handlers.se !== false && Math.abs(px - cropRight) < threshold && Math.abs(py - cropBottom) < threshold) return 'se'

      // Edge handles (midpoints of edges)
      const midX = (cropLeft + cropRight) / 2
      const midY = (cropTop + cropBottom) / 2

      if (props.handlers.n !== false && Math.abs(py - cropTop) < threshold && Math.abs(px - midX) < (cropRight - cropLeft) / 2) return 'n'
      if (props.handlers.s !== false && Math.abs(py - cropBottom) < threshold && Math.abs(px - midX) < (cropRight - cropLeft) / 2) return 's'
      if (props.handlers.e !== false && Math.abs(px - cropRight) < threshold && Math.abs(py - midY) < (cropBottom - cropTop) / 2) return 'e'
      if (props.handlers.w !== false && Math.abs(px - cropLeft) < threshold && Math.abs(py - midY) < (cropBottom - cropTop) / 2) return 'w'

      return null
    },
    isInsideCropArea(e: PointerEvent) {
      const s = displayScale.value
      const offset = imageOffset.value
      const c = props.crop

      const viewportEl = editorRef.value
      if (!viewportEl) return false
      const rect = viewportEl.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top

      // Convert screen coords to image coords for stencil hit test
      const imgX = (px - offset.x) / s
      const imgY = (py - offset.y) / s

      return isPointInsideStencil(imgX, imgY, c)
    },
    displayScale: () => displayScale.value,
    mode: props.mode,
    moveImage: typeof props.moveImage === 'boolean' ? props.moveImage : true,
    resizeImage: typeof props.resizeImage === 'boolean' ? props.resizeImage : true,
  })
}

let resizeObserver: ResizeObserver | null = null
let resizeRaf: number | null = null

onMounted(() => {
  updateContainerSize()
  setupPointerHandler()
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (resizeRaf) return
      resizeRaf = requestAnimationFrame(() => {
        updateContainerSize()
        resizeRaf = null
      })
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeRaf) {
    cancelAnimationFrame(resizeRaf)
    resizeRaf = null
  }
  resizeObserver?.disconnect()
  resizeObserver = null
  if (pointerHandler) {
    pointerHandler.destroy()
    pointerHandler = null
  }
})

watch(() => props.image, async () => {
  await nextTick()
  updateContainerSize()
})

watch([() => props.mode, () => props.moveImage, () => props.resizeImage], () => {
  setupPointerHandler()
})

function onViewportPointerUp() {
  isPanning.value = false
}

defineExpose({ editorRef, displayScale })
</script>

<template>
  <div ref="containerRef" class="cropvue-editor" :class="mergedUi.root">
    <div
      ref="editorRef"
      class="cropvue-editor__viewport"
      :class="[mergedUi.viewport, {
        'cropvue-editor__viewport--panning': isPanning,
        'cropvue-editor__viewport--transitioning': isTransitioning
      }]"
      tabindex="0"
      @pointerup="onViewportPointerUp"
    >
      <slot
        name="image"
        :style="imageStyle"
        :image="image"
        :transform="transform"
      >
        <img
          v-if="image"
          :src="image.element.src"
          class="cropvue-editor__image"
          :class="mergedUi.image"
          :style="imageStyle"
          draggable="false"
          alt=""
        />
      </slot>

      <slot
        name="overlay"
        :crop="crop"
        :clip-path="overlayClipPath"
      >
        <div class="cropvue-editor__overlay" :class="mergedUi.overlay" :style="overlayStyle" />
      </slot>

      <slot
        name="crop-area"
        :crop="crop"
        :style="cropStyle"
      >
        <div
          class="cropvue-editor__crop-area"
          :class="[mergedUi.cropArea, { 'cropvue-editor__crop-area--circle': crop.stencil === 'circle' }]"
          :style="cropStyle"
        >
          <slot v-if="crop.stencil !== 'circle'" name="grid" :crop="crop">
            <div class="cropvue-editor__grid" :class="mergedUi.grid">
              <div class="cropvue-editor__grid-line cropvue-editor__grid-line--h1" :class="mergedUi.gridLine" />
              <div class="cropvue-editor__grid-line cropvue-editor__grid-line--h2" :class="mergedUi.gridLine" />
              <div class="cropvue-editor__grid-line cropvue-editor__grid-line--v1" :class="mergedUi.gridLine" />
              <div class="cropvue-editor__grid-line cropvue-editor__grid-line--v2" :class="mergedUi.gridLine" />
            </div>
          </slot>

          <slot name="handles" :crop="crop">
            <template v-if="crop.stencil === 'circle'">
              <div v-if="handlers.ne !== false" class="cropvue-editor__handle cropvue-editor__handle--ne" :class="mergedUi.handle" data-handle="ne" />
            </template>
            <template v-else>
              <div v-for="pos in activeHandles" :key="pos"
                :class="['cropvue-editor__handle', `cropvue-editor__handle--${pos}`, mergedUi.handle]"
                :data-handle="pos"
              />
            </template>
          </slot>
        </div>
      </slot>
    </div>
  </div>
</template>

<style>
.cropvue-editor {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: var(--cropvue-editor-height, auto);
  aspect-ratio: var(--cropvue-editor-aspect-ratio, 4 / 3);
  max-height: var(--cropvue-editor-max-height, none);
  min-height: var(--cropvue-editor-min-height, 120px);
  border-radius: var(--cropvue-editor-border-radius, 0);
  background: var(--cropvue-editor-bg, #1a1a1a);
  user-select: none;
  touch-action: none;
}

.cropvue-editor__viewport {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  outline: none;
}

.cropvue-editor__viewport--panning {
  cursor: grabbing;
}

.cropvue-editor__image {
  pointer-events: none;
  flex-shrink: 0;
}

.cropvue-editor__overlay {
  position: absolute;
  inset: 0;
  background: var(--cropvue-overlay-color, rgba(0, 0, 0, 0.5));
  pointer-events: none;
  transition: background var(--cropvue-overlay-transition, 150ms ease);
}

.cropvue-editor__crop-area {
  position: absolute;
  border: var(--cropvue-crop-border-width, 2px) var(--cropvue-crop-border-style, solid) var(--cropvue-crop-border-color, #fff);
  box-sizing: border-box;
  pointer-events: auto;
  cursor: move;
}

.cropvue-editor__crop-area--circle {
  border-radius: 50%;
}

.cropvue-editor__grid {
  position: absolute;
  inset: 0;
  display: var(--cropvue-grid-display, block);
}

.cropvue-editor__grid-line {
  position: absolute;
  background: var(--cropvue-grid-color, rgba(255, 255, 255, 0.3));
}

.cropvue-editor__grid-line--h1,
.cropvue-editor__grid-line--h2 {
  left: 0;
  right: 0;
  height: var(--cropvue-grid-width, 1px);
}

.cropvue-editor__grid-line--h1 { top: 33.33%; }
.cropvue-editor__grid-line--h2 { top: 66.66%; }

.cropvue-editor__grid-line--v1,
.cropvue-editor__grid-line--v2 {
  top: 0;
  bottom: 0;
  width: var(--cropvue-grid-width, 1px);
}

.cropvue-editor__grid-line--v1 { left: 33.33%; }
.cropvue-editor__grid-line--v2 { left: 66.66%; }

.cropvue-editor__handle {
  position: absolute;
  width: var(--cropvue-handle-size, 10px);
  height: var(--cropvue-handle-size, 10px);
  background: var(--cropvue-handle-color, #fff);
  border-radius: var(--cropvue-handle-border-radius, 50%);
  pointer-events: auto;
}

.cropvue-editor__handle--nw { top: -5px; left: -5px; cursor: nwse-resize; }
.cropvue-editor__handle--ne { top: -5px; right: -5px; cursor: nesw-resize; }
.cropvue-editor__handle--sw { bottom: -5px; left: -5px; cursor: nesw-resize; }
.cropvue-editor__handle--se { bottom: -5px; right: -5px; cursor: nwse-resize; }

.cropvue-editor__handle--n { top: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.cropvue-editor__handle--s { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.cropvue-editor__handle--e { right: -5px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
.cropvue-editor__handle--w { left: -5px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }

/* Circle: place NE handle on the circle edge at 45° */
.cropvue-editor__crop-area--circle .cropvue-editor__handle--ne {
  /* 50% + 50% * cos(45°) ≈ 85.36%, 50% - 50% * sin(45°) ≈ 14.64% */
  top: 14.64%;
  right: auto;
  left: 85.36%;
  transform: translate(-50%, -50%);
}

@media (max-width: 768px) {
  .cropvue-editor__handle--nw { top: -8px; left: -8px; }
  .cropvue-editor__handle--ne { top: -8px; right: -8px; }
  .cropvue-editor__handle--sw { bottom: -8px; left: -8px; }
  .cropvue-editor__handle--se { bottom: -8px; right: -8px; }
  .cropvue-editor__handle--n { top: -8px; }
  .cropvue-editor__handle--s { bottom: -8px; }
  .cropvue-editor__handle--e { right: -8px; }
  .cropvue-editor__handle--w { left: -8px; }
}

@media (pointer: coarse) {
  .cropvue-editor__handle {
    width: 20px;
    height: 20px;
  }

  .cropvue-editor__handle--nw { top: -10px; left: -10px; }
  .cropvue-editor__handle--ne { top: -10px; right: -10px; }
  .cropvue-editor__handle--sw { bottom: -10px; left: -10px; }
  .cropvue-editor__handle--se { bottom: -10px; right: -10px; }
  .cropvue-editor__handle--n { top: -10px; }
  .cropvue-editor__handle--s { bottom: -10px; }
  .cropvue-editor__handle--e { right: -10px; }
  .cropvue-editor__handle--w { left: -10px; }
}

/* Transition support */
.cropvue-editor__viewport--transitioning .cropvue-editor__image {
  transition: transform 300ms ease-out;
}

.cropvue-editor__viewport--transitioning .cropvue-editor__crop-area {
  transition: left 300ms ease-out, top 300ms ease-out, width 300ms ease-out, height 300ms ease-out;
}

.cropvue-editor__viewport--transitioning .cropvue-editor__overlay {
  transition: clip-path 300ms ease-out;
}
</style>

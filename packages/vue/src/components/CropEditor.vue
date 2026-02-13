<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { TransformState, CropState, ImageData as CropImageData } from '@cropvue/core'

const props = defineProps<{
  image: CropImageData | null
  transform: TransformState
  crop: CropState
}>()

const emit = defineEmits<{
  'update:transform': [transform: TransformState]
  'update:crop': [crop: CropState]
}>()

const editorRef = ref<HTMLElement | null>()
const containerRef = ref<HTMLElement | null>()

const imageStyle = computed(() => {
  const t = props.transform
  const parts: string[] = []
  parts.push(`translate(${t.x}px, ${t.y}px)`)
  parts.push(`scale(${t.flipX ? -t.scale : t.scale}, ${t.flipY ? -t.scale : t.scale})`)
  parts.push(`rotate(${t.rotation}deg)`)
  return {
    transform: parts.join(' '),
    transformOrigin: 'center center',
  }
})

const cropStyle = computed(() => ({
  left: `${props.crop.x}px`,
  top: `${props.crop.y}px`,
  width: `${props.crop.width}px`,
  height: `${props.crop.height}px`,
}))

const overlayClipPath = computed(() => {
  const c = props.crop
  if (c.stencil === 'circle') {
    const r = Math.min(c.width, c.height) / 2
    const cx = c.x + c.width / 2
    const cy = c.y + c.height / 2
    return `circle(${r}px at ${cx}px ${cy}px)`
  }
  return `inset(${c.y}px ${containerWidth.value - (c.x + c.width)}px ${containerHeight.value - (c.y + c.height)}px ${c.x}px)`
})

const containerWidth = ref(0)
const containerHeight = ref(0)

function updateContainerSize() {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
    containerHeight.value = containerRef.value.clientHeight
  }
}

onMounted(() => {
  updateContainerSize()
  window.addEventListener('resize', updateContainerSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerSize)
})

watch(() => props.image, () => {
  updateContainerSize()
})

defineExpose({ editorRef })
</script>

<template>
  <div ref="containerRef" class="cropvue-editor">
    <div ref="editorRef" class="cropvue-editor__viewport">
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
        <div class="cropvue-editor__overlay" />
      </slot>

      <slot
        name="crop-area"
        :crop="crop"
        :style="cropStyle"
      >
        <div class="cropvue-editor__crop-area" :style="cropStyle">
          <slot name="grid" :crop="crop">
            <div class="cropvue-editor__grid">
              <div class="cropvue-editor__grid-line cropvue-editor__grid-line--h1" />
              <div class="cropvue-editor__grid-line cropvue-editor__grid-line--h2" />
              <div class="cropvue-editor__grid-line cropvue-editor__grid-line--v1" />
              <div class="cropvue-editor__grid-line cropvue-editor__grid-line--v2" />
            </div>
          </slot>

          <slot name="handles" :crop="crop">
            <div class="cropvue-editor__handle cropvue-editor__handle--nw" />
            <div class="cropvue-editor__handle cropvue-editor__handle--ne" />
            <div class="cropvue-editor__handle cropvue-editor__handle--sw" />
            <div class="cropvue-editor__handle cropvue-editor__handle--se" />
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
  min-height: 300px;
  background: var(--cropvue-editor-bg, #1a1a1a);
  user-select: none;
  touch-action: none;
}

.cropvue-editor__viewport {
  position: relative;
  width: 100%;
  height: 100%;
}

.cropvue-editor__image {
  position: absolute;
  top: 50%;
  left: 50%;
  max-width: none;
  pointer-events: none;
  margin-top: -50%;
  margin-left: -50%;
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
}

.cropvue-editor__handle--nw { top: -5px; left: -5px; cursor: nwse-resize; }
.cropvue-editor__handle--ne { top: -5px; right: -5px; cursor: nesw-resize; }
.cropvue-editor__handle--sw { bottom: -5px; left: -5px; cursor: nesw-resize; }
.cropvue-editor__handle--se { bottom: -5px; right: -5px; cursor: nwse-resize; }
</style>

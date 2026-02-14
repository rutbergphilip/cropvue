<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { renderCrop } from '@cropvue/core'
import type { TransformState, CropState, ImageData as CropImageData } from '@cropvue/core'
import type { CropPreviewUI } from '../types/ui'
import { useComponentUI } from '../composables/useComponentUI'

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

const mergedUi = useComponentUI('CropPreview', () => props.ui)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | undefined

function render() {
  const canvas = canvasRef.value
  const img = props.image
  if (!canvas || !img) return

  renderCrop(canvas, img.element, props.crop, props.transform, {
    maxWidth: props.maxWidth,
    maxHeight: props.maxHeight,
  })
}

function debouncedRender() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(render, props.debounce)
}

watch([() => props.transform, () => props.crop, () => props.image], debouncedRender, {
  deep: true,
})

onMounted(() => {
  if (props.image) render()
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

defineExpose({ canvasRef, render })
</script>

<template>
  <div class="cropvue-preview" :class="mergedUi.root">
    <slot :canvas-ref="canvasRef" :render="render">
      <canvas ref="canvasRef" class="cropvue-preview__canvas" :class="mergedUi.canvas" />
    </slot>
  </div>
</template>

<style>
.cropvue-preview {
  display: inline-block;
  overflow: hidden;
  border-radius: var(--cropvue-preview-border-radius, 0);
  background: var(--cropvue-preview-bg, transparent);
}

.cropvue-preview__canvas {
  display: block;
  max-width: 100%;
  height: auto;
}
</style>

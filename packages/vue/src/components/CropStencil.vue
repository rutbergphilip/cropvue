<script setup lang="ts">
import { computed } from 'vue'
import type { CropState, Point } from '@cropvue/core'
import type { CropStencilUI } from '../types/ui'
import { useComponentUI } from '../composables/useComponentUI'

const props = defineProps<{
  crop: CropState
  containerWidth: number
  containerHeight: number
  ui?: CropStencilUI
}>()

const mergedUi = useComponentUI('CropStencil', () => props.ui)

const clipPath = computed(() => {
  const c = props.crop

  if (c.stencil === 'circle') {
    const r = Math.min(c.width, c.height) / 2
    const cx = c.x + c.width / 2
    const cy = c.y + c.height / 2
    return `circle(${r}px at ${cx}px ${cy}px)`
  }

  if (c.stencil === 'freeform' && c.points && c.points.length >= 3) {
    const coords = c.points.map((p: Point) => `${p.x}px ${p.y}px`).join(', ')
    return `polygon(${coords})`
  }

  // Rectangle (default)
  const top = c.y
  const right = props.containerWidth - (c.x + c.width)
  const bottom = props.containerHeight - (c.y + c.height)
  const left = c.x
  return `inset(${top}px ${right}px ${bottom}px ${left}px)`
})

const stencilStyle = computed(() => ({
  clipPath: clipPath.value,
  WebkitClipPath: clipPath.value,
}))
</script>

<template>
  <div class="cropvue-stencil" :class="mergedUi.root">
    <slot
      :clip-path="clipPath"
      :style="stencilStyle"
      :crop="crop"
      :stencil="crop.stencil"
      :points="crop.points"
    >
      <div class="cropvue-stencil__shape" :class="mergedUi.shape" :style="stencilStyle" />
    </slot>
  </div>
</template>

<style>
.cropvue-stencil {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cropvue-stencil__shape {
  position: absolute;
  inset: 0;
  background: var(--cropvue-stencil-bg, transparent);
  border: var(--cropvue-stencil-border, none);
}
</style>

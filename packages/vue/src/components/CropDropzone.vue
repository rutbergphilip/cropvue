<script setup lang="ts">
import { useDropzone } from '@cropvue/core'
import type { CropVueError } from '@cropvue/core'
import type { CropDropzoneUI } from '../types/ui'
import { useComponentUI } from '../composables/useComponentUI'

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

const mergedUi = useComponentUI('CropDropzone', () => props.ui)

defineExpose({ open, files })
</script>

<template>
  <div ref="dropzoneRef" class="cropvue-dropzone" :class="[mergedUi.root, { 'cropvue-dropzone--active': isDragging }]">
    <slot :open="open" :is-dragging="isDragging">
      <div class="cropvue-dropzone__default" :class="mergedUi.default" @click="open">
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

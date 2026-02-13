<script setup lang="ts">
import type { TransformState } from '@cropvue/core'

defineProps<{
  transform: TransformState
}>()

const emit = defineEmits<{
  'rotate-left': []
  'rotate-right': []
  'flip-x': []
  'flip-y': []
  'zoom-in': []
  'zoom-out': []
  'reset': []
}>()

function rotateLeft() { emit('rotate-left') }
function rotateRight() { emit('rotate-right') }
function flipX() { emit('flip-x') }
function flipY() { emit('flip-y') }
function zoomIn() { emit('zoom-in') }
function zoomOut() { emit('zoom-out') }
function reset() { emit('reset') }
</script>

<template>
  <div class="cropvue-toolbar">
    <slot
      :rotate-left="rotateLeft"
      :rotate-right="rotateRight"
      :flip-x="flipX"
      :flip-y="flipY"
      :zoom-in="zoomIn"
      :zoom-out="zoomOut"
      :reset="reset"
      :transform="transform"
    >
      <div class="cropvue-toolbar__default">
        <button type="button" class="cropvue-toolbar__btn" title="Rotate left" @click="rotateLeft">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2.5 2v6h6M2.66 12a9 9 0 1 0 1.18-4.5" />
          </svg>
        </button>
        <button type="button" class="cropvue-toolbar__btn" title="Rotate right" @click="rotateRight">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 12a9 9 0 1 1-1.18-4.5" />
          </svg>
        </button>

        <span class="cropvue-toolbar__separator" />

        <button type="button" class="cropvue-toolbar__btn" title="Flip horizontal" @click="flipX">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M12 20V4" />
          </svg>
        </button>
        <button type="button" class="cropvue-toolbar__btn" title="Flip vertical" @click="flipY">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3M20 12H4" />
          </svg>
        </button>

        <span class="cropvue-toolbar__separator" />

        <button type="button" class="cropvue-toolbar__btn" title="Zoom out" @click="zoomOut">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <button type="button" class="cropvue-toolbar__btn" title="Zoom in" @click="zoomIn">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>

        <span class="cropvue-toolbar__separator" />

        <button type="button" class="cropvue-toolbar__btn" title="Reset" @click="reset">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
        </button>
      </div>
    </slot>
  </div>
</template>

<style>
.cropvue-toolbar {
  display: flex;
  align-items: center;
}

.cropvue-toolbar__default {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: var(--cropvue-toolbar-bg, #fff);
  border-radius: var(--cropvue-toolbar-border-radius, 8px);
  border: 1px solid var(--cropvue-toolbar-border-color, #e5e7eb);
}

.cropvue-toolbar__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--cropvue-toolbar-btn-color, #374151);
  border-radius: var(--cropvue-toolbar-btn-radius, 6px);
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}

.cropvue-toolbar__btn:hover {
  background: var(--cropvue-toolbar-btn-hover-bg, #f3f4f6);
  color: var(--cropvue-toolbar-btn-hover-color, #111827);
}

.cropvue-toolbar__btn:active {
  background: var(--cropvue-toolbar-btn-active-bg, #e5e7eb);
}

.cropvue-toolbar__separator {
  width: 1px;
  height: 20px;
  margin: 0 4px;
  background: var(--cropvue-toolbar-separator-color, #e5e7eb);
}
</style>

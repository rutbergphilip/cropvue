<script setup lang="ts">
import { useImageQueue } from '@cropvue/core'
import type { QueueItem } from '@cropvue/core'
import type { CropQueueUI } from '../types/ui'
import { useComponentUI } from '../composables/useComponentUI'

const props = defineProps<{
  ui?: CropQueueUI
}>()

const mergedUi = useComponentUI('CropQueue', () => props.ui)

const emit = defineEmits<{
  select: [item: QueueItem]
  remove: [item: QueueItem]
  change: [items: QueueItem[]]
}>()

const queue = useImageQueue()

function selectItem(index: number) {
  const item = queue.images.value[index]
  if (!item) return
  queue.select(index)
  emit('select', item)
}

function removeItem(index: number) {
  const item = queue.images.value[index]
  if (!item) return
  queue.remove(index)
  emit('remove', item)
  emit('change', queue.images.value)
}

defineExpose({ queue })
</script>

<template>
  <div class="cropvue-queue" :class="mergedUi.root">
    <slot
      :items="queue.images.value"
      :current-index="queue.current.value"
      :select="selectItem"
      :remove="removeItem"
      :add="queue.add"
    >
      <div class="cropvue-queue__list" :class="mergedUi.list">
        <div
          v-for="(item, index) in queue.images.value"
          :key="item.id"
          class="cropvue-queue__item"
          :class="[
            mergedUi.item,
            {
              'cropvue-queue__item--active': queue.current.value === index,
              'cropvue-queue__item--done': item.status === 'done',
            },
            queue.current.value === index && mergedUi.itemActive,
            item.status === 'done' && mergedUi.itemDone,
          ]"
          @click="selectItem(index)"
        >
          <img
            :src="item.thumbnail"
            :alt="`Queue item ${index + 1}`"
            class="cropvue-queue__thumbnail"
            :class="mergedUi.thumbnail"
          />
          <button
            type="button"
            class="cropvue-queue__remove"
            :class="mergedUi.removeButton"
            title="Remove"
            @click.stop="removeItem(index)"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div v-if="item.status === 'done'" class="cropvue-queue__check" :class="mergedUi.checkIcon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      </div>
    </slot>
  </div>
</template>

<style>
.cropvue-queue__list {
  display: flex;
  gap: 8px;
  padding: 8px;
  overflow-x: auto;
}

.cropvue-queue__item {
  position: relative;
  flex-shrink: 0;
  width: var(--cropvue-queue-thumb-size, 64px);
  height: var(--cropvue-queue-thumb-size, 64px);
  border-radius: var(--cropvue-queue-thumb-radius, 6px);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 150ms ease;
}

.cropvue-queue__item--active {
  border-color: var(--cropvue-queue-active-border, #3b82f6);
}

.cropvue-queue__item--done {
  opacity: 0.7;
}

.cropvue-queue__thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cropvue-queue__remove {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 150ms ease;
}

.cropvue-queue__item:hover .cropvue-queue__remove {
  opacity: 1;
}

.cropvue-queue__check {
  position: absolute;
  bottom: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: var(--cropvue-queue-check-bg, #22c55e);
  border-radius: 50%;
  color: #fff;
}

@media (pointer: coarse) {
  .cropvue-queue__remove {
    opacity: 0.8;
    width: 28px;
    height: 28px;
  }
}

@media (max-width: 768px) {
  .cropvue-queue__remove {
    min-width: 28px;
    min-height: 28px;
  }
}
</style>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCropper, useDropzone } from '@cropvue/core'
import type {
  CropResult,
  CropVueError,
  StencilType,
  OutputFormat,
  UploadFn,
  QueueItem,
} from '@cropvue/core'
import type { CropVueUI } from '../types/ui'
import { useComponentUI } from '../composables/useComponentUI'
import CropEditor from './CropEditor.vue'
import CropToolbar from './CropToolbar.vue'
import CropPreview from './CropPreview.vue'

const props = withDefaults(defineProps<{
  stencil?: StencilType
  aspectRatio?: number | null
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  outputFormat?: OutputFormat
  outputQuality?: number
  outputMaxWidth?: number
  outputMaxHeight?: number
  accept?: string[]
  maxFileSize?: number
  multiple?: boolean
  upload?: UploadFn | null
  src?: string | null
  modelValue?: CropResult | null
  pannable?: boolean
  ui?: CropVueUI
}>(), {
  stencil: 'rectangle',
  aspectRatio: null,
  minWidth: 0,
  minHeight: 0,
  maxWidth: Infinity,
  maxHeight: Infinity,
  outputFormat: 'auto',
  outputQuality: 0.85,
  outputMaxWidth: undefined,
  outputMaxHeight: undefined,
  accept: () => ['image/*'],
  maxFileSize: Infinity,
  multiple: false,
  upload: null,
  src: null,
  modelValue: null,
  pannable: true,
})

const mergedUi = useComponentUI('CropVue', () => props.ui)

const emit = defineEmits<{
  ready: [dimensions: { width: number; height: number }]
  change: [crop: { x: number; y: number; width: number; height: number }]
  done: [result: CropResult]
  cancel: []
  remove: []
  uploaded: [result: unknown]
  error: [error: CropVueError]
  'queue-change': [items: QueueItem[]]
  'update:modelValue': [result: CropResult | null]
}>()

type Phase = 'dropzone' | 'editor' | 'done'
const phase = ref<Phase>('dropzone')

const cropper = useCropper({
  stencil: props.stencil,
  aspectRatio: props.aspectRatio ?? undefined,
  minWidth: props.minWidth,
  minHeight: props.minHeight,
  maxWidth: props.maxWidth,
  maxHeight: props.maxHeight,
  outputFormat: props.outputFormat,
  outputQuality: props.outputQuality,
  outputMaxWidth: props.outputMaxWidth,
  outputMaxHeight: props.outputMaxHeight,
})

const dropzone = useDropzone({
  accept: props.accept,
  maxSize: props.maxFileSize,
  multiple: props.multiple,
  onFiles: handleFiles,
  onError: (e) => emit('error', e),
})
const dropzoneRef = dropzone.dropzoneRef

const result = ref<CropResult | null>(null)
const isUploading = ref(false)
const uploadProgress = ref(0)

async function handleFiles(files: File[]) {
  if (files.length === 0) return
  try {
    await cropper.loadFile(files[0])
    phase.value = 'editor'
    if (cropper.image.value) {
      emit('ready', {
        width: cropper.image.value.naturalWidth,
        height: cropper.image.value.naturalHeight,
      })
    }
  } catch {
    emit('error', { type: 'load-failed', message: 'Failed to load image' })
  }
}

// Watch for src prop changes
watch(() => props.src, async (newSrc) => {
  if (newSrc) {
    try {
      await cropper.loadUrl(newSrc)
      phase.value = 'editor'
      if (cropper.image.value) {
        emit('ready', {
          width: cropper.image.value.naturalWidth,
          height: cropper.image.value.naturalHeight,
        })
      }
    } catch {
      emit('error', { type: 'load-failed', message: 'Failed to load image from URL' })
    }
  }
}, { immediate: true })

// Watch stencil prop
watch(() => props.stencil, (s) => cropper.setStencil(s))
watch(() => props.aspectRatio, (r) => cropper.setAspectRatio(r ?? null))

async function confirm() {
  try {
    const cropResult = await cropper.getResult({
      format: props.outputFormat,
      quality: props.outputQuality,
      maxWidth: props.outputMaxWidth,
      maxHeight: props.outputMaxHeight,
    })

    result.value = cropResult
    emit('done', cropResult)
    emit('update:modelValue', cropResult)

    if (props.upload) {
      isUploading.value = true
      uploadProgress.value = 0
      const controller = new AbortController()
      try {
        const uploadResult = await props.upload(cropResult.file, {
          onProgress: (p) => { uploadProgress.value = p },
          signal: controller.signal,
        })
        emit('uploaded', uploadResult)
      } catch (e) {
        emit('error', { type: 'upload-failed', message: String(e) })
      } finally {
        isUploading.value = false
      }
    }

    phase.value = 'done'
  } catch (e) {
    emit('error', { type: 'compress-failed', message: String(e) })
  }
}

function cancel() {
  emit('cancel')
  if (result.value) {
    // Re-editing: return to done state with previous result
    phase.value = 'done'
  } else {
    // Initial editing: go back to dropzone
    phase.value = 'dropzone'
    cropper.reset()
  }
}

function restart() {
  phase.value = 'dropzone'
  result.value = null
  cropper.reset()
}

function remove() {
  emit('remove')
  emit('update:modelValue', null)
  phase.value = 'dropzone'
  result.value = null
  cropper.reset()
}

function reedit() {
  phase.value = 'editor'
}

defineExpose({
  cropper,
  phase,
  confirm,
  cancel,
  restart,
  reedit,
  remove,
  result,
})
</script>

<template>
  <div class="cropvue" :class="mergedUi.root">
    <!-- Dropzone Phase -->
    <div v-if="phase === 'dropzone'" ref="dropzoneRef">
      <slot
        name="dropzone"
        :open="dropzone.open"
        :is-dragging="dropzone.isDragging.value"
      >
        <div
          class="cropvue__dropzone"
          :class="[mergedUi.dropzone, { 'cropvue__dropzone--active': dropzone.isDragging.value }, dropzone.isDragging.value && mergedUi.dropzoneActive]"
          @click="dropzone.open"
        >
          <slot name="dropzone-content" :open="dropzone.open" :is-dragging="dropzone.isDragging.value">
            <p>Drop image here or click to select</p>
          </slot>
        </div>
      </slot>
    </div>

    <!-- Editor Phase -->
    <template v-if="phase === 'editor'">
      <slot
        name="editor"
        :image="cropper.image.value"
        :transform="cropper.transform.value"
        :crop="cropper.crop.value"
        :rotate-left="cropper.rotateLeft"
        :rotate-right="cropper.rotateRight"
        :flip-x="cropper.flipX"
        :flip-y="cropper.flipY"
        :zoom-in="() => cropper.zoomBy(0.1)"
        :zoom-out="() => cropper.zoomBy(-0.1)"
        :reset="cropper.reset"
        :confirm="confirm"
        :cancel="cancel"
        :remove="remove"
        :pannable="pannable"
      >
        <CropEditor
          :image="cropper.image.value"
          :transform="cropper.transform.value"
          :crop="cropper.crop.value"
          :pannable="pannable"
          @update:transform="t => cropper.transform.value = t"
          @update:crop="c => cropper.crop.value = c"
        />
      </slot>

      <slot
        name="toolbar"
        :rotate-left="cropper.rotateLeft"
        :rotate-right="cropper.rotateRight"
        :flip-x="cropper.flipX"
        :flip-y="cropper.flipY"
        :zoom-in="() => cropper.zoomBy(0.1)"
        :zoom-out="() => cropper.zoomBy(-0.1)"
        :reset="cropper.reset"
        :transform="cropper.transform.value"
      >
        <CropToolbar
          :transform="cropper.transform.value"
          @rotate-left="cropper.rotateLeft"
          @rotate-right="cropper.rotateRight"
          @flip-x="cropper.flipX"
          @flip-y="cropper.flipY"
          @zoom-in="() => cropper.zoomBy(0.1)"
          @zoom-out="() => cropper.zoomBy(-0.1)"
          @reset="cropper.reset"
        />
      </slot>

      <slot
        name="preview"
        :image="cropper.image.value"
        :transform="cropper.transform.value"
        :crop="cropper.crop.value"
      />

      <slot
        name="actions"
        :confirm="confirm"
        :cancel="cancel"
        :remove="remove"
        :is-uploading="isUploading"
        :progress="uploadProgress"
      >
        <div class="cropvue__actions" :class="mergedUi.actions">
          <button type="button" class="cropvue__btn cropvue__btn--cancel" :class="mergedUi.cancelButton" @click="cancel">Cancel</button>
          <button type="button" class="cropvue__btn cropvue__btn--confirm" :class="mergedUi.confirmButton" :disabled="isUploading" @click="confirm">
            {{ isUploading ? 'Uploading...' : 'Confirm' }}
          </button>
        </div>
      </slot>
    </template>

    <!-- Done Phase -->
    <template v-if="phase === 'done'">
      <slot name="done" :result="result" :restart="restart" :reedit="reedit" :remove="remove">
        <div class="cropvue__done" :class="mergedUi.done">
          <img v-if="result" :src="result.url" alt="Cropped result" class="cropvue__result-image" :class="mergedUi.resultImage" />
          <button type="button" class="cropvue__btn" @click="restart">Crop another</button>
        </div>
      </slot>
    </template>

    <!-- Error slot (always available) -->
    <slot name="error" />

    <!-- Loading slot -->
    <slot v-if="isUploading" name="loading" :progress="uploadProgress" />
  </div>
</template>

<style>
.cropvue {
  width: 100%;
  min-width: 0;
  max-width: var(--cropvue-max-width, none);
}

.cropvue__dropzone {
  border: 2px dashed var(--cropvue-dropzone-border-color, #d1d5db);
  border-radius: var(--cropvue-dropzone-border-radius, 8px);
  background: var(--cropvue-dropzone-bg, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
  color: #6b7280;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease;
}

.cropvue__dropzone--active {
  border-color: var(--cropvue-dropzone-border-color-active, #3b82f6);
  background: var(--cropvue-dropzone-bg-active, rgba(59, 130, 246, 0.05));
}

.cropvue__actions {
  display: flex;
  gap: var(--cropvue-actions-gap, 8px);
  justify-content: flex-end;
  padding: var(--cropvue-actions-padding, 12px 0);
}

.cropvue__btn {
  padding: var(--cropvue-btn-padding, 8px 20px);
  border: 1px solid var(--cropvue-btn-border-color, #d1d5db);
  border-radius: var(--cropvue-btn-radius, 6px);
  background: var(--cropvue-btn-bg, #fff);
  color: var(--cropvue-btn-color, #374151);
  font-size: var(--cropvue-btn-font-size, 14px);
  cursor: pointer;
  transition: background 150ms ease;
}

.cropvue__btn:hover {
  background: var(--cropvue-btn-hover-bg, #f9fafb);
}

.cropvue__btn--confirm {
  background: var(--cropvue-btn-confirm-bg, #3b82f6);
  color: var(--cropvue-btn-confirm-color, #fff);
  border-color: var(--cropvue-btn-confirm-border, #3b82f6);
}

.cropvue__btn--confirm:hover {
  background: var(--cropvue-btn-confirm-hover-bg, #2563eb);
}

.cropvue__btn--confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cropvue__done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.cropvue__result-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: var(--cropvue-preview-border-radius, 8px);
}
</style>

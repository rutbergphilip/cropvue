import './css/variables.css'

export { default as CropVue } from './components/CropVue.vue'
export { default as CropEditor } from './components/CropEditor.vue'
export { default as CropPreview } from './components/CropPreview.vue'
export { default as CropDropzone } from './components/CropDropzone.vue'
export { default as CropToolbar } from './components/CropToolbar.vue'
export { default as CropQueue } from './components/CropQueue.vue'
export { default as CropStencil } from './components/CropStencil.vue'
export { useCropper, useDropzone, useImageQueue, useUploader, useCompressor } from '@cropvue/core'
export type * from '@cropvue/core'

// Theme system
export { createCropVueTheme, CROPVUE_THEME_KEY } from './theme'
export type { CropVueThemeConfig } from './theme'

// UI types
export type {
  CropVueUI,
  CropEditorUI,
  CropToolbarUI,
  CropDropzoneUI,
  CropPreviewUI,
  CropQueueUI,
  CropStencilUI,
  CropVueTheme,
} from './types/ui'

// Composables
export { useComponentUI } from './composables/useComponentUI'

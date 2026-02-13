import { defineNuxtModule, addComponent, addImports } from '@nuxt/kit'

export interface CropVueModuleOptions {
  outputFormat?: 'auto' | 'webp' | 'jpeg' | 'png'
  outputQuality?: number
}

export default defineNuxtModule<CropVueModuleOptions>({
  meta: {
    name: '@cropvue/nuxt',
    configKey: 'cropvue',
  },
  defaults: {
    outputFormat: 'auto',
    outputQuality: 0.85,
  },
  setup(_options, nuxt) {
    // Auto-import components
    const components = [
      'CropVue', 'CropEditor', 'CropPreview',
      'CropDropzone', 'CropToolbar', 'CropQueue', 'CropStencil',
    ]

    for (const name of components) {
      addComponent({
        name,
        export: name,
        filePath: 'cropvue',
        mode: 'client',
      })
    }

    // Auto-import composables
    const composables = [
      'useCropper', 'useDropzone', 'useImageQueue',
      'useUploader', 'useCompressor',
    ]

    for (const name of composables) {
      addImports({ name, from: '@cropvue/core' })
    }

    // Add CSS
    nuxt.options.css.push('cropvue/styles')
  },
})

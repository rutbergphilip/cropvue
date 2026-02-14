import { defineNuxtModule, addComponent, addImports, addPlugin, addTemplate, createResolver } from '@nuxt/kit'
import type { CropVueTheme } from '@cropvue/vue'

export interface CropVueModuleOptions {
  outputFormat?: 'auto' | 'webp' | 'jpeg' | 'png'
  outputQuality?: number
  theme?: CropVueTheme
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
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Auto-import components
    const components = [
      'CropVue', 'CropEditor', 'CropPreview',
      'CropDropzone', 'CropToolbar', 'CropQueue', 'CropStencil',
    ]

    for (const name of components) {
      addComponent({
        name,
        export: name,
        filePath: '@cropvue/vue',
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

    // Auto-import theme utilities
    addImports({ name: 'createCropVueTheme', from: '@cropvue/vue' })
    addImports({ name: 'useComponentUI', from: '@cropvue/vue' })

    // Add CSS
    nuxt.options.css.push('@cropvue/vue/styles')

    // If theme is provided, generate a plugin that provides it
    if (options.theme) {
      const themeJson = JSON.stringify(options.theme)
      addTemplate({
        filename: 'cropvue-theme.mjs',
        getContents: () => `
import { createCropVueTheme } from '@cropvue/vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createCropVueTheme(${themeJson}))
})
`,
      })
      addPlugin({ src: '#build/cropvue-theme' })
    }
  },
})

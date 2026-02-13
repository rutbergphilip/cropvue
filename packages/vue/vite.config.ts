import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CropVue',
      formats: ['es', 'cjs'],
      fileName: (format) => `cropvue.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['vue', '@cropvue/core'],
      output: {
        globals: {
          vue: 'Vue',
          '@cropvue/core': 'CropVueCore',
        },
        assetFileNames: 'styles.[ext]',
      },
    },
  },
})

import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/module'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
  externals: ['vue', 'nuxt', '@nuxt/kit', 'cropvue', '@cropvue/core'],
})

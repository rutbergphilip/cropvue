import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'CropVue',
  description: 'Headless, fully customizable image cropping and upload library for Vue 3 + Nuxt',
  markdown: {
    theme: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
  },
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Examples', link: '/guide/examples' },
      { text: 'API', link: '/guide/composables' },
      { text: 'GitHub', link: 'https://github.com/cropvue/cropvue' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/guide/getting-started' },
          { text: 'Nuxt Integration', link: '/guide/nuxt' },
        ],
      },
      {
        text: 'Examples',
        items: [
          { text: 'All Examples', link: '/guide/examples' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Composables', link: '/guide/composables' },
          { text: 'Components', link: '/guide/components' },
          { text: 'Theming', link: '/guide/theming' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/cropvue/cropvue' },
    ],
  },
})

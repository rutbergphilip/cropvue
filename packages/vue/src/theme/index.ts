import type { App, InjectionKey } from 'vue'
import type { CropVueTheme } from '../types/ui'

export interface CropVueThemeConfig extends CropVueTheme {
  merger?: (...classes: string[]) => string
}

export const CROPVUE_THEME_KEY: InjectionKey<CropVueThemeConfig> = Symbol('cropvue-theme')

export function createCropVueTheme(config: CropVueThemeConfig = {}) {
  return {
    install(app: App) {
      app.provide(CROPVUE_THEME_KEY, config)
    },
  }
}

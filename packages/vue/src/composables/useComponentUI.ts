import { inject, computed } from 'vue'
import type { ComputedRef } from 'vue'
import { CROPVUE_THEME_KEY } from '../theme'
import type { CropVueTheme } from '../types/ui'
import { mergeClasses } from '../utils/merge-classes'

export function useComponentUI<K extends keyof CropVueTheme>(
  name: K,
  ui: () => CropVueTheme[K] | undefined,
): ComputedRef<Partial<NonNullable<CropVueTheme[K]>>> {
  const config = inject(CROPVUE_THEME_KEY, undefined)

  return computed(() => {
    type UI = NonNullable<CropVueTheme[K]>
    const themeUi = (config?.[name] ?? {}) as Partial<UI>
    const propUi = (ui() ?? {}) as Partial<UI>
    const merger = config?.merger

    const themeKeys = Object.keys(themeUi)
    const propKeys = Object.keys(propUi)

    if (!propKeys.length && !themeKeys.length) return {} as Partial<UI>
    if (!propKeys.length) return themeUi
    if (!themeKeys.length && !merger) return propUi

    const allKeys = new Set([...themeKeys, ...propKeys])
    const result: Record<string, string> = {}

    for (const key of allKeys) {
      const base = (themeUi as Record<string, string | undefined>)[key]
      const override = (propUi as Record<string, string | undefined>)[key]
      const merged = mergeClasses(merger, base, override)
      if (merged) result[key] = merged
    }

    return result as Partial<UI>
  })
}

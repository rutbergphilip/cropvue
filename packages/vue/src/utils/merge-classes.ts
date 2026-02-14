export function mergeClasses(
  merger: ((...classes: string[]) => string) | undefined,
  ...classes: (string | undefined | false)[]
): string {
  const filtered = classes.filter(Boolean) as string[]
  if (filtered.length === 0) return ''
  if (filtered.length === 1) return filtered[0]
  if (merger) return merger(...filtered)
  return filtered.join(' ')
}

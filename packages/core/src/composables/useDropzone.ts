import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue'
import type { CropVueError, DropzoneOptions } from '../types'

const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.avif', '.ico', '.tiff', '.tif',
])

function hasImageExtension(filename: string): boolean {
  const ext = filename.lastIndexOf('.') !== -1
    ? filename.slice(filename.lastIndexOf('.')).toLowerCase()
    : ''
  return IMAGE_EXTENSIONS.has(ext)
}

export function validateFile(
  file: File,
  options: { accept: string[]; maxSize: number }
): CropVueError | null {
  if (file.size > options.maxSize) {
    return {
      type: 'file-too-large',
      maxSize: options.maxSize,
      actualSize: file.size,
    }
  }

  const accepted = options.accept.some((pattern) => {
    if (pattern === 'image/*') {
      if (file.type) return file.type.startsWith('image/')
      return hasImageExtension(file.name)
    }
    if (file.type) return file.type === pattern
    // Fallback: match MIME subtype against extension (e.g. "image/png" matches ".png")
    const ext = file.name.lastIndexOf('.') !== -1
      ? file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase()
      : ''
    return pattern.endsWith(`/${ext}`)
  })

  if (!accepted) {
    return {
      type: 'invalid-type',
      accepted: options.accept,
      actual: file.type,
    }
  }

  return null
}

export function useDropzone(options: DropzoneOptions = {}) {
  const isDragging = ref(false)
  const files: Ref<File[]> = ref([])
  const dropzoneRef: Ref<HTMLElement | null> = ref(null)

  const accept = options.accept ?? ['image/*']
  const maxSize = options.maxSize ?? Infinity
  const multiple = options.multiple ?? false

  function processFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList)
    const valid: File[] = []

    for (const file of incoming) {
      const error = validateFile(file, { accept, maxSize })
      if (error) {
        options.onError?.(error)
      } else {
        valid.push(file)
      }
    }

    const result = multiple ? valid : valid.slice(0, 1)
    if (result.length > 0) {
      files.value = result
      options.onFiles?.(result)
    }
  }

  function open() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept.join(',')
    input.multiple = multiple
    input.onchange = () => {
      if (input.files) processFiles(input.files)
    }
    input.click()
  }

  let dragCount = 0

  function onDragEnter(e: DragEvent) {
    e.preventDefault()
    dragCount++
    isDragging.value = true
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault()
    if (--dragCount === 0) {
      isDragging.value = false
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    dragCount = 0
    isDragging.value = false
    if (e.dataTransfer?.files) {
      processFiles(e.dataTransfer.files)
    }
  }

  let currentEl: HTMLElement | null = null

  function attachListeners(el: HTMLElement) {
    el.addEventListener('dragenter', onDragEnter)
    el.addEventListener('dragover', onDragOver)
    el.addEventListener('dragleave', onDragLeave)
    el.addEventListener('drop', onDrop)
  }

  function detachListeners(el: HTMLElement) {
    el.removeEventListener('dragenter', onDragEnter)
    el.removeEventListener('dragover', onDragOver)
    el.removeEventListener('dragleave', onDragLeave)
    el.removeEventListener('drop', onDrop)
  }

  watch(dropzoneRef, (newEl, oldEl) => {
    if (oldEl) detachListeners(oldEl)
    if (newEl) attachListeners(newEl)
    currentEl = newEl
  }, { flush: 'post' })

  onMounted(() => {
    const el = dropzoneRef.value
    if (el && el !== currentEl) {
      attachListeners(el)
      currentEl = el
    }
  })

  onUnmounted(() => {
    if (currentEl) {
      detachListeners(currentEl)
      currentEl = null
    }
  })

  return { isDragging, files, dropzoneRef, open }
}

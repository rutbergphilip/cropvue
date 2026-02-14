import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue'
import type { CropVueError, DropzoneOptions } from '../types'

export function validateFile(
  file: File,
  options: { accept: string[]; maxSize: number }
): CropVueError | null {
  // Check size
  if (file.size > options.maxSize) {
    return {
      type: 'file-too-large',
      maxSize: options.maxSize,
      actualSize: file.size,
    }
  }

  // Check type
  const accepted = options.accept.some((pattern) => {
    if (pattern === 'image/*') {
      return file.type.startsWith('image/')
    }
    return file.type === pattern
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

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    isDragging.value = true
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault()
    isDragging.value = false
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    isDragging.value = false
    if (e.dataTransfer?.files) {
      processFiles(e.dataTransfer.files)
    }
  }

  let currentEl: HTMLElement | null = null

  function attachListeners(el: HTMLElement) {
    el.addEventListener('dragover', onDragOver)
    el.addEventListener('dragleave', onDragLeave)
    el.addEventListener('drop', onDrop)
  }

  function detachListeners(el: HTMLElement) {
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

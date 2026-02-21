import { ref, computed, onUnmounted } from 'vue'
import type { QueueItem, CropResult } from '../types'

let nextId = 0
function generateId(): string {
  return `cropvue-${++nextId}-${Date.now()}`
}

export interface Queue {
  items: QueueItem[]
  currentIndex: number
  add: (files: File[]) => void
  remove: (index: number) => void
  select: (index: number) => void
  next: () => void
  previous: () => void
  clear: () => void
  setResult: (index: number, result: CropResult) => void
}

export function createQueue(): Queue {
  const state = {
    items: [] as QueueItem[],
    currentIndex: -1,
  }

  function add(files: File[]) {
    const newItems: QueueItem[] = files.map((file) => ({
      id: generateId(),
      file,
      thumbnail: URL.createObjectURL(file),
      status: 'pending' as const,
    }))

    state.items.push(...newItems)

    if (state.currentIndex === -1 && state.items.length > 0) {
      state.currentIndex = 0
    }
  }

  function remove(index: number) {
    if (index < 0 || index >= state.items.length) return

    const item = state.items[index]
    URL.revokeObjectURL(item.thumbnail)
    state.items.splice(index, 1)

    if (state.items.length === 0) {
      state.currentIndex = -1
    } else if (state.currentIndex >= state.items.length) {
      state.currentIndex = state.items.length - 1
    }
  }

  function select(index: number) {
    if (index >= 0 && index < state.items.length) {
      state.currentIndex = index
    }
  }

  function next() {
    if (state.currentIndex < state.items.length - 1) {
      state.currentIndex++
    }
  }

  function previous() {
    if (state.currentIndex > 0) {
      state.currentIndex--
    }
  }

  function clear() {
    for (const item of state.items) {
      URL.revokeObjectURL(item.thumbnail)
    }
    state.items.length = 0
    state.currentIndex = -1
  }

  function setResult(index: number, result: CropResult) {
    if (index >= 0 && index < state.items.length) {
      state.items[index].result = result
      state.items[index].status = 'done'
    }
  }

  Object.assign(state, { add, remove, select, next, previous, clear, setResult })
  return state as unknown as Queue
}

export function useImageQueue() {
  const queue = createQueue()
  const images = ref(queue.items)
  const current = ref(queue.currentIndex)

  function sync() {
    images.value = [...queue.items]
    current.value = queue.currentIndex
  }

  function add(files: File[]) { queue.add(files); sync() }
  function remove(index: number) { queue.remove(index); sync() }
  function select(index: number) { queue.select(index); sync() }
  function next() { queue.next(); sync() }
  function previous() { queue.previous(); sync() }
  function clear() { queue.clear(); sync() }

  const results = computed(() =>
    queue.items.filter((i) => i.result).map((i) => i.result!)
  )

  onUnmounted(() => {
    queue.clear()
  })

  return { images, current, add, remove, select, next, previous, clear, results }
}

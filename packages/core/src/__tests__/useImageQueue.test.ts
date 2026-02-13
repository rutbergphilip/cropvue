import { describe, it, expect } from 'vitest'
import { createQueue } from '../composables/useImageQueue'

describe('createQueue', () => {
  it('starts empty', () => {
    const queue = createQueue()
    expect(queue.items).toEqual([])
    expect(queue.currentIndex).toBe(-1)
  })

  it('adds items', () => {
    const queue = createQueue()
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
    queue.add([file])
    expect(queue.items.length).toBe(1)
    expect(queue.currentIndex).toBe(0)
  })

  it('removes items', () => {
    const queue = createQueue()
    const file1 = new File(['x'], 'a.jpg', { type: 'image/jpeg' })
    const file2 = new File(['y'], 'b.jpg', { type: 'image/jpeg' })
    queue.add([file1, file2])
    queue.remove(0)
    expect(queue.items.length).toBe(1)
  })

  it('selects item by index', () => {
    const queue = createQueue()
    const file1 = new File(['x'], 'a.jpg', { type: 'image/jpeg' })
    const file2 = new File(['y'], 'b.jpg', { type: 'image/jpeg' })
    queue.add([file1, file2])
    queue.select(1)
    expect(queue.currentIndex).toBe(1)
  })

  it('navigates next/previous', () => {
    const queue = createQueue()
    queue.add([
      new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
      new File(['c'], 'c.jpg', { type: 'image/jpeg' }),
    ])
    expect(queue.currentIndex).toBe(0)
    queue.next()
    expect(queue.currentIndex).toBe(1)
    queue.next()
    expect(queue.currentIndex).toBe(2)
    queue.next()
    expect(queue.currentIndex).toBe(2) // stays at end
    queue.previous()
    expect(queue.currentIndex).toBe(1)
  })

  it('clears all items', () => {
    const queue = createQueue()
    queue.add([new File(['x'], 'a.jpg', { type: 'image/jpeg' })])
    queue.clear()
    expect(queue.items).toEqual([])
    expect(queue.currentIndex).toBe(-1)
  })
})

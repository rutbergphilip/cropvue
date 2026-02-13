import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePointerHandler } from '../composables/usePointerHandler'
import type { PointerHandlerOptions } from '../composables/usePointerHandler'
import type { HandlePosition } from '../engine/gestures'

function createMockElement() {
  const listeners: Record<string, EventListener> = {}
  const el = {
    addEventListener: vi.fn((type: string, fn: EventListener) => {
      listeners[type] = fn
    }),
    removeEventListener: vi.fn(),
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 800, height: 600 })),
    // Dispatch helper for tests
    _dispatch(type: string, props: Record<string, unknown> = {}) {
      listeners[type]?.({ preventDefault: vi.fn(), ...props } as unknown as Event)
    },
  }
  return el
}

function createOptions(overrides: Partial<PointerHandlerOptions> = {}): PointerHandlerOptions {
  return {
    onPan: vi.fn(),
    onZoom: vi.fn(),
    onCropResize: vi.fn(),
    onKeyboard: vi.fn(),
    getHandleAtPoint: vi.fn(() => null),
    displayScale: () => 1,
    ...overrides,
  }
}

describe('usePointerHandler', () => {
  let el: ReturnType<typeof createMockElement>

  beforeEach(() => {
    el = createMockElement()
  })

  it('registers all event listeners on creation', () => {
    const opts = createOptions()
    usePointerHandler(el as unknown as HTMLElement, opts)

    const registeredTypes = el.addEventListener.mock.calls.map((c: unknown[]) => c[0])
    expect(registeredTypes).toContain('pointerdown')
    expect(registeredTypes).toContain('pointermove')
    expect(registeredTypes).toContain('pointerup')
    expect(registeredTypes).toContain('pointercancel')
    expect(registeredTypes).toContain('wheel')
    expect(registeredTypes).toContain('keydown')
  })

  it('removes all event listeners on destroy', () => {
    const opts = createOptions()
    const handler = usePointerHandler(el as unknown as HTMLElement, opts)
    handler.destroy()

    expect(el.removeEventListener).toHaveBeenCalledTimes(6)
  })

  describe('panning', () => {
    it('triggers onPan with correct deltas', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      // Pointer down at (100, 100)
      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      // Move to (120, 130)
      el._dispatch('pointermove', { pointerId: 1, clientX: 120, clientY: 130 })

      expect(opts.onPan).toHaveBeenCalledWith(20, 30)
    })

    it('accumulates deltas across multiple moves', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 110, clientY: 105 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 120, clientY: 115 })

      expect(opts.onPan).toHaveBeenCalledTimes(2)
      expect(opts.onPan).toHaveBeenNthCalledWith(1, 10, 5)
      expect(opts.onPan).toHaveBeenNthCalledWith(2, 10, 10)
    })

    it('does not trigger onPan without pointerdown', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointermove', { pointerId: 1, clientX: 120, clientY: 130 })

      expect(opts.onPan).not.toHaveBeenCalled()
    })

    it('stops panning on pointerup', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointerup', { pointerId: 1 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 200, clientY: 200 })

      expect(opts.onPan).not.toHaveBeenCalled()
    })

    it('stops panning on pointercancel', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointercancel', { pointerId: 1 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 200, clientY: 200 })

      expect(opts.onPan).not.toHaveBeenCalled()
    })
  })

  describe('coordinate conversion', () => {
    it('divides deltas by displayScale', () => {
      const opts = createOptions({ displayScale: () => 2 })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 120, clientY: 140 })

      // 20px screen delta / 2 scale = 10 image-space, 40 / 2 = 20
      expect(opts.onPan).toHaveBeenCalledWith(10, 20)
    })

    it('handles fractional displayScale', () => {
      const opts = createOptions({ displayScale: () => 0.5 })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 110, clientY: 110 })

      // 10px / 0.5 = 20 image-space
      expect(opts.onPan).toHaveBeenCalledWith(20, 20)
    })
  })

  describe('crop resize', () => {
    it('triggers onCropResize when pointer is on a handle', () => {
      const opts = createOptions({
        getHandleAtPoint: vi.fn(() => 'se' as HandlePosition),
      })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 115, clientY: 120 })

      expect(opts.onCropResize).toHaveBeenCalledWith('se', 15, 20)
      expect(opts.onPan).not.toHaveBeenCalled()
    })

    it('passes the correct handle position', () => {
      const opts = createOptions({
        getHandleAtPoint: vi.fn(() => 'nw' as HandlePosition),
      })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 50, clientY: 50 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 40, clientY: 40 })

      expect(opts.onCropResize).toHaveBeenCalledWith('nw', -10, -10)
    })
  })

  describe('pointer capture', () => {
    it('sets pointer capture on pointerdown', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 42, clientX: 0, clientY: 0 })

      expect(el.setPointerCapture).toHaveBeenCalledWith(42)
    })

    it('releases pointer capture on pointerup', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 42, clientX: 0, clientY: 0 })
      el._dispatch('pointerup', { pointerId: 42 })

      expect(el.releasePointerCapture).toHaveBeenCalledWith(42)
    })

    it('ignores non-primary button', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      // button: 2 = right-click
      el._dispatch('pointerdown', { button: 2, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 120, clientY: 130 })

      expect(opts.onPan).not.toHaveBeenCalled()
      expect(el.setPointerCapture).not.toHaveBeenCalled()
    })

    it('ignores second concurrent pointer', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointerdown', { button: 0, pointerId: 2, clientX: 200, clientY: 200 })

      // Only one setPointerCapture call (for pointer 1)
      expect(el.setPointerCapture).toHaveBeenCalledTimes(1)

      // Move second pointer - should be ignored
      el._dispatch('pointermove', { pointerId: 2, clientX: 250, clientY: 250 })
      expect(opts.onPan).not.toHaveBeenCalled()

      // Move first pointer - should work
      el._dispatch('pointermove', { pointerId: 1, clientX: 120, clientY: 130 })
      expect(opts.onPan).toHaveBeenCalledWith(20, 30)
    })
  })

  describe('wheel zoom', () => {
    it('triggers onZoom with normalized delta and center', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('wheel', { deltaY: -100, clientX: 400, clientY: 300 })

      // delta = -(-100) * 0.001 = 0.1
      // center = (400 - 0) / 1 = 400, (300 - 0) / 1 = 300
      expect(opts.onZoom).toHaveBeenCalledWith(0.1, 400, 300)
    })

    it('converts center by displayScale', () => {
      const opts = createOptions({ displayScale: () => 2 })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('wheel', { deltaY: -100, clientX: 400, clientY: 300 })

      expect(opts.onZoom).toHaveBeenCalledWith(0.1, 200, 150)
    })

    it('scroll down zooms out (negative delta)', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('wheel', { deltaY: 100, clientX: 0, clientY: 0 })

      expect(opts.onZoom).toHaveBeenCalledWith(-0.1, 0, 0)
    })
  })

  describe('keyboard', () => {
    it('triggers onKeyboard for arrow keys', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('keydown', { key: 'ArrowRight', shiftKey: false })

      expect(opts.onKeyboard).toHaveBeenCalledWith('ArrowRight', false)
    })

    it('passes shiftKey', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('keydown', { key: 'ArrowUp', shiftKey: true })

      expect(opts.onKeyboard).toHaveBeenCalledWith('ArrowUp', true)
    })

    it('triggers for zoom keys', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('keydown', { key: '+', shiftKey: false })
      el._dispatch('keydown', { key: '-', shiftKey: false })

      expect(opts.onKeyboard).toHaveBeenCalledTimes(2)
    })

    it('does not trigger for unhandled keys', () => {
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('keydown', { key: 'a', shiftKey: false })

      expect(opts.onKeyboard).not.toHaveBeenCalled()
    })
  })
})

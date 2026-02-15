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
    onCropMove: vi.fn(),
    onKeyboard: vi.fn(),
    getHandleAtPoint: vi.fn(() => null),
    isInsideCropArea: vi.fn(() => false),
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

  describe('crop move', () => {
    it('triggers onCropMove when pointer is inside crop area', () => {
      const opts = createOptions({
        isInsideCropArea: vi.fn(() => true),
      })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 200, clientY: 200 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 220, clientY: 210 })

      expect(opts.onCropMove).toHaveBeenCalledWith(20, 10)
      expect(opts.onPan).not.toHaveBeenCalled()
    })

    it('handle takes priority over crop move', () => {
      const opts = createOptions({
        getHandleAtPoint: vi.fn(() => 'se' as HandlePosition),
        isInsideCropArea: vi.fn(() => true),
      })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 200, clientY: 200 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 220, clientY: 210 })

      expect(opts.onCropResize).toHaveBeenCalledWith('se', 20, 10)
      expect(opts.onCropMove).not.toHaveBeenCalled()
    })

    it('falls through to pan when outside crop area', () => {
      const opts = createOptions({
        isInsideCropArea: vi.fn(() => false),
      })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 10, clientY: 10 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 30, clientY: 20 })

      expect(opts.onPan).toHaveBeenCalledWith(20, 10)
      expect(opts.onCropMove).not.toHaveBeenCalled()
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

    it('switches to pinch mode on second concurrent pointer', () => {
      const opts = createOptions({ onPinchZoom: vi.fn() })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointerdown', { button: 0, pointerId: 2, clientX: 200, clientY: 200 })

      // Both pointers get capture
      expect(el.setPointerCapture).toHaveBeenCalledTimes(2)

      // Single pointer move should not trigger pan (we are in pinch mode)
      el._dispatch('pointermove', { pointerId: 1, clientX: 120, clientY: 130 })
      expect(opts.onPan).not.toHaveBeenCalled()
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

  describe('pinch zoom', () => {
    it('detects pinch zoom with two active pointers', () => {
      const onPinchZoom = vi.fn()
      const opts = createOptions({ onPinchZoom })
      usePointerHandler(el as unknown as HTMLElement, opts)

      // First finger down at (100, 200)
      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 200 })
      // Second finger down at (300, 200) - triggers pinch mode
      el._dispatch('pointerdown', { button: 0, pointerId: 2, clientX: 300, clientY: 200 })

      // Spread fingers apart: pointer 1 moves left, pointer 2 moves right
      el._dispatch('pointermove', { pointerId: 1, clientX: 50, clientY: 200 })
      el._dispatch('pointermove', { pointerId: 2, clientX: 350, clientY: 200 })

      expect(onPinchZoom).toHaveBeenCalled()
      // Factor should be > 1 because fingers spread apart
      const firstCall = onPinchZoom.mock.calls[0]
      expect(firstCall[0]).toBeGreaterThan(1) // factor
    })

    it('reports factor < 1 when fingers pinch inward', () => {
      const onPinchZoom = vi.fn()
      const opts = createOptions({ onPinchZoom })
      usePointerHandler(el as unknown as HTMLElement, opts)

      // Fingers start far apart
      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 0, clientY: 300 })
      el._dispatch('pointerdown', { button: 0, pointerId: 2, clientX: 400, clientY: 300 })

      // Move fingers closer together
      el._dispatch('pointermove', { pointerId: 1, clientX: 150, clientY: 300 })
      el._dispatch('pointermove', { pointerId: 2, clientX: 250, clientY: 300 })

      expect(onPinchZoom).toHaveBeenCalled()
      // Get the last call (after both moves)
      const lastCall = onPinchZoom.mock.calls[onPinchZoom.mock.calls.length - 1]
      expect(lastCall[0]).toBeLessThan(1) // factor
    })

    it('does not call onPan during pinch', () => {
      const onPinchZoom = vi.fn()
      const opts = createOptions({ onPinchZoom })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointerdown', { button: 0, pointerId: 2, clientX: 200, clientY: 200 })

      el._dispatch('pointermove', { pointerId: 1, clientX: 90, clientY: 90 })
      el._dispatch('pointermove', { pointerId: 2, clientX: 210, clientY: 210 })

      expect(opts.onPan).not.toHaveBeenCalled()
    })

    it('reports center coordinates in image space', () => {
      const onPinchZoom = vi.fn()
      el.getBoundingClientRect.mockReturnValue({ left: 10, top: 20, width: 800, height: 600 })
      const opts = createOptions({ onPinchZoom, displayScale: () => 2 })
      usePointerHandler(el as unknown as HTMLElement, opts)

      // Two pointers centered around (210, 220) in client space
      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 110, clientY: 220 })
      el._dispatch('pointerdown', { button: 0, pointerId: 2, clientX: 310, clientY: 220 })

      // Spread out a bit to trigger onPinchZoom
      el._dispatch('pointermove', { pointerId: 1, clientX: 100, clientY: 220 })
      el._dispatch('pointermove', { pointerId: 2, clientX: 320, clientY: 220 })

      expect(onPinchZoom).toHaveBeenCalled()
      const lastCall = onPinchZoom.mock.calls[onPinchZoom.mock.calls.length - 1]
      // center x in image space: (center.clientX - rect.left) / scale
      // center y in image space: (center.clientY - rect.top) / scale
      // cx and cy are args [1] and [2]
      expect(typeof lastCall[1]).toBe('number')
      expect(typeof lastCall[2]).toBe('number')
    })

    it('transitions from pinch back to pan when one finger lifts', () => {
      const onPinchZoom = vi.fn()
      const opts = createOptions({ onPinchZoom })
      usePointerHandler(el as unknown as HTMLElement, opts)

      // Start pinch
      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointerdown', { button: 0, pointerId: 2, clientX: 200, clientY: 200 })

      // Lift second finger
      el._dispatch('pointerup', { pointerId: 2 })

      // Now move the remaining finger - should trigger pan
      el._dispatch('pointermove', { pointerId: 1, clientX: 120, clientY: 130 })

      expect(opts.onPan).toHaveBeenCalledWith(20, 30)
    })

    it('does not call onPinchZoom if callback not provided', () => {
      // No onPinchZoom in options
      const opts = createOptions()
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointerdown', { button: 0, pointerId: 2, clientX: 200, clientY: 200 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 90, clientY: 90 })

      // Should not throw
      expect(opts.onPan).not.toHaveBeenCalled()
    })

    it('fully resets state when all pointers are released', () => {
      const onPinchZoom = vi.fn()
      const opts = createOptions({ onPinchZoom })
      usePointerHandler(el as unknown as HTMLElement, opts)

      // Pinch gesture
      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointerdown', { button: 0, pointerId: 2, clientX: 200, clientY: 200 })
      el._dispatch('pointerup', { pointerId: 1 })
      el._dispatch('pointerup', { pointerId: 2 })

      // New single-pointer drag should work as normal pan
      el._dispatch('pointerdown', { button: 0, pointerId: 3, clientX: 50, clientY: 50 })
      el._dispatch('pointermove', { pointerId: 3, clientX: 70, clientY: 60 })

      expect(opts.onPan).toHaveBeenCalledWith(20, 10)
    })
  })

  describe('multi-pointer transition', () => {
    it('switches from resize to pinch when second pointer arrives', () => {
      const onPinchZoom = vi.fn()
      const opts = createOptions({
        onPinchZoom,
        getHandleAtPoint: vi.fn(() => 'se' as HandlePosition),
      })
      usePointerHandler(el as unknown as HTMLElement, opts)

      // Start resize with pointer 1
      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 110, clientY: 110 })
      expect(opts.onCropResize).toHaveBeenCalled()

      // Second finger arrives - switches to pinch
      el._dispatch('pointerdown', { button: 0, pointerId: 2, clientX: 300, clientY: 300 })

      // Now moving should trigger pinch, not resize
      opts.onCropResize = vi.fn()
      el._dispatch('pointermove', { pointerId: 1, clientX: 90, clientY: 90 })
      el._dispatch('pointermove', { pointerId: 2, clientX: 310, clientY: 310 })

      expect(onPinchZoom).toHaveBeenCalled()
      expect(opts.onCropResize).not.toHaveBeenCalled()
    })

    it('switches from crop-move to pinch when second pointer arrives', () => {
      const onPinchZoom = vi.fn()
      const opts = createOptions({
        onPinchZoom,
        isInsideCropArea: vi.fn(() => true),
      })
      usePointerHandler(el as unknown as HTMLElement, opts)

      // Start crop-move
      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 200, clientY: 200 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 210, clientY: 210 })
      expect(opts.onCropMove).toHaveBeenCalled()

      // Second finger
      el._dispatch('pointerdown', { button: 0, pointerId: 2, clientX: 400, clientY: 400 })

      opts.onCropMove = vi.fn()
      el._dispatch('pointermove', { pointerId: 2, clientX: 420, clientY: 420 })

      expect(onPinchZoom).toHaveBeenCalled()
      expect(opts.onCropMove).not.toHaveBeenCalled()
    })
  })

  describe('mode-aware routing', () => {
    it('static mode routes all single-pointer drags to pan', () => {
      const opts = createOptions({
        mode: 'static',
        getHandleAtPoint: vi.fn(() => 'se' as HandlePosition),
        isInsideCropArea: vi.fn(() => true),
      })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 120, clientY: 130 })

      // Should pan even though handle and crop area return true
      expect(opts.onPan).toHaveBeenCalledWith(20, 30)
      expect(opts.onCropResize).not.toHaveBeenCalled()
      expect(opts.onCropMove).not.toHaveBeenCalled()
    })

    it('static mode ignores handle detection', () => {
      const opts = createOptions({
        mode: 'static',
        getHandleAtPoint: vi.fn(() => 'nw' as HandlePosition),
      })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 50, clientY: 50 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 60, clientY: 60 })

      expect(opts.onPan).toHaveBeenCalledWith(10, 10)
      expect(opts.onCropResize).not.toHaveBeenCalled()
    })

    it('classic mode (default) uses normal routing', () => {
      const opts = createOptions({
        mode: 'classic',
        isInsideCropArea: vi.fn(() => true),
      })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 200, clientY: 200 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 220, clientY: 210 })

      expect(opts.onCropMove).toHaveBeenCalledWith(20, 10)
      expect(opts.onPan).not.toHaveBeenCalled()
    })

    it('moveImage=false prevents pan on outside clicks', () => {
      const opts = createOptions({
        moveImage: false,
        isInsideCropArea: vi.fn(() => false),
        getHandleAtPoint: vi.fn(() => null),
      })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 10, clientY: 10 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 30, clientY: 20 })

      expect(opts.onPan).not.toHaveBeenCalled()
    })

    it('moveImage=false still allows crop resize', () => {
      const opts = createOptions({
        moveImage: false,
        getHandleAtPoint: vi.fn(() => 'se' as HandlePosition),
      })
      usePointerHandler(el as unknown as HTMLElement, opts)

      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointermove', { pointerId: 1, clientX: 115, clientY: 120 })

      expect(opts.onCropResize).toHaveBeenCalledWith('se', 15, 20)
    })

    it('moveImage=false prevents pan after pinch ends with one finger', () => {
      const onPinchZoom = vi.fn()
      const opts = createOptions({
        onPinchZoom,
        moveImage: false,
      })
      usePointerHandler(el as unknown as HTMLElement, opts)

      // Start pinch
      el._dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
      el._dispatch('pointerdown', { button: 0, pointerId: 2, clientX: 200, clientY: 200 })

      // Lift one finger
      el._dispatch('pointerup', { pointerId: 2 })

      // Remaining finger moves - should NOT pan because moveImage=false
      el._dispatch('pointermove', { pointerId: 1, clientX: 120, clientY: 130 })

      expect(opts.onPan).not.toHaveBeenCalled()
    })
  })
})

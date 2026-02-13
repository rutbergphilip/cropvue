import type { HandlePosition } from '../engine/gestures'

export interface PointerHandlerOptions {
  onPan: (dx: number, dy: number) => void
  onZoom: (delta: number, centerX: number, centerY: number) => void
  onCropResize: (handle: HandlePosition, dx: number, dy: number) => void
  onKeyboard: (key: string, shiftKey: boolean) => void
  getHandleAtPoint: (e: PointerEvent) => HandlePosition | null
  displayScale: () => number
}

export interface PointerHandlerCleanup {
  destroy: () => void
}

type DragMode = 'pan' | 'resize' | null

export function usePointerHandler(
  element: HTMLElement,
  options: PointerHandlerOptions
): PointerHandlerCleanup {
  let dragMode: DragMode = null
  let activeHandle: HandlePosition | null = null
  let lastX = 0
  let lastY = 0
  let activePointerId: number | null = null

  function onPointerDown(e: PointerEvent) {
    // Only handle primary button (left click / touch)
    if (e.button !== 0) return
    // Ignore if already tracking a pointer
    if (activePointerId !== null) return

    activePointerId = e.pointerId
    lastX = e.clientX
    lastY = e.clientY

    const handle = options.getHandleAtPoint(e)
    if (handle) {
      dragMode = 'resize'
      activeHandle = handle
    } else {
      dragMode = 'pan'
      activeHandle = null
    }

    try {
      element.setPointerCapture(e.pointerId)
    } catch {
      // Pointer capture may fail for synthetic events
    }
    e.preventDefault()
  }

  function onPointerMove(e: PointerEvent) {
    if (activePointerId !== e.pointerId) return
    if (!dragMode) return

    const scale = options.displayScale()
    const dx = (e.clientX - lastX) / scale
    const dy = (e.clientY - lastY) / scale

    lastX = e.clientX
    lastY = e.clientY

    if (dragMode === 'pan') {
      options.onPan(dx, dy)
    } else if (dragMode === 'resize' && activeHandle) {
      options.onCropResize(activeHandle, dx, dy)
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (activePointerId !== e.pointerId) return
    endDrag(e)
  }

  function onPointerCancel(e: PointerEvent) {
    if (activePointerId !== e.pointerId) return
    endDrag(e)
  }

  function endDrag(e: PointerEvent) {
    if (activePointerId !== null) {
      try {
        element.releasePointerCapture(e.pointerId)
      } catch {
        // Pointer capture may already be released
      }
    }
    dragMode = null
    activeHandle = null
    activePointerId = null
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const rect = element.getBoundingClientRect()
    const centerX = (e.clientX - rect.left) / options.displayScale()
    const centerY = (e.clientY - rect.top) / options.displayScale()
    // Normalize wheel delta: negative deltaY = scroll up = zoom in
    const delta = -e.deltaY * 0.001
    options.onZoom(delta, centerX, centerY)
  }

  function onKeyDown(e: KeyboardEvent) {
    const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_']
    if (handled.includes(e.key)) {
      e.preventDefault()
      options.onKeyboard(e.key, e.shiftKey)
    }
  }

  // Bind events
  element.addEventListener('pointerdown', onPointerDown)
  element.addEventListener('pointermove', onPointerMove)
  element.addEventListener('pointerup', onPointerUp)
  element.addEventListener('pointercancel', onPointerCancel)
  element.addEventListener('wheel', onWheel, { passive: false })
  element.addEventListener('keydown', onKeyDown)

  function destroy() {
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointermove', onPointerMove)
    element.removeEventListener('pointerup', onPointerUp)
    element.removeEventListener('pointercancel', onPointerCancel)
    element.removeEventListener('wheel', onWheel)
    element.removeEventListener('keydown', onKeyDown)
  }

  return { destroy }
}

import type { HandlePosition } from '../engine/gestures'

export interface PointerHandlerOptions {
  onPan: (dx: number, dy: number) => void
  onZoom: (delta: number, centerX: number, centerY: number) => void
  onCropResize: (handle: HandlePosition, dx: number, dy: number) => void
  onCropMove: (dx: number, dy: number) => void
  onKeyboard: (key: string, shiftKey: boolean) => void
  onPinchZoom?: (factor: number, centerX: number, centerY: number, panDx: number, panDy: number) => void
  getHandleAtPoint: (e: PointerEvent) => HandlePosition | null
  isInsideCropArea: (e: PointerEvent) => boolean
  displayScale: () => number
  mode?: 'classic' | 'static' | 'hybrid'
  moveImage?: boolean
  resizeImage?: boolean
}

export interface PointerHandlerCleanup {
  destroy: () => void
}

type DragMode = 'pan' | 'resize' | 'crop-move' | 'pinch' | null

function getPinchState(pointers: Map<number, { x: number; y: number }>) {
  const pts = Array.from(pointers.values())
  const center = {
    x: pts.reduce((sum, p) => sum + p.x, 0) / pts.length,
    y: pts.reduce((sum, p) => sum + p.y, 0) / pts.length,
  }
  const spread = pts.reduce((sum, p) => {
    const dx = p.x - center.x
    const dy = p.y - center.y
    return sum + Math.sqrt(dx * dx + dy * dy)
  }, 0) / pts.length

  return { center, spread }
}

export function usePointerHandler(
  element: HTMLElement,
  options: PointerHandlerOptions
): PointerHandlerCleanup {
  const pointers = new Map<number, { x: number; y: number }>()
  let dragMode: DragMode = null
  let activeHandle: HandlePosition | null = null
  let lastX = 0
  let lastY = 0
  let lastPinchCenter: { x: number; y: number } | null = null
  let lastPinchSpread: number | null = null

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return

    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    // If this is the second+ pointer, switch to pinch mode
    if (pointers.size >= 2) {
      dragMode = 'pinch'
      activeHandle = null
      const pinch = getPinchState(pointers)
      lastPinchCenter = pinch.center
      lastPinchSpread = pinch.spread
      try {
        element.setPointerCapture(e.pointerId)
      } catch { /* noop */ }
      e.preventDefault()
      return
    }

    // Single pointer logic
    lastX = e.clientX
    lastY = e.clientY

    if (options.mode === 'static') {
      // Static mode: all drags are pan
      dragMode = 'pan'
    } else {
      const handle = options.getHandleAtPoint(e)
      if (handle) {
        dragMode = 'resize'
        activeHandle = handle
      } else if (options.isInsideCropArea(e)) {
        dragMode = 'crop-move'
        activeHandle = null
      } else {
        dragMode = options.moveImage !== false ? 'pan' : null
        activeHandle = null
      }
    }

    try {
      element.setPointerCapture(e.pointerId)
    } catch { /* noop */ }
    e.preventDefault()
  }

  function onPointerMove(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return

    // Update tracked position
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (dragMode === 'pinch' && pointers.size >= 2) {
      const pinch = getPinchState(pointers)
      if (lastPinchCenter && lastPinchSpread && lastPinchSpread > 0) {
        const factor = pinch.spread / lastPinchSpread
        const rect = element.getBoundingClientRect()
        const scale = options.displayScale()
        const cx = (pinch.center.x - rect.left) / scale
        const cy = (pinch.center.y - rect.top) / scale
        const panDx = (pinch.center.x - lastPinchCenter.x) / scale
        const panDy = (pinch.center.y - lastPinchCenter.y) / scale

        if (options.onPinchZoom) {
          options.onPinchZoom(factor, cx, cy, panDx, panDy)
        }
      }
      lastPinchCenter = pinch.center
      lastPinchSpread = pinch.spread
      return
    }

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
    } else if (dragMode === 'crop-move') {
      options.onCropMove(dx, dy)
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return
    endDrag(e)
  }

  function onPointerCancel(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return
    endDrag(e)
  }

  function endDrag(e: PointerEvent) {
    pointers.delete(e.pointerId)
    try {
      element.releasePointerCapture(e.pointerId)
    } catch { /* noop */ }

    if (pointers.size === 0) {
      dragMode = null
      activeHandle = null
      lastPinchCenter = null
      lastPinchSpread = null
    } else if (pointers.size === 1 && dragMode === 'pinch') {
      // Down to 1 pointer from pinch: switch to pan
      dragMode = options.moveImage !== false ? 'pan' : null
      const remaining = Array.from(pointers.entries())[0]
      lastX = remaining[1].x
      lastY = remaining[1].y
    }
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const rect = element.getBoundingClientRect()
    const centerX = (e.clientX - rect.left) / options.displayScale()
    const centerY = (e.clientY - rect.top) / options.displayScale()
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
    element.removeEventListener('wheel', onWheel, { passive: false } as EventListenerOptions)
    element.removeEventListener('keydown', onKeyDown)
  }

  return { destroy }
}

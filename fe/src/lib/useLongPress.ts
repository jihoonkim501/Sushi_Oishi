import { useCallback, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

export const LONG_PRESS_MS = 500
export const LONG_PRESS_MOVE_TOLERANCE = 10

interface Options {
  onLongPress: () => void
  onClick?: () => void
}

/** BR-COR-02: 500ms 길게 누름, 10px 이상 움직이면 취소(스크롤과 구분). */
export function useLongPress({ onLongPress, onClick }: Options) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    start.current = null
  }, [])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      fired.current = false
      start.current = { x: e.clientX, y: e.clientY }
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        timer.current = null
        fired.current = true
        if (typeof navigator.vibrate === 'function') navigator.vibrate(10)
        onLongPress()
      }, LONG_PRESS_MS)
    },
    [onLongPress],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const s = start.current
      if (!s) return
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) >= LONG_PRESS_MOVE_TOLERANCE) cancel()
    },
    [cancel],
  )

  const onClickCapture = useCallback(
    (e: { preventDefault: () => void; stopPropagation: () => void }) => {
      // 길게 누름이 처리된 뒤에 따라오는 click은 무시한다.
      if (fired.current) {
        fired.current = false
        e.preventDefault()
        e.stopPropagation()
        return
      }
      onClick?.()
    },
    [onClick],
  )

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    onClick: onClickCapture,
  }
}

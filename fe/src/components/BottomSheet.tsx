import { useEffect, useId, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import { useFocusTrap } from '../lib/useFocusTrap'
import styles from './BottomSheet.module.css'

const DISMISS_DISTANCE = 80
const TAP_DISTANCE = 4

interface BottomSheetProps {
  open: boolean
  title: string
  onClose: () => void
  /** 제목 오른쪽에 두는 조작 요소 (예: 닫기 IconButton) */
  headerAction?: ReactNode
  children: ReactNode
}

/** DESIGN.md 5.10: 바깥 탭 · Esc · 핸들 탭 · 아래로 스와이프로 닫는다. 뒤로 가기는 호출하는 쪽의 라우팅이 담당한다. */
export function BottomSheet({ open, title, onClose, headerAction, children }: BottomSheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number | null>(null)
  const travelled = useRef(0)
  const [offset, setOffset] = useState(0)

  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // 열릴 때 제목 다음 첫 조작 요소로 포커스를 옮긴다.
  useEffect(() => {
    if (!open) return
    const first = panelRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    )
    ;(first ?? panelRef.current)?.focus()
  }, [open])

  if (!open) return null

  const onDown = (e: ReactPointerEvent) => {
    startY.current = e.clientY
    travelled.current = 0
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onMove = (e: ReactPointerEvent) => {
    if (startY.current === null) return
    const dy = e.clientY - startY.current
    travelled.current = Math.max(travelled.current, Math.abs(dy))
    setOffset(Math.max(0, dy))
  }
  const onUp = () => {
    if (startY.current === null) return
    const shouldClose = offset > DISMISS_DISTANCE || travelled.current < TAP_DISTANCE
    startY.current = null
    setOffset(0)
    if (shouldClose) onClose()
  }

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} onClick={onClose} data-testid="sheet-backdrop" />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={offset ? { transform: `translateY(${offset}px)`, transition: 'none' } : undefined}
      >
        <div
          className={styles.grab}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => {
            startY.current = null
            setOffset(0)
          }}
          aria-hidden="true"
        >
          <span className={styles.handle} />
        </div>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {headerAction}
        </div>
        <div ref={bodyRef}>{children}</div>
      </div>
    </div>
  )
}

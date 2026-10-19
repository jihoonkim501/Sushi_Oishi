import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { t } from '../constants/messages'
import { isLowConfidence } from '../features/scan/display'
import { findNextItem } from '../features/scan/orderEngine'
import type { ScanItem, SheetState } from '../features/scan/types'
import { COLLAPSED_HEIGHT, nextSheetState, sheetHeights, snapSheet } from '../lib/sheet'
import { OrderRow } from './OrderRow'
import styles from './OrderSheet.module.css'

interface OrderSheetProps {
  items: ScanItem[]
  sheetState: SheetState
  /** 목록 전용 모드: 전체 높이로 고정하고 핸들을 숨긴다 (BR-RES-10) */
  locked?: boolean
  selectedItemId: number | null
  /** 값이 바뀔 때마다 해당 아이템 행으로 스크롤한다 */
  scrollTarget?: { itemId: number; key: number } | null
  showLowConfidenceHint: boolean
  onSheetStateChange: (state: SheetState) => void
  onSelect: (itemId: number | null) => void
  onToggleEaten: (itemId: number) => void
  onLongPress: (itemId: number) => void
}

/** DESIGN.md 5.4 / FUNCTIONAL_SPEC F5-1: 접힘 88px · 절반 45vh · 전체 90vh 3단 하단 시트. */
export function OrderSheet({
  items,
  sheetState,
  locked = false,
  selectedItemId,
  scrollTarget = null,
  showLowConfidenceHint,
  onSheetStateChange,
  onSelect,
  onToggleEaten,
  onLongPress,
}: OrderSheetProps) {
  const listRef = useRef<HTMLOListElement>(null)
  const [dragHeight, setDragHeight] = useState<number | null>(null)
  const drag = useRef<{ startY: number; startHeight: number; lastY: number; lastTime: number; velocity: number } | null>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const moved = useRef(false)

  const next = findNextItem(items)
  const eatenCount = items.filter((it) => it.eaten).length
  const hasLow = items.some(isLowConfidence)
  const collapsed = sheetState === 'COLLAPSED'

  useEffect(() => {
    if (!scrollTarget || !listRef.current) return
    const row = listRef.current.querySelector<HTMLElement>(`[data-item-id="${scrollTarget.itemId}"]`)
    row?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [scrollTarget])

  const onHandleDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const height = sheetRef.current?.getBoundingClientRect().height ?? sheetHeights(window.innerHeight)[sheetState]
    e.currentTarget.setPointerCapture?.(e.pointerId)
    moved.current = false
    drag.current = { startY: e.clientY, startHeight: height, lastY: e.clientY, lastTime: e.timeStamp, velocity: 0 }
  }

  const onHandleMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d) return
    const dy = e.clientY - d.startY
    if (Math.abs(dy) > 4) moved.current = true
    const dt = Math.max(1, e.timeStamp - d.lastTime)
    d.velocity = (e.clientY - d.lastY) / dt
    d.lastY = e.clientY
    d.lastTime = e.timeStamp
    const max = window.innerHeight * 0.9
    setDragHeight(Math.min(max, Math.max(COLLAPSED_HEIGHT, d.startHeight - dy)))
  }

  const onHandleUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (moved.current && dragHeight !== null) {
      onSheetStateChange(snapSheet(dragHeight, d.velocity, window.innerHeight))
    }
    setDragHeight(null)
  }

  const heightStyle = dragHeight !== null ? { height: dragHeight, transition: 'none' } : undefined

  return (
    <section
      ref={sheetRef}
      className={`${styles.sheet} ${styles[sheetState.toLowerCase() as "collapsed" | "half" | "full"]} ${locked ? styles.locked : ""}`}
      style={heightStyle}
      aria-label={t('result.sheetTitle')}
    >
      {!locked && (
      <button
        type="button"
        className={styles.handleArea}
        aria-label="먹는 순서 시트 높이 바꾸기"
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        onPointerCancel={onHandleUp}
        onClick={() => {
          if (!moved.current) onSheetStateChange(nextSheetState(sheetState))
        }}
      >
        <span className={styles.handle} />
      </button>
      )}

      {!collapsed && (
        <header className={styles.header}>
          <h2 className={styles.title}>{t('result.sheetTitle')}</h2>
          <span className={styles.progress} aria-label={`${items.length}개 중 ${eatenCount}개 먹음`}>
            {eatenCount} / {items.length}
          </span>
        </header>
      )}

      {!collapsed && next === null && items.length > 0 && (
        <p className={styles.banner} role="status">
          {t('result.allDone')}
        </p>
      )}
      {!collapsed && showLowConfidenceHint && hasLow && (
        <p className={styles.hint}>{t('result.lowConfidence')}</p>
      )}

      {collapsed && next === null && items.length > 0 && (
        <p className={styles.bannerCompact} role="status">
          {t('result.allDone')}
        </p>
      )}

      <ol ref={listRef} className={styles.list}>
        {(collapsed ? (next ? [next] : []) : items).map((item) => (
          <OrderRow
            key={item.itemId}
            item={item}
            isNext={next?.itemId === item.itemId}
            selected={item.itemId === selectedItemId}
            onSelect={(id) => onSelect(id === selectedItemId ? null : id)}
            onToggleEaten={onToggleEaten}
            onLongPress={onLongPress}
          />
        ))}
      </ol>
    </section>
  )
}

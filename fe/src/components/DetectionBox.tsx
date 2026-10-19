import type { CSSProperties } from 'react'
import { confidenceLabel, isLowConfidence } from '../features/scan/display'
import type { ScanItem } from '../features/scan/types'
import { GROUP_LABEL_KO } from '../constants/messages'
import { badgeOffset, type Rect } from '../lib/geometry'
import { useLongPress } from '../lib/useLongPress'
import styles from './DetectionBox.module.css'
import { SushiBadge } from './SushiBadge'

const BADGE_SIZE = 28
const MIN_TAP = 44
/** BR-RES-03: 표시 박스 너비가 이 값보다 작으면 이름 라벨을 숨긴다. */
export const LABEL_MIN_WIDTH = 56

interface DetectionBoxProps {
  item: ScanItem
  /** 컨테이너 기준 표시 좌표 (확대·이동 반영) */
  rect: Rect
  bounds: { width: number; height: number }
  selected: boolean
  /** 행 탭 때마다 바뀌는 값. 바뀌면 배지가 한 번 펄스한다. */
  pulseKey?: number
  animateEntrance?: boolean
  onClick: (itemId: number) => void
  onLongPress: (itemId: number) => void
}

export function DetectionBox({
  item,
  rect,
  bounds,
  selected,
  pulseKey = 0,
  animateEntrance = true,
  onClick,
  onLongPress,
}: DetectionBoxProps) {
  const handlers = useLongPress({
    onLongPress: () => onLongPress(item.itemId),
    onClick: () => onClick(item.itemId),
  })
  const low = isLowConfidence(item)
  const offset = badgeOffset(rect, BADGE_SIZE, bounds)
  const showLabel = rect.width >= LABEL_MIN_WIDTH
  const hitX = Math.max(0, (MIN_TAP - rect.width) / 2)
  const hitY = Math.max(0, (MIN_TAP - rect.height) / 2)

  const style = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    zIndex: 1000 - item.order,
    '--hit-x': `${hitX}px`,
    '--hit-y': `${hitY}px`,
    '--enter-delay': `${(item.order - 1) * 60}ms`,
  } as CSSProperties

  const classes = [
    styles.box,
    selected ? styles.selected : '',
    item.eaten ? styles.eaten : '',
    low ? styles.low : '',
    animateEntrance ? styles.enter : '',
  ]
    .filter(Boolean)
    .join(' ')

  const label = `${item.order}번 ${item.nameKo}, ${GROUP_LABEL_KO[item.group]}, 신뢰도 ${confidenceLabel(item.confidence)}${
    item.eaten ? ', 먹음' : ''
  }${item.corrected ? ', 직접 고침' : ''}`

  return (
    <button
      type="button"
      className={classes}
      style={style}
      aria-label={label}
      aria-pressed={selected}
      data-testid={`box-${item.itemId}`}
      {...handlers}
    >
      <span className={styles.frame} />
      <span className={styles.tag} style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
        <span className={styles.tagScale}>
          <span key={pulseKey} className={`${styles.tagInner} ${pulseKey > 0 ? styles.pulse : ''}`}>
            <SushiBadge order={item.order} group={item.group} checked={item.eaten} />
            {showLabel && (
              <span className={styles.label}>
                {item.nameKo}
                {low ? '?' : ''}
              </span>
            )}
          </span>
        </span>
      </span>
    </button>
  )
}

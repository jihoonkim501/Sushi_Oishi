import { Check, Circle, Pencil } from 'lucide-react'
import { GROUP_LABEL_KO, t } from '../constants/messages'
import { isLowConfidence } from '../features/scan/display'
import type { ScanItem } from '../features/scan/types'
import { useLongPress } from '../lib/useLongPress'
import styles from './OrderRow.module.css'
import { SushiBadge } from './SushiBadge'

interface OrderRowProps {
  item: ScanItem
  isNext: boolean
  selected: boolean
  onSelect: (itemId: number) => void
  onToggleEaten: (itemId: number) => void
  onLongPress: (itemId: number) => void
}

/** DESIGN.md 5.4 OrderRow: 높이 64px, 배지(lg) · 이름 · 그룹 태그 · 체크 버튼. */
export function OrderRow({ item, isNext, selected, onSelect, onToggleEaten, onLongPress }: OrderRowProps) {
  const handlers = useLongPress({
    onLongPress: () => onLongPress(item.itemId),
    onClick: () => onSelect(item.itemId),
  })
  const low = isLowConfidence(item)

  const classes = [
    styles.row,
    isNext ? styles.next : '',
    selected ? styles.selected : '',
    item.eaten ? styles.eaten : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={classes} data-item-id={item.itemId} aria-current={isNext ? 'step' : undefined}>
      <div className={styles.main} {...handlers} role="button" tabIndex={0} aria-pressed={selected}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(item.itemId)
          }
        }}
      >
        <SushiBadge order={item.order} group={item.group} size="lg" />
        <span className={styles.text}>
          <span className={styles.name}>
            {item.nameKo}
            {low ? '?' : ''}
          </span>
          <span className={styles.group}>{GROUP_LABEL_KO[item.group]}</span>
        </span>
        {isNext && <span className={styles.nextLabel}>{t('result.next')}</span>}
      </div>
      <button
        type="button"
        className={styles.check}
        aria-label={`${item.order}번 ${item.nameKo} 종류 바꾸기`}
        onClick={() => onLongPress(item.itemId)}
      >
        <Pencil size={20} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={styles.check}
        aria-pressed={item.eaten}
        aria-label={`${item.order}번 ${item.nameKo} 먹음 표시`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onToggleEaten(item.itemId)
        }}
      >
        {item.eaten ? <Check size={24} strokeWidth={2.5} /> : <Circle size={24} strokeWidth={2} />}
      </button>
    </li>
  )
}

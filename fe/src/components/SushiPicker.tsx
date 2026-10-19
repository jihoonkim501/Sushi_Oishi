import { useMemo } from 'react'
import { BADGE_BY_GROUP } from '../constants/badge'
import { t } from '../constants/messages'
import { UNKNOWN_CLASS_ID } from '../features/scan/orderEngine'
import type { SushiType } from '../features/scan/types'
import { BottomSheet } from './BottomSheet'
import { Button } from './Button'
import { Spinner } from './Spinner'
import styles from './SushiPicker.module.css'

interface SushiPickerProps {
  open: boolean
  /** 종류 목록이 아직 없으면 시트 안에 스피너를 보여준다 */
  types: SushiType[] | undefined
  currentClassId: string
  currentNameKo: string
  onPick: (type: SushiType) => void
  onClose: () => void
}

/** DESIGN.md 5.7 / F6-1: 3열 그리드 + "잘 모르겠어요"(unknown). */
export function SushiPicker({ open, types, currentClassId, currentNameKo, onPick, onClose }: SushiPickerProps) {
  const grid = useMemo(
    () =>
      (types ?? [])
        .filter((type) => type.classId !== UNKNOWN_CLASS_ID)
        .sort((a, b) => a.orderScore - b.orderScore || a.classId.localeCompare(b.classId)),
    [types],
  )
  const unknown = types?.find((type) => type.classId === UNKNOWN_CLASS_ID)
  const ready = !!types && types.length > 0

  return (
    <BottomSheet open={open} title={t('picker.title')} onClose={onClose}>
      <p className={styles.current}>지금: {currentNameKo}</p>
      {!ready && (
        <div className={styles.loading}>
          <Spinner size="lg" label="초밥 종류를 불러오는 중" />
        </div>
      )}
      {ready && (
        <ul className={styles.grid}>
          {grid.map((type) => (
            <li key={type.classId}>
              <button
                type="button"
                className={`${styles.cell} ${type.classId === currentClassId ? styles.selected : ''}`}
                aria-pressed={type.classId === currentClassId}
                onClick={() => onPick(type)}
              >
                <span className={styles.dot} style={{ background: BADGE_BY_GROUP[type.group].bg }} />
                <span className={styles.nameKo}>{type.nameKo}</span>
                <span className={styles.nameJa}>{type.nameJa}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {ready && unknown && (
        <Button variant="secondary" onClick={() => onPick(unknown)}>
          {t('picker.unknown')}
        </Button>
      )}
    </BottomSheet>
  )
}

import { Check } from 'lucide-react'
import { BADGE_BY_GROUP } from '../constants/badge'
import type { Group } from '../features/scan/types'
import styles from './SushiBadge.module.css'

interface SushiBadgeProps {
  order: number
  group: Group
  size?: 'md' | 'lg'
  dimmed?: boolean
  /** 먹음 표시: 숫자 대신 체크 아이콘 (DESIGN.md 5.2) */
  checked?: boolean
}

export function SushiBadge({ order, group, size = 'md', dimmed = false, checked = false }: SushiBadgeProps) {
  const colors = BADGE_BY_GROUP[group]
  return (
    <span
      className={`${styles.badge} ${size === 'lg' ? styles.lg : styles.md} ${dimmed ? styles.dimmed : ''}`}
      style={{ background: colors.bg, color: colors.fg }}
      aria-hidden="true"
    >
      {checked ? <Check size={size === 'lg' ? 18 : 16} strokeWidth={3} /> : order}
    </span>
  )
}

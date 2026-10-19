import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  icon: ReactNode
  message: string
}

/** DESIGN.md 5.15: 아이콘 + 한 줄 문구 (목록 전용 모드 안내 등) */
export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className={styles.box}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <p className={styles.message}>{message}</p>
    </div>
  )
}

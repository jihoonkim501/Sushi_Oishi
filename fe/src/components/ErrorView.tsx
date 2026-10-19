import { TriangleAlert } from 'lucide-react'
import { Button } from './Button'
import styles from './ErrorView.module.css'

interface ErrorViewProps {
  title: string
  description?: string
  actionLabel: string
  onAction: () => void
}

/** S-09 전체 화면 오류 (DESIGN.md 5.15) */
export function ErrorView({ title, description, actionLabel, onAction }: ErrorViewProps) {
  return (
    <main className={styles.page} role="alert">
      <div className={styles.body}>
        <TriangleAlert size={48} className={styles.icon} aria-hidden="true" />
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      <Button onClick={onAction}>{actionLabel}</Button>
    </main>
  )
}

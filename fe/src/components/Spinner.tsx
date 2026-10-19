import styles from './Spinner.module.css'

interface SpinnerProps {
  /** sm: 24px(버튼용), lg: 40px(화면용) */
  size?: 'sm' | 'lg'
  /** primary 버튼 위에서는 on-primary 색을 쓴다 */
  onPrimary?: boolean
  label?: string
}

export function Spinner({ size = 'sm', onPrimary = false, label }: SpinnerProps) {
  return (
    <span
      className={`${styles.spinner} ${size === 'lg' ? styles.lg : styles.sm} ${onPrimary ? styles.onPrimary : ''}`}
      role={label ? 'status' : undefined}
      aria-label={label}
    />
  )
}

import { Check } from 'lucide-react'
import styles from './Toggle.module.css'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** aria-label로 쓰는 이름 */
  label: string
}

/** DESIGN.md 5.13: 켜짐은 색 외에 손잡이 위치(오른쪽)와 체크 아이콘으로도 구분한다. */
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`${styles.hit} ${checked ? styles.on : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.track}>
        <span className={styles.thumb}>{checked && <Check size={14} strokeWidth={3} aria-hidden="true" />}</span>
      </span>
    </button>
  )
}

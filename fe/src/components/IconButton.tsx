import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './IconButton.module.css'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  icon: ReactNode
  /** 화면 낭독기용 이름 (필수) */
  label: string
  /** 사진 위에 올라가는 버튼이면 반투명 배경 + 밝은 아이콘 */
  onPhoto?: boolean
}

/** DESIGN.md 5.9: 아이콘 24px, 히트 영역 44x44. */
export function IconButton({ icon, label, onPhoto = false, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      className={`${styles.button} ${onPhoto ? styles.onPhoto : styles.plain} ${className ?? ''}`}
    >
      {icon}
    </button>
  )
}

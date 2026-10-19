import type { ButtonHTMLAttributes } from 'react'
import styles from './ShutterButton.module.css'

/** DESIGN.md 5.5. v1은 기본 카메라 앱을 쓰므로 화면에서 쓰지 않고, v2 실시간 카메라용으로 둔다. */
export function ShutterButton({
  className,
  type = 'button',
  'aria-label': ariaLabel = '촬영하기',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={ariaLabel}
      className={`${styles.shutter} ${className ?? ''}`}
    />
  )
}

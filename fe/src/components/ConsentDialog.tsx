import { useEffect, useId, useRef } from 'react'
import { t } from '../constants/messages'
import { useFocusTrap } from '../lib/useFocusTrap'
import { Button } from './Button'
import styles from './ConsentDialog.module.css'

interface ConsentDialogProps {
  open: boolean
  onAgree: () => void
  onDecline: () => void
  /** 바깥 탭 · Esc. 호출하는 쪽에서 denied로 처리한다 (FUNCTIONAL_SPEC C-3). */
  onDismiss: () => void
}

/** S-08 사진 저장 동의 다이얼로그 (DESIGN.md 5.14). 초점은 제목 컨테이너에 두어 어느 선택지도 미리 선택된 느낌이 없게 한다. */
export function ConsentDialog({ open, onAgree, onDecline, onDismiss }: ConsentDialogProps) {
  const titleId = useId()
  const bodyId = useId()
  const ref = useRef<HTMLDivElement>(null)

  useFocusTrap(ref, open)

  useEffect(() => {
    if (!open) return
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onDismiss])

  if (!open) return null

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} onClick={onDismiss} data-testid="consent-backdrop" />
      <div
        ref={ref}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
      >
        <h2 id={titleId} className={styles.title}>
          {t('consent.title')}
        </h2>
        <p id={bodyId} className={styles.body}>
          {t('consent.body')}
        </p>
        <div className={styles.actions}>
          <Button onClick={onAgree}>{t('consent.agree')}</Button>
          <Button variant="secondary" onClick={onDecline}>
            {t('consent.decline')}
          </Button>
        </div>
      </div>
    </div>
  )
}

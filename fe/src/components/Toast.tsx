import { CircleAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import styles from './Toast.module.css'
import {
  ToastContext,
  TOAST_ACTION_DURATION_MS,
  TOAST_DURATION_MS,
  type ToastApi,
  type ToastOptions,
} from './toastContext'

interface ToastState {
  id: number
  message: string
  options?: ToastOptions
  isError: boolean
}

/** DESIGN.md 5.8: 한 번에 하나만 표시하고 새 토스트가 이전 것을 대체한다. 시트 높이는 `--toast-offset`으로 받는다. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seq = useRef(0)

  const present = useCallback((message: string, isError: boolean, options?: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current)
    seq.current += 1
    setToast({ id: seq.current, message, options, isError })
    const duration = options?.duration ?? (options?.action ? TOAST_ACTION_DURATION_MS : TOAST_DURATION_MS)
    timer.current = setTimeout(() => setToast(null), duration)
  }, [])

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const api = useMemo<ToastApi>(
    () => ({
      show: (message, options) => present(message, false, options),
      showError: (message, options) => present(message, true, options),
    }),
    [present],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region}>
        {toast && (
          <div
            key={toast.id}
            className={styles.toast}
            role={toast.isError ? 'alert' : 'status'}
            aria-live={toast.isError ? 'assertive' : 'polite'}
          >
            {toast.isError && <CircleAlert size={16} aria-hidden="true" className={styles.icon} />}
            <span>{toast.message}</span>
            {toast.options?.action && (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  toast.options?.action?.onAction()
                  setToast(null)
                }}
              >
                {toast.options.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

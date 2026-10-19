import { createContext, useContext } from 'react'

export interface ToastOptions {
  /** 토스트에 붙는 액션 버튼 (예: 다시 시도). 있으면 5초간 표시한다. */
  action?: { label: string; onAction: () => void }
  /** 표시 시간(ms). 기본 2500, 액션이 있으면 5000 */
  duration?: number
}

export interface ToastApi {
  /** 일반 안내 토스트 */
  show: (message: string, options?: ToastOptions) => void
  /** 오류 토스트: 경고 아이콘 + role="alert" (DESIGN.md 6.6) */
  showError: (message: string, options?: ToastOptions) => void
}

export const TOAST_DURATION_MS = 2500
export const TOAST_ACTION_DURATION_MS = 5000

export const ToastContext = createContext<ToastApi>({ show: () => {}, showError: () => {} })

export function useToast(): ToastApi {
  return useContext(ToastContext)
}

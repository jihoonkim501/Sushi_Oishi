import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Spinner } from '../components/Spinner'
import { useToast } from '../components/toastContext'
import { t, type MessageKey } from '../constants/messages'
import { ApiError } from '../features/scan/api'
import { useCreateScan } from '../features/scan/hooks'
import { savePhoto } from '../features/scan/photoStore'
import { getConsent } from '../lib/consent'
import { useScanStore } from '../store/useScanStore'
import styles from './LoadingPage.module.css'

export const ANALYZE_TIMEOUT_MS = 30_000
const STEP2_AT_MS = 1_500
const SLOW_AT_MS = 10_000

/** S-03: 업로드 요청을 시작하고 결과에 따라 화면을 옮긴다 (FUNCTIONAL_SPEC F2-6, C-4). */
export default function LoadingPage() {
  const navigate = useNavigate()
  const { showError } = useToast()
  // 성공 시 스토어의 대기 사진이 비워져도 이 화면이 홈으로 되돌아가지 않도록 진입 시점 값을 고정한다.
  const [pendingImage] = useState(() => useScanStore.getState().pendingImage)
  const createScan = useCreateScan()
  const [step, setStep] = useState<'step1' | 'step2'>('step1')
  const [slow, setSlow] = useState(false)

  // 효과 안에서는 항상 최신 값을 쓰되, 요청은 마운트당 한 번만 시작한다.
  const latest = useRef({ navigate, showError, createScan: createScan.mutateAsync })
  useEffect(() => {
    latest.current = { navigate, showError, createScan: createScan.mutateAsync }
  })
  const hasImage = pendingImage !== null

  useEffect(() => {
    if (!hasImage) return
    const timers = [
      setTimeout(() => setStep('step2'), STEP2_AT_MS),
      setTimeout(() => setSlow(true), SLOW_AT_MS),
    ]
    return () => timers.forEach(clearTimeout)
  }, [hasImage])

  useEffect(() => {
    const image = pendingImage
    if (!image) return
    const controller = new AbortController()
    let timedOut = false
    let cancelled = false

    const timeout = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, ANALYZE_TIMEOUT_MS)

    // StrictMode의 가짜 언마운트에서 요청이 두 번 나가지 않도록 시작을 한 틱 미룬다.
    const starter = setTimeout(async () => {
      const { navigate: go, showError: toast, createScan: run } = latest.current
      const fail = (to: string, key?: MessageKey, extra?: Parameters<typeof toast>[1]) => {
        if (key) toast(t(key), extra)
        go(to, { replace: true })
      }
      try {
        const scan = await run({
          image: image.blob,
          consent: getConsent() === 'granted',
          signal: controller.signal,
        })
        if (cancelled) return
        // 메모리 사본은 동기로 저장되므로 IndexedDB 기록은 기다리지 않는다.
        void savePhoto(scan.scanId, { blob: image.blob, width: image.width, height: image.height })
        go(`/result/${scan.scanId}`, { replace: true })
        useScanStore.getState().clearPendingImage()
      } catch (err) {
        if (cancelled) return
        if (timedOut) return fail('/review', 'error.timeout')
        if (err instanceof ApiError) {
          switch (err.code) {
            case 'NO_SUSHI_DETECTED':
              return go('/not-found', { replace: true })
            case 'INVALID_IMAGE':
            case 'UNSUPPORTED_FORMAT':
              fail('/', 'error.decodeFailed')
              return useScanStore.getState().clearPendingImage()
            case 'IMAGE_TOO_LARGE':
              fail('/', 'error.tooLarge')
              return useScanStore.getState().clearPendingImage()
            case 'RATE_LIMITED': {
              const seconds = err.retryAfter ?? 0
              if (seconds > 0) useScanStore.getState().setAnalyzeBlockedUntil(Date.now() + seconds * 1000)
              return fail('/review', 'error.rateLimited')
            }
            default:
              return go('/error', { replace: true })
          }
        }
        // fetch 자체가 실패한 경우(TypeError): 네트워크 오류
        return fail('/review', 'error.network', {
          action: { label: t('common.retry'), onAction: () => go('/loading') },
        })
      }
    }, 0)

    return () => {
      // 화면 이탈(뒤로 가기 포함): 요청을 취소하고 오류 토스트는 띄우지 않는다.
      cancelled = true
      clearTimeout(starter)
      clearTimeout(timeout)
      controller.abort()
    }
  }, [pendingImage])

  if (!hasImage) return <Navigate to="/" replace />

  return (
    <main className={styles.page}>
      <img className={styles.backdrop} src={pendingImage.objectUrl} alt="" aria-hidden="true" />
      <div className={styles.scanLine} aria-hidden="true" />
      <div className={styles.message} aria-live="polite">
        <span className={styles.spinner}>
          <Spinner size="lg" />
        </span>
        <p className={styles.text}>{t(`loading.${step}`)}</p>
        {slow && <p className={styles.caption}>{t('loading.slow')}</p>}
      </div>
    </main>
  )
}

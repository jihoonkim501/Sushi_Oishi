import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { ConsentDialog } from '../components/ConsentDialog'
import { useToast } from '../components/toastContext'
import { t } from '../constants/messages'
import { getConsent, setConsent } from '../lib/consent'
import { useScanStore } from '../store/useScanStore'
import styles from './ReviewPage.module.css'

export default function ReviewPage() {
  const navigate = useNavigate()
  const { showError } = useToast()
  const pendingImage = useScanStore((s) => s.pendingImage)
  const clearPendingImage = useScanStore((s) => s.clearPendingImage)
  const blockedUntil = useScanStore((s) => s.analyzeBlockedUntil)
  const [asking, setAsking] = useState(false)
  const [starting, setStarting] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // 429 Retry-After가 끝나면 `분석하기`를 다시 켠다.
  useEffect(() => {
    const remaining = blockedUntil - Date.now()
    if (remaining <= 0) return
    const timer = setTimeout(() => setNow(Date.now()), remaining + 50)
    return () => clearTimeout(timer)
  }, [blockedUntil])

  if (!pendingImage) return <Navigate to="/" replace />

  const blocked = blockedUntil > now

  const startAnalysis = () => {
    setStarting(true)
    performance.mark('analyze-tap')
    navigate('/loading')
  }

  const analyze = () => {
    if (starting) return
    if (!navigator.onLine) {
      showError(t('error.offline'))
      return
    }
    if (getConsent() === null) {
      setAsking(true)
      return
    }
    startAnalysis()
  }

  // 어떤 선택이든(바깥 탭 포함) 선택을 저장하고 분석을 계속한다.
  const decide = (value: 'granted' | 'denied') => {
    setConsent(value)
    setAsking(false)
    startAnalysis()
  }

  const retake = () => {
    clearPendingImage()
    navigate('/', { replace: true })
  }

  return (
    <main className={styles.page}>
      <img className={styles.photo} src={pendingImage.objectUrl} alt="선택한 초밥 사진" />
      <div className={styles.bar}>
        <div className={styles.actions}>
          <Button variant="secondary" fullWidth onClick={retake}>
            {t('review.retake')}
          </Button>
          <Button fullWidth disabled={starting || blocked} onClick={analyze}>
            {t('review.analyze')}
          </Button>
        </div>
        {blocked && (
          <p className={styles.caption} role="status">
            {t('error.rateLimited')}
          </p>
        )}
      </div>
      <ConsentDialog
        open={asking}
        onAgree={() => decide('granted')}
        onDecline={() => decide('denied')}
        onDismiss={() => decide('denied')}
      />
    </main>
  )
}

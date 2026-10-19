import { ArrowDownToLine, Scan, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { EmptyPlate } from '../components/EmptyPlate'
import { t } from '../constants/messages'
import { useScanStore } from '../store/useScanStore'
import styles from './NotFoundPage.module.css'

const TIPS = [
  { key: 'notFound.tip1', Icon: ArrowDownToLine },
  { key: 'notFound.tip2', Icon: Sun },
  { key: 'notFound.tip3', Icon: Scan },
] as const

/** S-05 인식 실패 (422 NO_SUSHI_DETECTED). 방금 찍은 사진이 있으면 썸네일로 보여준다. */
export default function NotFoundPage() {
  const navigate = useNavigate()
  const pendingImage = useScanStore((s) => s.pendingImage)
  const clearPendingImage = useScanStore((s) => s.clearPendingImage)

  return (
    <main className={styles.page}>
      <section className={styles.body}>
        <EmptyPlate />
        {pendingImage && <img className={styles.thumb} src={pendingImage.objectUrl} alt="방금 찍은 사진" />}
        <h1 className={styles.title}>{t('notFound.title')}</h1>
        <ul className={styles.tips}>
          {TIPS.map(({ key, Icon }) => (
            <li key={key} className={styles.tip}>
              <Icon size={20} aria-hidden="true" className={styles.tipIcon} />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </section>
      <Button
        onClick={() => {
          clearPendingImage()
          navigate('/', { replace: true })
        }}
      >
        {t('review.retake')}
      </Button>
    </main>
  )
}

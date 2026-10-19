import { Camera, Image, Settings } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { IconButton } from '../components/IconButton'
import { SettingsSheet } from '../components/SettingsSheet'
import { useToast } from '../components/toastContext'
import { t, type MessageKey } from '../constants/messages'
import { PrepareImageError, prepareImage } from '../features/scan/image'
import { useScanStore } from '../store/useScanStore'
import styles from './HomePage.module.css'

type Source = 'camera' | 'gallery'

export default function HomePage() {
  const navigate = useNavigate()
  const { showError } = useToast()
  const setPendingImage = useScanStore((s) => s.setPendingImage)
  const cameraInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)
  const [preparing, setPreparing] = useState<Source | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleFile = async (source: Source, e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const file = input.files?.[0]
    // 같은 파일을 다시 고를 수 있도록 값을 비운다. 취소(파일 없음)는 아무것도 하지 않는다.
    const reset = () => {
      input.value = ''
    }
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showError(t('error.notImage'))
      reset()
      return
    }
    setPreparing(source)
    try {
      const prepared = await prepareImage(file)
      setPendingImage(prepared)
      navigate('/review')
    } catch (err) {
      const key: MessageKey =
        err instanceof PrepareImageError && err.kind !== 'decodeFailed'
          ? err.kind === 'tooSmall'
            ? 'error.tooSmall'
            : 'error.tooLarge'
          : 'error.decodeFailed'
      showError(t(key))
    } finally {
      setPreparing(null)
      reset()
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brand}>sushi-oishi</span>
        <IconButton
          icon={<Settings size={24} aria-hidden="true" />}
          label={t('common.settings')}
          onClick={() => setSettingsOpen(true)}
        />
      </header>

      <section className={styles.hero}>
        <h1 className={styles.title}>{t('home.title')}</h1>
        <p className={styles.subtitle}>{t('home.subtitle')}</p>
      </section>

      <section className={styles.actions}>
        <Button
          loading={preparing === 'camera'}
          disabled={preparing !== null}
          onClick={() => cameraInput.current?.click()}
        >
          <Camera size={22} aria-hidden="true" />
          {t('home.capture')}
        </Button>
        <Button
          variant="secondary"
          loading={preparing === 'gallery'}
          disabled={preparing !== null}
          onClick={() => galleryInput.current?.click()}
        >
          <Image size={22} aria-hidden="true" />
          {t('home.gallery')}
        </Button>
        <p className={styles.tip}>{t('home.tip')}</p>
      </section>

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        data-testid="camera-input"
        onChange={(e) => void handleFile('camera', e)}
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        hidden
        data-testid="gallery-input"
        onChange={(e) => void handleFile('gallery', e)}
      />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  )
}

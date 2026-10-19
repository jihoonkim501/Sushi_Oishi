import { useNavigate } from 'react-router-dom'
import { ErrorView } from '../components/ErrorView'
import { t } from '../constants/messages'
import { useScanStore } from '../store/useScanStore'

/** S-09 서버/모델 오류 전체 화면 (DESIGN.md 6.6) */
export default function ErrorPage() {
  const navigate = useNavigate()
  const clearPendingImage = useScanStore((s) => s.clearPendingImage)

  return (
    <ErrorView
      title={t('error.server')}
      actionLabel={t('common.home')}
      onAction={() => {
        clearPendingImage()
        navigate('/', { replace: true })
      }}
    />
  )
}

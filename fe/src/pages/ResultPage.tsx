import { ArrowLeft, ImageOff } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { DetectionOverlay } from '../components/DetectionOverlay'
import { EmptyState } from '../components/EmptyState'
import { IconButton } from '../components/IconButton'
import { OrderSheet } from '../components/OrderSheet'
import { SushiPicker } from '../components/SushiPicker'
import { useToast } from '../components/toastContext'
import { t } from '../constants/messages'
import { ApiError } from '../features/scan/api'
import { isLowConfidence } from '../features/scan/display'
import { useScan, useScanActions, useSushiTypes } from '../features/scan/hooks'
import { findNextItem } from '../features/scan/orderEngine'
import { loadPhoto } from '../features/scan/photoStore'
import type { ZoomState } from '../features/scan/types'
import { readStorage, STORAGE_KEYS, writeStorage } from '../lib/safeStorage'
import { useScanStore } from '../store/useScanStore'
import styles from './ResultPage.module.css'

type PhotoState =
  | { status: 'loading' }
  | { status: 'ready'; url: string }
  | { status: 'none' }

const TOAST_OFFSET = { COLLAPSED: '88px', HALF: '45vh', FULL: '90vh' } as const

interface PickerState {
  pickerItemId?: number
}

export default function ResultPage() {
  const { scanId = '' } = useParams<{ scanId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { showError } = useToast()
  const { data: scan, error } = useScan(scanId)
  const { data: types } = useSushiTypes()
  const { toggleEaten, correct } = useScanActions(scanId)

  const selectedItemId = useScanStore((s) => s.selectedItemId)
  const sheetState = useScanStore((s) => s.sheetState)
  const zoom = useScanStore((s) => s.zoom)
  const selectItem = useScanStore((s) => s.selectItem)
  const setSheetState = useScanStore((s) => s.setSheetState)
  const setZoom = useScanStore((s) => s.setZoom)
  const resetResultView = useScanStore((s) => s.resetResultView)

  const [loaded, setLoaded] = useState<{ scanId: string; photo: PhotoState } | null>(null)
  const photo: PhotoState = loaded?.scanId === scanId ? loaded.photo : { status: 'loading' }
  const [scrollTarget, setScrollTarget] = useState<{ itemId: number; key: number } | null>(null)
  const [pulse, setPulse] = useState<{ itemId: number; key: number } | null>(null)
  const counter = useRef(0)
  const [showHint] = useState(() => readStorage(STORAGE_KEYS.lowConfidenceHintSeen) !== '1')

  useEffect(() => {
    resetResultView()
  }, [scanId, resetResultView])

  // C-8: 로컬 사진 보관소에서 사진을 찾는다 (없으면 목록 전용 모드).
  useEffect(() => {
    let url: string | null = null
    let cancelled = false
    loadPhoto(scanId).then((stored) => {
      if (cancelled) return
      if (!stored) {
        setLoaded({ scanId, photo: { status: 'none' } })
        return
      }
      url = URL.createObjectURL(stored.blob)
      setLoaded({ scanId, photo: { status: 'ready', url } })
    })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [scanId])

  useEffect(() => {
    if (photo.status === 'none') setSheetState('FULL')
  }, [photo.status, setSheetState])

  // 토스트는 시트 위 16px에 뜬다.
  useEffect(() => {
    document.documentElement.style.setProperty('--toast-offset', TOAST_OFFSET[sheetState])
    return () => {
      document.documentElement.style.removeProperty('--toast-offset')
    }
  }, [sheetState])

  // F4-4: 404는 홈으로, 그 밖의 오류는 오류 화면으로 보낸다.
  useEffect(() => {
    if (!error) return
    if (error instanceof ApiError && (error.status === 404 || error.code === 'SCAN_NOT_FOUND')) {
      showError(t('error.scanNotFound'))
      navigate('/', { replace: true })
    } else {
      navigate('/error', { replace: true })
    }
  }, [error, showError, navigate])

  // NFR-PERF-001: `분석하기` 탭 ~ 결과 첫 렌더
  const measured = useRef(false)
  useEffect(() => {
    if (!scan || measured.current) return
    measured.current = true
    try {
      performance.mark('result-rendered')
      const m = performance.measure('analyze-to-result', 'analyze-tap', 'result-rendered')
      if (import.meta.env.DEV) console.debug(`analyze-to-result: ${Math.round(m.duration)}ms`)
    } catch {
      // analyze-tap 마크가 없으면(새로고침 등) 측정하지 않는다.
    }
  }, [scan])

  const items = scan?.items
  const hasLow = items?.some(isLowConfidence) ?? false
  useEffect(() => {
    if (hasLow && showHint) writeStorage(STORAGE_KEYS.lowConfidenceHintSeen, '1')
  }, [hasLow, showHint])

  const focusRow = useCallback((itemId: number) => {
    counter.current += 1
    setScrollTarget({ itemId, key: counter.current })
  }, [])

  const onSelectFromPhoto = useCallback(
    (itemId: number | null) => {
      selectItem(itemId)
      if (itemId === null) return
      if (useScanStore.getState().sheetState === 'COLLAPSED') setSheetState('HALF')
      focusRow(itemId)
    },
    [selectItem, setSheetState, focusRow],
  )

  const onSelectFromRow = useCallback(
    (itemId: number | null) => {
      selectItem(itemId)
      if (itemId === null) return
      counter.current += 1
      setPulse({ itemId, key: counter.current })
    },
    [selectItem],
  )

  const onZoomChange = useCallback(
    (next: ZoomState) => {
      if (useScanStore.getState().zoom.scale === 1 && next.scale > 1) setSheetState('COLLAPSED')
      setZoom(next)
    },
    [setSheetState, setZoom],
  )

  const onToggleEaten = (itemId: number) => {
    if (!items) return
    const target = items.find((it) => it.itemId === itemId)
    if (!target) return
    toggleEaten(itemId)
    if (!target.eaten) {
      // F5-4: 체크하면 다음 차례 행으로 이동하고 선택한다.
      const next = findNextItem(items.map((it) => (it.itemId === itemId ? { ...it, eaten: true } : it)))
      if (next) {
        selectItem(next.itemId)
        focusRow(next.itemId)
      }
    }
  }

  const pickerItemId = (location.state as PickerState | null)?.pickerItemId
  const pickerItem = items?.find((it) => it.itemId === pickerItemId)

  const openPicker = useCallback(
    (itemId: number) => {
      selectItem(itemId)
      navigate(location.pathname, { state: { pickerItemId: itemId } satisfies PickerState })
    },
    [navigate, location.pathname, selectItem],
  )

  if (!scanId) return <Navigate to="/" replace />

  const listOnly = photo.status === 'none'

  return (
    <main className={`${styles.page} ${listOnly ? styles.listOnly : ''}`} data-sheet={sheetState}>
      {items ? (
        <OrderSheet
          items={items}
          sheetState={sheetState}
          locked={listOnly}
          selectedItemId={selectedItemId}
          scrollTarget={scrollTarget}
          showLowConfidenceHint={showHint}
          onSheetStateChange={setSheetState}
          onSelect={onSelectFromRow}
          onToggleEaten={onToggleEaten}
          onLongPress={openPicker}
        />
      ) : (
        <section className={styles.skeletonSheet} aria-busy="true" aria-label={t('result.sheetTitle')}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </section>
      )}

      <div className={`${styles.photoArea} ${!scan || photo.status === 'loading' ? styles.photoPlaceholder : ''}`}>
        {/* 공유 버튼은 v1에서 숨긴다 (REQUIREMENTS Q-1) */}
        <header className={`${styles.topbar} ${listOnly ? styles.topbarPlain : ''}`}>
          <IconButton
            icon={<ArrowLeft size={24} aria-hidden="true" />}
            label={t('common.back')}
            onPhoto={!listOnly}
            onClick={() => navigate('/')}
          />
        </header>

        {photo.status === 'ready' && scan && (
          <DetectionOverlay
            photoUrl={photo.url}
            imageWidth={scan.imageWidth}
            imageHeight={scan.imageHeight}
            items={scan.items}
            selectedItemId={selectedItemId}
            pulse={pulse}
            zoom={zoom}
            onZoomChange={onZoomChange}
            onSelect={onSelectFromPhoto}
            onLongPress={openPicker}
          />
        )}
        {listOnly && (
          <div className={styles.noPhoto}>
            <EmptyState icon={<ImageOff size={32} />} message={t('result.noLocalPhoto')} />
          </div>
        )}
      </div>

      <SushiPicker
        open={!!pickerItem}
        types={types}
        currentClassId={pickerItem?.classId ?? ''}
        currentNameKo={pickerItem?.nameKo ?? ''}
        onClose={() => navigate(-1)}
        onPick={(type) => {
          if (!pickerItem) return
          navigate(-1)
          void correct(pickerItem.itemId, type)
        }}
      />
    </main>
  )
}

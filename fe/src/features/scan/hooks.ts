import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { t } from '../../constants/messages'
import { readStorage, STORAGE_KEYS, writeStorage } from '../../lib/safeStorage'
import { useScanStore } from '../../store/useScanStore'
import { useToast } from '../../components/toastContext'
import { createScan, getScan, getSushiTypes, patchItem } from './api'
import { applyCorrection } from './orderEngine'
import type { ScanItem, ScanResponse, SushiType } from './types'

const DAY_MS = 24 * 60 * 60 * 1000
export const EATEN_DEBOUNCE_MS = 300

export const scanKey = (scanId: string) => ['scan', scanId] as const
export const SUSHI_TYPES_KEY = ['sushiTypes'] as const

function loadCachedTypes(): SushiType[] | undefined {
  const raw = readStorage(STORAGE_KEYS.sushiTypes)
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw) as SushiType[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined
  } catch {
    return undefined
  }
}

/** C-2: staleTime 24h, gcTime 7d, localStorage 초기값 + 성공 시 다시 저장. */
export function useSushiTypes() {
  return useQuery({
    queryKey: SUSHI_TYPES_KEY,
    queryFn: async ({ signal }) => {
      const types = await getSushiTypes(signal)
      writeStorage(STORAGE_KEYS.sushiTypes, JSON.stringify(types))
      return types
    },
    initialData: loadCachedTypes,
    initialDataUpdatedAt: 0,
    staleTime: DAY_MS,
    gcTime: 7 * DAY_MS,
  })
}

export function useScan(scanId: string | undefined) {
  return useQuery({
    queryKey: scanKey(scanId ?? ''),
    queryFn: ({ signal }) => getScan(scanId!, signal),
    enabled: !!scanId,
    staleTime: Infinity,
    retry: false,
  })
}

export function useCreateScan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ image, consent, signal }: { image: Blob; consent: boolean; signal?: AbortSignal }) =>
      createScan(image, consent, signal),
    onSuccess: (scan) => {
      queryClient.setQueryData(scanKey(scan.scanId), scan)
    },
  })
}

function updateItems(
  queryClient: QueryClient,
  scanId: string,
  update: (items: ScanItem[]) => ScanItem[],
): void {
  queryClient.setQueryData<ScanResponse>(scanKey(scanId), (prev) =>
    prev ? { ...prev, items: update(prev.items) } : prev,
  )
}

/**
 * 결과 화면의 변경 동작 (F5-3 먹음 체크, F6-3 종류 수정).
 * 둘 다 낙관적으로 캐시를 바꾸고 서버 응답으로 덮어쓰며, 실패하면 되돌린다.
 */
export function useScanActions(scanId: string) {
  const queryClient = useQueryClient()
  const { show, showError } = useToast()
  const toggleRef = useRef<(itemId: number) => void>(() => {})
  const { data: types } = useSushiTypes()
  const addPendingPatch = useScanStore((s) => s.addPendingPatch)
  const removePendingPatch = useScanStore((s) => s.removePendingPatch)

  // 디바운스 중인 먹음 값. 서버 응답으로 캐시를 덮어쓸 때 이 값을 다시 얹는다.
  const eatenTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  const eatenDraft = useRef(new Map<number, { value: boolean; base: boolean }>())

  const eatenFlushers = useRef(new Map<number, () => Promise<void>>())

  // 화면을 떠날 때 디바운스 중인 먹음 변경은 버리지 않고 바로 전송한다.
  useEffect(() => {
    const timers = eatenTimers.current
    const flushers = eatenFlushers.current
    return () => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
      for (const flush of [...flushers.values()]) void flush()
    }
  }, [])

  const applyServer = useCallback(
    (scan: ScanResponse) => {
      const drafts = eatenDraft.current
      const items = scan.items.map((it) => {
        const draft = drafts.get(it.itemId)
        return draft ? { ...it, eaten: draft.value } : it
      })
      queryClient.setQueryData<ScanResponse>(scanKey(scanId), { ...scan, items })
    },
    [queryClient, scanId],
  )

  const toggleEaten = useCallback(
    (itemId: number) => {
      const current = queryClient
        .getQueryData<ScanResponse>(scanKey(scanId))
        ?.items.find((it) => it.itemId === itemId)
      if (!current) return
      const next = !current.eaten
      const base = eatenDraft.current.get(itemId)?.base ?? current.eaten
      eatenDraft.current.set(itemId, { value: next, base })
      updateItems(queryClient, scanId, (items) =>
        items.map((it) => (it.itemId === itemId ? { ...it, eaten: next } : it)),
      )

      const prevTimer = eatenTimers.current.get(itemId)
      if (prevTimer) clearTimeout(prevTimer)

      const send = async () => {
        eatenTimers.current.delete(itemId)
        eatenFlushers.current.delete(itemId)
        const draft = eatenDraft.current.get(itemId)
        if (!draft) return
        try {
          const scan = await patchItem(scanId, itemId, { eaten: draft.value })
          // 요청 중 다시 눌렀다면 새 draft가 남아 있다.
          if (eatenDraft.current.get(itemId) === draft) eatenDraft.current.delete(itemId)
          applyServer(scan)
        } catch {
          if (eatenDraft.current.get(itemId) === draft) eatenDraft.current.delete(itemId)
          updateItems(queryClient, scanId, (items) =>
            items.map((it) => (it.itemId === itemId ? { ...it, eaten: draft.base } : it)),
          )
          showError(t('error.saveFailed'), {
            action: { label: t('common.retry'), onAction: () => toggleRef.current(itemId) },
          })
        }
      }
      eatenFlushers.current.set(itemId, send)
      eatenTimers.current.set(itemId, setTimeout(send, EATEN_DEBOUNCE_MS))
    },
    [queryClient, scanId, applyServer, showError],
  )

  useEffect(() => {
    toggleRef.current = toggleEaten
  }, [toggleEaten])

  const correct = useCallback(
    async (itemId: number, target: SushiType): Promise<void> => {
      const store = useScanStore.getState()
      if (store.pendingPatches.has(itemId)) return
      const snapshot = queryClient.getQueryData<ScanResponse>(scanKey(scanId))
      const item = snapshot?.items.find((it) => it.itemId === itemId)
      if (!snapshot || !item || !types) return
      if (item.classId === target.classId) return // BR-COR-01

      addPendingPatch(itemId)
      updateItems(queryClient, scanId, (items) => applyCorrection(items, itemId, target, types))
      show(t('result.reordered'))
      try {
        const scan = await patchItem(scanId, itemId, { classId: target.classId })
        applyServer(scan)
      } catch {
        queryClient.setQueryData(scanKey(scanId), snapshot)
        showError(t('error.correctionFailed'))
      } finally {
        removePendingPatch(itemId)
      }
    },
    [queryClient, scanId, types, addPendingPatch, removePendingPatch, show, showError, applyServer],
  )

  return useMemo(() => ({ toggleEaten, correct }), [toggleEaten, correct])
}

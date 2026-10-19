import { create } from 'zustand'
import type { PreparedImage, SheetState, ZoomState } from '../features/scan/types'

/** FUNCTIONAL_SPEC 7.1. 서버 데이터는 TanStack Query 캐시에 둔다. */
interface ScanState {
  pendingImage: PreparedImage | null
  selectedItemId: number | null
  sheetState: SheetState
  zoom: ZoomState
  pendingPatches: ReadonlySet<number>
  /** 429 Retry-After 동안 `분석하기`를 막는 종료 시각 (epoch ms). 0이면 제한 없음 */
  analyzeBlockedUntil: number

  setAnalyzeBlockedUntil: (until: number) => void
  setPendingImage: (image: PreparedImage | null) => void
  /** objectURL을 해제하고 대기 사진을 비운다. */
  clearPendingImage: () => void
  selectItem: (itemId: number | null) => void
  setSheetState: (state: SheetState) => void
  setZoom: (zoom: ZoomState) => void
  addPendingPatch: (itemId: number) => void
  removePendingPatch: (itemId: number) => void
  resetResultView: () => void
}

export const INITIAL_ZOOM: ZoomState = { scale: 1, x: 0, y: 0 }

export const useScanStore = create<ScanState>((set, get) => ({
  pendingImage: null,
  selectedItemId: null,
  sheetState: 'HALF',
  zoom: INITIAL_ZOOM,
  pendingPatches: new Set<number>(),
  analyzeBlockedUntil: 0,

  setAnalyzeBlockedUntil: (until) => set({ analyzeBlockedUntil: until }),
  setPendingImage: (image) => {
    const prev = get().pendingImage
    if (prev && prev !== image) URL.revokeObjectURL(prev.objectUrl)
    set({ pendingImage: image })
  },
  clearPendingImage: () => {
    const prev = get().pendingImage
    if (prev) URL.revokeObjectURL(prev.objectUrl)
    set({ pendingImage: null })
  },
  selectItem: (itemId) => set({ selectedItemId: itemId }),
  setSheetState: (sheetState) => set({ sheetState }),
  setZoom: (zoom) => set({ zoom }),
  addPendingPatch: (itemId) =>
    set((s) => ({ pendingPatches: new Set(s.pendingPatches).add(itemId) })),
  removePendingPatch: (itemId) =>
    set((s) => {
      const next = new Set(s.pendingPatches)
      next.delete(itemId)
      return { pendingPatches: next }
    }),
  resetResultView: () =>
    set({ selectedItemId: null, sheetState: 'HALF', zoom: INITIAL_ZOOM, pendingPatches: new Set() }),
}))

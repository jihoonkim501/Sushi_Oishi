import type { SheetState } from '../features/scan/types'

export const COLLAPSED_HEIGHT = 88
const HALF_RATIO = 0.45
const FULL_RATIO = 0.9

export function sheetHeights(viewportHeight: number): Record<SheetState, number> {
  return {
    COLLAPSED: COLLAPSED_HEIGHT,
    HALF: viewportHeight * HALF_RATIO,
    FULL: viewportHeight * FULL_RATIO,
  }
}

/**
 * F5-1: 드래그 종료 시 속도·위치로 가장 가까운 상태에 스냅한다.
 * velocity는 아래로 내려가는 방향이 양수(px/ms)다.
 */
export function snapSheet(heightPx: number, velocity: number, viewportHeight: number): SheetState {
  const projected = heightPx - velocity * 150
  const heights = sheetHeights(viewportHeight)
  let best: SheetState = 'HALF'
  let bestDistance = Infinity
  for (const state of ['COLLAPSED', 'HALF', 'FULL'] as const) {
    const distance = Math.abs(heights[state] - projected)
    if (distance < bestDistance) {
      best = state
      bestDistance = distance
    }
  }
  return best
}

export function nextSheetState(state: SheetState): SheetState {
  return state === 'COLLAPSED' ? 'HALF' : state === 'HALF' ? 'FULL' : 'HALF'
}

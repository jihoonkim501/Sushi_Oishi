import { describe, expect, it } from 'vitest'
import { nextSheetState, sheetHeights, snapSheet } from './sheet'

describe('sheet snap (F5-1)', () => {
  const vh = 800

  it('높이는 88px / 45vh / 90vh', () => {
    expect(sheetHeights(vh)).toEqual({ COLLAPSED: 88, HALF: 360, FULL: 720 })
  })

  it('가장 가까운 상태로 스냅한다', () => {
    expect(snapSheet(100, 0, vh)).toBe('COLLAPSED')
    expect(snapSheet(380, 0, vh)).toBe('HALF')
    expect(snapSheet(650, 0, vh)).toBe('FULL')
  })

  it('빠르게 아래로 던지면 더 낮은 상태로 간다', () => {
    expect(snapSheet(360, 2, vh)).toBe('COLLAPSED')
    expect(snapSheet(360, -2, vh)).toBe('FULL')
  })

  it('핸들 탭은 접힘, 절반, 전체, 절반 순으로 돈다', () => {
    expect(nextSheetState('COLLAPSED')).toBe('HALF')
    expect(nextSheetState('HALF')).toBe('FULL')
    expect(nextSheetState('FULL')).toBe('HALF')
  })
})

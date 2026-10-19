import { describe, expect, it } from 'vitest'
import { computeTargetSize } from './image'

describe('computeTargetSize (F1-4, BR-IMG-02)', () => {
  it('긴 변이 1280을 넘으면 비율을 유지해 축소한다 (E2E-02: 4032x3024 세로는 960x1280)', () => {
    expect(computeTargetSize(3024, 4032)).toEqual({ width: 960, height: 1280 })
    expect(computeTargetSize(4032, 3024)).toEqual({ width: 1280, height: 960 })
  })

  it('확대하지 않는다', () => {
    expect(computeTargetSize(640, 480)).toEqual({ width: 640, height: 480 })
    expect(computeTargetSize(1280, 720)).toEqual({ width: 1280, height: 720 })
  })
})

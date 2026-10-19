import { describe, expect, it } from 'vitest'
import cases from '../../test/fixtures/order-cases.json'
import { TYPES, makeItem } from '../../test/fixtures'
import { applyCorrection, buildScoreOf, findNextItem, recomputeOrder, sortByOrder } from './orderEngine'
import type { Box } from './types'

interface Case {
  id: string
  items: { id: string; classId: string; confidence: number; box: Box }[]
  expected: string[]
}

const scoreOf = buildScoreOf(TYPES)

describe('orderEngine 공유 케이스 (order-cases.json, FR-ORD-003, BR-ORD-04)', () => {
  for (const c of cases as Case[]) {
    it(`${c.id}`, () => {
      const sorted = sortByOrder(c.items, scoreOf)
      expect(sorted.map((it) => it.id)).toEqual(c.expected)
    })
  }
})

describe('orderEngine', () => {
  it('BR-ORD-01 미등록 클래스는 unknown 점수(50)로 정렬한다', () => {
    expect(scoreOf('engawa')).toBe(50)
  })

  it('입력 배열을 바꾸지 않는다', () => {
    const items = [
      { classId: 'tamago', confidence: 0.9, box: { x1: 0, y1: 0, x2: 80, y2: 60 } },
      { classId: 'hirame', confidence: 0.9, box: { x1: 100, y1: 0, x2: 180, y2: 60 } },
    ]
    const copy = [...items]
    sortByOrder(items, scoreOf)
    expect(items).toEqual(copy)
  })

  it('BR-ORD-06 order를 1부터 1씩 부여한다', () => {
    const items = [
      makeItem({ itemId: 1, classId: 'tamago', box: { x1: 0, y1: 0, x2: 80, y2: 60 } }),
      makeItem({ itemId: 2, classId: 'hirame', box: { x1: 100, y1: 0, x2: 180, y2: 60 } }),
    ]
    const result = recomputeOrder(items, TYPES)
    expect(result.map((it) => [it.itemId, it.order])).toEqual([
      [2, 1],
      [1, 2],
    ])
  })

  it('BR-ORD-08 재계산해도 eaten, confidence, box는 그대로다', () => {
    const items = [
      makeItem({ itemId: 1, classId: 'tamago', eaten: true, confidence: 0.55 }),
      makeItem({ itemId: 2, classId: 'hirame', box: { x1: 100, y1: 0, x2: 180, y2: 60 } }),
    ]
    const result = applyCorrection(items, 2, TYPES.find((t) => t.classId === 'unagi')!, TYPES)
    const first = result.find((it) => it.itemId === 1)!
    expect(first).toMatchObject({ eaten: true, confidence: 0.55, box: items[0].box })
  })

  it('F6-3 수정하면 이름·그룹·corrected가 바뀌고 순서가 다시 계산된다 (TC-ORD-09 흐름)', () => {
    const items = [
      makeItem({ itemId: 1, classId: 'hirame', box: { x1: 0, y1: 0, x2: 80, y2: 60 } }),
      makeItem({ itemId: 2, classId: 'salmon', box: { x1: 100, y1: 0, x2: 180, y2: 60 } }),
    ]
    const toro = TYPES.find((t) => t.classId === 'toro')!
    const result = applyCorrection(recomputeOrder(items, TYPES), 1, toro, TYPES)
    expect(result.map((it) => it.itemId)).toEqual([2, 1])
    expect(result[1]).toMatchObject({ classId: 'toro', nameKo: '참치 뱃살', group: 'FATTY', corrected: true, order: 2 })
  })

  it('응답의 2자리 confidence를 그대로 쓴다: 같으면 x1 순으로 정해진다 (서버와 동일)', () => {
    // 서버가 0.904와 0.896을 모두 0.9로 내려주므로 클라이언트에서는 동점이다.
    const wide = { classId: 'salmon', confidence: 0.9, box: { x1: 100, y1: 100, x2: 300, y2: 160 } }
    const narrow = { classId: 'salmon', confidence: 0.9, box: { x1: 150, y1: 100, x2: 250, y2: 160 } }
    expect(sortByOrder([narrow, wide], scoreOf)).toEqual([wide, narrow])
    // 값이 실제로 다르면 confidence가 큰 쪽이 먼저
    const high = { ...narrow, confidence: 0.91 }
    expect(sortByOrder([wide, high], scoreOf)).toEqual([high, wide])
  })

  it('BR-EAT-02 다음 차례는 안 먹은 것 중 order가 가장 작은 항목이다', () => {
    const items = [
      makeItem({ itemId: 1, classId: 'hirame', order: 1, eaten: false }),
      makeItem({ itemId: 2, classId: 'tai', order: 2, eaten: false }),
      makeItem({ itemId: 3, classId: 'salmon', order: 3, eaten: true }),
    ]
    expect(findNextItem(items)?.itemId).toBe(1)
    items[0].eaten = true
    expect(findNextItem(items)?.itemId).toBe(2)
    items[1].eaten = true
    expect(findNextItem(items)).toBeNull()
  })
})

import type { Box, ScanItem, SushiType } from './types'

export const UNKNOWN_CLASS_ID = 'unknown'
export const UNKNOWN_SCORE = 50

export interface OrderInput {
  classId: string
  confidence: number
  box: Box
}

interface Measured<T> {
  item: T
  cx: number
  cy: number
  h: number
}

/**
 * 먹는 순서 정렬 (PROJECT_SPEC 4.2, FUNCTIONAL_SPEC BR-ORD-01~07).
 * 서버 OrderEngine과 같은 결과를 내야 하며 공유 케이스(order-cases.json)로 검증한다.
 * 입력 배열은 바꾸지 않고, order 순으로 정렬된 새 배열을 돌려준다.
 */
export function sortByOrder<T extends OrderInput>(
  items: readonly T[],
  scoreOf: (classId: string) => number,
): T[] {
  const byScore = new Map<number, Measured<T>[]>()
  for (const item of items) {
    const score = scoreOf(item.classId)
    const m: Measured<T> = {
      item,
      cx: (item.box.x1 + item.box.x2) / 2,
      cy: (item.box.y1 + item.box.y2) / 2,
      h: item.box.y2 - item.box.y1,
    }
    const bucket = byScore.get(score)
    if (bucket) bucket.push(m)
    else byScore.set(score, [m])
  }

  const result: T[] = []
  const scores = [...byScore.keys()].sort((a, b) => a - b)
  for (const score of scores) {
    const group = byScore
      .get(score)!
      .sort((a, b) => a.cy - b.cy || a.cx - b.cx || b.item.confidence - a.item.confidence)

    // BR-ORD-04: 행 기준(anchor)을 고정한 그룹핑. 비교 함수에 행 판정을 넣지 않는다 (BR-ORD-07).
    const rows: Measured<T>[][] = []
    let anchor: Measured<T> | null = null
    for (const m of group) {
      if (anchor === null || m.cy - anchor.cy > 0.5 * anchor.h) {
        anchor = m
        rows.push([m])
      } else {
        rows[rows.length - 1].push(m)
      }
    }

    for (const row of rows) {
      row.sort(
        (a, b) =>
          a.cx - b.cx ||
          b.item.confidence - a.item.confidence ||
          a.item.box.x1 - b.item.box.x1 ||
          a.item.box.y1 - b.item.box.y1,
      )
      for (const m of row) result.push(m.item)
    }
  }
  return result
}

export function buildScoreOf(types: readonly SushiType[]): (classId: string) => number {
  const scores = new Map(types.map((type) => [type.classId, type.orderScore]))
  const unknownScore = scores.get(UNKNOWN_CLASS_ID) ?? UNKNOWN_SCORE
  return (classId) => scores.get(classId) ?? unknownScore
}

/** 아이템의 order(1..N)를 다시 계산해 order 오름차순 배열로 돌려준다 (F3-3). */
export function recomputeOrder(items: readonly ScanItem[], types: readonly SushiType[]): ScanItem[] {
  return sortByOrder(items, buildScoreOf(types)).map((item, i) => ({ ...item, order: i + 1 }))
}

/** 한 아이템의 종류를 바꾸고(corrected=true) 순서를 다시 계산한다 (F6-3). */
export function applyCorrection(
  items: readonly ScanItem[],
  itemId: number,
  target: SushiType,
  types: readonly SushiType[],
): ScanItem[] {
  const next = items.map((it) =>
    it.itemId === itemId
      ? { ...it, classId: target.classId, nameKo: target.nameKo, group: target.group, corrected: true }
      : it,
  )
  return recomputeOrder(next, types)
}

/** 안 먹은 것 중 order가 가장 작은 아이템 (F5-4) */
export function findNextItem(items: readonly ScanItem[]): ScanItem | null {
  let next: ScanItem | null = null
  for (const it of items) {
    if (!it.eaten && (next === null || it.order < next.order)) next = it
  }
  return next
}

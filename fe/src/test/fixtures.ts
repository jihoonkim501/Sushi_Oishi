import type { ScanItem, ScanResponse, SushiType } from '../features/scan/types'

export const TYPES: SushiType[] = [
  { classId: 'hirame', nameKo: '광어', nameJa: 'ヒラメ', group: 'WHITE', orderScore: 10, description: null },
  { classId: 'tai', nameKo: '도미', nameJa: '鯛', group: 'WHITE', orderScore: 12, description: null },
  { classId: 'maguro_akami', nameKo: '참치 붉은살', nameJa: '赤身', group: 'RED', orderScore: 30, description: null },
  { classId: 'salmon', nameKo: '연어', nameJa: 'サーモン', group: 'FATTY', orderScore: 50, description: null },
  { classId: 'toro', nameKo: '참치 뱃살', nameJa: 'トロ', group: 'FATTY', orderScore: 55, description: null },
  { classId: 'ikura', nameKo: '연어알(군함)', nameJa: 'いくら', group: 'GUNKAN', orderScore: 60, description: null },
  { classId: 'unagi', nameKo: '장어', nameJa: '鰻', group: 'SAUCE', orderScore: 70, description: null },
  { classId: 'tamago', nameKo: '계란', nameJa: '玉子', group: 'FINISH', orderScore: 80, description: null },
  { classId: 'unknown', nameKo: '미확인', nameJa: '不明', group: 'UNKNOWN', orderScore: 50, description: null },
]

export function makeItem(partial: Partial<ScanItem> & { itemId: number; classId: string }): ScanItem {
  const type = TYPES.find((t) => t.classId === partial.classId) ?? TYPES[TYPES.length - 1]
  return {
    order: 0,
    nameKo: type.nameKo,
    group: type.group,
    confidence: 0.9,
    box: { x1: 0, y1: 0, x2: 80, y2: 60 },
    eaten: false,
    corrected: false,
    ...partial,
  }
}

export function makeScan(items: ScanItem[], scanId = 'scan-1'): ScanResponse {
  return {
    scanId,
    imageWidth: 1280,
    imageHeight: 960,
    modelVersion: 'v1',
    createdAt: '2026-10-19T01:30:00Z',
    items,
  }
}

import type { ScanItem } from './types'

export const LOW_CONFIDENCE_THRESHOLD = 0.6

/** BR-RES-02, 7.3: 저신뢰 표시는 수정된 아이템과 먹은 아이템에는 하지 않는다. */
export function isLowConfidence(item: ScanItem): boolean {
  return item.confidence < LOW_CONFIDENCE_THRESHOLD && !item.corrected && !item.eaten
}

export function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return '높음'
  if (confidence >= LOW_CONFIDENCE_THRESHOLD) return '보통'
  return '낮음'
}

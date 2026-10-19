import type { Box } from '../features/scan/types'

export interface Fit {
  /** 이미지 픽셀 → 컨테이너 px 배율 (object-fit: contain) */
  scale: number
  offsetX: number
  offsetY: number
  width: number
  height: number
}

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

/** F4-2 좌표 변환 1~3단계 */
export function computeFit(cw: number, ch: number, imageWidth: number, imageHeight: number): Fit {
  if (cw <= 0 || ch <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return { scale: 0, offsetX: 0, offsetY: 0, width: 0, height: 0 }
  }
  const scale = Math.min(cw / imageWidth, ch / imageHeight)
  const width = imageWidth * scale
  const height = imageHeight * scale
  return { scale, offsetX: (cw - width) / 2, offsetY: (ch - height) / 2, width, height }
}

/**
 * F4-2 좌표 변환 4단계 + 확대/이동.
 * 이미지 레이어는 컨테이너 크기 그대로 두고 (0,0) 기준으로 scale/translate 하므로,
 * 박스는 같은 변환을 좌표에 직접 적용해 화면 px로 얻는다 (배지·라벨 크기는 그대로 유지된다).
 */
export function projectBox(box: Box, fit: Fit, zoom: { scale: number; x: number; y: number }): Rect {
  const left = (box.x1 * fit.scale + fit.offsetX) * zoom.scale + zoom.x
  const top = (box.y1 * fit.scale + fit.offsetY) * zoom.scale + zoom.y
  return {
    left,
    top,
    width: (box.x2 - box.x1) * fit.scale * zoom.scale,
    height: (box.y2 - box.y1) * fit.scale * zoom.scale,
  }
}

export const MIN_ZOOM = 1
export const MAX_ZOOM = 4
export const DOUBLE_TAP_ZOOM = 2.5

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** 사진이 컨테이너 밖으로 완전히 나가지 않도록 이동 범위를 제한한다. */
export function clampZoom(
  zoom: { scale: number; x: number; y: number },
  cw: number,
  ch: number,
): { scale: number; x: number; y: number } {
  const scale = clamp(zoom.scale, MIN_ZOOM, MAX_ZOOM)
  return {
    scale,
    x: clamp(zoom.x, cw * (1 - scale), 0),
    y: clamp(zoom.y, ch * (1 - scale), 0),
  }
}

/** BR-RES-07: 배지는 박스 좌상단 (-14,-14). 표시 영역 밖으로 나가면 안으로 밀어 넣는다. 박스 기준 로컬 오프셋을 돌려준다. */
export function badgeOffset(
  rect: Rect,
  badgeSize: number,
  bounds: { width: number; height: number },
  inset = 14,
): { x: number; y: number } {
  const absX = clamp(rect.left - inset, 0, Math.max(0, bounds.width - badgeSize))
  const absY = clamp(rect.top - inset, 0, Math.max(0, bounds.height - badgeSize))
  return { x: absX - rect.left, y: absY - rect.top }
}

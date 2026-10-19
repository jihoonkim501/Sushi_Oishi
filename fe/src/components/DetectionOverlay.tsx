import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { ScanItem, ZoomState } from '../features/scan/types'
import { clampZoom, computeFit, DOUBLE_TAP_ZOOM, MAX_ZOOM, MIN_ZOOM, projectBox } from '../lib/geometry'
import { DetectionBox } from './DetectionBox'
import styles from './DetectionOverlay.module.css'

const TAP_MOVE_LIMIT = 10
const DOUBLE_TAP_MS = 300

interface DetectionOverlayProps {
  photoUrl: string
  imageWidth: number
  imageHeight: number
  items: ScanItem[]
  selectedItemId: number | null
  pulse?: { itemId: number; key: number } | null
  zoom: ZoomState
  onZoomChange: (zoom: ZoomState) => void
  onSelect: (itemId: number | null) => void
  onLongPress: (itemId: number) => void
}

interface Point {
  x: number
  y: number
}

/** 사진 + 박스 레이어 (PROJECT_SPEC 8.2, FUNCTIONAL_SPEC F4-2, F4-3). */
export function DetectionOverlay({
  photoUrl,
  imageWidth,
  imageHeight,
  items,
  selectedItemId,
  pulse = null,
  zoom,
  onZoomChange,
  onSelect,
  onLongPress,
}: DetectionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight })
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const fit = useMemo(
    () => computeFit(size.width, size.height, imageWidth, imageHeight),
    [size, imageWidth, imageHeight],
  )

  // 크기가 바뀌면 이동 범위도 달라지므로 다시 제한한다.
  useEffect(() => {
    if (zoom.scale === 1 && zoom.x === 0 && zoom.y === 0) return
    const clamped = clampZoom(zoom, size.width, size.height)
    if (clamped.x !== zoom.x || clamped.y !== zoom.y || clamped.scale !== zoom.scale) onZoomChange(clamped)
  }, [size, zoom, onZoomChange])

  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<{
    startDist: number
    startZoom: ZoomState
    startCenter: Point
  } | null>(null)
  const moved = useRef(0)
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null)
  const zoomRef = useRef(zoom)
  useEffect(() => {
    zoomRef.current = zoom
  })

  const localPoint = (e: { clientX: number; clientY: number }): Point => {
    const rect = containerRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const beginPinch = () => {
    const [a, b] = [...pointers.current.values()]
    gesture.current = {
      startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      startZoom: zoomRef.current,
      startCenter: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    }
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.set(e.pointerId, localPoint(e))
    if (pointers.current.size === 1) moved.current = 0
    if (pointers.current.size === 2) beginPinch()
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const next = localPoint(e)
    pointers.current.set(e.pointerId, next)
    moved.current += Math.hypot(next.x - prev.x, next.y - prev.y)

    if (pointers.current.size >= 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const { startDist, startZoom, startCenter } = gesture.current
      const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (startZoom.scale * dist) / startDist))
      // 시작 시점에 손가락 중심 아래에 있던 사진 좌표가 현재 중심 아래에 오도록 이동량을 정한다.
      const px = (startCenter.x - startZoom.x) / startZoom.scale
      const py = (startCenter.y - startZoom.y) / startZoom.scale
      onZoomChange(
        clampZoom({ scale, x: center.x - px * scale, y: center.y - py * scale }, size.width, size.height),
      )
    } else if (pointers.current.size === 1 && zoomRef.current.scale > 1) {
      const z = zoomRef.current
      onZoomChange(clampZoom({ ...z, x: z.x + (next.x - prev.x), y: z.y + (next.y - prev.y) }, size.width, size.height))
    }
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const wasSingle = pointers.current.size === 1
    const point = pointers.current.get(e.pointerId)
    pointers.current.delete(e.pointerId)
    gesture.current = null
    if (pointers.current.size === 2) beginPinch()
    if (!wasSingle || !point || moved.current >= TAP_MOVE_LIMIT) return

    const now = Date.now()
    const previous = lastTap.current
    const isDouble =
      previous !== null &&
      now - previous.time < DOUBLE_TAP_MS &&
      Math.hypot(point.x - previous.x, point.y - previous.y) < 30
    if (isDouble) {
      lastTap.current = null
      const z = zoomRef.current
      if (z.scale > 1) {
        onZoomChange({ scale: 1, x: 0, y: 0 })
      } else {
        const scale = DOUBLE_TAP_ZOOM
        onZoomChange(clampZoom({ scale, x: point.x - point.x * scale, y: point.y - point.y * scale }, size.width, size.height))
      }
      return
    }
    lastTap.current = { time: now, x: point.x, y: point.y }
    // 박스 위 탭은 박스가 처리한다. 빈 영역 탭은 선택 해제.
    if (!(e.target as HTMLElement).closest('[data-testid^="box-"]')) onSelect(null)
  }

  const onPointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId)
    gesture.current = null
  }

  const handleBoxClick = useCallback(
    (itemId: number) => {
      if (moved.current >= TAP_MOVE_LIMIT) return
      onSelect(itemId === selectedItemId ? null : itemId)
    },
    [onSelect, selectedItemId],
  )

  const ordered = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items])

  return (
    <div
      ref={containerRef}
      className={styles.viewport}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div
        className={styles.layer}
        style={{ transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})` }}
      >
        <img className={styles.photo} src={photoUrl} alt="촬영한 초밥 사진" draggable={false} />
      </div>
      <div className={styles.boxes}>
        {fit.scale > 0 &&
          ordered.map((item) => (
            <DetectionBox
              key={item.itemId}
              item={item}
              rect={projectBox(item.box, fit, zoom)}
              bounds={size}
              selected={item.itemId === selectedItemId}
              pulseKey={pulse?.itemId === item.itemId ? pulse.key : 0}
              onClick={handleBoxClick}
              onLongPress={onLongPress}
            />
          ))}
      </div>
    </div>
  )
}

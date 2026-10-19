import { describe, expect, it } from 'vitest'
import { badgeOffset, clampZoom, computeFit, projectBox } from './geometry'

describe('geometry (F4-2, BR-RES-07)', () => {
  it('object-fit: contain 과 같은 배율·오프셋을 계산한다', () => {
    const fit = computeFit(400, 600, 1280, 960)
    expect(fit.scale).toBeCloseTo(0.3125)
    expect(fit.offsetX).toBe(0)
    expect(fit.offsetY).toBeCloseTo(150)
  })

  it('박스를 표시 좌표로 바꾼다', () => {
    const fit = computeFit(400, 600, 1280, 960)
    const rect = projectBox({ x1: 320, y1: 160, x2: 640, y2: 320 }, fit, { scale: 1, x: 0, y: 0 })
    expect(rect).toEqual({ left: 100, top: 200, width: 100, height: 50 })
  })

  it('확대하면 박스 위치와 크기에 같은 변환을 적용한다', () => {
    const fit = computeFit(400, 600, 1280, 960)
    const rect = projectBox({ x1: 320, y1: 160, x2: 640, y2: 320 }, fit, { scale: 2, x: -50, y: -100 })
    expect(rect).toEqual({ left: 150, top: 300, width: 200, height: 100 })
  })

  it('컨테이너 크기가 0이면 배율 0', () => {
    expect(computeFit(0, 0, 1280, 960).scale).toBe(0)
  })

  it('이동은 사진이 컨테이너 밖으로 완전히 나가지 않게 제한한다', () => {
    expect(clampZoom({ scale: 2, x: 100, y: -9999 }, 400, 600)).toEqual({ scale: 2, x: 0, y: -600 })
    expect(clampZoom({ scale: 9, x: 0, y: 0 }, 400, 600).scale).toBe(4)
    expect(clampZoom({ scale: 1, x: -30, y: 30 }, 400, 600)).toEqual({ scale: 1, x: 0, y: 0 })
  })

  it('배지는 박스 좌상단 (-14,-14)에 놓고 표시 영역 밖이면 안으로 민다', () => {
    const bounds = { width: 400, height: 600 }
    expect(badgeOffset({ left: 100, top: 100, width: 50, height: 50 }, 28, bounds)).toEqual({ x: -14, y: -14 })
    expect(badgeOffset({ left: 4, top: 6, width: 50, height: 50 }, 28, bounds)).toEqual({ x: -4, y: -6 })
    expect(badgeOffset({ left: 395, top: 100, width: 50, height: 50 }, 28, bounds).x).toBe(400 - 28 - 395)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createScan, patchItem } from './api'

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

describe('api (C-1, C-4)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('모든 요청에 X-Device-Id 헤더를 붙인다 (FR-DEV-002)', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { scanId: 's', items: [] }))
    await patchItem('s', 1, { eaten: true })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/scans/s/items/1')
    const id = new Headers(init.headers).get('X-Device-Id')
    expect(id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(init.method).toBe('PATCH')
    expect(init.body).toBe(JSON.stringify({ eaten: true }))
  })

  it('POST /scans는 image와 consent를 multipart로 보낸다', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { scanId: 's', items: [] }))
    await createScan(new Blob(['x'], { type: 'image/jpeg' }), true)
    const init = fetchMock.mock.calls[0][1] as RequestInit
    const form = init.body as FormData
    expect(form.get('consent')).toBe('true')
    expect(form.get('image')).toBeInstanceOf(Blob)
  })

  it('오류 본문의 code·message와 Retry-After를 ApiError로 돌려준다', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(429, { code: 'RATE_LIMITED', message: '잠시 후 다시 시도해주세요.' }, { 'Retry-After': '12' }),
    )
    const err = await createScan(new Blob(['x']), false).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 429, code: 'RATE_LIMITED', retryAfter: 12 })
  })

  it('INVALID_DEVICE_ID는 기기 ID를 새로 만들어 1회만 재시도한다', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(400, { code: 'INVALID_DEVICE_ID', message: 'x' }))
      .mockResolvedValueOnce(jsonResponse(200, { scanId: 's', items: [] }))
    await patchItem('s', 1, { eaten: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const first = new Headers((fetchMock.mock.calls[0][1] as RequestInit).headers).get('X-Device-Id')
    const second = new Headers((fetchMock.mock.calls[1][1] as RequestInit).headers).get('X-Device-Id')
    expect(second).not.toBe(first)
  })

  it('재시도해도 INVALID_DEVICE_ID면 오류를 던진다', async () => {
    fetchMock.mockImplementation(async () => jsonResponse(400, { code: 'INVALID_DEVICE_ID', message: 'x' }))
    await expect(patchItem('s', 1, { eaten: true })).rejects.toMatchObject({ code: 'INVALID_DEVICE_ID' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('본문이 JSON이 아니어도 상태 코드로 ApiError를 만든다', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 502 }))
    await expect(patchItem('s', 1, { eaten: true })).rejects.toMatchObject({ status: 502, code: 'UNKNOWN' })
  })
})

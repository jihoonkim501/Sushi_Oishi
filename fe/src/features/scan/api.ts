import { getDeviceId, regenerateDeviceId } from '../../lib/deviceId'
import type { ErrorCode, HealthResponse, PatchItemBody, ScanResponse, SushiType } from './types'

const BASE = '/api/v1'

const KNOWN_CODES: ReadonlySet<string> = new Set<ErrorCode>([
  'INVALID_DEVICE_ID',
  'VALIDATION_ERROR',
  'INVALID_IMAGE',
  'INVALID_CLASS_ID',
  'SCAN_NOT_FOUND',
  'ITEM_NOT_FOUND',
  'IMAGE_TOO_LARGE',
  'UNSUPPORTED_FORMAT',
  'NO_SUSHI_DETECTED',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'MODEL_UNAVAILABLE',
  'SERVER_BUSY',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
])

export class ApiError extends Error {
  readonly status: number
  readonly code: ErrorCode | 'UNKNOWN'
  /** 429 응답의 Retry-After(초) */
  readonly retryAfter: number | null

  constructor(
    status: number,
    code: ErrorCode | 'UNKNOWN',
    message: string,
    retryAfter: number | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfter = retryAfter
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  let code: ErrorCode | 'UNKNOWN' = 'UNKNOWN'
  let message = ''
  try {
    const body = (await res.json()) as { code?: ErrorCode; message?: string }
    // 모르는 코드(라우트 404/405 등)는 UNKNOWN으로 취급해 상태 코드로만 처리한다.
    if (body.code && KNOWN_CODES.has(body.code)) code = body.code
    if (body.message) message = body.message
  } catch {
    // 본문이 JSON이 아니면 상태 코드만 사용한다.
  }
  const header = res.headers.get('Retry-After')
  const parsed = header === null ? NaN : Number(header)
  return new ApiError(res.status, code, message, Number.isFinite(parsed) ? parsed : null)
}

async function request(path: string, init: RequestInit = {}, retryDeviceId = true): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('X-Device-Id', getDeviceId())
  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (res.ok) return res
  const error = await toApiError(res)
  // C-4: 기기 ID 오류는 재생성 후 1회만 재시도한다.
  if (error.code === 'INVALID_DEVICE_ID' && retryDeviceId) {
    regenerateDeviceId()
    return request(path, init, false)
  }
  throw error
}

export async function createScan(
  image: Blob,
  consent: boolean,
  signal?: AbortSignal,
): Promise<ScanResponse> {
  const form = new FormData()
  form.append('image', image, 'scan.jpg')
  form.append('consent', consent ? 'true' : 'false')
  const res = await request('/scans', { method: 'POST', body: form, signal })
  return (await res.json()) as ScanResponse
}

export async function getScan(scanId: string, signal?: AbortSignal): Promise<ScanResponse> {
  const res = await request(`/scans/${encodeURIComponent(scanId)}`, { signal })
  return (await res.json()) as ScanResponse
}

export async function patchItem(
  scanId: string,
  itemId: number,
  body: PatchItemBody,
): Promise<ScanResponse> {
  const res = await request(`/scans/${encodeURIComponent(scanId)}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await res.json()) as ScanResponse
}

export async function getSushiTypes(signal?: AbortSignal): Promise<SushiType[]> {
  const res = await request('/sushi-types', { signal })
  const body = (await res.json()) as { types: SushiType[] }
  return body.types
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch(`${BASE}/health`, { signal })
  return (await res.json()) as HealthResponse
}

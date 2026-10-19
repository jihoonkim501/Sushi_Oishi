import { readStorage, STORAGE_KEYS, writeStorage } from './safeStorage'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

let cached: string | null = null

/** C-1: localStorage 값을 쓰고, 없거나 형식이 틀리면 새로 만들어 저장한다. */
export function getDeviceId(): string {
  if (cached) return cached
  const stored = readStorage(STORAGE_KEYS.deviceId)
  if (stored && UUID_RE.test(stored)) {
    cached = stored
  } else {
    cached = crypto.randomUUID()
    writeStorage(STORAGE_KEYS.deviceId, cached)
  }
  return cached
}

/** 400 INVALID_DEVICE_ID를 받았을 때 새 ID로 교체한다. */
export function regenerateDeviceId(): string {
  cached = crypto.randomUUID()
  writeStorage(STORAGE_KEYS.deviceId, cached)
  return cached
}

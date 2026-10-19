import { readStorage, STORAGE_KEYS, writeStorage } from './safeStorage'

export type Consent = 'granted' | 'denied'

/** C-3: 저장된 동의 상태. 없으면 미결정(null). */
export function getConsent(): Consent | null {
  const value = readStorage(STORAGE_KEYS.consent)
  return value === 'granted' || value === 'denied' ? value : null
}

export function setConsent(value: Consent): void {
  writeStorage(STORAGE_KEYS.consent, value)
}

/** localStorage 접근은 항상 try/catch로 감싼다 (FUNCTIONAL_SPEC 5.6). 저장이 막히면 그 키는 메모리 값으로 동작한다. */
const memory = new Map<string, string>()

export function readStorage(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
    memory.delete(key)
  } catch {
    // 개인정보 보호 모드 등: 새로고침 전까지만 유지되는 메모리 값을 쓴다.
    memory.set(key, value)
  }
}

export const STORAGE_KEYS = {
  deviceId: 'sushioishi.deviceId',
  consent: 'sushioishi.consent',
  theme: 'sushioishi.theme',
  sushiTypes: 'sushioishi.sushiTypes.v1',
  lowConfidenceHintSeen: 'sushioishi.lowConfidenceHintSeen',
} as const

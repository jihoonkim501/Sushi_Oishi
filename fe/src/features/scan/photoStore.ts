/** C-8 로컬 사진 보관소: IndexedDB `sushioishi` / store `photos` / key scanId. 최대 20건, 실패는 무시한다. */
const DB_NAME = 'sushioishi'
const DB_VERSION = 2
const STORE = 'photos'
const CREATED_INDEX = 'createdAt'
export const MAX_PHOTOS = 20

export interface StoredPhoto {
  blob: Blob
  width: number
  height: number
  createdAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      const store = db.objectStoreNames.contains(STORE)
        ? req.transaction!.objectStore(STORE)
        : db.createObjectStore(STORE)
      // 오래된 항목을 사진(blob)을 읽지 않고 찾기 위한 인덱스
      if (!store.indexNames.contains(CREATED_INDEX)) store.createIndex(CREATED_INDEX, CREATED_INDEX)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** IndexedDB를 쓸 수 없어도 같은 세션에서는 결과 사진을 보여주기 위한 메모리 사본 (삽입 순서로 MAX_PHOTOS까지) */
const memory = new Map<string, StoredPhoto>()

function remember(scanId: string, photo: StoredPhoto): void {
  memory.delete(scanId)
  memory.set(scanId, photo)
  while (memory.size > MAX_PHOTOS) {
    const oldest = memory.keys().next().value
    if (oldest === undefined) break
    memory.delete(oldest)
  }
}

/** 메모리 사본은 동기로 저장되고, IndexedDB 기록은 비동기로 이어진다. */
export async function savePhoto(
  scanId: string,
  photo: { blob: Blob; width: number; height: number },
): Promise<void> {
  const stored: StoredPhoto = { ...photo, createdAt: Date.now() }
  remember(scanId, stored)
  try {
    const db = await openDb()
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(stored, scanId)
      await done(tx)

      // 키만 읽는 커서로 개수를 세고, 넘친 만큼 오래된 것부터 지운다 (blob은 읽지 않는다).
      const prune = db.transaction(STORE, 'readwrite')
      const store = prune.objectStore(STORE)
      const total = await wrap(store.count())
      let excess = total - MAX_PHOTOS
      if (excess > 0) {
        await new Promise<void>((resolve, reject) => {
          const cursorReq = store.index(CREATED_INDEX).openKeyCursor()
          cursorReq.onsuccess = () => {
            const cursor = cursorReq.result
            if (!cursor || excess <= 0) {
              resolve()
              return
            }
            store.delete(cursor.primaryKey)
            excess -= 1
            cursor.continue()
          }
          cursorReq.onerror = () => reject(cursorReq.error)
        })
      }
      await done(prune)
    } finally {
      db.close()
    }
  } catch {
    // 용량 부족, 개인정보 보호 모드: 무시하고 진행한다 (새로고침 시 목록 전용 모드).
  }
}

export async function loadPhoto(scanId: string): Promise<StoredPhoto | null> {
  const cached = memory.get(scanId)
  if (cached) return cached
  try {
    const db = await openDb()
    try {
      const value = await wrap(db.transaction(STORE, 'readonly').objectStore(STORE).get(scanId))
      return (value as StoredPhoto | undefined) ?? null
    } finally {
      db.close()
    }
  } catch {
    return null
  }
}

export function memoryPhotoCountForTest(): number {
  return memory.size
}

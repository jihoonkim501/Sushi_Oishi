import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { loadPhoto, MAX_PHOTOS, memoryPhotoCountForTest, savePhoto } from './photoStore'

const photo = (n: number) => ({ blob: new Blob([String(n)], { type: 'image/jpeg' }), width: 640, height: 480 })

describe('photoStore (C-8)', () => {
  it('scanId로 저장한 사진을 다시 찾는다', async () => {
    await savePhoto('scan-a', photo(1))
    const stored = await loadPhoto('scan-a')
    expect(stored).toMatchObject({ width: 640, height: 480 })
  })

  it('없는 scanId는 null (목록 전용 모드)', async () => {
    expect(await loadPhoto('nope')).toBeNull()
  })

  it('20건을 넘으면 오래된 것부터 지운다 (IndexedDB 기준)', async () => {
    for (let i = 0; i < MAX_PHOTOS + 3; i++) {
      await savePhoto(`bulk-${i}`, photo(i))
    }
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('sushioishi')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    const count = await new Promise<number>((resolve, reject) => {
      const req = db.transaction('photos', 'readonly').objectStore('photos').count()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    db.close()
    expect(count).toBe(MAX_PHOTOS)
  })

  it('가장 오래된 항목부터 지운다 (인덱스 기준)', async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('sushioishi')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      const req = db.transaction('photos', 'readonly').objectStore('photos').getAllKeys()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    db.close()
    expect(keys).not.toContain('bulk-0')
    expect(keys).toContain(`bulk-${MAX_PHOTOS + 2}`)
  })

  it('메모리 사본도 MAX_PHOTOS를 넘지 않는다', async () => {
    for (let i = 0; i < MAX_PHOTOS + 5; i++) await savePhoto(`mem-${i}`, photo(i))
    expect(memoryPhotoCountForTest()).toBe(MAX_PHOTOS)
  })
})

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (rel: string) => JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf-8')) as unknown

describe('공유 순서 케이스 동기화', () => {
  it('fe 사본이 be/src/test/resources/order-cases.json과 같다', () => {
    const fe = read('./fixtures/order-cases.json')
    const be = read('../../../be/src/test/resources/order-cases.json')
    expect(
      fe,
      'fe/src/test/fixtures/order-cases.json이 백엔드 원본과 달라요. be/src/test/resources/order-cases.json을 다시 복사하세요.',
    ).toEqual(be)
  })
})

import type { PreparedImage } from './types'

export const MAX_LONG_SIDE = 1280
export const MIN_SIDE = 200
export const MAX_BYTES = 5 * 1024 * 1024

export type PrepareErrorKind = 'decodeFailed' | 'tooSmall' | 'tooLarge'

export class PrepareImageError extends Error {
  readonly kind: PrepareErrorKind

  constructor(kind: PrepareErrorKind) {
    super(kind)
    this.name = 'PrepareImageError'
    this.kind = kind
  }
}

/** BR-IMG-02: 긴 변이 1280px을 넘을 때만 축소하고 확대하지 않는다. */
export function computeTargetSize(width: number, height: number): { width: number; height: number } {
  const longSide = Math.max(width, height)
  const scale = longSide > MAX_LONG_SIDE ? MAX_LONG_SIDE / longSide : 1
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

interface Decoded {
  source: CanvasImageSource
  width: number
  height: number
  release: () => void
}

async function decode(file: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() }
    } catch {
      // 옵션 미지원 등: <img> 경로로 다시 시도한다.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    }
  } catch {
    URL.revokeObjectURL(url)
    throw new PrepareImageError('decodeFailed')
  }
}

async function encode(
  source: CanvasImageSource,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  if (typeof OffscreenCanvas === 'function') {
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new PrepareImageError('decodeFailed')
    ctx.drawImage(source, 0, 0, width, height)
    return canvas.convertToBlob({ type: 'image/jpeg', quality })
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new PrepareImageError('decodeFailed')
  ctx.drawImage(source, 0, 0, width, height)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new PrepareImageError('decodeFailed'))),
      'image/jpeg',
      quality,
    )
  })
}

/** F1-4: EXIF 방향 적용 → 긴 변 1280px 이하로 축소 → JPEG 0.8 (5MB 초과 시 0.6). */
export async function prepareImage(file: Blob): Promise<PreparedImage> {
  const decoded = await decode(file)
  try {
    if (decoded.width < MIN_SIDE || decoded.height < MIN_SIDE) {
      throw new PrepareImageError('tooSmall')
    }
    const size = computeTargetSize(decoded.width, decoded.height)
    let blob: Blob
    try {
      blob = await encode(decoded.source, size.width, size.height, 0.8)
      if (blob.size > MAX_BYTES) {
        blob = await encode(decoded.source, size.width, size.height, 0.6)
      }
    } catch (e) {
      if (e instanceof PrepareImageError) throw e
      throw new PrepareImageError('decodeFailed')
    }
    if (blob.size > MAX_BYTES) throw new PrepareImageError('tooLarge')
    return {
      blob,
      objectUrl: URL.createObjectURL(blob),
      width: size.width,
      height: size.height,
    }
  } finally {
    decoded.release()
  }
}

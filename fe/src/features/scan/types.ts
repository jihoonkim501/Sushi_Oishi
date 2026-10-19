export type Group =
  | 'WHITE'
  | 'SHELL'
  | 'SQUID'
  | 'SHRIMP'
  | 'RED'
  | 'BLUE'
  | 'FATTY'
  | 'GUNKAN'
  | 'SAUCE'
  | 'FINISH'
  | 'UNKNOWN'

export interface Box {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface ScanItem {
  itemId: number
  order: number
  classId: string
  nameKo: string
  group: Group
  confidence: number
  box: Box
  eaten: boolean
  corrected: boolean
}

export interface ScanResponse {
  scanId: string
  imageWidth: number
  imageHeight: number
  modelVersion: string
  createdAt: string
  items: ScanItem[]
}

export interface SushiType {
  classId: string
  nameKo: string
  nameJa: string
  group: Group
  orderScore: number
  description: string | null
}

export type ErrorCode =
  | 'INVALID_DEVICE_ID'
  | 'VALIDATION_ERROR'
  | 'INVALID_IMAGE'
  | 'INVALID_CLASS_ID'
  | 'SCAN_NOT_FOUND'
  | 'ITEM_NOT_FOUND'
  | 'IMAGE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'NO_SUSHI_DETECTED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'MODEL_UNAVAILABLE'
  | 'SERVER_BUSY'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'

export interface ErrorResponse {
  code: ErrorCode
  message: string
}

export interface HealthResponse {
  status: 'UP' | 'DOWN'
  modelVersion: string
  db?: string
  model?: string
}

export interface PatchItemBody {
  classId?: string
  eaten?: boolean
}

/** 클라이언트에서 축소·JPEG 변환을 마친 업로드용 사진 (FUNCTIONAL_SPEC F1-4) */
export interface PreparedImage {
  blob: Blob
  objectUrl: string
  width: number
  height: number
}

export type SheetState = 'COLLAPSED' | 'HALF' | 'FULL'

export interface ZoomState {
  scale: number
  x: number
  y: number
}

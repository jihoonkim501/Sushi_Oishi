import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../components/Toast'
import { ApiError, createScan } from '../features/scan/api'
import { savePhoto } from '../features/scan/photoStore'
import { useScanStore } from '../store/useScanStore'
import { makeItem, makeScan } from '../test/fixtures'
import LoadingPage from './LoadingPage'
import ReviewPage from './ReviewPage'

vi.mock('../features/scan/api', async () => {
  const actual = await vi.importActual<typeof import('../features/scan/api')>('../features/scan/api')
  return { ...actual, createScan: vi.fn() }
})

vi.mock('../features/scan/photoStore', () => ({ savePhoto: vi.fn(), loadPhoto: vi.fn() }))

const createScanMock = vi.mocked(createScan)
const savePhotoMock = vi.mocked(savePhoto)

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function renderFlow(initial: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/', initial]} initialIndex={1}>
          <Where />
          <Routes>
            <Route path="/" element={<p>home</p>} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/loading" element={<LoadingPage />} />
            <Route path="/result/:scanId" element={<p>result</p>} />
            <Route path="/not-found" element={<p>not-found</p>} />
            <Route path="/error" element={<p>error-screen</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const where = () => screen.getByTestId('where').textContent

function setPending() {
  useScanStore.getState().setPendingImage({
    blob: new Blob(['x'], { type: 'image/jpeg' }),
    objectUrl: 'blob:pending',
    width: 640,
    height: 480,
  })
}

describe('분석 흐름 (F1-3, F2-6, C-3, C-4)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() }))
    useScanStore.setState({ pendingImage: null, analyzeBlockedUntil: 0 })
  })
  afterEach(() => {
    createScanMock.mockReset()
    savePhotoMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('S-02 대기 사진이 없으면 홈으로 보낸다', () => {
    renderFlow('/review')
    expect(where()).toBe('/')
  })

  it('S-03 대기 사진이 없으면 홈으로 보낸다', () => {
    renderFlow('/loading')
    expect(where()).toBe('/')
  })

  it('C-3 동의가 미결정이면 다이얼로그를 먼저 보여주고, 허용 안 함도 분석을 이어간다 (E2E-08)', async () => {
    setPending()
    createScanMock.mockReturnValue(new Promise(() => {}))
    renderFlow('/review')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '분석하기' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '허용 안 함' }))
    expect(localStorage.getItem('sushioishi.consent')).toBe('denied')
    expect(where()).toBe('/loading')
    await waitFor(() => expect(createScanMock).toHaveBeenCalled())
    expect(createScanMock.mock.calls[0][1]).toBe(false)
  })

  it('C-3 동의 이후에는 다이얼로그 없이 분석하고 consent=true를 보낸다', async () => {
    localStorage.setItem('sushioishi.consent', 'granted')
    setPending()
    createScanMock.mockReturnValue(new Promise(() => {}))
    renderFlow('/review')
    await userEvent.setup().click(screen.getByRole('button', { name: '분석하기' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(createScanMock).toHaveBeenCalled())
    expect(createScanMock.mock.calls[0][1]).toBe(true)
  })

  it('C-3 바깥 탭으로 닫으면 denied로 저장하고 계속한다', async () => {
    setPending()
    createScanMock.mockReturnValue(new Promise(() => {}))
    renderFlow('/review')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '분석하기' }))
    await user.click(screen.getByTestId('consent-backdrop'))
    expect(localStorage.getItem('sushioishi.consent')).toBe('denied')
    expect(where()).toBe('/loading')
  })

  it('C-4 오프라인이면 요청하지 않고 토스트를 띄운다', async () => {
    localStorage.setItem('sushioishi.consent', 'granted')
    setPending()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    renderFlow('/review')
    await userEvent.setup().click(screen.getByRole('button', { name: '분석하기' }))
    expect(screen.getByText('인터넷에 연결되어 있지 않아요')).toBeInTheDocument()
    expect(where()).toBe('/review')
    expect(createScanMock).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  it('다시 찍기는 대기 사진을 비우고 홈으로 간다 (E2E-01)', async () => {
    setPending()
    renderFlow('/review')
    await userEvent.setup().click(screen.getByRole('button', { name: '다시 찍기' }))
    expect(where()).toBe('/')
    expect(useScanStore.getState().pendingImage).toBeNull()
    expect(createScanMock).not.toHaveBeenCalled()
  })

  it('200 응답이면 결과 화면으로 replace 이동한다', async () => {
    setPending()
    createScanMock.mockResolvedValue(makeScan([makeItem({ itemId: 1, classId: 'hirame', order: 1 })], 'new-scan'))
    renderFlow('/loading')
    await waitFor(() => expect(where()).toBe('/result/new-scan'))
    expect(useScanStore.getState().pendingImage).toBeNull()
  })

  it('422 NO_SUSHI_DETECTED는 인식 실패 화면으로 간다 (사진은 유지)', async () => {
    setPending()
    createScanMock.mockRejectedValue(new ApiError(422, 'NO_SUSHI_DETECTED', ''))
    renderFlow('/loading')
    await waitFor(() => expect(where()).toBe('/not-found'))
    expect(useScanStore.getState().pendingImage).not.toBeNull()
  })

  it('네트워크 오류는 S-02로 돌아가 토스트와 다시 시도 버튼을 보여준다', async () => {
    setPending()
    createScanMock.mockRejectedValue(new TypeError('Failed to fetch'))
    renderFlow('/loading')
    await waitFor(() => expect(where()).toBe('/review'))
    expect(screen.getByText('연결이 불안정해요. 다시 시도해주세요')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: '다시 시도' }))
    expect(where()).toBe('/loading')
  })

  it('429는 S-02 유지 + 토스트 + Retry-After 동안 분석하기 비활성', async () => {
    setPending()
    createScanMock.mockRejectedValue(new ApiError(429, 'RATE_LIMITED', '', 30))
    renderFlow('/loading')
    await waitFor(() => expect(where()).toBe('/review'))
    // 오류 토스트 + 버튼 아래 caption
    expect(screen.getAllByText('잠시 후 다시 시도해주세요')).toHaveLength(2)
    expect(screen.getByRole('alert')).toHaveTextContent('잠시 후 다시 시도해주세요')
    expect(screen.getByRole('button', { name: '분석하기' })).toBeDisabled()
  })

  it('413은 홈으로 이동하며 사진 용량 토스트를 띄운다', async () => {
    setPending()
    createScanMock.mockRejectedValue(new ApiError(413, 'IMAGE_TOO_LARGE', ''))
    renderFlow('/loading')
    await waitFor(() => expect(where()).toBe('/'))
    expect(screen.getByText('사진이 너무 커요')).toBeInTheDocument()
  })

  it('415와 400 INVALID_IMAGE는 홈으로 이동하며 읽기 실패 토스트를 띄운다', async () => {
    setPending()
    createScanMock.mockRejectedValue(new ApiError(415, 'UNSUPPORTED_FORMAT', ''))
    renderFlow('/loading')
    await waitFor(() => expect(where()).toBe('/'))
    expect(screen.getByText('사진을 읽을 수 없어요. 다른 사진으로 해주세요')).toBeInTheDocument()
  })

  it('500·503은 오류 화면으로 간다', async () => {
    setPending()
    createScanMock.mockRejectedValue(new ApiError(503, 'MODEL_UNAVAILABLE', ''))
    renderFlow('/loading')
    await waitFor(() => expect(where()).toBe('/error'))
  })

  it('화면을 떠나면 요청을 취소하고 오류 토스트를 띄우지 않는다', async () => {
    setPending()
    let signal: AbortSignal | undefined
    createScanMock.mockImplementation((_blob, _consent, s) => {
      signal = s
      return new Promise((_, reject) => s?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))
    })
    const { unmount } = renderFlow('/loading')
    await waitFor(() => expect(createScanMock).toHaveBeenCalledTimes(1))
    expect(signal?.aborted).toBe(false)
    unmount() // 화면 이탈(뒤로 가기)
    expect(signal?.aborted).toBe(true)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('IndexedDB 저장이 끝나지 않아도 결과 화면으로 이동한다', async () => {
    setPending()
    savePhotoMock.mockReturnValue(new Promise(() => {}))
    createScanMock.mockResolvedValue(makeScan([makeItem({ itemId: 1, classId: 'hirame', order: 1 })], 'slow-db'))
    renderFlow('/loading')
    await waitFor(() => expect(where()).toBe('/result/slow-db'))
    expect(savePhotoMock).toHaveBeenCalledWith('slow-db', expect.objectContaining({ width: 640 }))
  })

  it('화면을 떠난 뒤 응답이 늦게 와도 결과 화면으로 끌고 가지 않는다', async () => {
    setPending()
    let resolve: (v: ReturnType<typeof makeScan>) => void = () => {}
    createScanMock.mockImplementation(() => new Promise((r) => (resolve = r)))
    const { unmount } = renderFlow('/loading')
    await waitFor(() => expect(createScanMock).toHaveBeenCalled())
    unmount()
    resolve(makeScan([makeItem({ itemId: 1, classId: 'hirame', order: 1 })], 'late'))
    await new Promise((r) => setTimeout(r, 20))
    expect(savePhotoMock).not.toHaveBeenCalled()
    expect(useScanStore.getState().pendingImage).not.toBeNull()
  })
})

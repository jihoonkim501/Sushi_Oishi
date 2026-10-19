import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../components/Toast'
import { patchItem } from '../features/scan/api'
import { scanKey, SUSHI_TYPES_KEY } from '../features/scan/hooks'
import { recomputeOrder } from '../features/scan/orderEngine'
import { savePhoto } from '../features/scan/photoStore'
import { useScanStore } from '../store/useScanStore'
import { TYPES, makeItem, makeScan } from '../test/fixtures'
import ResultPage from './ResultPage'

vi.mock('../features/scan/api', async () => {
  const actual = await vi.importActual<typeof import('../features/scan/api')>('../features/scan/api')
  return { ...actual, patchItem: vi.fn(), getScan: vi.fn(), getSushiTypes: vi.fn() }
})

const patchItemMock = vi.mocked(patchItem)

function baseScan() {
  const items = recomputeOrder(
    [
      makeItem({ itemId: 1, classId: 'hirame', box: { x1: 100, y1: 100, x2: 300, y2: 260 } }),
      makeItem({ itemId: 2, classId: 'salmon', box: { x1: 400, y1: 100, x2: 600, y2: 260 } }),
      makeItem({ itemId: 3, classId: 'tamago', box: { x1: 700, y1: 100, x2: 900, y2: 260 } }),
    ],
    TYPES,
  )
  return makeScan(items)
}

function renderResult(scan = baseScan()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(scanKey(scan.scanId), scan)
  queryClient.setQueryData(SUSHI_TYPES_KEY, TYPES)
  const view = render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/home', `/result/${scan.scanId}`]} initialIndex={1}>
          <Routes>
            <Route path="/home" element={<p>home</p>} />
            <Route path="/result/:scanId" element={<ResultPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
  return { queryClient, scan, unmount: view.unmount }
}

const rowNames = () =>
  within(screen.getByRole('list')).getAllByRole('listitem').map((li) => li.textContent ?? '')

describe('ResultPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useScanStore.getState().resetResultView()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:photo'), revokeObjectURL: vi.fn() }))
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 400 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 600 })
  })
  afterEach(() => {
    patchItemMock.mockReset()
    vi.unstubAllGlobals()
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth')
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight')
  })

  it('FR-RES-005 순서 리스트와 진행 표시를 보여준다', async () => {
    renderResult()
    expect(await screen.findByText('0 / 3')).toBeInTheDocument()
    const names = rowNames()
    expect(names[0]).toContain('광어')
    expect(names[1]).toContain('연어')
    expect(names[2]).toContain('계란')
    expect(names[0]).toContain('다음 차례')
  })

  it('F4-1 사진이 있으면 박스마다 접근성 레이블을 붙인다', async () => {
    await savePhoto('with-photo', { blob: new Blob(['x'], { type: 'image/jpeg' }), width: 1280, height: 960 })
    renderResult(makeScan(baseScan().items, 'with-photo'))
    expect(await screen.findByLabelText('1번 광어, 흰살, 신뢰도 높음')).toBeInTheDocument()
    expect(screen.getByLabelText('2번 연어, 기름진, 신뢰도 높음')).toBeInTheDocument()
  })

  it('BR-RES-10 로컬 사진이 없으면 목록 전용 모드 문구를 보여준다', async () => {
    renderResult(makeScan(baseScan().items, 'no-photo'))
    expect(await screen.findByText('사진은 찍은 기기에만 저장돼요. 순서는 아래에서 볼 수 있어요')).toBeInTheDocument()
    expect(screen.queryByTestId('box-1')).toBeNull()
  })

  it('FR-RES-007 / BR-EAT-03 체크는 즉시 반영하고 300ms 디바운스 뒤 한 번만 PATCH한다', async () => {
    const { scan } = renderResult()
    patchItemMock.mockImplementation(async (_id, itemId, body) =>
      makeScan(scan.items.map((it) => (it.itemId === itemId ? { ...it, eaten: !!body.eaten } : it))),
    )
    const user = userEvent.setup()
    const check = await screen.findByRole('button', { name: '1번 광어 먹음 표시' })
    await user.click(check)
    expect(check).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(patchItemMock).not.toHaveBeenCalled()
    await waitFor(() => expect(patchItemMock).toHaveBeenCalledTimes(1))
    expect(patchItemMock).toHaveBeenCalledWith(scan.scanId, 1, { eaten: true })
    // F5-4 다음 차례가 2번으로 넘어간다
    const second = within(screen.getByRole('list')).getAllByRole('listitem')[1]
    expect(second).toHaveAttribute('aria-current', 'step')
  })

  it('디바운스 중 화면을 떠나면 대기 중인 먹음 변경을 버리지 않고 전송한다', async () => {
    const { scan, unmount } = renderResult()
    patchItemMock.mockImplementation(async () => scan)
    await userEvent.setup().click(await screen.findByRole('button', { name: '1번 광어 먹음 표시' }))
    expect(patchItemMock).not.toHaveBeenCalled()
    unmount()
    expect(patchItemMock).toHaveBeenCalledTimes(1)
    expect(patchItemMock).toHaveBeenCalledWith(scan.scanId, 1, { eaten: true })
  })

  it('F5-3 체크 저장이 실패하면 원래 값으로 되돌리고 토스트를 띄운다', async () => {
    renderResult()
    patchItemMock.mockRejectedValue(new Error('fail'))
    const user = userEvent.setup()
    const check = await screen.findByRole('button', { name: '1번 광어 먹음 표시' })
    await user.click(check)
    await waitFor(() => expect(screen.getByText('저장하지 못했어요. 다시 시도해주세요')).toBeInTheDocument())
    expect(check).toHaveAttribute('aria-pressed', 'false')
  })

  it('모든 항목을 먹으면 완료 배너가 뜬다 (FR-RES-010)', async () => {
    const { scan } = renderResult(makeScan(baseScan().items.slice(0, 1)))
    patchItemMock.mockImplementation(async () => makeScan(scan.items.map((it) => ({ ...it, eaten: true }))))
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: '1번 광어 먹음 표시' }))
    expect(await screen.findByText('맛있게 드셨나요? 모두 드셨어요')).toBeInTheDocument()
  })

  async function openPickerFor(name: string) {
    const row = (await screen.findAllByRole('button', { name: new RegExp(`^${name}`) }))[0]
    fireEvent.pointerDown(row, { clientX: 0, clientY: 0 })
    return screen.findByRole('dialog', {}, { timeout: 2000 })
  }

  it('F6-3 길게 눌러 종류를 고르면 낙관적으로 순서가 바뀌고 서버 응답으로 동기화한다', async () => {
    const { scan } = renderResult()
    patchItemMock.mockImplementation(async (_id, itemId) => {
      const reordered = recomputeOrder(
        scan.items.map((it) =>
          it.itemId === itemId
            ? { ...it, classId: 'toro', nameKo: '참치 뱃살', group: 'FATTY' as const, corrected: true }
            : it,
        ),
        TYPES,
      )
      return makeScan(reordered)
    })
    const user = userEvent.setup()
    const dialog = await openPickerFor('광어')
    expect(within(dialog).getByText('지금: 광어')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /참치 뱃살/ }))

    await waitFor(() => expect(rowNames()[0]).toContain('연어'))
    expect(rowNames()[1]).toContain('참치 뱃살')
    expect(screen.getByText('순서를 다시 계산했어요')).toBeInTheDocument()
    expect(patchItemMock).toHaveBeenCalledWith(scan.scanId, 1, { classId: 'toro' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('F6-3 수정 저장이 실패하면 스냅샷으로 복원한다 (E2E-06b)', async () => {
    renderResult()
    patchItemMock.mockRejectedValue(new Error('offline'))
    const user = userEvent.setup()
    const dialog = await openPickerFor('광어')
    await user.click(within(dialog).getByRole('button', { name: /참치 뱃살/ }))
    await waitFor(() =>
      expect(screen.getByText('수정하지 못했어요. 원래대로 돌려놓았어요')).toBeInTheDocument(),
    )
    expect(rowNames()[0]).toContain('광어')
  })

  it('BR-COR-01 같은 종류를 고르면 요청 없이 시트만 닫는다', async () => {
    renderResult()
    const user = userEvent.setup()
    const dialog = await openPickerFor('광어')
    await user.click(within(dialog).getByRole('button', { name: /광어/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(patchItemMock).not.toHaveBeenCalled()
  })

  it('공유 버튼은 v1에서 보이지 않는다', async () => {
    renderResult()
    await screen.findByText('0 / 3')
    expect(screen.queryByText('공유')).toBeNull()
    expect(screen.queryByRole('button', { name: /공유/ })).toBeNull()
  })
})

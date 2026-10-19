import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TYPES, makeItem } from '../test/fixtures'
import { ConsentDialog } from './ConsentDialog'
import { DetectionBox } from './DetectionBox'
import { SegmentedControl } from './SegmentedControl'
import { SettingsSheet } from './SettingsSheet'
import { SushiPicker } from './SushiPicker'
import { ToastProvider } from './Toast'
import { useToast } from './toastContext'
import { Toggle } from './Toggle'

vi.mock('../features/scan/api', async () => {
  const actual = await vi.importActual<typeof import('../features/scan/api')>('../features/scan/api')
  return { ...actual, getHealth: vi.fn().mockResolvedValue({ status: 'UP', modelVersion: 'v1' }) }
})

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})
afterEach(() => vi.useRealTimers())

describe('SettingsSheet (S-06, C-3)', () => {
  function renderSheet() {
    const client = new QueryClient()
    render(
      <QueryClientProvider client={client}>
        <SettingsSheet open onClose={() => {}} />
      </QueryClientProvider>,
    )
  }

  it('화면 모드를 바꾸면 data-theme과 localStorage에 반영한다', async () => {
    renderSheet()
    const user = userEvent.setup()
    await user.click(screen.getByRole('radio', { name: '다크' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('sushioishi.theme')).toBe('dark')
    await user.click(screen.getByRole('radio', { name: '시스템' }))
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('사진 저장 허용 토글은 즉시 동의 상태를 바꾼다', async () => {
    renderSheet()
    const toggle = screen.getByRole('switch', { name: '사진 저장 허용' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    await userEvent.setup().click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(localStorage.getItem('sushioishi.consent')).toBe('granted')
    await userEvent.setup().click(toggle)
    expect(localStorage.getItem('sushioishi.consent')).toBe('denied')
  })

  it('데이터 출처가 비어 있으면 섹션을 숨기고 버전을 보여준다', async () => {
    renderSheet()
    expect(screen.queryByText('데이터 출처')).toBeNull()
    expect(await screen.findByText(/모델 v1/)).toBeInTheDocument()
  })

  it('Esc와 닫기 버튼으로 닫는다', async () => {
    const onClose = vi.fn()
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SettingsSheet open onClose={onClose} />
      </QueryClientProvider>,
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    await userEvent.setup().click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

describe('SegmentedControl', () => {
  it('방향키로 선택을 옮긴다', async () => {
    function Harness() {
      const [value, setValue] = useState('a')
      return (
        <SegmentedControl
          ariaLabel="테스트"
          value={value}
          onChange={setValue}
          options={[
            { value: 'a', label: '가' },
            { value: 'b', label: '나' },
            { value: 'c', label: '다' },
          ]}
        />
      )
    }
    render(<Harness />)
    const user = userEvent.setup()
    screen.getByRole('radio', { name: '가' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: '나' })).toHaveAttribute('aria-checked', 'true')
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('radio', { name: '다' })).toHaveAttribute('aria-checked', 'true')
  })
})

describe('Toggle', () => {
  it('켜진 상태를 aria-checked로 전달한다', async () => {
    const onChange = vi.fn()
    render(<Toggle label="옵션" checked={false} onChange={onChange} />)
    await userEvent.setup().click(screen.getByRole('switch', { name: '옵션' }))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

describe('ConsentDialog (S-08)', () => {
  it('허용 → 허용 안 함 순서이고 Esc는 dismiss(denied 처리)', () => {
    const onDismiss = vi.fn()
    render(<ConsentDialog open onAgree={() => {}} onDecline={() => {}} onDismiss={onDismiss} />)
    const buttons = within(screen.getByRole('dialog')).getAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual(['허용', '허용 안 함'])
    // 초점은 제목 컨테이너에 있다 (어느 선택지도 미리 선택되지 않음)
    expect(screen.getByRole('dialog')).toHaveFocus()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onDismiss).toHaveBeenCalled()
  })

  it('open=false면 렌더하지 않는다', () => {
    render(<ConsentDialog open={false} onAgree={() => {}} onDecline={() => {}} onDismiss={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('SushiPicker (S-07)', () => {
  it('unknown을 제외한 종류를 점수 순으로 그리고 현재 값을 표시한다', () => {
    render(
      <SushiPicker open types={TYPES} currentClassId="tai" currentNameKo="도미" onPick={() => {}} onClose={() => {}} />,
    )
    const cells = screen.getAllByRole('button', { pressed: undefined }).filter((b) => b.hasAttribute('aria-pressed'))
    expect(cells[0]).toHaveTextContent('광어')
    expect(cells.some((c) => c.textContent?.includes('미확인'))).toBe(false)
    expect(screen.getByRole('button', { name: /도미/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('"잘 모르겠어요"는 unknown으로 선택한다', async () => {
    const onPick = vi.fn()
    render(<SushiPicker open types={TYPES} currentClassId="tai" currentNameKo="도미" onPick={onPick} onClose={() => {}} />)
    await userEvent.setup().click(screen.getByRole('button', { name: '잘 모르겠어요' }))
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ classId: 'unknown' }))
  })

  it('종류 목록이 없으면 스피너를 보여준다', () => {
    render(<SushiPicker open types={undefined} currentClassId="tai" currentNameKo="도미" onPick={() => {}} onClose={() => {}} />)
    expect(screen.getByRole('status', { name: '초밥 종류를 불러오는 중' })).toBeInTheDocument()
  })
})

describe('DetectionBox (BR-RES-02~04)', () => {
  const rect = { left: 100, top: 100, width: 120, height: 80 }
  const bounds = { width: 400, height: 600 }
  const base = makeItem({ itemId: 1, classId: 'hirame', order: 1, confidence: 0.9 })

  it('너비 56px 미만이면 이름 라벨을 숨긴다', () => {
    const { rerender } = render(
      <DetectionBox item={base} rect={rect} bounds={bounds} selected={false} onClick={() => {}} onLongPress={() => {}} />,
    )
    expect(screen.getByText('광어')).toBeInTheDocument()
    rerender(
      <DetectionBox item={base} rect={{ ...rect, width: 40 }} bounds={bounds} selected={false} onClick={() => {}} onLongPress={() => {}} />,
    )
    expect(screen.queryByText('광어')).toBeNull()
  })

  it('저신뢰이면 이름 뒤에 ?를 붙이고, 수정했거나 먹었으면 붙이지 않는다', () => {
    const low = { ...base, confidence: 0.5 }
    const { rerender } = render(
      <DetectionBox item={low} rect={rect} bounds={bounds} selected={false} onClick={() => {}} onLongPress={() => {}} />,
    )
    expect(screen.getByText('광어?')).toBeInTheDocument()
    rerender(
      <DetectionBox item={{ ...low, corrected: true }} rect={rect} bounds={bounds} selected={false} onClick={() => {}} onLongPress={() => {}} />,
    )
    expect(screen.getByText('광어')).toBeInTheDocument()
  })

  it('z-index는 order가 작을수록 높다 (BR-RES-06)', () => {
    render(
      <DetectionBox item={{ ...base, order: 3 }} rect={rect} bounds={bounds} selected={false} onClick={() => {}} onLongPress={() => {}} />,
    )
    expect(screen.getByTestId('box-1')).toHaveStyle({ zIndex: '997' })
  })

  it('500ms 길게 누르면 onLongPress, 짧게 누르면 onClick (BR-COR-02)', () => {
    vi.useFakeTimers()
    const onClick = vi.fn()
    const onLongPress = vi.fn()
    render(<DetectionBox item={base} rect={rect} bounds={bounds} selected={false} onClick={onClick} onLongPress={onLongPress} />)
    const box = screen.getByTestId('box-1')
    fireEvent.pointerDown(box, { clientX: 0, clientY: 0 })
    act(() => vi.advanceTimersByTime(499))
    expect(onLongPress).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(2))
    expect(onLongPress).toHaveBeenCalledWith(1)
    fireEvent.pointerUp(box)
    fireEvent.click(box)
    expect(onClick).not.toHaveBeenCalled() // 길게 누른 뒤 click은 무시

    fireEvent.pointerDown(box, { clientX: 0, clientY: 0 })
    fireEvent.pointerUp(box)
    fireEvent.click(box)
    expect(onClick).toHaveBeenCalledWith(1)
  })
})

describe('Toast', () => {
  function Trigger({ error = false, withAction = false }: { error?: boolean; withAction?: boolean }) {
    const { show, showError } = useToast()
    return (
      <button
        onClick={() => {
          const options = withAction ? { action: { label: '다시 시도', onAction: () => show('재시도') } } : undefined
          if (error) showError('실패했어요', options)
          else show('안녕하세요', options)
        }}
      >
        go
      </button>
    )
  }

  it('2.5초 뒤 사라지고 오류 토스트는 role="alert"다', () => {
    vi.useFakeTimers()
    render(
      <ToastProvider>
        <Trigger error />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('go'))
    expect(screen.getByRole('alert')).toHaveTextContent('실패했어요')
    act(() => vi.advanceTimersByTime(2400))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(200))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('액션이 있으면 5초 유지하고 한 번에 하나만 표시한다', () => {
    vi.useFakeTimers()
    render(
      <ToastProvider>
        <Trigger withAction />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('go'))
    fireEvent.click(screen.getByText('go'))
    expect(screen.getAllByText('안녕하세요')).toHaveLength(1)
    act(() => vi.advanceTimersByTime(4900))
    expect(screen.getByText('안녕하세요')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(screen.queryByText('안녕하세요')).toBeNull()
  })
})

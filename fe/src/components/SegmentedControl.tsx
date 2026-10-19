import { useRef, type KeyboardEvent } from 'react'
import styles from './SegmentedControl.module.css'

interface SegmentedControlProps<V extends string> {
  options: { value: V; label: string }[]
  value: V
  onChange: (value: V) => void
  ariaLabel: string
}

/** DESIGN.md 5.12: role="radiogroup", 방향키로 이동. */
export function SegmentedControl<V extends string>({ options, value, onChange, ariaLabel }: SegmentedControlProps<V>) {
  const refs = useRef(new Map<V, HTMLButtonElement>())

  const move = (e: KeyboardEvent, delta: number) => {
    e.preventDefault()
    const index = options.findIndex((o) => o.value === value)
    const next = options[(index + delta + options.length) % options.length]
    onChange(next.value)
    refs.current.get(next.value)?.focus()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move(e, 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move(e, -1)
  }

  return (
    <div className={styles.group} role="radiogroup" aria-label={ariaLabel} onKeyDown={onKeyDown}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            ref={(el) => {
              if (el) refs.current.set(option.value, el)
              else refs.current.delete(option.value)
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={`${styles.segment} ${selected ? styles.selected : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

import { readStorage, STORAGE_KEYS, writeStorage } from './safeStorage'

export type ThemeSetting = 'system' | 'light' | 'dark'

export function getTheme(): ThemeSetting {
  const value = readStorage(STORAGE_KEYS.theme)
  return value === 'light' || value === 'dark' ? value : 'system'
}

/** `<html data-theme>`에 적용한다. system이면 속성을 제거해 prefers-color-scheme을 따른다. */
export function applyTheme(theme: ThemeSetting): void {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

export function setTheme(theme: ThemeSetting): void {
  writeStorage(STORAGE_KEYS.theme, theme)
  applyTheme(theme)
}

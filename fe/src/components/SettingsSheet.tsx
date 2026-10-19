import { useQuery } from '@tanstack/react-query'
import { ExternalLink, X } from 'lucide-react'
import { useState } from 'react'
import { CREDITS } from '../constants/credits'
import { t } from '../constants/messages'
import { getHealth } from '../features/scan/api'
import { getConsent, setConsent } from '../lib/consent'
import { getTheme, setTheme, type ThemeSetting } from '../lib/theme'
import { BottomSheet } from './BottomSheet'
import { IconButton } from './IconButton'
import { SegmentedControl } from './SegmentedControl'
import styles from './SettingsSheet.module.css'
import { Toggle } from './Toggle'

interface SettingsSheetProps {
  open: boolean
  onClose: () => void
}

const THEME_OPTIONS: { value: ThemeSetting; label: string }[] = [
  { value: 'system', label: t('settings.themeSystem') },
  { value: 'light', label: t('settings.themeLight') },
  { value: 'dark', label: t('settings.themeDark') },
]

/** S-06 설정 시트 (DESIGN.md 5.11, FUNCTIONAL_SPEC C-3). */
export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const [theme, setThemeState] = useState<ThemeSetting>(getTheme)
  const [consent, setConsentState] = useState(() => getConsent() === 'granted')
  const health = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => getHealth(signal),
    enabled: open,
    staleTime: 60_000,
    retry: false,
  })

  return (
    <BottomSheet
      open={open}
      title={t('settings.title')}
      onClose={onClose}
      headerAction={<IconButton icon={<X size={24} aria-hidden="true" />} label={t('common.close')} onClick={onClose} />}
    >
      <ul className={styles.list}>
        <li className={styles.row}>
          <span className={styles.label}>{t('settings.theme')}</span>
          <SegmentedControl
            ariaLabel={t('settings.theme')}
            options={THEME_OPTIONS}
            value={theme}
            onChange={(value) => {
              setThemeState(value)
              setTheme(value)
            }}
          />
        </li>

        <li className={`${styles.row} ${styles.inline}`}>
          <div className={styles.text}>
            <span className={styles.label}>{t('settings.consent')}</span>
            <span className={styles.caption}>{t('settings.consentHint')}</span>
          </div>
          <Toggle
            label={t('settings.consent')}
            checked={consent}
            onChange={(next) => {
              setConsentState(next)
              setConsent(next ? 'granted' : 'denied')
            }}
          />
        </li>

        {CREDITS.length > 0 && (
          <li className={styles.row}>
            <span className={styles.label}>{t('settings.credits')}</span>
            <ul className={styles.credits}>
              {CREDITS.map((credit) => {
                const body = (
                  <>
                    <span className={styles.creditText}>
                      <span>{credit.name}</span>
                      <span className={styles.caption}>
                        {credit.author} · {credit.license}
                      </span>
                    </span>
                    {credit.url && <ExternalLink size={16} aria-hidden="true" />}
                  </>
                )
                return (
                  <li key={credit.name}>
                    {credit.url ? (
                      <a
                        className={styles.credit}
                        href={credit.url}
                        target="_blank"
                        rel="noopener"
                        aria-label={`${credit.name} 열기, 새 탭`}
                      >
                        {body}
                      </a>
                    ) : (
                      <div className={styles.credit}>{body}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </li>
        )}

        <li className={styles.row}>
          <span className={styles.label}>{t('settings.version')}</span>
          <span className={styles.caption}>
            앱 {__APP_VERSION__} · 모델 {health.data?.modelVersion ?? '-'}
          </span>
        </li>
      </ul>
    </BottomSheet>
  )
}

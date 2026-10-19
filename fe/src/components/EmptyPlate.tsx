/** 인식 실패 화면용 빈 접시 일러스트. 플랫, 선 없음, `--color-wood` · `--color-bg` 2색 (DESIGN.md 10장). */
export function EmptyPlate() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="빈 접시">
      <circle cx="60" cy="60" r="56" fill="var(--color-wood)" />
      <circle cx="60" cy="60" r="40" fill="var(--color-bg)" />
      <circle cx="60" cy="60" r="30" fill="var(--color-surface-muted)" />
    </svg>
  )
}

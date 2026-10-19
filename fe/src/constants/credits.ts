export interface Credit {
  name: string
  author: string
  license: string
  url?: string
}

/**
 * 데이터 출처 (FUNCTIONAL_SPEC C-7). 모델 학습에 실제로 사용한 데이터셋만 넣고
 * `ml/exports/MODEL_CARD.md`와 일치시킨다. 학습이 끝나기 전에는 비어 있고, 비면 설정 시트가 섹션을 숨긴다.
 */
export const CREDITS: readonly Credit[] = []

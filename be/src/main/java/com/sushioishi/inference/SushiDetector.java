package com.sushioishi.inference;

import java.util.List;

/** 객체 탐지기. 구현체는 스레드 안전해야 하며 동시 실행 수는 {@link InferenceGate}가 제한한다. */
public interface SushiDetector {

    /** 모델이 로드되어 추론 가능한지 (GET /health의 model 값). */
    boolean isReady();

    /** @throws com.sushioishi.common.ApiException MODEL_UNAVAILABLE 모델을 쓸 수 없을 때 */
    List<RawDetection> detect(Letterbox input);
}

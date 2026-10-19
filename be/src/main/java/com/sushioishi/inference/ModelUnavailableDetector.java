package com.sushioishi.inference;

import com.sushioishi.common.ApiException;
import com.sushioishi.common.ErrorCode;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * ONNX 모델이 아직 없는 동안의 기본 탐지기 ({@code sushioishi.inference.detector} 미설정 시).
 * 모든 추론을 503 MODEL_UNAVAILABLE로 거절한다. 실제 ONNX 탐지기를 추가할 때 다른 detector 값으로 분기한다.
 */
@Component
@ConditionalOnProperty(name = "sushioishi.inference.detector", havingValue = "unavailable", matchIfMissing = true)
public class ModelUnavailableDetector implements SushiDetector {

    @Override
    public boolean isReady() {
        return false;
    }

    @Override
    public List<RawDetection> detect(Letterbox input) {
        throw new ApiException(ErrorCode.MODEL_UNAVAILABLE);
    }
}

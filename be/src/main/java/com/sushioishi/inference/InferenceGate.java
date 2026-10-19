package com.sushioishi.inference;

import com.sushioishi.common.ApiException;
import com.sushioishi.common.ErrorCode;
import java.util.List;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import org.springframework.stereotype.Component;

/** 추론 동시 실행 수를 세마포어로 제한한다. 대기 시간을 넘기면 503 SERVER_BUSY (PROJECT_SPEC 7.4, F2-2 3단계). */
@Component
public class InferenceGate {

    private final SushiDetector detector;
    private final Semaphore permits;
    private final InferenceProperties props;

    public InferenceGate(SushiDetector detector, InferenceProperties props) {
        this.detector = detector;
        this.props = props;
        this.permits = new Semaphore(props.maxConcurrency(), true);
    }

    public boolean isReady() {
        return detector.isReady();
    }

    public List<RawDetection> detect(Letterbox input) {
        return run(d -> d.detect(input));
    }

    /**
     * 디코딩·리사이즈·letterbox·추론처럼 메모리와 CPU를 많이 쓰는 작업을 permit 안에서 실행한다.
     * 동시에 처리되는 이미지 수가 max-concurrency를 넘지 않는다.
     */
    public <T> T run(Function<SushiDetector, T> work) {
        if (!detector.isReady()) {
            throw new ApiException(ErrorCode.MODEL_UNAVAILABLE);
        }
        boolean acquired;
        try {
            acquired = permits.tryAcquire(props.queueTimeout().toNanos(), TimeUnit.NANOSECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(ErrorCode.SERVER_BUSY);
        }
        if (!acquired) {
            throw new ApiException(ErrorCode.SERVER_BUSY);
        }
        try {
            return work.apply(detector);
        } finally {
            permits.release();
        }
    }
}

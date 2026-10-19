package com.sushioishi.inference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sushioishi.common.ApiException;
import com.sushioishi.common.ErrorCode;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

/** NFR-PERF-008 / SERVER_BUSY: 추론 동시 실행 제한 (PROJECT_SPEC 7.4). */
class InferenceGateTest {

    private static final Letterbox INPUT = new Letterbox(new float[0], 640, 640, 1, 0, 0);

    private static InferenceProperties props(int concurrency, Duration timeout) {
        return new InferenceProperties(concurrency, 0.40, timeout, null);
    }

    @Test
    void never_exceeds_max_concurrency() throws Exception {
        AtomicInteger running = new AtomicInteger();
        AtomicInteger peak = new AtomicInteger();
        SushiDetector slow = new SushiDetector() {
            public boolean isReady() {
                return true;
            }

            public List<RawDetection> detect(Letterbox input) {
                int now = running.incrementAndGet();
                peak.accumulateAndGet(now, Math::max);
                try {
                    Thread.sleep(50);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                running.decrementAndGet();
                return List.of();
            }
        };
        InferenceGate gate = new InferenceGate(slow, props(2, Duration.ofSeconds(10)));
        try (ExecutorService pool = Executors.newFixedThreadPool(8)) {
            List<Future<?>> fs = new java.util.ArrayList<>();
            for (int i = 0; i < 8; i++) {
                fs.add(pool.submit(() -> gate.detect(INPUT)));
            }
            for (Future<?> f : fs) {
                f.get(5, TimeUnit.SECONDS);
            }
        }
        assertThat(peak.get()).isEqualTo(2);
    }

    @Test
    void run_executes_arbitrary_work_inside_the_permit() throws Exception {
        // 디코딩·리사이즈 같은 전처리도 permit 안에서 실행되어 동시 처리 수가 제한된다.
        AtomicInteger running = new AtomicInteger();
        AtomicInteger peak = new AtomicInteger();
        SushiDetector ready = new SushiDetector() {
            public boolean isReady() {
                return true;
            }

            public List<RawDetection> detect(Letterbox input) {
                return List.of();
            }
        };
        InferenceGate gate = new InferenceGate(ready, props(2, Duration.ofSeconds(10)));
        try (ExecutorService pool = Executors.newFixedThreadPool(8)) {
            List<Future<?>> fs = new java.util.ArrayList<>();
            for (int i = 0; i < 8; i++) {
                fs.add(pool.submit(() -> gate.run(d -> {
                    peak.accumulateAndGet(running.incrementAndGet(), Math::max);
                    try {
                        Thread.sleep(50);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                    running.decrementAndGet();
                    return null;
                })));
            }
            for (Future<?> f : fs) {
                f.get(5, TimeUnit.SECONDS);
            }
        }
        assertThat(peak.get()).isEqualTo(2);
    }

    @Test
    void run_on_not_ready_detector_skips_work_and_returns_model_unavailable() {
        InferenceGate gate = new InferenceGate(new ModelUnavailableDetector(), props(1, Duration.ofMillis(100)));
        AtomicInteger called = new AtomicInteger();
        assertThatThrownBy(() -> gate.run(d -> called.incrementAndGet()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.MODEL_UNAVAILABLE));
        assertThat(called.get()).isZero();
    }

    @Test
    void waiting_longer_than_timeout_returns_server_busy() throws Exception {
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        SushiDetector blocking = new SushiDetector() {
            public boolean isReady() {
                return true;
            }

            public List<RawDetection> detect(Letterbox input) {
                entered.countDown();
                try {
                    release.await(5, TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return List.of();
            }
        };
        InferenceGate gate = new InferenceGate(blocking, props(1, Duration.ofMillis(100)));
        try (ExecutorService pool = Executors.newSingleThreadExecutor()) {
            Future<?> first = pool.submit(() -> gate.detect(INPUT));
            assertThat(entered.await(2, TimeUnit.SECONDS)).isTrue();
            assertThatThrownBy(() -> gate.detect(INPUT))
                    .isInstanceOfSatisfying(ApiException.class,
                            e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.SERVER_BUSY));
            release.countDown();
            first.get(2, TimeUnit.SECONDS);
        }
    }

    @Test
    void permit_is_released_when_detector_throws() {
        SushiDetector failing = new SushiDetector() {
            public boolean isReady() {
                return true;
            }

            public List<RawDetection> detect(Letterbox input) {
                throw new IllegalStateException("boom");
            }
        };
        InferenceGate gate = new InferenceGate(failing, props(1, Duration.ofMillis(100)));
        for (int i = 0; i < 3; i++) {
            assertThatThrownBy(() -> gate.detect(INPUT)).isInstanceOf(IllegalStateException.class);
        }
    }

    @Test
    void not_ready_detector_returns_model_unavailable() {
        InferenceGate gate = new InferenceGate(new ModelUnavailableDetector(), props(1, Duration.ofMillis(100)));
        assertThat(gate.isReady()).isFalse();
        assertThatThrownBy(() -> gate.detect(INPUT))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.MODEL_UNAVAILABLE));
    }
}

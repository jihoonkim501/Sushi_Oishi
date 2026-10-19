package com.sushioishi.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** FR-OPS-004 (C-6). */
class RateLimiterTest {

    static final class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-10-19T00:00:00Z");

        void advance(Duration d) {
            now = now.plus(d);
        }

        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    private static DeviceId device() {
        return new DeviceId(UUID.randomUUID());
    }

    @Test
    void FR_OPS_004_allows_10_then_rejects_11th_with_retry_after() {
        MutableClock clock = new MutableClock();
        RateLimiter limiter = new RateLimiter(clock);
        DeviceId d = device();
        for (int i = 0; i < 10; i++) {
            limiter.check(d, "1.1.1." + i); // IP 를 바꿔 기기 한도만 검증
        }
        assertThatThrownBy(() -> limiter.check(d, "9.9.9.9"))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.errorCode()).isEqualTo(ErrorCode.RATE_LIMITED);
                    assertThat(e.retryAfterSeconds()).isBetween(1L, 6L); // 10/min -> 6초에 1개
                });
    }

    @Test
    void FR_OPS_004_refills_one_token_every_six_seconds() {
        MutableClock clock = new MutableClock();
        RateLimiter limiter = new RateLimiter(clock);
        DeviceId d = device();
        for (int i = 0; i < 10; i++) {
            limiter.check(d, "ip" + i);
        }
        clock.advance(Duration.ofSeconds(6));
        assertThatCode(() -> limiter.check(d, "ipX")).doesNotThrowAnyException();
        assertThatThrownBy(() -> limiter.check(d, "ipY")).isInstanceOf(ApiException.class);
    }

    @Test
    void FR_OPS_004_devices_are_limited_independently() {
        RateLimiter limiter = new RateLimiter(new MutableClock());
        DeviceId a = device();
        for (int i = 0; i < 10; i++) {
            limiter.check(a, "ip" + i);
        }
        assertThatCode(() -> limiter.check(device(), "ipZ")).doesNotThrowAnyException();
    }

    @Test
    void FR_OPS_004_same_ip_is_limited_to_30_per_minute_across_devices() {
        RateLimiter limiter = new RateLimiter(new MutableClock());
        for (int i = 0; i < 30; i++) {
            limiter.check(device(), "7.7.7.7");
        }
        assertThatThrownBy(() -> limiter.check(device(), "7.7.7.7"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.RATE_LIMITED));
    }
}

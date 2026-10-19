package com.sushioishi.common;

import java.time.Clock;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * FUNCTIONAL_SPEC C-6: 인메모리 토큰 버킷. 기기당 용량 10 / 분당 10개 충전, IP당 용량 30 / 분당 30개 충전.
 * 외부 의존성(Bucket4j) 없이 구현했다.
 */
@Component
public class RateLimiter {

    static final int DEVICE_PER_MINUTE = 10;
    static final int IP_PER_MINUTE = 30;
    private static final long IDLE_EVICT_NANOS = 10L * 60 * 1_000_000_000L;

    private final Map<String, Bucket> deviceBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> ipBuckets = new ConcurrentHashMap<>();
    private final Clock clock;
    private long lastEvict;

    @Autowired
    public RateLimiter() {
        this(Clock.systemUTC());
    }

    RateLimiter(Clock clock) {
        this.clock = clock;
        this.lastEvict = nowNanos();
    }

    /** 토큰을 하나 소비한다. 한도를 넘으면 Retry-After 초가 담긴 RATE_LIMITED 예외를 던진다. */
    public void check(DeviceId deviceId, String ip) {
        long now = nowNanos();
        evictIdle(now);
        long deviceWait = deviceBuckets
                .computeIfAbsent(deviceId.toString(), k -> new Bucket(DEVICE_PER_MINUTE, now))
                .tryConsume(now);
        if (deviceWait > 0) {
            throw new ApiException(ErrorCode.RATE_LIMITED, deviceWait);
        }
        long ipWait = ipBuckets
                .computeIfAbsent(ip == null ? "unknown" : ip, k -> new Bucket(IP_PER_MINUTE, now))
                .tryConsume(now);
        if (ipWait > 0) {
            throw new ApiException(ErrorCode.RATE_LIMITED, ipWait);
        }
    }

    private long nowNanos() {
        return clock.millis() * 1_000_000L;
    }

    private synchronized void evictIdle(long now) {
        if (now - lastEvict < IDLE_EVICT_NANOS) {
            return;
        }
        lastEvict = now;
        deviceBuckets.values().removeIf(b -> b.idleSince(now) > IDLE_EVICT_NANOS);
        ipBuckets.values().removeIf(b -> b.idleSince(now) > IDLE_EVICT_NANOS);
    }

    private static final class Bucket {
        private final int capacity;
        private double tokens;
        private long last;

        Bucket(int capacity, long now) {
            this.capacity = capacity;
            this.tokens = capacity;
            this.last = now;
        }

        /** 소비에 성공하면 0, 실패하면 다음 토큰까지 남은 초(올림, 최소 1)를 반환한다. */
        synchronized long tryConsume(long now) {
            double perNano = capacity / 60_000_000_000.0;
            tokens = Math.min(capacity, tokens + (now - last) * perNano);
            last = now;
            if (tokens >= 1) {
                tokens -= 1;
                return 0;
            }
            double nanosNeeded = (1 - tokens) / perNano;
            return Math.max(1, (long) Math.ceil(nanosNeeded / 1_000_000_000.0));
        }

        synchronized long idleSince(long now) {
            return now - last;
        }
    }
}

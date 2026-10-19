package com.sushioishi.order;

import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/** FUNCTIONAL_SPEC F3-1: sushi_types 전체를 메모리에 보관하고 10분마다 갱신한다 (FR-ORD-007). */
@Component
public class SushiTypeCache {

    private static final Duration TTL = Duration.ofMinutes(10);

    private final SushiTypeRepository repository;
    private volatile Snapshot snapshot;

    public SushiTypeCache(SushiTypeRepository repository) {
        this.repository = repository;
    }

    /** 정렬된 전체 종류 (orderScore ASC, classId ASC). */
    public List<SushiType> all() {
        return current().sorted();
    }

    /** 등록되지 않은 classId는 unknown으로 대체한다 (BR-ORD-01). */
    public SushiType resolve(String classId) {
        Map<String, SushiType> byId = current().byId();
        SushiType type = byId.get(classId);
        return type != null ? type : byId.get(SushiType.UNKNOWN);
    }

    public boolean exists(String classId) {
        return current().byId().containsKey(classId);
    }

    public int scoreOf(String classId) {
        return resolve(classId).getOrderScore();
    }

    private Snapshot current() {
        Snapshot s = snapshot;
        if (s == null || s.isExpired()) {
            s = load();
            snapshot = s;
        }
        return s;
    }

    private Snapshot load() {
        List<SushiType> types = repository.findAll();
        Map<String, SushiType> byId = types.stream()
                .collect(Collectors.toUnmodifiableMap(SushiType::getClassId, Function.identity()));
        List<SushiType> sorted = types.stream()
                .sorted(Comparator.comparingInt(SushiType::getOrderScore).thenComparing(SushiType::getClassId))
                .toList();
        return new Snapshot(byId, sorted, System.nanoTime());
    }

    private record Snapshot(Map<String, SushiType> byId, List<SushiType> sorted, long loadedAt) {
        boolean isExpired() {
            return System.nanoTime() - loadedAt > TTL.toNanos();
        }
    }
}

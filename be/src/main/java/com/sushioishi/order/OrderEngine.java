package com.sushioishi.order;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;

/**
 * 먹는 순서 산정 (PROJECT_SPEC 4.2, FUNCTIONAL_SPEC F3-1/F3-2, BR-ORD-01~07).
 * 클라이언트 {@code orderEngine.ts}와 같은 결과를 내야 하며 order-cases.json을 공유한다.
 */
public final class OrderEngine {

    /** 행 판정 임계값: 기준(anchor) 높이의 절반 (BR-ORD-04). */
    private static final double ROW_THRESHOLD = 0.5;

    private OrderEngine() {
    }

    /** 정렬에 필요한 값. 점수는 호출자가 점수표로 미리 매핑해 넘긴다 (BR-ORD-01). */
    public record OrderKey(int score, double confidence, int x1, int y1, int x2, int y2) {
        double cx() {
            return (x1 + x2) / 2.0;
        }

        double cy() {
            return (y1 + y2) / 2.0;
        }

        double height() {
            return y2 - y1;
        }
    }

    /**
     * 항목을 먹는 순서대로 정렬해 반환한다. 반환 리스트의 i번째 항목의 order는 i+1 (BR-ORD-06).
     * 행 판정을 비교 함수에 넣지 않고 그룹핑 후 정렬한다 (BR-ORD-07).
     */
    public static <T> List<T> sort(List<T> items, Function<T, OrderKey> keyOf) {
        Map<Integer, List<T>> byScore = new TreeMap<>();
        for (T item : items) {
            byScore.computeIfAbsent(keyOf.apply(item).score(), s -> new ArrayList<>()).add(item);
        }
        Comparator<OrderKey> rowSort = Comparator.comparingDouble(OrderKey::cy)
                .thenComparingDouble(OrderKey::cx)
                .thenComparing(Comparator.comparingDouble(OrderKey::confidence).reversed());
        Comparator<OrderKey> inRow = Comparator.comparingDouble(OrderKey::cx)
                .thenComparing(Comparator.comparingDouble(OrderKey::confidence).reversed())
                .thenComparingInt(OrderKey::x1)
                .thenComparingInt(OrderKey::y1);

        List<T> result = new ArrayList<>(items.size());
        for (List<T> group : byScore.values()) {
            List<T> sorted = new ArrayList<>(group);
            sorted.sort(Comparator.comparing(keyOf, rowSort));

            List<List<T>> rows = new ArrayList<>();
            OrderKey anchor = null;
            for (T item : sorted) {
                OrderKey key = keyOf.apply(item);
                if (anchor == null || key.cy() - anchor.cy() > ROW_THRESHOLD * anchor.height()) {
                    rows.add(new ArrayList<>());
                    anchor = key;
                }
                rows.get(rows.size() - 1).add(item);
            }
            for (List<T> row : rows) {
                row.sort(Comparator.comparing(keyOf, inRow));
                result.addAll(row);
            }
        }
        return result;
    }
}

package com.sushioishi.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Stream;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestFactory;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** FR-ORD-001~005, BR-ORD-01~07. 클라이언트 orderEngine.test.ts와 order-cases.json을 공유한다. */
class OrderEngineTest {

    /** FUNCTIONAL_SPEC 9의 점수표. 표에 없는 classId는 unknown(50) (BR-ORD-01). */
    private static final Map<String, Integer> SCORES = Map.of(
            "hirame", 10, "tai", 12, "maguro_akami", 30, "salmon", 50, "unknown", 50,
            "toro", 55, "ikura", 60, "unagi", 70, "tamago", 80);

    record Box(int x1, int y1, int x2, int y2) {
    }

    record Item(String id, String classId, double confidence, Box box) {
        OrderEngine.OrderKey key() {
            return new OrderEngine.OrderKey(scoreOf(classId), confidence, box.x1(), box.y1(), box.x2(), box.y2());
        }
    }

    record Case(String id, List<Item> items, List<String> expected, Map<String, String> expectedClassIds) {
    }

    static int scoreOf(String classId) {
        return SCORES.getOrDefault(classId, SCORES.get("unknown"));
    }

    static List<String> ids(List<Item> sorted) {
        return sorted.stream().map(Item::id).toList();
    }

    @TestFactory
    Stream<DynamicTest> sharedCases() throws Exception {
        List<Case> cases;
        try (InputStream in = getClass().getResourceAsStream("/order-cases.json")) {
            cases = JsonMapper.builder().build().readValue(in, new TypeReference<List<Case>>() {
            });
        }
        assertThat(cases).hasSize(9);
        return cases.stream().map(c -> DynamicTest.dynamicTest(
                c.id() + " FR-ORD-001~005 shared case",
                () -> assertThat(ids(OrderEngine.sort(c.items(), Item::key))).isEqualTo(c.expected())));
    }

    @Test
    void BR_ORD_01_unregistered_class_is_scored_as_unknown() {
        assertThat(scoreOf("engawa")).isEqualTo(50);
    }

    @Test
    void BR_ORD_04_empty_input_returns_empty() {
        assertThat(OrderEngine.sort(List.<Item>of(), Item::key)).isEmpty();
    }

    @Test
    void BR_ORD_05_full_tie_breaks_by_x1_then_y1() {
        // cx, confidence, 같은 행까지 같고 x1만 다른 경우: 폭이 다른 박스로 cx를 맞춘다.
        Item wide = new Item("wide", "hirame", 0.9, new Box(80, 70, 120, 130)); // cx=100, x1=80
        Item narrow = new Item("narrow", "hirame", 0.9, new Box(90, 70, 110, 130)); // cx=100, x1=90
        assertThat(ids(OrderEngine.sort(List.of(narrow, wide), Item::key))).containsExactly("wide", "narrow");
    }

    @Test
    void BR_ORD_07_dense_random_input_never_violates_comparator_contract() {
        Random random = new Random(42);
        List<String> classes = List.of("hirame", "tai", "salmon", "toro");
        for (int round = 0; round < 200; round++) {
            List<Item> items = new ArrayList<>();
            for (int i = 0; i < 300; i++) {
                int cx = random.nextInt(600);
                int cy = random.nextInt(60) + 100; // 행 경계가 모호하도록 좁은 y 범위
                items.add(new Item("i" + i, classes.get(random.nextInt(classes.size())),
                        random.nextInt(10) / 10.0, new Box(cx - 40, cy - 30, cx + 40, cy + 30)));
            }
            assertThatCode(() -> OrderEngine.sort(items, Item::key)).doesNotThrowAnyException();
            assertThat(OrderEngine.sort(items, Item::key)).hasSize(items.size());
        }
    }

    @Test
    void BR_ORD_06_result_is_deterministic_regardless_of_input_order() {
        Random random = new Random(7);
        List<Item> items = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            int cx = 50 + random.nextInt(8) * 90;
            int cy = 100 + random.nextInt(3) * 120 + random.nextInt(10);
            items.add(new Item("i" + i, "salmon", 0.5 + i / 100.0, new Box(cx - 40, cy - 30, cx + 40, cy + 30)));
        }
        List<String> expected = ids(OrderEngine.sort(items, Item::key));
        for (int n = 0; n < 20; n++) {
            List<Item> shuffled = new ArrayList<>(items);
            java.util.Collections.shuffle(shuffled, random);
            assertThat(ids(OrderEngine.sort(shuffled, Item::key))).isEqualTo(expected);
        }
    }
}

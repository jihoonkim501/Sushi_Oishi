package com.sushioishi.inference;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

/** FR-DET-002~006, BR-DET-01~06 (FUNCTIONAL_SPEC 9 후처리 케이스). */
class PostProcessorTest {

    private static final List<String> LABELS = List.of("hirame", "tai", "engawa");
    private static final Set<String> KNOWN = Set.of("hirame", "tai");

    private final PostProcessor processor =
            new PostProcessor(new InferenceProperties(2, 0.40, Duration.ofSeconds(10), null));

    /** 기준 이미지 W x H 를 640 letterbox 로 만들었을 때의 변환 정보 (텐서는 불필요). */
    private static Letterbox letterbox(int w, int h) {
        double r = Math.min(640.0 / w, 640.0 / h);
        double padX = (640 - Math.round(w * r)) / 2.0;
        double padY = (640 - Math.round(h * r)) / 2.0;
        return new Letterbox(null, w, h, r, padX, padY);
    }

    /** 640 공간의 (x1,y1,x2,y2) 박스를 RawDetection 으로. */
    private static RawDetection raw(double x1, double y1, double x2, double y2, int cls, double conf) {
        return new RawDetection((x1 + x2) / 2, (y1 + y2) / 2, x2 - x1, y2 - y1, cls, conf);
    }

    private List<DetectedPiece> run(Letterbox lb, RawDetection... dets) {
        return processor.process(List.of(dets), lb, LABELS, KNOWN::contains);
    }

    @Test
    void TC_PP_01_BR_DET_01_drops_confidence_below_040() {
        // 1280x1280 -> r=0.5, pad 0. 겹치지 않는 두 박스.
        List<DetectedPiece> out = run(letterbox(1280, 1280),
                raw(10, 10, 110, 110, 0, 0.39), raw(300, 300, 400, 400, 0, 0.40));
        assertThat(out).hasSize(1);
        assertThat(out.get(0).confidence()).isEqualTo(0.40);
    }

    @Test
    void TC_PP_02_BR_DET_04_class_agnostic_nms_keeps_higher_confidence() {
        // 같은 위치에 가까운 박스 둘 (IoU 약 0.7)
        List<DetectedPiece> out = run(letterbox(640, 640),
                raw(100, 100, 200, 200, 0, 0.8), raw(115, 100, 215, 200, 1, 0.6));
        assertThat(out).hasSize(1);
        assertThat(out.get(0).classId()).isEqualTo("hirame");
    }

    @Test
    void TC_PP_03_BR_DET_04_iou_049_keeps_both() {
        // 너비 100, 겹침 w: IoU = w / (200 - w). w=65 -> 65/135 = 0.4815 (<0.5)
        List<DetectedPiece> out = run(letterbox(640, 640),
                raw(100, 100, 200, 200, 0, 0.8), raw(135, 100, 235, 200, 1, 0.6));
        assertThat(out).hasSize(2);
    }

    @Test
    void BR_DET_04_iou_exactly_050_is_suppressed() {
        // 너비 100, 겹침 w: IoU = w / (200 - w) = 0.5 -> w = 66.67. 정수로 맞추려고 높이 방향 사용:
        // 두 박스 100x100, 세로 겹침 h: IoU = h*100 / (20000 - h*100) = 0.5 -> h = 66.67 (정수 불가).
        // 대신 100x60 과 100x30 (포함 관계): IoU = 30*100 / 60*100 = 0.5
        List<DetectedPiece> out = run(letterbox(640, 640),
                raw(100, 100, 200, 160, 0, 0.8), raw(100, 100, 200, 130, 1, 0.6));
        assertThat(out).hasSize(1);
    }

    @Test
    void TC_PP_04_BR_DET_05_keeps_top_40_by_confidence() {
        RawDetection[] dets = new RawDetection[45];
        for (int i = 0; i < 45; i++) {
            // 8열 격자, 서로 겹치지 않는 50x50 박스. confidence 0.50 ~ 0.94
            double x = (i % 8) * 70;
            double y = (i / 8) * 70;
            dets[i] = raw(x, y, x + 50, y + 50, 0, 0.50 + i * 0.01);
        }
        List<DetectedPiece> out = run(letterbox(640, 640), dets);
        assertThat(out).hasSize(40);
        assertThat(out).allSatisfy(p -> assertThat(p.confidence()).isGreaterThanOrEqualTo(0.55 - 1e-9));
    }

    @Test
    void TC_PP_05_BR_DET_02_restores_coordinates_to_reference_image() {
        // 1280x960: r=0.5, padX=0, padY=80
        List<DetectedPiece> out = run(letterbox(1280, 960), raw(100, 130, 180, 190, 0, 0.9));
        assertThat(out).hasSize(1);
        DetectedPiece p = out.get(0);
        assertThat(List.of(p.x1(), p.y1(), p.x2(), p.y2())).containsExactly(200, 100, 360, 220);
    }

    @Test
    void TC_PP_06_BR_DET_03_clamps_box_to_image_bounds() {
        // 1280x1280, r=0.5, pad 0. 640 공간 x1=-20 -> 기준 -40 -> 0
        List<DetectedPiece> out = run(letterbox(1280, 1280), raw(-20, 10, 50, 70, 0, 0.9));
        assertThat(out).hasSize(1);
        assertThat(out.get(0).x1()).isZero();
        assertThat(out.get(0).x2()).isEqualTo(100);
    }

    @Test
    void TC_PP_07_BR_DET_03_drops_box_narrower_than_8px_after_clamp() {
        // W=640 (r=1): x1=-20 .. x2=5 -> 자른 뒤 너비 5
        List<DetectedPiece> out = run(letterbox(640, 640), raw(-20, 100, 5, 160, 0, 0.9));
        assertThat(out).isEmpty();
    }

    @Test
    void TC_PP_08_BR_DET_06_unregistered_or_out_of_range_class_becomes_unknown() {
        List<DetectedPiece> out = run(letterbox(640, 640),
                raw(10, 10, 110, 110, 2, 0.9),     // labels 에는 있으나 sushi_types 에 없음
                raw(300, 300, 400, 400, 9, 0.8));  // labels 범위 밖
        assertThat(out).extracting(DetectedPiece::classId).containsExactly("unknown", "unknown");
    }

    @Test
    void BR_DET_04_result_is_sorted_by_confidence_descending() {
        List<DetectedPiece> out = run(letterbox(640, 640),
                raw(10, 10, 110, 110, 0, 0.5), raw(300, 300, 400, 400, 1, 0.9), raw(500, 10, 600, 110, 0, 0.7));
        assertThat(new ArrayList<>(out.stream().map(DetectedPiece::confidence).toList()))
                .containsExactly(0.9, 0.7, 0.5);
    }
}

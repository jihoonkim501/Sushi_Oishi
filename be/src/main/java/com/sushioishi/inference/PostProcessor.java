package com.sushioishi.inference;

import com.sushioishi.order.SushiType;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.function.Predicate;
import org.springframework.stereotype.Component;

/** FUNCTIONAL_SPEC F2-3 후처리 (BR-DET-01~06). */
@Component
public class PostProcessor {

    static final double NMS_IOU = 0.50;
    static final int MIN_BOX_SIDE = 8;
    static final int MAX_ITEMS = 40;

    private final double minConfidence;

    public PostProcessor(InferenceProperties props) {
        this.minConfidence = props.minConfidence();
    }

    /**
     * @param labels      classIndex -> class_id (labels.json)
     * @param isKnownType class_id가 sushi_types에 있는지. 없으면 unknown (BR-DET-06)
     */
    public List<DetectedPiece> process(List<RawDetection> raw, Letterbox lb, List<String> labels,
                                       Predicate<String> isKnownType) {
        int width = lb.sourceWidth();
        int height = lb.sourceHeight();

        List<DetectedPiece> candidates = new ArrayList<>();
        for (RawDetection d : raw) {
            if (d.confidence() < minConfidence) { // BR-DET-01
                continue;
            }
            // BR-DET-02: 640 공간 -> 기준 이미지
            double x1 = (d.cx() - d.w() / 2 - lb.padX()) / lb.r();
            double y1 = (d.cy() - d.h() / 2 - lb.padY()) / lb.r();
            double x2 = (d.cx() + d.w() / 2 - lb.padX()) / lb.r();
            double y2 = (d.cy() + d.h() / 2 - lb.padY()) / lb.r();
            // BR-DET-03: 경계 자르기 + 반올림, 너무 작으면 제거
            int ix1 = clamp(Math.round(x1), width);
            int iy1 = clamp(Math.round(y1), height);
            int ix2 = clamp(Math.round(x2), width);
            int iy2 = clamp(Math.round(y2), height);
            if (ix2 - ix1 < MIN_BOX_SIDE || iy2 - iy1 < MIN_BOX_SIDE) {
                continue;
            }
            candidates.add(new DetectedPiece(classIdOf(d.classIndex(), labels, isKnownType), d.confidence(),
                    ix1, iy1, ix2, iy2));
        }
        List<DetectedPiece> kept = nms(candidates);
        return kept.size() > MAX_ITEMS ? new ArrayList<>(kept.subList(0, MAX_ITEMS)) : kept; // BR-DET-05
    }

    /** BR-DET-04: 클래스 무관 NMS. confidence 내림차순으로 순회하며 IoU >= 0.50이면 제거. 결과는 confidence 내림차순. */
    static List<DetectedPiece> nms(List<DetectedPiece> pieces) {
        List<DetectedPiece> sorted = new ArrayList<>(pieces);
        sorted.sort(Comparator.comparingDouble(DetectedPiece::confidence).reversed());
        List<DetectedPiece> kept = new ArrayList<>();
        for (DetectedPiece p : sorted) {
            boolean suppressed = false;
            for (DetectedPiece k : kept) {
                if (iou(p, k) >= NMS_IOU) {
                    suppressed = true;
                    break;
                }
            }
            if (!suppressed) {
                kept.add(p);
            }
        }
        return kept;
    }

    static double iou(DetectedPiece a, DetectedPiece b) {
        long ix1 = Math.max(a.x1(), b.x1());
        long iy1 = Math.max(a.y1(), b.y1());
        long ix2 = Math.min(a.x2(), b.x2());
        long iy2 = Math.min(a.y2(), b.y2());
        long inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
        long areaA = (long) (a.x2() - a.x1()) * (a.y2() - a.y1());
        long areaB = (long) (b.x2() - b.x1()) * (b.y2() - b.y1());
        long union = areaA + areaB - inter;
        return union <= 0 ? 0 : (double) inter / union;
    }

    private static String classIdOf(int index, List<String> labels, Predicate<String> isKnownType) {
        if (index < 0 || index >= labels.size()) {
            return SushiType.UNKNOWN;
        }
        String id = labels.get(index);
        return isKnownType.test(id) ? id : SushiType.UNKNOWN;
    }

    private static int clamp(long v, int max) {
        return (int) Math.max(0, Math.min(max, v));
    }
}

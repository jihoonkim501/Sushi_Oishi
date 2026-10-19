package com.sushioishi.inference;

import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 개발용 가짜 탐지기. {@code sushioishi.inference.detector=stub}일 때만 켜진다.
 * 이미지 내용과 무관하게 접시 중앙 영역에 2x2 격자로 4피스를 돌려준다. 프론트 개발과 수동 확인용이며 운영에서는 쓰지 않는다.
 */
@Component
@ConditionalOnProperty(name = "sushioishi.inference.detector", havingValue = "stub")
public class StubSushiDetector implements SushiDetector {

    private static final int[] CLASS_INDEXES = {0, 6, 9, 14}; // labels 기본 순서: hirame, maguro_akami, salmon, tamago

    @Override
    public boolean isReady() {
        return true;
    }

    @Override
    public List<RawDetection> detect(Letterbox input) {
        double cw = input.contentWidth();
        double ch = input.contentHeight();
        double w = cw / 4;
        double h = ch / 4;
        double[][] centers = {{0.3, 0.3}, {0.7, 0.3}, {0.3, 0.7}, {0.7, 0.7}};
        List<RawDetection> out = new java.util.ArrayList<>();
        for (int i = 0; i < centers.length; i++) {
            out.add(new RawDetection(
                    input.padX() + cw * centers[i][0],
                    input.padY() + ch * centers[i][1],
                    w, h, CLASS_INDEXES[i], 0.9 - i * 0.05));
        }
        return out;
    }
}

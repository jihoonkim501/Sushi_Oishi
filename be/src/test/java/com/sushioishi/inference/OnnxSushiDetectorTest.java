package com.sushioishi.inference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sushioishi.common.ApiException;
import com.sushioishi.common.ErrorCode;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

/** FR-DET-001, NFR-MNT-006 (FUNCTIONAL_SPEC F2-2). 실제 모델 파일 없이 출력 파싱과 모델 부재 동작을 검증한다. */
class OnnxSushiDetectorTest {

    private static final int C = 3;

    @Test
    void FR_DET_001_parses_channel_first_output_and_takes_max_class_score() {
        // [1, 4+3, 2]: 채널 우선. 앵커 0 = (100,200,50,60) 클래스 점수 .1/.8/.3, 앵커 1 = (300,310,20,30) .6/.2/.1
        float[] data = {
                100, 300, // cx
                200, 310, // cy
                50, 20,   // w
                60, 30,   // h
                .1f, .6f, // class 0
                .8f, .2f, // class 1
                .3f, .1f, // class 2
        };

        List<RawDetection> out = OnnxSushiDetector.parse(data, new long[]{1, 4 + C, 2}, C);

        assertThat(out).hasSize(2);
        assertThat(out.get(0)).isEqualTo(new RawDetection(100, 200, 50, 60, 1, 0.8f));
        assertThat(out.get(1).classIndex()).isEqualTo(0);
        assertThat(out.get(1).confidence()).isEqualTo(0.6f);
    }

    @Test
    void FR_DET_001_parses_anchor_first_output() {
        // [1, 2, 4+3]: 앵커 우선
        float[] data = {
                100, 200, 50, 60, .1f, .8f, .3f,
                300, 310, 20, 30, .6f, .2f, .1f,
        };

        List<RawDetection> out = OnnxSushiDetector.parse(data, new long[]{1, 2, 4 + C}, C);

        assertThat(out).hasSize(2);
        assertThat(out.get(0)).isEqualTo(new RawDetection(100, 200, 50, 60, 1, 0.8f));
        assertThat(out.get(1).classIndex()).isEqualTo(0);
    }

    @Test
    void FR_DET_001_rejects_output_whose_channels_do_not_match_class_count() {
        assertThatThrownBy(() -> OnnxSushiDetector.parse(new float[7 * 5], new long[]{1, 7, 5}, 5))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> OnnxSushiDetector.parse(new float[7], new long[]{7}, C))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void NFR_MNT_006_missing_model_file_starts_not_ready_and_rejects_inference() {
        OnnxSushiDetector detector = new OnnxSushiDetector(new DefaultResourceLoader(), new LabelProvider(),
                "classpath:model/does-not-exist.onnx");

        assertThat(detector.isReady()).isFalse();
        assertThatThrownBy(() -> detector.detect(new Letterbox(new float[3 * 640 * 640], 640, 640, 1, 0, 0)))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.MODEL_UNAVAILABLE));
    }
}

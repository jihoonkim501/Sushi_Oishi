package com.sushioishi.inference;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import com.sushioishi.common.ApiException;
import com.sushioishi.common.ErrorCode;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.io.InputStream;
import java.nio.FloatBuffer;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

/**
 * ONNX Runtime Java 탐지기 (FUNCTIONAL_SPEC F2-2). {@code sushioishi.inference.detector=onnx}일 때만 켜진다.
 * 모델 경로는 {@code sushioishi.model.path}(기본 {@code classpath:model/sushi-yolo-{version}.onnx}).
 * 모델 파일이 없거나 로드에 실패해도 서버는 기동하고, {@link #isReady()}는 false, 추론은 MODEL_UNAVAILABLE이다.
 */
@Component
@ConditionalOnProperty(name = "sushioishi.inference.detector", havingValue = "onnx")
public class OnnxSushiDetector implements SushiDetector {

    private static final Logger log = LoggerFactory.getLogger(OnnxSushiDetector.class);

    private final OrtEnvironment env;
    private final OrtSession session; // null이면 모델 사용 불가
    private final String inputName;
    private final int classCount;

    public OnnxSushiDetector(
            ResourceLoader loader,
            LabelProvider labels,
            @Value("${sushioishi.model.path:classpath:model/sushi-yolo-${sushioishi.model.version:v1}.onnx}")
            String modelPath) {
        this.env = OrtEnvironment.getEnvironment();
        this.classCount = labels.labels().size();
        OrtSession loaded = null;
        String name = null;
        Resource res = loader.getResource(modelPath);
        if (!res.exists()) {
            log.warn("ONNX 모델 파일이 없습니다: {} (추론은 MODEL_UNAVAILABLE)", modelPath);
        } else {
            try (InputStream in = res.getInputStream()) {
                loaded = env.createSession(in.readAllBytes(), new OrtSession.SessionOptions());
                name = loaded.getInputNames().iterator().next();
                log.info("ONNX 모델 로드 완료: {}", modelPath);
            } catch (IOException | OrtException | RuntimeException e) {
                log.error("ONNX 모델을 로드하지 못했습니다: {}", modelPath, e);
                loaded = null;
            }
        }
        this.session = loaded;
        this.inputName = name;
    }

    @Override
    public boolean isReady() {
        return session != null;
    }

    @Override
    public List<RawDetection> detect(Letterbox input) {
        if (session == null) {
            throw new ApiException(ErrorCode.MODEL_UNAVAILABLE);
        }
        long[] shape = {1, 3, Letterbox.SIZE, Letterbox.SIZE};
        try (OnnxTensor in = OnnxTensor.createTensor(env, FloatBuffer.wrap(input.tensor()), shape);
             OrtSession.Result out = session.run(Map.of(inputName, in))) {
            OnnxTensor first = (OnnxTensor) out.get(0);
            long[] outShape = first.getInfo().getShape();
            float[] data = new float[(int) first.getInfo().getNumElements()];
            first.getFloatBuffer().get(data);
            return parse(data, outShape, classCount);
        } catch (OrtException e) {
            log.error("ONNX 추론 실패", e);
            throw new ApiException(ErrorCode.MODEL_UNAVAILABLE);
        }
    }

    @PreDestroy
    void close() throws OrtException {
        if (session != null) {
            session.close();
        }
    }

    /**
     * Ultralytics 기본 출력 {@code [1, 4+C, A]}(채널 우선) 또는 {@code [1, A, 4+C]}를 파싱한다.
     * 앞 4개는 cx, cy, w, h(640 letterbox 픽셀), 나머지는 클래스 점수이며 최댓값을 confidence로 쓴다.
     */
    static List<RawDetection> parse(float[] data, long[] shape, int classCount) {
        if (shape.length != 3 || shape[0] != 1) {
            throw new IllegalStateException("지원하지 않는 출력 형태: " + java.util.Arrays.toString(shape));
        }
        int channels = 4 + classCount;
        boolean channelFirst;
        int anchors;
        if (shape[1] == channels) {
            channelFirst = true;
            anchors = (int) shape[2];
        } else if (shape[2] == channels) {
            channelFirst = false;
            anchors = (int) shape[1];
        } else {
            throw new IllegalStateException("출력 채널 수가 클래스 수(" + classCount + ")와 맞지 않습니다: "
                    + java.util.Arrays.toString(shape));
        }

        List<RawDetection> out = new ArrayList<>();
        for (int a = 0; a < anchors; a++) {
            int best = 0;
            float bestScore = Float.NEGATIVE_INFINITY;
            for (int c = 0; c < classCount; c++) {
                float s = at(data, channelFirst, anchors, channels, a, 4 + c);
                if (s > bestScore) {
                    bestScore = s;
                    best = c;
                }
            }
            out.add(new RawDetection(
                    at(data, channelFirst, anchors, channels, a, 0),
                    at(data, channelFirst, anchors, channels, a, 1),
                    at(data, channelFirst, anchors, channels, a, 2),
                    at(data, channelFirst, anchors, channels, a, 3),
                    best, bestScore));
        }
        return out;
    }

    private static float at(float[] data, boolean channelFirst, int anchors, int channels, int anchor, int channel) {
        return channelFirst ? data[channel * anchors + anchor] : data[anchor * channels + channel];
    }
}

package com.sushioishi.inference;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * classIndex -> class_id 매핑. {@code classpath:model/labels.json}(문자열 배열)이 있으면 그것을, 없으면
 * PROJECT_SPEC 4.1 표 순서의 기본값을 쓴다. 학습 산출물의 labels.json이 확정되면 그 파일이 우선한다.
 */
@Component
public class LabelProvider {

    static final List<String> DEFAULT_LABELS = List.of(
            "hirame", "tai", "hotate", "ika", "ebi", "amaebi", "maguro_akami", "aji", "saba",
            "salmon", "toro", "ikura", "uni", "unagi", "tamago");

    private final List<String> labels;

    public LabelProvider() {
        this.labels = load();
    }

    public List<String> labels() {
        return labels;
    }

    private static List<String> load() {
        ClassPathResource res = new ClassPathResource("model/labels.json");
        if (!res.exists()) {
            return DEFAULT_LABELS;
        }
        try (InputStream in = res.getInputStream()) {
            return List.copyOf(JsonMapper.builder().build().readValue(in, new TypeReference<List<String>>() {
            }));
        } catch (IOException | RuntimeException e) {
            throw new IllegalStateException("model/labels.json을 읽을 수 없습니다", e);
        }
    }
}

package com.sushioishi.storage;

import java.util.Optional;

/**
 * 원본(기준) 이미지 저장소. 사용자 동의(consent=true)가 있고 인식 결과가 1개 이상일 때만 호출된다 (C-3).
 * S3 호환 구현은 별도 작업이며, 그 전까지는 아무것도 저장하지 않는 {@link DisabledImageStorage}가 쓰인다.
 */
public interface ImageStorage {

    /** @return 저장된 스토리지 키. 저장하지 않았으면 빈 값 */
    Optional<String> store(String key, byte[] jpegBytes);
}

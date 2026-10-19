package com.sushioishi.storage;

import java.util.Optional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** 스토리지 미설정 시 기본값: 저장하지 않는다 ({@code image_url}은 NULL로 남는다). */
@Component
@ConditionalOnProperty(name = "sushioishi.storage.type", havingValue = "none", matchIfMissing = true)
public class DisabledImageStorage implements ImageStorage {

    @Override
    public Optional<String> store(String key, byte[] jpegBytes) {
        return Optional.empty();
    }
}

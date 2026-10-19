package com.sushioishi.common;

import java.util.UUID;

/** 요청 소유자. v3에서 사용자 계정으로 바뀌면 이 타입과 {@link DeviceIdArgumentResolver}만 수정한다. */
public record DeviceId(UUID value) {

    @Override
    public String toString() {
        return value.toString();
    }
}

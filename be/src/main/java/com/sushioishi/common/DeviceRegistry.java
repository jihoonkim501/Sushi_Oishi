package com.sushioishi.common;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** devices 행 등록. 쓰기가 필요한 POST /scans 경로에서만 호출한다 (C-1). */
@Component
public class DeviceRegistry {

    private final JdbcTemplate jdbc;

    public DeviceRegistry(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void ensure(DeviceId deviceId) {
        jdbc.update("INSERT INTO devices (id) VALUES (?) ON CONFLICT DO NOTHING", deviceId.value());
    }
}

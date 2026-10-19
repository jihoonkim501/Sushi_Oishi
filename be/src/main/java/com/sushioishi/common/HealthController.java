package com.sushioishi.common;

import com.sushioishi.inference.InferenceGate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** FUNCTIONAL_SPEC 6.5 / C-5. X-Device-Id 불필요. */
@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    public record Health(String status, String modelVersion, String db, String model) {
    }

    private final JdbcTemplate jdbc;
    private final InferenceGate gate;
    private final String modelVersion;

    public HealthController(JdbcTemplate jdbc, InferenceGate gate,
                            @Value("${sushioishi.model.version:v1}") String modelVersion) {
        this.jdbc = jdbc;
        this.gate = gate;
        this.modelVersion = modelVersion;
    }

    @GetMapping
    ResponseEntity<Health> health() {
        boolean dbUp = dbUp();
        boolean modelUp = gate.isReady();
        boolean up = dbUp && modelUp;
        Health body = new Health(up ? "UP" : "DOWN", modelVersion, dbUp ? "UP" : "DOWN", modelUp ? "UP" : "DOWN");
        return up ? ResponseEntity.ok(body) : ResponseEntity.status(503).body(body);
    }

    private boolean dbUp() {
        try {
            jdbc.queryForObject("SELECT 1", Integer.class);
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }
}

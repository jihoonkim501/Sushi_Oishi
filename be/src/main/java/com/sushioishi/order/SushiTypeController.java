package com.sushioishi.order;

import com.sushioishi.common.DeviceId;
import java.time.Duration;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** FUNCTIONAL_SPEC 6.4. */
@RestController
@RequestMapping("/api/v1/sushi-types")
public class SushiTypeController {

    private final SushiTypeCache cache;

    public SushiTypeController(SushiTypeCache cache) {
        this.cache = cache;
    }

    public record SushiTypeDto(String classId, String nameKo, String nameJa, String group, int orderScore,
                               String description) {
    }

    public record SushiTypesResponse(List<SushiTypeDto> types) {
    }

    @GetMapping
    ResponseEntity<SushiTypesResponse> list(DeviceId deviceId) {
        List<SushiTypeDto> types = cache.all().stream()
                .map(t -> new SushiTypeDto(t.getClassId(), t.getNameKo(), t.getNameJa(), t.getGroupCode(),
                        t.getOrderScore(), t.getDescription()))
                .toList();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofSeconds(600)).cachePublic())
                .body(new SushiTypesResponse(types));
    }
}

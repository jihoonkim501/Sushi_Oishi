package com.sushioishi.scan;

import com.sushioishi.common.ApiException;
import com.sushioishi.common.DeviceId;
import com.sushioishi.common.ErrorCode;
import com.sushioishi.common.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** FUNCTIONAL_SPEC 6.1~6.3. */
@RestController
@RequestMapping("/api/v1/scans")
public class ScanController {

    private final ScanService service;
    private final RateLimiter rateLimiter;

    public ScanController(ScanService service, RateLimiter rateLimiter) {
        this.service = service;
        this.rateLimiter = rateLimiter;
    }

    public record PatchRequest(String classId, Boolean eaten) {
    }

    @PostMapping(consumes = "multipart/form-data")
    ResponseEntity<ScanResponse> create(DeviceId deviceId,
                                        @RequestPart(name = "image", required = false) MultipartFile image,
                                        @RequestParam(name = "consent", defaultValue = "false") boolean consent,
                                        HttpServletRequest request) throws IOException {
        rateLimiter.check(deviceId, request.getRemoteAddr());
        if (image == null || image.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR);
        }
        ScanResponse response = service.create(deviceId, image.getBytes(), consent);
        return ResponseEntity.created(URI.create("/api/v1/scans/" + response.scanId())).body(response);
    }

    @GetMapping("/{scanId}")
    ScanResponse get(DeviceId deviceId, @PathVariable String scanId) {
        return service.get(deviceId, parseScanId(scanId));
    }

    @PatchMapping("/{scanId}/items/{itemId}")
    ScanResponse patch(DeviceId deviceId, @PathVariable String scanId, @PathVariable String itemId,
                       @RequestBody PatchRequest body) {
        UUID id = parseScanId(scanId);
        long item;
        try {
            item = Long.parseLong(itemId);
        } catch (NumberFormatException e) {
            // 스캔 소유 확인이 먼저다. 존재하지 않는 스캔이면 SCAN_NOT_FOUND가 우선한다.
            service.get(deviceId, id);
            throw new ApiException(ErrorCode.ITEM_NOT_FOUND);
        }
        return service.patch(deviceId, id, item, body.classId(), body.eaten());
    }

    /** UUID 형식 오류는 404 SCAN_NOT_FOUND (6.2). */
    private static UUID parseScanId(String raw) {
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException e) {
            throw new ApiException(ErrorCode.SCAN_NOT_FOUND);
        }
    }
}

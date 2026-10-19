package com.sushioishi.scan;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** FUNCTIONAL_SPEC 6.1 / 6.6 {@code ScanResponse}. */
public record ScanResponse(UUID scanId, int imageWidth, int imageHeight, String modelVersion, Instant createdAt,
                           List<Item> items) {

    public record Item(long itemId, int order, String classId, String nameKo, String group, double confidence,
                       Box box, boolean eaten, boolean corrected) {
    }

    public record Box(int x1, int y1, int x2, int y2) {
    }
}

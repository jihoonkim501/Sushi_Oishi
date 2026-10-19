package com.sushioishi.scan;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DetectionRepository extends JpaRepository<Detection, Long> {

    List<Detection> findByScanIdOrderByOrderIndexAsc(UUID scanId);
}

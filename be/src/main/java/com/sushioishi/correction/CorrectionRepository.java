package com.sushioishi.correction;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CorrectionRepository extends JpaRepository<Correction, Long> {

    List<Correction> findByDetectionIdOrderByIdAsc(Long detectionId);
}

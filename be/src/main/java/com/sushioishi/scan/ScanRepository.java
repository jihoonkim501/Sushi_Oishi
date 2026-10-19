package com.sushioishi.scan;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScanRepository extends JpaRepository<Scan, UUID> {

    /** 소유자 조건을 항상 함께 건다 (C-1). */
    Optional<Scan> findByIdAndDeviceId(UUID id, UUID deviceId);

    /** 동시 PATCH가 순서를 서로 덮어쓰지 않도록 스캔 행을 잠근다. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Scan s where s.id = :id and s.deviceId = :deviceId")
    Optional<Scan> findForUpdate(@Param("id") UUID id, @Param("deviceId") UUID deviceId);

    @Modifying
    @Query("update Scan s set s.imageUrl = :url where s.id = :id")
    int updateImageUrl(@Param("id") UUID id, @Param("url") String url);
}

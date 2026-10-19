package com.sushioishi.correction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** 사용자의 종류 수정 이력. 재학습 데이터 (BR-COR-03). */
@Entity
@Table(name = "corrections")
public class Correction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "detection_id")
    private Long detectionId;

    @Column(name = "before_class")
    private String beforeClass;

    @Column(name = "after_class")
    private String afterClass;

    @Column(name = "created_at")
    private Instant createdAt;

    protected Correction() {
    }

    public Correction(Long detectionId, String beforeClass, String afterClass) {
        this.detectionId = detectionId;
        this.beforeClass = beforeClass;
        this.afterClass = afterClass;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getDetectionId() {
        return detectionId;
    }

    public String getBeforeClass() {
        return beforeClass;
    }

    public String getAfterClass() {
        return afterClass;
    }
}

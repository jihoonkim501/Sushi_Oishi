package com.sushioishi.scan;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "detections")
public class Detection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scan_id")
    private UUID scanId;

    @Column(name = "class_id")
    private String classId;

    private float confidence;

    private int x1;
    private int y1;
    private int x2;
    private int y2;

    @Column(name = "order_index")
    private int orderIndex;

    private boolean eaten;

    private boolean corrected;

    protected Detection() {
    }

    public Detection(UUID scanId, String classId, float confidence, int x1, int y1, int x2, int y2, int orderIndex) {
        this.scanId = scanId;
        this.classId = classId;
        this.confidence = confidence;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.orderIndex = orderIndex;
    }

    public Long getId() {
        return id;
    }

    public UUID getScanId() {
        return scanId;
    }

    public String getClassId() {
        return classId;
    }

    public float getConfidence() {
        return confidence;
    }

    public int getX1() {
        return x1;
    }

    public int getY1() {
        return y1;
    }

    public int getX2() {
        return x2;
    }

    public int getY2() {
        return y2;
    }

    public int getOrderIndex() {
        return orderIndex;
    }

    public boolean isEaten() {
        return eaten;
    }

    public boolean isCorrected() {
        return corrected;
    }

    public void setOrderIndex(int orderIndex) {
        this.orderIndex = orderIndex;
    }

    public void setEaten(boolean eaten) {
        this.eaten = eaten;
    }

    /** F6-2 7단계: 종류를 바꾸고 corrected=true로 남긴다 (BR-COR-05). */
    public void correctTo(String classId) {
        this.classId = classId;
        this.corrected = true;
    }
}

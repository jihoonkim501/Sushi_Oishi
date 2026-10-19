package com.sushioishi.scan;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "scans")
public class Scan implements Persistable<UUID> {

    @Id
    private UUID id;

    @Column(name = "device_id")
    private UUID deviceId;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "image_width")
    private int imageWidth;

    @Column(name = "image_height")
    private int imageHeight;

    @Column(name = "model_version")
    private String modelVersion;

    @Column(name = "created_at")
    private Instant createdAt;

    @Transient
    private boolean isNew = true;

    protected Scan() {
    }

    public Scan(UUID id, UUID deviceId, int imageWidth, int imageHeight, String modelVersion, Instant createdAt) {
        this.id = id;
        this.deviceId = deviceId;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.modelVersion = modelVersion;
        this.createdAt = createdAt;
    }

    @Override
    public UUID getId() {
        return id;
    }

    /** 애플리케이션이 UUID를 직접 채우므로 새 엔티티임을 알려 save()가 SELECT 없이 persist 하게 한다. */
    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        this.isNew = false;
    }

    public UUID getDeviceId() {
        return deviceId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public int getImageWidth() {
        return imageWidth;
    }

    public int getImageHeight() {
        return imageHeight;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

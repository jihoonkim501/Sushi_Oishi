-- FUNCTIONAL_SPEC 5장 기준으로 V1 스키마를 맞춘다 (타입 길이, CHECK, CASCADE, 지연 유니크, 인덱스).

-- sushi_types
ALTER TABLE sushi_types ALTER COLUMN class_id TYPE VARCHAR(32);
ALTER TABLE sushi_types ALTER COLUMN name_ko TYPE VARCHAR(32);
ALTER TABLE sushi_types ALTER COLUMN name_ja TYPE VARCHAR(32);
ALTER TABLE sushi_types ALTER COLUMN group_code TYPE VARCHAR(16);
ALTER TABLE sushi_types ADD CONSTRAINT ck_sushi_types_group CHECK (group_code IN
    ('WHITE', 'SHELL', 'SQUID', 'SHRIMP', 'RED', 'BLUE', 'FATTY', 'GUNKAN', 'SAUCE', 'FINISH', 'UNKNOWN'));
ALTER TABLE sushi_types ADD CONSTRAINT ck_sushi_types_score CHECK (order_score BETWEEN 0 AND 100);

-- scans
ALTER TABLE scans ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE scans ALTER COLUMN image_url TYPE VARCHAR(512);
ALTER TABLE scans ALTER COLUMN model_version TYPE VARCHAR(32);
ALTER TABLE scans ADD CONSTRAINT ck_scans_size CHECK (image_width > 0 AND image_height > 0);
DROP INDEX idx_scans_device_id;
CREATE INDEX idx_scans_device_created ON scans (device_id, created_at DESC);

-- detections
ALTER TABLE detections ALTER COLUMN class_id TYPE VARCHAR(32);
ALTER TABLE detections DROP CONSTRAINT detections_scan_id_fkey;
ALTER TABLE detections ADD CONSTRAINT detections_scan_id_fkey
    FOREIGN KEY (scan_id) REFERENCES scans (id) ON DELETE CASCADE;
ALTER TABLE detections ADD CONSTRAINT ck_detections_confidence CHECK (confidence BETWEEN 0 AND 1);
ALTER TABLE detections ADD CONSTRAINT ck_detections_box CHECK (x1 < x2 AND y1 < y2);
ALTER TABLE detections ADD CONSTRAINT uq_detections_scan_order UNIQUE (scan_id, order_index)
    DEFERRABLE INITIALLY DEFERRED;
ALTER INDEX idx_detections_scan_id RENAME TO idx_detections_scan;

-- corrections
ALTER TABLE corrections ALTER COLUMN before_class TYPE VARCHAR(32);
ALTER TABLE corrections ALTER COLUMN after_class TYPE VARCHAR(32);
ALTER TABLE corrections DROP CONSTRAINT corrections_detection_id_fkey;
ALTER TABLE corrections ADD CONSTRAINT corrections_detection_id_fkey
    FOREIGN KEY (detection_id) REFERENCES detections (id) ON DELETE CASCADE;
ALTER TABLE corrections ADD CONSTRAINT corrections_before_class_fkey
    FOREIGN KEY (before_class) REFERENCES sushi_types (class_id);
ALTER TABLE corrections ADD CONSTRAINT corrections_after_class_fkey
    FOREIGN KEY (after_class) REFERENCES sushi_types (class_id);
DROP INDEX idx_corrections_detection_id;
CREATE INDEX idx_corrections_detection ON corrections (detection_id, created_at DESC);

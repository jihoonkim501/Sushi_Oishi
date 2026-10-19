CREATE TABLE devices (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sushi_types (
    class_id VARCHAR(50) PRIMARY KEY,
    name_ko VARCHAR(50) NOT NULL,
    name_ja VARCHAR(50) NOT NULL,
    group_code VARCHAR(20) NOT NULL,
    order_score INT NOT NULL,
    description TEXT
);

CREATE TABLE scans (
    id UUID PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id),
    image_url VARCHAR(500),
    image_width INT NOT NULL,
    image_height INT NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE detections (
    id BIGSERIAL PRIMARY KEY,
    scan_id UUID NOT NULL REFERENCES scans(id),
    class_id VARCHAR(50) NOT NULL REFERENCES sushi_types(class_id),
    confidence REAL NOT NULL,
    x1 INT NOT NULL,
    y1 INT NOT NULL,
    x2 INT NOT NULL,
    y2 INT NOT NULL,
    order_index INT NOT NULL,
    eaten BOOLEAN NOT NULL DEFAULT false,
    corrected BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE corrections (
    id BIGSERIAL PRIMARY KEY,
    detection_id BIGINT NOT NULL REFERENCES detections(id),
    before_class VARCHAR(50) NOT NULL,
    after_class VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scans_device_id ON scans(device_id);
CREATE INDEX idx_detections_scan_id ON detections(scan_id);
CREATE INDEX idx_corrections_detection_id ON corrections(detection_id);

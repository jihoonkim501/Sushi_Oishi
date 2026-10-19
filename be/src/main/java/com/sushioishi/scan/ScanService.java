package com.sushioishi.scan;

import com.sushioishi.common.ApiException;
import com.sushioishi.common.DeviceId;
import com.sushioishi.common.DeviceRegistry;
import com.sushioishi.common.ErrorCode;
import com.sushioishi.correction.Correction;
import com.sushioishi.correction.CorrectionRepository;
import com.sushioishi.inference.DetectedPiece;
import com.sushioishi.inference.ImagePreprocessor;
import com.sushioishi.inference.InferenceGate;
import com.sushioishi.inference.LabelProvider;
import com.sushioishi.inference.Letterbox;
import com.sushioishi.inference.PostProcessor;
import com.sushioishi.inference.RawDetection;
import com.sushioishi.order.OrderEngine;
import com.sushioishi.order.OrderEngine.OrderKey;
import com.sushioishi.order.SushiType;
import com.sushioishi.order.SushiTypeCache;
import com.sushioishi.storage.ImageStorage;
import java.awt.image.BufferedImage;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

/** 스캔 생성(F2, F3), 조회(F4-4), 수정·먹음 체크(F5-3, F6-2, F3-3). */
@Service
public class ScanService {

    private static final Logger log = LoggerFactory.getLogger(ScanService.class);
    private static final double LOW_CONFIDENCE = 0.60;

    private final ImagePreprocessor preprocessor;
    private final InferenceGate gate;
    private final PostProcessor postProcessor;
    private final LabelProvider labels;
    private final SushiTypeCache typeCache;
    private final ScanRepository scans;
    private final DetectionRepository detections;
    private final CorrectionRepository corrections;
    private final ImageStorage storage;
    private final DeviceRegistry deviceRegistry;
    private final TransactionTemplate tx;
    private final String modelVersion;
    private final ExecutorService storageExecutor = Executors.newVirtualThreadPerTaskExecutor();

    public ScanService(ImagePreprocessor preprocessor, InferenceGate gate, PostProcessor postProcessor,
                       LabelProvider labels, SushiTypeCache typeCache, ScanRepository scans,
                       DetectionRepository detections, CorrectionRepository corrections, ImageStorage storage,
                       DeviceRegistry deviceRegistry, PlatformTransactionManager txManager,
                       @Value("${sushioishi.model.version:v1}") String modelVersion) {
        this.preprocessor = preprocessor;
        this.gate = gate;
        this.postProcessor = postProcessor;
        this.labels = labels;
        this.typeCache = typeCache;
        this.scans = scans;
        this.detections = detections;
        this.corrections = corrections;
        this.storage = storage;
        this.deviceRegistry = deviceRegistry;
        this.tx = new TransactionTemplate(txManager);
        this.modelVersion = modelVersion;
    }

    /** 추론은 DB 트랜잭션 밖에서 하고, 저장만 짧은 트랜잭션으로 묶는다. */
    public ScanResponse create(DeviceId device, byte[] imageBytes, boolean consent) {
        long t0 = System.nanoTime();
        // 디코딩·리사이즈·letterbox·추론을 모두 추론 permit 안에서 실행한다 (동시 처리 이미지 수 제한)
        Inferred inferred = gate.run(detector -> {
            ImagePreprocessor.Prepared p = preprocessor.prepare(imageBytes);
            Letterbox lb = preprocessor.letterbox(p.image());
            long pre = System.nanoTime();
            return new Inferred(p, lb, detector.detect(lb), pre);
        });
        ImagePreprocessor.Prepared prepared = inferred.prepared();
        Letterbox letterbox = inferred.letterbox();
        long t1 = inferred.preDone();
        long t2 = System.nanoTime();

        List<DetectedPiece> pieces = postProcessor.process(inferred.raw(), letterbox, labels.labels(),
                typeCache::exists);
        if (pieces.isEmpty()) {
            throw new ApiException(ErrorCode.NO_SUSHI_DETECTED); // 아무것도 저장하지 않는다 (F2-4)
        }
        List<DetectedPiece> ordered = OrderEngine.sort(pieces,
                p -> new OrderKey(typeCache.scoreOf(p.classId()), roundConfidence((float) p.confidence()), p.x1(),
                        p.y1(), p.x2(), p.y2()));
        long t3 = System.nanoTime();

        UUID scanId = UUID.randomUUID();
        Instant createdAt = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        ScanResponse response = tx.execute(status -> {
            deviceRegistry.ensure(device);
            Scan scan = scans.save(new Scan(scanId, device.value(), prepared.width(), prepared.height(),
                    modelVersion, createdAt));
            List<Detection> rows = new java.util.ArrayList<>();
            for (int i = 0; i < ordered.size(); i++) {
                DetectedPiece p = ordered.get(i);
                rows.add(new Detection(scanId, p.classId(), (float) p.confidence(), p.x1(), p.y1(), p.x2(), p.y2(),
                        i + 1));
            }
            return toResponse(scan, detections.saveAll(rows));
        });

        if (consent) {
            storeAsync(scanId, createdAt, prepared.image());
        }
        long lowConfidence = pieces.stream().filter(p -> p.confidence() < LOW_CONFIDENCE).count();
        log.info("{\"event\":\"scan\",\"scanId\":\"{}\",\"deviceIdHash\":\"{}\",\"items\":{},\"lowConfidence\":{},"
                        + "\"msPre\":{},\"msInfer\":{},\"msPost\":{},\"msTotal\":{},\"model\":\"{}\",\"consent\":{}}",
                scanId, hash(device), pieces.size(), lowConfidence, ms(t0, t1), ms(t1, t2), ms(t2, t3),
                ms(t0, System.nanoTime()), modelVersion, consent);
        return response;
    }

    @Transactional(readOnly = true)
    public ScanResponse get(DeviceId device, UUID scanId) {
        Scan scan = scans.findByIdAndDeviceId(scanId, device.value())
                .orElseThrow(() -> new ApiException(ErrorCode.SCAN_NOT_FOUND));
        return toResponse(scan, detections.findByScanIdOrderByOrderIndexAsc(scanId));
    }

    /** F6-2: 소유 확인 -> 아이템 확인 -> 클래스 확인 -> 수정·기록 -> 순서 재계산. 한 트랜잭션. */
    @Transactional
    public ScanResponse patch(DeviceId device, UUID scanId, long itemId, String classId, Boolean eaten) {
        if (classId == null && eaten == null) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR);
        }
        Scan scan = scans.findForUpdate(scanId, device.value())
                .orElseThrow(() -> new ApiException(ErrorCode.SCAN_NOT_FOUND));
        List<Detection> rows = detections.findByScanIdOrderByOrderIndexAsc(scanId);
        Detection target = rows.stream().filter(d -> d.getId() == itemId).findFirst()
                .orElseThrow(() -> new ApiException(ErrorCode.ITEM_NOT_FOUND));
        if (classId != null && !typeCache.exists(classId)) {
            throw new ApiException(ErrorCode.INVALID_CLASS_ID);
        }

        boolean classChanged = classId != null && !classId.equals(target.getClassId());
        if (classChanged) {
            String before = target.getClassId();
            corrections.save(new Correction(target.getId(), before, classId));
            target.correctTo(classId);
            log.info("{\"event\":\"correction\",\"scanId\":\"{}\",\"itemId\":{},\"from\":\"{}\",\"to\":\"{}\"}",
                    scanId, itemId, before, classId);
        }
        if (eaten != null) {
            target.setEaten(eaten);
        }
        if (classChanged) {
            rows = OrderEngine.sort(rows, this::keyOf);
            for (int i = 0; i < rows.size(); i++) {
                rows.get(i).setOrderIndex(i + 1);
            }
        }
        return toResponse(scan, rows);
    }

    private OrderKey keyOf(Detection d) {
        return new OrderKey(typeCache.scoreOf(d.getClassId()), roundConfidence(d.getConfidence()), d.getX1(),
                d.getY1(), d.getX2(), d.getY2());
    }

    /**
     * 순서 정렬과 응답이 공유하는 confidence 정밀도: 저장되는 REAL(float) 값을 소수점 둘째 자리로 반올림(half up).
     * 클라이언트가 받는 값과 정렬 기준이 같으므로 생성·PATCH 재정렬·클라이언트 재계산 결과가 일치한다.
     */
    static double roundConfidence(float stored) {
        return Math.round((double) stored * 100) / 100.0;
    }

    private record Inferred(ImagePreprocessor.Prepared prepared, Letterbox letterbox, List<RawDetection> raw,
                            long preDone) {
    }

    private ScanResponse toResponse(Scan scan, List<Detection> orderedRows) {
        List<ScanResponse.Item> items = orderedRows.stream().map(d -> {
            SushiType type = typeCache.resolve(d.getClassId());
            return new ScanResponse.Item(d.getId(), d.getOrderIndex(), type.getClassId(), type.getNameKo(),
                    type.getGroupCode(), roundConfidence(d.getConfidence()),
                    new ScanResponse.Box(d.getX1(), d.getY1(), d.getX2(), d.getY2()), d.isEaten(), d.isCorrected());
        }).toList();
        return new ScanResponse(scan.getId(), scan.getImageWidth(), scan.getImageHeight(), scan.getModelVersion(),
                scan.getCreatedAt(), items);
    }

    /** C-3: 커밋 후 비동기 저장. 실패해도 스캔은 정상이며 image_url은 NULL로 남는다. */
    private void storeAsync(UUID scanId, Instant createdAt, BufferedImage image) {
        storageExecutor.submit(() -> {
            try {
                var date = createdAt.atZone(ZoneOffset.UTC);
                String key = "scans/%04d/%02d/%s.jpg".formatted(date.getYear(), date.getMonthValue(), scanId);
                storage.store(key, preprocessor.encodeJpeg(image))
                        .ifPresent(url -> tx.executeWithoutResult(s -> scans.updateImageUrl(scanId, url)));
            } catch (RuntimeException e) {
                log.warn("원본 이미지 저장 실패 scanId={}", scanId, e);
            }
        });
    }

    private static long ms(long fromNanos, long toNanos) {
        return (toNanos - fromNanos) / 1_000_000;
    }

    /** 기기 ID 원문은 로그에 남기지 않는다 (C-5). sha256 앞 8자. */
    private static String hash(DeviceId device) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(device.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest).substring(0, 8);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}

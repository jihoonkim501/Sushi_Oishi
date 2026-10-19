package com.sushioishi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.testcontainers.junit.jupiter.Testcontainers;
import com.sushioishi.inference.Letterbox;
import com.sushioishi.inference.RawDetection;
import com.sushioishi.inference.SushiDetector;
import com.sushioishi.storage.ImageStorage;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** API 계약(FUNCTIONAL_SPEC 6장)과 비즈니스 규칙을 실제 PostgreSQL(Testcontainers)로 검증한다. Docker가 없으면 건너뛴다. */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(properties = {"sushioishi.inference.detector=test", "sushioishi.storage.type=test"})
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, ScanApiIntegrationTest.TestBeans.class})
class ScanApiIntegrationTest {

    static final class FakeDetector implements SushiDetector {
        volatile List<RawDetection> next = List.of();

        @Override
        public boolean isReady() {
            return true;
        }

        @Override
        public List<RawDetection> detect(Letterbox input) {
            return next;
        }
    }

    static final class RecordingStorage implements ImageStorage {
        final List<String> keys = new CopyOnWriteArrayList<>();

        @Override
        public Optional<String> store(String key, byte[] jpegBytes) {
            keys.add(key);
            return Optional.of("s3://test/" + key);
        }
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class TestBeans {
        @Bean
        FakeDetector fakeDetector() {
            return new FakeDetector();
        }

        @Bean
        RecordingStorage recordingStorage() {
            return new RecordingStorage();
        }
    }

    // 1280x960 기준 이미지의 letterbox: r=0.5, padX=0, padY=80
    private static RawDetection piece(double cx, double cy, int classIndex, double conf) {
        return new RawDetection(cx * 0.5, cy * 0.5 + 80, 80, 60, classIndex, conf);
    }

    private static final int HIRAME = 0;
    private static final int MAGURO = 6;
    private static final int SALMON = 9;
    private static final int TAMAGO = 14;

    private static List<RawDetection> fourPieces() {
        return List.of(
                piece(300, 200, SALMON, 0.80),
                piece(600, 200, HIRAME, 0.90),
                piece(300, 500, TAMAGO, 0.70),
                piece(600, 500, MAGURO, 0.60));
    }

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired FakeDetector detector;
    @Autowired RecordingStorage storage;
    final JsonMapper json = JsonMapper.builder().build();

    @BeforeEach
    void reset() {
        jdbc.update("DELETE FROM corrections");
        jdbc.update("DELETE FROM detections");
        jdbc.update("DELETE FROM scans");
        storage.keys.clear();
        detector.next = fourPieces();
    }

    // ---- helpers -------------------------------------------------------------------------------------------

    private static byte[] jpeg(int w, int h) throws Exception {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        var g = img.createGraphics();
        g.setColor(Color.LIGHT_GRAY);
        g.fillRect(0, 0, w, h);
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", out);
        return out.toByteArray();
    }

    private static String newDevice() {
        return UUID.randomUUID().toString();
    }

    /** MockMvc 는 모든 요청의 IP 가 같으므로 IP 보조 한도(30/분)에 걸리지 않게 요청마다 다른 IP 를 부여한다. */
    private static RequestPostProcessor randomIp() {
        int n = Math.abs(UUID.randomUUID().hashCode());
        return r -> {
            r.setRemoteAddr("10." + (n % 250) + "." + ((n / 250) % 250) + "." + ((n / 62500) % 250));
            return r;
        };
    }

    private MockMultipartHttpServletRequestBuilder upload(String device, byte[] bytes, String consent) {
        MockMultipartHttpServletRequestBuilder b = multipart("/api/v1/scans")
                .file(new MockMultipartFile("image", "plate.jpg", "image/jpeg", bytes));
        if (consent != null) {
            b.param("consent", consent);
        }
        if (device != null) {
            b.header("X-Device-Id", device);
        }
        b.with(randomIp());
        return b;
    }

    private JsonNode createScan(String device) throws Exception {
        MvcResult r = mvc.perform(upload(device, jpeg(1280, 960), null)).andExpect(status().isCreated()).andReturn();
        return json.readTree(r.getResponse().getContentAsString());
    }

    private static long itemIdWithClass(JsonNode scan, String classId) {
        for (JsonNode item : scan.get("items")) {
            if (item.get("classId").asText().equals(classId)) {
                return item.get("itemId").asLong();
            }
        }
        throw new AssertionError("no item " + classId);
    }

    private MockHttpServletRequestBuilder patchItem(String device, String scanId, Object itemId, String body) {
        return patch("/api/v1/scans/{s}/items/{i}", scanId, itemId)
                .header("X-Device-Id", device).contentType(MediaType.APPLICATION_JSON).content(body);
    }

    // ---- C-1 device id / health / sushi-types ---------------------------------------------------------------

    @Test
    void FR_DEV_001_missing_or_malformed_device_id_is_400() throws Exception {
        mvc.perform(get("/api/v1/sushi-types")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_DEVICE_ID"))
                .andExpect(jsonPath("$.message").value("기기 정보를 확인할 수 없어요."));
        mvc.perform(get("/api/v1/sushi-types").header("X-Device-Id", "not-a-uuid")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_DEVICE_ID"));
    }

    @Test
    void FR_DEV_002_get_endpoints_are_read_only_and_post_registers_device_idempotently() throws Exception {
        String device = newDevice();
        mvc.perform(get("/api/v1/sushi-types").header("X-Device-Id", device)).andExpect(status().isOk());
        mvc.perform(get("/api/v1/scans/{id}", UUID.randomUUID()).header("X-Device-Id", device))
                .andExpect(status().isNotFound());
        assertThat(deviceCount(device)).isZero(); // GET 은 devices 에 쓰지 않는다

        mvc.perform(upload(device, jpeg(640, 480), null)).andExpect(status().isCreated());
        mvc.perform(upload(device.toUpperCase(), jpeg(640, 480), null)).andExpect(status().isCreated());
        assertThat(deviceCount(device)).isEqualTo(1);
    }

    @Test
    void FR_DEV_002_rate_limited_or_failed_uploads_do_not_register_device() throws Exception {
        String limited = newDevice();
        for (int i = 0; i < 10; i++) {
            mvc.perform(upload(limited, jpeg(100, 100), null)).andExpect(status().isCreated());
        }
        String other = newDevice();
        detector.next = List.of();
        mvc.perform(upload(other, jpeg(100, 100), null)).andExpect(status().isUnprocessableContent());
        assertThat(deviceCount(other)).isZero();
    }

    private int deviceCount(String device) {
        return jdbc.queryForObject("SELECT count(*) FROM devices WHERE id = ?::uuid", Integer.class, device);
    }

    @Test
    void FR_OPS_001_health_needs_no_device_id() throws Exception {
        mvc.perform(get("/api/v1/health")).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.modelVersion").value("v1"))
                .andExpect(jsonPath("$.db").value("UP"))
                .andExpect(jsonPath("$.model").value("UP"));
    }

    @Test
    void FR_TYP_001_sushi_types_are_sorted_and_cacheable() throws Exception {
        mvc.perform(get("/api/v1/sushi-types").header("X-Device-Id", newDevice()))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("max-age=600")))
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("public")))
                .andExpect(jsonPath("$.types", hasSize(16)))
                .andExpect(jsonPath("$.types[0].classId").value("hirame"))
                .andExpect(jsonPath("$.types[0].orderScore").value(10))
                .andExpect(jsonPath("$.types[0].group").value("WHITE"))
                .andExpect(jsonPath("$.types[0].nameJa").value("ヒラメ"))
                // 점수 50 동점: salmon < unknown (classId 오름차순)
                .andExpect(jsonPath("$.types[9].classId").value("salmon"))
                .andExpect(jsonPath("$.types[10].classId").value("unknown"));
    }

    // ---- POST /scans ---------------------------------------------------------------------------------------

    @Test
    void FR_ORD_001_post_scans_returns_201_with_ordered_items_and_location() throws Exception {
        String device = newDevice();
        MvcResult r = mvc.perform(upload(device, jpeg(1280, 960), null))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.startsWith("/api/v1/scans/")))
                .andExpect(jsonPath("$.imageWidth").value(1280))
                .andExpect(jsonPath("$.imageHeight").value(960))
                .andExpect(jsonPath("$.modelVersion").value("v1"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.items", hasSize(4)))
                .andExpect(jsonPath("$.items[0].order").value(1))
                .andExpect(jsonPath("$.items[0].classId").value("hirame"))
                .andExpect(jsonPath("$.items[0].nameKo").value("광어"))
                .andExpect(jsonPath("$.items[0].group").value("WHITE"))
                .andExpect(jsonPath("$.items[0].confidence").value(0.9))
                .andExpect(jsonPath("$.items[0].eaten").value(false))
                .andExpect(jsonPath("$.items[0].corrected").value(false))
                .andExpect(jsonPath("$.items[1].classId").value("maguro_akami"))
                .andExpect(jsonPath("$.items[2].classId").value("salmon"))
                .andExpect(jsonPath("$.items[3].classId").value("tamago"))
                .andReturn();
        JsonNode body = json.readTree(r.getResponse().getContentAsString());
        // BR-DET-02: hirame 박스 중심 (600,200), 160x120 -> (520,140)-(680,260)
        JsonNode box = body.get("items").get(0).get("box");
        assertThat(box.get("x1").asInt()).isEqualTo(520);
        assertThat(box.get("y1").asInt()).isEqualTo(140);
        assertThat(box.get("x2").asInt()).isEqualTo(680);
        assertThat(box.get("y2").asInt()).isEqualTo(260);
        assertThat(r.getResponse().getHeader("Location")).endsWith(body.get("scanId").asText());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM detections", Integer.class)).isEqualTo(4);
    }

    @Test
    void FR_DET_007_no_detection_is_422_and_nothing_is_saved() throws Exception {
        detector.next = List.of();
        mvc.perform(upload(newDevice(), jpeg(640, 480), "true"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("NO_SUSHI_DETECTED"))
                .andExpect(jsonPath("$.message").value("초밥을 찾지 못했어요."));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM scans", Integer.class)).isZero();
        assertThat(storage.keys).isEmpty(); // 동의해도 인식 실패면 원본을 저장하지 않는다 (F2-4)
    }

    @Test
    void FR_IMG_007_upload_validation_errors() throws Exception {
        String device = newDevice();
        mvc.perform(multipart("/api/v1/scans").header("X-Device-Id", device).with(randomIp()))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        mvc.perform(upload(device, new byte[] {1, 2, 3, 4, 5}, null))
                .andExpect(status().isUnsupportedMediaType()).andExpect(jsonPath("$.code").value("UNSUPPORTED_FORMAT"));
        mvc.perform(upload(device, new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0, 1, 2}, null))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_IMAGE"));
        mvc.perform(upload(device, new byte[5 * 1024 * 1024 + 1], null))
                .andExpect(status().isPayloadTooLarge()).andExpect(jsonPath("$.code").value("IMAGE_TOO_LARGE"));
        mvc.perform(upload(device, jpeg(100, 100), "maybe"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void NFR_PRI_001_image_is_stored_only_with_consent_after_commit() throws Exception {
        mvc.perform(upload(newDevice(), jpeg(640, 480), "false")).andExpect(status().isCreated());
        mvc.perform(upload(newDevice(), jpeg(640, 480), null)).andExpect(status().isCreated());
        assertThat(storage.keys).isEmpty();

        JsonNode scan = json.readTree(mvc.perform(upload(newDevice(), jpeg(640, 480), "true"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        String scanId = scan.get("scanId").asText();

        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        String url = null;
        while (System.nanoTime() < deadline && url == null) {
            url = jdbc.queryForObject("SELECT image_url FROM scans WHERE id = ?::uuid", String.class, scanId);
            Thread.sleep(50);
        }
        assertThat(storage.keys).hasSize(1);
        assertThat(storage.keys.get(0)).matches("scans/\\d{4}/\\d{2}/" + scanId + "\\.jpg");
        assertThat(url).isEqualTo("s3://test/" + storage.keys.get(0));
    }

    @Test
    void FR_OPS_004_eleventh_upload_in_a_minute_is_429_with_retry_after() throws Exception {
        String device = newDevice();
        for (int i = 0; i < 10; i++) {
            mvc.perform(upload(device, jpeg(100, 100), null)).andExpect(status().isCreated());
        }
        mvc.perform(upload(device, jpeg(100, 100), null))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"))
                .andExpect(header().exists("Retry-After"));
        // 다른 기기는 영향 없음
        mvc.perform(upload(newDevice(), jpeg(100, 100), null)).andExpect(status().isCreated());
    }

    // ---- GET /scans/{id} -------------------------------------------------------------------------------------

    @Test
    void FR_RES_011_get_returns_same_result_and_hides_other_devices_scans() throws Exception {
        String device = newDevice();
        JsonNode created = createScan(device);
        String scanId = created.get("scanId").asText();

        MvcResult r = mvc.perform(get("/api/v1/scans/{id}", scanId).header("X-Device-Id", device))
                .andExpect(status().isOk()).andReturn();
        assertThat(json.readTree(r.getResponse().getContentAsString())).isEqualTo(created);

        mvc.perform(get("/api/v1/scans/{id}", scanId).header("X-Device-Id", newDevice()))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("SCAN_NOT_FOUND"));
        mvc.perform(get("/api/v1/scans/{id}", UUID.randomUUID()).header("X-Device-Id", device))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("SCAN_NOT_FOUND"));
        mvc.perform(get("/api/v1/scans/not-a-uuid").header("X-Device-Id", device))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("SCAN_NOT_FOUND"));
    }

    // ---- PATCH ---------------------------------------------------------------------------------------------

    @Test
    void FR_RES_007_BR_EAT_01_eaten_check_does_not_change_order_or_write_corrections() throws Exception {
        String device = newDevice();
        JsonNode scan = createScan(device);
        long salmon = itemIdWithClass(scan, "salmon");

        mvc.perform(patchItem(device, scan.get("scanId").asText(), salmon, "{\"eaten\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[2].classId").value("salmon"))
                .andExpect(jsonPath("$.items[2].eaten").value(true))
                .andExpect(jsonPath("$.items[2].corrected").value(false))
                .andExpect(jsonPath("$.items[*].order", contains(1, 2, 3, 4)));
        mvc.perform(patchItem(device, scan.get("scanId").asText(), salmon, "{\"eaten\":false}"))
                .andExpect(jsonPath("$.items[2].eaten").value(false));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM corrections", Integer.class)).isZero();
    }

    @Test
    void FR_COR_003_BR_ORD_08_correction_records_history_and_reorders() throws Exception {
        String device = newDevice();
        JsonNode scan = createScan(device);
        String scanId = scan.get("scanId").asText();
        long hirame = itemIdWithClass(scan, "hirame");

        // hirame(10) -> toro(55): 마지막 salmon(50)/tamago(80) 사이로 이동 -> maguro, salmon, toro, tamago
        mvc.perform(patchItem(device, scanId, hirame, "{\"classId\":\"toro\",\"eaten\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].classId", contains("maguro_akami", "salmon", "toro", "tamago")))
                .andExpect(jsonPath("$.items[*].order", contains(1, 2, 3, 4)))
                .andExpect(jsonPath("$.items[2].itemId").value(hirame))
                .andExpect(jsonPath("$.items[2].nameKo").value("참치 뱃살"))
                .andExpect(jsonPath("$.items[2].corrected").value(true))
                .andExpect(jsonPath("$.items[2].eaten").value(true))
                .andExpect(jsonPath("$.items[2].confidence").value(0.9)); // BR-ORD-09 모델 값 유지

        assertThat(jdbc.queryForObject(
                "SELECT before_class || '>' || after_class FROM corrections WHERE detection_id = ?", String.class, hirame))
                .isEqualTo("hirame>toro");

        // 새로고침(GET)에도 유지
        mvc.perform(get("/api/v1/scans/{id}", scanId).header("X-Device-Id", device))
                .andExpect(jsonPath("$.items[2].classId").value("toro"));
    }

    @Test
    void F6_2_same_class_is_idempotent_and_reverting_keeps_corrected_true() throws Exception {
        String device = newDevice();
        JsonNode scan = createScan(device);
        String scanId = scan.get("scanId").asText();
        long hirame = itemIdWithClass(scan, "hirame");

        // 같은 class -> corrections 없음, corrected=false 유지
        mvc.perform(patchItem(device, scanId, hirame, "{\"classId\":\"hirame\"}")).andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].corrected").value(false));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM corrections", Integer.class)).isZero();

        mvc.perform(patchItem(device, scanId, hirame, "{\"classId\":\"toro\"}")).andExpect(status().isOk());
        mvc.perform(patchItem(device, scanId, hirame, "{\"classId\":\"toro\"}")).andExpect(status().isOk()); // 멱등
        assertThat(jdbc.queryForObject("SELECT count(*) FROM corrections", Integer.class)).isEqualTo(1);

        // BR-COR-05: 원래 값으로 되돌려도 corrected 유지, BR-COR-03: 이력 누적
        mvc.perform(patchItem(device, scanId, hirame, "{\"classId\":\"hirame\"}")).andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].classId").value("hirame"))
                .andExpect(jsonPath("$.items[0].corrected").value(true));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM corrections", Integer.class)).isEqualTo(2);
    }

    @Test
    void BR_COR_04_unknown_is_a_valid_correction() throws Exception {
        String device = newDevice();
        JsonNode scan = createScan(device);
        long tamago = itemIdWithClass(scan, "tamago");
        mvc.perform(patchItem(device, scan.get("scanId").asText(), tamago, "{\"classId\":\"unknown\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[3].classId").value("unknown")) // 50: salmon 뒤(동점이면 위치 순)
                .andExpect(jsonPath("$.items[3].group").value("UNKNOWN"));
    }

    @Test
    void F6_2_patch_error_codes() throws Exception {
        String device = newDevice();
        JsonNode scan = createScan(device);
        String scanId = scan.get("scanId").asText();
        long item = scan.get("items").get(0).get("itemId").asLong();

        mvc.perform(patchItem(device, scanId, item, "{\"classId\":\"engawa\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_CLASS_ID"));
        mvc.perform(patchItem(device, scanId, item, "{}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        mvc.perform(patchItem(device, scanId, item, "not json"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        mvc.perform(patchItem(device, scanId, item, "{\"eaten\":\"yes\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        mvc.perform(patchItem(device, scanId, 999999999L, "{\"eaten\":true}"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("ITEM_NOT_FOUND"));
        mvc.perform(patchItem(device, scanId, "abc", "{\"eaten\":true}"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("ITEM_NOT_FOUND"));
        mvc.perform(patchItem(newDevice(), scanId, item, "{\"eaten\":true}"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("SCAN_NOT_FOUND"));
        mvc.perform(patchItem(device, UUID.randomUUID().toString(), item, "{\"eaten\":true}"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("SCAN_NOT_FOUND"));
        // 알 수 없는 필드는 무시
        mvc.perform(patchItem(device, scanId, item, "{\"eaten\":true,\"foo\":1}")).andExpect(status().isOk());
    }

    @Test
    void FR_ERR_002_unknown_route_and_wrong_method_keep_their_status() throws Exception {
        mvc.perform(get("/api/v1/unknown-route").header("X-Device-Id", newDevice()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.items").doesNotExist());
        mvc.perform(delete("/api/v1/scans/{id}", UUID.randomUUID()).header("X-Device-Id", newDevice()))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
        mvc.perform(post("/api/v1/scans").header("X-Device-Id", newDevice()).contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void BR_ORD_04_near_equal_confidences_give_same_order_on_create_and_after_patch() throws Exception {
        // 같은 줄·같은 cx 에서 confidence 만 0.904 / 0.896 (둘 다 클라이언트에는 0.90 으로 보인다).
        // 반올림 값이 같으므로 confidence 로 갈리지 않고 x1 오름차순이 결정한다: 넓은 박스(x1=250)가 먼저.
        detector.next = List.of(
                new RawDetection(400 * 0.5, 700 * 0.5 + 80, 100 * 0.5, 60, HIRAME, 0.904), // x1=350
                new RawDetection(400 * 0.5, 700 * 0.5 + 80, 300 * 0.5, 60, HIRAME, 0.896), // x1=250
                piece(900, 300, TAMAGO, 0.8));
        String device = newDevice();
        JsonNode created = createScan(device);
        List<Long> createOrder = hirameIds(created);
        assertThat(created.get("items").get(0).get("confidence").asDouble()).isEqualTo(0.9);
        assertThat(created.get("items").get(1).get("confidence").asDouble()).isEqualTo(0.9);
        assertThat(created.get("items").get(0).get("box").get("x1").asInt()).isEqualTo(250);

        // 다른 아이템을 수정해 서버 재정렬을 유발한다
        long tamago = itemIdWithClass(created, "tamago");
        MvcResult r = mvc.perform(patchItem(device, created.get("scanId").asText(), tamago, "{\"classId\":\"ika\"}"))
                .andExpect(status().isOk()).andReturn();
        JsonNode patched = json.readTree(r.getResponse().getContentAsString());
        assertThat(hirameIds(patched)).isEqualTo(createOrder);

        // GET(저장된 order_index)도 같다
        JsonNode fetched = json.readTree(mvc.perform(get("/api/v1/scans/{id}", created.get("scanId").asText())
                .header("X-Device-Id", device)).andReturn().getResponse().getContentAsString());
        assertThat(hirameIds(fetched)).isEqualTo(createOrder);
    }

    private static List<Long> hirameIds(JsonNode scan) {
        List<Long> ids = new java.util.ArrayList<>();
        for (JsonNode item : scan.get("items")) {
            if (item.get("classId").asText().equals("hirame")) {
                ids.add(item.get("itemId").asLong());
            }
        }
        return ids;
    }
}

package com.sushioishi.inference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sushioishi.common.ApiException;
import com.sushioishi.common.ErrorCode;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;

/** FR-IMG-007, FR-DET-001 (F2-1 5~9단계, F2-2 1~2단계). */
class ImagePreprocessorTest {

    private final ImagePreprocessor preprocessor = new ImagePreprocessor();

    private static byte[] encode(BufferedImage image, String format) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, format, out);
        return out.toByteArray();
    }

    private static BufferedImage solid(int w, int h, Color c) {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        var g = img.createGraphics();
        g.setColor(c);
        g.fillRect(0, 0, w, h);
        g.dispose();
        return img;
    }

    /** SOI 직후에 Orientation 만 가진 APP1(Exif) 세그먼트를 끼워 넣는다 (little endian TIFF). */
    private static byte[] withExifOrientation(byte[] jpeg, int orientation) {
        byte[] tiff = {
                'I', 'I', 0x2A, 0, 8, 0, 0, 0,          // header, IFD0 offset = 8
                1, 0,                                    // 1 entry
                0x12, 0x01, 3, 0, 1, 0, 0, 0,            // tag 0x0112, SHORT, count 1
                (byte) orientation, 0, 0, 0,             // value
                0, 0, 0, 0                               // next IFD
        };
        byte[] exifHeader = {'E', 'x', 'i', 'f', 0, 0};
        int segLen = 2 + exifHeader.length + tiff.length;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(jpeg, 0, 2); // SOI
        out.write(0xFF);
        out.write(0xE1);
        out.write(segLen >> 8);
        out.write(segLen & 0xFF);
        out.writeBytes(exifHeader);
        out.writeBytes(tiff);
        out.write(jpeg, 2, jpeg.length - 2);
        return out.toByteArray();
    }

    private static boolean near(int rgb, Color expected) {
        Color c = new Color(rgb);
        return Math.abs(c.getRed() - expected.getRed()) < 40
                && Math.abs(c.getGreen() - expected.getGreen()) < 40
                && Math.abs(c.getBlue() - expected.getBlue()) < 40;
    }

    @Test
    void FR_IMG_007_rejects_non_jpeg_png_with_415() throws Exception {
        byte[] gif = encode(solid(10, 10, Color.RED), "gif");
        assertThatThrownBy(() -> preprocessor.prepare(gif))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.UNSUPPORTED_FORMAT));
    }

    @Test
    void FR_IMG_007_rejects_over_5mb_with_413() {
        byte[] big = new byte[ImagePreprocessor.MAX_BYTES + 1];
        assertThatThrownBy(() -> preprocessor.prepare(big))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.IMAGE_TOO_LARGE));
    }

    @Test
    void FR_IMG_007_corrupt_jpeg_is_invalid_image_400() {
        byte[] corrupt = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x01, 0x02, 0x03};
        assertThatThrownBy(() -> preprocessor.prepare(corrupt))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.INVALID_IMAGE));
    }

    @Test
    void FR_IMG_007_over_25_megapixels_is_413() throws Exception {
        // 6000x4500 = 27MP 단색 PNG 는 매우 작아 5MB 제한을 통과하고 픽셀 수 제한에 걸린다.
        byte[] png = encode(new BufferedImage(6000, 4500, BufferedImage.TYPE_BYTE_GRAY), "png");
        assertThat(png.length).isLessThan(ImagePreprocessor.MAX_BYTES);
        assertThatThrownBy(() -> preprocessor.prepare(png))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.IMAGE_TOO_LARGE));
    }

    @Test
    void FR_DET_001_downscales_long_side_to_1280_keeping_ratio() throws Exception {
        ImagePreprocessor.Prepared p = preprocessor.prepare(encode(solid(2560, 1920, Color.BLUE), "png"));
        assertThat(p.width()).isEqualTo(1280);
        assertThat(p.height()).isEqualTo(960);
    }

    @Test
    void BR_IMG_02_does_not_upscale_small_images() throws Exception {
        ImagePreprocessor.Prepared p = preprocessor.prepare(encode(solid(640, 480, Color.BLUE), "png"));
        assertThat(p.width()).isEqualTo(640);
        assertThat(p.height()).isEqualTo(480);
    }

    @Test
    void FR_IMG_007_exif_orientation_6_rotates_90_clockwise() throws Exception {
        // 좌측 절반 빨강, 우측 절반 파랑인 200x100. 시계방향 90도 회전하면 100x200, 위쪽 빨강 / 아래쪽 파랑.
        BufferedImage src = new BufferedImage(200, 100, BufferedImage.TYPE_INT_RGB);
        var g = src.createGraphics();
        g.setColor(Color.RED);
        g.fillRect(0, 0, 100, 100);
        g.setColor(Color.BLUE);
        g.fillRect(100, 0, 100, 100);
        g.dispose();

        byte[] jpeg = withExifOrientation(encode(src, "jpg"), 6);
        BufferedImage out = preprocessor.prepare(jpeg).image();
        assertThat(out.getWidth()).isEqualTo(100);
        assertThat(out.getHeight()).isEqualTo(200);
        assertThat(near(out.getRGB(50, 25), Color.RED)).isTrue();
        assertThat(near(out.getRGB(50, 175), Color.BLUE)).isTrue();
    }

    @Test
    void exif_orientation_all_values_map_pixels_correctly() {
        // 비대칭 2x3 이미지: (0,0)=빨강, 나머지=흰색. 방향 1~8 별로 빨강 픽셀의 도착 위치를 검증한다.
        int w = 2;
        int h = 3;
        BufferedImage src = solid(w, h, Color.WHITE);
        src.setRGB(0, 0, Color.RED.getRGB());
        // 방향 -> 빨강의 기대 좌표 (EXIF 표준: 저장된 좌상단 픽셀이 화면에서 놓이는 위치)
        int[][] expected = {
                {0, 0},        // 1 정상
                {w - 1, 0},    // 2 좌우 반전
                {w - 1, h - 1},// 3 180도
                {0, h - 1},    // 4 상하 반전
                {0, 0},        // 5 transpose (결과 3x2)
                {h - 1, 0},    // 6 90도 시계
                {h - 1, w - 1},// 7 transverse
                {0, w - 1},    // 8 90도 반시계
        };
        for (int o = 1; o <= 8; o++) {
            BufferedImage out = ImagePreprocessor.applyOrientation(src, o);
            boolean swapped = o >= 5;
            assertThat(out.getWidth()).as("width o=%d", o).isEqualTo(swapped ? h : w);
            assertThat(out.getHeight()).as("height o=%d", o).isEqualTo(swapped ? w : h);
            assertThat(out.getRGB(expected[o - 1][0], expected[o - 1][1]) & 0xFFFFFF)
                    .as("red pixel o=%d", o).isEqualTo(Color.RED.getRGB() & 0xFFFFFF);
        }
    }

    @Test
    void FR_DET_001_letterbox_geometry_and_tensor_layout() {
        // 1280x960 -> r=0.5, content 640x480, padY=80
        BufferedImage img = solid(1280, 960, new Color(255, 0, 0));
        Letterbox lb = preprocessor.letterbox(img);
        assertThat(lb.r()).isEqualTo(0.5);
        assertThat(lb.padX()).isEqualTo(0.0);
        assertThat(lb.padY()).isEqualTo(80.0);
        assertThat(lb.tensor()).hasSize(3 * 640 * 640);

        int plane = 640 * 640;
        int center = 320 * 640 + 320;
        // 중앙: R=1, G=0, B=0 (NCHW, RGB 순서, /255)
        assertThat(lb.tensor()[center]).isEqualTo(1.0f);
        assertThat(lb.tensor()[plane + center]).isEqualTo(0.0f);
        assertThat(lb.tensor()[2 * plane + center]).isEqualTo(0.0f);
        // 패딩 영역(맨 위 줄): 114/255
        assertThat(lb.tensor()[0]).isEqualTo(114 / 255.0f);
        assertThat(lb.tensor()[plane]).isEqualTo(114 / 255.0f);
    }
}

package com.sushioishi.inference;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.sushioishi.common.ApiException;
import com.sushioishi.common.ErrorCode;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.stereotype.Component;

/** FUNCTIONAL_SPEC F2-1 5~9단계(형식·크기 검증, 디코딩, EXIF 회전, 1280 축소)와 F2-2 1~2단계(letterbox 변환). */
@Component
public class ImagePreprocessor {

    public static final int MAX_BYTES = 5_242_880;
    public static final long MAX_PIXELS = 25_000_000L;
    public static final int MAX_SIDE = 1280;

    /** 기준 이미지. 응답 좌표계의 기준이 된다. */
    public record Prepared(BufferedImage image) {
        public int width() {
            return image.getWidth();
        }

        public int height() {
            return image.getHeight();
        }
    }

    public Prepared prepare(byte[] bytes) {
        if (bytes.length > MAX_BYTES) {
            throw new ApiException(ErrorCode.IMAGE_TOO_LARGE);
        }
        if (!isJpeg(bytes) && !isPng(bytes)) {
            throw new ApiException(ErrorCode.UNSUPPORTED_FORMAT);
        }
        BufferedImage decoded = decode(bytes);
        int orientation = isJpeg(bytes) ? readOrientation(bytes) : 1;
        BufferedImage oriented = applyOrientation(decoded, orientation);
        return new Prepared(resizeToMaxSide(oriented, MAX_SIDE));
    }

    /** 기준 이미지를 640x640 letterbox 텐서로 변환한다 (F2-2). */
    public Letterbox letterbox(BufferedImage image) {
        int w = image.getWidth();
        int h = image.getHeight();
        int size = Letterbox.SIZE;
        double r = Math.min((double) size / w, (double) size / h);
        int newW = (int) Math.round(w * r);
        int newH = (int) Math.round(h * r);
        double padX = (size - newW) / 2.0;
        double padY = (size - newH) / 2.0;

        BufferedImage canvas = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = canvas.createGraphics();
        try {
            g.setColor(new Color(114, 114, 114));
            g.fillRect(0, 0, size, size);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(image, (int) Math.floor(padX), (int) Math.floor(padY), newW, newH, null);
        } finally {
            g.dispose();
        }

        int plane = size * size;
        float[] tensor = new float[3 * plane];
        int[] pixels = canvas.getRGB(0, 0, size, size, null, 0, size);
        for (int i = 0; i < plane; i++) {
            int p = pixels[i];
            tensor[i] = ((p >> 16) & 0xFF) / 255.0f;
            tensor[plane + i] = ((p >> 8) & 0xFF) / 255.0f;
            tensor[2 * plane + i] = (p & 0xFF) / 255.0f;
        }
        return new Letterbox(tensor, w, h, r, padX, padY);
    }

    /** 기준 이미지를 EXIF 없는 JPEG로 다시 인코딩한다 (동의 시 저장용, C-3). */
    public byte[] encodeJpeg(BufferedImage image) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            ImageIO.write(image, "jpg", out);
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
        return out.toByteArray();
    }

    private BufferedImage decode(byte[] bytes) {
        try (ImageInputStream in = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(in);
            if (!readers.hasNext()) {
                throw new ApiException(ErrorCode.INVALID_IMAGE);
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(in, true, true);
                long pixels = (long) reader.getWidth(0) * reader.getHeight(0);
                if (pixels > MAX_PIXELS) {
                    throw new ApiException(ErrorCode.IMAGE_TOO_LARGE);
                }
                BufferedImage image = reader.read(0);
                if (image == null) {
                    throw new ApiException(ErrorCode.INVALID_IMAGE);
                }
                return image;
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException e) {
            if (e instanceof ApiException api) {
                throw api;
            }
            throw new ApiException(ErrorCode.INVALID_IMAGE);
        }
    }

    private int readOrientation(byte[] bytes) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(new ByteArrayInputStream(bytes));
            ExifIFD0Directory dir = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            if (dir != null && dir.containsTag(ExifIFD0Directory.TAG_ORIENTATION)) {
                int o = dir.getInt(ExifIFD0Directory.TAG_ORIENTATION);
                return o >= 1 && o <= 8 ? o : 1;
            }
        } catch (Exception e) {
            // EXIF를 읽지 못하면 회전 없이 진행한다.
        }
        return 1;
    }

    /** EXIF Orientation 1~8 을 픽셀에 반영한다. 결과는 알파 없는 RGB. */
    static BufferedImage applyOrientation(BufferedImage src, int orientation) {
        int w = src.getWidth();
        int h = src.getHeight();
        boolean swap = orientation >= 5;
        AffineTransform t = switch (orientation) {
            case 2 -> new AffineTransform(-1, 0, 0, 1, w, 0);
            case 3 -> new AffineTransform(-1, 0, 0, -1, w, h);
            case 4 -> new AffineTransform(1, 0, 0, -1, 0, h);
            case 5 -> new AffineTransform(0, 1, 1, 0, 0, 0);
            case 6 -> new AffineTransform(0, 1, -1, 0, h, 0);
            case 7 -> new AffineTransform(0, -1, -1, 0, h, w);
            case 8 -> new AffineTransform(0, -1, 1, 0, 0, w);
            default -> new AffineTransform();
        };
        BufferedImage dst = new BufferedImage(swap ? h : w, swap ? w : h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = dst.createGraphics();
        try {
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, dst.getWidth(), dst.getHeight());
            g.drawImage(src, t, null);
        } finally {
            g.dispose();
        }
        return dst;
    }

    static BufferedImage resizeToMaxSide(BufferedImage src, int maxSide) {
        int w = src.getWidth();
        int h = src.getHeight();
        int longSide = Math.max(w, h);
        if (longSide <= maxSide) {
            return src;
        }
        double scale = (double) maxSide / longSide;
        int nw = Math.max(1, (int) Math.round(w * scale));
        int nh = Math.max(1, (int) Math.round(h * scale));
        BufferedImage dst = new BufferedImage(nw, nh, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = dst.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(src, 0, 0, nw, nh, null);
        } finally {
            g.dispose();
        }
        return dst;
    }

    private static boolean isJpeg(byte[] b) {
        return b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
    }

    private static boolean isPng(byte[] b) {
        return b.length >= 4 && (b[0] & 0xFF) == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47;
    }
}

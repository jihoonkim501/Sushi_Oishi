package com.sushioishi.inference;

/**
 * 모델 입력(F2-2): 기준 이미지를 640x640 letterbox로 변환한 결과.
 *
 * @param tensor 길이 3*640*640, NCHW, RGB, value/255
 * @param r      축소 비율 min(640/W, 640/H)
 * @param padX   좌우 패딩 (실수 유지)
 * @param padY   상하 패딩 (실수 유지)
 */
public record Letterbox(float[] tensor, int sourceWidth, int sourceHeight, double r, double padX, double padY) {

    public static final int SIZE = 640;

    /** letterbox 안에서 실제 이미지가 차지하는 너비. */
    public int contentWidth() {
        return (int) Math.round(sourceWidth * r);
    }

    public int contentHeight() {
        return (int) Math.round(sourceHeight * r);
    }
}

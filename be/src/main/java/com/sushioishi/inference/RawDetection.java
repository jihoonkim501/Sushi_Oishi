package com.sushioishi.inference;

/** 모델 출력 한 개. 좌표는 640x640 letterbox 공간의 중심/크기 (F2-2 5단계). */
public record RawDetection(double cx, double cy, double w, double h, int classIndex, double confidence) {
}

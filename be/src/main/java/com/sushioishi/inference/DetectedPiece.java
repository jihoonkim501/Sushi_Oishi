package com.sushioishi.inference;

/** 후처리를 마친 탐지 결과. 좌표는 기준 이미지 픽셀, classId는 labels로 변환된 값 (BR-DET-06). */
public record DetectedPiece(String classId, double confidence, int x1, int y1, int x2, int y2) {
}

package com.sushioishi.common;

import org.springframework.http.HttpStatus;

/** PROJECT_SPEC 7.2 / FUNCTIONAL_SPEC 6.7 오류 코드표. */
public enum ErrorCode {
    INVALID_DEVICE_ID(HttpStatus.BAD_REQUEST, "기기 정보를 확인할 수 없어요."),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "요청 형식이 올바르지 않아요."),
    INVALID_IMAGE(HttpStatus.BAD_REQUEST, "사진을 읽을 수 없어요."),
    INVALID_CLASS_ID(HttpStatus.BAD_REQUEST, "알 수 없는 초밥 종류예요."),
    SCAN_NOT_FOUND(HttpStatus.NOT_FOUND, "결과를 찾을 수 없어요."),
    ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 초밥을 찾을 수 없어요."),
    IMAGE_TOO_LARGE(HttpStatus.CONTENT_TOO_LARGE, "사진이 너무 커요."),
    UNSUPPORTED_FORMAT(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "지원하지 않는 사진 형식이에요."),
    NO_SUSHI_DETECTED(HttpStatus.UNPROCESSABLE_CONTENT, "초밥을 찾지 못했어요."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 주소를 찾을 수 없어요."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 요청 방식이에요."),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "잠시 후 다시 시도해주세요."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "잠시 문제가 생겼어요."),
    MODEL_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "지금은 분석할 수 없어요."),
    SERVER_BUSY(HttpStatus.SERVICE_UNAVAILABLE, "사용자가 많아요. 잠시 후 다시 시도해주세요.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public HttpStatus status() {
        return status;
    }

    public String message() {
        return message;
    }
}

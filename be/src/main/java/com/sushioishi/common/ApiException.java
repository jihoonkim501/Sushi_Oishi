package com.sushioishi.common;

public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;
    private final Long retryAfterSeconds;

    public ApiException(ErrorCode errorCode) {
        this(errorCode, null);
    }

    public ApiException(ErrorCode errorCode, Long retryAfterSeconds) {
        super(errorCode.name());
        this.errorCode = errorCode;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public ErrorCode errorCode() {
        return errorCode;
    }

    /** RATE_LIMITED 응답의 Retry-After 헤더 값(초). 해당 없으면 null. */
    public Long retryAfterSeconds() {
        return retryAfterSeconds;
    }
}

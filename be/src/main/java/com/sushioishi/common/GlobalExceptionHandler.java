package com.sushioishi.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** FUNCTIONAL_SPEC C-4: 모든 예외를 {code, message}로 변환한다. 프레임워크가 정한 4xx 상태는 유지한다. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorResponse> handleApi(ApiException e) {
        ResponseEntity.BodyBuilder builder = ResponseEntity.status(e.errorCode().status());
        if (e.retryAfterSeconds() != null) {
            builder.header(HttpHeaders.RETRY_AFTER, String.valueOf(e.retryAfterSeconds()));
        }
        return builder.body(ErrorResponse.of(e.errorCode()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ErrorResponse> handleTooLarge(MaxUploadSizeExceededException e) {
        return respond(ErrorCode.IMAGE_TOO_LARGE);
    }

    /** 깨진 multipart 본문(경계 없음, 파싱 실패 등). MaxUploadSize는 위 핸들러가 먼저 처리한다. */
    @ExceptionHandler(MultipartException.class)
    ResponseEntity<ErrorResponse> handleMultipart(MultipartException e) {
        return respond(ErrorCode.VALIDATION_ERROR);
    }

    /** 필수 파트·파라미터·헤더 누락(MissingServletRequestPart/Parameter 포함), 본문·타입 변환 오류. */
    @ExceptionHandler({
            ServletRequestBindingException.class,
            MissingServletRequestPartException.class,
            HttpMessageNotReadableException.class,
            MethodArgumentNotValidException.class,
            MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorResponse> handleValidation(Exception e) {
        return respond(ErrorCode.VALIDATION_ERROR);
    }

    /** 프레임워크가 상태를 정한 예외는 그 상태를 유지한다. 404/405는 전용 코드를 쓴다. */
    @ExceptionHandler({
            NoResourceFoundException.class,
            HttpRequestMethodNotSupportedException.class,
            HttpMediaTypeNotSupportedException.class,
            HttpMediaTypeNotAcceptableException.class,
            ErrorResponseException.class,
            ResponseStatusException.class})
    ResponseEntity<ErrorResponse> handleFrameworkStatus(org.springframework.web.ErrorResponse e) {
        HttpStatusCode status = e.getStatusCode();
        ErrorCode code;
        if (status.value() == 404) {
            code = ErrorCode.NOT_FOUND;
        } else if (status.value() == 405) {
            code = ErrorCode.METHOD_NOT_ALLOWED;
        } else if (status.is5xxServerError()) {
            code = ErrorCode.INTERNAL_ERROR;
        } else {
            code = ErrorCode.VALIDATION_ERROR;
        }
        ResponseEntity.BodyBuilder builder = ResponseEntity.status(status);
        e.getHeaders().forEach((name, values) -> builder.header(name, values.toArray(String[]::new)));
        return builder.body(ErrorResponse.of(code));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> handleUnexpected(Exception e) {
        log.error("unhandled exception", e);
        return respond(ErrorCode.INTERNAL_ERROR);
    }

    private static ResponseEntity<ErrorResponse> respond(ErrorCode code) {
        HttpStatus status = code.status();
        return ResponseEntity.status(status).body(ErrorResponse.of(code));
    }
}

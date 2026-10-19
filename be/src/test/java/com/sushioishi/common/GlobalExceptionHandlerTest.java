package com.sushioishi.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.http.HttpMethod;

/** FR-ERR-002~004 (C-4): 프레임워크 예외도 계약된 {code, message} 형식과 올바른 상태로 변환된다. */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void FR_ERR_002_broken_multipart_is_400_validation_error() {
        ResponseEntity<ErrorResponse> r = handler.handleMultipart(new MultipartException("bad boundary"));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(r.getBody().code()).isEqualTo("VALIDATION_ERROR");
    }

    @Test
    void FR_ERR_002_missing_header_binding_error_is_400() {
        ResponseEntity<ErrorResponse> r = handler.handleValidation(new MissingRequestHeaderException("x", null));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void FR_ERR_002_unknown_route_is_404_not_found_code() {
        ResponseEntity<ErrorResponse> r =
                handler.handleFrameworkStatus(new NoResourceFoundException(HttpMethod.GET, "/nope", "nope"));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(r.getBody().code()).isEqualTo("NOT_FOUND");
    }

    @Test
    void FR_ERR_002_wrong_method_is_405_with_allow_header() {
        ResponseEntity<ErrorResponse> r = handler.handleFrameworkStatus(
                new HttpRequestMethodNotSupportedException("DELETE", java.util.List.of("GET")));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
        assertThat(r.getBody().code()).isEqualTo("METHOD_NOT_ALLOWED");
        assertThat(r.getHeaders().getFirst("Allow")).isEqualTo("GET");
    }

    @Test
    void FR_ERR_002_not_acceptable_keeps_406() {
        ResponseEntity<ErrorResponse> r = handler.handleFrameworkStatus(
                new HttpMediaTypeNotAcceptableException(java.util.List.of()));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.NOT_ACCEPTABLE);
    }

    @Test
    void FR_ERR_002_response_status_exception_keeps_its_status() {
        assertThat(handler.handleFrameworkStatus(new ResponseStatusException(HttpStatus.FORBIDDEN))
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(handler.handleFrameworkStatus(new ErrorResponseException(HttpStatus.CONFLICT))
                .getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        ResponseEntity<ErrorResponse> r = handler.handleFrameworkStatus(new ResponseStatusException(HttpStatus.BAD_GATEWAY));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(r.getBody().code()).isEqualTo("INTERNAL_ERROR");
    }

    @Test
    void FR_ERR_003_unexpected_exception_is_500_with_fixed_message() {
        ResponseEntity<ErrorResponse> r = handler.handleUnexpected(new IllegalStateException("secret detail"));
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(r.getBody().message()).isEqualTo("잠시 문제가 생겼어요.");
    }
}

package com.sushioishi.common;

import java.util.UUID;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/** FUNCTIONAL_SPEC C-1: X-Device-Id 헤더를 읽는 유일한 지점(읽기 전용, DB에 쓰지 않음). 컨트롤러는 {@link DeviceId} 파라미터로 받는다. */
@Component
public class DeviceIdArgumentResolver implements HandlerMethodArgumentResolver {

    public static final String HEADER = "X-Device-Id";

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return DeviceId.class.equals(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        return parse(webRequest.getHeader(HEADER));
    }

    static DeviceId parse(String header) {
        if (header == null || header.length() != 36) {
            throw new ApiException(ErrorCode.INVALID_DEVICE_ID);
        }
        try {
            return new DeviceId(UUID.fromString(header));
        } catch (IllegalArgumentException e) {
            throw new ApiException(ErrorCode.INVALID_DEVICE_ID);
        }
    }
}

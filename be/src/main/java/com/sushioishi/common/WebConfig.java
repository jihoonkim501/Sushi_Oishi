package com.sushioishi.common;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
class WebConfig implements WebMvcConfigurer {

    private final DeviceIdArgumentResolver deviceIdResolver;

    WebConfig(DeviceIdArgumentResolver deviceIdResolver) {
        this.deviceIdResolver = deviceIdResolver;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(deviceIdResolver);
    }
}

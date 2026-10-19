package com.sushioishi.inference;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** {@code sushioishi.inference.*}. 기본값은 FUNCTIONAL_SPEC F2-2/F2-3 기준. */
@ConfigurationProperties(prefix = "sushioishi.inference")
public record InferenceProperties(Integer maxConcurrency, Double minConfidence, Duration queueTimeout, String detector) {

    public InferenceProperties {
        maxConcurrency = maxConcurrency == null ? 2 : maxConcurrency;
        minConfidence = minConfidence == null ? 0.40 : minConfidence;
        queueTimeout = queueTimeout == null ? Duration.ofSeconds(10) : queueTimeout;
    }
}

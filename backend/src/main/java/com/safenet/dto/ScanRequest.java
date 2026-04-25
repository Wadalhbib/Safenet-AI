package com.safenet.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

/**
 * What comes INTO /v1/scan.
 * Node.js parallel: req.body shape in Express.
 */
@Data
public class ScanRequest {

    @NotBlank(message = "URL is required")
    private String url;

    private String userId = "anonymous";
    private String deviceType = "API";      // EXTENSION | MOBILE | API
    private boolean bypassAttempt = false;  // True if user clicked "proceed anyway"
}

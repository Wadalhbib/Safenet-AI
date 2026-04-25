package com.safenet.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

/**
 * What goes OUT of /v1/scan.
 * Node.js parallel: res.json({ ... }) shape.
 *
 * Example response:
 * {
 *   "riskScore": 95,
 *   "severity": "HIGH",
 *   "scannedDomain": "lhdn-refund.xyz",
 *   "reasons": ["Known scam domain: LHDN Clone", "Suspicious TLD: .xyz"],
 *   "recommendation": "Do NOT proceed. This site is impersonating LHDN.",
 *   "guardianAlerted": true,
 *   "scanDurationMs": 12
 * }
 */
@Data
@Builder
public class ScanResponse {
    private int riskScore;              // 0–100
    private String severity;            // LOW | MEDIUM | HIGH
    private String scannedDomain;
    private List<String> reasons;
    private String recommendation;      // Plain-English/Malay advice
    private boolean guardianAlerted;    // Family Alert triggered?
    private long scanDurationMs;        // Latency tracking for pitch
}

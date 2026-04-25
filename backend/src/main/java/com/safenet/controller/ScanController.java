package com.safenet.controller;

import com.safenet.dto.ScanRequest;
import com.safenet.dto.ScanResponse;
import com.safenet.model.AuditLog;
import com.safenet.repository.AuditLogRepository;
import com.safenet.repository.BlacklistRepository;
import com.safenet.service.FamilyAlertService;
import com.safenet.service.ScanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST API for SafeNet AI.
 *
 * Node.js parallel: This is your Express router file.
 * @RestController = express.Router() + res.json() auto-applied
 * @RequestMapping = app.use('/v1', router)
 * @PostMapping    = router.post('/scan', handler)
 */
@RestController
@RequestMapping("/v1")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ScanController {

    private final ScanService scanService;
    private final AuditLogRepository auditLogRepository;
    private final BlacklistRepository blacklistRepository;
    private final FamilyAlertService familyAlertService;

    /**
     * Primary scan endpoint.
     * POST /v1/scan
     * Body: { "url": "...", "userId": "...", "deviceType": "EXTENSION" }
     */
    @PostMapping("/scan")
    public ResponseEntity<ScanResponse> scan(@Valid @RequestBody ScanRequest request) {
        ScanResponse response = scanService.scan(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Report bypass — user saw warning and clicked "proceed anyway".
     * This triggers the Family Alert if guardian is linked.
     * POST /v1/bypass
     */
    @PostMapping("/bypass")
    public ResponseEntity<ScanResponse> reportBypass(@Valid @RequestBody ScanRequest request) {
        request.setBypassAttempt(true);
        ScanResponse response = scanService.scan(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get scan history for a user (used by mobile app dashboard).
     * GET /v1/history/{userId}
     */
    @GetMapping("/history/{userId}")
    public ResponseEntity<List<AuditLog>> getHistory(@PathVariable String userId) {
        List<AuditLog> logs = auditLogRepository
            .findByUserIdOrderByScannedAtDesc(userId);
        return ResponseEntity.ok(logs);
    }

    /**
     * Link guardian to user (Family Alert setup).
     * POST /v1/guardian/link
     */
    @PostMapping("/guardian/link")
    public ResponseEntity<Map<String, String>> linkGuardian(
            @RequestBody Map<String, Object> body) {
        int threshold = body.containsKey("alertThreshold")
            ? ((Number) body.get("alertThreshold")).intValue()
            : 75;
        familyAlertService.linkGuardian(
            (String) body.get("userId"),
            (String) body.get("userDisplayName"),
            (String) body.get("guardianId"),
            (String) body.get("guardianDisplayName"),
            (String) body.get("guardianFcmToken"),
            threshold
        );
        return ResponseEntity.ok(Map.of("status", "Guardian linked successfully ✅"));
    }

    /**
     * Stats endpoint — used on mobile dashboard and pitch demo.
     * GET /v1/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        LocalDateTime since24h = LocalDateTime.now().minusHours(24);
        return ResponseEntity.ok(Map.of(
            "totalScans24h",     auditLogRepository.countSince(since24h),
            "highRiskBlocked24h", auditLogRepository.countHighRiskSince(since24h),
            "blacklistSize",      blacklistRepository.countByActiveTrue(),
            "status",             "operational"
        ));
    }

    /**
     * Health check — used during live demo.
     * GET /v1/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status",    "SafeNet AI is running ✅",
            "version",   "1.0.0",
            "hackathon", "ICYOUTH 2026",
            "timestamp", LocalDateTime.now().toString()
        ));
    }
}

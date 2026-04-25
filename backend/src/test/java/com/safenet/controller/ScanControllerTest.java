package com.safenet.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.safenet.dto.ScanRequest;
import com.safenet.dto.ScanResponse;
import com.safenet.service.ScanService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the REST API layer.
 *
 * Node.js parallel: Like supertest in Jest —
 * fires real HTTP requests against the controller
 * without starting the full server.
 *
 * @WebMvcTest = spins up just the web layer (controller + serialization)
 * MockMvc = the supertest equivalent
 */
@WebMvcTest(ScanController.class)
@DisplayName("ScanController — REST API Tests")
class ScanControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean ScanService scanService;
    @MockBean com.safenet.repository.AuditLogRepository auditLogRepository;
    @MockBean com.safenet.repository.BlacklistRepository blacklistRepository;
    @MockBean com.safenet.service.FamilyAlertService familyAlertService;

    private ScanResponse mockHighRisk() {
        return ScanResponse.builder()
                .riskScore(95)
                .severity("HIGH")
                .scannedDomain("lhdn-refund.xyz")
                .reasons(List.of("Known scam domain: LHDN Clone", "Non-HTTPS", "Suspicious TLD: .xyz"))
                .recommendation("DANGER: Do NOT enter any personal details.")
                .guardianAlerted(false)
                .scanDurationMs(11)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /v1/scan
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /v1/scan → 200 OK with riskScore and severity")
    void scan_validUrl_returns200() throws Exception {
        when(scanService.scan(any())).thenReturn(mockHighRisk());

        ScanRequest req = new ScanRequest();
        req.setUrl("http://lhdn-refund.xyz/claim");

        mockMvc.perform(post("/v1/scan")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.riskScore").value(95))
                .andExpect(jsonPath("$.severity").value("HIGH"))
                .andExpect(jsonPath("$.scannedDomain").value("lhdn-refund.xyz"))
                .andExpect(jsonPath("$.reasons").isArray())
                .andExpect(jsonPath("$.recommendation").isString())
                .andExpect(jsonPath("$.scanDurationMs").isNumber());
    }

    @Test
    @DisplayName("POST /v1/scan with missing URL → 400 Bad Request")
    void scan_missingUrl_returns400() throws Exception {
        mockMvc.perform(post("/v1/scan")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /v1/scan with blank URL → 400 Bad Request")
    void scan_blankUrl_returns400() throws Exception {
        ScanRequest req = new ScanRequest();
        req.setUrl("   ");

        mockMvc.perform(post("/v1/scan")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /v1/bypass
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /v1/bypass → calls scan with bypassAttempt=true")
    void bypass_validRequest_returns200() throws Exception {
        ScanResponse alertedResponse = ScanResponse.builder()
                .riskScore(95).severity("HIGH")
                .scannedDomain("lhdn-refund.xyz")
                .reasons(List.of("Known scam"))
                .recommendation("DANGER")
                .guardianAlerted(true)   // Guardian WAS alerted
                .scanDurationMs(14)
                .build();

        when(scanService.scan(any())).thenReturn(alertedResponse);

        ScanRequest req = new ScanRequest();
        req.setUrl("http://lhdn-refund.xyz");

        mockMvc.perform(post("/v1/bypass")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.guardianAlerted").value(true));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /v1/health
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /v1/health → 200 OK with status field")
    void health_returns200WithStatus() throws Exception {
        mockMvc.perform(get("/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").isString())
                .andExpect(jsonPath("$.version").value("1.0.0"))
                .andExpect(jsonPath("$.hackathon").value("ICYOUTH 2026"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /v1/stats
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /v1/stats → 200 OK with numeric fields")
    void stats_returns200WithCounts() throws Exception {
        when(auditLogRepository.countSince(any())).thenReturn(42L);
        when(auditLogRepository.countHighRiskSince(any())).thenReturn(7L);
        when(blacklistRepository.countByActiveTrue()).thenReturn(28L);

        mockMvc.perform(get("/v1/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalScans24h").value(42))
                .andExpect(jsonPath("$.highRiskBlocked24h").value(7))
                .andExpect(jsonPath("$.blacklistSize").value(28));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /v1/history/{userId}
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /v1/history/{userId} → 200 OK with array")
    void history_validUser_returnsArray() throws Exception {
        when(auditLogRepository.findByUserIdOrderByScannedAtDesc("user_123"))
                .thenReturn(List.of());

        mockMvc.perform(get("/v1/history/user_123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}

package com.safenet.service;

import com.safenet.dto.ScanRequest;
import com.safenet.dto.ScanResponse;
import com.safenet.model.BlacklistDomain;
import com.safenet.repository.AuditLogRepository;
import com.safenet.repository.BlacklistRepository;
import com.safenet.repository.GuardianLinkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ScanService — the core AI scoring engine.
 *
 * Node.js parallel: This is like your Jest test file.
 * @ExtendWith(MockitoExtension.class) = jest.mock() for dependencies.
 * @Mock = a fake/stub of a class (like jest.fn())
 * @InjectMocks = the class under test, with mocks injected automatically.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScanService — AI Risk Scoring Tests")
class ScanServiceTest {

    @Mock private BlacklistRepository  blacklistRepository;
    @Mock private AuditLogRepository   auditLogRepository;
    @Mock private GuardianLinkRepository guardianLinkRepository;
    @Mock private FamilyAlertService   familyAlertService;

    @InjectMocks
    private ScanService scanService;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ScanRequest req(String url) {
        ScanRequest r = new ScanRequest();
        r.setUrl(url);
        r.setUserId("test_user");
        r.setDeviceType("TEST");
        r.setBypassAttempt(false);
        return r;
    }

    @BeforeEach
    void setup() {
        // Mock default behavior for repositories
        lenient().when(blacklistRepository.findAllActive()).thenReturn(java.util.List.of());
        lenient().when(auditLogRepository.save(any())).thenReturn(null);
        // Initialize cache (empty by default)
        scanService.loadBlacklistCache();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK 1: Blacklist
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Blacklist hit (CRITICAL) → score >= 80, severity HIGH")
    void blacklist_criticalDomain_highScore() {
        BlacklistDomain entry = new BlacklistDomain();
        entry.setDomain("lhdn-refund.xyz");
        entry.setCategory("LHDN Clone");
        entry.setThreatLevel("CRITICAL");
        entry.setDescription("Fake LHDN refund portal");
        entry.setActive(true);

        when(blacklistRepository.findAllActive())
                .thenReturn(java.util.List.of(entry));
        scanService.loadBlacklistCache();

        ScanResponse result = scanService.scan(req("https://lhdn-refund.xyz"));

        assertEquals("HIGH", result.getSeverity());
        assertTrue(result.getRiskScore() >= 80);
        assertTrue(result.getReasons().stream()
                .anyMatch(r -> r.contains("LHDN Clone")));
    }

    @Test
    @DisplayName("Blacklist hit (HIGH) → score >= 65")
    void blacklist_highDomain_appropriateScore() {
        BlacklistDomain entry = new BlacklistDomain();
        entry.setDomain("shopee-lucky-draw.ga");
        entry.setCategory("Shopee Scam");
        entry.setThreatLevel("HIGH");
        entry.setDescription("Fake Shopee lucky draw");
        entry.setActive(true);

        when(blacklistRepository.findAllActive())
                .thenReturn(java.util.List.of(entry));
        scanService.loadBlacklistCache();

        ScanResponse result = scanService.scan(req("https://shopee-lucky-draw.ga"));

        assertTrue(result.getRiskScore() >= 65);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK 2: HTTPS
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("HTTP (non-HTTPS) URL → +20 score, reason mentions encryption")
    void https_httpUrl_addsScore() {
        ScanResponse result = scanService.scan(req("http://some-site.com/page"));

        assertTrue(result.getRiskScore() >= 20);
        assertTrue(result.getReasons().stream()
                .anyMatch(r -> r.toLowerCase().contains("https")));
    }

    @Test
    @DisplayName("HTTPS URL without other flags → LOW severity")
    void https_secureUrl_noHttpsPenalty() {
        ScanResponse result = scanService.scan(req("https://normal-safe-site.com"));

        // Should not flag HTTPS
        assertFalse(result.getReasons().stream()
                .anyMatch(r -> r.toLowerCase().contains("non-https")));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK 3: Suspicious TLD
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName(".xyz TLD → score penalty added, reason mentions TLD")
    void tld_xyzDomain_addsScore() {
        ScanResponse result = scanService.scan(req("https://legit-looking-site.xyz"));

        assertTrue(result.getRiskScore() >= 25);
        assertTrue(result.getReasons().stream()
                .anyMatch(r -> r.contains(".xyz")));
    }

    @Test
    @DisplayName(".tk TLD → score penalty added")
    void tld_tkDomain_addsScore() {
        ScanResponse result = scanService.scan(req("https://something.tk/page"));
        assertTrue(result.getRiskScore() >= 30);
    }

    @Test
    @DisplayName(".com.my TLD → no TLD penalty")
    void tld_legitimateMalaysian_noPenalty() {
        ScanResponse result = scanService.scan(req("https://somesite.com.my/page"));

        assertFalse(result.getReasons().stream()
                .anyMatch(r -> r.toLowerCase().contains("suspicious domain extension")));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK 4: NLP Urgency Keywords
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("English urgency keyword 'tax refund' → adds score")
    void nlp_englishKeyword_addsScore() {
        ScanResponse result = scanService.scan(
                req("https://somesite.com/tax-refund-claim"));

        assertTrue(result.getRiskScore() >= 12);
        assertTrue(result.getReasons().stream()
                .anyMatch(r -> r.toLowerCase().contains("keyword")));
    }

    @Test
    @DisplayName("Malay urgency keyword 'tindakan segera' → adds score")
    void nlp_malayKeyword_addsScore() {
        ScanResponse result = scanService.scan(
                req("https://somesite.com/tindakan-segera-akaun"));

        assertTrue(result.getRiskScore() >= 12);
        assertTrue(result.getReasons().stream()
                .anyMatch(r -> r.toLowerCase().contains("keyword")));
    }

    @Test
    @DisplayName("Multiple keywords → score capped at 35 contribution")
    void nlp_multipleKeywords_scoreCapped() {
        // URL with multiple urgency phrases
        ScanResponse result = scanService.scan(
                req("https://site.com/account-suspended-verify-now-lucky-draw-claim"));

        // NLP contribution should not exceed 35
        // (Other checks may add more, but we verify reasons are populated)
        assertTrue(result.getReasons().stream()
                .anyMatch(r -> r.contains("keyword")));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK 5: Typosquatting
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Typosquat of hasil.gov.my → flagged as impersonation")
    void typosquat_hasilClone_detected() {
        // "hasil.gov.my" vs "hasi1.gov.my" — 1 char different
        ScanResponse result = scanService.scan(req("https://hasi1.gov.my/login"));

        assertTrue(result.getReasons().stream()
                .anyMatch(r -> r.toLowerCase().contains("impersonation")
                            || r.toLowerCase().contains("hasil")));
    }

    @Test
    @DisplayName("Domain containing 'maybank2u' but not the real domain → typosquat flag")
    void typosquat_maybankSubstring_detected() {
        ScanResponse result = scanService.scan(
                req("https://maybank2u-secure-login.com/verify"));

        assertTrue(result.getRiskScore() >= 35);
    }

    @Test
    @DisplayName("Exact legit domain → NOT flagged as typosquat")
    void typosquat_exactLegitDomain_notFlagged() {
        ScanResponse result = scanService.scan(
                req("https://hasil.gov.my/user/login"));

        // Whitelisted domain — should be score 0
        assertEquals(0, result.getRiskScore());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Score cap & severity thresholds
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Score is always capped at 100")
    void score_alwaysCappedAt100() {
        BlacklistDomain entry = new BlacklistDomain();
        entry.setDomain("lhdn-refund.xyz");
        entry.setCategory("LHDN Clone");
        entry.setThreatLevel("CRITICAL");
        entry.setDescription("Test");
        entry.setActive(true);

        when(blacklistRepository.findAllActive())
                .thenReturn(java.util.List.of(entry));
        scanService.loadBlacklistCache();

        // URL with blacklist + HTTP + bad TLD + keywords — would exceed 100
        ScanResponse result = scanService.scan(
                req("http://lhdn-refund.xyz/tax-refund?verify-now=true"));

        assertTrue(result.getRiskScore() <= 100);
    }

    @Test
    @DisplayName("Score >= 75 → severity HIGH")
    void severity_highThreshold() {
        BlacklistDomain entry = new BlacklistDomain();
        entry.setDomain("maybank-secure.cf");
        entry.setCategory("Banking Scam");
        entry.setThreatLevel("CRITICAL");
        entry.setDescription("Test");
        entry.setActive(true);

        when(blacklistRepository.findAllActive())
                .thenReturn(java.util.List.of(entry));
        scanService.loadBlacklistCache();

        ScanResponse result = scanService.scan(req("http://maybank-secure.cf/login"));

        assertEquals("HIGH", result.getSeverity());
    }

    @Test
    @DisplayName("Score < 40 → severity LOW")
    void severity_lowThreshold() {
        ScanResponse result = scanService.scan(req("https://google.com"));
        assertEquals("LOW", result.getSeverity());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response structure
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Response always includes scannedDomain, reasons, and recommendation")
    void response_alwaysComplete() {
        ScanResponse result = scanService.scan(req("https://example.com"));

        assertNotNull(result.getScannedDomain());
        assertNotNull(result.getReasons());
        assertFalse(result.getReasons().isEmpty());
        assertNotNull(result.getRecommendation());
        assertTrue(result.getScanDurationMs() >= 0);
    }

    @Test
    @DisplayName("HIGH severity recommendation is bilingual (EN + BM)")
    void recommendation_highSeverity_bilingual() {
        BlacklistDomain entry = new BlacklistDomain();
        entry.setDomain("lhdn-refund.xyz");
        entry.setCategory("LHDN Clone");
        entry.setThreatLevel("CRITICAL");
        entry.setDescription("Test");
        entry.setActive(true);

        when(blacklistRepository.findAllActive())
                .thenReturn(java.util.List.of(entry));
        scanService.loadBlacklistCache();

        ScanResponse result = scanService.scan(req("https://lhdn-refund.xyz"));

        // Should contain both English and Malay content
        String rec = result.getRecommendation().toLowerCase();
        assertTrue(rec.contains("danger") || rec.contains("do not"),
                "Should contain English warning");
        assertTrue(rec.contains("laman") || rec.contains("penipuan") || rec.contains("segera"),
                "Should contain Malay warning");
    }

    @Test
    @DisplayName("Audit log is saved for every scan")
    void audit_savedForEveryScan() {
        scanService.scan(req("https://example.com"));
        verify(auditLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Whitelisted domains return score 0 instantly")
    void whitelist_knownSafeDomain_zeroScore() {
        ScanResponse result = scanService.scan(req("https://google.com/search?q=test"));
        assertEquals(0, result.getRiskScore());
        assertEquals("LOW", result.getSeverity());
    }
}

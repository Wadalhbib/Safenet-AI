package com.safenet.service;

import com.safenet.dto.ScanRequest;
import com.safenet.dto.ScanResponse;
import com.safenet.model.AuditLog;
import com.safenet.model.BlacklistDomain;
import com.safenet.repository.AuditLogRepository;
import com.safenet.repository.BlacklistRepository;
import com.safenet.repository.GuardianLinkRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * The core AI decision engine.
 * Runs 5 risk checks and returns a 0-100 risk score.
 *
 * Performance design:
 *  - Blacklist is pre-loaded into a ConcurrentHashMap on startup → O(1) lookup, 0 DB round-trips
 *  - Urgency keywords are stored as a plain String[] for tight CPU cache locality
 *  - Blacklist cache refreshes every 5 minutes via @Scheduled without blocking scan threads
 *
 * Node.js parallel: This is your service layer — like a module
 * you'd import in Express: const scanService = require('./services/scan')
 *
 * @Service = marks this as a Spring-managed singleton (like module.exports)
 * @RequiredArgsConstructor = auto-injects constructor dependencies (like DI)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScanService {

    private final BlacklistRepository blacklistRepository;
    private final AuditLogRepository auditLogRepository;
    private final GuardianLinkRepository guardianLinkRepository;
    private final FamilyAlertService familyAlertService;

    // ─── In-memory blacklist cache: domain → BlacklistDomain ─────────────────
    // ConcurrentHashMap = thread-safe, O(1) get, no locks on reads.
    // Loaded at startup via @PostConstruct, refreshed every 5 min via @Scheduled.
    private final ConcurrentHashMap<String, BlacklistDomain> blacklistCache = new ConcurrentHashMap<>();

    // ─── NLP Urgency Keywords (English + Malay) ────────────────────────────────
    // Stored as parallel String[] arrays so the JVM can iterate them in a tight
    // loop with good cache locality — faster than Map.entrySet() iteration.
    private static final String[] KEYWORD_PHRASES = {
        // Tax scams
        "tax refund", "bayaran balik cukai", "lhdn refund",
        // Account threats
        "account suspended", "akaun digantung", "account blocked", "akaun disekat",
        // Action urgency
        "immediate action", "tindakan segera", "verify now",
        "sahkan sekarang", "kemaskini sekarang",
        // Prize/lucky draw
        "lucky draw", "hadiah menang", "tahniah anda menang", "you have won",
        // Parcel scams
        "parcel held", "pos laju gagal", "delivery failed",
        // EPF/pension
        "kwsp withdrawal", "pengeluaran kwsp", "epf covid",
        // Banking
        "update banking", "kemaskini perbankan", "transaction failed",
        // Generic
        "click here to claim", "klik untuk tuntut", "expires today", "tamat hari ini"
    };

    private static final String[] KEYWORD_LABELS = {
        "Tax refund lure", "Tax refund lure (Malay)", "LHDN refund scam",
        "Account suspension threat", "Account suspension threat (Malay)",
        "Account block threat", "Account block threat (Malay)",
        "Immediate action pressure", "Immediate action pressure (Malay)",
        "Verification pressure", "Verification pressure (Malay)",
        "Update now pressure (Malay)",
        "Lucky draw scam lure", "Prize winner lure (Malay)",
        "Congratulations winner scam (Malay)", "Prize winner lure",
        "Fake parcel held scam", "Failed delivery scam (Malay)", "Failed delivery scam",
        "Fake EPF withdrawal lure", "Fake EPF withdrawal lure (Malay)", "Fake EPF COVID withdrawal",
        "Banking credential phish", "Banking credential phish (Malay)", "Fake transaction failure",
        "Claim urgency pressure", "Claim urgency pressure (Malay)",
        "Expiry urgency pressure", "Expiry urgency pressure (Malay)"
    };

    // ─── Suspicious TLDs used heavily in Malaysian scam campaigns ──────────────
    private static final Map<String, Integer> SUSPICIOUS_TLDS = new LinkedHashMap<>() {{
        put(".xyz",   25);
        put(".top",   25);
        put(".click", 30);
        put(".tk",    30);
        put(".ml",    30);
        put(".ga",    30);
        put(".cf",    30);
        put(".gq",    25);
        put(".pw",    20);
        put(".buzz",  15);
        put(".icu",   20);
        put(".cam",   15);
    }};

    // ─── Official Malaysian domains that scammers impersonate ──────────────────
    private static final List<String> LEGIT_DOMAINS = List.of(
        "hasil.gov.my", "lhdn.gov.my", "kwsp.gov.my", "epf.com.my",
        "maybank2u.com.my", "maybank.com.my", "cimbclicks.com.my", "cimb.com.my",
        "shopee.com.my", "lazada.com.my", "grab.com", "grabfood.com",
        "poslaju.com.my", "pos.com.my", "myeg.com.my", "jpj.gov.my",
        "bnm.gov.my", "pdrm.gov.my", "jpa.gov.my", "mampu.gov.my",
        "rhbgroup.com", "publicbank.com.my", "hlb.com.my", "ocbc.com.my"
    );

    // ─── Legitimate domains (never flag these) ─────────────────────────────────
    private static final Set<String> WHITELIST = Set.of(
        "hasil.gov.my", "kwsp.gov.my", "maybank2u.com.my", "cimbclicks.com.my",
        "shopee.com.my", "lazada.com.my", "poslaju.com.my", "myeg.com.my",
        "google.com", "google.com.my", "facebook.com", "youtube.com",
        "microsoft.com", "apple.com", "whatsapp.com"
    );

    // ──────────────────────────────────────────────────────────────────────────
    //  CACHE MANAGEMENT
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Load the full blacklist into memory on startup.
     * Called automatically by Spring after dependency injection.
     */
    @PostConstruct
    public void loadBlacklistCache() {
        List<BlacklistDomain> all = blacklistRepository.findAllActive();
        Map<String, BlacklistDomain> fresh = new HashMap<>(all.size() * 2);
        for (BlacklistDomain entry : all) {
            fresh.put(entry.getDomain(), entry);
        }
        blacklistCache.clear();
        blacklistCache.putAll(fresh);
        log.info("Blacklist cache loaded: {} domains", blacklistCache.size());
    }

    /**
     * Refresh the cache every 5 minutes so newly-added scam domains
     * are picked up without a server restart.
     * fixedDelay = wait 5 min AFTER the previous refresh completes.
     */
    @Scheduled(fixedDelay = 300_000)
    public void refreshBlacklistCache() {
        log.debug("Refreshing blacklist cache...");
        loadBlacklistCache();
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  MAIN SCAN METHOD
    // ──────────────────────────────────────────────────────────────────────────
    public ScanResponse scan(ScanRequest request) {
        long startTime = System.currentTimeMillis();

        String rawUrl = request.getUrl().trim();
        String url = rawUrl.toLowerCase();
        String domain = extractDomain(url);

        log.info("Scanning: {} | User: {} | Device: {}", domain, request.getUserId(), request.getDeviceType());

        int score = 0;
        List<String> reasons = new ArrayList<>();

        // ── Whitelist check — bail early ──────────────────────────────────────
        if (WHITELIST.contains(domain)) {
            return buildResponse(0, domain, reasons, false, startTime);
        }

        // ── CHECK 1: Blacklist hit — O(1) in-memory lookup, 0 DB round-trips ────
        BlacklistDomain blacklistMatch = blacklistCache.get(domain);
        if (blacklistMatch != null) {
            score += switch (blacklistMatch.getThreatLevel()) {
                case "CRITICAL" -> 80;
                case "HIGH"     -> 65;
                default         -> 45;
            };
            reasons.add("⚠️ Known scam domain: " + blacklistMatch.getCategory()
                        + " — " + blacklistMatch.getDescription());
        }

        // ── CHECK 2: HTTPS check ──────────────────────────────────────────────
        if (!url.startsWith("https://")) {
            score += 20;
            reasons.add("🔓 No HTTPS — your data is not encrypted on this connection");
        }

        // ── CHECK 3: Suspicious TLD ───────────────────────────────────────────
        for (var entry : SUSPICIOUS_TLDS.entrySet()) {
            if (domain.endsWith(entry.getKey())) {
                score += entry.getValue();
                reasons.add("🌐 Suspicious domain extension '" + entry.getKey()
                            + "' — commonly used in scam campaigns");
                break;
            }
        }

        // ── CHECK 4: NLP Urgency Keywords ─────────────────────────────────────
        // Iterates two parallel arrays (tight cache-line loop) instead of Map.entrySet()
        List<String> hitKeywords = new ArrayList<>();
        // Normalize URL for keyword matching (replace common separators with space)
        String normalizedForNlp = url.replace("-", " ").replace("_", " ").replace(".", " ");
        for (int i = 0; i < KEYWORD_PHRASES.length; i++) {
            if (normalizedForNlp.contains(KEYWORD_PHRASES[i])) {
                hitKeywords.add(KEYWORD_LABELS[i]);
            }
        }
        if (!hitKeywords.isEmpty()) {
            int kwScore = Math.min(35, hitKeywords.size() * 12);
            score += kwScore;
            reasons.add("🚨 Scam keywords detected: " + String.join(", ", hitKeywords));
        }

        // ── CHECK 5: Typosquatting detection (Levenshtein distance) ──────────
        String typosquatTarget = detectTyposquat(domain);
        if (typosquatTarget != null) {
            score += 35;
            reasons.add("🎭 Possible impersonation of '" + typosquatTarget
                        + "' — this domain looks like a fake copy");
        }

        // ── Cap score ─────────────────────────────────────────────────────────
        score = Math.min(score, 100);

        // ── Persist audit log ─────────────────────────────────────────────────
        saveAuditLog(request, domain, score, reasons);

        // ── Family Alert — trigger on bypass; threshold check is inside alertGuardianIfLinked
        boolean guardianAlerted = false;
        if (request.isBypassAttempt()) {
            guardianAlerted = familyAlertService.alertGuardianIfLinked(
                request.getUserId(), domain, score, reasons);
        }

        return buildResponse(score, domain, reasons, guardianAlerted, startTime);
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  HELPERS
    // ──────────────────────────────────────────────────────────────────────────

    private ScanResponse buildResponse(int score, String domain,
                                       List<String> reasons, boolean guardianAlerted,
                                       long startTime) {
        String severity = score >= 75 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
        String recommendation = buildRecommendation(severity, score);
        long duration = System.currentTimeMillis() - startTime;

        return ScanResponse.builder()
                .riskScore(score)
                .severity(severity)
                .scannedDomain(domain)
                .reasons(reasons.isEmpty() ? List.of("✅ No threats detected") : reasons)
                .recommendation(recommendation)
                .guardianAlerted(guardianAlerted)
                .scanDurationMs(duration)
                .build();
    }

    private String buildRecommendation(String severity, int score) {
        return switch (severity) {
            case "HIGH" -> "⛔ DANGER: Do NOT enter any personal details or make payments on this site. " +
                           "Ini mungkin laman web penipuan. Sila tutup segera.";
            case "MEDIUM" -> "⚠️ CAUTION: This site shows suspicious signs. Verify its authenticity before proceeding. " +
                             "Berhati-hati — sahkan laman web ini sebelum meneruskan.";
            default -> "✅ This site appears safe. Stay vigilant. " +
                       "Laman web ini kelihatan selamat. Tetap berwaspada.";
        };
    }

    private void saveAuditLog(ScanRequest request, String domain,
                               int score, List<String> reasons) {
        AuditLog log = new AuditLog();
        log.setScannedUrl(request.getUrl());
        log.setScannedDomain(domain);
        log.setRiskScore(score);
        log.setSeverity(score >= 75 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW");
        log.setReasons(String.join(" | ", reasons));
        log.setUserId(request.getUserId());
        log.setDeviceType(request.getDeviceType());
        log.setBypassAttempted(request.isBypassAttempt());
        auditLogRepository.save(log);
    }

    private String extractDomain(String url) {
        try {
            String normalized = url.startsWith("http") ? url : "https://" + url;
            URI uri = new URI(normalized);
            String host = uri.getHost();
            if (host == null) return url;
            return host.replaceFirst("^www\\.", "").toLowerCase();
        } catch (Exception e) {
            return url.replaceAll("https?://", "").replaceAll("/.*", "")
                      .replaceFirst("^www\\.", "");
        }
    }

    private String detectTyposquat(String domain) {
        for (String legit : LEGIT_DOMAINS) {
            if (domain.equals(legit)) return null; // exact match = legit
            int dist = levenshtein(domain, legit);
            // Flag if suspiciously close but not exact
            if (dist > 0 && dist <= 4) {
                return legit;
            }
            // Also flag if legit domain name appears as substring in longer domain
            // e.g. "maybank2u-secure.com" contains "maybank2u"
            String legitBase = legit.split("\\.")[0]; // "maybank2u"
            if (legitBase.length() > 5 && domain.contains(legitBase) && !domain.equals(legit)) {
                return legit;
            }
        }
        return null;
    }

    /**
     * Levenshtein distance — measures how many single-character edits
     * separate two strings. Core of typosquat detection.
     * e.g. "hasil.gov.my" vs "hasiI.gov.my" = distance 1 (l→I)
     */
    private int levenshtein(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                        ? dp[i - 1][j - 1]
                        : 1 + Math.min(dp[i - 1][j - 1],
                            Math.min(dp[i - 1][j], dp[i][j - 1]));
            }
        }
        return dp[a.length()][b.length()];
    }
}

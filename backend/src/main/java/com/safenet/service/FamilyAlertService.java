package com.safenet.service;

import com.safenet.repository.GuardianLinkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Family Alert Service — Step 4 of the SafeNet AI roadmap.
 *
 * When a "User" (e.g. an elderly parent) tries to bypass a HIGH-risk
 * warning, this service fires a Firebase Cloud Messaging push notification
 * to the linked "Guardian's" phone.
 *
 * Setup required:
 * 1. Create a Firebase project at console.firebase.google.com
 * 2. Get your Server Key from Project Settings → Cloud Messaging
 * 3. Add FIREBASE_SERVER_KEY=your_key to application.properties or .env
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FamilyAlertService {

    private final GuardianLinkRepository guardianLinkRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${firebase.server.key:PLACEHOLDER_SET_IN_PROPERTIES}")
    private String firebaseServerKey;

    private static final String FCM_URL = "https://fcm.googleapis.com/fcm/send";

    /**
     * If the user has a linked guardian, send them a push notification.
     * Returns true if alert was sent successfully.
     */
    public boolean alertGuardianIfLinked(String userId, String domain,
                                          int riskScore, List<String> reasons) {
        var linkOpt = guardianLinkRepository.findByUserIdAndActiveTrue(userId);
        if (linkOpt.isEmpty()) {
            log.info("No guardian linked for user: {}", userId);
            return false;
        }

        var link = linkOpt.get();

        // Honour the guardian's chosen threshold (60 / 75 / 90)
        if (riskScore < link.getAlertThreshold()) {
            log.info("Risk score {} below guardian threshold {} for user: {}",
                     riskScore, link.getAlertThreshold(), userId);
            return false;
        }

        String userName = link.getUserDisplayName() != null
            ? link.getUserDisplayName() : "Your family member";

        String title = "🚨 SafeNet Alert — " + userName + " is in danger!";
        String body = userName + " tried to visit a HIGH-risk scam site: " + domain
                    + "\nRisk Score: " + riskScore + "/100"
                    + "\nThey attempted to bypass the warning. Please check on them immediately.";

        return sendFcmNotification(link.getGuardianFcmToken(), title, body,
                                   domain, riskScore, userId);
    }

    private boolean sendFcmNotification(String fcmToken, String title,
                                         String body, String domain,
                                         int riskScore, String userId) {
        // If running in demo mode (no real Firebase key), just log
        if (firebaseServerKey.equals("PLACEHOLDER_SET_IN_PROPERTIES")) {
            log.warn("⚠️  Firebase not configured. DEMO MODE: Would have sent alert to token: {}",
                     fcmToken.substring(0, Math.min(10, fcmToken.length())) + "...");
            log.info("📱 Alert content — Title: {} | Domain: {} | Score: {}", title, domain, riskScore);
            return true; // Return true so demo still works
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "key=" + firebaseServerKey);

            Map<String, Object> payload = Map.of(
                "to", fcmToken,
                "priority", "high",
                "notification", Map.of(
                    "title", title,
                    "body", body,
                    "sound", "default",
                    "badge", "1"
                ),
                "data", Map.of(
                    "type", "GUARDIAN_ALERT",
                    "domain", domain,
                    "riskScore", String.valueOf(riskScore),
                    "userId", userId,
                    "action", "OPEN_ALERT_SCREEN"
                )
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(FCM_URL, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ Guardian alert sent successfully for user: {}", userId);
                return true;
            } else {
                log.error("FCM send failed: {}", response.getStatusCode());
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to send guardian alert: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Link a user to a guardian. Called when guardian scans
     * a QR code in the mobile app to set up monitoring.
     */
    public void linkGuardian(String userId, String userDisplayName,
                              String guardianId, String guardianDisplayName,
                              String guardianFcmToken, int alertThreshold) {
        // Deactivate any existing link first
        guardianLinkRepository.findByUserIdAndActiveTrue(userId)
            .ifPresent(existing -> {
                existing.setActive(false);
                guardianLinkRepository.save(existing);
            });

        var link = new com.safenet.model.GuardianLink();
        link.setUserId(userId);
        link.setUserDisplayName(userDisplayName);
        link.setGuardianId(guardianId);
        link.setGuardianDisplayName(guardianDisplayName);
        link.setGuardianFcmToken(guardianFcmToken);
        link.setAlertThreshold(alertThreshold);
        link.setActive(true);
        guardianLinkRepository.save(link);
        link.setUserId(userId);
        link.setUserDisplayName(userDisplayName);
        link.setGuardianId(guardianId);
        link.setGuardianDisplayName(guardianDisplayName);
        link.setGuardianFcmToken(guardianFcmToken);
        link.setActive(true);
        guardianLinkRepository.save(link);

        log.info("Guardian link created: {} → {}", userId, guardianId);
    }
}

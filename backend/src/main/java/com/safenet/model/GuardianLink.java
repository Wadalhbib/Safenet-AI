package com.safenet.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Links a "User" (protected person, e.g. elderly parent) to
 * a "Guardian" (e.g. adult child) for the Family Alert feature.
 *
 * When User bypasses a HIGH risk warning, Guardian gets a push
 * notification via Firebase Cloud Messaging (FCM).
 */
@Entity
@Data
@NoArgsConstructor
@Table(name = "guardian_links")
public class GuardianLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String userId;              // The protected user's ID

    private String userDisplayName;     // e.g. "Mak", "Ayah"

    @Column(nullable = false)
    private String guardianId;          // The guardian's ID

    private String guardianDisplayName; // e.g. "Ahmad"

    @Column(nullable = false)
    private String guardianFcmToken;    // Firebase push token for guardian's device

    private String userFcmToken;        // Optional: push to user device too

    /**
     * Risk score threshold above which a guardian alert fires.
     * Set by the guardian in the app (60 / 75 / 90). Default 75.
     */
    @Column(nullable = false)
    private int alertThreshold = 75;

    @Column(nullable = false)
    private boolean active = true;

    private LocalDateTime linkedAt;

    @PrePersist
    public void prePersist() {
        linkedAt = LocalDateTime.now();
    }
}

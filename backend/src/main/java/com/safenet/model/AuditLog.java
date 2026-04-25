package com.safenet.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Records every scan performed — used by Family Alert system
 * to track when a user (e.g. elderly parent) hits high-risk sites.
 *
 * Node.js parallel: Mongoose document saved to MongoDB / SQLite row.
 */
@Entity
@Data
@NoArgsConstructor
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 2000)
    private String scannedUrl;

    @Column(nullable = false)
    private String scannedDomain;

    @Column(nullable = false)
    private int riskScore;          // 0–100

    @Column(nullable = false)
    private String severity;        // LOW / MEDIUM / HIGH

    @Column(length = 1000)
    private String reasons;         // Pipe-separated reason list

    private String userId;          // Anonymous or authenticated user ID
    private String deviceType;      // "EXTENSION" | "MOBILE" | "API"

    @Column(nullable = false)
    private boolean bypassAttempted = false;   // Did user try to proceed anyway?

    @Column(nullable = false)
    private LocalDateTime scannedAt;

    @PrePersist
    public void prePersist() {
        scannedAt = LocalDateTime.now();
    }
}

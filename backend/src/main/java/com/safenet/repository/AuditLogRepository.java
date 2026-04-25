package com.safenet.repository;

import com.safenet.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Get scan history for a user (for mobile dashboard)
    List<AuditLog> findByUserIdOrderByScannedAtDesc(String userId);

    // Get recent HIGH-risk scans for guardian alerts
    List<AuditLog> findByUserIdAndRiskScoreGreaterThanEqualOrderByScannedAtDesc(
        String userId, int minScore);

    // Get bypass attempts (user ignored warning) — critical for guardian alert
    List<AuditLog> findByUserIdAndBypassAttemptedTrueOrderByScannedAtDesc(String userId);

    // Stats: how many scans in last 24h
    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.scannedAt >= :since")
    long countSince(LocalDateTime since);

    // Stats: how many HIGH risk blocked today
    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.severity = 'HIGH' AND a.scannedAt >= :since")
    long countHighRiskSince(LocalDateTime since);
}

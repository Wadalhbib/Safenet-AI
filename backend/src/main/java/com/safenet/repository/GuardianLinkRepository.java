package com.safenet.repository;

import com.safenet.model.GuardianLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuardianLinkRepository extends JpaRepository<GuardianLink, Long> {

    Optional<GuardianLink> findByUserIdAndActiveTrue(String userId);

    List<GuardianLink> findByGuardianIdAndActiveTrue(String guardianId);

    boolean existsByUserIdAndActiveTrue(String userId);
}

package com.safenet.repository;

import com.safenet.model.BlacklistDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Node.js parallel: This is like your db.query() wrapper or Mongoose model.
 * Spring auto-generates SQL from method names:
 *   findByDomain("x") → SELECT * FROM blacklist_domains WHERE domain = 'x'
 */
@Repository
public interface BlacklistRepository extends JpaRepository<BlacklistDomain, Long> {

    Optional<BlacklistDomain> findByDomainAndActiveTrue(String domain);

    List<BlacklistDomain> findByCategoryAndActiveTrue(String category);

    @Query("SELECT b FROM BlacklistDomain b WHERE b.active = true ORDER BY b.category")
    List<BlacklistDomain> findAllActive();

    long countByActiveTrue();
}

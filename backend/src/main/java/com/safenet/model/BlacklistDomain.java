package com.safenet.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Represents a known Malaysian scam domain in the blacklist.
 *
 * Node.js parallel: This is your Mongoose schema / Sequelize model.
 * @Entity = model definition
 * @Table  = collection/table name
 * @Id     = _id / primary key
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "blacklist_domains",
       indexes = @Index(name = "idx_domain_active", columnList = "domain, active"))
public class BlacklistDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String domain;          // e.g. "lhdn-refund.xyz"

    @Column(nullable = false)
    private String category;        // e.g. "LHDN Clone", "Banking Scam"

    @Column(length = 500)
    private String description;     // Human-readable reason for flagging

    @Column(nullable = false)
    private String threatLevel;     // CRITICAL / HIGH / MEDIUM

    @Column(nullable = false)
    private boolean active = true;  // Soft delete support
}

package com.safenet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * SafeNet AI - Malaysian Scam Detection Engine
 * Built for ICYOUTH 2026 Hackathon
 *
 * Node.js parallel: This is your index.js / server.js entry point.
 * @SpringBootApplication = require('express') + app.listen() all in one.
 * @EnableScheduling = activates @Scheduled on ScanService (cache refresh every 5 min)
 */
@SpringBootApplication
@EnableScheduling
public class SafeNetApplication {

    public static void main(String[] args) {
        SpringApplication.run(SafeNetApplication.class, args);
        System.out.println("""
            
            ╔═══════════════════════════════════════════╗
            ║       SafeNet AI is running! 🛡️           ║
            ║   POST http://localhost:8080/v1/scan       ║
            ║   GET  http://localhost:8080/v1/health     ║
            ╚═══════════════════════════════════════════╝
            """);
    }
}

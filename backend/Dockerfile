# SafeNet AI — Backend Dockerfile
# Multi-stage build: compile with Maven, run with slim JRE

# ── Stage 1: Build ────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /build

# Copy pom first (Docker layer caching — only re-downloads deps if pom changes)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Stage 2: Run ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

# Copy built jar from build stage
COPY --from=build /build/target/safenet-ai-1.0.0.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/v1/health || exit 1

# Run
ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.datasource.url=jdbc:sqlite:/app/data/safenet.db", \
  "-jar", "app.jar"]

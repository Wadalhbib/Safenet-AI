# 🛡️ SafeNet AI
### Malaysian Online Scam Detection — ICYOUTH 2026 Hackathon

Real-time, AI-powered protection against online scams targeting Malaysians.
Covers browsers, mobile, and families — with bilingual support (English + Bahasa Malaysia).

---

## 🗺️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    SafeNet AI System                         │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │   Browser   │    │  Mobile App │    │  Family Alert   │  │
│  │  Extension  │    │ React Native│    │  Firebase FCM   │  │
│  │  (Chrome)   │    │  iOS/Android│    │  Push Alerts    │  │
│  └──────┬──────┘    └──────┬──────┘    └────────┬────────┘  │
│         │                  │                    │            │
│         └──────────────────┼────────────────────┘            │
│                            │ POST /v1/scan                   │
│                            ▼                                 │
│              ┌─────────────────────────┐                     │
│              │   Java Spring Boot API  │                     │
│              │   localhost:8080        │                     │
│              │                         │                     │
│              │  5 AI Checks:           │                     │
│              │  1. Blacklist lookup    │                     │
│              │  2. HTTPS check         │                     │
│              │  3. Suspicious TLD      │                     │
│              │  4. NLP keywords EN+BM  │                     │
│              │  5. Typosquat detect    │                     │
│              └───────────┬─────────────┘                     │
│                          │                                   │
│                    ┌─────▼──────┐                            │
│                    │  SQLite DB │                            │
│                    │ safenet.db │                            │
│                    └────────────┘                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
safenet-ai/
├── backend/                         # Step 1: Java Spring Boot API
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/safenet/
│       │   ├── SafeNetApplication.java
│       │   ├── config/CorsConfig.java
│       │   ├── controller/ScanController.java
│       │   ├── dto/ScanRequest.java
│       │   ├── dto/ScanResponse.java
│       │   ├── model/BlacklistDomain.java
│       │   ├── model/AuditLog.java
│       │   ├── model/GuardianLink.java
│       │   ├── repository/BlacklistRepository.java
│       │   ├── repository/AuditLogRepository.java
│       │   ├── repository/GuardianLinkRepository.java
│       │   ├── service/ScanService.java           ← AI brain
│       │   └── service/FamilyAlertService.java    ← Guardian alerts
│       └── resources/
│           ├── application.properties
│           └── data.sql                           ← 28 seeded scam domains
│
├── browser-extension/               # Step 2: Chrome Extension
│   ├── manifest.json
│   ├── background.js                ← Service worker
│   ├── content.js                   ← Injects warning banners
│   ├── blocker.html                 ← Full-screen HIGH-risk blocker
│   └── popup.html                   ← Toolbar popup UI
│
├── mobile-app/                      # Step 3: React Native App
│   ├── App.js                       ← Root navigation + Firebase
│   ├── index.js
│   ├── app.json
│   ├── package.json
│   └── screens/
│       ├── DashboardScreen.js       ← System status + stats
│       ├── ScanScreen.js            ← URL scanner + share extension
│       ├── HistoryScreen.js         ← Filterable scan history
│       ├── FamilyScreen.js          ← Step 4: Guardian setup + QR
│       └── AlertDetailScreen.js     ← Guardian alert detail view
│
└── pitch-deck/
    └── generate.js                  ← Node.js script → safenet-ai-pitch.pptx
```

---

## ⚡ Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Java JDK | 17+ | [adoptium.net](https://adoptium.net) |
| Maven | 3.8+ | [maven.apache.org](https://maven.apache.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Expo CLI | latest | `npm install -g expo-cli` |
| Android Studio / Xcode | latest | For mobile emulator |

---

### Step 1: Start the Backend

```bash
cd safenet-ai/backend

# Build
mvn clean install

# Run
mvn spring-boot:run
```

You should see:
```
╔═══════════════════════════════════════════╗
║       SafeNet AI is running! 🛡️           ║
║   POST http://localhost:8080/v1/scan       ║
║   GET  http://localhost:8080/v1/health     ║
╚═══════════════════════════════════════════╝
```

The SQLite database (`safenet.db`) is created automatically.
28 Malaysian scam domains are seeded from `data.sql` on first run.

**Test it:**
```bash
# Health check
curl http://localhost:8080/v1/health

# Scan a known scam URL
curl -X POST http://localhost:8080/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "http://lhdn-refund.xyz/claim?urgent=now", "userId": "test_user"}'

# Expected: riskScore: 100, severity: "HIGH"
```

---

### Step 2: Load the Browser Extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `safenet-ai/browser-extension/` folder
5. Pin the SafeNet AI extension to your toolbar

**Test it:**
- Navigate to any URL — the extension scans it automatically
- Try `http://lhdn-refund.xyz` — you'll be redirected to the blocker page
- Right-click any link → **Scan with SafeNet AI**
- Click the toolbar icon → manual scan in popup

> **Note:** The backend must be running on port 8080 for the extension to work.

---

### Step 3: Run the Mobile App

```bash
cd safenet-ai/mobile-app

npm install

# Android emulator
expo start --android

# iOS simulator (Mac only)
expo start --ios

# Physical device via QR code
expo start
```

**For Android emulator:** The API base URL is `http://10.0.2.2:8080/v1`
(10.0.2.2 maps to your machine's localhost from inside the Android emulator).

**For physical device:** Change `API_BASE` in each screen file to your machine's
local IP, e.g. `http://192.168.1.x:8080/v1`.

---

### Step 4: Family Alert Setup

#### A. Configure Firebase (for real push notifications)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Add an Android/iOS app with package name `com.safenet.ai`
3. Download `google-services.json` → place in `mobile-app/`
4. Copy your **Server Key** from Project Settings → Cloud Messaging
5. Add to `backend/src/main/resources/application.properties`:
   ```properties
   firebase.server.key=YOUR_SERVER_KEY_HERE
   ```

> **Demo mode:** Without Firebase configured, the system runs in demo mode —
> guardian alerts are logged to console but not sent as push notifications.
> This is fine for hackathon demos!

#### B. Link Guardian to User (Demo flow)

1. Open the mobile app → **Family** tab
2. Select **"I am the Guardian"**
3. Enter both names → **Generate QR Code**
4. Tap **Simulate Link** (demo button)
5. The guardian is now linked

**Trigger an alert:**
```bash
curl -X POST http://localhost:8080/v1/bypass \
  -H "Content-Type: application/json" \
  -d '{"url": "http://lhdn-refund.xyz", "userId": "user_mak", "bypassAttempt": true}'
```

---

### Step 5: Generate the Pitch Deck

```bash
cd safenet-ai/pitch-deck

npm install -g pptxgenjs
node generate.js

# Output: safenet-ai-pitch.pptx (9 slides)
```

Open in PowerPoint or Google Slides.

---

## 🧠 API Reference

### `POST /v1/scan`
Scan a URL for scam risk.

**Request:**
```json
{
  "url": "http://lhdn-refund.xyz/claim",
  "userId": "user_abc",
  "deviceType": "EXTENSION",
  "bypassAttempt": false
}
```

**Response:**
```json
{
  "riskScore": 100,
  "severity": "HIGH",
  "scannedDomain": "lhdn-refund.xyz",
  "reasons": [
    "Known scam domain: LHDN Clone — Fake tax refund portal",
    "Non-HTTPS connection (data not encrypted)",
    "Suspicious domain extension: .xyz",
    "Scam keywords detected: Tax refund lure, Immediate action pressure"
  ],
  "recommendation": "DANGER: Do NOT enter any personal details. Ini mungkin laman web penipuan.",
  "guardianAlerted": false,
  "scanDurationMs": 11
}
```

### `POST /v1/bypass`
Report that user bypassed a HIGH-risk warning. Triggers guardian alert.

**Request:** Same as `/v1/scan` with `bypassAttempt: true`

### `GET /v1/history/{userId}`
Get scan history for a user (for mobile dashboard).

### `POST /v1/guardian/link`
Link a user to a guardian for Family Alert.

**Request:**
```json
{
  "userId": "user_mak",
  "userDisplayName": "Mak",
  "guardianId": "guardian_ahmad",
  "guardianDisplayName": "Ahmad",
  "guardianFcmToken": "FCM_TOKEN_FROM_DEVICE"
}
```

### `GET /v1/stats`
Get 24-hour statistics (used by mobile dashboard and popup).

### `GET /v1/health`
Health check — use during live demo.

---

## 🔍 Risk Scoring Breakdown

| Check | Max Score | Description |
|-------|-----------|-------------|
| Blacklist hit (CRITICAL domain) | +80 | Known scam domain in SQLite DB |
| Blacklist hit (HIGH domain) | +65 | High-confidence scam domain |
| Non-HTTPS | +20 | URL does not use HTTPS |
| Suspicious TLD | +25–30 | .xyz, .tk, .ml, .click, .cf, .ga etc |
| NLP keywords | +12 per keyword (max +35) | Urgency phrases in English + BM |
| Typosquat detected | +35 | Domain similar to legit Malaysian site |
| **Total (capped)** | **100** | |

**Severity thresholds:**
- `HIGH` ≥ 75 → Full-screen blocker, guardian alert on bypass
- `MEDIUM` ≥ 40 → Warning banner injected
- `LOW` < 40 → Safe, no action

---

## 🇲🇾 Malaysian Context

### Seeded Blacklist Categories
- **LHDN / Hasil clones** — fake tax refund portals
- **KWSP / EPF clones** — fake pension withdrawal sites
- **Pos Malaysia clones** — fake parcel delivery scams
- **Banking phishing** — Maybank, CIMB, RHB, Public Bank, HLB
- **E-commerce scams** — fake Shopee lucky draws, Lazada winners
- **Government services** — fake JPJ, MyEG, JPA portals
- **Crypto/investment scams** — pig-butchering schemes

### Bilingual NLP Keywords (sample)
| English | Bahasa Malaysia |
|---------|----------------|
| Account suspended | Akaun digantung |
| Immediate action | Tindakan segera |
| Tax refund | Bayaran balik cukai |
| Verify now | Sahkan sekarang |
| Lucky draw | Hadiah menang |
| KWSP withdrawal | Pengeluaran KWSP |
| Click to claim | Klik untuk tuntut |
| Expires today | Tamat hari ini |

### Typosquat Detection Targets
`hasil.gov.my`, `kwsp.gov.my`, `maybank2u.com.my`, `cimbclicks.com.my`,
`shopee.com.my`, `poslaju.com.my`, `myeg.com.my`, `jpj.gov.my`, and 16 more.

---

## 🏆 Key Differentiators

1. **Bilingual NLP** — First Malaysian scam detector with Bahasa Malaysia keyword scanning
2. **Family Alert** — Unique guardian notification system for elderly protection
3. **Cross-platform** — Browser extension + mobile app + REST API from one backend
4. **Local context** — Blacklist and typosquat targets built specifically for Malaysia
5. **Speed** — Sub-15ms scan latency (optimised for no user-perceivable slowdown)
6. **Explainability** — Every block includes plain-language reasons in EN + BM

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.2, SQLite, Hibernate, Lombok |
| Browser Extension | JavaScript, Chrome MV3 Manifest |
| Mobile App | React Native, Expo 50, React Navigation |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Build | Maven (backend), npm/Expo (mobile) |
| Pitch Deck | Node.js + PptxGenJS |

---

## 📋 Hackathon Checklist

- [x] Working backend API with real AI scoring
- [x] Browser extension with live blocking
- [x] Mobile app with scan + history + family alert
- [x] Family Alert with guardian notifications
- [x] Bilingual UI (English + Bahasa Malaysia)
- [x] 28 real Malaysian scam domains seeded
- [x] Sub-15ms scan latency
- [x] Pitch deck (9 slides)
- [x] PDRM report link in alert detail screen

---

## 👤 Team

Built for **ICYOUTH 2026 Hackathon — Cybersecurity Track**

---

*SafeNet AI — Protecting Malaysians, One Click at a Time.*

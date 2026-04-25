#!/usr/bin/env bash
# SafeNet AI — End-to-End Test Script
# Run after starting the backend to verify all endpoints work correctly.
#
# Usage:
#   chmod +x test-api.sh
#   ./test-api.sh
#
# Prerequisites: curl, jq (brew install jq / apt install jq)

BASE="http://localhost:8080/v1"
PASS=0
FAIL=0
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    SafeNet AI — API Test Suite           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Helper functions ──────────────────────────────────────────────────────

assert_eq() {
  local desc="$1" actual="$2" expected="$3"
  if [ "$actual" = "$expected" ]; then
    echo -e "  ${GREEN}✓${NC} $desc"
    ((PASS++))
  else
    echo -e "  ${RED}✗${NC} $desc"
    echo -e "    Expected: ${expected} | Got: ${actual}"
    ((FAIL++))
  fi
}

assert_gte() {
  local desc="$1" actual="$2" min="$3"
  if [ "$actual" -ge "$min" ] 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $desc (score: $actual)"
    ((PASS++))
  else
    echo -e "  ${RED}✗${NC} $desc (expected >= $min, got: $actual)"
    ((FAIL++))
  fi
}

scan() {
  curl -s -X POST "$BASE/scan" \
    -H "Content-Type: application/json" \
    -d "$1"
}

# ── Check backend is running ──────────────────────────────────────────────

echo "━━━ Health Check ━━━━━━━━━━━━━━━━━━━━━━━━━"
HEALTH=$(curl -s "$BASE/health")
STATUS=$(echo "$HEALTH" | jq -r '.status // "FAIL"')
if echo "$STATUS" | grep -q "running\|SafeNet"; then
  echo -e "  ${GREEN}✓${NC} Backend is running"
  ((PASS++))
else
  echo -e "  ${RED}✗${NC} Backend is NOT running. Start it first:"
  echo -e "    cd backend && mvn spring-boot:run"
  exit 1
fi

# ── Test 1: Known scam domain ─────────────────────────────────────────────

echo ""
echo "━━━ Test 1: Known Malaysian Scam Domain (LHDN) ━━━"
RESP=$(scan '{"url":"http://lhdn-refund.xyz/claim","userId":"test"}')
SCORE=$(echo "$RESP" | jq -r '.riskScore')
SEV=$(echo "$RESP" | jq -r '.severity')
assert_gte "Risk score >= 80 for blacklisted LHDN clone" "$SCORE" 80
assert_eq  "Severity is HIGH" "$SEV" "HIGH"

# ── Test 2: KWSP scam domain ─────────────────────────────────────────────

echo ""
echo "━━━ Test 2: Known Scam Domain (KWSP) ━━━"
RESP=$(scan '{"url":"https://kwsp-withdrawal.click","userId":"test"}')
SCORE=$(echo "$RESP" | jq -r '.riskScore')
SEV=$(echo "$RESP" | jq -r '.severity')
assert_gte "Risk score >= 65 for KWSP clone" "$SCORE" 65
assert_eq  "Severity is HIGH" "$SEV" "HIGH"

# ── Test 3: Non-HTTPS URL ─────────────────────────────────────────────────

echo ""
echo "━━━ Test 3: Non-HTTPS Penalty ━━━"
RESP=$(scan '{"url":"http://example.com","userId":"test"}')
SCORE=$(echo "$RESP" | jq -r '.riskScore')
REASONS=$(echo "$RESP" | jq -r '.reasons[]' | tr '[:upper:]' '[:lower:]')
assert_gte "HTTP URL adds score penalty" "$SCORE" 20
if echo "$REASONS" | grep -q "https\|encrypt"; then
  echo -e "  ${GREEN}✓${NC} Non-HTTPS reason included in response"
  ((PASS++))
else
  echo -e "  ${RED}✗${NC} Non-HTTPS reason missing from response"
  ((FAIL++))
fi

# ── Test 4: Suspicious TLD ────────────────────────────────────────────────

echo ""
echo "━━━ Test 4: Suspicious TLD Detection (.xyz) ━━━"
RESP=$(scan '{"url":"https://innocent-looking-site.xyz","userId":"test"}')
SCORE=$(echo "$RESP" | jq -r '.riskScore')
assert_gte "Suspicious TLD adds >= 25 score" "$SCORE" 25

# ── Test 5: Malay NLP keyword ────────────────────────────────────────────

echo ""
echo "━━━ Test 5: Malay NLP Keyword Detection ━━━"
RESP=$(scan '{"url":"https://somesite.com/tindakan-segera-kemaskini","userId":"test"}')
SCORE=$(echo "$RESP" | jq -r '.riskScore')
REASONS=$(echo "$RESP" | jq -r '.reasons[]' | tr '[:upper:]' '[:lower:]')
assert_gte "Malay urgency keyword adds score" "$SCORE" 12
if echo "$REASONS" | grep -q "keyword\|segera"; then
  echo -e "  ${GREEN}✓${NC} Malay keyword reason present"
  ((PASS++))
else
  echo -e "  ${RED}✗${NC} Malay keyword reason missing"
  ((FAIL++))
fi

# ── Test 6: English NLP keyword ──────────────────────────────────────────

echo ""
echo "━━━ Test 6: English NLP Keyword Detection ━━━"
RESP=$(scan '{"url":"https://site.com/tax-refund-claim-now","userId":"test"}')
SCORE=$(echo "$RESP" | jq -r '.riskScore')
assert_gte "English urgency keyword adds score" "$SCORE" 12

# ── Test 7: Typosquat detection ──────────────────────────────────────────

echo ""
echo "━━━ Test 7: Typosquatting Detection ━━━"
RESP=$(scan '{"url":"https://maybank2u-secure.com/login","userId":"test"}')
SCORE=$(echo "$RESP" | jq -r '.riskScore')
assert_gte "Maybank typosquat adds >= 35 score" "$SCORE" 35

# ── Test 8: Safe domain (whitelist) ──────────────────────────────────────

echo ""
echo "━━━ Test 8: Whitelisted Safe Domain ━━━"
RESP=$(scan '{"url":"https://google.com/search?q=hello","userId":"test"}')
SCORE=$(echo "$RESP" | jq -r '.riskScore')
SEV=$(echo "$RESP" | jq -r '.severity')
assert_eq "Google.com → score 0" "$SCORE" "0"
assert_eq "Google.com → severity LOW" "$SEV" "LOW"

# ── Test 9: Score cap ────────────────────────────────────────────────────

echo ""
echo "━━━ Test 9: Score Never Exceeds 100 ━━━"
RESP=$(scan '{"url":"http://lhdn-refund.xyz/tax-refund?tindakan-segera=true&verify-now","userId":"test"}')
SCORE=$(echo "$RESP" | jq -r '.riskScore')
if [ "$SCORE" -le 100 ] 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Score capped at 100 (got: $SCORE)"
  ((PASS++))
else
  echo -e "  ${RED}✗${NC} Score exceeded 100: $SCORE"
  ((FAIL++))
fi

# ── Test 10: Bypass endpoint ─────────────────────────────────────────────

echo ""
echo "━━━ Test 10: Bypass Endpoint (/v1/bypass) ━━━"
RESP=$(curl -s -X POST "$BASE/bypass" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://lhdn-refund.xyz","userId":"elderly_user","bypassAttempt":true}')
SCORE=$(echo "$RESP" | jq -r '.riskScore')
assert_gte "Bypass endpoint returns score" "$SCORE" 0

# ── Test 11: Stats endpoint ──────────────────────────────────────────────

echo ""
echo "━━━ Test 11: Stats Endpoint (/v1/stats) ━━━"
RESP=$(curl -s "$BASE/stats")
BLACKLIST=$(echo "$RESP" | jq -r '.blacklistSize')
if [ "$BLACKLIST" -ge 20 ] 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Blacklist has >= 20 domains ($BLACKLIST seeded)"
  ((PASS++))
else
  echo -e "  ${RED}✗${NC} Blacklist too small: $BLACKLIST (check data.sql seed)"
  ((FAIL++))
fi

# ── Test 12: History endpoint ────────────────────────────────────────────

echo ""
echo "━━━ Test 12: History Endpoint (/v1/history/{userId}) ━━━"
RESP=$(curl -s "$BASE/history/test")
if echo "$RESP" | jq -e 'type == "array"' > /dev/null 2>&1; then
  COUNT=$(echo "$RESP" | jq 'length')
  echo -e "  ${GREEN}✓${NC} History returns array ($COUNT records)"
  ((PASS++))
else
  echo -e "  ${RED}✗${NC} History endpoint did not return an array"
  ((FAIL++))
fi

# ── Summary ──────────────────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$((PASS + FAIL))
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}All $TOTAL tests passed! SafeNet AI is ready. ✓${NC}"
else
  echo -e "${RED}$FAIL/$TOTAL tests failed.${NC}"
  echo -e "Check backend logs: ${CYAN}mvn spring-boot:run${NC}"
  exit 1
fi
echo ""

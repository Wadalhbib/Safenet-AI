// SafeNet AI — Background Service Worker
// Intercepts every navigation and pings the Java API
//
// Node.js parallel: This is like your Express middleware that runs
// on every request. It's always running in the background.

const API_BASE = "http://localhost:8080/v1";
const HIGH_RISK_THRESHOLD = 75;
const MEDIUM_RISK_THRESHOLD = 40;

// Store scan results to avoid re-scanning the same URL repeatedly
const scanCache = new Map(); // url → { result, timestamp }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Listen to all web navigations ────────────────────────────────────────────
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only intercept main frame (not iframes, not extension pages)
  if (details.frameId !== 0) return;
  if (details.url.startsWith("chrome://")) return;
  if (details.url.startsWith("chrome-extension://")) return;
  if (details.url.startsWith("about:")) return;

  const url = details.url;

  // Check cache first
  const cached = getCached(url);
  if (cached) {
    handleResult(cached, details.tabId, url);
    return;
  }

  // Scan the URL
  try {
    const result = await scanUrl(url);
    cacheResult(url, result);
    handleResult(result, details.tabId, url);
  } catch (err) {
    console.warn("[SafeNet] API unreachable — fail open:", err.message);
    // Fail open: don't block if API is down
  }
});

// ─── Core scan function ────────────────────────────────────────────────────────
async function scanUrl(url, bypassAttempt = false) {
  if (!url || !url.startsWith("http")) {
    return { riskScore: 0, severity: "LOW", reasons: ["✅ Internal page or invalid URL"] };
  }

  const userId = await getUserId();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const response = await fetch(`${API_BASE}/scan`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        userId,
        deviceType: "EXTENSION",
        bypassAttempt,
      }),
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("[SafeNet] Scan failed:", err.message);
    throw err;
  }
}

// ─── Handle the scan result ────────────────────────────────────────────────────
function handleResult(result, tabId, url) {
  const { riskScore, severity } = result;

  // Update the extension icon to reflect risk level
  updateIcon(tabId, severity);

  // Store result so popup can display it
  chrome.storage.session.set({ [`scan_${tabId}`]: result });

  if (riskScore >= HIGH_RISK_THRESHOLD) {
    // HIGH RISK: redirect to blocker page
    const blockerUrl = chrome.runtime.getURL("blocker.html")
      + "?url=" + encodeURIComponent(url)
      + "&score=" + riskScore
      + "&time=" + result.scanDurationMs
      + "&reasons=" + encodeURIComponent(JSON.stringify(result.reasons))
      + "&recommendation=" + encodeURIComponent(result.recommendation);

    chrome.tabs.update(tabId, { url: blockerUrl });

    // Show notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "⚠️ SafeNet AI — Scam Detected!",
      message: `HIGH RISK site blocked: ${result.scannedDomain} (${riskScore}/100)`,
      priority: 2,
    });
  } else if (riskScore >= MEDIUM_RISK_THRESHOLD) {
    // MEDIUM RISK: inject warning banner (content script handles this)
    chrome.tabs.sendMessage(tabId, {
      type: "SHOW_WARNING_BANNER",
      result,
    }).catch(() => {}); // Tab may not be ready yet
  }
  // LOW RISK: do nothing, let user browse normally
}

// ─── Context menu: "Scan with SafeNet" ────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "safenet-scan-link",
    title: "🛡️ Scan with SafeNet AI",
    contexts: ["link", "selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const urlToScan = info.linkUrl || info.selectionText;
  if (!urlToScan) return;

  try {
    const result = await scanUrl(urlToScan);
    // Send result to content script to show inline popup
    chrome.tabs.sendMessage(tab.id, {
      type: "SHOW_SCAN_RESULT_POPUP",
      result,
      scannedUrl: urlToScan,
    });
  } catch (err) {
    console.error("[SafeNet] Context menu scan failed:", err);
  }
});

// ─── Message handler (from content script / popup) ─────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "BYPASS_WARNING") {
    // User clicked "Proceed Anyway" on blocker page — report bypass + alert guardian
    scanUrl(message.url, true)
      .then((result) => sendResponse({ ok: true, guardianAlerted: result.guardianAlerted }))
      .catch(() => sendResponse({ ok: false }));
    return true; // Keep channel open for async response
  }

  if (message.type === "GET_SCAN_RESULT") {
    chrome.storage.session.get(`scan_${sender.tab?.id}`, (data) => {
      sendResponse(data[`scan_${sender.tab?.id}`] || null);
    });
    return true;
  }

  if (message.type === "MANUAL_SCAN") {
    scanUrl(message.url)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

// ─── Icon helper ───────────────────────────────────────────────────────────────
function updateIcon(tabId, severity) {
  const iconMap = {
    HIGH:   { path: { 16: "icons/icon16-red.png",    48: "icons/icon48-red.png" }},
    MEDIUM: { path: { 16: "icons/icon16-yellow.png", 48: "icons/icon48-yellow.png" }},
    LOW:    { path: { 16: "icons/icon16.png",         48: "icons/icon48.png" }},
  };
  const iconData = iconMap[severity] || iconMap.LOW;
  chrome.action.setIcon({ tabId, ...iconData }).catch(() => {});
}

// ─── Cache helpers ─────────────────────────────────────────────────────────────
function getCached(url) {
  const entry = scanCache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    scanCache.delete(url);
    return null;
  }
  return entry.result;
}

function cacheResult(url, result) {
  scanCache.set(url, { result, timestamp: Date.now() });
  // Limit cache size
  if (scanCache.size > 200) {
    const firstKey = scanCache.keys().next().value;
    scanCache.delete(firstKey);
  }
}

// ─── Get or create persistent user ID ─────────────────────────────────────────
async function getUserId() {
  return new Promise((resolve) => {
    chrome.storage.local.get("userId", (data) => {
      if (data.userId) return resolve(data.userId);
      const newId = "ext_" + Math.random().toString(36).substr(2, 12);
      chrome.storage.local.set({ userId: newId });
      resolve(newId);
    });
  });
}

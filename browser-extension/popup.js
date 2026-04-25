const API_BASE = "http://localhost:8080/v1";

// Load current tab result + stats on open
document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentTabResult();
  await loadStats();

  // Set up event listeners
  document.getElementById("manual-scan-btn").addEventListener("click", manualScan);
  document.getElementById("manual-url").addEventListener("keydown", (e) => {
    if (e.key === "Enter") manualScan();
  });
});

async function loadCurrentTabResult() {
  const timeout = setTimeout(() => renderNoResult("Backend timeout"), 6000);
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.startsWith("http")) {
      clearTimeout(timeout);
      return renderNoResult();
    }

    // Try storage first (FAST)
    let result = null;
    if (chrome.storage && chrome.storage.session) {
       const stored = await chrome.storage.session.get(`scan_${tab.id}`);
       result = stored[`scan_${tab.id}`];
    }

    if (result) {
      clearTimeout(timeout);
      renderResult(result);
    } else {
      // Auto-scan current tab
      const response = await chrome.runtime.sendMessage({
        type: "MANUAL_SCAN",
        url: tab.url,
      });
      clearTimeout(timeout);
      if (response && !response.error) renderResult(response);
      else renderNoResult(response?.error || "Connection error");
    }
  } catch (err) {
    clearTimeout(timeout);
    renderNoResult(err.message);
  }
}

function renderResult(result) {
  const cls = result.severity.toLowerCase();
  const icon = cls === "high" ? "🚫" : cls === "medium" ? "⚠️" : "✅";
  const topReason = result.reasons?.[0] || "No threats detected";

  document.getElementById("main-content").innerHTML = `
    <div class="site-card ${cls}" style="margin-top:12px;">
      <div class="site-header">
        <div>
          <div class="domain-text">${result.scannedDomain}</div>
          <span class="severity-badge ${cls}">${icon} ${result.severity}</span>
        </div>
        <div>
          <div class="score-display ${cls}">${result.riskScore}</div>
          <div class="score-sub">/ 100</div>
        </div>
      </div>
      <div class="top-reason">${topReason}</div>
    </div>
  `;
}

function renderNoResult(errorMsg = null) {
  document.getElementById("main-content").innerHTML = `
    <div class="site-card low" style="margin-top:12px;">
      <div class="site-header">
        <span class="severity-badge low">✅ ${errorMsg ? "OFFLINE" : "SAFE"}</span>
        <div class="score-display low">${errorMsg ? "?" : "0"}</div>
      </div>
      <div class="top-reason">${errorMsg ? "Backend unreachable: " + errorMsg : "No threats detected on this page."}</div>
    </div>
  `;
}

async function loadStats() {
  try {
    const r = await fetch(`${API_BASE}/stats`);
    const data = await r.json();
    document.getElementById("stat-total").textContent = data.totalScans24h ?? "--";
    document.getElementById("stat-blocked").textContent = data.highRiskBlocked24h ?? "--";
    document.getElementById("stat-blacklist").textContent = data.blacklistSize ?? "--";
  } catch {
    // API unreachable — just hide stats
  }
}

async function manualScan() {
  const input = document.getElementById("manual-url");
  const btn = document.getElementById("manual-scan-btn");
  const url = input.value.trim();
  if (!url) return;

  btn.disabled = true;
  btn.textContent = "...";

  try {
    const result = await chrome.runtime.sendMessage({
      type: "MANUAL_SCAN",
      url: url.startsWith("http") ? url : "https://" + url,
    });
    if (result && !result.error) {
      renderResult(result);
      input.value = "";
    } else {
      alert("Scan failed. Is the SafeNet backend running?");
    }
  } catch {
    alert("Could not connect to SafeNet AI backend.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Scan";
  }
}

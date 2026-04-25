// SafeNet AI — Content Script
// Injected into every page at document_start.
// Listens for messages from background.js and injects UI directly into the DOM.

(function () {
  "use strict";

  let bannerInjected = false;
  let popupInjected = false;

  // ─── Listen for messages from background.js ──────────────────────────────────
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "SHOW_WARNING_BANNER") {
      showWarningBanner(message.result);
    }
    if (message.type === "SHOW_SCAN_RESULT_POPUP") {
      showScanResultPopup(message.result, message.scannedUrl);
    }
  });

  // ─── MEDIUM RISK: Sticky warning banner at top of page ───────────────────────
  function showWarningBanner(result) {
    if (bannerInjected) return;
    bannerInjected = true;

    const banner = document.createElement("div");
    banner.id = "safenet-warning-banner";
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 2147483647;
        background: linear-gradient(135deg, #ff6b00, #ff8c00);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        padding: 10px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 20px rgba(255,107,0,0.5);
        gap: 12px;
      ">
        <div style="display:flex; align-items:center; gap:10px; flex:1;">
          <span style="font-size:20px;">⚠️</span>
          <div>
            <strong>SafeNet AI — Caution</strong>
            <span style="margin-left:8px; opacity:0.9;">
              Risk Score: ${result.riskScore}/100 · ${result.scannedDomain}
            </span>
            <br>
            <span style="font-size:12px; opacity:0.85;">
              ${result.reasons[0] || "Suspicious activity detected"}
            </span>
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-shrink:0;">
          <button id="safenet-details-btn" style="
            background: rgba(255,255,255,0.25);
            color: white; border: 1px solid rgba(255,255,255,0.5);
            padding: 5px 12px; border-radius: 6px; cursor: pointer;
            font-size: 12px; font-weight: 600;
          ">Details</button>
          <button id="safenet-dismiss-btn" style="
            background: transparent; color: white;
            border: none; font-size: 18px; cursor: pointer;
            padding: 0 4px; line-height: 1;
          ">✕</button>
        </div>
      </div>
    `;

    document.documentElement.insertBefore(banner, document.documentElement.firstChild);

    document.getElementById("safenet-dismiss-btn").onclick = () => banner.remove();
    document.getElementById("safenet-details-btn").onclick = () =>
      showScanResultPopup(result, window.location.href);
  }

  // ─── Context menu result: floating popup ──────────────────────────────────────
  function showScanResultPopup(result, scannedUrl) {
    // Remove existing popup
    document.getElementById("safenet-result-popup")?.remove();
    popupInjected = true;

    const severityColor = {
      HIGH:   { bg: "#ff1f1f", text: "#fff", badge: "#cc0000" },
      MEDIUM: { bg: "#ff6b00", text: "#fff", badge: "#cc4400" },
      LOW:    { bg: "#00b87c", text: "#fff", badge: "#007a52" },
    }[result.severity] || { bg: "#555", text: "#fff", badge: "#333" };

    const reasonsList = result.reasons
      .map(r => `<li style="margin:4px 0; font-size:12px; opacity:0.92;">${r}</li>`)
      .join("");

    const popup = document.createElement("div");
    popup.id = "safenet-result-popup";
    popup.innerHTML = `
      <div style="
        position: fixed;
        bottom: 24px; right: 24px;
        z-index: 2147483647;
        width: 340px;
        background: #1a1a2e;
        color: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow: hidden;
        animation: safenet-slide-up 0.3s ease;
      ">
        <style>
          @keyframes safenet-slide-up {
            from { transform: translateY(20px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        </style>

        <!-- Header -->
        <div style="
          background: ${severityColor.bg};
          padding: 14px 16px;
          display: flex; align-items: center; justify-content: space-between;
        ">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:22px;">${result.severity === "HIGH" ? "🚫" : result.severity === "MEDIUM" ? "⚠️" : "✅"}</span>
            <div>
              <div style="font-weight:700; font-size:15px;">
                ${result.severity === "HIGH" ? "SCAM DETECTED" : result.severity === "MEDIUM" ? "SUSPICIOUS SITE" : "SITE LOOKS SAFE"}
              </div>
              <div style="font-size:11px; opacity:0.85;">${result.scannedDomain}</div>
            </div>
          </div>
          <div style="
            background: ${severityColor.badge};
            border-radius: 50%;
            width: 44px; height: 44px;
            display: flex; align-items: center; justify-content: center;
            font-weight: 900; font-size: 14px;
          ">${result.riskScore}</div>
        </div>

        <!-- Body -->
        <div style="padding: 14px 16px;">
          <div style="font-size:12px; color:#aaa; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">
            Risk Factors
          </div>
          <ul style="margin:0; padding-left:16px; color:#ddd;">
            ${reasonsList}
          </ul>

          <div style="
            margin-top: 12px;
            padding: 10px 12px;
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            font-size: 12px;
            color: #ccc;
            border-left: 3px solid ${severityColor.bg};
          ">
            ${result.recommendation}
          </div>

          <div style="margin-top:12px; font-size:11px; color:#666; text-align:right;">
            Scan time: ${result.scanDurationMs}ms · SafeNet AI v1.0
          </div>
        </div>

        <!-- Close -->
        <button onclick="document.getElementById('safenet-result-popup').remove()" style="
          position: absolute; top: 10px; right: 10px;
          background: rgba(0,0,0,0.3); color: white;
          border: none; border-radius: 50%;
          width: 24px; height: 24px;
          cursor: pointer; font-size: 14px;
          display: flex; align-items: center; justify-content: center;
        ">✕</button>
      </div>
    `;

    document.body.appendChild(popup);

    // Auto-dismiss after 12 seconds for LOW risk
    if (result.severity === "LOW") {
      setTimeout(() => popup.remove(), 12000);
    }
  }
})();

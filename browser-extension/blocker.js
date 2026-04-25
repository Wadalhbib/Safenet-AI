try {
  // Parse URL params
  const params = new URLSearchParams(window.location.search);
  const blockedUrl = params.get("url") || "Unknown Site";
  const score = parseInt(params.get("score") || "0");
  const scanTime = params.get("time") || "--";
  
  let reasons = [];
  try {
    const rawReasons = params.get("reasons");
    if (rawReasons) {
      reasons = JSON.parse(decodeURIComponent(rawReasons));
    }
  } catch (e) {
    console.warn("Failed to parse reasons:", e);
    reasons = ["Suspicious activity detected"];
  }
  
  const recommendation = decodeURIComponent(params.get("recommendation") || "Do NOT enter any personal details or make payments on this site.");

  // Extract domain from URL
  function extractDomain(url) {
    try { 
      if (!url.startsWith("http")) return url;
      return new URL(url).hostname.replace(/^www\./, ""); 
    } catch { return url; }
  }

  const domain = extractDomain(blockedUrl);

  // Populate UI
  document.getElementById("domain-display").textContent = domain;
  document.getElementById("score-value").textContent = score;
  document.getElementById("score-circle").style.setProperty("--pct", score);
  document.getElementById("recommendation").textContent = recommendation;
  document.getElementById("scan-time").textContent = scanTime;

  const reasonsList = document.getElementById("reasons-list");
  reasonsList.innerHTML = "";
  (reasons.length ? reasons : ["Security policy violation"]).forEach(r => {
    reasonsList.innerHTML += `
      <div class="reason-item">
        <span class="reason-dot">▶</span>
        <span>${r}</span>
      </div>`;
  });
} catch (err) {
  console.error("Critical blocker error:", err);
  document.getElementById("domain-display").textContent = "Dangerous Website";
  document.getElementById("score-value").textContent = "!";
}

// Set up event listeners
document.addEventListener("DOMContentLoaded", () => {
    const safeBtn = document.querySelector(".btn-safe");
    if (safeBtn) safeBtn.addEventListener("click", goBack);

    const proceedBtn = document.getElementById("proceed-btn");
    if (proceedBtn) proceedBtn.addEventListener("click", proceedAnyway);
});

// Enable proceed button after 5 seconds (friction by design)
setTimeout(() => {
  const btn = document.getElementById("proceed-btn");
  if (btn) {
    btn.disabled = false;
    btn.style.opacity = "1";
  }
}, 5000);

function goBack() {
  if (history.length > 1) { history.back(); }
  else { window.close(); }
}

function proceedAnyway() {
  const params = new URLSearchParams(window.location.search);
  const blockedUrl = params.get("url");
  
  if (!confirm(
    "⚠️ WARNING\n\nThis site has been flagged as a HIGH RISK scam.\n" +
    "Proceeding may expose your personal data and banking information.\n\n" +
    "Your guardian may be notified. Are you sure you want to continue?"
  )) return;

  // Report bypass to background script (triggers guardian alert)
  chrome.runtime.sendMessage({
    type: "BYPASS_WARNING",
    url: blockedUrl,
  }, (response) => {
    if (response?.guardianAlerted) {
      alert("Your guardian has been notified that you are visiting this site.");
    }
    window.location.href = blockedUrl;
  });
}

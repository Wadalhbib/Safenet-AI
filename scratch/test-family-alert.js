const API_BASE = "http://localhost:8080/v1";

async function testFamilyAlert() {
    console.log("🚀 Testing Family Alert System...");

    // 1. Link a demo user to a guardian
    console.log("🔗 Step 1: Linking guardian to user 'user_test'...");
    const linkRes = await fetch(`${API_BASE}/guardian/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: "user_test",
            userDisplayName: "Test Parent",
            guardianId: "guardian_test",
            guardianDisplayName: "Test Child",
            guardianFcmToken: "FAKE_FCM_TOKEN",
            alertThreshold: 75
        })
    });
    
    if (linkRes.ok) {
        console.log("✅ Guardian linked successfully.");
    } else {
        console.log("❌ Failed to link guardian.");
        return;
    }

    // 2. Trigger a HIGH RISK scan bypass
    console.log("\n🚨 Step 2: Simulating HIGH-RISK bypass for 'lhdn-refund.xyz'...");
    const scanRes = await fetch(`${API_BASE}/bypass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            url: "http://lhdn-refund.xyz",
            userId: "user_test",
            deviceType: "EXTENSION"
        })
    });

    if (scanRes.ok) {
        const data = await scanRes.json();
        console.log("📊 Scan Result:", data.severity, "| Score:", data.riskScore);
        console.log("🔔 Guardian Alerted:", data.guardianAlerted ? "YES ✅" : "NO ❌");
    } else {
        console.log("❌ Bypass request failed.");
    }
}

testFamilyAlert();

// SafeNet AI — Family Alert Screen (Step 4)
// Guardian setup: links elderly parent (User) to adult child (Guardian)
// via a simple pairing code / QR code.

import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import messaging from "@react-native-firebase/messaging";
import { CameraView, useCameraPermissions } from "expo-camera";

import { API_BASE } from "../config";

const C = {
  bg: "#0d0d16", card: "#161625", accent: "#00c6ff",
  purple: "#a855f7", danger: "#ff4444", warning: "#ffaa00", safe: "#00e676",
  text: "#ffffff", muted: "#666680", border: "rgba(255,255,255,0.06)",
};

export default function FamilyScreen() {
  const [mode, setMode]               = useState(null); // "guardian" | "user" | null
  const [userName, setUserName]       = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [pairingCode, setPairingCode] = useState(null);
  const [linked, setLinked]           = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(75);
  const [notifyOnAll, setNotifyOnAll] = useState(false);
  const [fcmToken, setFcmToken]       = useState(null);
  const [scanning, setScanning]       = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    try {
      messaging().getToken()
        .then(setFcmToken)
        .catch(() => setFcmToken("DEMO_TOKEN_123"));
    } catch (e) {
      setFcmToken("DEMO_TOKEN_123");
    }
  }, []);

  // Generate a pairing QR code that the "user" (elderly parent) scans
  // to link them to this guardian device
  async function generatePairingCode() {
    if (!userName.trim() || !guardianName.trim()) {
      Alert.alert("Missing info", "Please enter both names.");
      return;
    }

    const code = {
      guardianId:          "guardian_" + Date.now(),
      guardianDisplayName: guardianName.trim(),
      guardianFcmToken:    fcmToken || "DEMO_TOKEN",
      expiresAt:           Date.now() + 10 * 60 * 1000, // 10 mins
    };

    setPairingCode(JSON.stringify(code));
  }

  // Simulate user scanning the QR code (in real app, use camera)
  async function simulateLink() {
    if (!pairingCode) return;
    const code = JSON.parse(pairingCode);
    linkAccount(code);
  }

  async function linkAccount(code) {
    try {
      const uName = (userName || "Family Member").trim();
      await fetch(`${API_BASE}/guardian/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:              "user_" + uName.toLowerCase().replace(/\s/g, "_"),
          userDisplayName:     uName,
          guardianId:          code.guardianId,
          guardianDisplayName: code.guardianDisplayName,
          guardianFcmToken:    code.guardianFcmToken,
          alertThreshold:      alertThreshold,
        }),
      });
      setLinked(true);
      setScanning(false);
      Alert.alert(
        "✅ Linked!",
        `SafeNet protection is active. Your guardian will receive alerts if you visit a HIGH-risk site.`
      );
    } catch {
      Alert.alert("Error", "Could not connect to SafeNet backend.");
    }
  }

  function handleBarCodeScanned({ data }) {
    if (!scanning) return;
    try {
      const code = JSON.parse(data);
      if (code.guardianId && code.guardianFcmToken) {
        linkAccount(code);
      }
    } catch (e) {
      console.warn("Invalid QR code scanned");
    }
  }

  async function startScanning() {
    if (!permission || !permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Permission Required", "We need camera access to scan the guardian QR code.");
        return;
      }
    }
    setScanning(true);
  }

  // ─── Mode selection screen ────────────────────────────────────────────────
  if (!mode) {
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.title}>👨‍👩‍👧 Family Alert</Text>
          <Text style={s.subtitle}>
            Protect your family from online scams.{"\n"}
            Set up alerts so you know when a loved one is at risk.
          </Text>

          <View style={s.modeCard}>
            <Text style={s.sectionLabel}>Who are you setting this up for?</Text>

            <TouchableOpacity style={s.modeBtn} onPress={() => setMode("guardian")} activeOpacity={0.8}>
              <View style={[s.modeIcon, { backgroundColor: "rgba(168,85,247,0.15)" }]}>
                <Text style={{ fontSize: 28 }}>👨‍💼</Text>
              </View>
              <View style={s.modeBtnText}>
                <Text style={s.modeBtnTitle}>I am the Guardian</Text>
                <Text style={s.modeBtnSub}>
                  I want to monitor a family member (e.g. my parent) and receive alerts if they visit dangerous sites.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </TouchableOpacity>

            <View style={s.divider} />

            <TouchableOpacity style={s.modeBtn} onPress={() => setMode("user")} activeOpacity={0.8}>
              <View style={[s.modeIcon, { backgroundColor: "rgba(0,198,255,0.15)" }]}>
                <Text style={{ fontSize: 28 }}>👴</Text>
              </View>
              <View style={s.modeBtnText}>
                <Text style={s.modeBtnTitle}>I am the Protected User</Text>
                <Text style={s.modeBtnSub}>
                  My family member set up SafeNet for me. I want to scan my QR code to link our accounts.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* How it works */}
          <Text style={s.sectionLabel}>How it works</Text>
          {HOW_IT_WORKS.map((step, i) => (
            <View key={i} style={s.howStep}>
              <View style={s.howNum}>
                <Text style={s.howNumText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.howTitle}>{step.title}</Text>
                <Text style={s.howDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Guardian setup screen ────────────────────────────────────────────────
  if (mode === "guardian") {
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <ScrollView contentContainerStyle={s.scroll}>
          <TouchableOpacity onPress={() => { setMode(null); setPairingCode(null); setLinked(false); }}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Guardian Setup</Text>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Your name (Guardian)</Text>
            <TextInput
              style={s.input}
              value={guardianName}
              onChangeText={setGuardianName}
              placeholder="e.g. Ahmad"
              placeholderTextColor={C.muted}
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Protected person's name</Text>
            <TextInput
              style={s.input}
              value={userName}
              onChangeText={setUserName}
              placeholder="e.g. Mak, Ayah, Nenek"
              placeholderTextColor={C.muted}
            />
          </View>

          {/* Alert threshold */}
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Alert me when risk score is above</Text>
            <View style={s.thresholdRow}>
              {[60, 75, 90].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.thresholdBtn, alertThreshold === t && s.thresholdBtnActive]}
                  onPress={() => setAlertThreshold(t)}
                >
                  <Text style={[s.thresholdText, alertThreshold === t && { color: C.accent }]}>{t}+</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={s.primaryBtn} onPress={generatePairingCode} activeOpacity={0.8}>
            <Ionicons name="qr-code" size={18} color="white" />
            <Text style={s.primaryBtnText}>Generate QR Code</Text>
          </TouchableOpacity>

          {/* QR Code */}
          {pairingCode && (
            <View style={s.qrCard}>
              <Text style={s.qrTitle}>📱 Show this to {userName || "your family member"}</Text>
              <Text style={s.qrSub}>Ask them to open SafeNet → Family Alert → Scan QR</Text>
              <View style={s.qrWrapper}>
                <QRCode
                  value={pairingCode}
                  size={180}
                  color="white"
                  backgroundColor="#161625"
                />
              </View>
              <Text style={s.qrExpiry}>Expires in 10 minutes</Text>

              {!linked && (
                <TouchableOpacity style={s.demoBtn} onPress={simulateLink}>
                  <Text style={s.demoBtnText}>🔗 Simulate Link (Demo)</Text>
                </TouchableOpacity>
              )}

              {linked && (
                <View style={s.linkedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={C.safe} />
                  <Text style={[s.primaryBtnText, { color: C.safe }]}>
                    {userName} is now protected!
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* FCM token for demo */}
          <View style={s.tokenCard}>
            <Text style={s.tokenLabel}>Your FCM Token (for demo)</Text>
            <Text style={s.tokenValue} numberOfLines={2}>
              {fcmToken || "Not available — run on a real device"}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── User (protected person) screen ──────────────────────────────────────
  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => setMode(null)}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Scan Guardian QR</Text>
        
        {scanning ? (
          <View style={s.cameraCard}>
            <CameraView
              style={s.camera}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={handleBarCodeScanned}
            />
            <TouchableOpacity style={s.cancelBtn} onPress={() => setScanning(false)}>
              <Text style={{ color: "white" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.userCard}>
            <Text style={{ fontSize: 48, textAlign: "center", marginBottom: 16 }}>📷</Text>
            <Text style={s.userDesc}>
              Ask your guardian (family member who set up SafeNet) to show you the QR code on their phone.
            </Text>
            <Text style={[s.userDesc, { marginTop: 8, color: C.muted }]}>
              Minta ahli keluarga anda tunjukkan kod QR pada telefon mereka.
            </Text>
            <TouchableOpacity 
                style={[s.primaryBtn, { marginTop: 24 }]} 
                onPress={startScanning}
            >
              <Ionicons name="camera" size={18} color="white" />
              <Text style={s.primaryBtnText}>Open Camera to Scan</Text>
            </TouchableOpacity>
            <Text style={[s.userDesc, { marginTop: 16, fontSize: 12, color: "#444" }]}>
              Camera scanning requires a real device.{"\n"}
              Use the Guardian's "Simulate Link" button for testing on emulator.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const HOW_IT_WORKS = [
  { title: "Guardian installs SafeNet",   desc: "The adult child sets up the app on their phone." },
  { title: "Generate a QR pairing code",  desc: "Guardian creates a QR code in the Family Alert tab." },
  { title: "Parent scans the QR",         desc: "The elderly parent scans the code on their device to link accounts." },
  { title: "Real-time protection begins", desc: "If the parent visits a HIGH-risk site, the guardian instantly receives a push notification." },
];

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: C.bg },
  scroll:           { padding: 20 },
  title:            { fontSize: 22, fontWeight: "800", color: C.text, marginBottom: 6 },
  subtitle:         { fontSize: 14, color: C.muted, lineHeight: 20, marginBottom: 24 },
  back:             { color: C.accent, fontSize: 14, marginBottom: 16 },
  sectionLabel:     { fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, color: C.muted, marginBottom: 12 },
  modeCard:         { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 28 },
  modeBtn:          { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 8 },
  modeIcon:         { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  modeBtnText:      { flex: 1 },
  modeBtnTitle:     { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 2 },
  modeBtnSub:       { fontSize: 12, color: C.muted, lineHeight: 17 },
  divider:          { height: 1, backgroundColor: C.border, marginVertical: 12 },
  howStep:          { flexDirection: "row", gap: 12, marginBottom: 16 },
  howNum:           { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(168,85,247,0.2)", alignItems: "center", justifyContent: "center", marginTop: 2 },
  howNumText:       { color: C.purple, fontWeight: "800", fontSize: 13 },
  howTitle:         { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 2 },
  howDesc:          { fontSize: 12, color: C.muted, lineHeight: 17 },
  inputGroup:       { marginBottom: 16 },
  inputLabel:       { fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: "600" },
  input:            { backgroundColor: C.card, borderRadius: 12, padding: 14, color: C.text, fontSize: 14, borderWidth: 1, borderColor: C.border },
  thresholdRow:     { flexDirection: "row", gap: 8 },
  thresholdBtn:     { flex: 1, backgroundColor: C.card, borderRadius: 10, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: C.border },
  thresholdBtnActive:{ borderColor: C.accent },
  thresholdText:    { color: C.muted, fontWeight: "700" },
  primaryBtn:       { backgroundColor: C.accent, borderRadius: 14, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 },
  primaryBtnText:   { color: "white", fontWeight: "700", fontSize: 15 },
  qrCard:           { backgroundColor: C.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border, alignItems: "center", marginBottom: 16 },
  qrTitle:          { fontSize: 15, fontWeight: "700", color: C.text, textAlign: "center", marginBottom: 4 },
  qrSub:            { fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 20 },
  qrWrapper:        { padding: 16, backgroundColor: C.card, borderRadius: 12 },
  qrExpiry:         { fontSize: 11, color: C.warning, marginTop: 12 },
  demoBtn:          { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "rgba(0,198,255,0.1)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(0,198,255,0.3)" },
  demoBtnText:      { color: C.accent, fontWeight: "600", fontSize: 13 },
  linkedBadge:      { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  tokenCard:        { backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border },
  tokenLabel:       { fontSize: 11, color: C.muted, marginBottom: 4 },
  tokenValue:       { fontSize: 11, color: "#555", fontFamily: "monospace" },
  userCard:         { backgroundColor: C.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border, alignItems: "center" },
  userDesc:         { fontSize: 14, color: C.text, textAlign: "center", lineHeight: 20 },
  cameraCard:       { height: 400, borderRadius: 20, overflow: "hidden", position: "relative", backgroundColor: "black" },
  camera:           { flex: 1 },
  cancelBtn:        { position: "absolute", bottom: 20, alignSelf: "center", backgroundColor: "rgba(0,0,0,0.6)", padding: 12, borderRadius: 10 },
});

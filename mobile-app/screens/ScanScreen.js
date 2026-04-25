// SafeNet AI — Scan Screen
// Manual URL scanner + handles shared URLs from WhatsApp/SMS

import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Share, Clipboard, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ExpoClipboard from "expo-clipboard";

import { API_BASE, DEVICE_USER_ID } from "../config";

const C = {
  bg: "#0d0d16", card: "#161625", accent: "#00c6ff",
  danger: "#ff4444", warning: "#ffaa00", safe: "#00e676",
  text: "#ffffff", muted: "#666680", border: "rgba(255,255,255,0.06)",
};

const LANG = {
  en: {
    title: "Scan URL",
    placeholder: "Paste URL or paste from WhatsApp...",
    scan: "Scan Now",
    paste: "Paste",
    safe: "This site looks safe",
    caution: "Proceed with caution",
    danger: "SCAM DETECTED — Do not proceed",
    riskFactors: "Risk Factors",
    scanTime: "Scan time",
    recommendation: "Recommendation",
  },
  ms: {
    title: "Imbas URL",
    placeholder: "Tampal URL atau pautan dari WhatsApp...",
    scan: "Imbas Sekarang",
    paste: "Tampal",
    safe: "Laman web ini kelihatan selamat",
    caution: "Teruskan dengan berhati-hati",
    danger: "PENIPUAN DIKESAN — Jangan teruskan",
    riskFactors: "Faktor Risiko",
    scanTime: "Masa imbasan",
    recommendation: "Cadangan",
  },
};

export default function ScanScreen() {
  const [url, setUrl]         = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [lang, setLang]       = useState("en");
  const inputRef = useRef(null);
  const t = LANG[lang];

  // Handle deep link / share extension: safenetai://scan?url=...
  useEffect(() => {
    const handleUrl = ({ url: incomingUrl }) => {
      if (incomingUrl?.startsWith("safenetai://scan")) {
        const parsed = new URL(incomingUrl);
        const sharedUrl = parsed.searchParams.get("url");
        if (sharedUrl) {
          setUrl(sharedUrl);
          scan(sharedUrl);
        }
      }
    };

    const sub = Linking.addEventListener("url", handleUrl);
    Linking.getInitialURL().then((u) => {
      if (u) handleUrl({ url: u });
    });

    return () => sub?.remove();
  }, []);

  async function pasteFromClipboard() {
    const text = await ExpoClipboard.getStringAsync();
    if (text) setUrl(text);
  }

  async function scan(urlOverride) {
    const target = (urlOverride || url).trim();
    if (!target) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: target.startsWith("http") ? target : "https://" + target,
          userId: DEVICE_USER_ID,
          deviceType: "MOBILE",
        }),
      });

      if (!response.ok) throw new Error("API error: " + response.status);
      const data = await response.json();
      setResult(data);
    } catch (e) {
      setError("Could not reach SafeNet AI backend. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  const severity = result?.severity?.toLowerCase();
  const severityConfig = {
    high:   { color: C.danger,  icon: "ban",              bg: "rgba(255,68,68,0.08)",   border: "rgba(255,68,68,0.3)"   },
    medium: { color: C.warning, icon: "warning",           bg: "rgba(255,170,0,0.08)",  border: "rgba(255,170,0,0.3)"  },
    low:    { color: C.safe,    icon: "checkmark-circle",  bg: "rgba(0,230,118,0.08)",  border: "rgba(0,230,118,0.3)"  },
  }[severity] || { color: C.accent, icon: "scan", bg: C.card, border: C.border };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{t.title}</Text>
          {/* Language toggle */}
          <TouchableOpacity
            style={s.langToggle}
            onPress={() => setLang(l => l === "en" ? "ms" : "en")}
          >
            <Text style={s.langText}>{lang === "en" ? "🇲🇾 BM" : "🇬🇧 EN"}</Text>
          </TouchableOpacity>
        </View>

        {/* Input */}
        <View style={s.inputCard}>
          <TextInput
            ref={inputRef}
            style={s.input}
            value={url}
            onChangeText={setUrl}
            placeholder={t.placeholder}
            placeholderTextColor={C.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="search"
            onSubmitEditing={() => scan()}
            multiline
          />
          <View style={s.inputActions}>
            <TouchableOpacity style={s.pasteBtn} onPress={pasteFromClipboard}>
              <Ionicons name="clipboard" size={14} color={C.accent} />
              <Text style={s.pasteBtnText}>{t.paste}</Text>
            </TouchableOpacity>
            {url.length > 0 && (
              <TouchableOpacity onPress={() => setUrl("")}>
                <Ionicons name="close-circle" size={18} color={C.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Scan button */}
        <TouchableOpacity
          style={[s.scanBtn, (!url.trim() || loading) && s.scanBtnDisabled]}
          onPress={() => scan()}
          disabled={!url.trim() || loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="white" size="small" />
            : <>
                <Ionicons name="shield-checkmark" size={18} color="white" />
                <Text style={s.scanBtnText}>{t.scan}</Text>
              </>
          }
        </TouchableOpacity>

        {/* Error */}
        {error && (
          <View style={s.errorBox}>
            <Ionicons name="warning" size={16} color={C.warning} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={[s.resultCard, { backgroundColor: severityConfig.bg, borderColor: severityConfig.border }]}>

            {/* Score header */}
            <View style={s.resultHeader}>
              <View>
                <Text style={[s.severityText, { color: severityConfig.color }]}>
                  {t[severity] || "Result"}
                </Text>
                <Text style={s.domainText}>{result.scannedDomain}</Text>
              </View>
              <View style={[s.scoreBadge, { borderColor: severityConfig.color }]}>
                <Text style={[s.scoreNum, { color: severityConfig.color }]}>
                  {result.riskScore}
                </Text>
                <Text style={s.scoreDenom}>/100</Text>
              </View>
            </View>

            {/* Reasons */}
            <Text style={s.sectionLabel}>{t.riskFactors}</Text>
            {result.reasons?.map((r, i) => (
              <View key={i} style={s.reasonRow}>
                <Ionicons name="chevron-forward" size={12} color={severityConfig.color} style={{ marginTop: 2 }} />
                <Text style={s.reasonText}>{r}</Text>
              </View>
            ))}

            {/* Recommendation */}
            <View style={[s.recommendationBox, { borderLeftColor: severityConfig.color }]}>
              <Text style={s.sectionLabel}>{t.recommendation}</Text>
              <Text style={s.recommendationText}>{result.recommendation}</Text>
            </View>

            {/* Metadata */}
            <Text style={s.metaText}>
              {t.scanTime}: {result.scanDurationMs}ms
              {result.guardianAlerted ? "  ·  👨‍👩‍👧 Guardian notified" : ""}
            </Text>
          </View>
        )}

        {/* Share from WhatsApp tip */}
        {!result && !loading && (
          <View style={s.tipBox}>
            <Text style={s.tipTitle}>💡 Tip</Text>
            <Text style={s.tipText}>
              Received a suspicious link on WhatsApp or SMS?
              {"\n"}Long-press the link → Share → SafeNet AI
            </Text>
            <Text style={s.tipText}>
              {"\n"}Dapat pautan mencurigakan di WhatsApp?
              {"\n"}Tekan lama → Kongsi → SafeNet AI
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  scroll:         { padding: 20 },
  header:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title:          { fontSize: 22, fontWeight: "800", color: C.text },
  langToggle:     { backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  langText:       { fontSize: 13, color: C.text, fontWeight: "600" },
  inputCard:      { backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  input:          { color: C.text, fontSize: 14, minHeight: 44, lineHeight: 20 },
  inputActions:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  pasteBtn:       { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,198,255,0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pasteBtnText:   { fontSize: 12, color: C.accent, fontWeight: "600" },
  scanBtn:        { backgroundColor: C.accent, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 },
  scanBtnDisabled:{ opacity: 0.4 },
  scanBtnText:    { color: "white", fontWeight: "700", fontSize: 16 },
  errorBox:       { flexDirection: "row", gap: 8, backgroundColor: "rgba(255,170,0,0.1)", borderRadius: 12, padding: 12, marginBottom: 16, alignItems: "center" },
  errorText:      { color: C.warning, fontSize: 13, flex: 1 },
  resultCard:     { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  resultHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  severityText:   { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  domainText:     { fontSize: 13, color: C.muted },
  scoreBadge:     { alignItems: "center", borderWidth: 2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  scoreNum:       { fontSize: 28, fontWeight: "800", lineHeight: 32 },
  scoreDenom:     { fontSize: 11, color: C.muted },
  sectionLabel:   { fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: C.muted, marginBottom: 8 },
  reasonRow:      { flexDirection: "row", gap: 6, marginBottom: 6, alignItems: "flex-start" },
  reasonText:     { fontSize: 13, color: "#ddd", flex: 1, lineHeight: 18 },
  recommendationBox: { borderLeftWidth: 3, paddingLeft: 12, marginTop: 14, marginBottom: 10 },
  recommendationText:{ fontSize: 13, color: "#ccc", lineHeight: 20 },
  metaText:       { fontSize: 11, color: C.muted, marginTop: 8 },
  tipBox:         { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  tipTitle:       { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 8 },
  tipText:        { fontSize: 13, color: C.muted, lineHeight: 20 },
});

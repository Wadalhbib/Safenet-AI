// SafeNet AI — Alert Detail Screen
// Shown when a guardian taps a Family Alert push notification.
// Displays full details of the scam their family member tried to visit.

import React from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Linking, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const C = {
  bg: "#0d0d16", card: "#161625", accent: "#00c6ff",
  danger: "#ff4444", warning: "#ffaa00", safe: "#00e676",
  text: "#ffffff", muted: "#666680", border: "rgba(255,255,255,0.06)",
  purple: "#a855f7",
};

export default function AlertDetailScreen({ navigation, route }) {
  // Data passed from notification tap or history navigation
  const {
    domain       = "unknown-site.xyz",
    riskScore    = 95,
    reasons      = ["Known scam domain", "Suspicious TLD"],
    userId       = "family_member",
    userDisplayName = "Your family member",
    scannedAt    = new Date().toISOString(),
    bypassAttempted = true,
  } = route?.params || {};

  const timeStr = scannedAt
    ? new Date(scannedAt).toLocaleString("en-MY", {
        dateStyle: "medium", timeStyle: "short",
      })
    : "Unknown time";

  async function callFamilyMember() {
    // In production: look up phone number from guardian link
    Linking.openURL("tel:+601112345678");
  }

  async function shareAlert() {
    await Share.share({
      message:
        `SafeNet AI Alert\n\n` +
        `${userDisplayName} visited a HIGH-RISK scam site:\n` +
        `${domain} (Risk: ${riskScore}/100)\n\n` +
        `Time: ${timeStr}\n\n` +
        `Please check on them immediately.`,
      title: "SafeNet AI — Guardian Alert",
    });
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <TouchableOpacity style={s.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={C.accent} />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

        {/* Alert banner */}
        <View style={s.alertBanner}>
          <View style={s.alertIconCircle}>
            <Ionicons name="warning" size={32} color={C.danger} />
          </View>
          <Text style={s.alertTitle}>Guardian Alert</Text>
          <Text style={s.alertSub}>
            {userDisplayName} visited a dangerous site
          </Text>
          <Text style={s.alertTime}>{timeStr}</Text>
        </View>

        {/* Score card */}
        <View style={s.scoreCard}>
          <View style={s.scoreLeft}>
            <Text style={s.scoreNum}>{riskScore}</Text>
            <Text style={s.scoreDenom}>/100</Text>
          </View>
          <View style={s.scoreRight}>
            <View style={s.highBadge}>
              <Text style={s.highBadgeText}>HIGH RISK</Text>
            </View>
            <Text style={s.scoreDomain}>{domain}</Text>
            {bypassAttempted && (
              <View style={s.bypassRow}>
                <Ionicons name="alert-circle" size={14} color={C.warning} />
                <Text style={s.bypassText}>They attempted to bypass the warning</Text>
              </View>
            )}
          </View>
        </View>

        {/* Risk reasons */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Why was this flagged?</Text>
          {(Array.isArray(reasons) ? reasons : reasons.split("|").map(r => r.trim()))
            .map((r, i) => (
              <View key={i} style={s.reasonRow}>
                <Ionicons name="chevron-forward" size={13} color={C.danger} style={{ marginTop: 2 }} />
                <Text style={s.reasonText}>{r}</Text>
              </View>
            ))}
        </View>

        {/* What scammers do */}
        <View style={[s.section, s.infoBox]}>
          <Text style={s.sectionLabel}>What scammers do on sites like this</Text>
          <Text style={s.infoText}>
            Sites with this risk profile typically steal MyKad numbers, banking
            credentials, TAC codes, and KWSP details. They create a sense of urgency
            to pressure victims into acting before thinking.
          </Text>
          <Text style={[s.infoText, { marginTop: 8 }]}>
            Laman web seperti ini biasanya mencuri nombor MyKad, butiran perbankan,
            dan kod TAC. Mereka mewujudkan rasa terdesak supaya mangsa bertindak
            tanpa berfikir panjang.
          </Text>
        </View>

        {/* Actions */}
        <Text style={s.sectionLabel}>Actions</Text>

        <TouchableOpacity style={s.actionBtn} onPress={callFamilyMember} activeOpacity={0.8}>
          <View style={[s.actionIcon, { backgroundColor: "rgba(0,198,255,0.15)" }]}>
            <Ionicons name="call" size={20} color={C.accent} />
          </View>
          <View style={s.actionText}>
            <Text style={s.actionTitle}>Call {userDisplayName}</Text>
            <Text style={s.actionSub}>Check that they are safe</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={s.actionBtn} onPress={shareAlert} activeOpacity={0.8}>
          <View style={[s.actionIcon, { backgroundColor: "rgba(168,85,247,0.15)" }]}>
            <Ionicons name="share-social" size={20} color={C.purple} />
          </View>
          <View style={s.actionText}>
            <Text style={s.actionTitle}>Share Alert</Text>
            <Text style={s.actionSub}>Inform other family members</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.actionBtn}
          onPress={() => Linking.openURL("https://ccid.rmp.gov.my")}
          activeOpacity={0.8}
        >
          <View style={[s.actionIcon, { backgroundColor: "rgba(255,68,68,0.15)" }]}>
            <Ionicons name="shield" size={20} color={C.danger} />
          </View>
          <View style={s.actionText}>
            <Text style={s.actionTitle}>Report to PDRM</Text>
            <Text style={s.actionSub}>File a cybercrime report at ccid.rmp.gov.my</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.muted} />
        </TouchableOpacity>

        {/* Footer */}
        <Text style={s.footer}>
          SafeNet AI — Protecting Malaysian families from online scams
        </Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.bg },
  scroll:        { padding: 20 },
  backRow:       { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 },
  backText:      { color: C.accent, fontSize: 15 },

  alertBanner:   { backgroundColor: "rgba(255,68,68,0.08)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,68,68,0.25)", padding: 24, alignItems: "center", marginBottom: 16 },
  alertIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,68,68,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  alertTitle:    { fontSize: 22, fontWeight: "800", color: C.text, marginBottom: 4 },
  alertSub:      { fontSize: 14, color: C.muted, textAlign: "center" },
  alertTime:     { fontSize: 12, color: "#555", marginTop: 6 },

  scoreCard:     { backgroundColor: C.card, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,68,68,0.25)" },
  scoreLeft:     { alignItems: "center" },
  scoreNum:      { fontSize: 52, fontWeight: "900", color: C.danger, lineHeight: 56 },
  scoreDenom:    { fontSize: 13, color: C.muted },
  scoreRight:    { flex: 1, gap: 6 },
  highBadge:     { backgroundColor: "rgba(255,68,68,0.2)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  highBadgeText: { color: C.danger, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  scoreDomain:   { fontSize: 15, color: C.text, fontWeight: "600" },
  bypassRow:     { flexDirection: "row", alignItems: "center", gap: 5 },
  bypassText:    { fontSize: 12, color: C.warning },

  section:       { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  sectionLabel:  { fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: C.muted, marginBottom: 10 },
  reasonRow:     { flexDirection: "row", gap: 6, marginBottom: 6, alignItems: "flex-start" },
  reasonText:    { flex: 1, fontSize: 13, color: "#ddd", lineHeight: 18 },

  infoBox:       { backgroundColor: "rgba(255,68,68,0.05)", borderColor: "rgba(255,68,68,0.15)" },
  infoText:      { fontSize: 13, color: C.muted, lineHeight: 20 },

  actionBtn:     { backgroundColor: C.card, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  actionIcon:    { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionText:    { flex: 1 },
  actionTitle:   { fontSize: 14, fontWeight: "700", color: C.text },
  actionSub:     { fontSize: 12, color: C.muted, marginTop: 2 },

  footer:        { textAlign: "center", fontSize: 11, color: "#333", marginTop: 16 },
});

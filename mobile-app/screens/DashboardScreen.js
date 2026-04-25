// SafeNet AI — Dashboard Screen
// Shows system status, today's stats, and recent threat feed.
// Node.js parallel: This is like your Next.js page component.

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE } from "../config";

const C = {
  bg:      "#0d0d16",
  card:    "#161625",
  accent:  "#00c6ff",
  danger:  "#ff4444",
  warning: "#ffaa00",
  safe:    "#00e676",
  text:    "#ffffff",
  muted:   "#666680",
  border:  "rgba(255,255,255,0.06)",
};

export default function DashboardScreen({ navigation }) {
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // useRef so pulseAnim is created once and survives re-renders
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadStats();
    startPulse();
  }, []);

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }

  async function loadStats() {
    try {
      const r = await fetch(`${API_BASE}/stats`);
      const data = await r.json();
      setStats(data);
    } catch {
      setStats({ totalScans24h: 0, highRiskBlocked24h: 0, blacklistSize: 0, status: "offline" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, []);

  const isOnline = stats?.status === "operational";

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>SafeNet AI 🛡️</Text>
            <Text style={s.subgreeting}>Malaysian Scam Detector</Text>
          </View>
          <View style={[s.statusPill, { backgroundColor: isOnline ? "rgba(0,230,118,0.15)" : "rgba(255,68,68,0.15)" }]}>
            <View style={[s.statusDot, { backgroundColor: isOnline ? C.safe : C.danger }]} />
            <Text style={[s.statusText, { color: isOnline ? C.safe : C.danger }]}>
              {isOnline ? "Protected" : "Offline"}
            </Text>
          </View>
        </View>

        {/* Hero shield */}
        <View style={s.heroContainer}>
          <Animated.View style={[s.shieldOuter, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={isOnline ? ["#00c6ff22", "#0072ff22"] : ["#ff444422", "#cc000022"]}
              style={s.shieldGradient}
            >
              <Text style={s.shieldEmoji}>{isOnline ? "🛡️" : "⚠️"}</Text>
            </LinearGradient>
          </Animated.View>
          <Text style={s.heroTitle}>
            {isOnline ? "You are protected" : "Backend offline"}
          </Text>
          <Text style={s.heroSub}>
            {isOnline
              ? "Real-time scam detection is active"
              : "Start the Java backend to enable protection"}
          </Text>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <StatCard
            value={loading ? "..." : stats?.totalScans24h}
            label="Scans Today"
            icon="scan"
            color={C.accent}
          />
          <StatCard
            value={loading ? "..." : stats?.highRiskBlocked24h}
            label="Blocked"
            icon="ban"
            color={C.danger}
          />
          <StatCard
            value={loading ? "..." : stats?.blacklistSize}
            label="Blacklisted"
            icon="list"
            color={C.warning}
          />
        </View>

        {/* Quick actions */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          <QuickAction
            icon="search"
            label="Scan URL"
            color={C.accent}
            onPress={() => navigation.navigate("Scan")}
          />
          <QuickAction
            icon="time"
            label="History"
            color={C.warning}
            onPress={() => navigation.navigate("History")}
          />
          <QuickAction
            icon="people"
            label="Family Alert"
            color="#a855f7"
            onPress={() => navigation.navigate("Family")}
          />
          <QuickAction
            icon="information-circle"
            label="About"
            color={C.muted}
            onPress={() => {}}
          />
        </View>

        {/* Malaysian scam tips */}
        <Text style={s.sectionTitle}>🇲🇾 Common Malaysian Scams</Text>
        {SCAM_TIPS.map((tip, i) => (
          <View key={i} style={s.tipCard}>
            <Text style={s.tipEmoji}>{tip.emoji}</Text>
            <View style={s.tipContent}>
              <Text style={s.tipTitle}>{tip.title}</Text>
              <Text style={s.tipDesc}>{tip.desc}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label, icon, color }) {
  return (
    <View style={[s.statCard, { borderColor: color + "33" }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[s.statValue, { color }]}>{value ?? "--"}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity
      style={[s.actionCard, { borderColor: color + "33" }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[s.actionIcon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={s.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const SCAM_TIPS = [
  { emoji: "🏦", title: "LHDN / KWSP SMS Scams",
    desc: "LHDN and KWSP will never ask you to click a link to claim refunds or update details." },
  { emoji: "📦", title: "Fake Parcel Delivery",
    desc: "Pos Laju never charges fees via SMS. Ignore messages asking you to pay to release parcels." },
  { emoji: "🛍️", title: "Shopee Lucky Draw",
    desc: "Shopee does not send random winners via WhatsApp. Official promos are only in-app." },
  { emoji: "💳", title: "Bank Phishing",
    desc: "Your bank will never ask for your TAC code, password, or full card number via SMS or call." },
];

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },
  scroll:      { padding: 20 },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greeting:    { fontSize: 22, fontWeight: "800", color: C.text },
  subgreeting: { fontSize: 13, color: C.muted, marginTop: 2 },
  statusPill:  { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot:   { width: 7, height: 7, borderRadius: 4 },
  statusText:  { fontSize: 12, fontWeight: "600" },
  heroContainer: { alignItems: "center", marginBottom: 32 },
  shieldOuter: { marginBottom: 16 },
  shieldGradient: { width: 100, height: 100, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  shieldEmoji: { fontSize: 44 },
  heroTitle:   { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: 6 },
  heroSub:     { fontSize: 13, color: C.muted, textAlign: "center" },
  statsRow:    { flexDirection: "row", gap: 10, marginBottom: 28 },
  statCard:    { flex: 1, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center", gap: 4 },
  statValue:   { fontSize: 22, fontWeight: "800" },
  statLabel:   { fontSize: 10, color: C.muted, textAlign: "center" },
  sectionTitle:{ fontSize: 14, fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  actionCard:  { width: "47%", backgroundColor: C.card, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", gap: 8 },
  actionIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontWeight: "600", color: C.text },
  tipCard:     { flexDirection: "row", gap: 12, backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  tipEmoji:    { fontSize: 26, width: 36, textAlign: "center", marginTop: 2 },
  tipContent:  { flex: 1 },
  tipTitle:    { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 4 },
  tipDesc:     { fontSize: 12, color: C.muted, lineHeight: 18 },
});

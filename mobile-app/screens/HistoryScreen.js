// SafeNet AI — History Screen
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { API_BASE, DEVICE_USER_ID } from "../config";

const C = {
  bg: "#0d0d16", card: "#161625", accent: "#00c6ff",
  danger: "#ff4444", warning: "#ffaa00", safe: "#00e676",
  text: "#ffffff", muted: "#666680", border: "rgba(255,255,255,0.06)",
};

export function HistoryScreen() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]     = useState("ALL"); // ALL | HIGH | MEDIUM | LOW

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    try {
      const r = await fetch(`${API_BASE}/history/${DEVICE_USER_ID}`);
      const data = await r.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, []);

  const filtered = filter === "ALL"
    ? logs
    : logs.filter(l => l.severity === filter);

  const severityColor = { HIGH: C.danger, MEDIUM: C.warning, LOW: C.safe };
  const severityIcon  = { HIGH: "ban", MEDIUM: "warning", LOW: "checkmark-circle" };

  function renderItem({ item }) {
    const color = severityColor[item.severity] || C.muted;
    return (
      <View style={[h.logCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
        <View style={h.logHeader}>
          <Ionicons name={severityIcon[item.severity]} size={16} color={color} />
          <Text style={[h.logScore, { color }]}>{item.riskScore}/100</Text>
          <Text style={[h.logSeverity, { color }]}>{item.severity}</Text>
          {item.bypassAttempted && (
            <View style={h.bypassBadge}>
              <Text style={h.bypassText}>Bypassed</Text>
            </View>
          )}
        </View>
        <Text style={h.logDomain} numberOfLines={1}>{item.scannedDomain}</Text>
        <Text style={h.logReason} numberOfLines={1}>
          {item.reasons?.split("|")[0]?.trim() || "No reason recorded"}
        </Text>
        <Text style={h.logTime}>
          {item.scannedAt
            ? new Date(item.scannedAt).toLocaleString("en-MY")
            : "Unknown time"}
          · {item.deviceType}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={h.container} edges={["top"]}>
      {/* Header */}
      <View style={h.header}>
        <Text style={h.title}>Scan History</Text>
        <Text style={h.count}>{filtered.length} scans</Text>
      </View>

      {/* Filter tabs */}
      <View style={h.filterRow}>
        {["ALL", "HIGH", "MEDIUM", "LOW"].map(f => (
          <TouchableOpacity
            key={f}
            style={[h.filterTab, filter === f && h.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[h.filterText, filter === f && { color: C.accent }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        ListEmptyComponent={
          <View style={h.empty}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🔍</Text>
            <Text style={h.emptyText}>No scans yet</Text>
            <Text style={[h.emptyText, { fontSize: 12, marginTop: 4 }]}>
              Start scanning URLs from the Scan tab
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const h = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  header:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 12 },
  title:          { fontSize: 22, fontWeight: "800", color: C.text },
  count:          { fontSize: 13, color: C.muted },
  filterRow:      { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  filterTab:      { flex: 1, paddingVertical: 7, borderRadius: 10, backgroundColor: C.card, alignItems: "center", borderWidth: 1, borderColor: C.border },
  filterTabActive:{ borderColor: C.accent },
  filterText:     { fontSize: 11, fontWeight: "700", color: C.muted, textTransform: "uppercase" },
  logCard:        { backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  logHeader:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  logScore:       { fontWeight: "800", fontSize: 14 },
  logSeverity:    { fontSize: 11, fontWeight: "700", flex: 1 },
  bypassBadge:    { backgroundColor: "rgba(255,68,68,0.2)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  bypassText:     { color: C.danger, fontSize: 10, fontWeight: "700" },
  logDomain:      { fontSize: 14, color: C.text, fontWeight: "600", marginBottom: 2 },
  logReason:      { fontSize: 12, color: C.muted, marginBottom: 4 },
  logTime:        { fontSize: 11, color: "#444" },
  empty:          { alignItems: "center", paddingTop: 60 },
  emptyText:      { color: C.muted, fontSize: 15, fontWeight: "600" },
});

export default HistoryScreen;

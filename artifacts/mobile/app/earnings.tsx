import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

type Payout = {
  id: string;
  date: string;
  gig: string;
  employer: string;
  hours: number;
  amount: number;
  status: "paid" | "pending" | "processing";
  method: "Direct Deposit" | "Pay Card" | "Pay Check";
};

const PAYOUTS: Payout[] = [
  { id: "p1", date: "Apr 22", gig: "Banquet Server", employer: "Hilton Austin", hours: 6, amount: 138.0, status: "paid", method: "Direct Deposit" },
  { id: "p2", date: "Apr 20", gig: "Forklift Operator", employer: "Amazon DFW7", hours: 8, amount: 192.0, status: "paid", method: "Direct Deposit" },
  { id: "p3", date: "Apr 18", gig: "Cashier", employer: "Whole Foods", hours: 5, amount: 90.0, status: "paid", method: "Direct Deposit" },
  { id: "p4", date: "Apr 17", gig: "Bartender", employer: "Moody Theater", hours: 7, amount: 245.0, status: "processing", method: "Pay Card" },
  { id: "p5", date: "Apr 15", gig: "Catering Server", employer: "Fairmont Austin", hours: 6, amount: 144.0, status: "paid", method: "Direct Deposit" },
  { id: "p6", date: "Apr 13", gig: "Stock Associate", employer: "Target SOCO", hours: 8, amount: 168.0, status: "paid", method: "Direct Deposit" },
  { id: "p7", date: "Apr 11", gig: "Event Setup Crew", employer: "ACL Live", hours: 4, amount: 88.0, status: "paid", method: "Direct Deposit" },
];

const WEEKLY = [
  { label: "M", value: 0 },
  { label: "T", value: 192 },
  { label: "W", value: 90 },
  { label: "T", value: 245 },
  { label: "F", value: 144 },
  { label: "S", value: 138 },
  { label: "S", value: 0 },
];

type Range = "week" | "month" | "year";

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? insets.top + 8 : insets.top;
  const [range, setRange] = useState<Range>("week");

  const totals = useMemo(() => {
    const weekTotal = WEEKLY.reduce((s, d) => s + d.value, 0);
    const monthTotal = PAYOUTS.reduce((s, p) => s + p.amount, 0);
    const lifetimeTotal = monthTotal * 6.4;
    const totalHours = PAYOUTS.reduce((s, p) => s + p.hours, 0);
    const avgHourly = totalHours ? monthTotal / totalHours : 0;
    return { weekTotal, monthTotal, lifetimeTotal, totalHours, avgHourly };
  }, []);

  const displayed =
    range === "week" ? totals.weekTotal : range === "month" ? totals.monthTotal : totals.lifetimeTotal;
  const rangeLabel = range === "week" ? "This Week" : range === "month" ? "This Month" : "Lifetime";

  const maxBar = Math.max(...WEEKLY.map((d) => d.value), 1);
  const pendingTotal = PAYOUTS.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);

  function press<T extends string>(setter: (v: T) => void, v: T) {
    Haptics.selectionAsync();
    setter(v);
  }

  function statusStyle(s: Payout["status"]) {
    if (s === "paid") return { bg: "#dcfce7", color: "#15803d", label: "Paid" };
    if (s === "processing") return { bg: "#dbeafe", color: "#1d4ed8", label: "Processing" };
    return { bg: "#fef3c7", color: "#a16207", label: "Pending" };
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings & Payouts</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero balance */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>{rangeLabel} Earnings</Text>
          <Text style={styles.heroAmount}>
            ${displayed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.rangeRow}>
            {(["week", "month", "year"] as Range[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.rangeChip, range === r && styles.rangeChipActive]}
                onPress={() => press(setRange, r)}
                activeOpacity={0.8}
              >
                <Text style={[styles.rangeChipText, range === r && styles.rangeChipTextActive]}>
                  {r === "week" ? "Week" : r === "month" ? "Month" : "Year"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Feather name="clock" size={14} color="#2563eb" />
            <Text style={styles.statValue}>{totals.totalHours}h</Text>
            <Text style={styles.statLabel}>Hours Worked</Text>
          </View>
          <View style={styles.statTile}>
            <Feather name="trending-up" size={14} color="#16a34a" />
            <Text style={styles.statValue}>${totals.avgHourly.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Avg / Hour</Text>
          </View>
          <View style={styles.statTile}>
            <Feather name="clock" size={14} color="#d97706" />
            <Text style={styles.statValue}>${pendingTotal.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Weekly chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <Text style={styles.sectionMeta}>${totals.weekTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {WEEKLY.map((d, i) => {
                const px = Math.max((d.value / maxBar) * 78, 6);
                return (
                  <View key={i} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: px, backgroundColor: d.value > 0 ? "#2563eb" : "#e5e7eb" },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{d.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Next payout card */}
        <View style={styles.section}>
          <View style={styles.payoutCard}>
            <View style={styles.payoutIcon}>
              <Feather name="calendar" size={16} color="#16a34a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.payoutLabel}>Next Payout</Text>
              <Text style={styles.payoutAmount}>${pendingTotal.toFixed(2)}</Text>
              <Text style={styles.payoutSub}>Estimated Friday, Apr 24 · Direct Deposit</Text>
            </View>
          </View>
        </View>

        {/* Recent payouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Payouts</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.list}>
            {PAYOUTS.map((p, i) => {
              const st = statusStyle(p.status);
              return (
                <View key={p.id} style={[styles.row, i !== PAYOUTS.length - 1 && styles.rowBorder]}>
                  <View style={styles.rowIcon}>
                    <Feather name="briefcase" size={14} color="#64748b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{p.gig}</Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {p.employer} · {p.date} · {p.hours}h
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.rowAmount}>${p.amount.toFixed(2)}</Text>
                    <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.footnote}>
          Earnings are estimated and may differ slightly from final payouts after tips and adjustments.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0759af",
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.2 },

  hero: {
    backgroundColor: "#0759af",
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 18,
    alignItems: "center",
  },
  heroLabel: { fontSize: 11, color: "#bfdbfe", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  heroAmount: { fontSize: 30, fontWeight: "900", color: "#fff", letterSpacing: -0.8, marginTop: 2 },
  rangeRow: { flexDirection: "row", gap: 4, marginTop: 10, backgroundColor: "rgba(255,255,255,0.12)", padding: 3, borderRadius: 999 },
  rangeChip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999 },
  rangeChipActive: { backgroundColor: "#fff" },
  rangeChipText: { fontSize: 12, color: "#dbeafe", fontWeight: "700" },
  rangeChipTextActive: { color: "#0759af" },

  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: -12 },
  statTile: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 2,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  statValue: { fontSize: 14, fontWeight: "900", color: "#111827", letterSpacing: -0.3 },
  statLabel: { fontSize: 9, color: "#6b7280", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },

  section: { paddingHorizontal: 16, paddingTop: 14 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  sectionTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: "#111827", letterSpacing: -0.2 },
  sectionMeta: { fontSize: 13, fontWeight: "800", color: "#2563eb" },
  seeAll: { fontSize: 12, fontWeight: "700", color: "#2563eb" },

  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
  },
  chart: { flexDirection: "row", alignItems: "flex-end", height: 90, gap: 8 },
  barCol: { flex: 1, alignItems: "center", gap: 6 },
  barTrack: { width: "100%", flex: 1, backgroundColor: "#f3f4f6", borderRadius: 6, overflow: "hidden", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 6 },
  barLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "700" },

  payoutCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    padding: 12,
  },
  payoutIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  payoutLabel: { fontSize: 10, color: "#15803d", fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  payoutAmount: { fontSize: 17, fontWeight: "900", color: "#14532d", letterSpacing: -0.4, marginTop: 1 },
  payoutSub: { fontSize: 10, color: "#166534", marginTop: 1 },

  list: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 9, gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 12, fontWeight: "700", color: "#111827" },
  rowSub: { fontSize: 10, color: "#6b7280", marginTop: 1 },
  rowAmount: { fontSize: 13, fontWeight: "800", color: "#111827" },
  statusPill: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999, marginTop: 3 },
  statusText: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },

  footnote: { fontSize: 10, color: "#9ca3af", textAlign: "center", paddingHorizontal: 32, marginTop: 14, lineHeight: 14 },
});

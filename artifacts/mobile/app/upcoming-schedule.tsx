import React from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { UPCOMING_SHIFTS, UpcomingShift } from "@/data/upcomingShifts";

const CATEGORY_COLORS: Record<string, { icon: string; color: string; bg: string }> = {
  warehouse:    { icon: "package",   color: "#2563eb", bg: "#dbeafe" },
  hospitality:  { icon: "coffee",    color: "#7c3aed", bg: "#ede9fe" },
  office:       { icon: "monitor",   color: "#0891b2", bg: "#cffafe" },
  events:       { icon: "star",      color: "#d97706", bg: "#fef3c7" },
  retail:       { icon: "shopping-bag", color: "#059669", bg: "#d1fae5" },
  default:      { icon: "briefcase", color: "#2563eb", bg: "#dbeafe" },
};

function getCategory(title: string) {
  const t = title.toLowerCase();
  if (t.includes("warehouse") || t.includes("forklift")) return CATEGORY_COLORS.warehouse;
  if (t.includes("bartender") || t.includes("cook") || t.includes("dish")) return CATEGORY_COLORS.hospitality;
  if (t.includes("receptionist") || t.includes("office")) return CATEGORY_COLORS.office;
  if (t.includes("event")) return CATEGORY_COLORS.events;
  if (t.includes("retail") || t.includes("floor")) return CATEGORY_COLORS.retail;
  return CATEGORY_COLORS.default;
}

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 0) return `In ${diff} days`;
  return "Past";
}

export default function UpcomingScheduleScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const upcoming = UPCOMING_SHIFTS;
  const totalHours = upcoming.reduce((s, e) => s + e.durationHours, 0);
  const totalEarnings = upcoming.reduce((s, e) => s + e.estimatedEarnings, 0);

  return (
    <View style={styles.root}>
      {/* ── HEADER ── */}
      <LinearGradient
        colors={["#0a47a9", "#1e63d0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPadding + 14 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upcoming Schedule</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Summary strip */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{upcoming.length}</Text>
            <Text style={styles.summaryLabel}>Shifts</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalHours}h</Text>
            <Text style={styles.summaryLabel}>Total Hours</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>${totalEarnings.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Est. Earnings</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── LIST ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {upcoming.map((shift, idx) => {
          const cat = getCategory(shift.jobTitle);
          const countdownText = daysUntil(shift.dateISO);
          const isToday = countdownText === "Today";
          const isTomorrow = countdownText === "Tomorrow";

          return (
            <TouchableOpacity
              key={shift.id}
              style={styles.card}
              activeOpacity={0.92}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/shift/${shift.id}`);
              }}
            >
              {/* Countdown ribbon */}
              {(isToday || isTomorrow) && (
                <View style={[styles.ribbon, { backgroundColor: isToday ? "#ef4444" : "#f59e0b" }]}>
                  <Feather name={isToday ? "zap" : "clock"} size={10} color="#fff" />
                  <Text style={styles.ribbonText}>{countdownText.toUpperCase()}</Text>
                </View>
              )}

              {/* Top row */}
              <View style={styles.cardTop}>
                <View style={[styles.catIcon, { backgroundColor: cat.bg }]}>
                  <Feather name={cat.icon as any} size={20} color={cat.color} />
                </View>
                <View style={styles.cardTopMid}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{shift.jobTitle}</Text>
                  <Text style={styles.cardCompany}>{shift.company}</Text>
                </View>
                <View style={styles.earningsBadge}>
                  <Text style={styles.earningsValue}>
                    ${shift.estimatedEarnings.toLocaleString()}
                  </Text>
                  <Text style={styles.earningsLabel}>est.</Text>
                </View>
              </View>

              {/* Info rows */}
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Feather name="calendar" size={13} color="#6366f1" />
                  <Text style={styles.infoText}>{shift.displayDate}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Feather name="clock" size={13} color="#6366f1" />
                  <Text style={styles.infoText}>{shift.startTime} – {shift.endTime}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Feather name="map-pin" size={13} color="#6366f1" />
                  <Text style={styles.infoText} numberOfLines={1}>{shift.location}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Feather name="activity" size={13} color="#6366f1" />
                  <Text style={styles.infoText}>{shift.durationHours}h · ${shift.payRate}{shift.payType === "hourly" ? "/hr" : " flat"}</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.countdownBadge}>
                  <Text style={[
                    styles.countdownText,
                    isToday && { color: "#ef4444" },
                    isTomorrow && { color: "#f59e0b" },
                  ]}>
                    {countdownText}
                  </Text>
                </View>
                <View style={styles.confirmedBadge}>
                  <Feather name="check-circle" size={12} color="#10b981" />
                  <Text style={styles.confirmedText}>Confirmed</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {upcoming.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="calendar" size={30} color="#3b82f6" />
            </View>
            <Text style={styles.emptyTitle}>No upcoming shifts</Text>
            <Text style={styles.emptyBody}>
              Shifts you accept will appear here. Browse jobs to get started.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.push("/(tabs)/jobs")}
              activeOpacity={0.88}
            >
              <Text style={styles.browseBtnText}>Browse Jobs</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f3f4f8" },

  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },

  summaryRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 3 },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "stretch",
  },
  summaryValue: { fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  list: { padding: 16, gap: 0 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#4f46e5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },

  ribbon: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomLeftRadius: 12,
  },
  ribbonText: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },

  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  catIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTopMid: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#111827", letterSpacing: -0.2 },
  cardCompany: { fontSize: 13, color: "#6b7280", fontWeight: "500" },

  earningsBadge: { alignItems: "flex-end" },
  earningsValue: { fontSize: 18, fontWeight: "800", color: "#10b981", letterSpacing: -0.3 },
  earningsLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600" },

  infoGrid: {
    backgroundColor: "#f8f9ff",
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#ebebff",
  },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13, color: "#374151", fontWeight: "500", flex: 1 },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  countdownBadge: {},
  countdownText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366f1",
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  confirmedText: { fontSize: 12, fontWeight: "700", color: "#10b981" },

  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 30,
    gap: 10,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: "#1e40af" },
  emptyBody: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 21,
  },
  browseBtn: {
    marginTop: 8,
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  browseBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});

import React, { useState } from "react";
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

type FilterPeriod = "week" | "month" | "all";

interface ApprovedShift {
  id: string;
  jobTitle: string;
  date: string;
  dateObj: Date;
  company: string;
  address: string;
  clockIn: string;
  clockOut: string;
  totalHours: number;
  payRate: number;
  totalEarnings: number;
  status: "approved" | "pending_approval" | "disputed";
}

const SHIFTS: ApprovedShift[] = [
  {
    id: "s1",
    jobTitle: "ASAP – Dishwasher",
    date: "Apr 6, 2026",
    dateObj: new Date(2026, 3, 6),
    company: "Active Hospitality",
    address: "10018 4th Ave, Brooklyn, NY 11209",
    clockIn: "3:57 AM",
    clockOut: "10:05 AM",
    totalHours: 6.13,
    payRate: 18,
    totalEarnings: 110.34,
    status: "approved",
  },
  {
    id: "s2",
    jobTitle: "ASAP – Cook",
    date: "Apr 4, 2026",
    dateObj: new Date(2026, 3, 4),
    company: "Active Hospitality",
    address: "150 Main Street, Huntington, NY 11743",
    clockIn: "11:35 PM",
    clockOut: "4:42 AM",
    totalHours: 5.11,
    payRate: 25,
    totalEarnings: 127.75,
    status: "approved",
  },
  {
    id: "s3",
    jobTitle: "Warehouse Associate",
    date: "Apr 2, 2026",
    dateObj: new Date(2026, 3, 2),
    company: "Amazon Logistics",
    address: "55 Water St, Brooklyn, NY 11201",
    clockIn: "8:00 AM",
    clockOut: "4:00 PM",
    totalHours: 8.0,
    payRate: 22,
    totalEarnings: 176.0,
    status: "approved",
  },
  {
    id: "s4",
    jobTitle: "Lead Bartender",
    date: "Mar 30, 2026",
    dateObj: new Date(2026, 2, 30),
    company: "The Grand Hotel",
    address: "780 Seventh Ave, Manhattan, NY 10019",
    clockIn: "4:00 PM",
    clockOut: "12:00 AM",
    totalHours: 8.0,
    payRate: 30,
    totalEarnings: 240.0,
    status: "approved",
  },
  {
    id: "s5",
    jobTitle: "Event Staff",
    date: "Mar 28, 2026",
    dateObj: new Date(2026, 2, 28),
    company: "Prestige Events Co.",
    address: "132 W 22nd St, Chelsea, NY 10011",
    clockIn: "6:00 PM",
    clockOut: "11:00 PM",
    totalHours: 5.0,
    payRate: 50,
    totalEarnings: 250.0,
    status: "pending_approval",
  },
  {
    id: "s6",
    jobTitle: "Office Receptionist",
    date: "Mar 25, 2026",
    dateObj: new Date(2026, 2, 25),
    company: "MetaLaw LLP",
    address: "350 Fifth Ave, Midtown, NY 10118",
    clockIn: "9:00 AM",
    clockOut: "5:00 PM",
    totalHours: 8.0,
    payRate: 18,
    totalEarnings: 144.0,
    status: "approved",
  },
];

const STATUS_CFG = {
  approved:         { label: "Approved",         color: "#10b981", bg: "#d1fae5", icon: "check-circle" as const },
  pending_approval: { label: "Pending Approval",  color: "#f59e0b", bg: "#fef3c7", icon: "clock"        as const },
  disputed:         { label: "Disputed",          color: "#ef4444", bg: "#fee2e2", icon: "alert-circle"  as const },
};

function formatCurrency(n: number) {
  return `$${n.toFixed(2)}`;
}

function filterShifts(shifts: ApprovedShift[], period: FilterPeriod) {
  const now = new Date();
  if (period === "week") {
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 7);
    return shifts.filter((s) => s.dateObj >= cutoff);
  }
  if (period === "month") {
    const cutoff = new Date(now);
    cutoff.setMonth(now.getMonth() - 1);
    return shifts.filter((s) => s.dateObj >= cutoff);
  }
  return shifts;
}

export default function TimesheetScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const [period, setPeriod] = useState<FilterPeriod>("month");

  const visible = filterShifts(SHIFTS, period);
  const approvedOnly = visible.filter((s) => s.status === "approved");

  const totalHours    = approvedOnly.reduce((s, e) => s + e.totalHours, 0);
  const totalEarnings = approvedOnly.reduce((s, e) => s + e.totalEarnings, 0);
  const totalShifts   = approvedOnly.length;

  function selectPeriod(p: FilterPeriod) {
    Haptics.selectionAsync();
    setPeriod(p);
  }

  return (
    <View style={styles.root}>
      {/* ── HEADER ── */}
      <LinearGradient
        colors={["#1248c9", "#1e63d0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPadding + 14 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Approved Hours</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Summary row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
            <Text style={styles.summaryLabel}>Hours Logged</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatCurrency(totalEarnings)}</Text>
            <Text style={styles.summaryLabel}>Total Earned</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalShifts}</Text>
            <Text style={styles.summaryLabel}>Shifts</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── PERIOD FILTER ── */}
      <View style={styles.filterBar}>
        {(["week", "month", "all"] as FilterPeriod[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.filterChip, period === p && styles.filterChipActive]}
            onPress={() => selectPeriod(p)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, period === p && styles.filterChipTextActive]}>
              {p === "week" ? "This Week" : p === "month" ? "This Month" : "All Time"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── SHIFT LIST ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {visible.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="check-square" size={30} color="#3b82f6" />
            </View>
            <Text style={styles.emptyTitle}>No approved hours yet</Text>
            <Text style={styles.emptyBody}>
              Completed shifts will appear here once your hours are approved by the employer.
            </Text>
          </View>
        ) : (
          visible.map((shift) => {
            const cfg = STATUS_CFG[shift.status];
            return (
              <TouchableOpacity
                key={shift.id}
                style={styles.card}
                activeOpacity={0.92}
                onPress={() => Haptics.selectionAsync()}
              >
                {/* Card top row */}
                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    <Text style={styles.cardTitle}>{shift.jobTitle}</Text>
                    <View style={styles.cardDateRow}>
                      <Feather name="calendar" size={12} color="#6b7280" />
                      <Text style={styles.cardDate}>{shift.date}</Text>
                    </View>
                  </View>
                  <View style={styles.earningsBadge}>
                    <Text style={styles.earningsBadgeText}>{formatCurrency(shift.totalEarnings)}</Text>
                  </View>
                </View>

                {/* Company info box */}
                <View style={styles.companyBox}>
                  <View style={styles.companyRow}>
                    <View style={styles.companyIconWrap}>
                      <Feather name="briefcase" size={13} color="#2563eb" />
                    </View>
                    <Text style={styles.companyName}>{shift.company}</Text>
                  </View>
                  <View style={styles.companyRow}>
                    <View style={styles.companyIconWrap}>
                      <Feather name="map-pin" size={13} color="#2563eb" />
                    </View>
                    <Text style={styles.companyAddress}>{shift.address}</Text>
                  </View>
                </View>

                {/* Bottom row: time + hours + status */}
                <View style={styles.cardBottom}>
                  <View style={styles.cardBottomLeft}>
                    <Text style={styles.cardBottomLabel}>Shift Time</Text>
                    <View style={styles.cardTimeRow}>
                      <Feather name="clock" size={13} color="#3b82f6" />
                      <Text style={styles.cardTime}>
                        {shift.clockIn} – {shift.clockOut}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardBottomMid}>
                    <Text style={styles.cardBottomLabel}>Hours</Text>
                    <Text style={styles.cardHours}>{shift.totalHours.toFixed(2)} hrs</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Feather name={cfg.icon} size={11} color={cfg.color} />
                    <Text style={[styles.statusBadgeText, { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f3f4f8",
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
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

  // Summary
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "stretch",
  },
  summaryValue: {
    fontSize: 19,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.62)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // Filter bar
  filterBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterChipActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterChipTextActive: {
    color: "#1d4ed8",
  },

  // List
  list: {
    padding: 16,
    gap: 12,
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },

  // Card top
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTopLeft: {
    flex: 1,
    gap: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.2,
  },
  cardDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardDate: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
  },
  earningsBadge: {
    backgroundColor: "#d1fae5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  earningsBadgeText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#065f46",
    letterSpacing: -0.3,
  },

  // Company box
  companyBox: {
    backgroundColor: "#f8faff",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e8eeff",
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  companyIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  companyAddress: {
    fontSize: 13,
    color: "#4b5563",
    flex: 1,
    lineHeight: 18,
  },

  // Card bottom
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 0,
  },
  cardBottomLeft: {
    flex: 1,
    gap: 3,
  },
  cardBottomMid: {
    paddingHorizontal: 16,
    gap: 3,
    alignItems: "flex-end",
  },
  cardBottomLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  cardTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardTime: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  cardHours: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },

  // Status badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
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
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e40af",
  },
  emptyBody: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 21,
  },
});

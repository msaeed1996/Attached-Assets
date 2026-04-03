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
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

interface ShiftEntry {
  id: string;
  date: string;
  dayLabel: string;
  jobTitle: string;
  company: string;
  clockIn: string;
  clockOut: string | null;
  hoursWorked: number;
  payRate: number;
  status: "completed" | "active" | "missed";
}

const WEEKS = ["This Week", "Last Week", "2 Weeks Ago"];

const SHIFTS: ShiftEntry[] = [
  {
    id: "s1",
    date: "Mon, Apr 1",
    dayLabel: "Mon",
    jobTitle: "Warehouse Associate",
    company: "Amazon Logistics",
    clockIn: "07:02 AM",
    clockOut: "03:31 PM",
    hoursWorked: 8.5,
    payRate: 22,
    status: "completed",
  },
  {
    id: "s2",
    date: "Tue, Apr 2",
    dayLabel: "Tue",
    jobTitle: "Warehouse Associate",
    company: "Amazon Logistics",
    clockIn: "06:58 AM",
    clockOut: "03:14 PM",
    hoursWorked: 8.25,
    payRate: 22,
    status: "completed",
  },
  {
    id: "s3",
    date: "Wed, Apr 3",
    dayLabel: "Wed",
    jobTitle: "Forklift Operator",
    company: "FreshFoods Distribution",
    clockIn: "08:00 AM",
    clockOut: null,
    hoursWorked: 4.0,
    payRate: 26,
    status: "active",
  },
  {
    id: "s4",
    date: "Thu, Apr 4",
    dayLabel: "Thu",
    jobTitle: "Warehouse Associate",
    company: "Amazon Logistics",
    clockIn: "—",
    clockOut: "—",
    hoursWorked: 0,
    payRate: 22,
    status: "missed",
  },
  {
    id: "s5",
    date: "Fri, Mar 29",
    dayLabel: "Fri",
    jobTitle: "Event Staff",
    company: "Prestige Events Co.",
    clockIn: "05:00 PM",
    clockOut: "10:45 PM",
    hoursWorked: 5.75,
    payRate: 30,
    status: "completed",
  },
  {
    id: "s6",
    date: "Sat, Mar 30",
    dayLabel: "Sat",
    jobTitle: "Event Staff",
    company: "Prestige Events Co.",
    clockIn: "04:00 PM",
    clockOut: "11:00 PM",
    hoursWorked: 7.0,
    payRate: 30,
    status: "completed",
  },
];

const LAST_WEEK_SHIFTS: ShiftEntry[] = [
  {
    id: "lw1",
    date: "Mon, Mar 25",
    dayLabel: "Mon",
    jobTitle: "Retail Associate",
    company: "Nordstrom Rack",
    clockIn: "09:00 AM",
    clockOut: "05:00 PM",
    hoursWorked: 8.0,
    payRate: 16,
    status: "completed",
  },
  {
    id: "lw2",
    date: "Tue, Mar 26",
    dayLabel: "Tue",
    jobTitle: "Retail Associate",
    company: "Nordstrom Rack",
    clockIn: "09:05 AM",
    clockOut: "05:02 PM",
    hoursWorked: 7.95,
    payRate: 16,
    status: "completed",
  },
  {
    id: "lw3",
    date: "Wed, Mar 27",
    dayLabel: "Wed",
    jobTitle: "Commercial Cleaner",
    company: "SparkleClean Services",
    clockIn: "08:00 PM",
    clockOut: "11:30 PM",
    hoursWorked: 3.5,
    payRate: 19,
    status: "completed",
  },
  {
    id: "lw4",
    date: "Thu, Mar 28",
    dayLabel: "Thu",
    jobTitle: "Commercial Cleaner",
    company: "SparkleClean Services",
    clockIn: "08:00 PM",
    clockOut: "11:15 PM",
    hoursWorked: 3.25,
    payRate: 19,
    status: "completed",
  },
];

const WEEK_DATA = [SHIFTS, LAST_WEEK_SHIFTS, []];

function calcEarnings(shifts: ShiftEntry[]) {
  return shifts.reduce((sum, s) => sum + s.hoursWorked * s.payRate, 0);
}

function calcHours(shifts: ShiftEntry[]) {
  return shifts.reduce((sum, s) => sum + s.hoursWorked, 0);
}

export default function TimesheetScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedWeek, setSelectedWeek] = useState(0);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const shifts = WEEK_DATA[selectedWeek] ?? [];
  const totalHours = calcHours(shifts);
  const totalEarnings = calcEarnings(shifts);
  const completedShifts = shifts.filter((s) => s.status === "completed").length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: "#0759af" }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Time Sheet</Text>
          <TouchableOpacity style={styles.exportBtn}>
            <Feather name="download" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Week selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
        >
          {WEEKS.map((w, i) => (
            <TouchableOpacity
              key={w}
              style={[
                styles.weekChip,
                { backgroundColor: selectedWeek === i ? "#fff" : "rgba(255,255,255,0.15)" },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedWeek(i);
              }}
            >
              <Text style={[styles.weekChipText, { color: selectedWeek === i ? "#0759af" : "#fff" }]}>
                {w}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Summary tiles */}
        <View style={styles.summaryRow}>
          <SummaryTile label="Hours Worked" value={`${totalHours.toFixed(1)}h`} icon="clock" accent="#60a5fa" />
          <SummaryTile label="Total Earned" value={`$${totalEarnings.toFixed(0)}`} icon="dollar-sign" accent="#34d399" />
          <SummaryTile label="Shifts Done" value={String(completedShifts)} icon="check-circle" accent="#a78bfa" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {shifts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather name="clock" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No shifts recorded</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Your worked shifts will appear here once you clock in.
            </Text>
          </View>
        ) : (
          <>
            {/* Section label */}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {WEEKS[selectedWeek].toUpperCase()} · {shifts.length} SHIFT{shifts.length !== 1 ? "S" : ""}
            </Text>

            {shifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} colors={colors} />
            ))}

            {/* Weekly total footer */}
            <View style={[styles.totalCard, { backgroundColor: "#0759af" }]}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Hours</Text>
                <Text style={styles.totalValue}>{totalHours.toFixed(2)} hrs</Text>
              </View>
              <View style={[styles.totalDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Gross Earnings</Text>
                <Text style={[styles.totalValue, { fontSize: 22, fontWeight: "800" }]}>
                  ${totalEarnings.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.totalNote}>* Taxes and deductions not included</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryTile({ label, value, icon, accent }: { label: string; value: string; icon: string; accent: string }) {
  return (
    <View style={styles.summaryTile}>
      <Feather name={icon as any} size={13} color={accent} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function ShiftCard({ shift, colors }: { shift: ShiftEntry; colors: any }) {
  const statusConfig = {
    completed: { color: "#10b981", bg: "#ecfdf5", icon: "check-circle", label: "Completed" },
    active: { color: "#f59e0b", bg: "#fffbeb", icon: "zap", label: "Active" },
    missed: { color: "#ef4444", bg: "#fef2f2", icon: "x-circle", label: "Missed" },
  }[shift.status];

  const earnings = shift.hoursWorked * shift.payRate;

  return (
    <View style={[styles.shiftCard, {
      backgroundColor: colors.card,
      borderColor: shift.status === "active" ? "#f59e0b" : colors.border,
      borderWidth: shift.status === "active" ? 1.5 : 1,
    }]}>
      {shift.status === "active" && (
        <View style={styles.activeBanner}>
          <View style={styles.activePulse} />
          <Text style={styles.activeBannerText}>CURRENTLY WORKING</Text>
        </View>
      )}

      {/* Top row */}
      <View style={styles.shiftTop}>
        <View style={styles.shiftDateBlock}>
          <Text style={[styles.shiftDay, { color: colors.primary }]}>{shift.dayLabel}</Text>
          <Text style={[styles.shiftDate, { color: colors.mutedForeground }]}>
            {shift.date.split(",")[1]?.trim()}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.shiftJobTitle, { color: colors.foreground }]} numberOfLines={1}>
            {shift.jobTitle}
          </Text>
          <Text style={[styles.shiftCompany, { color: colors.mutedForeground }]}>
            {shift.company}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Feather name={statusConfig.icon as any} size={11} color={statusConfig.color} />
          <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Time row */}
      <View style={[styles.timeRow, { borderColor: colors.border }]}>
        <TimeBlock label="Clock In" time={shift.clockIn} icon="log-in" colors={colors} accent="#2563EB" />
        <View style={[styles.timeDivider, { backgroundColor: colors.border }]} />
        <TimeBlock
          label="Clock Out"
          time={shift.clockOut ?? "Active"}
          icon="log-out"
          colors={colors}
          accent={shift.clockOut ? "#10b981" : "#f59e0b"}
        />
        <View style={[styles.timeDivider, { backgroundColor: colors.border }]} />
        <TimeBlock
          label="Hours"
          time={`${shift.hoursWorked.toFixed(2)}h`}
          icon="clock"
          colors={colors}
          accent="#7c3aed"
        />
      </View>

      {/* Earnings row */}
      <View style={styles.earningsRow}>
        <Text style={[styles.earningsRate, { color: colors.mutedForeground }]}>
          ${shift.payRate}/hr × {shift.hoursWorked.toFixed(2)}h
        </Text>
        <Text style={[styles.earningsTotal, { color: shift.status === "missed" ? colors.mutedForeground : "#10b981" }]}>
          {shift.status === "missed" ? "$0.00" : `$${earnings.toFixed(2)}`}
        </Text>
      </View>
    </View>
  );
}

function TimeBlock({ label, time, icon, colors, accent }: {
  label: string; time: string; icon: string; colors: any; accent: string;
}) {
  return (
    <View style={styles.timeBlock}>
      <Feather name={icon as any} size={12} color={accent} />
      <Text style={[styles.timeValue, { color: colors.foreground }]}>{time}</Text>
      <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  exportBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  weekChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  weekChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 20,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  summaryValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  shiftCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  activePulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  activeBannerText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  shiftTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingBottom: 10,
  },
  shiftDateBlock: {
    alignItems: "center",
    minWidth: 36,
  },
  shiftDay: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  shiftDate: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },
  shiftJobTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  shiftCompany: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
  timeBlock: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 3,
  },
  timeDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  },
  timeValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  timeLabel: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  earningsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  earningsRate: {
    fontSize: 12,
  },
  earningsTotal: {
    fontSize: 16,
    fontWeight: "800",
  },
  totalCard: {
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 8,
    gap: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  totalValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  totalDivider: {
    height: StyleSheet.hairlineWidth,
  },
  totalNote: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginTop: -4,
  },
});

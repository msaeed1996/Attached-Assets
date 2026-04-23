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

type Period = "year" | "month" | "all";

interface HistoryJob {
  id: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  dateLabel: string;
  dateObj: Date;
  shifts: number;
  hours: number;
  earnings: number;
  rating: number;
  review?: string;
  tags: string[];
}

const JOBS: HistoryJob[] = [
  {
    id: "h1",
    jobTitle: "Lead Bartender",
    company: "The Grand Hotel",
    dateLabel: "Mar 28 – Mar 30, 2026",
    dateObj: new Date(2026, 2, 30),
    shifts: 3,
    hours: 24,
    earnings: 720,
    rating: 5,
    review: "Professional, punctual, and a great team player. Would hire again!",
    tags: ["Hospitality", "Bartending"],
  },
  {
    id: "h2",
    jobTitle: "Warehouse Associate",
    company: "Amazon Logistics",
    dateLabel: "Mar 15 – Apr 2, 2026",
    dateObj: new Date(2026, 3, 2),
    shifts: 12,
    hours: 96,
    earnings: 2112,
    rating: 5,
    review: "Fast, reliable, and always on time. Top performer.",
    tags: ["Warehouse", "Logistics"],
  },
  {
    id: "h3",
    jobTitle: "ASAP – Cook",
    company: "Active Hospitality",
    dateLabel: "Apr 4, 2026",
    dateObj: new Date(2026, 3, 4),
    shifts: 1,
    hours: 5.1,
    earnings: 127.75,
    rating: 4,
    review: "Solid work under pressure. Good attitude.",
    tags: ["Kitchen"],
  },
  {
    id: "h4",
    jobTitle: "Event Staff",
    company: "Prestige Events Co.",
    dateLabel: "Feb 14 – Mar 28, 2026",
    dateObj: new Date(2026, 2, 28),
    shifts: 8,
    hours: 40,
    earnings: 2000,
    rating: 5,
    review: "Always goes above and beyond. Highly recommended.",
    tags: ["Events"],
  },
  {
    id: "h5",
    jobTitle: "Office Receptionist",
    company: "MetaLaw LLP",
    dateLabel: "Jan 10 – Mar 25, 2026",
    dateObj: new Date(2026, 2, 25),
    shifts: 22,
    hours: 176,
    earnings: 3168,
    rating: 4,
    tags: ["Office", "Admin"],
  },
  {
    id: "h6",
    jobTitle: "Barista",
    company: "Blue Bottle Coffee",
    dateLabel: "Nov 2025 – Jan 2026",
    dateObj: new Date(2026, 0, 30),
    shifts: 28,
    hours: 168,
    earnings: 3024,
    rating: 5,
    review: "Outstanding customer service. The team loved working with them.",
    tags: ["Cafe", "Hospitality"],
  },
];

function money(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function filterJobs(jobs: HistoryJob[], p: Period) {
  const now = new Date();
  if (p === "month") {
    const cutoff = new Date(now);
    cutoff.setMonth(now.getMonth() - 1);
    return jobs.filter((j) => j.dateObj >= cutoff);
  }
  if (p === "year") {
    const cutoff = new Date(now);
    cutoff.setFullYear(now.getFullYear() - 1);
    return jobs.filter((j) => j.dateObj >= cutoff);
  }
  return jobs;
}

export default function WorkHistoryScreen() {
  const insets = useSafeAreaInsets();
  const headerPad = Math.max(insets.top, Platform.OS === "web" ? 67 : 56) + 8;
  const [period, setPeriod] = useState<Period>("all");

  const visible = useMemo(() => filterJobs(JOBS, period), [period]);

  const totals = useMemo(() => {
    const gigs = visible.length;
    const hours = visible.reduce((s, j) => s + j.hours, 0);
    const earnings = visible.reduce((s, j) => s + j.earnings, 0);
    const rated = visible.filter((j) => j.rating > 0);
    const avg = rated.length ? rated.reduce((s, j) => s + j.rating, 0) / rated.length : 0;
    return { gigs, hours, earnings, avg };
  }, [visible]);

  function selectPeriod(p: Period) {
    Haptics.selectionAsync();
    setPeriod(p);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPad }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Work History</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totals.gigs}</Text>
            <Text style={styles.statLabel}>Gigs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totals.hours.toFixed(0)}h</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{money(totals.earnings)}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Feather name="star" size={14} color="#FBBF24" />
              <Text style={styles.statValue}>{totals.avg ? totals.avg.toFixed(1) : "—"}</Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterBar}>
        {(["month", "year", "all"] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, period === p && styles.chipActive]}
            onPress={() => selectPeriod(p)}
            activeOpacity={0.85}
          >
            <Text style={[styles.chipText, period === p && styles.chipTextActive]}>
              {p === "month" ? "Last Month" : p === "year" ? "Last Year" : "All Time"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 40, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="clock" size={28} color="#7C3AED" />
            </View>
            <Text style={styles.emptyTitle}>No history in this period</Text>
            <Text style={styles.emptyBody}>Try a wider range or take on a new gig from the job board.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/job-board")}>
              <Feather name="search" size={14} color="#fff" />
              <Text style={styles.emptyBtnText}>Browse Jobs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          visible.map((j) => (
            <View key={j.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoText}>{j.company.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{j.jobTitle}</Text>
                  <Text style={styles.company}>{j.company}</Text>
                  <View style={styles.dateRow}>
                    <Feather name="calendar" size={11} color="#6B7280" />
                    <Text style={styles.dateText}>{j.dateLabel}</Text>
                  </View>
                </View>
                <View style={styles.earningsPill}>
                  <Text style={styles.earningsText}>{money(j.earnings)}</Text>
                </View>
              </View>

              {/* Metrics */}
              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Feather name="briefcase" size={12} color="#7C3AED" />
                  <Text style={styles.metricText}>
                    {j.shifts} {j.shifts === 1 ? "shift" : "shifts"}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Feather name="clock" size={12} color="#7C3AED" />
                  <Text style={styles.metricText}>{j.hours.toFixed(1)}h</Text>
                </View>
                <View style={styles.metric}>
                  <View style={{ flexDirection: "row" }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Feather
                        key={i}
                        name="star"
                        size={11}
                        color={i <= j.rating ? "#FBBF24" : "#E5E7EB"}
                        style={{ marginRight: 1 }}
                      />
                    ))}
                  </View>
                </View>
              </View>

              {/* Review */}
              {j.review && (
                <View style={styles.reviewBox}>
                  <Feather name="message-circle" size={12} color="#6B7280" />
                  <Text style={styles.reviewText} numberOfLines={2}>
                    "{j.review}"
                  </Text>
                </View>
              )}

              {/* Tags */}
              {j.tags.length > 0 && (
                <View style={styles.tagRow}>
                  {j.tags.map((t) => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0759AF",
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  statsRow: {
    marginTop: 16,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "800" },
  statLabel: { color: "rgba(255,255,255,0.75)", fontSize: 10, marginTop: 2, fontWeight: "600" },
  statDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.18)" },

  filterBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: { backgroundColor: "#0759AF", borderColor: "#0759AF" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  chipTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#7C3AED", fontWeight: "800", fontSize: 18 },
  jobTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  company: { fontSize: 12, color: "#6B7280", marginTop: 2, fontWeight: "600" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  dateText: { fontSize: 11, color: "#6B7280" },
  earningsPill: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  earningsText: { color: "#16A34A", fontWeight: "800", fontSize: 13 },

  metricsRow: {
    flexDirection: "row",
    gap: 14,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    alignItems: "center",
  },
  metric: { flexDirection: "row", alignItems: "center", gap: 4 },
  metricText: { fontSize: 12, color: "#374151", fontWeight: "600" },

  reviewBox: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 10,
    alignItems: "flex-start",
  },
  reviewText: { flex: 1, fontSize: 12, color: "#4B5563", fontStyle: "italic", lineHeight: 17 },

  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: { fontSize: 10, color: "#4F46E5", fontWeight: "700" },

  empty: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 20,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { marginTop: 14, fontSize: 15, fontWeight: "700", color: "#111827" },
  emptyBody: { marginTop: 6, fontSize: 12, color: "#6B7280", textAlign: "center", lineHeight: 17 },
  emptyBtn: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0759AF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});

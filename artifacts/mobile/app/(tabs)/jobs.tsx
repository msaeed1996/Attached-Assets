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
import { LinearGradient } from "expo-linear-gradient";
import { useJobs } from "@/context/JobsContext";
import * as Haptics from "expo-haptics";

const CATEGORY_COLORS: Record<string, { icon: string; color: string; bg: string }> = {
  Warehouse:    { icon: "package",      color: "#2563eb", bg: "#dbeafe" },
  Hospitality:  { icon: "coffee",       color: "#7c3aed", bg: "#ede9fe" },
  Admin:        { icon: "monitor",      color: "#0891b2", bg: "#cffafe" },
  Events:       { icon: "star",         color: "#d97706", bg: "#fef3c7" },
  Retail:       { icon: "shopping-bag", color: "#059669", bg: "#d1fae5" },
  Cleaning:     { icon: "wind",         color: "#0891b2", bg: "#ecfeff" },
  Construction: { icon: "tool",         color: "#ea580c", bg: "#ffedd5" },
  Default:      { icon: "briefcase",    color: "#2563eb", bg: "#dbeafe" },
};

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Default;
}

const FILTERS = ["All", "Urgent", "High Pay", "Today"];

export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const { jobs, applications, applyToJob } = useJobs();
  const [activeFilter, setActiveFilter] = useState("All");

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const filtered = jobs.filter((j) => {
    if (activeFilter === "Urgent") return j.urgency === "urgent";
    if (activeFilter === "High Pay") return j.pay >= 25;
    if (activeFilter === "Today") return j.startDate === "Today" || j.startDate === "Tomorrow";
    return true;
  });

  const totalPotential = filtered.reduce((s, j) => s + j.pay * 8, 0);
  const urgentCount = filtered.filter((j) => j.urgency === "urgent").length;

  return (
    <View style={styles.root}>
      {/* ── HEADER ── */}
      <LinearGradient
        colors={["#0a47a9", "#1e63d0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPadding + 14 }]}
      >
        <Text style={styles.headerTitle}>Job Board</Text>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, activeFilter === f && styles.chipActive]}
              onPress={() => { Haptics.selectionAsync(); setActiveFilter(f); }}
            >
              <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* ── LIST ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="briefcase" size={30} color="#2563eb" />
            </View>
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptyBody}>Try a different filter</Text>
          </View>
        ) : (
          filtered.map((job) => {
            const cat = getCategoryStyle(job.category);
            const hasApplied = applications.some((a) => a.jobId === job.id);
            const estEarnings = job.pay * 8;

            return (
              <TouchableOpacity
                key={job.id}
                style={styles.card}
                onPress={() => router.push(`/job/${job.id}`)}
                activeOpacity={0.88}
              >
                {/* Top row: icon + title/company + price */}
                <View style={styles.cardTop}>
                  <View style={[styles.iconWrap, { backgroundColor: cat.bg }]}>
                    <Feather name={cat.icon as any} size={20} color={cat.color} />
                  </View>
                  <View style={styles.cardTitleCol}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{job.title}</Text>
                    <Text style={styles.cardCompany}>{job.company}</Text>
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={styles.priceAmount}>${estEarnings}</Text>
                    <Text style={styles.priceLabel}>est.</Text>
                  </View>
                </View>

                {/* Detail rows */}
                <View style={styles.detailBox}>
                  <View style={styles.detailRow}>
                    <Feather name="calendar" size={13} color="#6b7280" />
                    <Text style={styles.detailText}>{job.startDate}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather name="map-pin" size={13} color="#6b7280" />
                    <Text style={styles.detailText}>{job.location}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather name="zap" size={13} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {job.duration} · ${job.pay}/{job.payType}
                    </Text>
                  </View>
                </View>

                {/* Bottom row: urgency + apply/applied badge */}
                <View style={styles.cardFooter}>
                  {job.urgency === "urgent" ? (
                    <View style={styles.urgentBadge}>
                      <View style={styles.urgentDot} />
                      <Text style={styles.urgentText}>Urgent</Text>
                    </View>
                  ) : (
                    <Text style={styles.openText}>Open</Text>
                  )}

                  {hasApplied ? (
                    <View style={styles.appliedBadge}>
                      <Feather name="check-circle" size={13} color="#10b981" />
                      <Text style={styles.appliedText}>Applied</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={() => { Haptics.impactAsync(); applyToJob(job.id); }}
                    >
                      <Text style={styles.applyBtnText}>Apply Now</Text>
                    </TouchableOpacity>
                  )}
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
  root: { flex: 1, backgroundColor: "#f3f4f6" },

  /* header */
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.3,
  },

  /* summary strip */
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingVertical: 12,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 18, fontWeight: "800", color: "#fff" },
  summaryLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.25)", marginVertical: 4 },

  /* filter chips */
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  chipActive: { backgroundColor: "#fff" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  chipTextActive: { color: "#0a47a9" },

  /* list */
  list: { padding: 16, gap: 14 },

  /* card */
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10 },
      android: { elevation: 3 },
      default: { boxShadow: "0 2px 10px rgba(0,0,0,0.07)" },
    }),
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  cardTitleCol: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  cardCompany: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  priceCol: { alignItems: "flex-end" },
  priceAmount: { fontSize: 17, fontWeight: "800", color: "#2563eb" },
  priceLabel: { fontSize: 11, color: "#9ca3af" },

  /* detail box */
  detailBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    gap: 7,
  },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 13, color: "#374151", flex: 1 },

  /* footer */
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  urgentBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  urgentDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#ef4444" },
  urgentText: { fontSize: 13, fontWeight: "600", color: "#ef4444" },
  openText: { fontSize: 13, fontWeight: "600", color: "#6366f1" },

  appliedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  appliedText: { fontSize: 12, fontWeight: "700", color: "#10b981" },

  applyBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  applyBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  /* empty */
  emptyState: { alignItems: "center", paddingVertical: 64, gap: 10 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: "#dbeafe", justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: "#1e40af" },
  emptyBody: { fontSize: 14, color: "#6b7280" },
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useJobs } from "@/context/JobsContext";
import { JobCard } from "@/components/JobCard";
import * as Haptics from "expo-haptics";

const JOB_TYPES = ["All Types", "full-day", "part-time", "weekend", "evening", "contract"];
const SORT_OPTIONS = ["Newest", "Pay: High-Low", "Urgency"];

export default function JobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { jobs, savedJobs, saveJob, unsaveJob } = useJobs();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [sortBy, setSortBy] = useState("Newest");
  const [showFilters, setShowFilters] = useState(false);
  const [minPay, setMinPay] = useState(0);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  let filtered = jobs.filter((j) => {
    const matchType = selectedType === "All Types" || j.type === selectedType;
    const matchSearch =
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase());
    const matchPay = j.pay >= minPay;
    return matchType && matchSearch && matchPay;
  });

  if (sortBy === "Pay: High-Low") filtered = [...filtered].sort((a, b) => b.pay - a.pay);
  else if (sortBy === "Urgency") {
    filtered = [...filtered].sort((a) => (a.urgency === "urgent" ? -1 : 1));
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Find Work</Text>
        <View style={[styles.searchRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search jobs..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            style={[styles.filterToggle, { backgroundColor: showFilters ? colors.primary : colors.muted }]}
            onPress={() => {
              Haptics.selectionAsync();
              setShowFilters(!showFilters);
            }}
          >
            <Feather name="sliders" size={15} color={showFilters ? "#fff" : colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Sort */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.sortChip,
                { backgroundColor: sortBy === opt ? colors.navy : colors.card, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSortBy(opt);
              }}
            >
              <Text style={[styles.sortChipText, { color: sortBy === opt ? "#fff" : colors.foreground }]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filter panel */}
        {showFilters && (
          <View style={[styles.filterPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.filterLabel, { color: colors.foreground }]}>Job Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {JOB_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    { backgroundColor: selectedType === t ? colors.primary : colors.muted, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedType(t);
                  }}
                >
                  <Text style={[styles.typeChipText, { color: selectedType === t ? "#fff" : colors.foreground }]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <Text style={[styles.filterLabel, { color: colors.foreground }]}>
                Min Pay: ${minPay}/hr
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[0, 15, 20, 25].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.payBtn, { backgroundColor: minPay === v ? colors.primary : colors.muted }]}
                    onPress={() => setMinPay(v)}
                  >
                    <Text style={[styles.payBtnText, { color: minPay === v ? "#fff" : colors.foreground }]}>
                      ${v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Results */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.resultsCount, { color: colors.mutedForeground }]}>
          {filtered.length} job{filtered.length !== 1 ? "s" : ""} available
        </Text>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results found</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Adjust your filters or search for something else
            </Text>
          </View>
        ) : (
          filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => router.push(`/job/${job.id}`)}
              onSave={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                savedJobs.includes(job.id) ? unsaveJob(job.id) : saveJob(job.id);
              }}
              isSaved={savedJobs.includes(job.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filterToggle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortChipText: { fontSize: 13, fontWeight: "600" },
  filterPanel: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeChipText: { fontSize: 12, fontWeight: "500" },
  payBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  payBtnText: { fontSize: 12, fontWeight: "600" },
  resultsCount: { fontSize: 13, marginBottom: 12, marginTop: 8 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 8 },
  emptyText: { fontSize: 14, textAlign: "center" },
});

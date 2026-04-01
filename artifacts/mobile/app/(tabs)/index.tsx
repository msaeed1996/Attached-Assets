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
import { useApp } from "@/context/AppContext";
import { useJobs } from "@/context/JobsContext";
import { JobCard } from "@/components/JobCard";
import * as Haptics from "expo-haptics";

const CATEGORIES = [
  { label: "All", icon: "grid" },
  { label: "Warehouse", icon: "package" },
  { label: "Hospitality", icon: "coffee" },
  { label: "Admin", icon: "clipboard" },
  { label: "Retail", icon: "shopping-bag" },
  { label: "Cleaning", icon: "wind" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, userRole } = useApp();
  const { jobs, savedJobs, saveJob, unsaveJob } = useJobs();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJobs = jobs.filter((j) => {
    const matchCat = selectedCategory === "All" || j.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const urgentJobs = jobs.filter((j) => j.urgency === "urgent");
  const topPay = jobs.slice().sort((a, b) => b.pay - a.pay).slice(0, 3);

  const isEmployer = userRole === "employer";

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Good morning 👋
          </Text>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {userProfile?.name?.split(" ")[0] || "Welcome"}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.avatarBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Text style={styles.avatarText}>
            {(userProfile?.name || "U").charAt(0)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search jobs, companies..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(tabs)/jobs")}
        >
          <Feather name="sliders" size={15} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Employer quick action */}
      {isEmployer && (
        <TouchableOpacity
          style={[styles.postJobBanner, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/post-job")}
          activeOpacity={0.88}
        >
          <View>
            <Text style={styles.postJobTitle}>Post a Job</Text>
            <Text style={styles.postJobSub}>Hire fast — workers are ready now</Text>
          </View>
          <View style={[styles.postJobIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name="plus" size={22} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* Worker quick stats */}
      {!isEmployer && userProfile && (
        <View style={styles.statsRow}>
          {[
            { icon: "briefcase", val: String(userProfile.completedJobs || 0), label: "Jobs Done" },
            { icon: "star", val: String(userProfile.rating || "—"), label: "Rating" },
            { icon: "dollar-sign", val: `$${userProfile.hourlyRate || 0}/hr`, label: "Rate" },
          ].map((s) => (
            <View
              key={s.label}
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name={s.icon as any} size={18} color={colors.primary} />
              <Text style={[styles.statVal, { color: colors.foreground }]}>{s.val}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Urgent jobs */}
      {urgentJobs.length > 0 && !searchQuery && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.urgentPulse, { backgroundColor: "#fef2f2" }]}>
                <View style={[styles.urgentDot, { backgroundColor: "#ef4444" }]} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Urgent Openings</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {urgentJobs.map((job) => (
              <View key={job.id} style={styles.horizontalCard}>
                <JobCard
                  job={job}
                  onPress={() => router.push(`/job/${job.id}`)}
                  onSave={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    savedJobs.includes(job.id) ? unsaveJob(job.id) : saveJob(job.id);
                  }}
                  isSaved={savedJobs.includes(job.id)}
                  compact
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Categories */}
      {!searchQuery && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>
            Browse by Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.label;
              return (
                <TouchableOpacity
                  key={cat.label}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedCategory(cat.label);
                  }}
                >
                  <Feather
                    name={cat.icon as any}
                    size={14}
                    color={active ? "#fff" : colors.mutedForeground}
                  />
                  <Text
                    style={[styles.catText, { color: active ? "#fff" : colors.foreground }]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Job list */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {searchQuery ? `Results for "${searchQuery}"` : selectedCategory === "All" ? "Latest Jobs" : selectedCategory + " Jobs"}
          </Text>
          {!searchQuery && (
            <Text style={[styles.countText, { color: colors.mutedForeground }]}>
              {filteredJobs.length} available
            </Text>
          )}
        </View>
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No jobs found</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Try a different search or category
            </Text>
          </View>
        ) : (
          filteredJobs.map((job) => (
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 2,
  },
  name: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  postJobBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postJobTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  postJobSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  postJobIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statVal: {
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  countText: {
    fontSize: 13,
  },
  urgentPulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  urgentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  horizontalCard: {
    width: 260,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  catText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});

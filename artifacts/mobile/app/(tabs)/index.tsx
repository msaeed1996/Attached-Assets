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
import { useApp } from "@/context/AppContext";
import { useJobs } from "@/context/JobsContext";
import { useMessages } from "@/context/MessagesContext";
import * as Haptics from "expo-haptics";

const CATEGORIES = [
  { label: "Warehouse", icon: "package", color: "#f59e0b", bg: "#fef3c7" },
  { label: "Hospitality", icon: "coffee", color: "#ec4899", bg: "#fce7f3" },
  { label: "Admin", icon: "clipboard", color: "#6366f1", bg: "#e0e7ff" },
  { label: "Retail", icon: "shopping-bag", color: "#10b981", bg: "#d1fae5" },
  { label: "Cleaning", icon: "wind", color: "#0891b2", bg: "#cffafe" },
  { label: "Driving", icon: "truck", color: "#f97316", bg: "#ffedd5" },
];

const QUICK_ACTIONS_EMPLOYER = [
  { icon: "plus-circle", label: "Post Job", route: "/post-job", color: "#2563EB", bg: "#dbeafe", badge: null, isAvailability: false },
  { icon: "users", label: "Applicants", route: "/(tabs)/jobs", color: "#7c3aed", bg: "#ede9fe", badge: null, isAvailability: false },
  { icon: "briefcase", label: "My Jobs", route: "/(tabs)/jobs", color: "#0891b2", bg: "#cffafe", badge: null, isAvailability: false },
];

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, userRole } = useApp();
  const { jobs, applications, savedJobs } = useJobs();
  const { conversations } = useMessages();
  const [isAvailable, setIsAvailable] = useState(true);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const isEmployer = userRole === "employer";

  const myApplications = applications.filter((a) => a.workerId === "me");
  const myJobs = jobs.filter((j) => j.employerId === "emp-me");
  const urgentJobs = jobs.filter((j) => j.urgency === "urgent").slice(0, 3);
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  const workerQuickActions = [
    { icon: "briefcase", label: "Available Jobs", route: "/(tabs)/jobs", color: "#2563EB", bg: "#dbeafe", badge: null, isAvailability: false },
    { icon: "mail", label: "Job Invitation", route: "/(tabs)/jobs", color: "#7c3aed", bg: "#ede9fe", badge: myApplications.length > 0 ? myApplications.length : null, isAvailability: false },
    { icon: "clock", label: "Time Sheet", route: "/(tabs)/jobs", color: "#0891b2", bg: "#cffafe", badge: null, isAvailability: false },
    { icon: isAvailable ? "check-circle" : "x-circle", label: "Availability", route: null, color: isAvailable ? "#10b981" : "#ef4444", bg: isAvailable ? "#d1fae5" : "#fee2e2", badge: null, isAvailability: true },
  ];

  const quickActions = isEmployer ? QUICK_ACTIONS_EMPLOYER : workerQuickActions;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: "#f0f4f8" }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HERO HEADER ── */}
      <View style={[styles.hero, { paddingTop: topPadding + 20 }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.heroGreeting}>{getTimeOfDay()}</Text>
            <Text style={styles.heroName}>
              {userProfile?.name?.split(" ")[0] || "Welcome"}
            </Text>
          </View>
          <View style={styles.topBarRight}>
            {totalUnread > 0 && (
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => router.push("/(tabs)/messages")}
              >
                <Feather name="bell" size={20} color="#fff" />
                <View style={styles.notifDot} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => router.push("/(tabs)/profile")}
            >
              <Text style={styles.avatarLetter}>
                {(userProfile?.name || "U").charAt(0)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Role + Verification pill */}
        <View style={styles.rolePill}>
          <View style={[styles.roleDot, { backgroundColor: isEmployer ? "#60a5fa" : "#34d399" }]} />
          <Text style={styles.rolePillText}>
            {isEmployer ? `Employer · ${userProfile?.company || ""}` : "Gig Worker"}
          </Text>
          {userProfile?.verified && (
            <View style={styles.verifiedPill}>
              <Feather name="check-circle" size={11} color="#60a5fa" />
              <Text style={styles.verifiedPillText}>Approved</Text>
            </View>
          )}
        </View>

        {/* ── STAT TILES ── */}
        <View style={styles.statTiles}>
          {isEmployer ? (
            <>
              <StatTile icon="briefcase" value={String(myJobs.length)} label="Active Jobs" accent="#60a5fa" />
              <StatTile icon="users" value="12" label="Total Hired" accent="#a78bfa" />
              <StatTile icon="trending-up" value="98%" label="Fill Rate" accent="#34d399" />
            </>
          ) : (
            <>
              <StatTile icon="award" value={String(userProfile?.completedJobs || 0)} label="Jobs Done" accent="#60a5fa" />
              <StatTile icon="star" value={String(userProfile?.rating || "—")} label="Rating" accent="#fbbf24" />
              <StatTile icon="dollar-sign" value={`$${userProfile?.hourlyRate || 0}`} label="Per Hour" accent="#34d399" />
            </>
          )}
        </View>
      </View>

      {/* ── QUICK ACTIONS ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: "#374151" }]}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.quickCard, { backgroundColor: "#fff", borderWidth: a.isAvailability ? 1.5 : 0, borderColor: a.isAvailability ? a.color : "transparent" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (a.isAvailability) {
                  setIsAvailable((v) => !v);
                } else if (a.route) {
                  router.push(a.route as any);
                }
              }}
              activeOpacity={0.82}
            >
              <View style={styles.quickIconWrap}>
                <View style={[styles.quickIcon, { backgroundColor: a.bg }]}>
                  <Feather name={a.icon as any} size={16} color={a.color} />
                </View>
                {a.badge != null && (
                  <View style={styles.quickBadge}>
                    <Text style={styles.quickBadgeText}>{a.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.quickLabel, { color: "#111827" }]}>{a.label}</Text>
              {a.isAvailability && (
                <Text style={[styles.availabilityStatus, { color: a.color }]}>
                  {isAvailable ? "Available" : "Off"}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── BROWSE BY CATEGORY ── */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionLabel, { color: "#374151" }]}>Browse by Category</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")}>
            <Text style={[styles.seeAllText, { color: "#2563EB" }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 4 }}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              style={[styles.categoryCard, { backgroundColor: "#fff" }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/(tabs)/jobs");
              }}
              activeOpacity={0.82}
            >
              <View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}>
                <Feather name={cat.icon as any} size={16} color={cat.color} />
              </View>
              <Text style={[styles.categoryLabel, { color: "#111827" }]} numberOfLines={1}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── EMPLOYER: My job posts ── */}
      {isEmployer && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: "#374151" }]}>My Job Posts</Text>
            <TouchableOpacity
              style={styles.newJobBtn}
              onPress={() => router.push("/post-job")}
            >
              <Feather name="plus" size={14} color="#2563EB" />
              <Text style={[styles.newJobBtnText, { color: "#2563EB" }]}>New</Text>
            </TouchableOpacity>
          </View>
          {myJobs.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyPostCard}
              onPress={() => router.push("/post-job")}
              activeOpacity={0.85}
            >
              <View style={[styles.emptyPostIcon, { backgroundColor: "#dbeafe" }]}>
                <Feather name="plus-circle" size={26} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.emptyPostTitle, { color: "#111827" }]}>Post your first job</Text>
                <Text style={[styles.emptyPostSub, { color: "#6b7280" }]}>Workers are standing by — takes 2 minutes</Text>
              </View>
              <Feather name="arrow-right" size={18} color="#2563EB" />
            </TouchableOpacity>
          ) : (
            myJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobPostRow}
                onPress={() => router.push(`/job/${job.id}`)}
                activeOpacity={0.85}
              >
                <View style={[styles.jobPostIcon, { backgroundColor: "#eff6ff" }]}>
                  <Feather name="briefcase" size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.jobPostTitle, { color: "#111827" }]}>{job.title}</Text>
                  <Text style={[styles.jobPostMeta, { color: "#6b7280" }]}>
                    {job.applicantsCount} applicants · {job.startDate}
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: "#ecfdf5" }]}>
                  <View style={[styles.openDot, { backgroundColor: "#10b981" }]} />
                  <Text style={[styles.statusPillText, { color: "#10b981" }]}>Open</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* ── URGENT NEARBY JOBS ── */}
      {urgentJobs.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.urgentTitleRow}>
              <View style={styles.liveDot} />
              <Text style={[styles.sectionLabel, { color: "#374151" }]}>Urgent Near You</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")}>
              <Text style={[styles.seeAllText, { color: "#2563EB" }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {urgentJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.urgentJobRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/job/${job.id}`);
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.urgentCategoryDot, { backgroundColor: "#fef2f2" }]}>
                <Feather name="zap" size={14} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.urgentJobTitle, { color: "#111827" }]}>{job.title}</Text>
                <Text style={[styles.urgentJobMeta, { color: "#6b7280" }]}>
                  {job.company} · {job.location}
                </Text>
              </View>
              <View style={styles.urgentPayBox}>
                <Text style={[styles.urgentPay, { color: "#2563EB" }]}>${job.pay}</Text>
                <Text style={[styles.urgentPayType, { color: "#9ca3af" }]}>/{job.payType}</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── INSIGHTS / TIP CARD ── */}
      <View style={[styles.section, { marginBottom: 8 }]}>
        <View style={styles.insightCard}>
          <View style={styles.insightLeft}>
            <View style={[styles.insightIcon, { backgroundColor: "rgba(96,165,250,0.15)" }]}>
              <Feather name="trending-up" size={20} color="#60a5fa" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTitle}>
                {isEmployer ? "Boost visibility" : "Improve your profile"}
              </Text>
              <Text style={styles.insightBody}>
                {isEmployer
                  ? "Jobs with clear pay ranges fill 3× faster. Add salary details to attract top candidates."
                  : "Workers with verified badges get 2× more callbacks. Complete your verification today."}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.insightCta}>
            <Text style={styles.insightCtaText}>
              {isEmployer ? "Edit Job" : "Verify Now"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── BROWSE JOBS CTA (worker only) ── */}
      {!isEmployer && (
        <View style={[styles.section]}>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push("/(tabs)/jobs")}
            activeOpacity={0.88}
          >
            <Text style={styles.browseBtnText}>Browse All Jobs</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function StatTile({ icon, value, label, accent }: { icon: string; value: string; label: string; accent: string }) {
  return (
    <View style={styles.statTile}>
      <View style={[styles.statTileIcon, { backgroundColor: `${accent}22` }]}>
        <Feather name={icon as any} size={12} color={accent} />
      </View>
      <Text style={styles.statTileValue}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

function AppStatusCard({
  label, count, color, bg, border, icon,
}: { label: string; count: number; color: string; bg: string; border: string; icon: string }) {
  return (
    <View style={[styles.appStatusCard, { backgroundColor: bg, borderColor: border }]}>
      <Feather name={icon as any} size={18} color={color} />
      <Text style={[styles.appStatusCount, { color }]}>{count}</Text>
      <Text style={[styles.appStatusLabel, { color: "#6b7280" }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── HERO ──
  hero: {
    backgroundColor: "#0759af",
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 24,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  heroGreeting: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 3,
  },
  heroName: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 1.5,
    borderColor: "#0f172a",
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 22,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  rolePillText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "500",
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(96,165,250,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 4,
  },
  verifiedPillText: {
    color: "#60a5fa",
    fontSize: 11,
    fontWeight: "600",
  },

  // ── STAT TILES ──
  statTiles: {
    flexDirection: "row",
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statTileIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 1,
  },
  statTileValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  statTileLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── SECTIONS ──
  section: {
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 13,
  },

  // ── QUICK ACTIONS ──
  quickGrid: {
    flexDirection: "row",
    gap: 8,
  },
  quickCard: {
    width: 90,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 7,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  quickIconWrap: {
    position: "relative",
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  quickBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#f0f4f8",
  },
  quickBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  availabilityStatus: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // ── CATEGORY GRID ──
  categoryGrid: {
    flexDirection: "row",
    gap: 8,
  },
  categoryCard: {
    width: 76,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 7,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },

  // ── APP STATUS ──
  appStatusRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  appStatusCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "flex-start",
    gap: 5,
  },
  appStatusCount: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  appStatusLabel: {
    fontSize: 11,
    fontWeight: "500",
  },

  // ── RECENT APPS ──
  recentApps: {
    gap: 8,
  },
  recentAppRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  recentAppDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recentAppTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  recentAppSub: {
    fontSize: 12,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  // ── EMPLOYER: JOB POSTS ──
  newJobBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#eff6ff",
    borderRadius: 20,
  },
  newJobBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyPostCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
    borderStyle: "dashed",
  },
  emptyPostIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyPostTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  emptyPostSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  jobPostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  jobPostIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  jobPostTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 3,
  },
  jobPostMeta: {
    fontSize: 12,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // ── URGENT JOBS ──
  urgentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  urgentJobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  urgentCategoryDot: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  urgentJobTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  urgentJobMeta: {
    fontSize: 12,
  },
  urgentPayBox: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
  },
  urgentPay: {
    fontSize: 15,
    fontWeight: "700",
  },
  urgentPayType: {
    fontSize: 11,
  },

  // ── INSIGHT CARD ──
  insightCard: {
    backgroundColor: "#0f172a",
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  insightLeft: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  insightTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  insightBody: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 18,
  },
  insightCta: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(96,165,250,0.18)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 52,
  },
  insightCtaText: {
    color: "#60a5fa",
    fontSize: 13,
    fontWeight: "600",
  },

  // ── BROWSE BTN ──
  browseBtn: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    borderRadius: 16,
    gap: 10,
  },
  browseBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});

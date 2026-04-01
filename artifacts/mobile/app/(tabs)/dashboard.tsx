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
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useJobs } from "@/context/JobsContext";
import { TrustBadge } from "@/components/TrustBadge";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, userRole } = useApp();
  const { jobs, applications, savedJobs } = useJobs();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const isEmployer = userRole === "employer";

  const myJobs = isEmployer
    ? jobs.filter((j) => j.employerId === "emp-me")
    : [];

  const myApplications = !isEmployer
    ? applications.filter((a) => a.workerId === "me")
    : [];

  const pendingApps = myApplications.filter((a) => a.status === "pending").length;
  const acceptedApps = myApplications.filter((a) => a.status === "accepted").length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Dashboard</Text>
      </View>

      {/* Profile card */}
      <View style={[styles.profileCard, { backgroundColor: colors.navy, marginHorizontal: 20, marginBottom: 20, borderRadius: 20 }]}>
        <View style={styles.profileRow}>
          <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.profileAvatarText}>
              {(userProfile?.name || "U").charAt(0)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile?.name || "User"}</Text>
            <Text style={styles.profileRole}>
              {isEmployer ? userProfile?.company || "Employer" : "Gig Worker"}
            </Text>
            {userProfile && (
              <TrustBadge
                rating={userProfile.rating || 0}
                reviewCount={userProfile.reviewCount}
                verified={userProfile.verified}
                size="sm"
              />
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            style={[styles.editBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
          >
            <Feather name="edit-2" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.profileStats}>
          {isEmployer ? (
            <>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatVal}>{myJobs.length}</Text>
                <Text style={styles.profileStatLabel}>Active Jobs</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatVal}>12</Text>
                <Text style={styles.profileStatLabel}>Hired</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatVal}>98%</Text>
                <Text style={styles.profileStatLabel}>Fill Rate</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatVal}>{userProfile?.completedJobs || 0}</Text>
                <Text style={styles.profileStatLabel}>Jobs Done</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatVal}>{myApplications.length}</Text>
                <Text style={styles.profileStatLabel}>Applied</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatVal}>${(userProfile?.hourlyRate || 0) * 8 * 5}</Text>
                <Text style={styles.profileStatLabel}>Est. Week</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Employer dashboard */}
      {isEmployer && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Job Posts</Text>
              <TouchableOpacity onPress={() => router.push("/post-job")}>
                <View style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                  <Feather name="plus" size={16} color="#fff" />
                  <Text style={styles.addBtnText}>Post Job</Text>
                </View>
              </TouchableOpacity>
            </View>

            {myJobs.length === 0 ? (
              <TouchableOpacity
                style={[styles.emptyJobCard, { borderColor: colors.border, borderStyle: "dashed" }]}
                onPress={() => router.push("/post-job")}
              >
                <Feather name="plus-circle" size={32} color={colors.primary} />
                <Text style={[styles.emptyJobTitle, { color: colors.foreground }]}>Post your first job</Text>
                <Text style={[styles.emptyJobSub, { color: colors.mutedForeground }]}>
                  Workers are ready — post in under 2 minutes
                </Text>
              </TouchableOpacity>
            ) : (
              myJobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  style={[styles.jobMiniCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/job/${job.id}`)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.jobMiniTitle, { color: colors.foreground }]}>{job.title}</Text>
                    <Text style={[styles.jobMiniSub, { color: colors.mutedForeground }]}>
                      {job.applicantsCount} applicants · {job.startDate}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: job.status === "open" ? "#d1fae5" : "#f1f5f9" }]}>
                    <Text style={[styles.statusText, { color: job.status === "open" ? "#065f46" : "#475569" }]}>
                      {job.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Tip */}
          <View style={[styles.tipCard, { backgroundColor: colors.accent, marginHorizontal: 20 }]}>
            <Feather name="zap" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.tipTitle, { color: colors.foreground }]}>Hiring tip</Text>
              <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                Jobs with salary listed get 3x more applicants. Add clear pay details!
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Worker dashboard */}
      {!isEmployer && (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 14 }]}>
              Application Status
            </Text>
            <View style={styles.statusGrid}>
              {[
                { label: "Pending", count: pendingApps, color: "#f59e0b", bg: "#fef3c7", icon: "clock" },
                { label: "Accepted", count: acceptedApps, color: "#10b981", bg: "#d1fae5", icon: "check-circle" },
                { label: "Saved Jobs", count: savedJobs.length, color: colors.primary, bg: colors.accent, icon: "bookmark" },
                { label: "Applied", count: myApplications.length, color: colors.navy, bg: "#f1f5f9", icon: "send" },
              ].map((s) => (
                <View key={s.label} style={[styles.statusCard, { backgroundColor: s.bg }]}>
                  <Feather name={s.icon as any} size={22} color={s.color} />
                  <Text style={[styles.statusCount, { color: s.color }]}>{s.count}</Text>
                  <Text style={[styles.statusLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {myApplications.length > 0 && (
            <View style={[styles.section, { marginTop: -8 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 14 }]}>
                Recent Applications
              </Text>
              {myApplications.slice(-3).reverse().map((app) => {
                const job = jobs.find((j) => j.id === app.jobId);
                if (!job) return null;
                return (
                  <TouchableOpacity
                    key={app.id}
                    style={[styles.appCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push(`/job/${job.id}`)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.appJobTitle, { color: colors.foreground }]}>{job.title}</Text>
                      <Text style={[styles.appCompany, { color: colors.mutedForeground }]}>{job.company}</Text>
                    </View>
                    <View style={[
                      styles.appStatus,
                      { backgroundColor: app.status === "pending" ? "#fef3c7" : app.status === "accepted" ? "#d1fae5" : "#f1f5f9" }
                    ]}>
                      <Text style={[styles.appStatusText, {
                        color: app.status === "pending" ? "#b45309" : app.status === "accepted" ? "#065f46" : "#475569"
                      }]}>
                        {app.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={[styles.section, { marginTop: -8 }]}>
            <TouchableOpacity
              style={[styles.findMoreBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/jobs")}
            >
              <Text style={styles.findMoreText}>Browse More Jobs</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  profileCard: { padding: 20 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  profileAvatarText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { color: "#fff", fontSize: 18, fontWeight: "700" },
  profileRole: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  editBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  profileStats: { flexDirection: "row", justifyContent: "space-around" },
  profileStat: { alignItems: "center" },
  profileStatVal: { color: "#fff", fontSize: 22, fontWeight: "800" },
  profileStatLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 },
  profileStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  emptyJobCard: { borderWidth: 2, borderRadius: 16, padding: 32, alignItems: "center", gap: 8 },
  emptyJobTitle: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  emptyJobSub: { fontSize: 13, textAlign: "center" },
  jobMiniCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  jobMiniTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  jobMiniSub: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "600" },
  tipCard: { flexDirection: "row", padding: 16, borderRadius: 14, gap: 12, alignItems: "flex-start" },
  tipTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  tipText: { fontSize: 12, lineHeight: 17 },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statusCard: { width: "47%", padding: 16, borderRadius: 14, alignItems: "flex-start", gap: 6 },
  statusCount: { fontSize: 28, fontWeight: "800" },
  statusLabel: { fontSize: 12 },
  appCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  appJobTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  appCompany: { fontSize: 12 },
  appStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  appStatusText: { fontSize: 11, fontWeight: "600" },
  findMoreBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 16, borderRadius: 14, gap: 8 },
  findMoreText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

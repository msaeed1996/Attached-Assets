import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import * as Haptics from "expo-haptics";

function MenuItem({
  icon,
  label,
  accent = "#2563EB",
  bg = "#eff6ff",
  onPress,
  last = false,
}: {
  icon: string;
  label: string;
  accent?: string;
  bg?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, !last && styles.menuItemBorder]}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
      activeOpacity={0.75}
    >
      <View style={[styles.menuIcon, { backgroundColor: bg }]}>
        <Feather name={icon as any} size={15} color={accent} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Feather name="chevron-right" size={15} color="#d1d5db" />
    </TouchableOpacity>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.menuSection}>
      <Text style={styles.menuSectionTitle}>{title}</Text>
      <View style={styles.menuCard}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, userRole, setUserRole, setUserProfile, setIsOnboarded } = useApp();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const isEmployer = userRole === "employer";

  function handleSwitch() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUserRole(isEmployer ? "worker" : "employer");
    if (!isEmployer) {
      setUserProfile({
        id: "emp-me",
        name: userProfile?.name || "Alex Johnson",
        role: "employer",
        email: userProfile?.email || "alex@company.com",
        company: "Acme Corp",
        rating: 4.6,
        reviewCount: 38,
        verified: true,
        location: "Austin, TX",
      });
    } else {
      setUserProfile({
        id: "worker-me",
        name: userProfile?.name || "Jordan Lee",
        role: "worker",
        email: userProfile?.email || "jordan@email.com",
        skills: ["Warehouse", "Forklift", "Retail"],
        rating: 4.8,
        reviewCount: 52,
        verified: true,
        hourlyRate: 22,
        location: "Austin, TX",
        completedJobs: 47,
        bio: "Reliable and hardworking with 3+ years in warehouse logistics and retail.",
      });
    }
  }

  function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsOnboarded(false);
    setUserRole(null);
    setUserProfile(null);
    router.replace("/onboarding");
  }

  const initial = (userProfile?.name || "U").charAt(0).toUpperCase();
  const rating = userProfile?.rating ?? 0;
  const completedJobs = (userProfile as any)?.completedJobs ?? 0;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── BLUE HEADER BAND ── */}
      <View style={[styles.headerBand, { paddingTop: topPadding + 16 }]}>
        <View style={styles.headerRow}>
          <View style={{ width: 36 }} />
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.75}>
            <Feather name="settings" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── PROFILE CARD (overlaps header) ── */}
      <View style={styles.profileCard}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {userProfile?.avatar ? (
              <Image
                source={{ uri: userProfile.avatar }}
                style={{ width: "100%", height: "100%", borderRadius: 999 }}
              />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
          {userProfile?.verified && (
            <View style={styles.verifiedBadge}>
              <Feather name="check" size={9} color="#fff" />
            </View>
          )}
        </View>

        <Text style={styles.profileName}>{userProfile?.name || "User"}</Text>
        <View style={styles.roleRow}>
          <Feather name={isEmployer ? "briefcase" : "user"} size={12} color="#6b7280" />
          <Text style={styles.roleText}>
            {isEmployer ? `Employer · ${userProfile?.company || ""}` : "Verified Gig Worker"}
          </Text>
        </View>

        {/* Skills chips — worker only */}
        {!isEmployer && (userProfile as any)?.skills && (
          <View style={styles.skillsRow}>
            {((userProfile as any).skills as string[]).map((s: string) => (
              <View key={s} style={styles.skillChip}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{rating.toFixed(1)}</Text>
            <View style={styles.statLabelRow}>
              <Feather name="star" size={10} color="#f59e0b" />
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          {isEmployer ? (
            <>
              <View style={styles.statCol}>
                <Text style={[styles.statValue, { color: "#2563eb" }]}>38</Text>
                <Text style={styles.statLabel}>Total Hired</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={[styles.statValue, { color: "#10b981" }]}>98%</Text>
                <Text style={styles.statLabel}>Fill Rate</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statCol}>
                <Text style={[styles.statValue, { color: "#10b981" }]}>$780</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statValue}>{completedJobs}</Text>
                <Text style={styles.statLabel}>Gigs Done</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* ── MENU SECTIONS ── */}
      <View style={styles.sectionsWrap}>

        <MenuSection title="Account">
          <MenuItem icon="user" label="Personal Information" onPress={() => router.push("/personal-information")} />
          <MenuItem icon="shield" label="Security & Password" last />
        </MenuSection>

        {!isEmployer && (
          <MenuSection title="Work">
            <MenuItem icon="tool" label="My Skills & Certifications" bg="#ede9fe" accent="#7c3aed" />
            <MenuItem icon="clock" label="Work History" bg="#ede9fe" accent="#7c3aed" />
            <MenuItem icon="award" label="Badges & Achievements" bg="#ede9fe" accent="#7c3aed" last />
          </MenuSection>
        )}

        <MenuSection title="Financials">
          <MenuItem icon="credit-card" label="Payment Methods" bg="#f0fdf4" accent="#16a34a" onPress={() => router.push("/payment-methods")} />
          <MenuItem icon="trending-up" label="Earnings & Payouts" bg="#f0fdf4" accent="#16a34a" />
          <MenuItem icon="file-text" label="My Documents" bg="#f0fdf4" accent="#16a34a" onPress={() => router.push("/my-documents")} last />
        </MenuSection>

        <MenuSection title="App">
          <MenuItem icon="bell" label="Notifications" bg="#fff7ed" accent="#ea580c" />
          <MenuItem icon="help-circle" label="Help & Support" bg="#f8fafc" accent="#64748b" />
          <MenuItem icon="info" label="About TrueGigs" bg="#f8fafc" accent="#64748b" last />
        </MenuSection>

        {/* Switch role */}
        <TouchableOpacity style={styles.switchBtn} onPress={handleSwitch} activeOpacity={0.85}>
          <Feather name="repeat" size={16} color="#2563eb" />
          <Text style={styles.switchText}>Switch to {isEmployer ? "Worker" : "Employer"} View</Text>
        </TouchableOpacity>

        {/* Log out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Feather name="log-out" size={16} color="#dc2626" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>TrueGigs v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },

  // Header band
  headerBand: {
    backgroundColor: "#0759af",
    paddingHorizontal: 20,
    paddingBottom: 68,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: -0.2 },
  settingsBtn: { width: 36, alignItems: "flex-end" },

  // Profile card
  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 20,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  avatarWrap: { marginTop: -38, marginBottom: 10, position: "relative" },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
    ...Platform.select({
      ios: { shadowColor: "#2563eb", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 5 },
    }),
  },
  avatarText: { color: "#fff", fontSize: 30, fontWeight: "800" },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: { fontSize: 20, fontWeight: "800", color: "#111827", letterSpacing: -0.3 },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  roleText: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  skillsRow: { flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap", justifyContent: "center" },
  skillChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#dbeafe" },
  skillText: { fontSize: 11, fontWeight: "700", color: "#2563eb" },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  statCol: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 20, fontWeight: "900", color: "#111827", letterSpacing: -0.5 },
  statLabelRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  statLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.3, marginTop: 3 },
  statDivider: { width: 1, height: 36, backgroundColor: "#f3f4f6" },

  // Menu
  sectionsWrap: { paddingHorizontal: 16, paddingTop: 20, gap: 0 },
  menuSection: { marginBottom: 20 },
  menuSectionTitle: { fontSize: 11, fontWeight: "800", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, marginLeft: 4 },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  menuIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1f2937" },

  // Actions
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#dbeafe",
    backgroundColor: "#eff6ff",
    marginBottom: 10,
  },
  switchText: { fontSize: 14, fontWeight: "700", color: "#2563eb" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    marginBottom: 16,
  },
  logoutText: { fontSize: 14, fontWeight: "700", color: "#dc2626" },
  version: { textAlign: "center", fontSize: 11, color: "#d1d5db", fontWeight: "500" },
});

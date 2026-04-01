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
import { TrustBadge } from "@/components/TrustBadge";
import * as Haptics from "expo-haptics";

const WORKER_REVIEWS = [
  { id: "1", author: "Sarah M.", company: "Amazon Logistics", text: "Excellent worker — arrived on time, worked hard all day. Would hire again without hesitation.", rating: 5, date: "2 weeks ago" },
  { id: "2", author: "James R.", company: "Prestige Events", text: "Professional and friendly. Great with customers and kept the event running smoothly.", rating: 5, date: "1 month ago" },
  { id: "3", author: "Linda T.", company: "FreshFoods", text: "Solid work ethic. Certified forklift operator — got right to it without any issues.", rating: 4, date: "2 months ago" },
];

const EMPLOYER_REVIEWS = [
  { id: "1", author: "Michael D.", role: "Warehouse Associate", text: "Very organized hiring process. Clear instructions, good pay, and paid on time. Highly recommend.", rating: 5, date: "3 weeks ago" },
  { id: "2", author: "Keisha W.", role: "Event Staff", text: "Great company to work for as a temp. Respectful management and a fun environment.", rating: 5, date: "1 month ago" },
  { id: "3", author: "Carlos M.", role: "Office Admin", text: "Smooth onboarding and clear expectations. Would work for them again.", rating: 4, date: "2 months ago" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, userRole, setUserRole, setUserProfile, setIsOnboarded } = useApp();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const isEmployer = userRole === "employer";
  const reviews = isEmployer ? EMPLOYER_REVIEWS : WORKER_REVIEWS;

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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: colors.navy, paddingTop: topPadding + 24 }]}>
        <View style={[styles.heroAvatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroAvatarText}>{(userProfile?.name || "U").charAt(0)}</Text>
        </View>
        <Text style={styles.heroName}>{userProfile?.name || "User"}</Text>
        <Text style={styles.heroRole}>
          {isEmployer ? `Employer · ${userProfile?.company || ""}` : "Gig Worker"}
        </Text>

        {userProfile && (
          <View style={{ marginTop: 8 }}>
            <TrustBadge
              rating={userProfile.rating || 0}
              reviewCount={userProfile.reviewCount}
              verified={userProfile.verified}
              size="md"
            />
          </View>
        )}

        {!isEmployer && userProfile?.skills && (
          <View style={styles.skillsRow}>
            {userProfile.skills.map((s) => (
              <View key={s} style={[styles.skillChip, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Info cards */}
      <View style={styles.infoGrid}>
        {[
          { icon: "map-pin", label: userProfile?.location || "Location" },
          isEmployer
            ? { icon: "briefcase", label: userProfile?.company || "Company" }
            : { icon: "dollar-sign", label: `$${userProfile?.hourlyRate || 0}/hr` },
          !isEmployer
            ? { icon: "award", label: `${userProfile?.completedJobs || 0} jobs completed` }
            : { icon: "users", label: "38 hires made" },
        ].map((item, i) => (
          <View key={i} style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name={item.icon as any} size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Bio / description */}
      {(userProfile?.bio || isEmployer) && (
        <View style={[styles.bioCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bioLabel, { color: colors.foreground }]}>About</Text>
          <Text style={[styles.bioText, { color: colors.mutedForeground }]}>
            {isEmployer
              ? "Acme Corp is a leading logistics and fulfillment company based in Austin, TX. We regularly hire reliable temporary workers for our warehouses, events, and administrative offices."
              : userProfile?.bio}
          </Text>
        </View>
      )}

      {/* Reviews */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Reviews ({reviews.length})
        </Text>
        {reviews.map((r) => (
          <View key={r.id} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.reviewHeader}>
              <View style={[styles.reviewAvatar, { backgroundColor: colors.muted }]}>
                <Text style={[styles.reviewAvatarText, { color: colors.foreground }]}>
                  {r.author.charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reviewAuthor, { color: colors.foreground }]}>{r.author}</Text>
                <Text style={[styles.reviewContext, { color: colors.mutedForeground }]}>
                  {isEmployer ? (r as any).role : (r as any).company}
                </Text>
              </View>
              <View style={styles.reviewStars}>
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Feather key={i} name="star" size={12} color="#f59e0b" />
                ))}
              </View>
            </View>
            <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>{r.text}</Text>
            <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>{r.date}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={[styles.actionsSection, { paddingHorizontal: 20 }]}>
        <TouchableOpacity
          style={[styles.switchBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleSwitch}
        >
          <Feather name="repeat" size={18} color={colors.primary} />
          <Text style={[styles.switchText, { color: colors.primary }]}>
            Switch to {isEmployer ? "Worker" : "Employer"} View
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: "#fef2f2", borderColor: "#fecaca" }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  heroAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroAvatarText: { color: "#fff", fontSize: 36, fontWeight: "700" },
  heroName: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 4 },
  heroRole: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 8 },
  skillsRow: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap", justifyContent: "center" },
  skillChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  skillText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, padding: 20, paddingBottom: 0 },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minWidth: "45%",
  },
  infoText: { fontSize: 13, fontWeight: "500", flex: 1 },
  bioCard: { margin: 20, padding: 16, borderRadius: 14, borderWidth: 1 },
  bioLabel: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  bioText: { fontSize: 13, lineHeight: 20 },
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  reviewCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  reviewAvatar: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },
  reviewAvatarText: { fontSize: 16, fontWeight: "700" },
  reviewAuthor: { fontSize: 14, fontWeight: "700" },
  reviewContext: { fontSize: 12, marginTop: 1 },
  reviewStars: { flexDirection: "row", gap: 2 },
  reviewText: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  reviewDate: { fontSize: 11 },
  actionsSection: { gap: 12, marginBottom: 20 },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
  },
  switchText: { fontSize: 15, fontWeight: "600" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
  },
  logoutText: { fontSize: 15, fontWeight: "600" },
});

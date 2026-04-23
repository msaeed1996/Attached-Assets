import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Logo } from "@/components/Logo";

const APP_VERSION = "1.0.0";
const BUILD_NUMBER = "100";

function StatTile({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FeatureRow({ icon, color, bg, title, body }: { icon: string; color: string; bg: string; title: string; body: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIcon, { backgroundColor: bg }]}>
        <Feather name={icon as any} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </View>
    </View>
  );
}

function LinkRow({ icon, label, onPress, last = false }: { icon: string; label: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.linkRow, !last && styles.linkRowBorder]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <Feather name={icon as any} size={16} color="#6b7280" />
      <Text style={styles.linkLabel}>{label}</Text>
      <Feather name="chevron-right" size={15} color="#d1d5db" />
    </TouchableOpacity>
  );
}

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === "ios" ? 50 : 24);

  function open(url: string) {
    Linking.openURL(url).catch(() => {});
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About TrueGigs</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Logo size={48} style={styles.logoCircle} />
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>TrueGigs</Text>
            <Text style={styles.tagline}>Real work. Real workers. Real fast.</Text>
          </View>
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>v{APP_VERSION}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatTile value="50K+" label="Workers" color="#2563eb" />
          <StatTile value="2.4K" label="Employers" color="#7c3aed" />
          <StatTile value="98%" label="Fill Rate" color="#10b981" />
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              TrueGigs connects verified hourly workers with trusted employers in hospitality, retail,
              warehouse, and events. We make finding your next shift as simple as tapping a button —
              and getting paid as soon as the job is done.
            </Text>
          </View>
        </View>

        {/* What we do */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Makes Us Different</Text>
          <View style={styles.card}>
            <FeatureRow
              icon="zap"
              color="#2563eb"
              bg="#eff6ff"
              title="Instant Match"
              body="Get matched to shifts that fit your skills and availability in seconds."
            />
            <View style={styles.divider} />
            <FeatureRow
              icon="shield"
              color="#10b981"
              bg="#ecfdf5"
              title="Verified Both Ways"
              body="Every worker and employer is identity-checked and rated by real people."
            />
            <View style={styles.divider} />
            <FeatureRow
              icon="dollar-sign"
              color="#d97706"
              bg="#fef3c7"
              title="Same-Day Pay"
              body="Clock out and cash out — earnings hit your account in hours, not weeks."
            />
            <View style={styles.divider} />
            <FeatureRow
              icon="award"
              color="#7c3aed"
              bg="#ede9fe"
              title="Build Your Reputation"
              body="Every completed gig builds your rating, badges, and earning power."
            />
          </View>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <View style={styles.card}>
            <LinkRow icon="globe" label="Visit truegigs.com" onPress={() => open("https://truegigs.com")} />
            <LinkRow icon="file-text" label="Terms of Service" onPress={() => open("https://truegigs.com/terms")} />
            <LinkRow icon="lock" label="Privacy Policy" onPress={() => open("https://truegigs.com/privacy")} />
            <LinkRow icon="mail" label="Contact Support" onPress={() => open("mailto:support@truegigs.com")} />
            <LinkRow
              icon="star"
              label="Rate TrueGigs"
              onPress={() =>
                open(
                  Platform.OS === "android"
                    ? "https://play.google.com/store/apps/details?id=com.truegigs.truegigs"
                    : "https://apps.apple.com/us/app/truegigs/id1387381968"
                )
              }
              last
            />
          </View>
        </View>

        {/* Social */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn} onPress={() => open("https://www.facebook.com/truegigsstaffing")} activeOpacity={0.75}>
            <Feather name="facebook" size={16} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={() => open("https://www.linkedin.com/company/truegigsstaffing")} activeOpacity={0.75}>
            <Feather name="linkedin" size={16} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={() => open("https://www.instagram.com/truegigsstaffing/")} activeOpacity={0.75}>
            <Feather name="instagram" size={16} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={() => open("https://www.pinterest.com/truegigsstaffing/")} activeOpacity={0.75}>
            <FontAwesome name="pinterest-p" size={15} color="#2563eb" />
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Made with care in Austin, TX{"\n"}© {new Date().getFullYear()} TrueGigs, Inc. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0759af",
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { width: 36, height: 36, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.2 },

  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  appName: { fontSize: 18, fontWeight: "900", color: "#111827", letterSpacing: -0.4 },
  tagline: { fontSize: 12, color: "#6b7280", marginTop: 1, fontWeight: "500" },
  versionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  versionText: { fontSize: 10, color: "#2563eb", fontWeight: "700" },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  statTile: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statValue: { fontSize: 18, fontWeight: "900", letterSpacing: -0.4 },
  statLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 3 },

  section: { paddingHorizontal: 16, paddingTop: 18 },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  bodyText: { fontSize: 13, lineHeight: 20, color: "#374151" },

  featureRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  featureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  featureTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  featureBody: { fontSize: 12, color: "#6b7280", marginTop: 2, lineHeight: 17 },
  divider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 12 },

  linkRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  linkRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  linkLabel: { flex: 1, fontSize: 14, color: "#1f2937", fontWeight: "600" },

  socialRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 24 },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },

  footer: { textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 22, lineHeight: 16, paddingHorizontal: 24 },
});

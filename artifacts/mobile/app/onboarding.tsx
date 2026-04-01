import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import * as Haptics from "expo-haptics";

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setUserRole, setUserProfile, setIsOnboarded } = useApp();
  const [step, setStep] = useState(0);

  function selectRole(role: "employer" | "worker") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUserRole(role);
    if (role === "employer") {
      setUserProfile({
        id: "emp-me",
        name: "Alex Johnson",
        role: "employer",
        email: "alex@company.com",
        company: "Acme Corp",
        rating: 4.6,
        reviewCount: 38,
        verified: true,
        location: "Austin, TX",
      });
    } else {
      setUserProfile({
        id: "worker-me",
        name: "Jordan Lee",
        role: "worker",
        email: "jordan@email.com",
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
    setIsOnboarded(true);
    router.replace("/(tabs)");
  }

  if (step === 0) {
    return (
      <View style={[styles.welcome, { backgroundColor: colors.navy }]}>
        <View style={[styles.welcomeContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.logoRow}>
            <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
              <Feather name="check-circle" size={28} color="#fff" />
            </View>
            <Text style={styles.logoText}>TrueGigs</Text>
          </View>

          <Text style={styles.tagline}>
            Work that{"\n"}works for you.
          </Text>
          <Text style={styles.sub}>
            Connect instantly with trusted employers and reliable workers — no delays, no complexity.
          </Text>

          <View style={styles.statsRow}>
            {[
              { val: "10K+", label: "Workers" },
              { val: "2K+", label: "Companies" },
              { val: "98%", label: "Fill Rate" },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.getStartedBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStep(1);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <Feather name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.loginHint}>
            Already have an account?{" "}
            <Text style={{ color: colors.primary }} onPress={() => setStep(1)}>
              Sign in
            </Text>
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.roleSelect, { backgroundColor: colors.background }]}>
      <View style={[styles.roleContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        <TouchableOpacity
          onPress={() => setStep(0)}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={[styles.roleTitle, { color: colors.foreground }]}>How will you use TrueGigs?</Text>
        <Text style={[styles.roleSub, { color: colors.mutedForeground }]}>
          Choose your primary role — you can always switch later.
        </Text>

        <TouchableOpacity
          style={[styles.roleCard, { borderColor: colors.border, backgroundColor: colors.card,
            ...(Platform.OS === "ios" ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12 } : { elevation: 3 })
          }]}
          onPress={() => selectRole("employer")}
          activeOpacity={0.88}
        >
          <View style={[styles.roleIcon, { backgroundColor: "#dbeafe" }]}>
            <Feather name="briefcase" size={32} color={colors.primary} />
          </View>
          <View style={styles.roleInfo}>
            <Text style={[styles.roleCardTitle, { color: colors.foreground }]}>I'm Hiring</Text>
            <Text style={[styles.roleCardDesc, { color: colors.mutedForeground }]}>
              Post jobs, review applicants, and hire reliable workers for your business — fast.
            </Text>
            <View style={styles.roleFeatures}>
              {["Post jobs in 2 min", "AI-matched candidates", "Instant hire"].map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Feather name="check" size={13} color={colors.success} />
                  <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, { borderColor: colors.border, backgroundColor: colors.card,
            ...(Platform.OS === "ios" ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12 } : { elevation: 3 })
          }]}
          onPress={() => selectRole("worker")}
          activeOpacity={0.88}
        >
          <View style={[styles.roleIcon, { backgroundColor: "#d1fae5" }]}>
            <Feather name="user" size={32} color={colors.success} />
          </View>
          <View style={styles.roleInfo}>
            <Text style={[styles.roleCardTitle, { color: colors.foreground }]}>I'm Looking for Work</Text>
            <Text style={[styles.roleCardDesc, { color: colors.mutedForeground }]}>
              Browse and apply to flexible gig jobs near you. Get paid fast.
            </Text>
            <View style={styles.roleFeatures}>
              {["One-tap apply", "Instant notifications", "Same-day pay options"].map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Feather name="check" size={13} color={colors.success} />
                  <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  welcome: {
    flex: 1,
  },
  welcomeContent: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 40,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  tagline: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 50,
    letterSpacing: -1,
    marginBottom: 16,
  },
  sub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
  },
  statsRow: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 48,
  },
  statItem: {
    alignItems: "center",
  },
  statVal: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  getStartedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 14,
    gap: 10,
    marginBottom: 20,
  },
  getStartedText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  loginHint: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
  },
  roleSelect: {
    flex: 1,
  },
  roleContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backBtn: {
    marginBottom: 24,
    width: 40,
  },
  roleTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  roleSub: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 16,
  },
  roleIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  roleInfo: {
    flex: 1,
  },
  roleCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  roleCardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  roleFeatures: {
    gap: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureText: {
    fontSize: 12,
  },
});

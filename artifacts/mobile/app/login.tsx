import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setUserRole, setUserProfile, setIsOnboarded } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = emailValid && password.length >= 6 && !loading;

  async function handleSignIn() {
    if (!canSubmit) {
      if (!emailValid) setError("Please enter a valid email address.");
      else if (password.length < 6) setError("Password must be at least 6 characters.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      setUserRole("worker");
      setUserProfile({
        id: "worker-me",
        name: email.split("@")[0] || "Jordan Lee",
        role: "worker",
        email,
        skills: ["Warehouse", "Forklift", "Retail"],
        rating: 4.8,
        reviewCount: 52,
        verified: true,
        hourlyRate: 22,
        location: "Austin, TX",
        completedJobs: 47,
        bio: "Reliable and hardworking with 3+ years in warehouse logistics and retail.",
      });
      setIsOnboarded(true);
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    }, 700);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary, "#1d4ed8", colors.navy]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroBg, { paddingTop: insets.top }]}
      >
        <View style={styles.heroDecorTop} />
        <View style={styles.heroDecorBottom} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <Feather name="check-circle" size={28} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>TrueGigs</Text>
            <Text style={styles.brandSubtitle}>Welcome back — let's get to work.</Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                ...(Platform.OS === "ios"
                  ? { shadowColor: "#0f172a", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 24 }
                  : { elevation: 6 }),
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sign in</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Enter your details to continue.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Email Address</Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    borderColor: emailFocus ? colors.primary : colors.border,
                    backgroundColor: emailFocus ? colors.card : colors.muted,
                  },
                ]}
              >
                <Feather
                  name="mail"
                  size={18}
                  color={emailFocus ? colors.primary : colors.mutedForeground}
                />
                <TextInput
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (error) setError(null);
                  }}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  style={[styles.input, { color: colors.foreground }]}
                />
                {emailValid && (
                  <Feather name="check-circle" size={18} color={colors.success} />
                )}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
                <TouchableOpacity hitSlop={8}>
                  <Text style={[styles.forgot, { color: colors.primary }]}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.inputWrap,
                  {
                    borderColor: passwordFocus ? colors.primary : colors.border,
                    backgroundColor: passwordFocus ? colors.card : colors.muted,
                  },
                ]}
              >
                <Feather
                  name="lock"
                  size={18}
                  color={passwordFocus ? colors.primary : colors.mutedForeground}
                />
                <TextInput
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (error) setError(null);
                  }}
                  onFocus={() => setPasswordFocus(true)}
                  onBlur={() => setPasswordFocus(false)}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  style={[styles.input, { color: colors.foreground }]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((s) => !s)}
                  hitSlop={8}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {error && (
              <View style={[styles.errorBanner, { backgroundColor: "#fef2f2", borderColor: "#fecaca" }]}>
                <Feather name="alert-circle" size={16} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            )}

            <View style={styles.submitRow}>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: canSubmit ? colors.primary : colors.muted },
                ]}
                onPress={handleSignIn}
                activeOpacity={0.88}
                disabled={!canSubmit}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.submitText,
                        { color: canSubmit ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      Sign In
                    </Text>
                    <Feather
                      name="arrow-right"
                      size={18}
                      color={canSubmit ? "#fff" : colors.mutedForeground}
                    />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bioBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                activeOpacity={0.85}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <Feather name="smile" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or continue with</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/signup");
                }}
              >
                <Feather name="mail" size={18} color={colors.foreground} />
                <Text style={[styles.socialText, { color: colors.foreground }]}>Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialBtn, { borderColor: "#000", backgroundColor: "#000" }]}
                activeOpacity={0.85}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <FontAwesome name="apple" size={18} color="#fff" />
                <Text style={[styles.socialText, { color: "#fff" }]}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.signupRow}>
            <Text style={[styles.signupText, { color: colors.mutedForeground }]}>
              New to TrueGigs?
            </Text>
            <TouchableOpacity onPress={() => router.push("/signup")} hitSlop={8}>
              <Text style={[styles.signupLink, { color: colors.primary }]}>Create account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerLinks}>
            <Text style={[styles.footerLink, { color: colors.mutedForeground }]}>Privacy Policy</Text>
            <View style={[styles.footerDot, { backgroundColor: colors.mutedForeground }]} />
            <Text style={[styles.footerLink, { color: colors.mutedForeground }]}>Terms of Service</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
  },
  heroDecorTop: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -80,
    right: -60,
  },
  heroDecorBottom: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 160,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -40,
    left: -40,
  },
  scroll: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  brand: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  brandTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginTop: 6,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 18,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  forgot: {
    fontSize: 12,
    fontWeight: "700",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
    borderRadius: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  submitRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  submitBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  bioBtn: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  socialRow: {
    flexDirection: "row",
    gap: 10,
  },
  socialBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  socialText: {
    fontSize: 13,
    fontWeight: "600",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 24,
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "800",
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  footerLink: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    opacity: 0.7,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 3,
    opacity: 0.5,
  },
});

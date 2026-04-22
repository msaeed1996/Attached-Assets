import React, { useMemo, useState } from "react";
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
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp, type UserRole } from "@/context/AppContext";

type Role = Exclude<UserRole, null>;

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setUserRole, setUserProfile, setIsOnboarded } = useApp();

  const [step, setStep] = useState<0 | 1>(0);
  const [role, setRole] = useState<Role>("worker");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordsMatch = password.length >= 8 && password === confirm;

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score; // 0-4
  }, [password]);

  const strengthLabel = ["Too weak", "Weak", "Okay", "Strong", "Excellent"][passwordStrength];
  const strengthColor = [
    colors.destructive,
    colors.destructive,
    colors.warning,
    colors.success,
    colors.success,
  ][passwordStrength];

  const canContinue =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    emailValid &&
    passwordsMatch &&
    agree;

  function handleContinue() {
    if (!canContinue) {
      if (!firstName.trim() || !lastName.trim()) setError("Please enter your full name.");
      else if (!emailValid) setError("Please enter a valid email address.");
      else if (password.length < 8) setError("Password must be at least 8 characters.");
      else if (password !== confirm) setError("Passwords don't match.");
      else if (!agree) setError("Please accept the terms to continue.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(1);
  }

  function handleCreateAccount() {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      setUserRole(role);
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (role === "employer") {
        setUserProfile({
          id: "emp-me",
          name: fullName || "Alex Johnson",
          role: "employer",
          email,
          company: "Your Company",
          rating: 0,
          reviewCount: 0,
          verified: false,
          location: "Austin, TX",
        });
      } else {
        setUserProfile({
          id: "worker-me",
          name: fullName || "Jordan Lee",
          role: "worker",
          email,
          skills: [],
          rating: 0,
          reviewCount: 0,
          verified: false,
          hourlyRate: 0,
          location: "Austin, TX",
          completedJobs: 0,
          bio: "",
        });
      }
      setIsOnboarded(true);
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    }, 800);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary, "#1d4ed8", colors.navy]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroBg]}
      >
        <View style={styles.heroDecorTop} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={() => (step === 0 ? router.back() : setStep(0))}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{step + 1} / 2</Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { marginTop: 8 }]}>
          <View
            style={[
              styles.progressFill,
              { width: step === 0 ? "50%" : "100%" },
            ]}
          />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerArea}>
            <Text style={styles.headerTitle}>
              {step === 0 ? "Create your account" : "Choose your role"}
            </Text>
            <Text style={styles.headerSub}>
              {step === 0
                ? "Just a few details to get you started."
                : "How will you use TrueGigs? You can switch later."}
            </Text>
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
            {step === 0 ? (
              <>
                <View style={styles.nameRow}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.mutedForeground }]}>First name</Text>
                    <View
                      style={[
                        styles.inputWrap,
                        {
                          borderColor: focused === "first" ? colors.primary : colors.border,
                          backgroundColor: focused === "first" ? colors.card : colors.muted,
                        },
                      ]}
                    >
                      <TextInput
                        value={firstName}
                        onChangeText={(t) => {
                          setFirstName(t);
                          if (error) setError(null);
                        }}
                        onFocus={() => setFocused("first")}
                        onBlur={() => setFocused(null)}
                        placeholder="John"
                        placeholderTextColor={colors.mutedForeground}
                        style={[styles.input, { color: colors.foreground }]}
                      />
                    </View>
                  </View>

                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.mutedForeground }]}>Last name</Text>
                    <View
                      style={[
                        styles.inputWrap,
                        {
                          borderColor: focused === "last" ? colors.primary : colors.border,
                          backgroundColor: focused === "last" ? colors.card : colors.muted,
                        },
                      ]}
                    >
                      <TextInput
                        value={lastName}
                        onChangeText={(t) => {
                          setLastName(t);
                          if (error) setError(null);
                        }}
                        onFocus={() => setFocused("last")}
                        onBlur={() => setFocused(null)}
                        placeholder="Doe"
                        placeholderTextColor={colors.mutedForeground}
                        style={[styles.input, { color: colors.foreground }]}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>Email address</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      {
                        borderColor: focused === "email" ? colors.primary : colors.border,
                        backgroundColor: focused === "email" ? colors.card : colors.muted,
                      },
                    ]}
                  >
                    <Feather
                      name="mail"
                      size={18}
                      color={focused === "email" ? colors.primary : colors.mutedForeground}
                    />
                    <TextInput
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        if (error) setError(null);
                      }}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
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
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      {
                        borderColor: focused === "password" ? colors.primary : colors.border,
                        backgroundColor: focused === "password" ? colors.card : colors.muted,
                      },
                    ]}
                  >
                    <Feather
                      name="lock"
                      size={18}
                      color={focused === "password" ? colors.primary : colors.mutedForeground}
                    />
                    <TextInput
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        if (error) setError(null);
                      }}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused(null)}
                      placeholder="At least 8 characters"
                      placeholderTextColor={colors.mutedForeground}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={[styles.input, { color: colors.foreground }]}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                      <Feather
                        name={showPassword ? "eye-off" : "eye"}
                        size={18}
                        color={colors.mutedForeground}
                      />
                    </TouchableOpacity>
                  </View>
                  {password.length > 0 && (
                    <View style={styles.strengthRow}>
                      <View style={styles.strengthBars}>
                        {[0, 1, 2, 3].map((i) => (
                          <View
                            key={i}
                            style={[
                              styles.strengthBar,
                              {
                                backgroundColor:
                                  i < passwordStrength ? strengthColor : colors.border,
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                        {strengthLabel}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>Confirm password</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      {
                        borderColor: focused === "confirm" ? colors.primary : colors.border,
                        backgroundColor: focused === "confirm" ? colors.card : colors.muted,
                      },
                    ]}
                  >
                    <Feather
                      name="shield"
                      size={18}
                      color={focused === "confirm" ? colors.primary : colors.mutedForeground}
                    />
                    <TextInput
                      value={confirm}
                      onChangeText={(t) => {
                        setConfirm(t);
                        if (error) setError(null);
                      }}
                      onFocus={() => setFocused("confirm")}
                      onBlur={() => setFocused(null)}
                      placeholder="Re-enter password"
                      placeholderTextColor={colors.mutedForeground}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={[styles.input, { color: colors.foreground }]}
                    />
                    {confirm.length > 0 && (
                      <Feather
                        name={passwordsMatch ? "check-circle" : "x-circle"}
                        size={18}
                        color={passwordsMatch ? colors.success : colors.destructive}
                      />
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.agreeRow}
                  onPress={() => {
                    setAgree((v) => !v);
                    if (error) setError(null);
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: agree ? colors.primary : "transparent",
                        borderColor: agree ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {agree && <Feather name="check" size={14} color="#fff" />}
                  </View>
                  <Text style={[styles.agreeText, { color: colors.mutedForeground }]}>
                    I agree to the <Text style={{ color: colors.primary, fontWeight: "700" }}>Terms</Text> and{" "}
                    <Text style={{ color: colors.primary, fontWeight: "700" }}>Privacy Policy</Text>.
                  </Text>
                </TouchableOpacity>

                {error && (
                  <View style={[styles.errorBanner, { backgroundColor: "#fef2f2", borderColor: "#fecaca" }]}>
                    <Feather name="alert-circle" size={16} color={colors.destructive} />
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: canContinue ? colors.primary : colors.muted },
                  ]}
                  onPress={handleContinue}
                  activeOpacity={0.88}
                >
                  <Text
                    style={[
                      styles.submitText,
                      { color: canContinue ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    Continue
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={18}
                    color={canContinue ? "#fff" : colors.mutedForeground}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <>
                {([
                  {
                    key: "worker",
                    icon: "user" as const,
                    title: "I'm looking for work",
                    desc: "Browse flexible gigs near you and get paid fast.",
                    tint: "#d1fae5",
                    iconColor: colors.success,
                  },
                  {
                    key: "employer",
                    icon: "briefcase" as const,
                    title: "I'm hiring",
                    desc: "Post jobs and hire trusted workers in minutes.",
                    tint: "#dbeafe",
                    iconColor: colors.primary,
                  },
                ] as const).map((opt) => {
                  const selected = role === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.roleOpt,
                        {
                          borderColor: selected ? colors.primary : colors.border,
                          backgroundColor: selected ? "#eff6ff" : colors.card,
                          borderWidth: selected ? 2 : 1.5,
                        },
                      ]}
                      onPress={() => {
                        setRole(opt.key);
                        Haptics.selectionAsync();
                      }}
                      activeOpacity={0.88}
                    >
                      <View style={[styles.roleIcon, { backgroundColor: opt.tint }]}>
                        <Feather name={opt.icon} size={26} color={opt.iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.roleTitle, { color: colors.foreground }]}>{opt.title}</Text>
                        <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{opt.desc}</Text>
                      </View>
                      <View
                        style={[
                          styles.radio,
                          {
                            borderColor: selected ? colors.primary : colors.border,
                            backgroundColor: selected ? colors.primary : "transparent",
                          },
                        ]}
                      >
                        {selected && <Feather name="check" size={14} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: colors.primary, marginTop: 8 }]}
                  onPress={handleCreateAccount}
                  activeOpacity={0.88}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={[styles.submitText, { color: "#fff" }]}>Create account</Text>
                      <Feather name="check" size={18} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.signupRow}>
            <Text style={[styles.signupText, { color: colors.mutedForeground }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => router.replace("/login")} hitSlop={8}>
              <Text style={[styles.signupLink, { color: colors.primary }]}>Sign in</Text>
            </TouchableOpacity>
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
    height: 240,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  stepBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  progressTrack: {
    height: 4,
    marginHorizontal: 20,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    flexGrow: 1,
  },
  headerArea: {
    marginBottom: 18,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  headerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  nameRow: {
    flexDirection: "row",
    gap: 10,
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
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderRadius: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 12,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 4,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  agreeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4,
    marginBottom: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  agreeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  submitBtn: {
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
  roleOpt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
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
});

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
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { SignupHeader } from "@/components/SignupHeader";
import { useApp, type UserRole } from "@/context/AppContext";

type Role = Exclude<UserRole, null>;

function formatPhone(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setUserRole, setUserProfile } = useApp();

  const [role, setRole] = useState<Role>("worker");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length === 10;
  const zipValid = /^\d{5}$/.test(zip);
  const passwordStrength = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
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
    emailValid &&
    firstName.trim() &&
    lastName.trim() &&
    phoneValid &&
    zipValid &&
    password.length >= 8 &&
    agree;

  function handleContinue() {
    if (!canContinue) {
      if (!emailValid) setError("Please enter a valid email address.");
      else if (!firstName.trim() || !lastName.trim()) setError("Please enter your full name.");
      else if (!phoneValid) setError("Please enter a valid 10-digit phone number.");
      else if (!zipValid) setError("Please enter a valid 5-digit zip code.");
      else if (password.length < 8) setError("Password must be at least 8 characters.");
      else if (!agree) setError("Please accept the terms to continue.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const fullName = `${firstName.trim()}${middleInitial ? ` ${middleInitial.trim()}.` : ""} ${lastName.trim()}`.trim();
    setUserRole(role);
    if (role === "employer") {
      setUserProfile({
        id: "emp-me",
        name: fullName,
        role: "employer",
        email,
        company: "Your Company",
        rating: 0,
        reviewCount: 0,
        verified: false,
        location: zip,
      });
      // Employers skip skills, go straight to identification
      router.push("/signup-identification");
    } else {
      setUserProfile({
        id: "worker-me",
        name: fullName,
        role: "worker",
        email,
        skills: [],
        rating: 0,
        reviewCount: 0,
        verified: false,
        hourlyRate: 0,
        location: zip,
        completedJobs: 0,
        bio: "",
      });
      router.push("/signup-skills");
    }
  }

  function renderField(opts: {
    name: string;
    label: string;
    icon?: keyof typeof Feather.glyphMap;
    value: string;
    onChange: (s: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
    secure?: boolean;
    autoCap?: "none" | "words";
    valid?: boolean;
    rightSlot?: React.ReactNode;
    maxLength?: number;
    flex?: number;
    width?: number;
    autoComplete?: any;
  }) {
    const isFocused = focused === opts.name;
    const borderColor = isFocused
      ? colors.primary
      : opts.valid
      ? "#bbf7d0"
      : colors.border;
    return (
      <View style={[{ flex: opts.flex, width: opts.width }]}>
        <View
          style={[
            styles.floatingLabelWrap,
            { borderColor, backgroundColor: colors.card },
          ]}
        >
          <Text
            style={[
              styles.floatingLabel,
              {
                color: isFocused ? colors.primary : colors.mutedForeground,
                backgroundColor: colors.card,
              },
            ]}
          >
            {opts.label}
          </Text>
          <View style={styles.floatingInner}>
            {opts.icon && (
              <Feather
                name={opts.icon}
                size={17}
                color={isFocused ? colors.primary : colors.mutedForeground}
              />
            )}
            <TextInput
              value={opts.value}
              onChangeText={(t) => {
                opts.onChange(t);
                if (error) setError(null);
              }}
              onFocus={() => setFocused(opts.name)}
              onBlur={() => setFocused(null)}
              placeholder={opts.placeholder}
              placeholderTextColor={colors.mutedForeground}
              keyboardType={opts.keyboardType}
              secureTextEntry={opts.secure}
              autoCapitalize={opts.autoCap ?? "none"}
              autoCorrect={false}
              autoComplete={opts.autoComplete}
              maxLength={opts.maxLength}
              style={[styles.floatingInput, { color: colors.foreground }]}
            />
            {opts.rightSlot}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SignupHeader
        title="Create Account"
        subtitle="Tell us a bit about yourself to get started."
        step={1}
        totalSteps={role === "worker" ? 3 : 2}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Role toggle */}
          <View style={[styles.roleToggle, { backgroundColor: colors.muted }]}>
            {(["worker", "employer"] as const).map((r) => {
              const selected = role === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleToggleBtn,
                    selected && {
                      backgroundColor: colors.card,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 6,
                      elevation: 2,
                    },
                  ]}
                  onPress={() => {
                    setRole(r);
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={r === "worker" ? "user" : "briefcase"}
                    size={15}
                    color={selected ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.roleToggleText,
                      { color: selected ? colors.foreground : colors.mutedForeground },
                    ]}
                  >
                    {r === "worker" ? "Find Work" : "Hire Workers"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section: Account */}
          <Text style={[styles.section, { color: colors.mutedForeground }]}>Account</Text>
          {renderField({
            name: "email",
            label: "Email Address",
            icon: "mail",
            value: email,
            onChange: setEmail,
            placeholder: "you@example.com",
            keyboardType: "email-address",
            valid: emailValid,
            autoComplete: "email",
            rightSlot: emailValid ? (
              <Feather name="check-circle" size={17} color={colors.success} />
            ) : null,
          })}

          <View style={{ marginTop: 12 }}>
            {renderField({
              name: "password",
              label: "Password",
              icon: "lock",
              value: password,
              onChange: setPassword,
              placeholder: "At least 8 characters",
              secure: !showPassword,
              valid: passwordStrength >= 3,
              rightSlot: (
                <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={17}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              ),
            })}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBars}>
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor: i < passwordStrength ? strengthColor : colors.border,
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

          {/* Section: Name */}
          <Text style={[styles.section, { color: colors.mutedForeground }]}>Personal Info</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {renderField({
              name: "first",
              label: "First Name",
              icon: "user",
              value: firstName,
              onChange: setFirstName,
              placeholder: "John",
              autoCap: "words",
              flex: 1,
              valid: firstName.trim().length > 0,
              autoComplete: "given-name",
            })}
            {renderField({
              name: "mi",
              label: "MI",
              value: middleInitial,
              onChange: (s) => setMiddleInitial(s.slice(0, 1).toUpperCase()),
              placeholder: "M",
              autoCap: "words",
              width: 70,
              maxLength: 1,
            })}
          </View>

          <View style={{ marginTop: 12 }}>
            {renderField({
              name: "last",
              label: "Last Name",
              value: lastName,
              onChange: setLastName,
              placeholder: "Doe",
              autoCap: "words",
              valid: lastName.trim().length > 0,
              autoComplete: "family-name",
            })}
          </View>

          <View style={{ marginTop: 12 }}>
            {renderField({
              name: "phone",
              label: "Cell #",
              icon: "smartphone",
              value: phone,
              onChange: (s) => setPhone(formatPhone(s)),
              placeholder: "(123) 456-7890",
              keyboardType: "phone-pad",
              valid: phoneValid,
              maxLength: 14,
              autoComplete: "tel",
            })}
          </View>

          <View style={{ marginTop: 12 }}>
            {renderField({
              name: "zip",
              label: "Zip Code",
              icon: "map-pin",
              value: zip,
              onChange: (s) => setZip(s.replace(/\D/g, "").slice(0, 5)),
              placeholder: "12345",
              keyboardType: "number-pad",
              valid: zipValid,
              maxLength: 5,
              autoComplete: "postal-code",
            })}
          </View>

          {/* Terms */}
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
              I agree to the{" "}
              <Text style={{ color: colors.primary, fontWeight: "700" }}>Terms</Text> and{" "}
              <Text style={{ color: colors.primary, fontWeight: "700" }}>Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>

          {error && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
              ]}
            >
              <Feather name="alert-circle" size={16} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          )}

          <View style={styles.signinRow}>
            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => router.replace("/login")} hitSlop={8}>
              <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 14 }}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Sticky footer */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
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
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  roleToggle: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    marginBottom: 18,
  },
  roleToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  roleToggleText: {
    fontSize: 13,
    fontWeight: "700",
  },
  section: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 10,
  },
  floatingLabelWrap: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingTop: 6,
  },
  floatingLabel: {
    position: "absolute",
    top: -8,
    left: 12,
    paddingHorizontal: 6,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    zIndex: 2,
  },
  floatingInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 52,
  },
  floatingInput: {
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
    paddingHorizontal: 4,
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
    marginTop: 18,
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
    marginTop: 14,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  signinRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 22,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
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
});

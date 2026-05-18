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
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { SignupHeader } from "@/components/SignupHeader";
import { useApp } from "@/context/AppContext";

const REFERRAL_OPTIONS = [
  "Friend or family",
  "Social media",
  "Online search",
  "Job board",
  "Employer referral",
  "Other",
];

export default function SignupAddressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, userRole } = useApp();

  const [address, setAddress] = useState("");
  const [apt, setApt] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [referral, setReferral] = useState("");
  const [showReferralPicker, setShowReferralPicker] = useState(false);
  const [agree, setAgree] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const zipValid = /^\d{5}$/.test(zip);
  const passwordsMatch = password.length >= 6 && password === confirmPassword;

  const canContinue =
    address.trim() &&
    zip.trim() &&
    city.trim() &&
    state.trim() &&
    password.length >= 6 &&
    passwordsMatch &&
    agree;

  function handleContinue() {
    if (!canContinue) {
      if (!address.trim()) setError("Please enter your street address.");
      else if (!zip.trim() || !zipValid) setError("Please enter a valid 5-digit ZIP code.");
      else if (!city.trim()) setError("Please enter your city.");
      else if (!state.trim()) setError("Please enter your state.");
      else if (password.length < 6) setError("Password must be at least 6 characters.");
      else if (!passwordsMatch) setError("Passwords do not match.");
      else if (!agree) setError("Please agree to the Terms of Service to continue.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (userRole === "employer") {
      router.push("/signup-identification");
    } else {
      router.push("/signup-skills");
    }
  }

  function field(
    name: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts?: {
      placeholder?: string;
      keyboard?: "default" | "email-address" | "phone-pad" | "number-pad";
      secure?: boolean;
      maxLength?: number;
      autoCap?: "none" | "words" | "sentences";
      flex?: number;
      rightSlot?: React.ReactNode;
    }
  ) {
    const isFocused = focused === name;
    return (
      <View style={[styles.fieldWrap, opts?.flex ? { flex: opts.flex } : {}]}>
        <Text
          style={[
            styles.floatingLabel,
            { color: isFocused ? colors.primary : colors.mutedForeground },
          ]}
        >
          {label}
        </Text>
        <View
          style={[
            styles.inputBox,
            {
              borderColor: isFocused
                ? colors.primary
                : error && !value.trim()
                ? colors.destructive
                : colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <TextInput
            value={value}
            onChangeText={(t) => {
              onChange(t);
              if (error) setError(null);
            }}
            onFocus={() => setFocused(name)}
            onBlur={() => setFocused(null)}
            placeholder={opts?.placeholder ?? label}
            placeholderTextColor={colors.mutedForeground}
            keyboardType={opts?.keyboard ?? "default"}
            secureTextEntry={opts?.secure}
            autoCapitalize={opts?.autoCap ?? "words"}
            autoCorrect={false}
            maxLength={opts?.maxLength}
            style={[styles.input, { color: colors.foreground }]}
          />
          {opts?.rightSlot}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SignupHeader
        title="TrueGigs"
        subtitle="Let's start making money."
        step={2}
        totalSteps={userRole === "worker" ? 5 : 4}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Address */}
        {field("address", "Address", address, setAddress, {
          placeholder: "Street address",
          autoCap: "words",
        })}

        {field("apt", "Apt / Suite", apt, setApt, {
          placeholder: "Apt / Suite (optional)",
          autoCap: "words",
        })}

        {/* ZIP / City / State row */}
        <View style={styles.row}>
          {field("zip", "ZIP Code", zip, setZip, {
            placeholder: "00000",
            keyboard: "number-pad",
            maxLength: 5,
            autoCap: "none",
            flex: 1,
          })}
          {field("city", "City", city, setCity, {
            placeholder: "City",
            autoCap: "words",
            flex: 2,
          })}
          {field("state", "State", state, setState, {
            placeholder: "ST",
            maxLength: 2,
            autoCap: "none",
            flex: 1,
          })}
        </View>

        {/* Password */}
        {field("password", "Password", password, setPassword, {
          placeholder: "At least 6 characters",
          secure: !showPassword,
          autoCap: "none",
          rightSlot: (
            <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={10}>
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={17}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          ),
        })}

        {field("confirm", "Confirm Password", confirmPassword, setConfirmPassword, {
          placeholder: "Re-enter password",
          secure: !showConfirm,
          autoCap: "none",
          rightSlot:
            confirmPassword.length > 0 ? (
              <Feather
                name={passwordsMatch ? "check-circle" : "x-circle"}
                size={17}
                color={passwordsMatch ? colors.success : colors.destructive}
              />
            ) : null,
        })}

        {/* Referral */}
        <TouchableOpacity
          onPress={() => setShowReferralPicker((v) => !v)}
          activeOpacity={0.8}
        >
          <View style={styles.fieldWrap}>
            <Text style={[styles.floatingLabel, { color: colors.mutedForeground }]}>
              How did you hear about this opportunity?
            </Text>
            <View
              style={[
                styles.inputBox,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Text
                style={[
                  styles.input,
                  { color: referral ? colors.foreground : colors.mutedForeground, flex: 1 },
                ]}
              >
                {referral || "Select an option"}
              </Text>
              <Feather
                name={showReferralPicker ? "chevron-up" : "chevron-down"}
                size={17}
                color={colors.mutedForeground}
              />
            </View>
          </View>
        </TouchableOpacity>

        {showReferralPicker && (
          <View
            style={[
              styles.pickerList,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {REFERRAL_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.pickerItem,
                  referral === opt && { backgroundColor: colors.primary + "18" },
                ]}
                onPress={() => {
                  setReferral(opt);
                  setShowReferralPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    {
                      color: referral === opt ? colors.primary : colors.foreground,
                      fontWeight: referral === opt ? "700" : "400",
                    },
                  ]}
                >
                  {opt}
                </Text>
                {referral === opt && (
                  <Feather name="check" size={15} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Error */}
        {error && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
            ]}
          >
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        )}

        {/* Terms */}
        <TouchableOpacity
          style={styles.tosRow}
          onPress={() => {
            setAgree((v) => !v);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
            {agree && <Feather name="check" size={11} color="#fff" />}
          </View>
          <Text style={[styles.tosText, { color: colors.mutedForeground }]}>
            By continuing I agree to{" "}
            <Text style={[styles.tosLink, { color: colors.primary }]}>Terms of Service</Text>
          </Text>
        </TouchableOpacity>

        {/* Continue */}
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.88}
          style={[
            styles.continueBtn,
            { backgroundColor: canContinue ? colors.primary : colors.muted },
          ]}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  fieldWrap: {
    gap: 4,
  },
  floatingLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingHorizontal: 2,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  pickerList: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: -4,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  pickerItemText: {
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  tosRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  tosText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  tosLink: {
    fontWeight: "700",
  },
  continueBtn: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

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
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { SignupHeader } from "@/components/SignupHeader";
import { useApp } from "@/context/AppContext";

interface DocSlot {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  hasViewLink?: boolean;
}

const DOCS: DocSlot[] = [
  {
    key: "primary",
    icon: "credit-card",
    title: "Upload Picture ID",
    subtitle: "e.g. Driver's License or State ID",
    hasViewLink: true,
  },
  {
    key: "secondary",
    icon: "file-text",
    title: "Upload Secondary ID",
    subtitle: "e.g. SSN Card or Birth Certificate",
    hasViewLink: true,
  },
  {
    key: "resume",
    icon: "file",
    title: "Upload Resume",
    subtitle: "PDF or Word format",
  },
];

function formatSSN(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 9);
  if (digits.length < 4) return digits;
  if (digits.length < 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export default function SignupIdentificationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, setUserProfile, setIsOnboarded } = useApp();
  const isWorker = userProfile?.role === "worker";
  const totalSteps = isWorker ? 3 : 2;
  const currentStep = isWorker ? 3 : 2;

  const [dob, setDob] = useState("");
  const [ssn, setSsn] = useState("");
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dobValid = /^\d{4}-\d{2}-\d{2}$/.test(dob) || /^\d{2}\/\d{2}\/\d{4}$/.test(dob);
  const ssnValid = /^\d{3}-\d{2}-\d{4}$/.test(ssn);
  const requiredDocsUploaded = uploaded.primary && uploaded.secondary;
  const canSubmit = dobValid && ssnValid && requiredDocsUploaded && !loading;

  function toggleUpload(key: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUploaded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function showWhyRequired() {
    Alert.alert(
      "Why we ask for this",
      "Your SSN is required for tax forms (W-9 / W-2) and to verify your identity. It's encrypted and never shared with employers.",
      [{ text: "Got it" }],
    );
  }

  function handleSubmit() {
    if (!canSubmit) {
      if (!dobValid) setError("Please enter a valid date of birth.");
      else if (!ssnValid) setError("Please enter a valid SSN.");
      else if (!requiredDocsUploaded) setError("Please upload both Picture ID and Secondary ID.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      if (userProfile) {
        setUserProfile({ ...userProfile, verified: true });
      }
      setIsOnboarded(true);
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    }, 800);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SignupHeader
        title="User Identification"
        subtitle="Verify your identity to start working — fully encrypted."
        step={currentStep}
        totalSteps={totalSteps}
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
          <Text style={[styles.section, { color: colors.mutedForeground }]}>Personal</Text>

          <FloatingField
            label="Date of Birth"
            icon="calendar"
            value={dob}
            onChange={(t) => {
              setDob(t);
              if (error) setError(null);
            }}
            placeholder="YYYY-MM-DD"
            focused={focused === "dob"}
            onFocus={() => setFocused("dob")}
            onBlur={() => setFocused(null)}
            valid={dobValid}
            colors={colors}
          />

          <View style={{ height: 14 }} />
          <FloatingField
            label="Social Security Number"
            icon="shield"
            value={ssn}
            onChange={(t) => {
              setSsn(formatSSN(t));
              if (error) setError(null);
            }}
            placeholder="XXX-XX-XXXX"
            keyboardType="number-pad"
            focused={focused === "ssn"}
            onFocus={() => setFocused("ssn")}
            onBlur={() => setFocused(null)}
            valid={ssnValid}
            secure
            colors={colors}
          />
          <TouchableOpacity onPress={showWhyRequired} style={styles.whyBtn} hitSlop={6}>
            <Feather name="lock" size={11} color="#9333ea" />
            <Text style={styles.whyText}>Why is this information required?</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.sectionRow}>
            <Text style={[styles.section, { color: colors.mutedForeground, marginBottom: 0 }]}>
              Document Uploads
            </Text>
            <Text style={[styles.maxSize, { color: colors.mutedForeground }]}>Max size: 20MB</Text>
          </View>

          {DOCS.map((doc) => {
            const done = !!uploaded[doc.key];
            return (
              <TouchableOpacity
                key={doc.key}
                style={[
                  styles.docCard,
                  {
                    backgroundColor: done ? "#ecfdf5" : colors.card,
                    borderColor: done ? colors.success : colors.border,
                  },
                ]}
                onPress={() => toggleUpload(doc.key)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.docIcon,
                    { backgroundColor: done ? "#d1fae5" : "#dbeafe" },
                  ]}
                >
                  <Feather
                    name={done ? "check" : doc.icon}
                    size={18}
                    color={done ? colors.success : colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.docTitle, { color: colors.foreground }]}>{doc.title}</Text>
                  <Text style={[styles.docSub, { color: colors.mutedForeground }]}>
                    {done ? "Uploaded · tap to remove" : doc.subtitle}
                  </Text>
                  {!done && doc.hasViewLink && (
                    <View style={{ marginTop: 6 }}>
                      <Text style={styles.viewLink}>View accepted documents</Text>
                    </View>
                  )}
                </View>
                <View
                  style={[
                    styles.docAction,
                    {
                      backgroundColor: done ? colors.success : colors.muted,
                    },
                  ]}
                >
                  <Feather
                    name={done ? "check" : "plus"}
                    size={14}
                    color={done ? "#fff" : colors.mutedForeground}
                  />
                </View>
              </TouchableOpacity>
            );
          })}

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
        </ScrollView>

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
              { backgroundColor: canSubmit ? colors.primary : colors.muted },
            ]}
            onPress={handleSubmit}
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
                  Finish & Continue
                </Text>
                <Feather
                  name="check"
                  size={18}
                  color={canSubmit ? "#fff" : colors.mutedForeground}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function FloatingField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  keyboardType,
  focused,
  onFocus,
  onBlur,
  valid,
  secure,
  colors,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  valid?: boolean;
  secure?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const borderColor = focused
    ? colors.primary
    : valid
    ? "#bbf7d0"
    : colors.border;
  return (
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
            color: focused ? colors.primary : colors.mutedForeground,
            backgroundColor: colors.card,
          },
        ]}
      >
        {label}
      </Text>
      <View style={styles.floatingInner}>
        <Feather
          name={icon}
          size={17}
          color={focused ? colors.primary : colors.mutedForeground}
        />
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
          secureTextEntry={secure}
          autoCorrect={false}
          autoCapitalize="none"
          style={[styles.floatingInput, { color: colors.foreground }]}
        />
        {valid && <Feather name="check-circle" size={17} color={colors.success} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  maxSize: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  whyBtn: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
  },
  whyText: {
    color: "#9333ea",
    fontSize: 11,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginVertical: 22,
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
    letterSpacing: 0.5,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginBottom: 12,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  docTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  docSub: {
    fontSize: 12,
    fontWeight: "500",
  },
  viewLink: {
    color: "#9333ea",
    fontSize: 11,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  docAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
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

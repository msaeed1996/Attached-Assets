import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface FormState {
  zip: string;
  companyName: string;
  supervisor: string;
  companyAddress: string;
  companyPhone: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  salary: string;
  reasonForLeaving: string;
}

const EMPTY_FORM: FormState = {
  zip: "",
  companyName: "",
  supervisor: "",
  companyAddress: "",
  companyPhone: "",
  jobTitle: "",
  startDate: "",
  endDate: "",
  salary: "",
  reasonForLeaving: "",
};

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  keyboardType,
  icon,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  required?: boolean;
  keyboardType?: "default" | "numeric" | "phone-pad" | "decimal-pad";
  icon?: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
        {label}
        {required && <Text style={{ color: "#ef4444" }}> *</Text>}
      </Text>
      <View
        style={[
          styles.inputRow,
          {
            borderColor: focused ? colors.primary : colors.border,
            backgroundColor: focused ? "#f8faff" : colors.muted,
          },
        ]}
      >
        {icon && <View style={styles.inputIcon}>{icon}</View>}
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType ?? "default"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

export default function SignupAddWorkHistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function set(key: keyof FormState) {
    return (val: string) => setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleCancel() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }

  function handleSave() {
    if (!form.companyName.trim() || !form.companyPhone.trim() || !form.zip.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  const headerPad =
    Math.max(insets.top, Platform.OS === "web" ? 67 : 56) + 8;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: headerPad }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Work History</Text>
          <View style={{ width: 38 }} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FormField
          label="Zip"
          value={form.zip}
          onChangeText={set("zip")}
          placeholder="Zip (required)"
          required
          keyboardType="numeric"
          colors={colors}
        />
        <FormField
          label="Company Name"
          value={form.companyName}
          onChangeText={set("companyName")}
          placeholder="Company Name (required)"
          required
          colors={colors}
        />
        <FormField
          label="Supervisor"
          value={form.supervisor}
          onChangeText={set("supervisor")}
          placeholder="Supervisor Name"
          colors={colors}
        />
        <FormField
          label="Company Address"
          value={form.companyAddress}
          onChangeText={set("companyAddress")}
          placeholder="Company Address"
          colors={colors}
        />
        <FormField
          label="Company Phone Number"
          value={form.companyPhone}
          onChangeText={set("companyPhone")}
          placeholder="Company Phone Number (required)"
          required
          keyboardType="phone-pad"
          colors={colors}
        />
        <FormField
          label="Job Title"
          value={form.jobTitle}
          onChangeText={set("jobTitle")}
          placeholder="Job Title"
          colors={colors}
        />
        <FormField
          label="Start Date of Employment"
          value={form.startDate}
          onChangeText={set("startDate")}
          placeholder="Start Date of Employment"
          icon={<Feather name="calendar" size={16} color={colors.mutedForeground} />}
          colors={colors}
        />
        <FormField
          label="End Date of Employment"
          value={form.endDate}
          onChangeText={set("endDate")}
          placeholder="End Date of Employment"
          icon={<Feather name="calendar" size={16} color={colors.mutedForeground} />}
          colors={colors}
        />
        <FormField
          label="Salary/Hr"
          value={form.salary}
          onChangeText={set("salary")}
          placeholder="Salary($/Hr.)"
          keyboardType="decimal-pad"
          colors={colors}
        />
        <FormField
          label="Reason for Leaving"
          value={form.reasonForLeaving}
          onChangeText={set("reasonForLeaving")}
          placeholder="Reason for Leaving"
          colors={colors}
        />
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
          style={[styles.cancelBtn, { backgroundColor: colors.muted }]}
          onPress={handleCancel}
          activeOpacity={0.88}
        >
          <Feather name="x-circle" size={16} color={colors.mutedForeground} />
          <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          onPress={handleSave}
          activeOpacity={0.88}
        >
          <Feather name="upload-cloud" size={16} color={colors.mutedForeground} />
          <Text style={[styles.saveBtnText, { color: colors.mutedForeground }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0759AF",
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 4,
  },
  fieldWrapper: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    gap: 8,
  },
  inputIcon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    padding: 0,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  saveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});

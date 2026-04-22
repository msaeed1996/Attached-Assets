import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MethodKey = "debit" | "deposit" | "check";
type Method = {
  key: MethodKey;
  label: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  fieldLabel: string;
  placeholder: string;
  keyboardType: "default" | "number-pad";
  helper: string;
};

const METHODS: Method[] = [
  {
    key: "debit",
    label: "Debit Card / Pay Card",
    description: "Get paid instantly to your card",
    icon: "credit-card-outline",
    fieldLabel: "Card Number",
    placeholder: "1234 5678 9012 3456",
    keyboardType: "number-pad",
    helper: "We'll deposit your earnings to this card.",
  },
  {
    key: "deposit",
    label: "Direct Deposit",
    description: "Transfer to your bank account",
    icon: "bank-outline",
    fieldLabel: "Account & Routing Number",
    placeholder: "Account # / Routing #",
    keyboardType: "number-pad",
    helper: "Funds typically arrive in 1–2 business days.",
  },
  {
    key: "check",
    label: "Pay Check",
    description: "Receive a paper check by mail",
    icon: "email-outline",
    fieldLabel: "Mailing Address",
    placeholder: "Street, City, State, ZIP",
    keyboardType: "default",
    helper: "Checks are mailed every Friday.",
  },
];

export default function PaymentMethodScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const [selectedKey, setSelectedKey] = useState<MethodKey | null>(null);
  const [comments, setComments] = useState("");

  const selected = METHODS.find((m) => m.key === selectedKey) ?? null;

  function selectMethod(m: Method) {
    Haptics.selectionAsync();
    setSelectedKey(m.key);
    setComments("");
  }

  function save() {
    if (!selected || !comments.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (params.returnTo) {
      router.replace({ pathname: params.returnTo as any, params: { paymentAdded: "1" } });
    } else {
      router.back();
    }
  }

  function exit() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }

  const canSave = !!selected && comments.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Payment Method</Text>
          <Text style={styles.headerSubtitle}>How would you like to get paid?</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>Choose a method</Text>

        <View style={{ gap: 10 }}>
          {METHODS.map((m) => {
            const active = m.key === selectedKey;
            return (
              <Pressable
                key={m.key}
                onPress={() => selectMethod(m)}
                style={[styles.methodCard, active && styles.methodCardActive]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: active ? "#DBEAFE" : "#F3F4F6" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={m.icon}
                    size={22}
                    color={active ? "#2563EB" : "#4B5563"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.methodLabel, active && { color: "#1D4ED8" }]}>
                    {m.label}
                  </Text>
                  <Text style={styles.methodDesc}>{m.description}</Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    active && { borderColor: "#2563EB" },
                  ]}
                >
                  {active && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {selected && (
          <View style={styles.detailCard}>
            <Text style={styles.fieldLabel}>{selected.fieldLabel}</Text>
            <TextInput
              value={comments}
              onChangeText={setComments}
              placeholder={selected.placeholder}
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              keyboardType={selected.keyboardType}
              multiline={selected.key === "check"}
            />
            <View style={styles.helperRow}>
              <Feather name="info" size={13} color="#6B7280" />
              <Text style={styles.helperText}>{selected.helper}</Text>
            </View>
          </View>
        )}

        <View style={styles.secureRow}>
          <Feather name="lock" size={14} color="#10B981" />
          <Text style={styles.secureText}>Your payment info is encrypted and secure.</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity onPress={exit} activeOpacity={0.85} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={save}
          disabled={!canSave}
          activeOpacity={0.9}
          style={[
            styles.saveBtn,
            { backgroundColor: canSave ? "#2563EB" : "#93C5FD" },
          ]}
        >
          <Feather name="check" size={16} color="#fff" />
          <Text style={styles.saveText}>Save Payment Method</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  headerTitle: { color: "#fff", fontSize: 19, fontWeight: "700" },
  headerSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 },

  body: { padding: 16, gap: 18 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
  },
  methodCardActive: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  methodLabel: { fontSize: 15, fontWeight: "700", color: "#111827" },
  methodDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563EB",
  },

  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    minHeight: 46,
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
  },
  helperRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  helperText: { fontSize: 12, color: "#6B7280", flex: 1 },

  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: 4,
  },
  secureText: { fontSize: 12, color: "#10B981", fontWeight: "500" },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: "#374151", fontWeight: "600", fontSize: 14 },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

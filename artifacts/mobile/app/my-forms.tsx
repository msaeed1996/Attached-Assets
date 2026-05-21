import React, { useState } from "react";
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
import * as Haptics from "expo-haptics";
import SignaturePadModal from "@/components/SignaturePadModal";

type FormItem = {
  id: string;
  name: string;
  status: "Signature Required" | "Signed" | "Pending Review";
  version: string;
  signed: boolean;
};

const INITIAL_FORMS: FormItem[] = [
  {
    id: "1",
    name: "DUNTON ONBOARDING DOCS",
    status: "Signature Required",
    version: "2025.11",
    signed: false,
  },
  {
    id: "2",
    name: "W-4 - Employee Withholding Allowance Certificate",
    status: "Signature Required",
    version: "2025",
    signed: false,
  },
];

export default function MyFormsScreen() {
  const insets = useSafeAreaInsets();
  const [forms, setForms] = useState<FormItem[]>(INITIAL_FORMS);
  const [signingId, setSigningId] = useState<string | null>(null);

  const headerPad = Platform.OS === "web" ? insets.top + 67 : Math.max(insets.top, 12) + 4;

  function handleSign(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSigningId(id);
  }

  function handleView(form: FormItem) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function onSaveSig() {
    if (!signingId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setForms((prev) =>
      prev.map((f) =>
        f.id === signingId ? { ...f, signed: true, status: "Signed" } : f
      )
    );
    setSigningId(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPad }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Feather name="chevron-left" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Forms</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Form list */}
      <ScrollView
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {forms.map((form) => (
          <View key={form.id} style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.fieldLabel}>Name :</Text>
              <Text style={styles.fieldValue}>{form.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.fieldLabel}>Status :</Text>
              <Text
                style={[
                  styles.fieldValue,
                  form.signed && styles.signedText,
                ]}
              >
                {form.status}
              </Text>
            </View>
            <View style={[styles.infoRow, { marginBottom: 14 }]}>
              <Text style={styles.fieldLabel}>Version :</Text>
              <Text style={styles.fieldValue}>{form.version}</Text>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.viewBtn}
                onPress={() => handleView(form)}
                activeOpacity={0.8}
              >
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.signBtn,
                  form.signed && styles.signBtnDone,
                ]}
                onPress={() => !form.signed && handleSign(form.id)}
                activeOpacity={form.signed ? 1 : 0.8}
              >
                {form.signed ? (
                  <Feather name="check" size={15} color="#fff" style={{ marginRight: 5 }} />
                ) : null}
                <Text style={styles.signBtnText}>
                  {form.signed ? "Signed" : "Sign"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <SignaturePadModal
        visible={signingId !== null}
        onClose={() => setSigningId(null)}
        onSave={onSaveSig}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0759AF",
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  listContent: {
    padding: 14,
    gap: 12,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },

  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
    flexWrap: "wrap",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    width: 72,
  },
  fieldValue: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    fontWeight: "400",
  },
  signedText: {
    color: "#059669",
    fontWeight: "600",
  },

  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#0759AF",
    alignItems: "center",
    justifyContent: "center",
  },
  viewBtnText: {
    color: "#0759AF",
    fontSize: 15,
    fontWeight: "700",
  },
  signBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: "#0759AF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  signBtnDone: {
    backgroundColor: "#059669",
  },
  signBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import SignaturePadModal from "@/components/SignaturePadModal";
import { useApp } from "@/context/AppContext";

type FormItem = {
  id: string;
  name: string;
  status: "Signature Required" | "Signed" | "Pending Review";
  version: string;
  signed: boolean;
  category: string;
};

const INITIAL_FORMS: FormItem[] = [
  {
    id: "1",
    name: "DUNTON ONBOARDING DOCS",
    status: "Signature Required",
    version: "2025.11",
    signed: false,
    category: "Onboarding",
  },
  {
    id: "2",
    name: "W-4 - Employee Withholding Allowance Certificate",
    status: "Signature Required",
    version: "2025",
    signed: false,
    category: "Tax",
  },
];

const STATUS_CONFIG = {
  "Signature Required": {
    bg: "#FFF7ED",
    text: "#C2410C",
    dot: "#F97316",
    icon: "alert-circle" as const,
  },
  Signed: {
    bg: "#F0FDF4",
    text: "#15803D",
    dot: "#22C55E",
    icon: "check-circle" as const,
  },
  "Pending Review": {
    bg: "#F0F9FF",
    text: "#0369A1",
    dot: "#38BDF8",
    icon: "clock" as const,
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  Onboarding: "#6366F1",
  Tax: "#0EA5E9",
  HR: "#8B5CF6",
  Legal: "#EC4899",
};

export default function MyFormsScreen() {
  const insets = useSafeAreaInsets();
  const { setFormsSigned } = useApp();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const [forms, setForms] = useState<FormItem[]>(INITIAL_FORMS);
  const [signingId, setSigningId] = useState<string | null>(null);

  const headerPad = Platform.OS === "web" ? insets.top + 67 : Math.max(insets.top, 16) + 4;

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
    const updated = forms.map((f) =>
      f.id === signingId ? { ...f, signed: true, status: "Signed" as const } : f
    );
    setForms(updated);
    setSigningId(null);
    const anySignedNow = updated.some((f) => f.signed);
    if (anySignedNow) setFormsSigned(true);
    if (params.returnTo) {
      setTimeout(() => router.back(), 300);
    }
  }

  const signedCount = forms.filter((f) => f.signed).length;

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      {/* Header */}
      <LinearGradient
        colors={["#1D4ED8", "#2563EB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: headerPad }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle}>My Forms</Text>
          <Text style={styles.headerSub}>
            {signedCount} of {forms.length} signed
          </Text>
        </View>

        <View style={styles.backBtn} />
      </LinearGradient>

      {/* Progress strip */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(signedCount / forms.length) * 100}%` },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>PENDING SIGNATURES</Text>

        {forms.map((form, index) => {
          const statusCfg = STATUS_CONFIG[form.status];
          const catColor = CATEGORY_COLORS[form.category] ?? "#6B7280";

          return (
            <View key={form.id} style={styles.card}>
              {/* Card top accent */}
              <View style={[styles.cardAccent, { backgroundColor: catColor }]} />

              {/* Card header row */}
              <View style={styles.cardTopRow}>
                <View style={[styles.iconCircle, { backgroundColor: catColor + "18" }]}>
                  <MaterialCommunityIcons
                    name="file-document-outline"
                    size={20}
                    color={catColor}
                  />
                </View>
                <View style={[styles.catBadge, { backgroundColor: catColor + "18" }]}>
                  <Text style={[styles.catBadgeText, { color: catColor }]}>
                    {form.category}
                  </Text>
                </View>
              </View>

              {/* Form name */}
              <Text style={styles.formName}>{form.name}</Text>

              {/* Meta row */}
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Feather name="tag" size={11} color="#6B7280" />
                  <Text style={styles.metaChipText}>v{form.version}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
                  <Text style={[styles.statusText, { color: statusCfg.text }]}>
                    {form.status}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => handleView(form)}
                  activeOpacity={0.8}
                >
                  <Feather name="eye" size={15} color="#2563EB" />
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.signBtn, form.signed && styles.signBtnDone]}
                  onPress={() => !form.signed && handleSign(form.id)}
                  activeOpacity={form.signed ? 1 : 0.85}
                >
                  {form.signed ? (
                    <>
                      <Feather name="check-circle" size={15} color="#fff" />
                      <Text style={styles.signBtnText}>Signed</Text>
                    </>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="draw" size={15} color="#fff" />
                      <Text style={styles.signBtnText}>Sign Now</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {signedCount === forms.length && (
          <View style={styles.allDoneBanner}>
            <Feather name="check-circle" size={20} color="#15803D" />
            <Text style={styles.allDoneText}>All forms signed!</Text>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  headerSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 2,
  },

  progressBar: {
    height: 3,
    backgroundColor: "#E2E8F0",
  },
  progressFill: {
    height: 3,
    backgroundColor: "#22C55E",
  },

  listContent: {
    padding: 16,
    gap: 14,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1.2,
    marginBottom: 2,
    marginLeft: 2,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      web: {
        boxShadow: "0 2px 12px rgba(15,23,42,0.07)",
      } as any,
    }),
  },
  cardAccent: {
    height: 4,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    marginBottom: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  formName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    paddingHorizontal: 16,
    marginBottom: 10,
    lineHeight: 22,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 16,
    marginBottom: 14,
  },

  btnRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  viewBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  viewBtnText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
  },
  signBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2563EB",
  },
  signBtnDone: {
    backgroundColor: "#16A34A",
  },
  signBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  allDoneBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  allDoneText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#15803D",
  },
});

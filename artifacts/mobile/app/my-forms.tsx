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
  {
    id: "3",
    name: "Direct Deposit Authorization Form",
    status: "Signature Required",
    version: "2025",
    signed: false,
    category: "Payroll",
  },
  {
    id: "4",
    name: "I-9 Employment Eligibility Verification",
    status: "Pending Review",
    version: "2024.09",
    signed: false,
    category: "HR",
  },
];

const STATUS_CONFIG = {
  "Signature Required": { bg: "#FFF3E0", text: "#E65100", dot: "#F97316" },
  Signed: { bg: "#E8F5E9", text: "#2E7D32", dot: "#22C55E" },
  "Pending Review": { bg: "#E3F2FD", text: "#1565C0", dot: "#38BDF8" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Onboarding: "#6366F1",
  Tax: "#0EA5E9",
  Payroll: "#10B981",
  HR: "#8B5CF6",
  Legal: "#EC4899",
};

export default function MyFormsScreen() {
  const insets = useSafeAreaInsets();
  const { setFormsSigned } = useApp();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const [forms, setForms] = useState<FormItem[]>(INITIAL_FORMS);
  const [signingId, setSigningId] = useState<string | null>(null);

  const headerPad = Platform.OS === "web" ? insets.top + 67 : Math.max(insets.top, 14) + 2;

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
    if (updated.some((f) => f.signed)) setFormsSigned(true);
    if (params.returnTo) setTimeout(() => router.back(), 300);
  }

  const signedCount = forms.filter((f) => f.signed).length;

  return (
    <View style={{ flex: 1, backgroundColor: "#F1F5F9" }}>
      {/* Compact header */}
      <LinearGradient
        colors={["#1D4ED8", "#2563EB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: headerPad }]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle}>My Forms</Text>
        </View>
        <View style={[styles.backBtn, styles.countBadge]}>
          <Text style={styles.countText}>{signedCount}/{forms.length}</Text>
        </View>
      </LinearGradient>

      {/* Thin progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(signedCount / forms.length) * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {forms.map((form) => {
          const st = STATUS_CONFIG[form.status];
          const catColor = CATEGORY_COLORS[form.category] ?? "#6B7280";

          return (
            <View key={form.id} style={styles.card}>
              {/* Left accent bar */}
              <View style={[styles.accentBar, { backgroundColor: catColor }]} />

              <View style={styles.cardBody}>
                {/* Top row: icon + name + category pill */}
                <View style={styles.topRow}>
                  <View style={[styles.docIcon, { backgroundColor: catColor + "1A" }]}>
                    <MaterialCommunityIcons name="file-document-outline" size={15} color={catColor} />
                  </View>
                  <Text style={styles.formName} numberOfLines={1} ellipsizeMode="tail">
                    {form.name}
                  </Text>
                  <View style={[styles.catPill, { backgroundColor: catColor + "1A" }]}>
                    <Text style={[styles.catPillText, { color: catColor }]}>{form.category}</Text>
                  </View>
                </View>

                {/* Bottom row: version + status + buttons */}
                <View style={styles.bottomRow}>
                  <View style={styles.metaGroup}>
                    <View style={styles.versionChip}>
                      <Feather name="tag" size={9} color="#64748B" />
                      <Text style={styles.versionText}>v{form.version}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                      <View style={[styles.dot, { backgroundColor: st.dot }]} />
                      <Text style={[styles.statusText, { color: st.text }]}>{form.status}</Text>
                    </View>
                  </View>

                  <View style={styles.btnGroup}>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() => handleView(form)}
                      activeOpacity={0.8}
                    >
                      <Feather name="eye" size={13} color="#2563EB" />
                      <Text style={styles.viewBtnText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.signBtn, form.signed && styles.signBtnDone]}
                      onPress={() => !form.signed && handleSign(form.id)}
                      activeOpacity={form.signed ? 1 : 0.85}
                    >
                      {form.signed
                        ? <Feather name="check" size={13} color="#fff" />
                        : <MaterialCommunityIcons name="draw" size={13} color="#fff" />}
                      <Text style={styles.signBtnText}>{form.signed ? "Signed" : "Sign"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {signedCount === forms.length && (
          <View style={styles.allDone}>
            <Feather name="check-circle" size={16} color="#15803D" />
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
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  countText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  progressTrack: {
    height: 3,
    backgroundColor: "#CBD5E1",
  },
  progressFill: {
    height: 3,
    backgroundColor: "#22C55E",
  },

  list: {
    padding: 10,
    gap: 8,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      web: { boxShadow: "0 1px 6px rgba(15,23,42,0.08)" } as any,
    }),
  },
  accentBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 7,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  docIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  formName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 0.1,
  },
  catPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    flexShrink: 0,
  },
  catPillText: {
    fontSize: 10,
    fontWeight: "700",
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  metaGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    flexWrap: "wrap",
  },
  versionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  versionText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  btnGroup: {
    flexDirection: "row",
    gap: 6,
    flexShrink: 0,
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  viewBtnText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "700",
  },
  signBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  signBtnDone: {
    backgroundColor: "#16A34A",
  },
  signBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  allDone: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  allDoneText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#15803D",
  },
});

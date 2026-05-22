import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

type MethodId = "debit" | "direct" | "check";

type Method = {
  id: MethodId;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  bg: string;
  badge?: string;
};

const METHODS: Method[] = [
  {
    id: "direct",
    title: "Direct Deposit",
    subtitle: "Bank account transfer",
    description: "Get paid directly to your bank account in 1–2 business days.",
    icon: "home",
    color: "#16A34A",
    bg: "#F0FDF4",
    badge: "Recommended",
  },
  {
    id: "debit",
    title: "Debit Card / Pay Card",
    subtitle: "Instant transfer to your card",
    description: "Receive your earnings within minutes on any eligible debit or pay card.",
    icon: "credit-card",
    color: "#2563EB",
    bg: "#EFF6FF",
    badge: "Fastest",
  },
  {
    id: "check",
    title: "Pay Check",
    subtitle: "Physical check by mail",
    description: "Get a paper check delivered to your address every pay period.",
    icon: "file-text",
    color: "#EA580C",
    bg: "#FFF7ED",
  },
];

type FormState = {
  comments: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
};

const EMPTY_FORM: FormState = {
  comments: "",
  bankName: "",
  accountNumber: "",
  routingNumber: "",
};

type SavedMethod = {
  id: string;
  type: MethodId;
  form: FormState;
};

const STORAGE_KEY = "truegigs.paymentMethods.v1";


function summarize(m: SavedMethod): { title: string; subtitle: string } {
  const meta = METHODS.find((x) => x.id === m.type)!;
  if (m.type === "direct") {
    const last4 = m.form.accountNumber.slice(-4);
    return { title: meta.title, subtitle: `${m.form.bankName} • ••••${last4}` };
  }
  return {
    title: meta.title,
    subtitle: m.form.comments.trim() ? m.form.comments.trim() : meta.subtitle,
  };
}

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [selected, setSelected] = useState<MethodId | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saved, setSaved] = useState<SavedMethod[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState<boolean>(!!returnTo);

  const headerPad = Math.max(insets.top, Platform.OS === "web" ? 67 : 56) + 8;
  const set = (k: keyof FormState) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setSaved(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  async function persist(next: SavedMethod[]) {
    setSaved(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  function pick(id: MethodId) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(id);
  }

  function startAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSelected(null);
    setShowAdd(true);
  }

  function startEdit(m: SavedMethod) {
    setEditingId(m.id);
    setForm(m.form);
    setSelected(m.type);
    setShowAdd(true);
  }

  function confirmDelete(m: SavedMethod) {
    const doDelete = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      persist(saved.filter((x) => x.id !== m.id));
    };
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Remove this payment method? This cannot be undone.")) {
        doDelete();
      }
      return;
    }
    Alert.alert("Remove payment method?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: doDelete },
    ]);
  }

  function isValid(): boolean {
    if (!selected) return false;
    if (selected === "debit" || selected === "check") {
      return true; // comments field is optional
    }
    if (selected === "direct") {
      return (
        form.bankName.trim().length > 1 &&
        form.routingNumber.replace(/\D/g, "").length >= 6 &&
        form.accountNumber.replace(/\D/g, "").length >= 4
      );
    }
    return false;
  }

  async function save() {
    if (!isValid() || !selected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const next = [...saved];
    if (editingId) {
      const idx = next.findIndex((x) => x.id === editingId);
      if (idx >= 0) next[idx] = { id: editingId, type: selected, form };
    } else {
      next.push({ id: `${Date.now()}`, type: selected, form });
    }
    await persist(next);

    if (returnTo) {
      router.replace({ pathname: returnTo as any, params: { paymentAdded: "1" } });
    } else {
      setShowAdd(false);
      setEditingId(null);
      setSelected(null);
      setForm(EMPTY_FORM);
    }
  }

  const valid = isValid();
  const hasSaved = saved.length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#F3F4F6" }}
    >
      <View style={[styles.header, { paddingTop: headerPad }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110, gap: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {hasSaved && !showAdd && (
          <>
            <Text style={styles.sectionLabel}>SAVED METHODS</Text>
            {saved.map((m) => {
              const meta = METHODS.find((x) => x.id === m.type)!;
              const info = summarize(m);
              return (
                <View key={m.id} style={styles.savedCard}>
                  <View style={[styles.cardIcon, { backgroundColor: meta.bg }]}>
                    <Feather name={meta.icon as any} size={20} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{info.title}</Text>
                    <Text style={styles.cardSubtitle}>{info.subtitle}</Text>
                  </View>
                  <TouchableOpacity onPress={() => startEdit(m)} hitSlop={8} style={styles.actionBtn}>
                    <Feather name="edit-2" size={16} color="#0759AF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(m)} hitSlop={8} style={styles.actionBtn}>
                    <Feather name="trash-2" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              );
            })}
            <Pressable style={styles.addBtn} onPress={startAdd}>
              <Feather name="plus" size={18} color="#0759AF" />
              <Text style={styles.addBtnText}>Add another method</Text>
            </Pressable>
          </>
        )}

        {(showAdd || !hasSaved) && (
          <>
            <View style={styles.intro}>
              <Text style={styles.introTitle}>
                {editingId ? "Edit payment method" : "How would you like to get paid?"}
              </Text>
              <Text style={styles.introSub}>
                Choose your preferred payment method. You can change it anytime.
              </Text>
            </View>

            {METHODS.map((m) => {
              const isSel = selected === m.id;
              return (
                <View key={m.id}>
                  <Pressable
                    onPress={() => pick(m.id)}
                    style={[styles.card, isSel && { borderColor: m.color, borderWidth: 2 }]}
                  >
                    <View style={[styles.cardIcon, { backgroundColor: m.bg }]}>
                      <Feather name={m.icon as any} size={22} color={m.color} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text style={styles.cardTitle}>{m.title}</Text>
                        {m.badge && (
                          <View style={[styles.badge, { backgroundColor: m.bg }]}>
                            <Text style={[styles.badgeText, { color: m.color }]}>{m.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardSubtitle}>{m.subtitle}</Text>
                      <Text style={styles.cardDesc}>{m.description}</Text>
                    </View>

                    <View
                      style={[
                        styles.radio,
                        isSel && { borderColor: m.color, backgroundColor: m.color },
                      ]}
                    >
                      {isSel && <Feather name="check" size={12} color="#fff" />}
                    </View>
                  </Pressable>

                  {isSel && (
                    <View style={[styles.formCard, { borderColor: m.color }]}>
                      {(m.id === "debit" || m.id === "check") && (
                        <Field
                          label="Comments"
                          value={form.comments}
                          onChangeText={set("comments")}
                          placeholder="Add any notes or comments (optional)"
                          multiline
                        />
                      )}

                      {m.id === "direct" && (
                        <>
                          <Field
                            label="Bank Name"
                            value={form.bankName}
                            onChangeText={set("bankName")}
                            placeholder="e.g. Chase Bank"
                            icon="home"
                          />
                          <Field
                            label="Account #"
                            value={form.accountNumber}
                            onChangeText={(v) => set("accountNumber")(v.replace(/\D/g, "").slice(0, 17))}
                            placeholder="Account number"
                            keyboardType="number-pad"
                            secureTextEntry
                          />
                          <Field
                            label="Routing Number"
                            value={form.routingNumber}
                            onChangeText={(v) => set("routingNumber")(v.replace(/\D/g, "").slice(0, 9))}
                            placeholder="9-digit routing number"
                            keyboardType="number-pad"
                            maxLength={9}
                          />
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {hasSaved && !returnTo && (
              <Pressable
                style={styles.cancelBtn}
                onPress={() => {
                  setShowAdd(false);
                  setEditingId(null);
                  setSelected(null);
                  setForm(EMPTY_FORM);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            )}

            <View style={styles.secureNote}>
              <Feather name="shield" size={14} color="#16A34A" />
              <Text style={styles.secureText}>
                Your payment details are encrypted and stored securely.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {(showAdd || !hasSaved) && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={[styles.continueBtn, !valid && styles.continueBtnDisabled]}
            onPress={save}
            disabled={!valid}
          >
            <Text style={styles.continueText}>
              {editingId ? "Update Payment Method" : selected ? "Save Payment Method" : "Select a Method"}
            </Text>
            {valid && <Feather name="check" size={16} color="#fff" />}
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  secureTextEntry,
  autoCapitalize,
  icon,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "number-pad" | "email-address";
  maxLength?: number;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "characters" | "words" | "sentences";
  icon?: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, multiline && { alignItems: "flex-start", minHeight: 80 }]}>
        {icon && <Feather name={icon as any} size={16} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize ?? "sentences"}
          style={[styles.input, multiline && { textAlignVertical: "top", paddingTop: 8 }]}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      </View>
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
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  intro: { marginBottom: 4 },
  introTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  introSub: { fontSize: 13, color: "#6B7280", marginTop: 4, lineHeight: 18 },

  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, marginTop: 4 },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  savedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#0759AF",
    marginTop: 4,
  },
  addBtnText: { color: "#0759AF", fontWeight: "700", fontSize: 14 },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: "#6B7280", fontWeight: "600", fontSize: 14 },

  cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  cardSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  cardDesc: { fontSize: 12, color: "#374151", marginTop: 6, lineHeight: 17 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 4,
  },
  input: { flex: 1, fontSize: 14, color: "#111827", paddingVertical: Platform.OS === "ios" ? 0 : 8 },

  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  secureText: { fontSize: 12, color: "#166534", flex: 1, lineHeight: 17 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#0759AF",
  },
  continueBtnDisabled: { backgroundColor: "#9CA3AF" },
  continueText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

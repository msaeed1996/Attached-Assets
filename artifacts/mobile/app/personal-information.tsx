import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";

type Section = "personal" | "contacts" | "address" | "social" | "emergency";
type Fields = Record<string, string>;

type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  icon?: string;
  keyboard?: "default" | "email-address" | "number-pad" | "phone-pad";
  autoCap?: "none" | "words" | "sentences";
  half?: boolean; // render half-width in edit modal
};

const SECTIONS: {
  id: Section;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bg: string;
  fields: FieldDef[];
}[] = [
  {
    id: "personal",
    title: "Personal Details",
    subtitle: "Your basic identification info",
    icon: "user",
    color: "#2563EB",
    bg: "#EFF6FF",
    fields: [
      { key: "firstName", label: "First Name", icon: "user", half: true, autoCap: "words" },
      { key: "mi", label: "Middle Initial", icon: "type", half: true, autoCap: "words" },
      { key: "lastName", label: "Last Name", icon: "user", autoCap: "words" },
      { key: "dob", label: "Date of Birth", icon: "calendar", placeholder: "MM/DD/YYYY" },
      { key: "email", label: "Email", icon: "mail", keyboard: "email-address", autoCap: "none" },
    ],
  },
  {
    id: "contacts",
    title: "My Contacts",
    subtitle: "How we reach you",
    icon: "phone",
    color: "#7C3AED",
    bg: "#F3E8FF",
    fields: [
      { key: "cell", label: "Cell Phone", icon: "smartphone", keyboard: "phone-pad" },
      { key: "ssn", label: "SSN", icon: "lock", keyboard: "number-pad" },
      { key: "tel", label: "Telephone", icon: "phone", keyboard: "phone-pad", half: true },
      { key: "ext", label: "Extension", icon: "hash", keyboard: "number-pad", half: true },
    ],
  },
  {
    id: "address",
    title: "Physical Address",
    subtitle: "Where you live",
    icon: "map-pin",
    color: "#16A34A",
    bg: "#F0FDF4",
    fields: [
      { key: "address", label: "Street Address", icon: "home", autoCap: "words" },
      { key: "apart", label: "Apt / Suite", icon: "hash", half: true },
      { key: "zip", label: "Zip Code", icon: "map", keyboard: "number-pad", half: true },
      { key: "city", label: "City", icon: "map-pin", half: true, autoCap: "words" },
      { key: "state", label: "State", icon: "flag", half: true, autoCap: "words" },
    ],
  },
  {
    id: "social",
    title: "Social Links",
    subtitle: "Connect your social accounts",
    icon: "share-2",
    color: "#0EA5E9",
    bg: "#E0F2FE",
    fields: [
      { key: "facebook", label: "Facebook", icon: "facebook", autoCap: "none" },
      { key: "linkedin", label: "LinkedIn", icon: "linkedin", autoCap: "none" },
      { key: "teams", label: "Microsoft Teams", icon: "users", autoCap: "none" },
    ],
  },
  {
    id: "emergency",
    title: "Emergency Contacts",
    subtitle: "Who to contact in an emergency",
    icon: "alert-circle",
    color: "#EA580C",
    bg: "#FFF7ED",
    fields: [
      { key: "name", label: "Contact Name", icon: "user", autoCap: "words" },
      { key: "relation", label: "Relationship", icon: "heart", autoCap: "words" },
      { key: "phone", label: "Phone Number", icon: "phone", keyboard: "phone-pad" },
    ],
  },
];

function emptyData(): Record<Section, Fields> {
  const out: any = {};
  SECTIONS.forEach((s) => {
    out[s.id] = {};
    s.fields.forEach((f) => (out[s.id][f.key] = ""));
  });
  return out;
}

export default function PersonalInformationScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, setUserProfile } = useApp();

  const seeded = useMemo<Record<Section, Fields>>(() => {
    const base = emptyData();
    const [first = "", ...rest] = (userProfile?.name || "").split(" ");
    base.personal.firstName = first;
    base.personal.lastName = rest.join(" ");
    base.personal.email = userProfile?.email || "";
    return base;
  }, []);

  const [data, setData] = useState<Record<Section, Fields>>(seeded);
  const [editing, setEditing] = useState<Section | null>(null);

  // Completion stats
  const stats = useMemo(() => {
    let total = 0;
    let filled = 0;
    SECTIONS.forEach((s) => {
      s.fields.forEach((f) => {
        total++;
        if ((data[s.id][f.key] || "").trim()) filled++;
      });
    });
    return { total, filled, percent: total ? Math.round((filled / total) * 100) : 0 };
  }, [data]);

  function sectionStats(sec: Section) {
    const def = SECTIONS.find((s) => s.id === sec)!;
    let f = 0;
    def.fields.forEach((fd) => {
      if ((data[sec][fd.key] || "").trim()) f++;
    });
    return { filled: f, total: def.fields.length };
  }

  function saveSection(section: Section, values: Fields) {
    setData((d) => ({ ...d, [section]: values }));
    if (section === "personal" && userProfile) {
      const fullName = [values.firstName, values.mi, values.lastName]
        .filter((s) => s && s.trim())
        .join(" ");
      setUserProfile({
        ...userProfile,
        name: fullName || userProfile.name,
        email: values.email || userProfile.email,
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(null);
  }

  const initial = (userProfile?.name || "U").trim().charAt(0).toUpperCase();
  const headerPad = Platform.OS === "web" ? insets.top + 67 : insets.top + 10;

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPad }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Information</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Identity card */}
        <View style={styles.idCard}>
          <View style={styles.idAvatar}>
            {userProfile?.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={{ width: "100%", height: "100%", borderRadius: 999 }} />
            ) : (
              <Text style={styles.idAvatarText}>{initial}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.idName} numberOfLines={1}>
              {userProfile?.name || "Your Profile"}
            </Text>
            <Text style={styles.idEmail} numberOfLines={1}>
              {userProfile?.email || "Add your email"}
            </Text>
            {/* progress */}
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${stats.percent}%` }]} />
              </View>
              <Text style={styles.progressText}>{stats.percent}%</Text>
            </View>
            <Text style={styles.progressSub}>
              {stats.filled} of {stats.total} fields complete
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 30, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((sec, idx) => {
          const ss = sectionStats(sec.id);
          const complete = ss.filled === ss.total;
          return (
            <View key={sec.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: sec.bg }]}>
                  <Feather name={sec.icon as any} size={18} color={sec.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{sec.title}</Text>
                  <Text style={styles.cardSubtitle}>{sec.subtitle}</Text>
                </View>
                <View style={styles.cardActions}>
                  {complete ? (
                    <View style={styles.completeBadge}>
                      <Feather name="check" size={11} color="#fff" />
                    </View>
                  ) : (
                    <Text style={styles.cardCount}>
                      {ss.filled}/{ss.total}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[styles.editBtn, { borderColor: sec.color }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setEditing(sec.id);
                    }}
                    hitSlop={8}
                  >
                    <Feather name="edit-2" size={13} color={sec.color} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={{ gap: 2 }}>
                {sec.fields.map((f) => {
                  const v = (data[sec.id][f.key] || "").trim();
                  return (
                    <View key={f.key} style={styles.fieldRow}>
                      <Feather
                        name={(f.icon || "circle") as any}
                        size={14}
                        color="#9CA3AF"
                        style={{ width: 20 }}
                      />
                      <Text style={styles.fieldLabel}>{f.label}</Text>
                      <Text
                        style={[styles.fieldValue, !v && styles.fieldValueEmpty]}
                        numberOfLines={1}
                      >
                        {v || "Not set"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <EditModal
        visible={!!editing}
        section={editing}
        values={editing ? data[editing] : null}
        onClose={() => setEditing(null)}
        onSave={(v) => editing && saveSection(editing, v)}
      />
    </View>
  );
}

function EditModal({
  visible,
  section,
  values,
  onClose,
  onSave,
}: {
  visible: boolean;
  section: Section | null;
  values: Fields | null;
  onClose: () => void;
  onSave: (v: Fields) => void;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Fields>({});

  React.useEffect(() => {
    if (values) setDraft({ ...values });
  }, [values, visible]);

  if (!section || !values) return null;
  const def = SECTIONS.find((s) => s.id === section)!;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      >
        <View style={[styles.editHeader, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.iconBtn}>
            <Feather name="x" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.headerTitle}>{def.title}</Text>
            <Text style={styles.editHeaderSub}>{def.subtitle}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formGrid}>
            {def.fields.map((f) => (
              <View key={f.key} style={[styles.formField, f.half && styles.formFieldHalf]}>
                <Text style={styles.formLabel}>{f.label}</Text>
                <View style={styles.inputWrap}>
                  {f.icon && (
                    <Feather
                      name={f.icon as any}
                      size={16}
                      color="#9CA3AF"
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <TextInput
                    style={styles.input}
                    value={draft[f.key] ?? ""}
                    onChangeText={(t) => setDraft((d) => ({ ...d, [f.key]: t }))}
                    placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}`}
                    placeholderTextColor="#9CA3AF"
                    keyboardType={f.keyboard || "default"}
                    autoCapitalize={f.autoCap || "sentences"}
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.saveBtn} onPress={() => onSave(draft)}>
            <Feather name="check" size={16} color="#fff" />
            <Text style={styles.saveText}>Save Changes</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0759AF",
    paddingHorizontal: 14,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  idCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  idAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  idAvatarText: { fontSize: 22, fontWeight: "800", color: "#0759AF" },
  idName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  idEmail: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#10B981", borderRadius: 3 },
  progressText: { color: "#fff", fontSize: 12, fontWeight: "700", minWidth: 32, textAlign: "right" },
  progressSub: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 4 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  cardSubtitle: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
  completeBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 12 },

  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#6B7280",
    width: 105,
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    textAlign: "right",
  },
  fieldValueEmpty: { color: "#D1D5DB", fontWeight: "400", fontStyle: "italic" },

  // Edit modal
  editHeader: {
    backgroundColor: "#0759AF",
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editHeaderSub: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 },

  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  formField: {
    width: "100%",
  },
  formFieldHalf: {
    width: "48%",
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: Platform.OS === "ios" ? 0 : 8,
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelBtn: {
    paddingHorizontal: 22,
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
    backgroundColor: "#0759AF",
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

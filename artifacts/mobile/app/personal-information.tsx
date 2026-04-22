import React, { useState } from "react";
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
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";

type Section =
  | "personal"
  | "contacts"
  | "address"
  | "social"
  | "emergency";

type Fields = Record<string, string>;

const INITIAL: Record<Section, Fields> = {
  personal: {
    firstName: "",
    mi: "",
    lastName: "",
    dob: "",
    email: "",
  },
  contacts: {
    cell: "",
    ssn: "",
    tel: "",
    ext: "",
  },
  address: {
    address: "",
    apart: "",
    zip: "",
    city: "",
    state: "",
  },
  social: {
    facebook: "",
    linkedin: "",
    teams: "",
  },
  emergency: {
    name: "",
    relation: "",
    phone: "",
  },
};

const FIELD_LABELS: Record<string, string> = {
  firstName: "First Name",
  mi: "MI",
  lastName: "Last Name",
  dob: "DOB",
  email: "Email",
  cell: "Cell",
  ssn: "SSN",
  tel: "Tel",
  ext: "Ext",
  address: "Address",
  apart: "Apart/Suite",
  zip: "Zip",
  city: "City",
  state: "State",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  teams: "Teams",
  name: "Name",
  relation: "Relation",
  phone: "Phone",
};

const SECTION_TITLES: Record<Section, string> = {
  personal: "Personal Details",
  contacts: "My Contacts",
  address: "Physical Addresses",
  social: "Social Links",
  emergency: "Emergency Contacts",
};

export default function PersonalInformationScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, setUserProfile } = useApp();

  // Seed personal section with profile name/email
  const seeded: Record<Section, Fields> = React.useMemo(() => {
    const [first = "", ...rest] = (userProfile?.name || "").split(" ");
    return {
      ...INITIAL,
      personal: {
        ...INITIAL.personal,
        firstName: first,
        lastName: rest.join(" "),
        email: userProfile?.email || "",
      },
    };
  }, []);

  const [data, setData] = useState<Record<Section, Fields>>(seeded);
  const [editing, setEditing] = useState<Section | null>(null);

  function saveSection(section: Section, values: Fields) {
    setData((d) => ({ ...d, [section]: values }));
    if (section === "personal" && userProfile) {
      const fullName = [values.firstName, values.mi, values.lastName]
        .filter((s) => s && s.trim() && s.trim().toUpperCase() !== "NA")
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

  return (
    <View style={{ flex: 1, backgroundColor: "#F1F5F9" }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 30, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {(Object.keys(SECTION_TITLES) as Section[]).map((sec) => (
          <SectionCard
            key={sec}
            title={SECTION_TITLES[sec]}
            values={data[sec]}
            onEdit={() => setEditing(sec)}
          />
        ))}
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

function SectionCard({
  title,
  values,
  onEdit,
}: {
  title: string;
  values: Fields;
  onEdit: () => void;
}) {
  const keys = Object.keys(values);
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit} hitSlop={10}>
          <Feather name="edit-3" size={16} color="#374151" />
        </TouchableOpacity>
        {keys.map((k) => (
          <View key={k} style={styles.row}>
            <Text style={styles.rowLabel}>{FIELD_LABELS[k] ?? k}:</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {values[k]?.trim() ? values[k] : ""}
            </Text>
          </View>
        ))}
      </View>
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
  const [draft, setDraft] = useState<Fields>({});

  React.useEffect(() => {
    if (values) setDraft({ ...values });
  }, [values, visible]);

  if (!section || !values) return null;
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.backBtn}>
            <Feather name="x" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit {SECTION_TITLES[section]}</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          {Object.keys(values).map((k) => (
            <View key={k}>
              <Text style={styles.fieldLabel}>{FIELD_LABELS[k] ?? k}</Text>
              <TextInput
                style={styles.input}
                value={draft[k] ?? ""}
                onChangeText={(t) => setDraft((d) => ({ ...d, [k]: t }))}
                placeholder={`Enter ${FIELD_LABELS[k] ?? k}`}
                placeholderTextColor="#9CA3AF"
                keyboardType={
                  k === "email"
                    ? "email-address"
                    : ["cell", "tel", "phone", "zip", "ssn", "ext"].includes(k)
                    ? "number-pad"
                    : "default"
                }
                autoCapitalize={k === "email" ? "none" : "words"}
              />
            </View>
          ))}
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
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  sectionTitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: "relative",
  },
  editBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  rowLabel: {
    width: 110,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  rowValue: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
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
    backgroundColor: "#2563EB",
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

interface Skill {
  id: string;
  industry: string;
  name: string;
  years: number;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issuedYear: number;
  expiresYear?: number;
  verified: boolean;
}

const INDUSTRIES = [
  { value: "hotel", label: "Hotel / Restaurant", skills: ["Bartender - Tipped", "Server", "Line Cook", "Host", "Banquet"] },
  { value: "retail", label: "Retail", skills: ["Cashier", "Stock Associate", "Sales Associate", "Visual Merchandiser"] },
  { value: "events", label: "Events & Catering", skills: ["Setup Crew", "Catering Server", "Bartender", "Event Host"] },
  { value: "warehouse", label: "Warehouse / Logistics", skills: ["Forklift Operator", "Picker / Packer", "Loader", "Inventory Clerk"] },
];

const YEARS = [
  { value: 1, label: "1 Year" },
  { value: 2, label: "2 Years" },
  { value: 3, label: "3 Years" },
  { value: 5, label: "5+ Years" },
];

const INITIAL_SKILLS: Skill[] = [
  { id: "s1", industry: "Warehouse / Logistics", name: "Forklift Operator", years: 3 },
  { id: "s2", industry: "Retail", name: "Cashier", years: 2 },
  { id: "s3", industry: "Hotel / Restaurant", name: "Server", years: 1 },
];

const INITIAL_CERTS: Certification[] = [
  { id: "c1", name: "OSHA 10 - General Industry", issuer: "OSHA", issuedYear: 2024, expiresYear: 2029, verified: true },
  { id: "c2", name: "Food Handler Certificate", issuer: "ServSafe", issuedYear: 2025, expiresYear: 2028, verified: true },
  { id: "c3", name: "TIPS Alcohol Certification", issuer: "TIPS", issuedYear: 2025, expiresYear: 2028, verified: false },
];

export default function SkillsCertificationsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? insets.top + 8 : insets.top;

  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS);
  const [certs, setCerts] = useState<Certification[]>(INITIAL_CERTS);

  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [industry, setIndustry] = useState(INDUSTRIES[0].value);
  const [skillName, setSkillName] = useState(INDUSTRIES[0].skills[0]);
  const [years, setYears] = useState(3);
  const [pickerOpen, setPickerOpen] = useState<null | "industry" | "skill" | "years">(null);

  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certYear, setCertYear] = useState(`${new Date().getFullYear()}`);

  const currentIndustry = INDUSTRIES.find((i) => i.value === industry) ?? INDUSTRIES[0];

  function openAddSkill() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIndustry(INDUSTRIES[0].value);
    setSkillName(INDUSTRIES[0].skills[0]);
    setYears(3);
    setSkillModalOpen(true);
  }

  function saveSkill() {
    setSkills((prev) => [
      ...prev,
      { id: `${Date.now()}`, industry: currentIndustry.label, name: skillName, years },
    ]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSkillModalOpen(false);
  }

  function removeSkill(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSkills((prev) => prev.filter((s) => s.id !== id));
  }

  function openAddCert() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCertName("");
    setCertIssuer("");
    setCertYear(`${new Date().getFullYear()}`);
    setCertModalOpen(true);
  }

  function saveCert() {
    if (!certName.trim() || !certIssuer.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    const yr = Number(certYear) || new Date().getFullYear();
    setCerts((prev) => [
      ...prev,
      { id: `${Date.now()}`, name: certName.trim(), issuer: certIssuer.trim(), issuedYear: yr, verified: false },
    ]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCertModalOpen(false);
  }

  function removeCert(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCerts((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Skills & Certifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Skills Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>My Skills</Text>
              <Text style={styles.sectionSub}>{skills.length} added · more skills = more work</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={openAddSkill} activeOpacity={0.8}>
              <Feather name="plus" size={14} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {skills.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="tool" size={22} color="#9ca3af" />
              <Text style={styles.emptyText}>No skills yet. Add one to get matched with jobs.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {skills.map((s, i) => (
                <View key={s.id} style={[styles.row, i !== skills.length - 1 && styles.rowBorder]}>
                  <View style={[styles.iconBubble, { backgroundColor: "#ede9fe" }]}>
                    <Feather name="tool" size={15} color="#7c3aed" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{s.name}</Text>
                    <Text style={styles.rowSub}>
                      {s.industry} · {s.years === 5 ? "5+ years" : s.years === 1 ? "1 year" : `${s.years} years`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeSkill(s.id)} style={styles.deleteBtn} activeOpacity={0.7}>
                    <Feather name="x" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Certifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Certifications</Text>
              <Text style={styles.sectionSub}>{certs.length} on file</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={openAddCert} activeOpacity={0.8}>
              <Feather name="plus" size={14} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {certs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="award" size={22} color="#9ca3af" />
              <Text style={styles.emptyText}>No certifications yet. Add one to stand out.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {certs.map((c, i) => (
                <View key={c.id} style={[styles.row, i !== certs.length - 1 && styles.rowBorder]}>
                  <View style={[styles.iconBubble, { backgroundColor: "#fef3c7" }]}>
                    <Feather name="award" size={15} color="#d97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{c.name}</Text>
                      {c.verified && (
                        <View style={styles.verifiedPill}>
                          <Feather name="check" size={9} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.rowSub}>
                      {c.issuer} · {c.issuedYear}
                      {c.expiresYear ? ` – ${c.expiresYear}` : ""}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeCert(c.id)} style={styles.deleteBtn} activeOpacity={0.7}>
                    <Feather name="x" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.footnote}>
          Verified certifications are confirmed by TrueGigs and shown to employers with a check badge.
        </Text>
      </ScrollView>

      {/* Add Skill Modal */}
      <Modal visible={skillModalOpen} animationType="slide" transparent onRequestClose={() => setSkillModalOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSkillModalOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add a Skill</Text>

            <Text style={styles.label}>Industry</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => setPickerOpen(pickerOpen === "industry" ? null : "industry")}
              activeOpacity={0.75}
            >
              <Text style={styles.selectText}>{currentIndustry.label}</Text>
              <Feather name={pickerOpen === "industry" ? "chevron-up" : "chevron-down"} size={16} color="#6b7280" />
            </TouchableOpacity>
            {pickerOpen === "industry" && (
              <View style={styles.pickerList}>
                {INDUSTRIES.map((i) => (
                  <TouchableOpacity
                    key={i.value}
                    style={styles.pickerItem}
                    onPress={() => {
                      setIndustry(i.value);
                      setSkillName(i.skills[0]);
                      setPickerOpen(null);
                    }}
                  >
                    <Text style={styles.pickerText}>{i.label}</Text>
                    {industry === i.value && <Feather name="check" size={14} color="#2563eb" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Skill</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => setPickerOpen(pickerOpen === "skill" ? null : "skill")}
              activeOpacity={0.75}
            >
              <Text style={styles.selectText}>{skillName}</Text>
              <Feather name={pickerOpen === "skill" ? "chevron-up" : "chevron-down"} size={16} color="#6b7280" />
            </TouchableOpacity>
            {pickerOpen === "skill" && (
              <View style={styles.pickerList}>
                {currentIndustry.skills.map((sk) => (
                  <TouchableOpacity
                    key={sk}
                    style={styles.pickerItem}
                    onPress={() => {
                      setSkillName(sk);
                      setPickerOpen(null);
                    }}
                  >
                    <Text style={styles.pickerText}>{sk}</Text>
                    {skillName === sk && <Feather name="check" size={14} color="#2563eb" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Experience</Text>
            <View style={styles.yearsRow}>
              {YEARS.map((y) => (
                <TouchableOpacity
                  key={y.value}
                  style={[styles.yearChip, years === y.value && styles.yearChipActive]}
                  onPress={() => setYears(y.value)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.yearChipText, years === y.value && styles.yearChipTextActive]}>{y.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={saveSkill} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Add Skill</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Certification Modal */}
      <Modal visible={certModalOpen} animationType="slide" transparent onRequestClose={() => setCertModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.backdrop} onPress={() => setCertModalOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Add a Certification</Text>

              <Text style={styles.label}>Certification Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. OSHA 10 - General Industry"
                placeholderTextColor="#9ca3af"
                value={certName}
                onChangeText={setCertName}
              />

              <Text style={styles.label}>Issuing Organization</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. ServSafe"
                placeholderTextColor="#9ca3af"
                value={certIssuer}
                onChangeText={setCertIssuer}
              />

              <Text style={styles.label}>Year Issued</Text>
              <TextInput
                style={styles.input}
                placeholder="2025"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                maxLength={4}
                value={certYear}
                onChangeText={setCertYear}
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={saveCert} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Add Certification</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0759af",
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { width: 36, height: 36, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.2 },

  section: { paddingHorizontal: 16, paddingTop: 18 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111827", letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  list: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  iconBubble: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#111827", flexShrink: 1 },
  rowSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  verifiedPill: {
    backgroundColor: "#10b981",
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#fef2f2" },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { fontSize: 13, color: "#6b7280", textAlign: "center", paddingHorizontal: 24 },

  footnote: { fontSize: 11, color: "#9ca3af", textAlign: "center", paddingHorizontal: 32, marginTop: 18, lineHeight: 16 },

  // Modal
  backdrop: { flex: 1, backgroundColor: "rgba(17, 24, 39, 0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  sheetHandle: { alignSelf: "center", width: 38, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: "#111827", marginBottom: 14 },
  label: { fontSize: 11, fontWeight: "800", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 12, marginBottom: 6 },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectText: { fontSize: 14, color: "#111827", fontWeight: "600" },
  pickerList: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  pickerText: { fontSize: 14, color: "#111827" },

  yearsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  yearChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  yearChipText: { fontSize: 13, color: "#374151", fontWeight: "600" },
  yearChipTextActive: { color: "#fff" },

  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },

  primaryBtn: {
    marginTop: 22,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
});

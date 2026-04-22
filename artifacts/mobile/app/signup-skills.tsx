import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { SignupHeader } from "@/components/SignupHeader";
import { useApp } from "@/context/AppContext";

interface Skill {
  id: string;
  industry: string;
  name: string;
  years: number;
}

const INDUSTRIES = [
  { value: "hotel", label: "Hotel / Restaurant", skills: ["Bartender - Tipped", "Server", "Line Cook", "Host", "Banquet"] },
  { value: "retail", label: "Retail", skills: ["Cashier", "Stock Associate", "Sales Associate", "Visual Merchandiser"] },
  { value: "events", label: "Events & Catering", skills: ["Setup Crew", "Catering Server", "Bartender", "Event Host"] },
  { value: "warehouse", label: "Warehouse / Logistics", skills: ["Forklift Operator", "Picker / Packer", "Loader", "Inventory Clerk"] },
];

const YEARS = [
  { value: 1, label: "One Year" },
  { value: 2, label: "Two Years" },
  { value: 3, label: "Three Years" },
  { value: 5, label: "5+ Years" },
];

export default function SignupSkillsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, setUserProfile } = useApp();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [industry, setIndustry] = useState(INDUSTRIES[0].value);
  const [skillName, setSkillName] = useState(INDUSTRIES[0].skills[0]);
  const [years, setYears] = useState(3);
  const [pickerOpen, setPickerOpen] = useState<null | "industry" | "skill" | "years">(null);

  const currentIndustry = INDUSTRIES.find((i) => i.value === industry) ?? INDUSTRIES[0];

  function openAddSkill() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIndustry(INDUSTRIES[0].value);
    setSkillName(INDUSTRIES[0].skills[0]);
    setYears(3);
    setModalOpen(true);
  }

  function saveSkill() {
    const newSkill: Skill = {
      id: `${Date.now()}`,
      industry: currentIndustry.label,
      name: skillName,
      years,
    };
    setSkills((prev) => [...prev, newSkill]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalOpen(false);
  }

  function removeSkill(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSkills((prev) => prev.filter((s) => s.id !== id));
  }

  function handleContinue() {
    if (skills.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        skills: skills.map((s) => s.name),
      });
    }
    router.push("/signup-identification");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SignupHeader
        title="Skills & Experience"
        subtitle="The more skills you add, the more work you'll find."
        step={2}
        totalSteps={3}
        rightSlot={
          <TouchableOpacity
            onPress={openAddSkill}
            style={styles.addBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={[styles.headingTitle, { color: colors.foreground }]}>
            What jobs are you interested in?
          </Text>
          <Text style={[styles.headingSub, { color: colors.mutedForeground }]}>
            Add at least one skill so we can match you with the right gigs.
          </Text>
        </View>

        {skills.length === 0 && (
          <View
            style={[
              styles.warning,
              { backgroundColor: "#fffbeb", borderColor: "#fde68a" },
            ]}
          >
            <Feather name="alert-triangle" size={18} color={colors.warning} />
            <Text style={[styles.warningText, { color: "#92400e" }]}>
              At least one skill is required.
            </Text>
          </View>
        )}

        {skills.map((skill) => (
          <View
            key={skill.id}
            style={[
              styles.skillCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                ...(Platform.OS === "ios"
                  ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }
                  : { elevation: 2 }),
              },
            ]}
          >
            <View style={[styles.skillIcon, { backgroundColor: "#dbeafe" }]}>
              <Feather name="award" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.skillName, { color: colors.foreground }]}>{skill.name}</Text>
              <Text style={[styles.skillMeta, { color: colors.mutedForeground }]}>
                {skill.industry} · {skill.years === 5 ? "5+ years" : `${skill.years} ${skill.years === 1 ? "year" : "years"}`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => removeSkill(skill.id)}
              style={[styles.removeBtn, { backgroundColor: "#fee2e2" }]}
              hitSlop={6}
            >
              <Feather name="trash-2" size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          onPress={openAddSkill}
          style={[
            styles.addAnother,
            { borderColor: colors.primary, backgroundColor: "#eff6ff" },
          ]}
          activeOpacity={0.85}
        >
          <View style={[styles.addAnotherIcon, { backgroundColor: colors.primary }]}>
            <Feather name="plus" size={18} color="#fff" />
          </View>
          <Text style={[styles.addAnotherText, { color: colors.primary }]}>
            {skills.length === 0 ? "Add your first skill" : "Add another skill"}
          </Text>
        </TouchableOpacity>
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
            { backgroundColor: skills.length > 0 ? colors.primary : colors.muted },
          ]}
          onPress={handleContinue}
          activeOpacity={0.88}
          disabled={skills.length === 0}
        >
          <Text
            style={[
              styles.submitText,
              { color: skills.length > 0 ? "#fff" : colors.mutedForeground },
            ]}
          >
            Continue
          </Text>
          <Feather
            name="arrow-right"
            size={18}
            color={skills.length > 0 ? "#fff" : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      {/* Add Skill Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setModalOpen(false)}>
            <Pressable
              style={[
                styles.modalSheet,
                { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add new skill</Text>
                <TouchableOpacity
                  onPress={() => setModalOpen(false)}
                  style={[styles.modalCloseBtn, { backgroundColor: colors.muted }]}
                  hitSlop={8}
                >
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <SelectField
                  label="Industry"
                  value={currentIndustry.label}
                  onPress={() => setPickerOpen(pickerOpen === "industry" ? null : "industry")}
                  open={pickerOpen === "industry"}
                  colors={colors}
                />
                {pickerOpen === "industry" && (
                  <View style={[styles.optionsList, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    {INDUSTRIES.map((opt) => {
                      const sel = opt.value === industry;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.optionRow, sel && { backgroundColor: "#eff6ff" }]}
                          onPress={() => {
                            setIndustry(opt.value);
                            setSkillName(opt.skills[0]);
                            setPickerOpen(null);
                            Haptics.selectionAsync();
                          }}
                        >
                          <Text style={[styles.optionText, { color: colors.foreground, fontWeight: sel ? "700" : "500" }]}>
                            {opt.label}
                          </Text>
                          {sel && <Feather name="check" size={16} color={colors.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <View style={{ height: 14 }} />
                <SelectField
                  label="Specific Skill"
                  value={skillName}
                  onPress={() => setPickerOpen(pickerOpen === "skill" ? null : "skill")}
                  open={pickerOpen === "skill"}
                  colors={colors}
                />
                {pickerOpen === "skill" && (
                  <View style={[styles.optionsList, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    {currentIndustry.skills.map((s) => {
                      const sel = s === skillName;
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[styles.optionRow, sel && { backgroundColor: "#eff6ff" }]}
                          onPress={() => {
                            setSkillName(s);
                            setPickerOpen(null);
                            Haptics.selectionAsync();
                          }}
                        >
                          <Text style={[styles.optionText, { color: colors.foreground, fontWeight: sel ? "700" : "500" }]}>
                            {s}
                          </Text>
                          {sel && <Feather name="check" size={16} color={colors.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <View style={{ height: 14 }} />
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Years of experience</Text>
                <View style={styles.yearsRow}>
                  {YEARS.map((y) => {
                    const sel = years === y.value;
                    return (
                      <TouchableOpacity
                        key={y.value}
                        style={[
                          styles.yearChip,
                          {
                            borderColor: sel ? colors.primary : colors.border,
                            backgroundColor: sel ? "#eff6ff" : colors.card,
                          },
                        ]}
                        onPress={() => {
                          setYears(y.value);
                          Haptics.selectionAsync();
                        }}
                      >
                        <Text
                          style={[
                            styles.yearChipText,
                            { color: sel ? colors.primary : colors.foreground, fontWeight: sel ? "800" : "600" },
                          ]}
                        >
                          {y.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { backgroundColor: colors.muted }]}
                  onPress={() => setModalOpen(false)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={saveSkill}
                  activeOpacity={0.85}
                >
                  <Feather name="check" size={16} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Skill</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function SelectField({
  label,
  value,
  onPress,
  open,
  colors,
}: {
  label: string;
  value: string;
  onPress: () => void;
  open: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.selectBtn,
          {
            borderColor: open ? colors.primary : colors.border,
            backgroundColor: open ? colors.card : colors.muted,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={[styles.selectText, { color: colors.foreground }]}>{value}</Text>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heading: {
    marginBottom: 16,
  },
  headingTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headingSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  skillCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  skillIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  skillName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  skillMeta: {
    fontSize: 12,
    fontWeight: "500",
  },
  removeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  addAnother: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: 4,
  },
  addAnotherIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addAnotherText: {
    fontSize: 14,
    fontWeight: "700",
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#cbd5e1",
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    padding: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
    marginLeft: 4,
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: 14,
  },
  selectText: {
    fontSize: 15,
    fontWeight: "600",
  },
  optionsList: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 14,
  },
  yearsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  yearChipText: {
    fontSize: 13,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});

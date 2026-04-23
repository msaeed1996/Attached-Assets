import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useJobs } from "@/context/JobsContext";
import { useApp } from "@/context/AppContext";
import * as Haptics from "expo-haptics";

const STEPS = ["Basics", "Details", "Pay", "Review"];
const CATEGORIES = ["Warehouse", "Hospitality", "Admin", "Retail", "Cleaning", "Construction", "Other"];
const JOB_TYPES = ["full-day", "part-time", "weekend", "evening", "contract"];
const PAY_TYPES = ["hourly", "daily", "fixed"];
const URGENCY_OPTIONS = ["urgent", "normal", "flexible"];

interface JobFormData {
  title: string;
  category: string;
  type: string;
  location: string;
  startDate: string;
  duration: string;
  description: string;
  requirements: string;
  pay: string;
  payType: string;
  urgency: string;
}

export default function PostJobScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { postJob } = useJobs();
  const { userProfile } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<JobFormData>({
    title: "",
    category: "Warehouse",
    type: "full-day",
    location: userProfile?.location || "Austin, TX",
    startDate: "ASAP",
    duration: "1 day",
    description: "",
    requirements: "",
    pay: "",
    payType: "hourly",
    urgency: "normal",
  });

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  function canProceed() {
    if (step === 0) return form.title.length > 2 && form.location.length > 2;
    if (step === 1) return form.description.length > 10;
    if (step === 2) return form.pay.length > 0 && Number(form.pay) > 0;
    return true;
  }

  function handleNext() {
    if (!canProceed()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      submitJob();
    }
  }

  function submitJob() {
    const reqArray = form.requirements
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);
    postJob({
      title: form.title,
      company: userProfile?.company || "My Company",
      location: form.location,
      type: form.type as any,
      category: form.category,
      pay: Number(form.pay),
      payType: form.payType as any,
      startDate: form.startDate,
      duration: form.duration,
      description: form.description,
      requirements: reqArray.length > 0 ? reqArray : ["Must be reliable"],
      urgency: form.urgency as any,
      employerId: userProfile?.id || "emp-me",
      verified: userProfile?.verified || false,
      companyRating: userProfile?.rating || 4.0,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)/dashboard");
  }

  function update(key: keyof JobFormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => (step > 0 ? setStep(step - 1) : router.back())}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Post a Job</Text>
        <Text style={[styles.stepIndicator, { color: colors.mutedForeground }]}>
          {step + 1}/{STEPS.length}
        </Text>
      </View>

      {/* Progress */}
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: colors.primary }]} />
      </View>
      <Text style={[styles.stepName, { color: colors.foreground }]}>{STEPS[step]}</Text>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 0: Basics */}
        {step === 0 && (
          <View style={styles.stepContent}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Job Title *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="e.g. Warehouse Associate, Event Staff"
                placeholderTextColor={colors.mutedForeground}
                value={form.title}
                onChangeText={(v) => update("title", v)}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
              <View style={styles.chipGrid}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, { backgroundColor: form.category === c ? colors.primary : colors.card, borderColor: form.category === c ? colors.primary : colors.border }]}
                    onPress={() => update("category", c)}
                  >
                    <Text style={[styles.chipText, { color: form.category === c ? "#fff" : colors.foreground }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Job Type</Text>
              <View style={styles.chipRow}>
                {JOB_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, { backgroundColor: form.type === t ? colors.primary : colors.card, borderColor: form.type === t ? colors.primary : colors.border }]}
                    onPress={() => update("type", t)}
                  >
                    <Text style={[styles.chipText, { color: form.type === t ? "#fff" : colors.foreground }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Location *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="City, State"
                placeholderTextColor={colors.mutedForeground}
                value={form.location}
                onChangeText={(v) => update("location", v)}
              />
            </View>

            <View style={styles.twoCol}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.foreground }]}>Start Date</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                  placeholder="ASAP / Date"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.startDate}
                  onChangeText={(v) => update("startDate", v)}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.foreground }]}>Duration</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                  placeholder="1 day, 1 week..."
                  placeholderTextColor={colors.mutedForeground}
                  value={form.duration}
                  onChangeText={(v) => update("duration", v)}
                />
              </View>
            </View>
          </View>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Job Description *</Text>
              <TextInput
                style={[styles.textarea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="Describe the role, responsibilities, and what the worker will be doing day-to-day..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={6}
                value={form.description}
                onChangeText={(v) => update("description", v)}
              />
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                More detail = more qualified applicants
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Requirements</Text>
              <TextInput
                style={[styles.textarea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="Enter each requirement on a new line:&#10;• Must be 18+&#10;• Steel-toed boots required&#10;• Background check"
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                value={form.requirements}
                onChangeText={(v) => update("requirements", v)}
              />
            </View>
          </View>
        )}

        {/* Step 2: Pay */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <View style={[styles.payHighlight, { backgroundColor: colors.accent }]}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[styles.payHighlightText, { color: colors.primary }]}>
                Jobs with clear pay get 3x more applicants
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Pay Rate *</Text>
              <View style={[styles.payInputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.dollarSign, { color: colors.foreground }]}>$</Text>
                <TextInput
                  style={[styles.payInput, { color: colors.foreground }]}
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  value={form.pay}
                  onChangeText={(v) => update("pay", v)}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Per</Text>
              <View style={styles.chipRow}>
                {PAY_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, { backgroundColor: form.payType === t ? colors.primary : colors.card, borderColor: form.payType === t ? colors.primary : colors.border }]}
                    onPress={() => update("payType", t)}
                  >
                    <Text style={[styles.chipText, { color: form.payType === t ? "#fff" : colors.foreground }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Urgency</Text>
              <View style={styles.chipRow}>
                {URGENCY_OPTIONS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.chip, {
                      backgroundColor: form.urgency === u ? (u === "urgent" ? "#ef4444" : colors.primary) : colors.card,
                      borderColor: form.urgency === u ? (u === "urgent" ? "#ef4444" : colors.primary) : colors.border
                    }]}
                    onPress={() => update("urgency", u)}
                  >
                    <Text style={[styles.chipText, { color: form.urgency === u ? "#fff" : colors.foreground }]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.reviewTitle, { color: colors.foreground }]}>Review your job post</Text>
            <View style={[styles.reviewCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
              {[
                { label: "Title", val: form.title },
                { label: "Category", val: `${form.category} · ${form.type}` },
                { label: "Location", val: form.location },
                { label: "Start", val: `${form.startDate} · ${form.duration}` },
                { label: "Pay", val: `$${form.pay}/${form.payType}` },
                { label: "Urgency", val: form.urgency },
              ].map((r) => (
                <View key={r.label} style={[styles.reviewRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>{r.label}</Text>
                  <Text style={[styles.reviewVal, { color: colors.foreground }]}>{r.val}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.reviewDesc, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.reviewLabel, { color: colors.mutedForeground, marginBottom: 8 }]}>Description</Text>
              <Text style={[styles.reviewDescText, { color: colors.foreground }]}>{form.description}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0), backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: canProceed() ? colors.primary : colors.muted }]}
          onPress={handleNext}
          disabled={!canProceed()}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextBtnText, { color: canProceed() ? "#fff" : colors.mutedForeground }]}>
            {step === STEPS.length - 1 ? "Post Job" : "Continue"}
          </Text>
          <Feather name={step === STEPS.length - 1 ? "check" : "arrow-right"} size={18} color={canProceed() ? "#fff" : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  stepIndicator: { fontSize: 13 },
  progressTrack: { height: 4, marginHorizontal: 20, borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, borderRadius: 2 },
  stepName: { fontSize: 22, fontWeight: "800", paddingHorizontal: 20, marginBottom: 20, letterSpacing: -0.3 },
  stepContent: { gap: 4 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  hint: { fontSize: 12, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "500" },
  twoCol: { flexDirection: "row", gap: 12 },
  payHighlight: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 12, marginBottom: 12 },
  payHighlightText: { fontSize: 13, fontWeight: "600", flex: 1 },
  payInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  dollarSign: { fontSize: 22, fontWeight: "700", marginRight: 4 },
  payInput: { flex: 1, fontSize: 28, fontWeight: "700", paddingVertical: 10 },
  reviewTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  reviewCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  reviewRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  reviewLabel: { fontSize: 13 },
  reviewVal: { fontSize: 13, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  reviewDesc: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  reviewDescText: { fontSize: 14, lineHeight: 20 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 14,
    gap: 10,
  },
  nextBtnText: { fontSize: 17, fontWeight: "700" },
});

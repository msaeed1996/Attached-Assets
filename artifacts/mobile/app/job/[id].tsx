import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useJobs } from "@/context/JobsContext";
import { useApp } from "@/context/AppContext";
import { TrustBadge } from "@/components/TrustBadge";
import * as Haptics from "expo-haptics";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getJobById, applyToJob, applications } = useJobs();
  const { userRole } = useApp();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [applied, setApplied] = useState(false);

  const job = getJobById(id);
  const hasApplied = applied || applications.some((a) => a.jobId === id && a.workerId === "me");
  const isWorker = userRole !== "employer";

  if (!job) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Job not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function handleApply() {
    if (hasApplied) return;
    setShowApplyModal(true);
  }

  function submitApplication() {
    applyToJob(id, coverNote);
    setApplied(true);
    setShowApplyModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back header */}
        <View style={[styles.topBar, { paddingTop: (Platform.OS === "web" ? insets.top + 67 : insets.top) + 12 }]}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Job header */}
        <View style={[styles.jobHeader, { paddingHorizontal: 20 }]}>
          <Text style={[styles.jobTitle, { color: colors.foreground }]}>{job.title}</Text>
          <View style={styles.companyRow}>
            <Text style={[styles.companyName, { color: colors.mutedForeground }]}>{job.company}</Text>
            {job.verified && <Feather name="check-circle" size={14} color={colors.primary} style={{ marginLeft: 4 }} />}
          </View>
          <TrustBadge rating={job.companyRating} reviewCount={24} size="sm" />
        </View>

        {/* Key stats */}
        <View style={styles.statsRow}>
          {[
            { icon: "dollar-sign", val: `$${job.pay}/${job.payType}`, label: "Pay" },
            { icon: "map-pin", val: job.location, label: "Location" },
            { icon: "calendar", val: job.startDate, label: "Start" },
            { icon: "clock", val: job.duration, label: "Duration" },
          ].map((s) => (
            <View key={s.label} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={s.icon as any} size={18} color={colors.primary} />
              <Text style={[styles.statVal, { color: colors.foreground }]} numberOfLines={1}>{s.val}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Urgency / posted */}
        <View style={[styles.urgencyRow, { paddingHorizontal: 20 }]}>
          {job.urgency === "urgent" && (
            <View style={[styles.urgentTag, { backgroundColor: "#fef2f2" }]}>
              <View style={[styles.urgentDot, { backgroundColor: "#ef4444" }]} />
              <Text style={[styles.urgentTagText, { color: "#ef4444" }]}>Urgent Hire</Text>
            </View>
          )}
          <Text style={[styles.postedAt, { color: colors.mutedForeground }]}>Posted {job.postedAt}</Text>
        </View>

        {/* Description */}
        <View style={[styles.card, { marginHorizontal: 20, borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>About This Job</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{job.description}</Text>
        </View>

        {/* Requirements */}
        <View style={[styles.card, { marginHorizontal: 20, borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Requirements</Text>
          {job.requirements.map((req, i) => (
            <View key={i} style={styles.reqRow}>
              <View style={[styles.reqDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.reqText, { color: colors.mutedForeground }]}>{req}</Text>
            </View>
          ))}
        </View>

        {/* Trust indicators */}
        <View style={[styles.trustRow, { paddingHorizontal: 20 }]}>
          {[
            { icon: "shield", text: "Background checks run" },
            { icon: "zap", text: "Fast payment guaranteed" },
            { icon: "clock", text: "Flexible scheduling" },
          ].map((t) => (
            <View key={t.text} style={[styles.trustItem, { backgroundColor: colors.muted }]}>
              <Feather name={t.icon as any} size={14} color={colors.primary} />
              <Text style={[styles.trustText, { color: colors.foreground }]}>{t.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0), backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {isWorker ? (
          <TouchableOpacity
            style={[
              styles.applyBtn,
              { backgroundColor: hasApplied ? colors.muted : colors.primary },
            ]}
            onPress={handleApply}
            disabled={hasApplied}
            activeOpacity={0.85}
          >
            <Feather
              name={hasApplied ? "check-circle" : "send"}
              size={20}
              color={hasApplied ? colors.success : "#fff"}
            />
            <Text style={[styles.applyBtnText, { color: hasApplied ? colors.success : "#fff" }]}>
              {hasApplied ? "Application Sent" : "Apply Now — 1 Tap"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.employerActions}>
            <TouchableOpacity style={[styles.viewAppsBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.viewAppsBtnText}>View Applicants</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Apply modal */}
      <Modal visible={showApplyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Apply to {job.title}</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Add an optional note to stand out
            </Text>
            <TextInput
              style={[styles.noteInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              placeholder="Tell the employer why you're a great fit..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              value={coverNote}
              onChangeText={setCoverNote}
            />
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={submitApplication}
              activeOpacity={0.85}
            >
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Application</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={() => setShowApplyModal(false)}
            >
              <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  jobHeader: { alignItems: "center", marginBottom: 16, marginTop: 4 },
  jobTitle: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 6, letterSpacing: -0.3 },
  companyRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  companyName: { fontSize: 15, fontWeight: "500" },
  statsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statBox: { flex: 1, alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  statVal: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  statLabel: { fontSize: 10 },
  urgencyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  urgentTag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
  urgentDot: { width: 6, height: 6, borderRadius: 3 },
  urgentTagText: { fontSize: 12, fontWeight: "600" },
  applicantsTag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
  applicantsTagText: { fontSize: 12 },
  postedAt: { fontSize: 12, marginLeft: "auto" },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22 },
  reqRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  reqDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  reqText: { flex: 1, fontSize: 14, lineHeight: 20 },
  trustRow: { gap: 8, marginBottom: 16 },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10 },
  trustText: { fontSize: 13, fontWeight: "500" },
  stickyBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  applyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, borderRadius: 14, gap: 10 },
  applyBtnText: { fontSize: 17, fontWeight: "700" },
  employerActions: {},
  viewAppsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, borderRadius: 14 },
  viewAppsBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 12 },
  modalHandle: { width: 40, height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  modalSub: { fontSize: 14, marginBottom: 16 },
  noteInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 100, textAlignVertical: "top", marginBottom: 16 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 12, gap: 8, marginBottom: 10 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1 },
  cancelBtnText: { fontSize: 15 },
});

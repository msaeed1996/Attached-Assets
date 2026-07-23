import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
  Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useJobs } from "@/context/JobsContext";
import { useApp } from "@/context/AppContext";
import * as Haptics from "expo-haptics";

// ── helpers ──────────────────────────────────────────────────────────────────
function extractHours(duration: string): number {
  const m = duration.match(/(\d+)\s*h/i);
  if (m) return parseInt(m[1], 10);
  const d = duration.match(/(\d+)\s*day/i);
  if (d) return parseInt(d[1], 10) * 8;
  return 8;
}

function totalPay(pay: number, payType: string, duration: string): string {
  if (payType === "hourly") {
    const hrs = extractHours(duration);
    return `$${(pay * hrs).toLocaleString()}`;
  }
  if (payType === "daily") return `$${pay}`;
  return `$${pay}`;
}

function rateLabel(pay: number, payType: string) {
  if (payType === "hourly") return `$${pay}.00 / hr`;
  if (payType === "daily") return `$${pay} / day`;
  return `$${pay} fixed`;
}

function durationLabel(duration: string): string {
  const hrs = extractHours(duration);
  return `${hrs}H`;
}

// ── component ─────────────────────────────────────────────────────────────────
const BLUE = "#1D4ED8";
const BLUE_LIGHT = "#EFF6FF";
const GREEN = "#16A34A";
const GREEN_LIGHT = "#DCFCE7";
const RED = "#DC2626";
const BG = "#F3F4F6";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const MUTED = "#6B7280";
const LABEL = "#9CA3AF";
const DARK = "#111827";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getJobById, applyToJob, applications } = useJobs();
  const { userRole } = useApp();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [applied, setApplied] = useState(false);

  const job = getJobById(id);
  const hasApplied =
    applied || applications.some((a) => a.jobId === id && a.workerId === "me");
  const isWorker = userRole !== "employer";

  if (!job) {
    return (
      <View style={styles.notFound}>
        <Feather name="alert-circle" size={40} color={MUTED} />
        <Text style={styles.notFoundText}>Job not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={{ color: BLUE }}>Go back</Text>
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

  const durLabel = durationLabel(job.duration);
  const total = totalPay(job.pay, job.payType, job.duration);
  const rate = rateLabel(job.pay, job.payType);

  function openDirections() {
    const query = encodeURIComponent(job.location);
    const url =
      Platform.OS === "ios"
        ? `maps://maps.apple.com/?q=${query}`
        : `https://maps.google.com/?q=${query}`;
    Linking.openURL(url).catch(() => {});
  }

  return (
    <View style={styles.root}>
      {/* ── Top bar ── */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop:
              (Platform.OS === "web" ? insets.top + 67 : insets.top) + 12,
          },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={DARK} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 130,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Card 1: Job Header ── */}
        <View style={styles.card}>
          {/* Title row */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <View style={styles.companyRow}>
                <Feather name="briefcase" size={13} color={BLUE} style={{ marginRight: 5 }} />
                <Text style={styles.companyName}>{job.company}</Text>
                {job.verified && (
                  <Feather name="check-circle" size={13} color={BLUE} style={{ marginLeft: 4 }} />
                )}
              </View>
            </View>
            {/* Pay badge */}
            <View style={styles.payBadge}>
              <Text style={styles.payTotal}>{total}</Text>
              <Text style={styles.payRate}>{rate}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Date */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="calendar" size={16} color={BLUE} />
            </View>
            <View>
              <Text style={styles.infoLabel}>DATE</Text>
              <Text style={styles.infoValue}>{job.startDate}</Text>
            </View>
          </View>

          {/* Time */}
          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <View style={styles.infoIconWrap}>
              <Feather name="clock" size={16} color={BLUE} />
            </View>
            <View>
              <Text style={styles.infoLabel}>DURATION ({durLabel})</Text>
              <Text style={styles.infoValue}>{job.duration}</Text>
            </View>
          </View>
        </View>

        {/* ── Card 2: Location & Contact ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location &amp; Contact</Text>
          <View style={styles.divider} />

          {/* Address */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="map-pin" size={16} color={BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>ADDRESS</Text>
              <Text style={styles.infoValue}>{job.location}</Text>
            </View>
          </View>

          {/* Get Directions */}
          <TouchableOpacity style={styles.directionsBtn} onPress={openDirections} activeOpacity={0.8}>
            <Feather name="navigation" size={15} color={BLUE} />
            <Text style={styles.directionsBtnText}>Get Directions</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Report To */}
          <View style={[styles.infoRow, { marginBottom: 0, marginTop: 14 }]}>
            <View style={styles.infoIconWrap}>
              <Feather name="user" size={16} color={BLUE} />
            </View>
            <View>
              <Text style={styles.infoLabel}>REPORT TO</Text>
              <Text style={styles.infoValue}>Hiring Manager</Text>
            </View>
          </View>
        </View>

        {/* ── Card 3: Job Overview ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Job Overview</Text>
          <View style={styles.divider} />
          <Text style={styles.description}>{job.description}</Text>
          {job.requirements.map((req, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>{req}</Text>
            </View>
          ))}
        </View>

        {/* ── Card 4: Trust indicators ── */}
        <View style={styles.card}>
          {[
            { icon: "shield" as const, label: "Background check required" },
            { icon: "zap" as const, label: "Fast payment guaranteed" },
            { icon: "repeat" as const, label: "Flexible scheduling" },
          ].map((t) => (
            <View key={t.label} style={styles.trustRow}>
              <View style={styles.trustIconWrap}>
                <Feather name={t.icon} size={14} color={GREEN} />
              </View>
              <Text style={styles.trustText}>{t.label}</Text>
            </View>
          ))}
        </View>

        {/* Urgency / posted */}
        {job.urgency === "urgent" && (
          <View style={styles.urgentTag}>
            <View style={styles.urgentDot} />
            <Text style={styles.urgentText}>Urgent Hire</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Sticky bottom CTA ── */}
      <View
        style={[
          styles.stickyBottom,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8) },
        ]}
      >
        {isWorker ? (
          hasApplied ? (
            <>
              <TouchableOpacity style={styles.cancelShiftBtn} activeOpacity={0.85}>
                <Feather name="alert-triangle" size={17} color={RED} />
                <Text style={styles.cancelShiftText}>Withdraw Application</Text>
              </TouchableOpacity>
              <Text style={styles.cancelNote}>Cancellation policies apply.</Text>
            </>
          ) : (
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApply}
              activeOpacity={0.85}
            >
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.applyBtnText}>Apply Now — 1 Tap</Text>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity style={styles.applyBtn} activeOpacity={0.85}>
            <Feather name="users" size={18} color="#fff" />
            <Text style={styles.applyBtnText}>View Applicants</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Apply modal ── */}
      <Modal visible={showApplyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Apply to {job.title}</Text>
            <Text style={styles.modalSub}>Add an optional note to stand out</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Tell the employer why you're a great fit…"
              placeholderTextColor={LABEL}
              multiline
              numberOfLines={4}
              value={coverNote}
              onChangeText={setCoverNote}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={submitApplication} activeOpacity={0.85}>
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Application</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowApplyModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  notFound: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, backgroundColor: BG },
  notFoundText: { fontSize: 16, color: MUTED },
  backLink: { marginTop: 4 },

  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: BG,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Card ──
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── Job header card internals ──
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  jobTitle: { fontSize: 22, fontWeight: "800", color: DARK, letterSpacing: -0.3, marginBottom: 6 },
  companyRow: { flexDirection: "row", alignItems: "center" },
  companyName: { fontSize: 14, fontWeight: "600", color: BLUE },
  payBadge: {
    backgroundColor: GREEN_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 72,
  },
  payTotal: { fontSize: 18, fontWeight: "800", color: GREEN },
  payRate: { fontSize: 11, fontWeight: "500", color: GREEN, marginTop: 2 },

  divider: { height: 1, backgroundColor: BORDER, marginVertical: 14 },

  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: BLUE_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: { fontSize: 10, fontWeight: "700", color: LABEL, letterSpacing: 0.8, marginBottom: 3 },
  infoValue: { fontSize: 15, fontWeight: "600", color: DARK },

  // ── Section title ──
  sectionTitle: { fontSize: 16, fontWeight: "700", color: DARK, marginBottom: 2 },

  // ── Directions button ──
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: BLUE,
    borderRadius: 12,
    paddingVertical: 12,
    marginLeft: 46,
    marginBottom: 4,
    backgroundColor: BLUE_LIGHT,
  },
  directionsBtnText: { fontSize: 14, fontWeight: "700", color: BLUE },

  // ── Description ──
  description: { fontSize: 14, lineHeight: 22, color: MUTED, marginBottom: 14 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: BLUE, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20, color: DARK },

  // ── Trust ──
  trustRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  trustIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: GREEN_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  trustText: { fontSize: 13, fontWeight: "500", color: DARK },

  // ── Urgency ──
  urgentTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  urgentDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: RED },
  urgentText: { fontSize: 12, fontWeight: "700", color: RED },

  // ── Sticky bottom ──
  stickyBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    alignItems: "center",
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: BLUE,
    paddingVertical: 17,
    borderRadius: 14,
    width: "100%",
  },
  applyBtnText: { fontSize: 17, fontWeight: "700", color: "#fff" },
  cancelShiftBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 6,
  },
  cancelShiftText: { fontSize: 16, fontWeight: "700", color: RED },
  cancelNote: { fontSize: 12, color: MUTED, marginTop: 4 },

  // ── Modal ──
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: DARK, marginBottom: 4 },
  modalSub: { fontSize: 14, color: MUTED, marginBottom: 16 },
  noteInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: DARK,
    backgroundColor: BG,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BLUE,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modalCancelBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalCancelText: { fontSize: 15, color: MUTED },
});

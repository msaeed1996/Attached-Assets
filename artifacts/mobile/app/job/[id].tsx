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
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useJobs } from "@/context/JobsContext";
import { useApp } from "@/context/AppContext";
import * as Haptics from "expo-haptics";

// ── helpers ───────────────────────────────────────────────────────────────────
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
  return `$${pay.toLocaleString()}`;
}

function rateLabel(pay: number, payType: string) {
  if (payType === "hourly") return `$${pay} / hr`;
  if (payType === "daily") return `$${pay} / day`;
  return `$${pay} fixed`;
}

// ── palette ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#F0F2F5",
  card: "#FFFFFF",
  border: "#E8EBF0",
  blue1: "#1A3FBB",
  blue2: "#2D5BE3",
  blue3: "#4F7BF5",
  blueLight: "#EEF3FF",
  green: "#16A34A",
  greenLight: "#DCFCE7",
  red: "#DC2626",
  redLight: "#FEF2F2",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  dark: "#0F172A",
  mid: "#374151",
  muted: "#6B7280",
  label: "#94A3B8",
  white: "#FFFFFF",
};

// ── component ─────────────────────────────────────────────────────────────────
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
        <Feather name="alert-circle" size={44} color={C.muted} />
        <Text style={styles.notFoundText}>Job not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={{ color: C.blue2, fontWeight: "600" }}>← Go back</Text>
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

  function openDirections() {
    const q = encodeURIComponent(job.location);
    const url =
      Platform.OS === "ios"
        ? `maps://maps.apple.com/?q=${q}`
        : `https://maps.google.com/?q=${q}`;
    Linking.openURL(url).catch(() => {});
  }

  const total = totalPay(job.pay, job.payType, job.duration);
  const rate = rateLabel(job.pay, job.payType);
  const heroTop = (Platform.OS === "web" ? insets.top + 67 : insets.top) + 12;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}
      >
        {/* ── HERO HEADER ── */}
        <LinearGradient
          colors={[C.blue1, C.blue2, C.blue3]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: heroTop }]}
        >
          {/* Decorative circles */}
          <View style={styles.decCircle1} />
          <View style={styles.decCircle2} />

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color={C.white} />
          </TouchableOpacity>

          {/* Category chip + urgency */}
          <View style={styles.chipRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{job.category}</Text>
            </View>
            {job.urgency === "urgent" && (
              <View style={styles.urgentChip}>
                <View style={styles.urgentDot} />
                <Text style={styles.urgentChipText}>Urgent</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>{job.title}</Text>

          {/* Company row */}
          <View style={styles.heroCompanyRow}>
            <View style={styles.companyIconWrap}>
              <Feather name="briefcase" size={13} color={C.blue2} />
            </View>
            <Text style={styles.heroCompany}>{job.company}</Text>
            {job.verified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={10} color={C.blue2} />
              </View>
            )}
          </View>

          {/* Pay banner */}
          <View style={styles.payBanner}>
            <View>
              <Text style={styles.payBannerTotal}>{total}</Text>
              <Text style={styles.payBannerRate}>{rate} · {job.duration}</Text>
            </View>
            <View style={styles.payBannerRight}>
              <Feather name="trending-up" size={18} color={C.green} />
              <Text style={styles.payBannerEarning}>Est. Earning</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── QUICK INFO STRIP (overlapping hero) ── */}
        <View style={styles.quickStrip}>
          {[
            { icon: "calendar" as const, label: "DATE", val: job.startDate },
            { icon: "clock" as const, label: "DURATION", val: job.duration },
            { icon: "users" as const, label: "APPLICANTS", val: `${job.applicantsCount}` },
          ].map((item, i) => (
            <React.Fragment key={item.label}>
              <View style={styles.quickItem}>
                <View style={styles.quickIconWrap}>
                  <Feather name={item.icon} size={14} color={C.blue2} />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
                <Text style={styles.quickVal}>{item.val}</Text>
              </View>
              {i < 2 && <View style={styles.quickDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── BODY ── */}
        <View style={styles.body}>

          {/* Location & Contact */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Feather name="map-pin" size={15} color={C.blue2} />
              </View>
              <Text style={styles.cardTitle}>Location &amp; Contact</Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.fieldLabel}>ADDRESS</Text>
              <Text style={styles.fieldValue}>{job.location}</Text>
              <TouchableOpacity style={styles.directionsBtn} onPress={openDirections} activeOpacity={0.8}>
                <Feather name="navigation" size={14} color={C.blue2} />
                <Text style={styles.directionsBtnText}>Get Directions</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.thinDivider} />

            <View style={styles.infoBlock}>
              <Text style={styles.fieldLabel}>REPORT TO</Text>
              <View style={styles.reportRow}>
                <View style={styles.avatarCircle}>
                  <Feather name="user" size={16} color={C.blue2} />
                </View>
                <Text style={styles.fieldValue}>Hiring Manager</Text>
              </View>
            </View>
          </View>

          {/* Job Overview */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Feather name="file-text" size={15} color={C.blue2} />
              </View>
              <Text style={styles.cardTitle}>Job Overview</Text>
            </View>
            <Text style={styles.description}>{job.description}</Text>
            <View style={styles.reqList}>
              {job.requirements.map((req, i) => (
                <View key={i} style={styles.reqRow}>
                  <View style={styles.reqDot} />
                  <Text style={styles.reqText}>{req}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Benefits strip */}
          <View style={styles.benefitsRow}>
            {[
              { icon: "shield" as const, label: "Background\nChecked", color: C.blue2, bg: C.blueLight },
              { icon: "zap" as const, label: "Fast\nPayment", color: C.green, bg: C.greenLight },
              { icon: "repeat" as const, label: "Flexible\nSchedule", color: C.amber, bg: C.amberLight },
            ].map((b) => (
              <View key={b.label} style={[styles.benefitItem, { backgroundColor: b.bg }]}>
                <Feather name={b.icon} size={18} color={b.color} />
                <Text style={[styles.benefitLabel, { color: b.color }]}>{b.label}</Text>
              </View>
            ))}
          </View>

          {/* Posted */}
          <Text style={styles.postedText}>Posted {job.postedAt}</Text>
        </View>
      </ScrollView>

      {/* ── STICKY BOTTOM ── */}
      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8) }]}>
        {isWorker ? (
          hasApplied ? (
            <View style={styles.appliedState}>
              <TouchableOpacity style={styles.withdrawBtn} activeOpacity={0.85}>
                <Feather name="alert-triangle" size={16} color={C.red} />
                <Text style={styles.withdrawText}>Withdraw Application</Text>
              </TouchableOpacity>
              <Text style={styles.cancelNote}>Cancellation policies apply.</Text>
            </View>
          ) : (
            <LinearGradient
              colors={[C.blue2, C.blue3]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.applyGradient}
            >
              <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
                <Feather name="send" size={18} color={C.white} />
                <Text style={styles.applyBtnText}>Apply Now — 1 Tap</Text>
              </TouchableOpacity>
            </LinearGradient>
          )
        ) : (
          <LinearGradient
            colors={[C.blue2, C.blue3]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.applyGradient}
          >
            <TouchableOpacity style={styles.applyBtn} activeOpacity={0.85}>
              <Feather name="users" size={18} color={C.white} />
              <Text style={styles.applyBtnText}>View Applicants</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}
      </View>

      {/* ── APPLY MODAL ── */}
      <Modal visible={showApplyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <LinearGradient colors={[C.blue2, C.blue3]} style={styles.modalIcon}>
                <Feather name="send" size={18} color={C.white} />
              </LinearGradient>
              <View>
                <Text style={styles.modalTitle}>Quick Apply</Text>
                <Text style={styles.modalSub}>{job.title} · {job.company}</Text>
              </View>
            </View>
            <TextInput
              style={styles.noteInput}
              placeholder="Tell them why you're perfect for this role…"
              placeholderTextColor={C.label}
              multiline
              numberOfLines={4}
              value={coverNote}
              onChangeText={setCoverNote}
            />
            <LinearGradient
              colors={[C.blue2, C.blue3]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <TouchableOpacity style={styles.submitBtn} onPress={submitApplication} activeOpacity={0.85}>
                <Feather name="check-circle" size={18} color={C.white} />
                <Text style={styles.submitBtnText}>Submit Application</Text>
              </TouchableOpacity>
            </LinearGradient>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowApplyModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  notFound: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14, backgroundColor: C.bg },
  notFoundText: { fontSize: 16, color: C.muted },
  backLink: { marginTop: 4 },

  // ── Hero ──
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 70,
    overflow: "hidden",
    position: "relative",
  },
  decCircle1: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -60,
    right: -60,
  },
  decCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: 20,
    left: -40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  chipRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  categoryChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryChipText: { fontSize: 12, fontWeight: "600", color: C.white },
  urgentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.redLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  urgentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  urgentChipText: { fontSize: 12, fontWeight: "700", color: C.red },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.4,
    marginBottom: 10,
    lineHeight: 32,
  },
  heroCompanyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  companyIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
  },
  heroCompany: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.9)" },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
  },
  payBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  payBannerTotal: { fontSize: 28, fontWeight: "800", color: C.white },
  payBannerRate: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2, fontWeight: "500" },
  payBannerRight: { alignItems: "center", gap: 4 },
  payBannerEarning: { fontSize: 11, color: C.green, fontWeight: "600" },

  // ── Quick strip ──
  quickStrip: {
    flexDirection: "row",
    backgroundColor: C.card,
    marginHorizontal: 16,
    marginTop: -38,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 10,
  },
  quickItem: { flex: 1, alignItems: "center", gap: 5 },
  quickIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.blueLight,
    justifyContent: "center",
    alignItems: "center",
  },
  quickLabel: { fontSize: 9, fontWeight: "700", color: C.label, letterSpacing: 0.8 },
  quickVal: { fontSize: 13, fontWeight: "700", color: C.dark },
  quickDivider: { width: 1, backgroundColor: C.border, alignSelf: "stretch" },

  // ── Body ──
  body: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },

  // ── Card ──
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  cardHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.blueLight,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: C.dark },
  thinDivider: { height: 1, backgroundColor: C.border, marginVertical: 14 },

  // ── Info blocks ──
  infoBlock: { gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: "700", color: C.label, letterSpacing: 0.9 },
  fieldValue: { fontSize: 15, fontWeight: "600", color: C.dark },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1.5,
    borderColor: C.blue2,
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 8,
    backgroundColor: C.blueLight,
  },
  directionsBtnText: { fontSize: 14, fontWeight: "700", color: C.blue2 },
  reportRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.blueLight,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Description / requirements ──
  description: { fontSize: 14, lineHeight: 22, color: C.muted, marginBottom: 14 },
  reqList: { gap: 8 },
  reqRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  reqDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.blue2, marginTop: 7, flexShrink: 0 },
  reqText: { flex: 1, fontSize: 14, lineHeight: 20, color: C.mid },

  // ── Benefits ──
  benefitsRow: { flexDirection: "row", gap: 10 },
  benefitItem: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    gap: 7,
  },
  benefitLabel: { fontSize: 11, fontWeight: "700", textAlign: "center", lineHeight: 15 },

  // ── Posted ──
  postedText: { textAlign: "center", fontSize: 12, color: C.label, paddingBottom: 4 },

  // ── Sticky bottom ──
  stickyBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 20,
    paddingTop: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 10,
  },
  applyGradient: { borderRadius: 16, overflow: "hidden" },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
  },
  applyBtnText: { fontSize: 17, fontWeight: "800", color: C.white, letterSpacing: 0.2 },
  appliedState: { alignItems: "center", gap: 6 },
  withdrawBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 8 },
  withdrawText: { fontSize: 16, fontWeight: "700", color: C.red },
  cancelNote: { fontSize: 12, color: C.label },

  // ── Modal ──
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 12,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 22 },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  modalIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: C.dark },
  modalSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  noteInput: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: C.dark,
    backgroundColor: C.bg,
    minHeight: 110,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  submitGradient: { borderRadius: 14, overflow: "hidden", marginBottom: 10 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
  },
  submitBtnText: { color: C.white, fontSize: 16, fontWeight: "700" },
  modalCancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.border,
  },
  modalCancelText: { fontSize: 15, color: C.muted, fontWeight: "500" },
});

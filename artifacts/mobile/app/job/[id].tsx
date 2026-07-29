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
import type { WeeklyScheduleDay } from "@/context/JobsContext";
import { useApp } from "@/context/AppContext";
import * as Haptics from "expo-haptics";

// ─── helpers ──────────────────────────────────────────────────────────────────
function extractHours(duration: string): number {
  const h = duration.match(/(\d+)\s*h/i);
  if (h) return parseInt(h[1], 10);
  const d = duration.match(/(\d+)\s*day/i);
  if (d) return parseInt(d[1], 10) * 8;
  return 8;
}
function totalPay(pay: number, payType: string, duration: string): string {
  if (payType === "hourly") return `$${(pay * extractHours(duration)).toLocaleString()}`;
  return `$${pay.toLocaleString()}`;
}
function rateLabel(pay: number, payType: string) {
  if (payType === "hourly") return `$${pay}.00 / hr`;
  if (payType === "daily") return `$${pay} / day`;
  return `$${pay} fixed`;
}

// ─── palette ──────────────────────────────────────────────────────────────────
const BLUE      = "#2563EB";
const BLUE_BG   = "#2563EB";
const GREEN     = "#16A34A";
const GREEN_BG  = "#DCFCE7";
const RED       = "#DC2626";
const BG        = "#F1F3F6";
const CARD      = "#FFFFFF";
const BORDER    = "#E5E7EB";
const DARK      = "#111827";
const MID       = "#374151";
const MUTED     = "#6B7280";
const LABEL     = "#9CA3AF";

// ─── component ────────────────────────────────────────────────────────────────
export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets  = useSafeAreaInsets();
  const { getJobById, applyToJob, applications } = useJobs();
  const { userRole } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [applied, setApplied]     = useState(false);

  const job        = getJobById(id);
  const hasApplied = applied || applications.some((a) => a.jobId === id && a.workerId === "me");
  const isWorker   = userRole !== "employer";

  if (!job) {
    return (
      <View style={s.notFound}>
        <Feather name="alert-circle" size={40} color={MUTED} />
        <Text style={s.notFoundTxt}>Job not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: BLUE, fontWeight: "600" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function submitApplication() {
    applyToJob(id, coverNote);
    setApplied(true);
    setShowModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function openDirections() {
    const q = encodeURIComponent(job.location);
    Linking.openURL(
      Platform.OS === "ios"
        ? `maps://maps.apple.com/?q=${q}`
        : `https://maps.google.com/?q=${q}`
    ).catch(() => {});
  }

  const total    = totalPay(job.pay, job.payType, job.duration);
  const rate     = rateLabel(job.pay, job.payType);
  const hrs      = extractHours(job.duration);
  const topPad   = (Platform.OS === "web" ? insets.top + 67 : insets.top);

  return (
    <View style={s.root}>

      {/* ── Blue top bar ── */}
      <View style={[s.topBar, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        {job.urgency === "urgent" && (
          <View style={s.urgentPill}>
            <View style={s.urgentDot} />
            <Text style={s.urgentPillTxt}>Urgent Hire</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Card 1: Title + Pay ── */}
        <View style={s.card}>
          <View style={s.titleRow}>
            <Text style={s.title} numberOfLines={2}>{job.title}</Text>
            <View style={s.payBadge}>
              <Text style={s.payTotal}>{total}</Text>
              <Text style={s.payRate}>{rate}</Text>
            </View>
          </View>
        </View>

        {/* ── Card 2: Date & Time ── */}
        <View style={s.card}>
          {/* Start / End date side by side */}
          <View style={s.dateGrid}>
            <View style={s.dateCell}>
              <View style={[s.dateIconBox, { backgroundColor: "#EFF6FF" }]}>
                <Feather name="calendar" size={15} color={BLUE} />
              </View>
              <Text style={s.fieldLabel}>START DATE</Text>
              <Text style={s.fieldValue}>{job.startDate}</Text>
            </View>
            {job.endDate && (
              <>
                <View style={s.dateCellDivider} />
                <View style={s.dateCell}>
                  <View style={[s.dateIconBox, { backgroundColor: "#F0FDF4" }]}>
                    <Feather name="calendar" size={15} color="#16A34A" />
                  </View>
                  <Text style={s.fieldLabel}>END DATE</Text>
                  <Text style={s.fieldValue}>{job.endDate}</Text>
                </View>
              </>
            )}
          </View>

          {/* Job Timing */}
          <View style={s.timingRow}>
            <View style={[s.dateIconBox, { backgroundColor: "#FEF3C7" }]}>
              <Feather name="clock" size={15} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>JOB TIMING ({hrs}H)</Text>
              <Text style={s.fieldValue}>{job.timing ?? job.duration}</Text>
            </View>
            <View style={s.durationBadge}>
              <Text style={s.durationBadgeTxt}>{job.duration}</Text>
            </View>
          </View>

          {/* Weekly schedule */}
          {job.weeklySchedule && job.weeklySchedule.length > 0 && (
            <View style={s.weeklyWrap}>
              {job.weeklySchedule.map((item, i) => (
                <View
                  key={i}
                  style={[
                    s.weeklyRow,
                    i < job.weeklySchedule!.length - 1 && s.weeklyRowBorder,
                  ]}
                >
                  <View style={s.weeklyDayPill}>
                    <Text style={s.weeklyDayTxt}>{item.day}</Text>
                  </View>
                  <Text style={s.weeklyTime}>
                    {item.startTime} – {item.endTime}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Card 4: Location ── */}
        <View style={s.card}>
          <View style={s.fieldCard}>
            <View style={[s.fieldIconWrap, { backgroundColor: "#FEF3C7" }]}>
              <Feather name="map-pin" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>ADDRESS</Text>
              <Text style={s.fieldValue}>{job.location}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.directionsBtn}
            onPress={openDirections}
            activeOpacity={0.75}
          >
            <Feather name="navigation" size={15} color={BLUE} />
            <Text style={s.directionsTxt}>Get Directions</Text>
          </TouchableOpacity>
        </View>

        {/* ── Card 5: Report To ── */}
        <View style={s.card}>
          <View style={s.fieldCard}>
            <View style={[s.fieldIconWrap, { backgroundColor: "#F5F3FF" }]}>
              <Feather name="user" size={18} color="#7C3AED" />
            </View>
            <View>
              <Text style={s.fieldLabel}>REPORT TO</Text>
              <Text style={s.fieldValue}>Hiring Manager</Text>
            </View>
          </View>
        </View>

        {/* ── Card 6: Job Description ── */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Job Description</Text>
          <View style={s.sectionDivider} />
          <Text style={s.description}>{job.description}</Text>
          {job.requirements.map((r, i) => (
            <View key={i} style={s.bulletRow}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletTxt}>{r}</Text>
            </View>
          ))}
        </View>

        {/* ── Trust strip ── */}
        <View style={s.trustStrip}>
          {[
            { icon: "shield" as const,  txt: "Background Checked" },
            { icon: "zap"    as const,  txt: "Fast Payment"       },
            { icon: "repeat" as const,  txt: "Flexible Hours"     },
          ].map((t) => (
            <View key={t.txt} style={s.trustItem}>
              <Feather name={t.icon} size={13} color={GREEN} />
              <Text style={s.trustTxt}>{t.txt}</Text>
            </View>
          ))}
        </View>

        <Text style={s.postedTxt}>Posted {job.postedAt}</Text>
      </ScrollView>

      {/* ── Sticky bottom ── */}
      <View style={[s.footer, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8) }]}>
        {isWorker ? (
          hasApplied ? (
            <>
              <TouchableOpacity style={s.cancelRow} activeOpacity={0.8}>
                <Feather name="alert-triangle" size={16} color={RED} />
                <Text style={s.cancelTxt}>Cancel this Shift</Text>
              </TouchableOpacity>
              <Text style={s.cancelNote}>Cancellation policies apply.</Text>
            </>
          ) : (
            <TouchableOpacity
              style={s.applyBtn}
              onPress={() => setShowModal(true)}
              activeOpacity={0.85}
            >
              <Feather name="send" size={18} color="#fff" />
              <Text style={s.applyBtnTxt}>Apply Now — 1 Tap</Text>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity style={s.applyBtn} activeOpacity={0.85}>
            <Feather name="users" size={18} color="#fff" />
            <Text style={s.applyBtnTxt}>View Applicants</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Apply modal ── */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Apply to {job.title}</Text>
            <Text style={s.sheetSub}>Add an optional note to stand out</Text>
            <TextInput
              style={s.noteInput}
              placeholder="Tell them why you're a great fit…"
              placeholderTextColor={LABEL}
              multiline
              numberOfLines={4}
              value={coverNote}
              onChangeText={setCoverNote}
            />
            <TouchableOpacity style={s.submitBtn} onPress={submitApplication} activeOpacity={0.85}>
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={s.submitTxt}>Submit Application</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.sheetCancel} onPress={() => setShowModal(false)}>
              <Text style={s.sheetCancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: BG },
  notFound:   { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, backgroundColor: BG },
  notFoundTxt:{ fontSize: 16, color: MUTED },

  /* top bar */
  topBar: {
    backgroundColor: BLUE_BG,
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn:   { padding: 2 },
  urgentPill:{
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  urgentDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FCA5A5" },
  urgentPillTxt:{ fontSize: 12, fontWeight: "700", color: "#fff" },

  /* scroll */
  scroll: { padding: 14, gap: 12 },

  /* card */
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  /* field card row */
  fieldCard:     { flexDirection: "row", alignItems: "center", gap: 14 },
  fieldIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  fieldDivider:  { height: 1, backgroundColor: BORDER, marginVertical: 14 },

  /* date grid */
  dateGrid: {
    flexDirection: "row",
    backgroundColor: "#f8faff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8effd",
    overflow: "hidden",
    marginBottom: 10,
  },
  dateCell:        { flex: 1, padding: 12, gap: 4 },
  dateCellDivider: { width: 1, backgroundColor: "#e8effd" },
  dateIconBox: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },

  /* timing row */
  timingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fffbeb",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
    padding: 12,
  },
  durationBadge: {
    backgroundColor: "#D97706",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  durationBadgeTxt: { color: "#fff", fontSize: 11, fontWeight: "800" },

  /* weekly schedule */
  weeklyWrap: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#fde68a",
    paddingTop: 10,
  },
  weeklyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  weeklyRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  weeklyDayPill: {
    backgroundColor: "#fff7ed",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#fed7aa",
    minWidth: 52,
    alignItems: "center",
  },
  weeklyDayTxt: { fontSize: 12, fontWeight: "800", color: "#c2410c" },
  weeklyTime:   { fontSize: 13, fontWeight: "700", color: DARK },

  /* Card 1 */
  titleRow:   { flexDirection: "row", alignItems: "flex-start" },
  title:      { flex: 1, fontSize: 22, fontWeight: "800", color: DARK, letterSpacing: -0.3, paddingRight: 10 },
  payBadge:   { backgroundColor: GREEN_BG, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center", minWidth: 74 },
  payTotal:   { fontSize: 20, fontWeight: "800", color: GREEN },
  payRate:    { fontSize: 11, color: GREEN, fontWeight: "500", marginTop: 2 },
  divider:    { height: 1, backgroundColor: BORDER, marginBottom: 14 },

  /* shared info row */
  infoRow:   { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 14 },
  infoIcon:  { marginTop: 2 },
  fieldLabel:{ fontSize: 10, fontWeight: "700", color: LABEL, letterSpacing: 0.8, marginBottom: 3 },
  fieldValue:{ fontSize: 15, fontWeight: "700", color: DARK },

  /* Card 2 */
  sectionTitle:  { fontSize: 16, fontWeight: "700", color: DARK },
  sectionDivider:{ height: 1, backgroundColor: BORDER, marginTop: 12, marginBottom: 14 },
  directionsBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1.5, borderColor: "#BFDBFE",
    borderRadius: 12, paddingVertical: 12,
    marginTop: 14,
    backgroundColor: "#EFF6FF",
  },
  directionsTxt: { fontSize: 14, fontWeight: "700", color: BLUE },

  /* Card 3 */
  description:{ fontSize: 14, lineHeight: 22, color: MUTED, marginBottom: 12 },
  bulletRow:  { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  bulletDot:  { fontSize: 14, color: MID, lineHeight: 20 },
  bulletTxt:  { flex: 1, fontSize: 14, lineHeight: 20, color: MID },

  /* trust strip */
  trustStrip: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  trustItem:  {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#F0FDF4", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  trustTxt:   { fontSize: 12, fontWeight: "600", color: GREEN },

  postedTxt: { textAlign: "center", fontSize: 12, color: LABEL },

  /* footer */
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: CARD,
    borderTopWidth: 1, borderTopColor: BORDER,
    paddingHorizontal: 20, paddingTop: 14,
    alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 6,
    elevation: 8,
  },
  applyBtn:{
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: BLUE,
    paddingVertical: 17, borderRadius: 14, width: "100%",
  },
  applyBtnTxt: { fontSize: 17, fontWeight: "800", color: "#fff" },
  cancelRow:   { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 6 },
  cancelTxt:   { fontSize: 16, fontWeight: "700", color: RED },
  cancelNote:  { fontSize: 12, color: LABEL, marginTop: 3 },

  /* modal */
  overlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet:       { backgroundColor: CARD, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 24, paddingTop: 12 },
  sheetHandle: { width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: "center", marginBottom: 22 },
  sheetTitle:  { fontSize: 20, fontWeight: "800", color: DARK, marginBottom: 4 },
  sheetSub:    { fontSize: 14, color: MUTED, marginBottom: 16 },
  noteInput:   {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    padding: 14, fontSize: 14, color: DARK, backgroundColor: BG,
    minHeight: 100, textAlignVertical: "top", marginBottom: 16,
  },
  submitBtn:   {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: BLUE, paddingVertical: 16, borderRadius: 12, marginBottom: 10,
  },
  submitTxt:   { color: "#fff", fontSize: 16, fontWeight: "700" },
  sheetCancel: { paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1.5, borderColor: BORDER },
  sheetCancelTxt:{ fontSize: 15, color: MUTED, fontWeight: "500" },
});

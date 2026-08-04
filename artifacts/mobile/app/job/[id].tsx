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
import { LinearGradient } from "expo-linear-gradient";
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
const BLUE       = "#2563EB";
const BLUE_MID   = "#1D4ED8";
const BLUE_DARK  = "#1E3A8A";
const GREEN      = "#059669";
const GREEN_BG   = "#ECFDF5";
const RED        = "#DC2626";
const BG         = "#F0F4F8";
const CARD       = "#FFFFFF";
const BORDER     = "#E5E7EB";
const DARK       = "#0F172A";
const MID        = "#334155";
const MUTED      = "#64748B";
const LABEL      = "#94A3B8";

// ─── Day abbreviation map ──────────────────────────────────────────────────────
const DAY_COLOR: Record<string, string> = {
  Mon: "#3B82F6", Tue: "#8B5CF6", Wed: "#06B6D4",
  Thu: "#10B981", Fri: "#F59E0B", Sat: "#EF4444", Sun: "#EC4899",
};

// ─── component ────────────────────────────────────────────────────────────────
export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets  = useSafeAreaInsets();
  const { getJobById, applyToJob, applications } = useJobs();
  const { userRole } = useApp();

  const [showModal, setShowModal]             = useState(false);
  const [coverNote, setCoverNote]             = useState("");
  const [applied, setApplied]                 = useState(false);
  const [showAllSchedule, setShowAllSchedule] = useState(false);

  const job        = getJobById(id);
  const hasApplied = applied || applications.some((a) => a.jobId === id && a.workerId === "me");
  const isWorker   = userRole !== "employer";

  if (!job) {
    return (
      <View style={s.notFound}>
        <View style={s.notFoundIcon}>
          <Feather name="briefcase" size={32} color={MUTED} />
        </View>
        <Text style={s.notFoundTitle}>Job not found</Text>
        <Text style={s.notFoundSub}>This listing may have been removed</Text>
        <TouchableOpacity style={s.notFoundBtn} onPress={() => router.back()}>
          <Text style={s.notFoundBtnTxt}>Browse Jobs</Text>
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

  const total  = totalPay(job.pay, job.payType, job.duration);
  const rate   = rateLabel(job.pay, job.payType);
  const hrs    = extractHours(job.duration);
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={s.root}>

      {/* ── Hero gradient header ── */}
      <LinearGradient
        colors={[BLUE_DARK, BLUE_MID, BLUE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.hero, { paddingTop: topPad + 12 }]}
      >
        {/* nav row */}
        <View style={s.navRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          {job.urgency === "urgent" && (
            <View style={s.urgentPill}>
              <View style={s.urgentDot} />
              <Text style={s.urgentTxt}>Urgent Hire</Text>
            </View>
          )}
          <TouchableOpacity style={s.shareBtn} hitSlop={12}>
            <Feather name="share-2" size={18} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>

        {/* Title + company */}
        <View style={s.heroBody}>
          <Text style={s.heroTitle}>{job.title}</Text>
          <View style={s.heroMeta}>
            <Feather name="map-pin" size={13} color="rgba(255,255,255,0.75)" />
            <Text style={s.heroMetaTxt}>{job.location}</Text>
          </View>
        </View>

        {/* Pay chip */}
        <View style={s.payChip}>
          <View style={s.payChipCell}>
            <Text style={s.payChipTotal}>{total}</Text>
            <Text style={s.payChipSub}>total pay</Text>
          </View>
          <View style={s.payChipDivider} />
          <View style={s.payChipCell}>
            <Text style={s.payChipRate}>{rate}</Text>
            <Text style={s.payChipSub}>rate</Text>
          </View>
          <View style={s.payChipDivider} />
          <View style={s.payChipCell}>
            <Text style={s.payChipRate}>{hrs}h</Text>
            <Text style={s.payChipSub}>duration</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Quick-glance chips ── */}
      <View style={s.chipsRow}>
        <View style={s.chip}>
          <Feather name="calendar" size={13} color={BLUE} />
          <Text style={s.chipTxt}>{job.duration}</Text>
        </View>
        <View style={s.chip}>
          <Feather name="clock" size={13} color={BLUE} />
          <Text style={s.chipTxt}>{job.timing ?? "Flexible"}</Text>
        </View>
        {job.weeklySchedule && job.weeklySchedule.length > 0 && (
          <View style={s.chip}>
            <Feather name="repeat" size={13} color={BLUE} />
            <Text style={s.chipTxt}>{job.weeklySchedule.length} days / wk</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Dates ── */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitle}>Schedule</Text>
          </View>
          <View style={s.dateRow}>
            <View style={s.dateBox}>
              <Text style={s.dateLabel}>START DATE</Text>
              <Text style={s.dateValue}>{job.startDate}</Text>
            </View>
            <View style={s.dateArrow}>
              <Feather name="arrow-right" size={16} color={LABEL} />
            </View>
            {job.endDate ? (
              <View style={[s.dateBox, s.dateBoxRight]}>
                <Text style={s.dateLabel}>END DATE</Text>
                <Text style={s.dateValue}>{job.endDate}</Text>
              </View>
            ) : (
              <View style={[s.dateBox, s.dateBoxRight]}>
                <Text style={s.dateLabel}>END DATE</Text>
                <Text style={[s.dateValue, { color: MUTED }]}>Ongoing</Text>
              </View>
            )}
          </View>

          {/* Weekly schedule */}
          {job.weeklySchedule && job.weeklySchedule.length > 0 && (
            <View style={s.scheduleWrap}>
              <Text style={s.scheduleHeading}>Weekly Schedule</Text>
              {(showAllSchedule ? job.weeklySchedule : job.weeklySchedule.slice(0, 2)).map(
                (item: WeeklyScheduleDay, i: number) => {
                  const dayColor = DAY_COLOR[item.day] ?? BLUE;
                  return (
                    <View key={i} style={s.scheduleRow}>
                      <View style={[s.dayPill, { backgroundColor: dayColor + "18" }]}>
                        <Text style={[s.dayPillTxt, { color: dayColor }]}>{item.day}</Text>
                      </View>
                      <View style={s.timeLine} />
                      <View style={s.timeRange}>
                        <Feather name="clock" size={12} color={MUTED} />
                        <Text style={s.timeRangeTxt}>{item.startTime} – {item.endTime}</Text>
                      </View>
                    </View>
                  );
                }
              )}
              {job.weeklySchedule.length > 2 && (
                <TouchableOpacity
                  style={s.seeMoreBtn}
                  onPress={() => setShowAllSchedule((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={s.seeMoreTxt}>
                    {showAllSchedule ? "Show less" : `Show ${job.weeklySchedule.length - 3} more days`}
                  </Text>
                  <Feather
                    name={showAllSchedule ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={BLUE}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── Location ── */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitle}>Location</Text>
          </View>
          <View style={s.locationRow}>
            <View style={s.locationIconWrap}>
              <Feather name="map-pin" size={18} color={BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.locationValue}>{job.location}</Text>
              <Text style={s.locationSub}>Click below for directions</Text>
            </View>
          </View>
          <TouchableOpacity style={s.directionsBtn} onPress={openDirections} activeOpacity={0.8}>
            <Feather name="navigation" size={15} color="#fff" />
            <Text style={s.directionsTxt}>Get Directions</Text>
          </TouchableOpacity>
        </View>

        {/* ── Report To ── */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitle}>Report To</Text>
          </View>
          <View style={s.reportRow}>
            <View style={s.avatarWrap}>
              <Text style={s.avatarInitial}>HM</Text>
            </View>
            <View>
              <Text style={s.reportName}>Hiring Manager</Text>
              <Text style={s.reportSub}>On-site supervisor</Text>
            </View>
          </View>
        </View>

        {/* ── Job Description ── */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitle}>About This Job</Text>
          </View>
          <Text style={s.description}>{job.description}</Text>
          {job.requirements.map((r, i) => (
            <View key={i} style={s.requireRow}>
              <View style={s.requireDot} />
              <Text style={s.requireTxt}>{r}</Text>
            </View>
          ))}
        </View>

        {/* ── Uniform ── */}
        {job.uniform && job.uniform.length > 0 && (
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <View style={s.cardTitleIcon}>
                <Feather name="tag" size={14} color="#7C3AED" />
              </View>
              <Text style={s.cardTitle}>Uniform Required</Text>
            </View>
            {job.uniform.map((item, i) => (
              <View key={i} style={s.listRow}>
                <Feather name="check-circle" size={16} color="#7C3AED" />
                <Text style={s.listTxt}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Instructions ── */}
        {job.instructions && job.instructions.length > 0 && (
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <View style={s.cardTitleIcon}>
                <Feather name="clipboard" size={14} color={BLUE} />
              </View>
              <Text style={s.cardTitle}>Instructions</Text>
            </View>
            {job.instructions.map((item, i) => (
              <View key={i} style={s.listRow}>
                <Feather name="check-circle" size={16} color={BLUE} />
                <Text style={s.listTxt}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={s.postedTxt}>Posted {job.postedAt}</Text>
      </ScrollView>

      {/* ── Sticky footer ── */}
      <View style={[s.footer, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 10) }]}>
        {isWorker ? (
          hasApplied ? (
            <View style={s.appliedState}>
              <View style={s.appliedBadge}>
                <Feather name="check-circle" size={18} color={GREEN} />
                <Text style={s.appliedBadgeTxt}>Application Submitted</Text>
              </View>
              <TouchableOpacity style={s.cancelBtn} activeOpacity={0.8}>
                <Text style={s.cancelBtnTxt}>Cancel Application</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={s.applyBtn}
              onPress={() => setShowModal(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[BLUE, BLUE_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.applyBtnGrad}
              >
                <Feather name="send" size={18} color="#fff" />
                <Text style={s.applyBtnTxt}>Apply Now</Text>
                <View style={s.applyBtnPill}>
                  <Text style={s.applyBtnPillTxt}>1 Tap</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity style={s.applyBtn} activeOpacity={0.85}>
            <LinearGradient
              colors={[BLUE, BLUE_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.applyBtnGrad}
            >
              <Feather name="users" size={18} color="#fff" />
              <Text style={s.applyBtnTxt}>View Applicants</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Apply modal ── */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <View>
                <Text style={s.sheetTitle}>Apply to this Job</Text>
                <Text style={s.sheetSub}>{job.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)} style={s.sheetClose}>
                <Feather name="x" size={18} color={MUTED} />
              </TouchableOpacity>
            </View>
            <Text style={s.sheetPrompt}>Add an optional note to stand out from other applicants</Text>
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
              <LinearGradient
                colors={[BLUE, BLUE_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.submitBtnGrad}
              >
                <Feather name="check-circle" size={18} color="#fff" />
                <Text style={s.submitTxt}>Submit Application</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={s.sheetCancelBtn} onPress={() => setShowModal(false)}>
              <Text style={s.sheetCancelTxt}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  /* not-found */
  notFound:        { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, backgroundColor: BG, padding: 24 },
  notFoundIcon:    { width: 72, height: 72, borderRadius: 36, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center", marginBottom: 4 },
  notFoundTitle:   { fontSize: 18, fontWeight: "700", color: DARK },
  notFoundSub:     { fontSize: 14, color: MUTED, textAlign: "center" },
  notFoundBtn:     { backgroundColor: BLUE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  notFoundBtnTxt:  { color: "#fff", fontWeight: "700", fontSize: 15 },

  /* hero */
  hero: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn:  { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  urgentPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    marginLeft: 8,
  },
  urgentDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#FCA5A5" },
  urgentTxt: { fontSize: 11, fontWeight: "700", color: "#fff" },
  shareBtn:  { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", justifyContent: "center", alignItems: "center", marginLeft: "auto" },

  heroBody:    { marginBottom: 12 },
  heroTitle:   { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: -0.3, lineHeight: 26, marginBottom: 5 },
  heroMeta:    { flexDirection: "row", alignItems: "center", gap: 5 },
  heroMetaTxt: { fontSize: 13, color: "rgba(255,255,255,0.78)", fontWeight: "500" },

  /* pay chip */
  payChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingVertical: 9,
  },
  payChipCell:    { flex: 1, alignItems: "center" },
  payChipLeft:    {},
  payChipRight:   {},
  payChipDivider: { width: 1, height: 22, backgroundColor: "rgba(255,255,255,0.3)" },
  payChipTotal:   { fontSize: 16, fontWeight: "800", color: "#fff" },
  payChipRate:    { fontSize: 14, fontWeight: "700", color: "#fff" },
  payChipSub:     { fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: "500", marginTop: 1 },
  payChipLabel:   { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" },

  /* quick chips */
  chipsRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: CARD,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1, borderColor: "#DBEAFE",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  chipTxt: { fontSize: 11, fontWeight: "600", color: BLUE },

  /* scroll */
  scroll: { paddingHorizontal: 14, gap: 8 },

  /* card */
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 },
  cardTitleIcon:{ width: 24, height: 24, borderRadius: 7, backgroundColor: "#F5F3FF", justifyContent: "center", alignItems: "center" },
  cardTitle:    { fontSize: 14, fontWeight: "700", color: DARK },

  /* dates */
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    overflow: "hidden",
    marginBottom: 4,
  },
  dateBox:       { flex: 1, padding: 10 },
  dateBoxRight:  { borderLeftWidth: 1, borderLeftColor: "#DBEAFE" },
  dateArrow:     { paddingHorizontal: 2 },
  dateLabel:     { fontSize: 9, fontWeight: "700", color: LABEL, letterSpacing: 0.8, marginBottom: 2 },
  dateValue:     { fontSize: 13, fontWeight: "700", color: DARK },

  /* schedule */
  scheduleWrap:    { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER },
  scheduleHeading: { fontSize: 11, fontWeight: "600", color: MUTED, marginBottom: 6 },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dayPill:    { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, minWidth: 44, alignItems: "center" },
  dayPillTxt: { fontSize: 11, fontWeight: "800" },
  timeLine:   { flex: 1, height: 1, backgroundColor: "#F1F5F9", marginHorizontal: 8 },
  timeRange:  { flexDirection: "row", alignItems: "center", gap: 4 },
  timeRangeTxt:{ fontSize: 12, fontWeight: "600", color: MID },
  seeMoreBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
    paddingTop: 8, marginTop: 2,
  },
  seeMoreTxt: { fontSize: 12, fontWeight: "600", color: BLUE },

  /* location */
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  locationIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center", alignItems: "center",
  },
  locationValue: { fontSize: 14, fontWeight: "700", color: DARK, marginBottom: 1 },
  locationSub:   { fontSize: 12, color: MUTED },
  directionsBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    backgroundColor: BLUE, borderRadius: 11, paddingVertical: 10,
  },
  directionsTxt: { fontSize: 13, fontWeight: "700", color: "#fff" },

  /* report to */
  reportRow:     { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarWrap:    { width: 36, height: 36, borderRadius: 18, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 12, fontWeight: "800", color: BLUE },
  reportName:    { fontSize: 14, fontWeight: "700", color: DARK },
  reportSub:     { fontSize: 12, color: MUTED, marginTop: 1 },

  /* description */
  description: { fontSize: 13, lineHeight: 20, color: MID, marginBottom: 8 },
  requireRow:  { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 5 },
  requireDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: BLUE, marginTop: 7, flexShrink: 0 },
  requireTxt:  { flex: 1, fontSize: 13, lineHeight: 19, color: MID },

  /* lists (uniform/instructions) */
  listRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 7 },
  listTxt: { flex: 1, fontSize: 13, lineHeight: 19, color: MID },

  postedTxt: { textAlign: "center", fontSize: 11, color: LABEL, marginVertical: 4 },

  /* footer */
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: CARD,
    borderTopWidth: 1, borderTopColor: BORDER,
    paddingHorizontal: 20, paddingTop: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 10,
    elevation: 12,
  },
  applyBtn:       { borderRadius: 16, overflow: "hidden", width: "100%" },
  applyBtnGrad:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17 },
  applyBtnTxt:    { fontSize: 17, fontWeight: "800", color: "#fff" },
  applyBtnPill:   { backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  applyBtnPillTxt:{ fontSize: 11, fontWeight: "700", color: "#fff" },

  /* applied state */
  appliedState: { alignItems: "center", width: "100%", gap: 10 },
  appliedBadge: { flexDirection: "row", alignItems: "center", gap: 8 },
  appliedBadgeTxt:{ fontSize: 16, fontWeight: "700", color: GREEN },
  cancelBtn:    { paddingVertical: 8 },
  cancelBtnTxt: { fontSize: 13, color: RED, fontWeight: "600" },

  /* modal */
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet:   {
    backgroundColor: CARD,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingTop: 12,
  },
  sheetHandle:  { width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetHeader:  { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 },
  sheetClose:   { width: 34, height: 34, borderRadius: 17, backgroundColor: BG, justifyContent: "center", alignItems: "center" },
  sheetTitle:   { fontSize: 20, fontWeight: "800", color: DARK },
  sheetSub:     { fontSize: 14, color: MUTED, marginTop: 2 },
  sheetPrompt:  { fontSize: 14, color: MUTED, marginBottom: 14 },
  noteInput:    {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 14,
    padding: 14, fontSize: 14, color: DARK, backgroundColor: BG,
    minHeight: 100, textAlignVertical: "top", marginBottom: 16,
  },
  submitBtn:      { borderRadius: 14, overflow: "hidden", marginBottom: 10 },
  submitBtnGrad:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  submitTxt:      { color: "#fff", fontSize: 16, fontWeight: "700" },
  sheetCancelBtn: { paddingVertical: 14, alignItems: "center" },
  sheetCancelTxt: { fontSize: 15, color: MUTED, fontWeight: "500" },
});

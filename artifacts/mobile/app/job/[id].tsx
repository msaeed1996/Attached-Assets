import React, { useState, useRef, useEffect } from "react";
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
  Animated,
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
  if (payType === "hourly") return `$${pay} / hr`;
  if (payType === "daily") return `$${pay} / day`;
  return `$${pay} fixed`;
}
function rateNumber(pay: number, payType: string) {
  return `$${pay}`;
}
function rateUnit(payType: string) {
  if (payType === "hourly") return "/ hr";
  if (payType === "daily") return "/ day";
  return "fixed";
}

// ─── palette ──────────────────────────────────────────────────────────────────
const PRIMARY    = "#2F5BFF";
const PRIMARY_LT = "#4D73FF";
const BG         = "#F6F8FC";
const CARD       = "#FFFFFF";
const DARK       = "#111827";
const MID        = "#667085";
const BORDER     = "#E8EDF5";
const SUCCESS    = "#12B76A";
const WARNING    = "#F79009";
const ERROR      = "#F04438";
const LABEL      = "#9CA3AF";

const DAY_COLORS: Record<string, string> = {
  Mon: "#2F5BFF", Tue: "#7C3AED", Wed: "#0891B2",
  Thu: "#059669", Fri: "#D97706", Sat: "#DC2626", Sun: "#DB2777",
};

// ─── Animated card wrapper ────────────────────────────────────────────────────
function AnimCard({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ─── component ────────────────────────────────────────────────────────────────
export default function JobDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const insets   = useSafeAreaInsets();
  const { getJobById, applyToJob, applications } = useJobs();
  const { userRole } = useApp();

  const [showModal, setShowModal]             = useState(false);
  const [coverNote, setCoverNote]             = useState("");
  const [applied, setApplied]                 = useState(false);
  const [showAllSchedule, setShowAllSchedule] = useState(false);
  const [saved, setSaved]                     = useState(false);

  const footerShadow = useRef(new Animated.Value(4)).current;

  const job        = getJobById(id);
  const hasApplied = applied || applications.some((a) => a.jobId === id && a.workerId === "me");
  const isWorker   = userRole !== "employer";
  const topPad     = Platform.OS === "web" ? insets.top + 67 : insets.top;

  if (!job) {
    return (
      <View style={s.notFound}>
        <View style={s.notFoundIcon}><Feather name="briefcase" size={32} color={MID} /></View>
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

  const total = totalPay(job.pay, job.payType, job.duration);
  const hrs   = extractHours(job.duration);

  const highlights = [
    { icon: "📅", label: job.weeklySchedule && job.weeklySchedule.length > 0 ? `Mon–Fri` : job.duration },
    { icon: "⏰", label: job.timing ?? job.duration },
    { icon: "💰", label: "Weekly Pay" },
    { icon: "⚡", label: "Immediate Start" },
  ];

  const scheduleVisible = showAllSchedule
    ? job.weeklySchedule ?? []
    : (job.weeklySchedule ?? []).slice(0, 2);

  return (
    <View style={s.root}>

      {/* ══════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════ */}
      <LinearGradient
        colors={[PRIMARY_LT, PRIMARY, "#1A3FCC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1.2 }}
        style={[s.hero, { paddingTop: topPad + 12 }]}
      >
        {/* nav */}
        <View style={s.navRow}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => router.back()}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={s.navCenter}>
            {job.urgency === "urgent" && (
              <View style={s.urgentBadge}>
                <View style={s.urgentDot} />
                <Text style={s.urgentTxt}>Urgent Hire</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => { setSaved(v => !v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Feather name={saved ? "bookmark" : "bookmark"} size={20} color={saved ? "#FBBF24" : "#fff"} />
          </TouchableOpacity>
        </View>

        {/* title block */}
        <View style={s.heroTitleBlock}>
          <Text style={s.heroTitle}>{job.title}</Text>
          <Text style={s.heroCompany}>TrueGigs Employer</Text>
          <View style={s.heroLocationRow}>
            <Feather name="map-pin" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={s.heroLocationTxt}>{job.location}</Text>
          </View>
        </View>

        {/* salary dominates */}
        <View style={s.salaryBlock}>
          <View style={s.salaryRow}>
            <Text style={s.salaryBig}>{rateNumber(job.pay, job.payType)}</Text>
            <Text style={s.salaryUnit}>{rateUnit(job.payType)}</Text>
          </View>
          <View style={s.salaryMeta}>
            <Text style={s.salaryMetaItem}>{total} Total</Text>
            <Text style={s.salaryMetaDot}>·</Text>
            <Text style={s.salaryMetaItem}>{hrs}h</Text>
            {job.startDate ? (
              <>
                <Text style={s.salaryMetaDot}>·</Text>
                <Text style={s.salaryMetaItem}>{job.startDate}{job.endDate ? ` – ${job.endDate}` : ""}</Text>
              </>
            ) : null}
          </View>
          {job.timing ? (
            <Text style={s.salaryTiming}>{job.timing}</Text>
          ) : null}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const elevated = nativeEvent.contentOffset.y > 20;
          Animated.timing(footerShadow, { toValue: elevated ? 14 : 4, duration: 200, useNativeDriver: false }).start();
        }}
        scrollEventThrottle={16}
      >

        {/* ══════════════════════════════════════════════
            2. QUICK HIGHLIGHTS
        ══════════════════════════════════════════════ */}
        <AnimCard delay={60}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsScroll} contentContainerStyle={s.chipsContent}>
            {highlights.map((h, i) => (
              <View key={i} style={s.chip}>
                <Text style={s.chipIcon}>{h.icon}</Text>
                <Text style={s.chipTxt}>{h.label}</Text>
              </View>
            ))}
          </ScrollView>
        </AnimCard>

        {/* ══════════════════════════════════════════════
            3. JOB SNAPSHOT
        ══════════════════════════════════════════════ */}
        <AnimCard delay={100} style={s.card}>
          <Text style={s.sectionHeading}>Job Snapshot</Text>
          <View style={s.snapshotGrid}>
            {[
              { icon: "dollar-sign", color: SUCCESS,  label: "Pay",      value: rateLabel(job.pay, job.payType) },
              { icon: "clock",       color: PRIMARY,   label: "Duration", value: job.duration },
              { icon: "sun",         color: WARNING,   label: "Shift",    value: job.timing ?? "See schedule" },
              { icon: "map-pin",     color: "#7C3AED", label: "Location", value: job.location },
              { icon: "briefcase",   color: "#0891B2", label: "Type",     value: "Temporary" },
              { icon: "zap",         color: ERROR,     label: "Urgency",  value: job.urgency === "urgent" ? "Urgent" : "Standard" },
            ].map((item, i) => (
              <View key={i} style={s.snapshotItem}>
                <View style={[s.snapshotIconWrap, { backgroundColor: item.color + "15" }]}>
                  <Feather name={item.icon as any} size={15} color={item.color} />
                </View>
                <Text style={s.snapshotLabel}>{item.label}</Text>
                <Text style={s.snapshotValue} numberOfLines={1}>{item.value}</Text>
              </View>
            ))}
          </View>
        </AnimCard>

        {/* ══════════════════════════════════════════════
            4. SCHEDULE
        ══════════════════════════════════════════════ */}
        {job.weeklySchedule && job.weeklySchedule.length > 0 && (
          <AnimCard delay={140} style={s.card}>
            <Text style={s.sectionHeading}>Weekly Schedule</Text>
            <View style={s.scheduleWrap}>
              {scheduleVisible.map((item: WeeklyScheduleDay, i: number) => {
                const color = DAY_COLORS[item.day] ?? PRIMARY;
                return (
                  <View key={i} style={s.scheduleRow}>
                    <View style={[s.dayBadge, { backgroundColor: color }]}>
                      <Text style={s.dayBadgeTxt}>{item.day.toUpperCase()}</Text>
                    </View>
                    <View style={s.scheduleDots}>
                      {Array.from({ length: 18 }).map((_, d) => (
                        <View key={d} style={[s.dot, { backgroundColor: color + "40" }]} />
                      ))}
                    </View>
                    <View style={s.timeBlock}>
                      <Text style={s.timeFrom}>{item.startTime}</Text>
                      <Feather name="arrow-right" size={11} color={MID} style={{ marginHorizontal: 3 }} />
                      <Text style={s.timeTo}>{item.endTime}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            {job.weeklySchedule.length > 2 && (
              <TouchableOpacity
                style={s.seeMoreBtn}
                onPress={() => setShowAllSchedule(v => !v)}
                activeOpacity={0.7}
              >
                <Text style={s.seeMoreTxt}>
                  {showAllSchedule ? "Show less" : `Show ${job.weeklySchedule.length - 2} more days`}
                </Text>
                <Feather name={showAllSchedule ? "chevron-up" : "chevron-down"} size={14} color={PRIMARY} />
              </TouchableOpacity>
            )}
          </AnimCard>
        )}

        {/* ══════════════════════════════════════════════
            5. LOCATION
        ══════════════════════════════════════════════ */}
        <AnimCard delay={180} style={s.card}>
          <Text style={s.sectionHeading}>Location</Text>
          {/* Map placeholder */}
          <View style={s.mapPlaceholder}>
            <LinearGradient colors={["#E8EDF5", "#D1D9EC"]} style={s.mapGrad}>
              <View style={s.mapPin}>
                <Feather name="map-pin" size={22} color={PRIMARY} />
              </View>
              <Text style={s.mapPlaceholderTxt}>Map Preview</Text>
            </LinearGradient>
          </View>
          <View style={s.locationInfo}>
            <View style={s.locationLeft}>
              <Text style={s.locationValue}>{job.location}</Text>
              <Text style={s.locationSub}>📍 ~2.4 miles away</Text>
            </View>
          </View>
          <TouchableOpacity style={s.directionsBtn} onPress={openDirections} activeOpacity={0.85}>
            <LinearGradient colors={[PRIMARY_LT, PRIMARY]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.directionsBtnGrad}>
              <Feather name="navigation" size={15} color="#fff" />
              <Text style={s.directionsTxt}>Get Directions</Text>
            </LinearGradient>
          </TouchableOpacity>
        </AnimCard>

        {/* ══════════════════════════════════════════════
            6. HIRING MANAGER
        ══════════════════════════════════════════════ */}
        <AnimCard delay={200} style={s.card}>
          <Text style={s.sectionHeading}>Report To</Text>
          <View style={s.managerRow}>
            <LinearGradient colors={[PRIMARY_LT, PRIMARY]} style={s.managerAvatar}>
              <Text style={s.managerInitials}>HM</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.managerName}>Hiring Manager</Text>
              <Text style={s.managerRole}>On-site Supervisor</Text>
            </View>
            <TouchableOpacity style={s.managerIconBtn} activeOpacity={0.7}>
              <Feather name="message-circle" size={18} color={PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.managerIconBtn, { marginLeft: 8 }]} activeOpacity={0.7}>
              <Feather name="phone" size={18} color={SUCCESS} />
            </TouchableOpacity>
          </View>
        </AnimCard>

        {/* ══════════════════════════════════════════════
            7. ABOUT JOB (icon rows)
        ══════════════════════════════════════════════ */}
        <AnimCard delay={220} style={s.card}>
          <Text style={s.sectionHeading}>About This Job</Text>
          <Text style={s.bodyTxt}>{job.description}</Text>
          {job.requirements.map((r, i) => (
            <View key={i} style={s.iconRow}>
              <View style={s.iconRowBadge}>
                <Text style={s.iconRowEmoji}>
                  {["📦", "🚚", "📋", "⚙️", "🔧", "📊"][i % 6]}
                </Text>
              </View>
              <Text style={s.iconRowTxt}>{r}</Text>
            </View>
          ))}
        </AnimCard>

        {/* ══════════════════════════════════════════════
            8. REQUIREMENTS (card rows)
        ══════════════════════════════════════════════ */}
        {job.requirements.length > 0 && (
          <AnimCard delay={240} style={s.card}>
            <Text style={s.sectionHeading}>Requirements</Text>
            {job.requirements.map((r, i) => (
              <View key={i} style={s.requireCard}>
                <Text style={s.requireEmoji}>
                  {["🥾", "🏋", "🛂", "📋", "⚙️", "🔖"][i % 6]}
                </Text>
                <Text style={s.requireTxt}>{r}</Text>
                <Feather name="check-circle" size={16} color={SUCCESS} />
              </View>
            ))}
          </AnimCard>
        )}

        {/* ══════════════════════════════════════════════
            9. UNIFORM (horizontal checklist)
        ══════════════════════════════════════════════ */}
        {job.uniform && job.uniform.length > 0 && (
          <AnimCard delay={260} style={s.card}>
            <Text style={s.sectionHeading}>Uniform Required</Text>
            <View style={s.uniformWrap}>
              {job.uniform.map((item, i) => (
                <View key={i} style={s.uniformChip}>
                  <Feather name="check-circle" size={14} color={SUCCESS} />
                  <Text style={s.uniformTxt}>{item}</Text>
                </View>
              ))}
            </View>
          </AnimCard>
        )}

        {/* ══════════════════════════════════════════════
            10. INSTRUCTIONS (Before You Arrive)
        ══════════════════════════════════════════════ */}
        {job.instructions && job.instructions.length > 0 && (
          <AnimCard delay={280}>
            <LinearGradient
              colors={["#ECFDF5", "#D1FAE5"]}
              style={[s.card, s.instructionsCard]}
            >
              <View style={s.instructionsHeader}>
                <View style={s.instructionsIconWrap}>
                  <Feather name="clipboard" size={18} color={SUCCESS} />
                </View>
                <Text style={[s.sectionHeading, { color: "#065F46" }]}>Before You Arrive</Text>
              </View>
              {job.instructions.map((item, i) => (
                <View key={i} style={s.instructionRow}>
                  <View style={s.instructionCheck}>
                    <Feather name="check" size={12} color="#fff" />
                  </View>
                  <Text style={s.instructionTxt}>{item}</Text>
                </View>
              ))}
            </LinearGradient>
          </AnimCard>
        )}

        {/* ══════════════════════════════════════════════
            11. COMPANY
        ══════════════════════════════════════════════ */}
        <AnimCard delay={300} style={s.card}>
          <View style={s.companyRow}>
            <LinearGradient colors={["#EFF6FF", "#DBEAFE"]} style={s.companyLogo}>
              <Text style={s.companyLogoTxt}>TG</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.companyName}>TrueGigs Employer</Text>
              <View style={s.companyMeta}>
                <View style={s.starsRow}>
                  {[1,2,3,4,5].map(n => (
                    <Feather key={n} name="star" size={11} color={n <= 4 ? WARNING : "#E5E7EB"} />
                  ))}
                </View>
                <Text style={s.companyMetaTxt}>4.0  ·  200–500 employees</Text>
              </View>
            </View>
            <TouchableOpacity style={s.viewCompanyBtn} activeOpacity={0.7}>
              <Text style={s.viewCompanyTxt}>View</Text>
              <Feather name="arrow-right" size={13} color={PRIMARY} />
            </TouchableOpacity>
          </View>
        </AnimCard>

        <Text style={s.postedTxt}>Posted {job.postedAt}</Text>
      </ScrollView>

      {/* ══════════════════════════════════════════════
          12. STICKY BOTTOM CTA
      ══════════════════════════════════════════════ */}
      <Animated.View style={[s.footer, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 10), shadowRadius: footerShadow }]}>
        {isWorker ? (
          hasApplied ? (
            <View style={s.appliedState}>
              <View style={s.appliedRow}>
                <Feather name="check-circle" size={20} color={SUCCESS} />
                <Text style={s.appliedTxt}>Application Submitted</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={s.cancelTxt}>Cancel Application</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={s.applyBtn}
              onPress={() => setShowModal(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[PRIMARY_LT, PRIMARY]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.applyBtnGrad}
              >
                <View style={s.applyBtnInner}>
                  <Text style={s.applyBtnSub}>Ready to start?</Text>
                  <Text style={s.applyBtnMain}>Apply Now</Text>
                </View>
                <View style={s.applyBtnArrow}>
                  <Feather name="send" size={20} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity style={s.applyBtn} activeOpacity={0.85}>
            <LinearGradient
              colors={[PRIMARY_LT, PRIMARY]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.applyBtnGrad}
            >
              <View style={s.applyBtnInner}>
                <Text style={s.applyBtnSub}>Manage this listing</Text>
                <Text style={s.applyBtnMain}>View Applicants</Text>
              </View>
              <View style={s.applyBtnArrow}>
                <Feather name="users" size={20} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── Apply modal ── */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <View>
                <Text style={s.sheetTitle}>Apply Now</Text>
                <Text style={s.sheetSub}>{job.title}</Text>
              </View>
              <TouchableOpacity style={s.sheetClose} onPress={() => setShowModal(false)}>
                <Feather name="x" size={18} color={MID} />
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
                colors={[PRIMARY_LT, PRIMARY]}
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
const CARD_RADIUS = 22;
const CARD_PAD    = 22;

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  notFound:{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12, backgroundColor: BG, padding: 32 },
  notFoundIcon:   { width: 80, height: 80, borderRadius: 40, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  notFoundTitle:  { fontSize: 20, fontWeight: "700", color: DARK },
  notFoundSub:    { fontSize: 15, color: MID, textAlign: "center" },
  notFoundBtn:    { backgroundColor: PRIMARY, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  notFoundBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // ── hero ──
  hero: { paddingHorizontal: 20, paddingBottom: 28 },
  navRow: { flexDirection: "row", alignItems: "center", marginBottom: 22 },
  navCenter: { flex: 1, alignItems: "center" },
  iconBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center",
  },
  urgentBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  urgentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FCA5A5" },
  urgentTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },

  heroTitleBlock: { marginBottom: 20 },
  heroTitle:      { fontSize: 30, fontWeight: "800", color: "#fff", letterSpacing: -0.5, lineHeight: 36, marginBottom: 6 },
  heroCompany:    { fontSize: 15, color: "rgba(255,255,255,0.75)", fontWeight: "500", marginBottom: 5 },
  heroLocationRow:{ flexDirection: "row", alignItems: "center", gap: 5 },
  heroLocationTxt:{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" },

  salaryBlock:  { gap: 6 },
  salaryRow:    { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  salaryBig:    { fontSize: 48, fontWeight: "800", color: "#fff", lineHeight: 52 },
  salaryUnit:   { fontSize: 20, fontWeight: "600", color: "rgba(255,255,255,0.8)", marginBottom: 7 },
  salaryMeta:   { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  salaryMetaItem:{ fontSize: 14, color: "rgba(255,255,255,0.78)", fontWeight: "600" },
  salaryMetaDot: { fontSize: 14, color: "rgba(255,255,255,0.45)" },
  salaryTiming:  { fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: "500" },

  // ── scroll ──
  scroll: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },

  // ── card ──
  card: {
    backgroundColor: CARD,
    borderRadius: CARD_RADIUS,
    padding: CARD_PAD,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeading: { fontSize: 20, fontWeight: "700", color: DARK, marginBottom: 16 },

  // ── chips ──
  chipsScroll:   { marginHorizontal: -16 },
  chipsContent:  { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 30,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4,
    elevation: 2,
  },
  chipIcon: { fontSize: 14 },
  chipTxt:  { fontSize: 13, fontWeight: "600", color: PRIMARY },

  // ── snapshot ──
  snapshotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  snapshotItem: {
    width: "30%",
    flexGrow: 1,
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  snapshotIconWrap: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 2 },
  snapshotLabel:    { fontSize: 11, fontWeight: "600", color: LABEL },
  snapshotValue:    { fontSize: 13, fontWeight: "700", color: DARK },

  // ── schedule ──
  scheduleWrap: { gap: 10 },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  dayBadge:    { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, minWidth: 52, alignItems: "center" },
  dayBadgeTxt: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  scheduleDots:{ flex: 1, flexDirection: "row", gap: 3, alignItems: "center", overflow: "hidden" },
  dot:         { width: 3, height: 3, borderRadius: 2 },
  timeBlock:   { flexDirection: "row", alignItems: "center" },
  timeFrom:    { fontSize: 13, fontWeight: "700", color: DARK },
  timeTo:      { fontSize: 13, fontWeight: "700", color: DARK },
  seeMoreBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 6 },
  seeMoreTxt:  { fontSize: 14, fontWeight: "600", color: PRIMARY },

  // ── location ──
  mapPlaceholder: { borderRadius: 16, overflow: "hidden", marginBottom: 14, height: 120 },
  mapGrad:        { flex: 1, justifyContent: "center", alignItems: "center", gap: 6 },
  mapPin:         { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
  mapPlaceholderTxt: { fontSize: 12, color: MID, fontWeight: "500" },
  locationInfo:   { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  locationLeft:   { flex: 1 },
  locationValue:  { fontSize: 17, fontWeight: "700", color: DARK },
  locationSub:    { fontSize: 13, color: MID, marginTop: 3 },
  directionsBtn:  { borderRadius: 14, overflow: "hidden" },
  directionsBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  directionsTxt:  { fontSize: 15, fontWeight: "700", color: "#fff" },

  // ── manager ──
  managerRow:      { flexDirection: "row", alignItems: "center", gap: 14 },
  managerAvatar:   { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  managerInitials: { fontSize: 18, fontWeight: "800", color: "#fff" },
  managerName:     { fontSize: 17, fontWeight: "700", color: DARK },
  managerRole:     { fontSize: 13, color: MID, marginTop: 2 },
  managerIconBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },

  // ── about / icon rows ──
  bodyTxt:      { fontSize: 15, lineHeight: 24, color: MID, marginBottom: 14 },
  iconRow:      { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  iconRowBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center" },
  iconRowEmoji: { fontSize: 17 },
  iconRowTxt:   { flex: 1, fontSize: 15, color: DARK, fontWeight: "500" },

  // ── requirements ──
  requireCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#F8FAFF",
    borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  requireEmoji: { fontSize: 20 },
  requireTxt:   { flex: 1, fontSize: 15, fontWeight: "500", color: DARK },

  // ── uniform ──
  uniformWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  uniformChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#ECFDF5",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: "#A7F3D0",
  },
  uniformTxt: { fontSize: 13, fontWeight: "600", color: "#065F46" },

  // ── instructions ──
  instructionsCard:   { borderWidth: 0 },
  instructionsHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  instructionsIconWrap:{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#D1FAE5", justifyContent: "center", alignItems: "center" },
  instructionRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  instructionCheck: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: SUCCESS,
    justifyContent: "center", alignItems: "center",
  },
  instructionTxt: { fontSize: 15, fontWeight: "500", color: "#064E3B" },

  // ── company ──
  companyRow:     { flexDirection: "row", alignItems: "center", gap: 14 },
  companyLogo:    { width: 52, height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  companyLogoTxt: { fontSize: 16, fontWeight: "800", color: PRIMARY },
  companyName:    { fontSize: 17, fontWeight: "700", color: DARK, marginBottom: 4 },
  companyMeta:    { flexDirection: "row", alignItems: "center", gap: 5 },
  starsRow:       { flexDirection: "row", gap: 1 },
  companyMetaTxt: { fontSize: 12, color: MID },
  viewCompanyBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
  viewCompanyTxt: { fontSize: 13, fontWeight: "700", color: PRIMARY },

  postedTxt: { textAlign: "center", fontSize: 13, color: LABEL, marginTop: 4 },

  // ── footer ──
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: CARD,
    borderTopWidth: 1, borderTopColor: BORDER,
    paddingHorizontal: 20, paddingTop: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08,
    elevation: 12,
  },
  applyBtn:     { borderRadius: 18, overflow: "hidden", height: 60 },
  applyBtnGrad: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 20 },
  applyBtnInner:{ flex: 1 },
  applyBtnSub:  { fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: "500" },
  applyBtnMain: { fontSize: 19, fontWeight: "800", color: "#fff" },
  applyBtnArrow:{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },

  appliedState: { alignItems: "center", gap: 6 },
  appliedRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  appliedTxt:   { fontSize: 16, fontWeight: "700", color: SUCCESS },
  cancelTxt:    { fontSize: 13, color: ERROR, fontWeight: "600" },

  // ── modal ──
  overlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet:    { backgroundColor: CARD, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingTop: 12 },
  sheetHandle:   { width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: "center", marginBottom: 22 },
  sheetHeader:   { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 },
  sheetClose:    { width: 36, height: 36, borderRadius: 18, backgroundColor: BG, justifyContent: "center", alignItems: "center" },
  sheetTitle:    { fontSize: 22, fontWeight: "800", color: DARK },
  sheetSub:      { fontSize: 14, color: MID, marginTop: 2 },
  sheetPrompt:   { fontSize: 14, color: MID, marginBottom: 14 },
  noteInput:     {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 14,
    padding: 14, fontSize: 15, color: DARK, backgroundColor: BG,
    minHeight: 100, textAlignVertical: "top", marginBottom: 16,
  },
  submitBtn:     { borderRadius: 16, overflow: "hidden", height: 56, marginBottom: 10 },
  submitBtnGrad: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitTxt:     { color: "#fff", fontSize: 16, fontWeight: "700" },
  sheetCancelBtn:{ paddingVertical: 14, alignItems: "center" },
  sheetCancelTxt:{ fontSize: 15, color: MID, fontWeight: "500" },
});

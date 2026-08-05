import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Linking,
  Platform, Modal, Animated,
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
function rateUnit(payType: string) {
  return payType === "hourly" ? "/hr" : payType === "daily" ? "/day" : "fixed";
}

// ─── tokens ───────────────────────────────────────────────────────────────────
const P     = "#2F5BFF";   // primary blue
const P2    = "#4D73FF";   // lighter blue (gradient start)
const BG    = "#F4F6FB";   // page background
const CARD  = "#FFFFFF";
const INK   = "#0D1117";   // text primary
const SUB   = "#6B7280";   // text secondary
const BORD  = "#EAECF2";   // border
const OK    = "#12B76A";   // success green
const WARN  = "#F79009";   // warning amber
const ERR   = "#F04438";   // error red

const DAY_HUE: Record<string, string> = {
  Mon: "#2F5BFF", Tue: "#7C3AED", Wed: "#0891B2",
  Thu: "#059669", Fri: "#D97706", Sat: "#DC2626", Sun: "#DB2777",
};

// ─── FadeSlide card ───────────────────────────────────────────────────────────
function FadeSlide({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty      = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(ty,      { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[{ opacity, transform: [{ translateY: ty }] }, style]}>{children}</Animated.View>;
}

// ─── PressBtn ─────────────────────────────────────────────────────────────────
function PressBtn({ onPress, style, children }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => { Animated.sequence([Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }), Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true })]).start(); onPress?.(); };
  return <Animated.View style={{ transform: [{ scale }] }}><TouchableOpacity onPress={press} style={style} activeOpacity={1}>{children}</TouchableOpacity></Animated.View>;
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHead({ title }: { title: string }) {
  return <Text style={s.sectionHead}>{title}</Text>;
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Div() { return <View style={s.div} />; }

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function JobDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const insets   = useSafeAreaInsets();
  const { getJobById, applyToJob, applications } = useJobs();
  const { userRole } = useApp();

  const [modal, setModal]   = useState(false);
  const [note, setNote]     = useState("");
  const [applied, setApplied] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [saved, setSaved]   = useState(false);

  const job        = getJobById(id);
  const hasApplied = applied || applications.some(a => a.jobId === id && a.workerId === "me");
  const isWorker   = userRole !== "employer";
  const topPad     = Platform.OS === "web" ? insets.top + 67 : insets.top;

  if (!job) return (
    <View style={s.empty}>
      <View style={s.emptyIcon}><Feather name="briefcase" size={28} color={SUB} /></View>
      <Text style={s.emptyTitle}>Job not found</Text>
      <Text style={s.emptySub}>This listing may have been removed.</Text>
      <TouchableOpacity style={s.emptyBtn} onPress={() => router.back()}>
        <Text style={s.emptyBtnTxt}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  function submit() {
    applyToJob(id, note);
    setApplied(true);
    setModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function directions() {
    const q = encodeURIComponent(job.location);
    Linking.openURL(Platform.OS === "ios" ? `maps://maps.apple.com/?q=${q}` : `https://maps.google.com/?q=${q}`).catch(() => {});
  }

  const total  = totalPay(job.pay, job.payType, job.duration);
  const hrs    = extractHours(job.duration);
  const sched  = job.weeklySchedule ?? [];
  const shown  = showAll ? sched : sched.slice(0, 2);

  return (
    <View style={s.root}>

      {/* ── HERO ─────────────────────────────────── */}
      <LinearGradient
        colors={[P2, P, "#1E40AF"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.hero, { paddingTop: topPad + 10 }]}
      >
        {/* nav */}
        <View style={s.nav}>
          <TouchableOpacity style={s.navBtn} onPress={() => router.back()} hitSlop={12} activeOpacity={0.75}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          {job.urgency === "urgent" && (
            <View style={s.urgentBadge}>
              <View style={s.urgentDot} />
              <Text style={s.urgentTxt}>Urgent Hire</Text>
            </View>
          )}
          <TouchableOpacity
            style={s.navBtn}
            hitSlop={12}
            activeOpacity={0.75}
            onPress={() => { setSaved(v => !v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Feather name="bookmark" size={19} color={saved ? "#FBBF24" : "#fff"} />
          </TouchableOpacity>
        </View>

        {/* title */}
        <Text style={s.heroTitle} numberOfLines={2}>{job.title}</Text>
        <Text style={s.heroCompany}>TrueGigs Employer · {job.location}</Text>

        {/* pay */}
        <View style={s.payRow}>
          <Text style={s.payBig}>${job.pay}</Text>
          <Text style={s.payUnit}>{rateUnit(job.payType)}</Text>
        </View>
        <View style={s.payMeta}>
          <View style={s.payMetaChip}><Text style={s.payMetaTxt}>{total} total</Text></View>
          <View style={s.payMetaChip}><Text style={s.payMetaTxt}>{hrs}h</Text></View>
          {job.startDate ? <View style={s.payMetaChip}><Text style={s.payMetaTxt}>{job.startDate}{job.endDate ? ` – ${job.endDate}` : ""}</Text></View> : null}
          {job.timing    ? <View style={s.payMetaChip}><Text style={s.payMetaTxt}>{job.timing}</Text></View> : null}
        </View>
      </LinearGradient>

      {/* ── SCROLL ───────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* quick chips */}
        <FadeSlide delay={50}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
            {[
              { icon: "calendar" as const, txt: job.duration },
              { icon: "clock"    as const, txt: job.timing ?? "Flexible" },
              { icon: "repeat"   as const, txt: `${sched.length > 0 ? sched.length : "?"} days/wk` },
              { icon: "zap"      as const, txt: "Immediate Start" },
              { icon: "dollar-sign" as const, txt: "Weekly Pay" },
            ].map((c, i) => (
              <View key={i} style={s.chip}>
                <Feather name={c.icon} size={12} color={P} />
                <Text style={s.chipTxt}>{c.txt}</Text>
              </View>
            ))}
          </ScrollView>
        </FadeSlide>

        {/* ── SCHEDULE ──────────────────────────── */}
        {sched.length > 0 && (
          <FadeSlide delay={80} style={s.card}>
            <SectionHead title="Schedule" />
            {/* date range */}
            {(job.startDate || job.endDate) && (
              <>
                <View style={s.dateRow}>
                  <View style={s.dateBox}>
                    <Text style={s.dateLabel}>START</Text>
                    <Text style={s.dateVal}>{job.startDate ?? "—"}</Text>
                  </View>
                  <Feather name="arrow-right" size={16} color={BORD} />
                  <View style={[s.dateBox, { alignItems: "flex-end" }]}>
                    <Text style={s.dateLabel}>END</Text>
                    <Text style={s.dateVal}>{job.endDate ?? "Ongoing"}</Text>
                  </View>
                </View>
                <Div />
              </>
            )}
            {/* rows */}
            {shown.map((item: WeeklyScheduleDay, i: number) => {
              const col = DAY_HUE[item.day] ?? P;
              return (
                <View key={i} style={[s.schedRow, i < shown.length - 1 && s.schedRowBorder]}>
                  <View style={[s.dayTag, { backgroundColor: col + "18", borderColor: col + "40" }]}>
                    <Text style={[s.dayTagTxt, { color: col }]}>{item.day.slice(0,3).toUpperCase()}</Text>
                  </View>
                  <View style={s.schedDots}>
                    {Array.from({ length: 16 }).map((_, d) => <View key={d} style={[s.dotPx, { backgroundColor: col + "30" }]} />)}
                  </View>
                  <View style={s.schedTime}>
                    <Text style={s.schedTimeTxt}>{item.startTime}</Text>
                    <Text style={s.schedTimeSep}> – </Text>
                    <Text style={s.schedTimeTxt}>{item.endTime}</Text>
                  </View>
                </View>
              );
            })}
            {sched.length > 2 && (
              <TouchableOpacity style={s.seeMore} onPress={() => setShowAll(v => !v)} activeOpacity={0.7}>
                <Text style={s.seeMoreTxt}>{showAll ? "Show less" : `Show ${sched.length - 2} more days`}</Text>
                <Feather name={showAll ? "chevron-up" : "chevron-down"} size={14} color={P} />
              </TouchableOpacity>
            )}
          </FadeSlide>
        )}

        {/* ── LOCATION ──────────────────────────── */}
        <FadeSlide delay={100} style={s.card}>
          <SectionHead title="Location" />
          {/* map placeholder */}
          <View style={s.mapBox}>
            <View style={s.mapPinCircle}>
              <Feather name="map-pin" size={20} color={P} />
            </View>
            <Text style={s.mapHint}>Map Preview</Text>
          </View>
          <View style={s.locationRow}>
            <View style={s.locationIcon}>
              <Feather name="map-pin" size={16} color={P} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.locationName}>{job.location}</Text>
              <Text style={s.locationSub}>2.4 miles away</Text>
            </View>
          </View>
          <PressBtn onPress={directions} style={s.dirBtn}>
            <LinearGradient colors={[P2, P]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.dirBtnGrad}>
              <Feather name="navigation" size={15} color="#fff" />
              <Text style={s.dirBtnTxt}>Get Directions</Text>
            </LinearGradient>
          </PressBtn>
        </FadeSlide>

        {/* ── REPORT TO ─────────────────────────── */}
        <FadeSlide delay={120} style={s.card}>
          <SectionHead title="Report To" />
          <View style={s.managerRow}>
            <LinearGradient colors={[P2, P]} style={s.avatar}>
              <Text style={s.avatarTxt}>HM</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.managerName}>Hiring Manager</Text>
              <Text style={s.managerRole}>On-site Supervisor</Text>
            </View>
            <TouchableOpacity style={s.iconCircle} activeOpacity={0.7}>
              <Feather name="message-circle" size={17} color={P} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.iconCircle, { marginLeft: 8, backgroundColor: OK + "12" }]} activeOpacity={0.7}>
              <Feather name="phone" size={17} color={OK} />
            </TouchableOpacity>
          </View>
        </FadeSlide>

        {/* ── ABOUT JOB ─────────────────────────── */}
        <FadeSlide delay={140} style={s.card}>
          <SectionHead title="About This Job" />
          <Text style={s.bodyTxt}>{job.description}</Text>
          {job.requirements.length > 0 && (
            <>
              <Div />
              {job.requirements.map((r, i) => (
                <View key={i} style={s.aboutRow}>
                  <View style={s.aboutDot} />
                  <Text style={s.aboutTxt}>{r}</Text>
                </View>
              ))}
            </>
          )}
        </FadeSlide>

        {/* ── REQUIREMENTS ──────────────────────── */}
        {job.requirements.length > 0 && (
          <FadeSlide delay={160} style={s.card}>
            <SectionHead title="Requirements" />
            <View style={s.reqWrap}>
              {job.requirements.map((r, i) => (
                <View key={i} style={s.reqChip}>
                  <Feather name="check-circle" size={13} color={P} />
                  <Text style={s.reqTxt}>{r}</Text>
                </View>
              ))}
            </View>
          </FadeSlide>
        )}

        {/* ── UNIFORM ───────────────────────────── */}
        {job.uniform && job.uniform.length > 0 && (
          <FadeSlide delay={180} style={s.card}>
            <SectionHead title="Uniform Required" />
            <View style={s.reqWrap}>
              {job.uniform.map((item, i) => (
                <View key={i} style={[s.reqChip, { backgroundColor: OK + "10", borderColor: OK + "30" }]}>
                  <Feather name="check-circle" size={13} color={OK} />
                  <Text style={[s.reqTxt, { color: "#065F46" }]}>{item}</Text>
                </View>
              ))}
            </View>
          </FadeSlide>
        )}

        {/* ── INSTRUCTIONS ──────────────────────── */}
        {job.instructions && job.instructions.length > 0 && (
          <FadeSlide delay={200}>
            <View style={[s.card, s.instrCard]}>
              <View style={s.instrHeader}>
                <View style={s.instrIconBox}>
                  <Feather name="info" size={15} color={P} />
                </View>
                <Text style={[s.sectionHead, { marginBottom: 0, color: "#1E3A8A" }]}>Before You Arrive</Text>
              </View>
              {job.instructions.map((item, i) => (
                <View key={i} style={s.instrRow}>
                  <View style={s.instrCheck}><Feather name="check" size={11} color="#fff" /></View>
                  <Text style={s.instrTxt}>{item}</Text>
                </View>
              ))}
            </View>
          </FadeSlide>
        )}

        {/* ── COMPANY ───────────────────────────── */}
        <FadeSlide delay={220} style={s.card}>
          <View style={s.companyRow}>
            <View style={s.companyLogo}>
              <Text style={s.companyLogoTxt}>TG</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.companyName}>TrueGigs Employer</Text>
              <View style={s.starsRow}>
                {[1,2,3,4,5].map(n => (
                  <Feather key={n} name="star" size={11} color={n <= 4 ? WARN : BORD} />
                ))}
                <Text style={s.companyMeta}>  4.0 · 200–500 employees</Text>
              </View>
            </View>
            <TouchableOpacity style={s.viewBtn} activeOpacity={0.7}>
              <Text style={s.viewBtnTxt}>View</Text>
              <Feather name="arrow-right" size={13} color={P} />
            </TouchableOpacity>
          </View>
        </FadeSlide>

        <Text style={s.postedTxt}>Posted {job.postedAt}</Text>
      </ScrollView>

      {/* ── STICKY CTA ───────────────────────────── */}
      <View style={[s.footer, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 10) }]}>
        {isWorker ? (
          hasApplied ? (
            <View style={s.appliedWrap}>
              <View style={s.appliedRow}>
                <Feather name="check-circle" size={18} color={OK} />
                <Text style={s.appliedTxt}>Application Submitted</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={s.cancelTxt}>Cancel Application</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <PressBtn onPress={() => setShowModal(true)} style={s.cta}>
              <LinearGradient colors={[P2, P]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaGrad}>
                <View style={s.ctaLeft}>
                  <Text style={s.ctaSub}>Ready to start?</Text>
                  <Text style={s.ctaMain}>Apply Now</Text>
                </View>
                <View style={s.ctaArrow}>
                  <Feather name="send" size={20} color="#fff" />
                </View>
              </LinearGradient>
            </PressBtn>
          )
        ) : (
          <PressBtn onPress={() => {}} style={s.cta}>
            <LinearGradient colors={[P2, P]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaGrad}>
              <View style={s.ctaLeft}>
                <Text style={s.ctaSub}>Manage this listing</Text>
                <Text style={s.ctaMain}>View Applicants</Text>
              </View>
              <View style={s.ctaArrow}>
                <Feather name="users" size={20} color="#fff" />
              </View>
            </LinearGradient>
          </PressBtn>
        )}
      </View>

      {/* ── APPLY MODAL ──────────────────────────── */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetTop}>
              <View>
                <Text style={s.sheetTitle}>Apply Now</Text>
                <Text style={s.sheetSub}>{job.title}</Text>
              </View>
              <TouchableOpacity style={s.sheetClose} onPress={() => setModal(false)}>
                <Feather name="x" size={17} color={SUB} />
              </TouchableOpacity>
            </View>
            <Text style={s.sheetPrompt}>Add an optional note to stand out</Text>
            <TextInput
              style={s.noteInput}
              placeholder="Tell them why you're a great fit…"
              placeholderTextColor="#C0C8D8"
              multiline numberOfLines={4}
              value={note} onChangeText={setNote}
            />
            <PressBtn onPress={submit} style={s.submitBtn}>
              <LinearGradient colors={[P2, P]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
                <Feather name="check-circle" size={17} color="#fff" />
                <Text style={s.submitTxt}>Submit Application</Text>
              </LinearGradient>
            </PressBtn>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}>
              <Text style={s.cancelBtnTxt}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  function setShowModal(v: boolean) { setModal(v); }
}

// ─── styles ───────────────────────────────────────────────────────────────────
const R = 20; // card radius
const P_= 20; // card padding

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  /* empty state */
  empty:       { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, padding: 32, backgroundColor: BG },
  emptyIcon:   { width: 72, height: 72, borderRadius: 36, backgroundColor: "#EEF0F6", justifyContent: "center", alignItems: "center" },
  emptyTitle:  { fontSize: 19, fontWeight: "700", color: INK },
  emptySub:    { fontSize: 14, color: SUB, textAlign: "center" },
  emptyBtn:    { marginTop: 8, backgroundColor: P, paddingHorizontal: 26, paddingVertical: 13, borderRadius: 12 },
  emptyBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },

  /* hero */
  hero:      { paddingHorizontal: 20, paddingBottom: 26 },
  nav:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  navBtn:    { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },
  urgentBadge:{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  urgentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FCA5A5" },
  urgentTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },
  heroTitle:  { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.4, lineHeight: 34, marginBottom: 5 },
  heroCompany:{ fontSize: 14, color: "rgba(255,255,255,0.72)", fontWeight: "500", marginBottom: 18 },
  payRow:    { flexDirection: "row", alignItems: "flex-end", gap: 6, marginBottom: 12 },
  payBig:    { fontSize: 52, fontWeight: "800", color: "#fff", lineHeight: 56 },
  payUnit:   { fontSize: 20, fontWeight: "600", color: "rgba(255,255,255,0.75)", marginBottom: 8 },
  payMeta:   { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  payMetaChip:{ backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  payMetaTxt: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.9)" },

  /* scroll */
  scroll: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },

  /* chips */
  chips: { paddingRight: 16, gap: 8 },
  chip:  { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#EEF2FF", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 30, borderWidth: 1, borderColor: "#DBEAFE" },
  chipTxt: { fontSize: 12, fontWeight: "600", color: P },

  /* card */
  card: {
    backgroundColor: CARD, borderRadius: R, padding: P_,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sectionHead: { fontSize: 17, fontWeight: "700", color: INK, marginBottom: 14 },
  div:         { height: 1, backgroundColor: BORD, marginVertical: 14 },

  /* dates */
  dateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  dateBox: { gap: 3 },
  dateLabel:{ fontSize: 10, fontWeight: "700", color: SUB, letterSpacing: 0.8 },
  dateVal:  { fontSize: 15, fontWeight: "700", color: INK },

  /* schedule */
  schedRow:       { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  schedRowBorder: { borderBottomWidth: 1, borderBottomColor: BORD },
  dayTag:         { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, minWidth: 48, alignItems: "center" },
  dayTagTxt:      { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  schedDots:      { flex: 1, flexDirection: "row", gap: 3, alignItems: "center", overflow: "hidden", marginHorizontal: 10 },
  dotPx:          { width: 3, height: 3, borderRadius: 2 },
  schedTime:      { flexDirection: "row", alignItems: "center" },
  schedTimeTxt:   { fontSize: 13, fontWeight: "700", color: INK },
  schedTimeSep:   { fontSize: 13, color: SUB },
  seeMore:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 10 },
  seeMoreTxt:     { fontSize: 13, fontWeight: "600", color: P },

  /* location */
  mapBox: {
    height: 110, borderRadius: 14, backgroundColor: "#EEF2FF",
    justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 14,
    borderWidth: 1, borderColor: "#DBEAFE",
  },
  mapPinCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  mapHint:      { fontSize: 12, color: SUB },
  locationRow:  { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  locationIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center" },
  locationName: { fontSize: 15, fontWeight: "700", color: INK },
  locationSub:  { fontSize: 13, color: SUB, marginTop: 2 },
  dirBtn:       { borderRadius: 14, overflow: "hidden" },
  dirBtnGrad:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13 },
  dirBtnTxt:    { fontSize: 14, fontWeight: "700", color: "#fff" },

  /* report to */
  managerRow:  { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar:      { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  avatarTxt:   { fontSize: 16, fontWeight: "800", color: "#fff" },
  managerName: { fontSize: 15, fontWeight: "700", color: INK },
  managerRole: { fontSize: 13, color: SUB, marginTop: 2 },
  iconCircle:  { width: 38, height: 38, borderRadius: 19, backgroundColor: P + "12", justifyContent: "center", alignItems: "center" },

  /* about */
  bodyTxt:  { fontSize: 14, lineHeight: 22, color: SUB },
  aboutRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  aboutDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: P, marginTop: 7, flexShrink: 0 },
  aboutTxt: { flex: 1, fontSize: 14, lineHeight: 21, color: INK, fontWeight: "500" },

  /* requirements / uniform chips */
  reqWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reqChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EEF2FF", borderWidth: 1, borderColor: "#DBEAFE", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  reqTxt:  { fontSize: 13, fontWeight: "600", color: "#1E3A8A" },

  /* instructions */
  instrCard:   { backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" },
  instrHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  instrIconBox:{ width: 30, height: 30, borderRadius: 9, backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center" },
  instrRow:    { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  instrCheck:  { width: 20, height: 20, borderRadius: 10, backgroundColor: OK, justifyContent: "center", alignItems: "center" },
  instrTxt:    { fontSize: 14, fontWeight: "500", color: "#1E3A8A", flex: 1 },

  /* company */
  companyRow:    { flexDirection: "row", alignItems: "center", gap: 12 },
  companyLogo:   { width: 48, height: 48, borderRadius: 14, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: BORD },
  companyLogoTxt:{ fontSize: 15, fontWeight: "800", color: P },
  companyName:   { fontSize: 15, fontWeight: "700", color: INK, marginBottom: 4 },
  starsRow:      { flexDirection: "row", alignItems: "center", gap: 2 },
  companyMeta:   { fontSize: 12, color: SUB },
  viewBtn:       { flexDirection: "row", alignItems: "center", gap: 3 },
  viewBtnTxt:    { fontSize: 13, fontWeight: "700", color: P },

  postedTxt: { textAlign: "center", fontSize: 12, color: "#C0C8D8", marginVertical: 4 },

  /* footer */
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORD,
    paddingHorizontal: 20, paddingTop: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 14,
  },
  cta:     { borderRadius: 18, overflow: "hidden", height: 60 },
  ctaGrad: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 20 },
  ctaLeft: { flex: 1 },
  ctaSub:  { fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: "500" },
  ctaMain: { fontSize: 19, fontWeight: "800", color: "#fff" },
  ctaArrow:{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },

  appliedWrap: { alignItems: "center", gap: 6 },
  appliedRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  appliedTxt:  { fontSize: 16, fontWeight: "700", color: OK },
  cancelTxt:   { fontSize: 13, color: ERR, fontWeight: "600" },

  /* modal */
  overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet:      { backgroundColor: CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingTop: 12 },
  sheetHandle:{ width: 40, height: 4, backgroundColor: BORD, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTop:   { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 },
  sheetClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: BG, justifyContent: "center", alignItems: "center" },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: INK },
  sheetSub:   { fontSize: 14, color: SUB, marginTop: 2 },
  sheetPrompt:{ fontSize: 14, color: SUB, marginBottom: 12 },
  noteInput:  { borderWidth: 1.5, borderColor: BORD, borderRadius: 14, padding: 14, fontSize: 14, color: INK, backgroundColor: BG, minHeight: 96, textAlignVertical: "top", marginBottom: 14 },
  submitBtn:  { borderRadius: 16, overflow: "hidden", height: 54, marginBottom: 10 },
  submitGrad: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitTxt:  { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelBtn:  { paddingVertical: 12, alignItems: "center" },
  cancelBtnTxt:{ fontSize: 15, color: SUB, fontWeight: "500" },
});

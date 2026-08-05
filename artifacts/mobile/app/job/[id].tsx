import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Linking,
  Platform, Modal, Animated, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useJobs } from "@/context/JobsContext";
import type { WeeklyScheduleDay } from "@/context/JobsContext";
import { useApp } from "@/context/AppContext";
import * as Haptics from "expo-haptics";

const { width: SW } = Dimensions.get("window");

// ─── helpers ─────────────────────────────────────────────────────────────────
function extractHours(duration: string): number {
  const h = duration.match(/(\d+)\s*h/i);
  if (h) return parseInt(h[1], 10);
  const d = duration.match(/(\d+)\s*day/i);
  if (d) return parseInt(d[1], 10) * 8;
  return 8;
}
function totalPay(pay: number, payType: string, duration: string): string {
  if (payType === "hourly")
    return `$${(pay * extractHours(duration)).toLocaleString()}`;
  return `$${pay.toLocaleString()}`;
}
function payUnit(payType: string) {
  return payType === "hourly" ? "/hr" : payType === "daily" ? "/day" : "";
}

// ─── design tokens ────────────────────────────────────────────────────────────
const NAVY   = "#0A1628";
const BLUE   = "#2F5BFF";
const BLUE2  = "#4D73FF";
const WHITE  = "#FFFFFF";
const SHEET  = "#F7F9FF";
const INK    = "#0A1628";
const MUTED  = "#64748B";
const BORDER = "#EEF1F8";
const GREEN  = "#12B76A";
const AMBER  = "#F59E0B";
const RED    = "#EF4444";
const PURPLE = "#7C3AED";

const DAY_PALETTE: Record<string, { bg: string; fg: string }> = {
  Mon: { bg: "#EEF2FF", fg: "#2F5BFF" },
  Tue: { bg: "#F3EEFF", fg: "#7C3AED" },
  Wed: { bg: "#ECFEFF", fg: "#0891B2" },
  Thu: { bg: "#ECFDF5", fg: "#059669" },
  Fri: { bg: "#FFF7ED", fg: "#D97706" },
  Sat: { bg: "#FEF2F2", fg: "#DC2626" },
  Sun: { bg: "#FDF4FF", fg: "#9333EA" },
};

// ─── micro utilities ─────────────────────────────────────────────────────────
function useFade(delay = 0) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return { opacity: op, transform: [{ translateY: ty }] };
}

function Pill({ children, color = BLUE }: { children: React.ReactNode; color?: string }) {
  return (
    <View style={[pill.wrap, { backgroundColor: color + "14", borderColor: color + "30" }]}>
      {children}
    </View>
  );
}
const pill = StyleSheet.create({ wrap: { borderRadius: 30, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 } });

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

function Row({ icon, label, value, iconColor = BLUE }: { icon: any; label: string; value: string; iconColor?: string }) {
  return (
    <View style={s.infoRow}>
      <View style={[s.infoIcon, { backgroundColor: iconColor + "12" }]}>
        <Feather name={icon} size={14} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Label>{label}</Label>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Feather key={n} name="star" size={11}
          color={n <= Math.round(rating) ? AMBER : "#D1D5DB"} />
      ))}
      <Text style={s.ratingNum}>{rating.toFixed(1)}</Text>
    </View>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────
export default function JobDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const insets   = useSafeAreaInsets();
  const { getJobById, applyToJob, applications, savedJobs, saveJob, unsaveJob } = useJobs();
  const { userRole } = useApp();

  const [modal, setModal]     = useState(false);
  const [note, setNote]       = useState("");
  const [applied, setApplied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const job        = getJobById(id);
  const hasApplied = applied || applications.some(a => a.jobId === id && a.workerId === "me");
  const isSaved    = savedJobs.includes(id);
  const isWorker   = userRole !== "employer";
  const topPad     = Platform.OS === "web" ? insets.top + 67 : insets.top;

  // hero height = topPad + nav + title block + pay block + bottom padding
  const HERO_H = topPad + 160;
  const SHEET_OVERLAP = 28;

  if (!job) return (
    <View style={s.empty}>
      <View style={s.emptyIcon}><Feather name="briefcase" size={28} color={MUTED} /></View>
      <Text style={s.emptyTitle}>Job not found</Text>
      <TouchableOpacity style={s.emptyBtn} onPress={() => router.back()}>
        <Text style={s.emptyBtnTxt}>Go back</Text>
      </TouchableOpacity>
    </View>
  );

  function submit() {
    applyToJob(id, note);
    setApplied(true);
    setModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleSave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    isSaved ? unsaveJob(id) : saveJob(id);
  }

  function openMap() {
    const q = encodeURIComponent(job.location);
    Linking.openURL(Platform.OS === "ios"
      ? `maps://maps.apple.com/?q=${q}`
      : `https://maps.google.com/?q=${q}`
    ).catch(() => {});
  }

  const total = totalPay(job.pay, job.payType, job.duration);
  const hrs   = extractHours(job.duration);
  const sched = job.weeklySchedule ?? [];
  const shown = showAll ? sched : sched.slice(0, 2);

  // Header background fades to white on scroll
  const headerBg = scrollY.interpolate({
    inputRange: [HERO_H - SHEET_OVERLAP - 60, HERO_H - SHEET_OVERLAP],
    outputRange: ["transparent", WHITE],
    extrapolate: "clamp",
  });
  const headerTitle = scrollY.interpolate({
    inputRange: [HERO_H - SHEET_OVERLAP - 60, HERO_H - SHEET_OVERLAP],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={s.root}>

      {/* ── HERO (behind scroll) ─────────────────── */}
      <LinearGradient
        colors={[NAVY, "#0F2D6B", BLUE]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[s.hero, { height: HERO_H }]}
      >
        {/* ── nav: positioned inside hero, below topPad ── */}
        <View style={[s.heroNav, { marginTop: topPad + 10 }]}>
          <View style={{ flex: 1 }}>
            {job.urgency === "urgent" && (
              <View style={s.urgentBadge}>
                <View style={s.urgentDot} />
                <Text style={s.urgentTxt}>Urgent Hire</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── title + company ── */}
        <Text style={s.heroTitle} numberOfLines={2}>{job.title}</Text>
        <View style={s.heroCompanyRow}>
          <Text style={s.heroCompany}>{job.company}</Text>
          {job.verified && (
            <View style={s.verifiedBadge}>
              <Feather name="check-circle" size={11} color="#34D399" />
              <Text style={s.verifiedTxt}>Verified</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* ── FLOATING NAV (overlays hero, scroll-aware) ── */}
      <Animated.View style={[s.floatingNav, { top: topPad + 4, backgroundColor: headerBg }]}>
        <TouchableOpacity style={s.navBtn} onPress={() => router.back()} hitSlop={12} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={WHITE} />
        </TouchableOpacity>
        <Animated.Text style={[s.navTitle, { opacity: headerTitle }]} numberOfLines={1}>
          {job.title}
        </Animated.Text>
        <TouchableOpacity style={s.navBtn} onPress={handleSave} hitSlop={12} activeOpacity={0.7}>
          <Feather name="bookmark" size={19} color={isSaved ? AMBER : WHITE} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── SCROLLABLE CONTENT ────────────────────── */}
      <Animated.ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{ paddingTop: HERO_H - SHEET_OVERLAP, paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* ── WHITE SHEET ── */}
        <View style={s.sheet}>

          {/* drag handle */}
          <View style={s.handle} />

          {/* ── STATS STRIP ── */}
          <Animated.View style={[s.statsStrip, useFade(0)]}>
            <View style={s.statItem}>
              <Feather name="dollar-sign" size={16} color={BLUE} />
              <Text style={s.statVal}>${job.pay}{payUnit(job.payType)}</Text>
              <Label>Rate</Label>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Feather name="clock" size={16} color={PURPLE} />
              <Text style={s.statVal}>{hrs}h</Text>
              <Label>Total Hours</Label>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Feather name="trending-up" size={16} color={GREEN} />
              <Text style={s.statVal}>{total}</Text>
              <Label>Estimated</Label>
            </View>
          </Animated.View>

          <View style={s.sheetDivider} />

          {/* ── SCHEDULE ── */}
          {sched.length > 0 && (
            <Animated.View style={[s.section, useFade(40)]}>
              <Text style={s.sectionTitle}>Schedule</Text>

              {/* date range bar */}
              {(job.startDate || job.endDate) && (
                <View style={s.dateBar}>
                  <View style={s.dateBarItem}>
                    <Label>FROM</Label>
                    <Text style={s.dateBarVal}>{job.startDate ?? "—"}</Text>
                  </View>
                  <View style={s.dateBarLine}>
                    <View style={s.dateBarLineInner} />
                    <View style={s.dateBarArrow}>
                      <Feather name="arrow-right" size={14} color={BLUE} />
                    </View>
                  </View>
                  <View style={[s.dateBarItem, { alignItems: "flex-end" }]}>
                    <Label>TO</Label>
                    <Text style={s.dateBarVal}>{job.endDate ?? "Ongoing"}</Text>
                  </View>
                </View>
              )}

              {/* day rows */}
              <View style={s.schedWrap}>
                {shown.map((item: WeeklyScheduleDay, i: number) => {
                  const pal = DAY_PALETTE[item.day] ?? { bg: "#EEF2FF", fg: BLUE };
                  return (
                    <View key={i} style={[s.dayRow, { borderLeftColor: pal.fg }]}>
                      <View style={[s.dayBadge, { backgroundColor: pal.bg }]}>
                        <Text style={[s.dayBadgeTxt, { color: pal.fg }]}>
                          {item.day.slice(0, 3).toUpperCase()}
                        </Text>
                      </View>
                      <View style={s.dayTimeline}>
                        <View style={[s.dayDot, { backgroundColor: pal.fg }]} />
                        <View style={[s.dayLine, { backgroundColor: pal.fg + "25" }]} />
                        <View style={[s.dayDot, { backgroundColor: pal.fg }]} />
                      </View>
                      <Text style={s.dayTime}>{item.startTime}</Text>
                      <Text style={s.dayArrow}>→</Text>
                      <Text style={s.dayTime}>{item.endTime}</Text>
                    </View>
                  );
                })}
              </View>

              {sched.length > 2 && (
                <TouchableOpacity style={s.seeMore} onPress={() => setShowAll(v => !v)} activeOpacity={0.7}>
                  <Text style={s.seeMoreTxt}>{showAll ? "Show less" : `Show ${sched.length - 2} more`}</Text>
                  <Feather name={showAll ? "chevron-up" : "chevron-down"} size={13} color={BLUE} />
                </TouchableOpacity>
              )}
            </Animated.View>
          )}

          <View style={s.sheetDivider} />

          {/* ── LOCATION ── */}
          <Animated.View style={[s.section, useFade(80)]}>
            <Text style={s.sectionTitle}>Location</Text>
            <TouchableOpacity style={s.mapCard} onPress={openMap} activeOpacity={0.9}>
              <LinearGradient colors={["#1E3A8A", "#2F5BFF"]} style={s.mapGrad}>
                <View style={s.mapPinRing}>
                  <Feather name="map-pin" size={18} color={WHITE} />
                </View>
                <Text style={s.mapOverlayTxt}>{job.location}</Text>
                <View style={s.mapOpenBtn}>
                  <Text style={s.mapOpenTxt}>Open in Maps</Text>
                  <Feather name="external-link" size={12} color={WHITE} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={s.sheetDivider} />

          {/* ── REPORT TO ── */}
          <Animated.View style={[s.section, useFade(100)]}>
            <Text style={s.sectionTitle}>Report To</Text>
            <View style={s.managerCard}>
              <LinearGradient colors={[BLUE2, BLUE]} style={s.managerAvatar}>
                <Text style={s.managerInitials}>
                  {job.company.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.managerName}>Hiring Manager</Text>
                <Text style={s.managerRole}>{job.company}</Text>
              </View>
              <TouchableOpacity style={[s.managerAction, { backgroundColor: BLUE + "12" }]} activeOpacity={0.7}>
                <Feather name="message-circle" size={16} color={BLUE} />
              </TouchableOpacity>
              <TouchableOpacity style={[s.managerAction, { backgroundColor: GREEN + "12", marginLeft: 8 }]} activeOpacity={0.7}>
                <Feather name="phone" size={16} color={GREEN} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={s.sheetDivider} />

          {/* ── ABOUT ── */}
          <Animated.View style={[s.section, useFade(120)]}>
            <Text style={s.sectionTitle}>About This Job</Text>
            <Text style={s.bodyTxt}>{job.description}</Text>
          </Animated.View>

          <View style={s.sheetDivider} />

          {/* ── REQUIREMENTS ── */}
          {job.requirements.length > 0 && (
            <Animated.View style={[s.section, useFade(140)]}>
              <Text style={s.sectionTitle}>Requirements</Text>
              {job.requirements.map((r, i) => (
                <View key={i} style={s.reqRow}>
                  <View style={s.reqCheck}>
                    <Feather name="check" size={11} color={WHITE} />
                  </View>
                  <Text style={s.reqTxt}>{r}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* ── UNIFORM ── */}
          {job.uniform && job.uniform.length > 0 && (
            <>
              <View style={s.sheetDivider} />
              <Animated.View style={[s.section, useFade(160)]}>
                <Text style={s.sectionTitle}>What to Wear</Text>
                <View style={s.uniformGrid}>
                  {job.uniform.map((item, i) => (
                    <View key={i} style={s.uniformChip}>
                      <Feather name="check-circle" size={13} color={GREEN} />
                      <Text style={s.uniformTxt}>{item}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            </>
          )}

          {/* ── INSTRUCTIONS ── */}
          {job.instructions && job.instructions.length > 0 && (
            <>
              <View style={s.sheetDivider} />
              <Animated.View style={[s.section, useFade(180)]}>
                <View style={s.instrTitleRow}>
                  <View style={s.instrIcon}>
                    <Feather name="alert-circle" size={14} color={BLUE} />
                  </View>
                  <Text style={s.sectionTitle}>Before You Arrive</Text>
                </View>
                <View style={s.instrCard}>
                  {job.instructions.map((item, i) => (
                    <View key={i} style={[s.instrRow, i < job.instructions!.length - 1 && s.instrRowBorder]}>
                      <View style={s.instrNum}>
                        <Text style={s.instrNumTxt}>{i + 1}</Text>
                      </View>
                      <Text style={s.instrTxt}>{item}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            </>
          )}

          <View style={s.sheetDivider} />

          {/* ── COMPANY ── */}
          <Animated.View style={[s.section, useFade(200)]}>
            <Text style={s.sectionTitle}>About the Employer</Text>
            <View style={s.companyCard}>
              <View style={s.companyLogo}>
                <Text style={s.companyLogoTxt}>
                  {job.company.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.companyNameRow}>
                  <Text style={s.companyName}>{job.company}</Text>
                  {job.verified && <Feather name="check-circle" size={14} color={GREEN} style={{ marginLeft: 5 }} />}
                </View>
                <Stars rating={job.companyRating} />
              </View>
              <TouchableOpacity style={s.viewCo} activeOpacity={0.7}>
                <Text style={s.viewCoTxt}>View</Text>
                <Feather name="arrow-right" size={12} color={BLUE} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Text style={s.postedTxt}>Posted {job.postedAt}</Text>
        </View>
      </Animated.ScrollView>

      {/* ── STICKY CTA ──────────────────────────── */}
      <View style={[s.footer, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 12) }]}>
        {isWorker ? (
          hasApplied ? (
            <View style={s.appliedWrap}>
              <Feather name="check-circle" size={18} color={GREEN} />
              <Text style={s.appliedTxt}>Application Submitted</Text>
              <TouchableOpacity style={{ marginLeft: "auto" }} activeOpacity={0.7}>
                <Text style={s.withdrawTxt}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.ctaBtn} onPress={() => setModal(true)} activeOpacity={0.9}>
              <LinearGradient colors={[BLUE2, BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaGrad}>
                <View>
                  <Text style={s.ctaSub}>1-tap · No account needed</Text>
                  <Text style={s.ctaMain}>Apply Now</Text>
                </View>
                <View style={s.ctaCircle}>
                  <Feather name="send" size={20} color={WHITE} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity style={s.ctaBtn} activeOpacity={0.9}>
            <LinearGradient colors={[BLUE2, BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaGrad}>
              <View>
                <Text style={s.ctaSub}>Manage this listing</Text>
                <Text style={s.ctaMain}>View Applicants</Text>
              </View>
              <View style={s.ctaCircle}>
                <Feather name="users" size={20} color={WHITE} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* ── APPLY MODAL ──────────────────────────── */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHead}>
              <View>
                <Text style={s.modalTitle}>Quick Apply</Text>
                <Text style={s.modalSub}>{job.title} · {job.company}</Text>
              </View>
              <TouchableOpacity style={s.modalClose} onPress={() => setModal(false)}>
                <Feather name="x" size={17} color={MUTED} />
              </TouchableOpacity>
            </View>
            <Text style={s.modalPrompt}>Add an optional note to stand out</Text>
            <TextInput
              style={s.noteInput}
              placeholder="Why are you a great fit for this role?"
              placeholderTextColor="#BFC8DC"
              multiline numberOfLines={4}
              value={note}
              onChangeText={setNote}
            />
            <TouchableOpacity style={s.submitBtn} onPress={submit} activeOpacity={0.88}>
              <LinearGradient colors={[BLUE2, BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
                <Feather name="check-circle" size={17} color={WHITE} />
                <Text style={s.submitTxt}>Submit Application</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModal(false)} style={s.cancelBtn}>
              <Text style={s.cancelBtnTxt}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },

  // empty
  empty:       { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, backgroundColor: SHEET, padding: 32 },
  emptyIcon:   { width: 72, height: 72, borderRadius: 36, backgroundColor: "#EEF0F6", justifyContent: "center", alignItems: "center" },
  emptyTitle:  { fontSize: 18, fontWeight: "700", color: INK },
  emptyBtn:    { backgroundColor: BLUE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyBtnTxt: { color: WHITE, fontWeight: "700", fontSize: 15 },

  // hero
  hero: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 22 },
  heroNav: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  urgentBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", backgroundColor: "rgba(252,165,165,0.2)", borderWidth: 1, borderColor: "rgba(252,165,165,0.35)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  urgentDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#FCA5A5" },
  urgentTxt: { fontSize: 11, fontWeight: "700", color: "#FCA5A5", letterSpacing: 0.3 },
  heroTitle: { fontSize: 30, fontWeight: "800", color: WHITE, letterSpacing: -0.5, lineHeight: 36, marginBottom: 6 },
  heroCompanyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  heroCompany: { fontSize: 14, color: "rgba(255,255,255,0.65)", fontWeight: "500" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(52,211,153,0.15)", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  verifiedTxt: { fontSize: 11, fontWeight: "600", color: "#34D399" },
  payBlock: { gap: 6 },
  payMain: { flexDirection: "row", alignItems: "flex-end", gap: 5 },
  payNum: { fontSize: 56, fontWeight: "800", color: WHITE, lineHeight: 60 },
  payUnit: { fontSize: 20, fontWeight: "600", color: "rgba(255,255,255,0.7)", marginBottom: 8 },
  paySubRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  paySub: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  paySubDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" },

  // floating nav
  floatingNav: {
    position: "absolute", left: 0, right: 0, zIndex: 99,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8,
  },
  navBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  navTitle: { flex: 1, textAlign: "center", fontSize: 15, fontWeight: "700", color: INK, paddingHorizontal: 8 },

  // sheet
  sheet: { backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, minHeight: 600 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 20 },
  sheetDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 22 },

  // stats strip
  statsStrip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 22, paddingBottom: 22 },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statDivider: { width: 1, height: 36, backgroundColor: BORDER },
  statVal: { fontSize: 15, fontWeight: "700", color: INK },

  // section
  section: { paddingHorizontal: 22, paddingVertical: 22 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: INK, marginBottom: 16 },
  label: { fontSize: 10, fontWeight: "700", color: MUTED, letterSpacing: 0.8 },

  // date bar
  dateBar: { flexDirection: "row", alignItems: "center", marginBottom: 16, backgroundColor: SHEET, borderRadius: 14, padding: 14 },
  dateBarItem: { flex: 1, gap: 3 },
  dateBarVal: { fontSize: 13, fontWeight: "700", color: INK },
  dateBarLine: { flex: 1, alignItems: "center", position: "relative" },
  dateBarLineInner: { height: 1, backgroundColor: BORDER, width: "100%" },
  dateBarArrow: { position: "absolute", backgroundColor: WHITE, padding: 2, borderRadius: 20 },

  // schedule
  schedWrap: { gap: 10 },
  dayRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: SHEET, borderRadius: 14, padding: 12, borderLeftWidth: 3 },
  dayBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, minWidth: 48, alignItems: "center" },
  dayBadgeTxt: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  dayTimeline: { flex: 1, flexDirection: "row", alignItems: "center", gap: 0 },
  dayDot: { width: 6, height: 6, borderRadius: 3 },
  dayLine: { flex: 1, height: 2, marginHorizontal: 2 },
  dayTime: { fontSize: 13, fontWeight: "700", color: INK },
  dayArrow: { fontSize: 13, color: MUTED, marginHorizontal: 4 },
  seeMore: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 12 },
  seeMoreTxt: { fontSize: 13, fontWeight: "600", color: BLUE },

  // location
  mapCard: { borderRadius: 18, overflow: "hidden" },
  mapGrad: { height: 130, justifyContent: "center", alignItems: "center", gap: 6 },
  mapPinRing: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  mapOverlayTxt: { fontSize: 16, fontWeight: "700", color: WHITE },
  mapOpenBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  mapOpenTxt: { fontSize: 12, fontWeight: "600", color: WHITE },

  // info row
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  infoIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  infoValue: { fontSize: 14, fontWeight: "600", color: INK, marginTop: 1 },

  // manager
  managerCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: SHEET, borderRadius: 16, padding: 14 },
  managerAvatar: { width: 46, height: 46, borderRadius: 23, justifyContent: "center", alignItems: "center" },
  managerInitials: { fontSize: 15, fontWeight: "800", color: WHITE },
  managerName: { fontSize: 15, fontWeight: "700", color: INK },
  managerRole: { fontSize: 13, color: MUTED, marginTop: 1 },
  managerAction: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },

  // about
  bodyTxt: { fontSize: 14, lineHeight: 23, color: MUTED },

  // requirements
  reqRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  reqCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: BLUE, justifyContent: "center", alignItems: "center", flexShrink: 0, marginTop: 1 },
  reqTxt: { flex: 1, fontSize: 14, fontWeight: "500", color: INK, lineHeight: 21 },

  // uniform
  uniformGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  uniformChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: GREEN + "10", borderWidth: 1, borderColor: GREEN + "25", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  uniformTxt: { fontSize: 13, fontWeight: "600", color: "#065F46" },

  // instructions
  instrTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  instrIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: BLUE + "12", justifyContent: "center", alignItems: "center" },
  instrCard: { backgroundColor: SHEET, borderRadius: 16, overflow: "hidden" },
  instrRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  instrRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  instrNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: BLUE, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  instrNumTxt: { fontSize: 11, fontWeight: "800", color: WHITE },
  instrTxt: { flex: 1, fontSize: 14, fontWeight: "500", color: INK },

  // company
  companyCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  companyLogo: { width: 48, height: 48, borderRadius: 14, backgroundColor: SHEET, borderWidth: 1, borderColor: BORDER, justifyContent: "center", alignItems: "center" },
  companyLogoTxt: { fontSize: 14, fontWeight: "800", color: BLUE },
  companyNameRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  companyName: { fontSize: 15, fontWeight: "700", color: INK },
  ratingNum: { fontSize: 12, fontWeight: "600", color: MUTED, marginLeft: 4 },
  viewCo: { flexDirection: "row", alignItems: "center", gap: 3 },
  viewCoTxt: { fontSize: 13, fontWeight: "700", color: BLUE },

  postedTxt: { textAlign: "center", fontSize: 12, color: "#BFC8DC", paddingVertical: 20 },

  // footer
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: BORDER,
    paddingHorizontal: 20, paddingTop: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 20,
  },
  ctaBtn:    { borderRadius: 18, overflow: "hidden", height: 60 },
  ctaGrad:   { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 20 },
  ctaSub:    { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  ctaMain:   { fontSize: 19, fontWeight: "800", color: WHITE },
  ctaCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginLeft: "auto" },
  appliedWrap: { flexDirection: "row", alignItems: "center", gap: 8, height: 60, paddingHorizontal: 4 },
  appliedTxt: { fontSize: 15, fontWeight: "700", color: GREEN },
  withdrawTxt: { fontSize: 13, color: RED, fontWeight: "600" },

  // modal
  overlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet:  { backgroundColor: WHITE, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingTop: 10 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 22 },
  modalHead:   { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 },
  modalClose:  { width: 32, height: 32, borderRadius: 16, backgroundColor: SHEET, justifyContent: "center", alignItems: "center" },
  modalTitle:  { fontSize: 20, fontWeight: "800", color: INK },
  modalSub:    { fontSize: 13, color: MUTED, marginTop: 2 },
  modalPrompt: { fontSize: 14, color: MUTED, marginBottom: 12 },
  noteInput:   { borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, padding: 14, fontSize: 14, color: INK, backgroundColor: SHEET, minHeight: 96, textAlignVertical: "top", marginBottom: 14 },
  submitBtn:   { borderRadius: 16, overflow: "hidden", height: 54, marginBottom: 10 },
  submitGrad:  { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitTxt:   { color: WHITE, fontSize: 16, fontWeight: "700" },
  cancelBtn:   { paddingVertical: 12, alignItems: "center" },
  cancelBtnTxt:{ fontSize: 15, color: MUTED, fontWeight: "500" },
});

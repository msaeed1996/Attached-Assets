import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useJobs } from "@/context/JobsContext";
import { useMessages } from "@/context/MessagesContext";
import * as Haptics from "expo-haptics";
import NotificationsSheet from "@/components/NotificationsSheet";

const { width: SW } = Dimensions.get("window");

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  blue:     "#2563EB",
  blueDark: "#1E3A8A",
  blueMid:  "#1D4ED8",
  blueLight:"#DBEAFE",
  green:    "#22C55E",
  greenBg:  "#DCFCE7",
  orange:   "#F97316",
  orangeBg: "#FFF7ED",
  purple:   "#8B5CF6",
  purpleBg: "#F5F3FF",
  coral:    "#F43F5E",
  coralBg:  "#FFF1F2",
  slate:    "#64748B",
  slateBg:  "#F1F5F9",
  bg:       "#F6F8FC",
  white:    "#FFFFFF",
  text:     "#111827",
  textMid:  "#374151",
  textSub:  "#6B7280",
  textMuted:"#9CA3AF",
  border:   "#E5E7EB",
  borderLight: "#F3F4F6",
};

const shadow = (color = "#000", opacity = 0.06, radius = 12, y = 4) =>
  Platform.select({
    ios:     { shadowColor: color, shadowOffset: { width: 0, height: y }, shadowOpacity: opacity, shadowRadius: radius },
    android: { elevation: Math.round(radius / 2) },
    default: {},
  }) as object;

// ─── Data ──────────────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "Availability", sub: "Manage your schedule",     icon: "calendar",       grad: [C.blue, "#3B82F6"]   as [string,string], route: "/(tabs)/availability" },
  { label: "Messages",     sub: "Recruiter updates",        icon: "message-circle", grad: [C.purple, "#A78BFA"] as [string,string], route: "/(tabs)/messages"     },
  { label: "Profile",      sub: "Personal information",     icon: "user",           grad: [C.orange, "#FB923C"] as [string,string], route: "/(tabs)/profile"      },
  { label: "Support",      sub: "Need assistance",          icon: "headphones",     grad: [C.green, "#4ADE80"]  as [string,string], route: "/(tabs)/messages"     },
  { label: "Settings",     sub: "App preferences",          icon: "settings",       grad: [C.slate, "#94A3B8"]  as [string,string], route: "/(tabs)/profile"      },
  { label: "My Jobs",      sub: "Applications",             icon: "briefcase",      grad: [C.coral, "#F87171"]  as [string,string], route: "/(tabs)/jobs"         },
];

const TIPS: Array<{ icon: string; title: string; body: string; btnLabel: string; route: string; grad: [string, string]; color: string; bg: string }> = [
  { icon: "calendar",       title: "Stay Available",         body: "Workers with updated schedules get matched 2× faster.",     btnLabel: "Update Availability",   route: "/(tabs)/availability", grad: [C.blue,   "#3B82F6"], color: C.blue,   bg: C.blueLight },
  { icon: "bell",           title: "Turn On Notifications",  body: "Never miss a job opportunity or recruiter message.",        btnLabel: "Enable Notifications",  route: "/(tabs)/profile",      grad: [C.orange, "#FB923C"], color: C.orange, bg: C.orangeBg  },
  { icon: "user",           title: "Complete Your Profile",  body: "A full profile unlocks higher-paying job categories.",      btnLabel: "Edit Profile",          route: "/(tabs)/profile",      grad: [C.purple, "#A78BFA"], color: C.purple, bg: C.purpleBg  },
  { icon: "message-circle", title: "Respond Quickly",        body: "Recruiters prefer workers who reply within the hour.",      btnLabel: "Open Messages",         route: "/(tabs)/messages",     grad: [C.green,  "#4ADE80"], color: C.green,  bg: C.greenBg   },
];

const TIMELINE_STEPS: Array<{ label: string; icon: string; status: "done" | "current" | "upcoming" }> = [
  { label: "Profile\nReady",     icon: "user-check",  status: "done"     },
  { label: "Recruiter\nReview",  icon: "search",       status: "current"  },
  { label: "Job\nInvitation",    icon: "mail",         status: "upcoming" },
  { label: "Accept\nShift",      icon: "check-circle", status: "upcoming" },
  { label: "Check\nIn",          icon: "clock",        status: "upcoming" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning,";
  if (h < 17) return "Good Afternoon,";
  return "Good Evening,";
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets  = useSafeAreaInsets();
  const { userProfile, userRole } = useApp();
  const { jobs, applications } = useJobs();
  const { conversations } = useMessages();

  const topPad    = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const isEmp     = userRole === "employer";
  const unread    = conversations.reduce((s, c) => s + c.unreadCount, 0);
  const accepted  = applications.filter((a) => a.workerId === "me" && a.status === "accepted");
  const myJobs    = jobs.filter((j: any) => j.employerId === "emp-me");

  const [notifOpen, setNotifOpen] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 550, useNativeDriver: true }).start();
  }, []);

  const firstName = userProfile?.name?.split(" ")[0] || "there";

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        {/* ── CURVED HEADER ── */}
        <LinearGradient
          colors={[C.blueDark, C.blueMid, C.blue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.header, { paddingTop: topPad + 20 }]}
        >
          {/* Decorative circles */}
          <View style={s.hCircle1} />
          <View style={s.hCircle2} />
          <View style={s.hCircle3} />

          <View style={s.hRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.hGreeting}>{getGreeting()}</Text>
              <Text style={s.hSub}>Welcome back</Text>
              <Text style={s.hBrand}>TrueGigs</Text>
              <Text style={s.hTagline}>Connecting Great Talent with Great Opportunities</Text>
            </View>
            <View style={s.hRight}>
              <TouchableOpacity
                style={s.hIconBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNotifOpen(true); }}
                activeOpacity={0.8}
              >
                <Feather name="bell" size={21} color="#fff" />
                {unread > 0 && <View style={s.bellDot} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} style={s.avatarTouch} activeOpacity={0.85}>
                {userProfile?.avatar ? (
                  <Image source={{ uri: userProfile.avatar }} style={s.avatar} />
                ) : (
                  <View style={s.avatarFb}>
                    <Text style={s.avatarLetter}>{firstName.charAt(0)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* ── CONTENT ── */}
        <Animated.View style={[s.content, { opacity: fadeAnim }]}>
          {isEmp ? (
            <EmployerDashboard myJobs={myJobs} jobs={jobs} />
          ) : accepted.length > 0 ? (
            <ActiveWorker userProfile={userProfile} accepted={accepted} jobs={jobs} firstName={firstName} />
          ) : (
            <NewUser userProfile={userProfile} firstName={firstName} />
          )}
        </Animated.View>
      </ScrollView>

      <NotificationsSheet visible={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  );
}

// ─── New User Dashboard ────────────────────────────────────────────────────────
function NewUser({ userProfile, firstName }: { userProfile: any; firstName: string }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.25, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <>
      {/* ── FLOATING STATUS CARD ── */}
      <View style={s.statusCard}>
        <View style={s.statusBadgeRow}>
          <Animated.View style={[s.statusDot, { opacity: pulseAnim }]} />
          <Text style={s.statusBadgeText}>Active</Text>
        </View>
        <Text style={s.statusTitle}>Ready for Opportunities</Text>
        <Text style={s.statusBody}>
          Your profile is complete and active. Our recruiters are matching you with available opportunities based on your skills and availability.
        </Text>
        <View style={s.statusBtns}>
          <TouchableOpacity
            style={s.statusBtnPrimary}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/availability"); }}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[C.blue, "#3B82F6"]} style={s.statusBtnGrad}>
              <Feather name="calendar" size={14} color="#fff" />
              <Text style={s.statusBtnPrimaryText}>Update Availability</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.statusBtnOutline}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.85}
          >
            <Feather name="user" size={14} color={C.blue} />
            <Text style={s.statusBtnOutlineText}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── QUICK ACTIONS ── */}
      <Section title="Quick Actions" accent={C.orange} icon="zap">
        <View style={s.qaGrid}>
          {QUICK_ACTIONS.map((a) => <ActionCard key={a.label} {...a} />)}
        </View>
      </Section>

      {/* ── JOB MATCH STATUS ── */}
      <Section title="Job Match Status" accent={C.green} icon="activity">
        <View style={s.card}>
          <MatchRow icon="user-check"  label="Registration Complete"          done />
          <MatchRow icon="shield"      label="Profile Active"                 done />
          <MatchRow icon="calendar"    label="Availability Updated"           done />
          <MatchRow icon="clock"       label="Waiting for Opportunities"      pulse={pulseAnim} last />
        </View>
      </Section>

      {/* ── WHAT HAPPENS NEXT ── */}
      <Section title="What Happens Next?" accent={C.purple} icon="map">
        <PremiumTimeline />
      </Section>

      {/* ── TODAY'S TIP ── */}
      <Section title="Today's Tip" accent={C.orange} icon="sun">
        <TodaysTip />
      </Section>

      {/* ── SUPPORT ── */}
      <Section title="Need Help?" accent={C.coral} icon="headphones">
        <View style={s.card}>
          <Text style={s.supportDesc}>Our staffing team is here to help you get started and answer any questions.</Text>
          <View style={s.supportBtnRow}>
            <SupportBtn icon="message-circle" label="Chat"  color={C.blue}   bg={C.blueLight} onPress={() => router.push("/(tabs)/messages")} />
            <SupportBtn icon="phone"          label="Call"  color={C.green}  bg={C.greenBg}  onPress={() => {}} />
            <SupportBtn icon="mail"           label="Email" color={C.purple} bg={C.purpleBg} onPress={() => {}} />
          </View>
        </View>
      </Section>

      {/* ── REFERRAL ── */}
      <View style={[s.ph, { marginBottom: 8 }]}>
        <LinearGradient
          colors={["#7C3AED", "#9333EA", "#C026D3"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.referralCard}
        >
          <View style={s.refBubble1} /><View style={s.refBubble2} />
          <View style={{ flex: 1 }}>
            <Text style={s.refTitle}>Invite Friends 🎁</Text>
            <Text style={s.refBody}>Refer workers and earn rewards when they complete their first shift.</Text>
          </View>
          <TouchableOpacity style={s.refBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)} activeOpacity={0.85}>
            <Text style={s.refBtnText}>Invite Now</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </>
  );
}

// ─── Active Worker ─────────────────────────────────────────────────────────────
function ActiveWorker({ userProfile, accepted, jobs, firstName }: any) {
  const activeJob = jobs.find((j: any) => j.id === accepted[0]?.jobId) || jobs[0];
  const [clocked, setClocked] = useState(false);

  return (
    <>
      {/* Floating card - active status */}
      <View style={s.statusCard}>
        <View style={s.statusBadgeRow}>
          <View style={[s.statusDot, { backgroundColor: C.green }]} />
          <Text style={[s.statusBadgeText, { color: C.green }]}>On Assignment</Text>
        </View>
        <Text style={s.statusTitle}>Welcome back, {firstName}!</Text>
        <Text style={s.statusBody}>You have {accepted.length} active assignment{accepted.length > 1 ? "s" : ""}. Keep up the great work!</Text>
        <View style={s.heroStatsRow}>
          <StatChip label="Completed" value={String(userProfile?.completedJobs || 0)} color={C.blue} />
          <StatChip label="Rating"    value={`${userProfile?.rating ?? "—"} ⭐`}      color={C.orange} />
          <StatChip label="Status"    value="Active"                                  color={C.green} />
        </View>
      </View>

      {activeJob && (
        <Section title="Active Shift" accent={C.green} icon="briefcase">
          <View style={s.card}>
            <View style={s.activeJobRow}>
              <View style={[s.activeJobIcon, { backgroundColor: C.blueLight }]}>
                <Feather name="briefcase" size={20} color={C.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.activeJobTitle}>{activeJob.title}</Text>
                <Text style={s.activeJobSub}>{activeJob.location}</Text>
              </View>
              <TouchableOpacity
                style={[s.clockBtn, { backgroundColor: clocked ? C.green : C.blue }]}
                onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setClocked(!clocked); }}
                activeOpacity={0.85}
              >
                <Feather name={clocked ? "log-out" : "clock"} size={14} color="#fff" />
                <Text style={s.clockBtnText}>{clocked ? "Clock Out" : "Clock In"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Section>
      )}

      <Section title="Quick Actions" accent={C.orange} icon="zap">
        <View style={s.qaGrid}>
          {QUICK_ACTIONS.map((a) => <ActionCard key={a.label} {...a} />)}
        </View>
      </Section>
    </>
  );
}

// ─── Employer Dashboard ────────────────────────────────────────────────────────
function EmployerDashboard({ myJobs, jobs }: any) {
  return (
    <>
      <View style={s.statusCard}>
        <View style={s.statusBadgeRow}>
          <View style={[s.statusDot, { backgroundColor: C.blue }]} />
          <Text style={[s.statusBadgeText, { color: C.blue }]}>Employer Account</Text>
        </View>
        <Text style={s.statusTitle}>Manage Your Jobs</Text>
        <Text style={s.statusBody}>You have {myJobs.length} active job post{myJobs.length !== 1 ? "s" : ""}. Post new positions to find qualified workers instantly.</Text>
        <TouchableOpacity style={s.statusBtnPrimary} onPress={() => router.push("/post-job")} activeOpacity={0.85}>
          <LinearGradient colors={[C.blue, "#3B82F6"]} style={s.statusBtnGrad}>
            <Feather name="plus" size={14} color="#fff" />
            <Text style={s.statusBtnPrimaryText}>Post a Job</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Section title="My Job Posts" accent={C.blue} icon="briefcase">
        <View style={s.card}>
          {myJobs.length === 0 ? (
            <View style={s.emptyState}>
              <View style={[s.emptyIcon, { backgroundColor: C.blueLight }]}>
                <Feather name="briefcase" size={28} color={C.blue} />
              </View>
              <Text style={s.emptyTitle}>Post Your First Job</Text>
              <Text style={s.emptyBody}>It only takes 2 minutes. Qualified workers will start applying immediately.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => router.push("/post-job")} activeOpacity={0.85}>
                <Text style={s.emptyBtnText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          ) : myJobs.map((job: any, i: number) => (
            <TouchableOpacity
              key={job.id}
              style={[s.jobRow, i < myJobs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.borderLight }]}
              onPress={() => router.push(`/job/${job.id}`)}
              activeOpacity={0.8}
            >
              <View style={[s.jobRowIcon, { backgroundColor: C.blueLight }]}>
                <Feather name="briefcase" size={17} color={C.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.jobRowTitle}>{job.title}</Text>
                <Text style={s.jobRowSub}>{job.applicantsCount} applicants</Text>
              </View>
              <View style={s.openPill}>
                <View style={s.openDot} /><Text style={s.openText}>Open</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Section>
    </>
  );
}

// ─── Reusable Components ───────────────────────────────────────────────────────

function Section({ title, children, accent, icon }: { title: string; children: React.ReactNode; accent: string; icon: string }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={[s.sectionIconBadge, { backgroundColor: accent + "18" }]}>
          <Feather name={icon as any} size={13} color={accent} />
        </View>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ActionCard({ label, sub, icon, grad, route }: { label: string; sub: string; icon: string; grad: [string, string]; route: string }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 30 }).start();
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={[s.qaCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={1}
        onPressIn={onIn}
        onPressOut={onOut}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(route as any); }}
      >
        <LinearGradient colors={grad} style={s.qaIconGrad}>
          <Feather name={icon as any} size={26} color="#fff" />
        </LinearGradient>
        <Text style={s.qaLabel}>{label}</Text>
        <Text style={s.qaSub}>{sub}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function MatchRow({ icon, label, done, pulse, last }: { icon: string; label: string; done?: boolean; pulse?: Animated.Value; last?: boolean }) {
  return (
    <View style={[s.matchRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.borderLight }]}>
      <View style={[s.matchIconWrap, { backgroundColor: done ? C.greenBg : pulse ? C.orangeBg : C.slateBg }]}>
        {pulse ? (
          <Animated.View style={{ opacity: pulse }}>
            <Feather name={icon as any} size={17} color={C.orange} />
          </Animated.View>
        ) : (
          <Feather name={icon as any} size={17} color={done ? C.green : C.textMuted} />
        )}
      </View>
      <Text style={[s.matchLabel, !done && !pulse && { color: C.textSub }]}>{label}</Text>
      {done ? (
        <Feather name="check-circle" size={20} color={C.green} />
      ) : pulse ? (
        <View style={s.pendingPill}><Text style={s.pendingText}>Pending</Text></View>
      ) : null}
    </View>
  );
}

function SupportBtn({ icon, label, color, bg, onPress }: { icon: string; label: string; color: string; bg: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.supBtn, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.supIconWrap, { backgroundColor: color + "22" }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <Text style={[s.supLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[s.statChip, { backgroundColor: color + "12" }]}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Premium Timeline ──────────────────────────────────────────────────────────
function PremiumTimeline() {
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale,   { toValue: 1.65, duration: 950, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0,    duration: 950, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale,   { toValue: 1,   duration: 0,   useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.6, duration: 0,   useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const currentIdx = TIMELINE_STEPS.findIndex((s) => s.status === "current");

  return (
    <View style={s.card}>
      {/* ── Step track ── */}
      <View style={s.tlOuter}>
        {TIMELINE_STEPS.map((step, i) => {
          const isDone     = step.status === "done";
          const isCurrent  = step.status === "current";
          const isUpcoming = step.status === "upcoming";
          // line after this step: green if next is done or current, blue if next is current, gray otherwise
          const lineColor  = isDone ? C.green : isCurrent ? C.blue : C.border;
          const lineFilled = isDone || isCurrent;

          return (
            <React.Fragment key={i}>
              {/* Step column */}
              <View style={s.tlStepCol}>
                {/* Pulse ring (current only) */}
                {isCurrent && (
                  <Animated.View
                    style={[
                      s.tlPulseRing,
                      { transform: [{ scale: ringScale }], opacity: ringOpacity },
                    ]}
                  />
                )}

                {/* Circle */}
                <View
                  style={[
                    s.tlCircle,
                    isDone     && { backgroundColor: C.green,  borderColor: C.green  },
                    isCurrent  && { backgroundColor: C.blue,   borderColor: C.blue   },
                    isUpcoming && { backgroundColor: C.white,  borderColor: C.border },
                  ]}
                >
                  {isDone ? (
                    <Feather name="check" size={16} color="#fff" />
                  ) : (
                    <Feather
                      name={step.icon as any}
                      size={isCurrent ? 16 : 14}
                      color={isCurrent ? "#fff" : C.textMuted}
                    />
                  )}
                </View>

                {/* Label */}
                <Text
                  style={[
                    s.tlLabel,
                    isDone    && { color: C.green },
                    isCurrent && { color: C.blue, fontWeight: "700" },
                  ]}
                >
                  {step.label}
                </Text>

                {/* "Current Step" badge */}
                {isCurrent && (
                  <View style={s.tlCurBadge}>
                    <Text style={s.tlCurText}>Current</Text>
                  </View>
                )}
              </View>

              {/* Connector line */}
              {i < TIMELINE_STEPS.length - 1 && (
                <View style={[s.tlLine, { backgroundColor: lineFilled ? lineColor : C.border }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Info message ── */}
      <View style={s.tlMsgRow}>
        <View style={[s.tlMsgIcon, { backgroundColor: C.blueLight }]}>
          <Feather name="search" size={13} color={C.blue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.tlMsgText}>
            We're matching your profile with available opportunities. You'll receive a notification when a recruiter selects you.
          </Text>
          <View style={s.tlTimeBadge}>
            <Feather name="clock" size={11} color={C.textMuted} />
            <Text style={s.tlTimeText}>Usually within 24–48 hours</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Today's Tip ───────────────────────────────────────────────────────────────
function TodaysTip() {
  const [idx, setIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const tip = TIPS[idx];

  const goTo = (next: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setIdx(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  return (
    <View style={s.ttCard}>
      {/* Top bar: gradient icon + counter + nav */}
      <View style={s.ttTopRow}>
        <LinearGradient colors={tip.grad} style={s.ttIconGrad}>
          <Feather name={tip.icon as any} size={24} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }} />
        <Text style={s.ttCounter}>{idx + 1} / {TIPS.length}</Text>
        <TouchableOpacity
          style={[s.ttArrowBtn, { opacity: idx === 0 ? 0.3 : 1 }]}
          onPress={() => idx > 0 && goTo(idx - 1)}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={18} color={C.textSub} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.ttArrowBtn, { opacity: idx === TIPS.length - 1 ? 0.3 : 1 }]}
          onPress={() => idx < TIPS.length - 1 && goTo(idx + 1)}
          activeOpacity={0.7}
        >
          <Feather name="chevron-right" size={18} color={C.textSub} />
        </TouchableOpacity>
      </View>

      {/* Animated content */}
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Colored accent stripe */}
        <View style={[s.ttAccentBar, { backgroundColor: tip.color + "18" }]}>
          <View style={[s.ttAccentDot, { backgroundColor: tip.color }]} />
          <Text style={[s.ttAccentLabel, { color: tip.color }]}>Quick tip</Text>
        </View>

        <Text style={s.ttTitle}>{tip.title}</Text>
        <Text style={s.ttBody}>{tip.body}</Text>

        {/* Action button */}
        <TouchableOpacity
          style={s.ttBtnWrap}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push(tip.route as any); }}
          activeOpacity={0.85}
        >
          <LinearGradient colors={tip.grad} style={s.ttBtnGrad}>
            <Text style={s.ttBtnText}>{tip.btnLabel}</Text>
            <Feather name="arrow-right" size={14} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Pagination dots */}
      <View style={s.ttDots}>
        {TIPS.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
            <Animated.View
              style={[
                s.ttDot,
                i === idx && { width: 20, backgroundColor: tip.color },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const CARD_W = (SW - 40 - 12) / 2; // 2-col with 20px side padding + 12px gap

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { marginTop: -32 }, // pull content up to overlap header
  ph:      { paddingHorizontal: 20 },

  // ── Header ──
  header: {
    paddingHorizontal: 24,
    paddingBottom: 56, // extra space for floating card overlap
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    ...shadow(C.blue, 0.3, 20, 8),
  },
  hCircle1: { position: "absolute", width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(255,255,255,0.06)", top: -100, right: -60 },
  hCircle2: { position: "absolute", width: 140, height: 140, borderRadius: 70,  backgroundColor: "rgba(255,255,255,0.05)", top: 20,  right: 80 },
  hCircle3: { position: "absolute", width: 90,  height: 90,  borderRadius: 45,  backgroundColor: "rgba(255,255,255,0.04)", bottom: 0, left: -20 },
  hRow:     { flexDirection: "row", alignItems: "flex-start" },
  hGreeting:{ color: "rgba(255,255,255,0.75)", fontSize: 13,   fontWeight: "500" },
  hSub:     { color: "rgba(255,255,255,0.9)",  fontSize: 14,   fontWeight: "500", marginTop: 1 },
  hBrand:   { color: "#fff",                   fontSize: 26,   fontWeight: "900", letterSpacing: -0.8, marginTop: 0 },
  hTagline: { color: "rgba(255,255,255,0.6)",  fontSize: 11.5, fontStyle: "italic", marginTop: 6, lineHeight: 17 },
  hRight:   { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  hIconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  bellDot:  { position: "absolute", top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: "#fff" },
  avatarTouch: {},
  avatar:   { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)" },
  avatarFb: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.22)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  avatarLetter: { color: "#fff", fontSize: 18, fontWeight: "800" },

  // ── Floating Status Card ──
  statusCard: {
    marginHorizontal: 20,
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 20,
    ...shadow("#000", 0.1, 24, 8),
    zIndex: 10,
  },
  statusBadgeRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 },
  statusDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },
  statusBadgeText:{ fontSize: 12.5, fontWeight: "700", color: C.green },
  statusTitle:    { fontSize: 21, fontWeight: "800", color: C.text, letterSpacing: -0.5, marginBottom: 8 },
  statusBody:     { fontSize: 13.5, color: C.textSub, lineHeight: 21, marginBottom: 16 },
  statusBtns:     { flexDirection: "row", gap: 10 },
  statusBtnPrimary: { flex: 1, borderRadius: 14, overflow: "hidden" },
  statusBtnGrad:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 13 },
  statusBtnPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  statusBtnOutline: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1.5, borderColor: C.blueLight, borderRadius: 14, paddingVertical: 12, backgroundColor: C.blueLight },
  statusBtnOutlineText: { color: C.blue, fontSize: 14, fontWeight: "700" },

  heroStatsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  statChip:  { flex: 1, borderRadius: 12, padding: 10, alignItems: "center" },
  statValue: { fontSize: 14, fontWeight: "800" },
  statLabel: { fontSize: 10, color: C.textMuted, fontWeight: "500", marginTop: 2 },

  // ── Section ──
  section:        { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionIconBadge:{ width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  sectionTitle:   { fontSize: 18, fontWeight: "800", color: C.text, letterSpacing: -0.4 },

  // ── Card ──
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    ...shadow("#000", 0.05, 12, 3),
  },

  // ── 2-Column Quick Actions ──
  qaGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  qaCard:    {
    width: CARD_W,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    ...shadow("#000", 0.05, 12, 3),
  },
  qaIconGrad: { width: 56, height: 56, borderRadius: 18, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  qaLabel:    { fontSize: 15, fontWeight: "800", color: C.text, marginBottom: 3 },
  qaSub:      { fontSize: 12, color: C.textMuted, lineHeight: 17 },

  // ── Match Rows ──
  matchRow:     { flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 16, paddingVertical: 15 },
  matchIconWrap:{ width: 42, height: 42, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  matchLabel:   { flex: 1, fontSize: 14, fontWeight: "600", color: C.text },
  pendingPill:  { backgroundColor: C.orangeBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pendingText:  { fontSize: 11, fontWeight: "700", color: C.orange },

  // ── Premium Timeline ──
  tlOuter: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 8,
  },
  tlStepCol: { alignItems: "center", width: 52, position: "relative" },
  tlPulseRing: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.blue,
    top: 0,
    zIndex: 0,
  },
  tlCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    backgroundColor: C.white,
    borderColor: C.border,
  },
  tlLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: C.textMuted,
    textAlign: "center",
    marginTop: 7,
    lineHeight: 14,
  },
  tlCurBadge: {
    marginTop: 5,
    backgroundColor: C.blue + "15",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tlCurText:  { fontSize: 9, fontWeight: "800", color: C.blue, letterSpacing: 0.3 },
  tlLine:     { flex: 1, height: 2, marginTop: 20, borderRadius: 1 },
  tlMsgRow:   {
    flexDirection: "row",
    gap: 11,
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginBottom: 18,
    marginTop: 8,
    backgroundColor: C.blueLight + "60",
    borderRadius: 14,
    padding: 13,
  },
  tlMsgIcon:  { width: 30, height: 30, borderRadius: 9, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  tlMsgText:  { fontSize: 12.5, color: C.textMid, lineHeight: 19, marginBottom: 8 },
  tlTimeBadge:{ flexDirection: "row", alignItems: "center", gap: 5 },
  tlTimeText: { fontSize: 11, color: C.textMuted, fontWeight: "600" },

  // ── Today's Tip ──
  ttCard: {
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    ...shadow("#000", 0.07, 16, 4),
  },
  ttTopRow:    { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  ttIconGrad:  { width: 52, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  ttCounter:   { fontSize: 12, fontWeight: "600", color: C.textMuted, marginRight: 6 },
  ttArrowBtn:  { width: 34, height: 34, borderRadius: 10, backgroundColor: C.slateBg, justifyContent: "center", alignItems: "center" },
  ttAccentBar: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 10, alignSelf: "flex-start", marginBottom: 12 },
  ttAccentDot: { width: 6, height: 6, borderRadius: 3 },
  ttAccentLabel:{ fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  ttTitle:     { fontSize: 19, fontWeight: "800", color: C.text, letterSpacing: -0.4, marginBottom: 6 },
  ttBody:      { fontSize: 13.5, color: C.textSub, lineHeight: 21, marginBottom: 18 },
  ttBtnWrap:   { borderRadius: 15, overflow: "hidden", marginBottom: 20 },
  ttBtnGrad:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  ttBtnText:   { color: "#fff", fontSize: 14, fontWeight: "800" },
  ttDots:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  ttDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.border,
    transition: "all 0.2s",
  } as any,

  // ── Support ──
  supportDesc:   { fontSize: 13, color: C.textSub, lineHeight: 20, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 },
  supportBtnRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  supBtn:        { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: "center", gap: 6 },
  supIconWrap:   { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  supLabel:      { fontSize: 12.5, fontWeight: "700" },

  // ── Referral ──
  referralCard: {
    borderRadius: 22, padding: 20, overflow: "hidden", flexDirection: "row", alignItems: "center", gap: 14,
    ...shadow("#7C3AED", 0.3, 14, 6),
    marginTop: 8,
  },
  refBubble1: { position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.07)", top: -35, right: 85  },
  refBubble2: { position: "absolute", width: 80,  height: 80,  borderRadius: 40, backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: -10 },
  refTitle:   { color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 5 },
  refBody:    { color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 18 },
  refBtn:     { backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignSelf: "flex-start" },
  refBtnText: { color: "#7C3AED", fontSize: 13, fontWeight: "800" },

  // ── Active job ──
  activeJobRow:  { flexDirection: "row", alignItems: "center", gap: 13, padding: 16 },
  activeJobIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  activeJobTitle:{ fontSize: 15, fontWeight: "700", color: C.text },
  activeJobSub:  { fontSize: 12, color: C.textMuted, marginTop: 2 },
  clockBtn:      { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12 },
  clockBtnText:  { color: "#fff", fontSize: 12, fontWeight: "700" },

  // ── Employer ──
  emptyState: { padding: 28, alignItems: "center" },
  emptyIcon:  { width: 72, height: 72, borderRadius: 22, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.text, marginBottom: 6 },
  emptyBody:  { fontSize: 13.5, color: C.textSub, textAlign: "center", lineHeight: 21, marginBottom: 16 },
  emptyBtn:   { backgroundColor: C.blue, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  emptyBtnText:{ color: "#fff", fontSize: 14, fontWeight: "700" },
  jobRow:     { flexDirection: "row", alignItems: "center", gap: 13, padding: 16 },
  jobRowIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  jobRowTitle:{ flex: 1, fontSize: 14, fontWeight: "700", color: C.text },
  jobRowSub:  { fontSize: 12, color: C.textMuted, marginTop: 2 },
  openPill:   { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.greenBg, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 },
  openDot:    { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green },
  openText:   { fontSize: 11, fontWeight: "700", color: "#16A34A" },
});

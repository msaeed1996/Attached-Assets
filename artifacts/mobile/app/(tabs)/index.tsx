import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
  Image,
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
import { BlurView } from "expo-blur";
import { UPCOMING_SHIFTS } from "@/data/upcomingShifts";

// ─── Static data ──────────────────────────────────────────────────────────────

const SAMPLE_INVITATIONS = [
  { id: "inv-1", jobTitle: "Warehouse Supervisor", company: "Amazon Logistics", pay: 28, payType: "hr", startDate: "Tomorrow", time: "8:00 AM", urgent: true },
  { id: "inv-2", jobTitle: "Event Coordinator", company: "Prestige Events", pay: 280, payType: "day", startDate: "Saturday", time: "9:00 AM", urgent: false },
];

const NEARBY_JOBS = [
  { id: "n1", title: "Event Staff",          company: "Prestige Events Co.", pay: 22, distance: "1.2 mi", time: "Sat 8AM–4PM",     icon: "star"    },
  { id: "n2", title: "Warehouse Associate",  company: "Amazon Logistics",    pay: 19, distance: "3.4 mi", time: "Mon–Fri 6AM–2PM", icon: "package" },
  { id: "n3", title: "Food Service Worker",  company: "Levy Restaurants",    pay: 17, distance: "2.1 mi", time: "Fri 5PM–11PM",    icon: "coffee"  },
];

const ONBOARDING_TIPS = [
  "Add a profile photo to increase employer trust by 3×.",
  "Set your availability to start receiving shift offers.",
  "Workers with complete profiles get matched much faster.",
];

function getDateString() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
}

// ─── Profile completion hook ──────────────────────────────────────────────────

function useProfileCompletion() {
  const { userProfile } = useApp();
  const items = [
    { key: "account",    label: "Account Created",                icon: "check-circle", done: true },
    { key: "email",      label: "Verify Email",                   icon: "mail",         done: !!userProfile?.email },
    { key: "photo",      label: "Upload Profile Photo",           icon: "camera",       done: !!userProfile?.avatar },
    { key: "skills",     label: "Add Skills",                     icon: "award",        done: (userProfile?.skills?.length ?? 0) > 0 },
    { key: "experience", label: "Add Work Experience",            icon: "briefcase",    done: !!userProfile?.jobTitle },
    { key: "identity",   label: "Complete Identity Verification", icon: "shield",       done: !!userProfile?.verified },
    { key: "bio",        label: "Write a Bio",                    icon: "edit-3",       done: (userProfile?.bio?.length ?? 0) > 20 },
    { key: "avail",      label: "Set Availability",               icon: "calendar",     done: false },
  ];
  const completedCount = items.filter((i) => i.done).length;
  const pct = Math.round((completedCount / items.length) * 100);
  return { items, completedCount, total: items.length, pct };
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, userRole } = useApp();
  const { jobs, applications } = useJobs();
  const { conversations } = useMessages();
  const { pct } = useProfileCompletion();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const isEmployer = userRole === "employer";
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
  const showOnboarding = !isEmployer && pct < 80;

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [clockInModalVisible, setClockInModalVisible] = useState(false);
  const [clockModalMode, setClockModalMode] = useState<"in" | "out">("in");
  const [activeJobForModal, setActiveJobForModal] = useState<any>(null);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [hideBalance, setHideBalance] = useState(false);

  const formatTime = (d: Date | null) =>
    d ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }) : "--:--";

  const myApplications = applications.filter((a) => a.workerId === "me");
  const myJobs = jobs.filter((j) => j.employerId === "emp-me");

  return (
    <View style={s.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={[s.header, { paddingTop: topPadding + 16 }]}>
          <TouchableOpacity style={s.avatarWrap} onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.85}>
            {userProfile?.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarLetter}>{(userProfile?.name || "U").charAt(0)}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.helloText}>Hello {userProfile?.name?.split(" ")[0] || "there"} 👋</Text>
            <Text style={s.dateText}>{getDateString()}</Text>
          </View>
          <TouchableOpacity
            style={s.bellBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNotifVisible(true); }}
            activeOpacity={0.8}
          >
            <Feather name="bell" size={22} color="#1F2937" />
            {totalUnread > 0 && <View style={s.bellDot} />}
          </TouchableOpacity>
        </View>

        {showOnboarding ? (
          <OnboardingDashboard
            pct={pct}
            hideBalance={hideBalance}
            onToggleHide={() => setHideBalance(!hideBalance)}
          />
        ) : (
          <FullDashboard
            isEmployer={isEmployer}
            userProfile={userProfile}
            myJobs={myJobs}
            myApplications={myApplications}
            jobs={jobs}
            isClockedIn={isClockedIn}
            hideBalance={hideBalance}
            onToggleHide={() => setHideBalance(!hideBalance)}
            onClockPress={(job) => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setActiveJobForModal(job);
              setClockModalMode(isClockedIn ? "out" : "in");
              setClockInModalVisible(true);
            }}
          />
        )}
      </ScrollView>

      <NotificationsSheet visible={notifVisible} onClose={() => setNotifVisible(false)} />

      {/* Clock-in Modal */}
      <Modal visible={clockInModalVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setClockInModalVisible(false)}>
        <View style={{ flex: 1 }}>
          {Platform.OS === "ios" ? (
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setClockInModalVisible(false)}>
              <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFill} />
            </Pressable>
          ) : (
            <Pressable
              style={[ms.backdrop, StyleSheet.absoluteFill, Platform.OS === "web" && ({ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" } as any)]}
              onPress={() => setClockInModalVisible(false)}
            />
          )}
          <Pressable style={ms.sheetWrap} onPress={() => setClockInModalVisible(false)}>
            <Pressable style={ms.card} onPress={(e) => e.stopPropagation()}>
              <View style={ms.handle} />
              <View style={ms.header}>
                <Text style={ms.title}>{clockModalMode === "out" ? "Ready to Clock Out?" : "Ready to Clock In?"}</Text>
                <TouchableOpacity style={ms.closeBtn} onPress={() => setClockInModalVisible(false)} hitSlop={8}>
                  <Feather name="x" size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <View style={ms.body}>
                <View style={ms.infoCard}>
                  <MRow icon="briefcase" label="EVENT"      value={activeJobForModal?.title    || "Lunch Service"} />
                  <MRow icon="clock"     label="SHIFT TIME" value="12:03 PM - 8:00 PM"                            />
                  <MRow icon="map-pin"   label="LOCATION"   value={activeJobForModal?.location || "Manhattan"}     />
                </View>
                {(clockInTime || clockOutTime) && (
                  <View style={ms.stampWrap}>
                    {clockInTime  && <View style={ms.stampRow}><Feather name="log-in"  size={12} color="#10b981" /><Text style={ms.stampLbl}>IN</Text> <Text style={ms.stampVal}>{formatTime(clockInTime)}</Text></View>}
                    {clockOutTime && <View style={ms.stampRow}><Feather name="log-out" size={12} color="#ef4444" /><Text style={ms.stampLbl}>OUT</Text><Text style={ms.stampVal}>{formatTime(clockOutTime)}</Text></View>}
                  </View>
                )}
                <View style={ms.totalRow}>
                  <Text style={ms.totalLabel}>Total Time Logged:</Text>
                  <View style={ms.totalPill}><Text style={ms.totalPillText}>0.0 hours</Text></View>
                </View>
                <TouchableOpacity
                  style={[ms.confirmBtn, clockModalMode === "out" && { backgroundColor: "#ef4444" }]}
                  activeOpacity={0.9}
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    if (clockModalMode === "out") { setClockOutTime(new Date()); setIsClockedIn(false); }
                    else { setClockInTime(new Date()); setClockOutTime(null); setIsClockedIn(true); }
                    setClockInModalVisible(false);
                  }}
                >
                  <Feather name={clockModalMode === "out" ? "log-out" : "clock"} size={20} color="#fff" />
                  <Text style={ms.confirmBtnText}>{clockModalMode === "out" ? "Clock Out Now" : "Clock In Now"}</Text>
                </TouchableOpacity>
                <View style={ms.verifiedRow}><Feather name="navigation" size={11} color="#9ca3af" /><Text style={ms.verifiedText}>Location verified</Text></View>
              </View>
            </Pressable>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

// ─── Onboarding Dashboard ─────────────────────────────────────────────────────

function OnboardingDashboard({ pct, hideBalance, onToggleHide }: { pct: number; hideBalance: boolean; onToggleHide: () => void }) {
  const { items, completedCount, total } = useProfileCompletion();
  const [tipIdx, setTipIdx] = useState(0);
  const profileLocked = pct < 60;

  const actions = [
    { icon: "user",      label: "Complete\nProfile",  route: "/(tabs)/profile",      color: "#7C3AED" },
    { icon: "briefcase", label: "Browse\nJobs",        route: "/(tabs)/jobs",         color: "#7C3AED" },
    { icon: "calendar",  label: "Set\nAvailability",   route: "/(tabs)/availability", color: "#7C3AED" },
    { icon: "send",      label: "Apply\nNow",          route: "/(tabs)/jobs",         color: "#7C3AED" },
  ];

  return (
    <View>
      {/* ── HERO GRADIENT CARD ── */}
      <View style={s.heroPad}>
        <LinearGradient
          colors={["#0D47A1", "#1565C0", "#1976D2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroCard}
        >
          <View style={s.heroRow1}>
            <Text style={s.heroLabel}>Profile Completion</Text>
            <View style={s.heroBadge}>
              <Feather name="trending-up" size={10} color="#E9D5FF" />
              <Text style={s.heroBadgeText}>{completedCount}/{total} steps</Text>
            </View>
          </View>
          <View style={s.heroRow2}>
            <Text style={s.heroBigNum}>{hideBalance ? "••%" : `${pct}%`}</Text>
            <TouchableOpacity onPress={onToggleHide} hitSlop={12} style={s.eyeBtn}>
              <Feather name={hideBalance ? "eye" : "eye-off"} size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${pct}%` as any }]} />
          </View>
          {/* Decorative bubbles */}
          <View style={s.bubble1} />
          <View style={s.bubble2} />
        </LinearGradient>
      </View>

      {/* ── ACTION BUTTONS ── */}
      <View style={s.actionRow}>
        {actions.map((a) => (
          <TouchableOpacity
            key={a.label}
            style={s.actionItem}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(a.route as any); }}
            activeOpacity={0.75}
          >
            <View style={s.actionCircle}>
              <Feather name={a.icon as any} size={22} color="#4B5563" />
            </View>
            <Text style={s.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── GETTING STARTED (like AI Insights) ── */}
      <View style={s.sectionWrap}>
        <SectionRow title="Getting Started" linkLabel="View profile ↗" onLink={() => router.push("/(tabs)/profile")} />
        <View style={s.listCard}>
          {items.slice(0, 4).map((item, i) => (
            <TouchableOpacity
              key={item.key}
              style={[s.txRow, i < 3 && s.txRowBorder]}
              activeOpacity={0.7}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/profile"); }}
            >
              <View style={[s.txIconCircle, { backgroundColor: item.done ? "#F0FDF4" : "#F9FAFB" }]}>
                <Feather name={item.icon as any} size={18} color={item.done ? "#16A34A" : "#9CA3AF"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.txTitle, item.done && s.txTitleDone]}>{item.label}</Text>
                <Text style={s.txSub}>{item.done ? "Completed" : "Tap to complete"}</Text>
              </View>
              {item.done
                ? <Feather name="check-circle" size={18} color="#22C55E" />
                : <View style={s.grayChevron}><Feather name="chevron-right" size={14} color="#9CA3AF" /></View>
              }
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── JOBS NEAR YOU (like Recent Transactions) ── */}
      <View style={s.sectionWrap}>
        <SectionRow title="Jobs Near You" linkLabel="View all ↗" onLink={() => router.push("/(tabs)/jobs")} />
        <View style={s.listCard}>
          {NEARBY_JOBS.map((job, i) => (
            <View key={job.id} style={[s.txRow, i < NEARBY_JOBS.length - 1 && s.txRowBorder]}>
              <View style={s.txIconCircle}>
                <Feather name={job.icon as any} size={18} color="#6B7280" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.txTitle}>{job.title}</Text>
                <Text style={s.txSub}>{job.company}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[s.txAmount, { color: "#7C3AED" }]}>${job.pay}/hr</Text>
                {profileLocked ? (
                  <Text style={s.txSubRight}><Feather name="lock" size={9} color="#9CA3AF" /> {job.distance}</Text>
                ) : (
                  <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")}>
                    <Text style={s.applyLink}>Apply →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── TIPS ── */}
      <View style={[s.sectionWrap, { marginBottom: 8 }]}>
        <SectionRow title="Tips & Guidance" />
        <View style={[s.listCard, { padding: 16 }]}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <View style={s.txIconCircle}>
              <Text style={{ fontSize: 16 }}>💡</Text>
            </View>
            <Text style={[s.txTitle, { flex: 1, fontWeight: "400", lineHeight: 22, color: "#374151" }]}>
              {ONBOARDING_TIPS[tipIdx]}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {ONBOARDING_TIPS.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setTipIdx(i)} hitSlop={10}>
                <View style={[s.tipDot, i === tipIdx && s.tipDotActive]} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 2, marginLeft: "auto" }} onPress={() => setTipIdx((tipIdx + 1) % ONBOARDING_TIPS.length)}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#7C3AED" }}>Next tip</Text>
              <Feather name="chevron-right" size={13} color="#7C3AED" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Full Worker/Employer Dashboard ──────────────────────────────────────────

function FullDashboard({ isEmployer, userProfile, myJobs, myApplications, jobs, isClockedIn, hideBalance, onToggleHide, onClockPress }: any) {
  const actions = isEmployer ? [
    { icon: "plus-circle",  label: "Post\nJob",     route: "/post-job"          },
    { icon: "users",        label: "Applicants",    route: "/(tabs)/jobs"       },
    { icon: "briefcase",    label: "My\nJobs",      route: "/(tabs)/jobs"       },
    { icon: "bar-chart-2",  label: "Analytics",     route: "/(tabs)/jobs"       },
  ] : [
    { icon: "briefcase",    label: "Browse\nJobs",  route: "/(tabs)/jobs"              },
    { icon: "mail",         label: "Invitations",   route: "/(tabs)/invitations"       },
    { icon: "clock",        label: "Time\nSheet",   route: "/timesheet"                },
    { icon: "dollar-sign",  label: "Earnings",      route: "/timesheet"                },
  ];

  return (
    <View>
      {/* ── HERO CARD ── */}
      <View style={s.heroPad}>
        <LinearGradient
          colors={["#0D47A1", "#1565C0", "#1976D2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroCard}
        >
          <View style={s.heroRow1}>
            <Text style={s.heroLabel}>{isEmployer ? "Active Jobs" : "Jobs Completed"}</Text>
            <View style={s.heroBadge}>
              <Feather name="trending-up" size={10} color="#E9D5FF" />
              <Text style={s.heroBadgeText}>+2 this week</Text>
            </View>
          </View>
          <View style={s.heroRow2}>
            <Text style={s.heroBigNum}>
              {hideBalance ? "••" : isEmployer ? String(myJobs.length) : String(userProfile?.completedJobs || 0)}
            </Text>
            <TouchableOpacity onPress={onToggleHide} hitSlop={12} style={s.eyeBtn}>
              <Feather name={hideBalance ? "eye" : "eye-off"} size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
          <View style={s.heroStatsRow}>
            <HeroStat label="Rating" value={`${userProfile?.rating ?? "—"} ⭐`} />
            <View style={s.heroStatDiv} />
            <HeroStat label="Hours" value="455 hrs" />
            <View style={s.heroStatDiv} />
            <HeroStat label="Status" value="Active" valueColor="#A5F3FC" />
          </View>
          <View style={s.bubble1} />
          <View style={s.bubble2} />
        </LinearGradient>
      </View>

      {/* ── ACTIONS ── */}
      <View style={s.actionRow}>
        {actions.map((a) => (
          <TouchableOpacity
            key={a.label}
            style={s.actionItem}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(a.route as any); }}
            activeOpacity={0.75}
          >
            <View style={s.actionCircle}>
              <Feather name={a.icon as any} size={22} color="#4B5563" />
            </View>
            <Text style={s.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── ACTIVE JOB ── */}
      {!isEmployer && (() => {
        const acceptedApp = myApplications.find((a: any) => a.status === "accepted");
        const activeJob = acceptedApp ? jobs.find((j: any) => j.id === acceptedApp.jobId) : jobs[0];
        if (!activeJob) return null;
        return (
          <View style={s.sectionWrap}>
            <SectionRow title="Active Job" />
            <View style={s.listCard}>
              <View style={s.txRow}>
                <View style={s.txIconCircle}>
                  <Feather name="briefcase" size={18} color="#6B7280" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.txTitle}>{activeJob.title}</Text>
                  <Text style={s.txSub}>{activeJob.location}</Text>
                </View>
                <TouchableOpacity
                  style={[s.clockBtn, { backgroundColor: isClockedIn ? "#10B981" : "#7C3AED" }]}
                  onPress={() => onClockPress(activeJob)}
                  activeOpacity={0.85}
                >
                  <Feather name={isClockedIn ? "log-out" : "clock"} size={13} color="#fff" />
                  <Text style={s.clockBtnText}>{isClockedIn ? "Clock Out" : "Clock In"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })()}

      {/* ── JOB INVITATIONS ── */}
      {!isEmployer && (
        <View style={s.sectionWrap}>
          <SectionRow title="Job Invitations" linkLabel="View all ↗" onLink={() => router.push("/(tabs)/invitations")} />
          <View style={s.listCard}>
            {SAMPLE_INVITATIONS.map((inv, i) => (
              <TouchableOpacity
                key={inv.id}
                style={[s.txRow, i < SAMPLE_INVITATIONS.length - 1 && s.txRowBorder]}
                activeOpacity={0.7}
                onPress={() => router.push("/(tabs)/invitations")}
              >
                <View style={s.txIconCircle}>
                  <Feather name="mail" size={18} color="#6B7280" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.txTitle}>{inv.jobTitle}</Text>
                  <Text style={s.txSub}>{inv.company}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[s.txAmount, { color: "#16A34A" }]}>+${inv.pay}/{inv.payType}</Text>
                  <Text style={s.txSubRight}>{inv.startDate}, {inv.time}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── UPCOMING SCHEDULE ── */}
      {!isEmployer && UPCOMING_SHIFTS.length > 0 && (() => {
        const next = UPCOMING_SHIFTS[0];
        return (
          <View style={s.sectionWrap}>
            <SectionRow title="Upcoming Schedule" linkLabel={`View all (${UPCOMING_SHIFTS.length}) ↗`} onLink={() => router.push("/upcoming-schedule")} />
            <View style={s.listCard}>
              <TouchableOpacity style={s.txRow} activeOpacity={0.7} onPress={() => router.push(`/shift/${next.id}`)}>
                <View style={s.txIconCircle}>
                  <Feather name="briefcase" size={18} color="#6B7280" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.txTitle}>{next.jobTitle}</Text>
                  <Text style={s.txSub}>{next.company}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[s.txAmount, { color: "#16A34A" }]}>+${next.estimatedEarnings}</Text>
                  <Text style={s.txSubRight}>{next.displayDate}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}

      {/* ── EMPLOYER: Job Posts ── */}
      {isEmployer && (
        <View style={s.sectionWrap}>
          <SectionRow title="My Job Posts" linkLabel="+ New" onLink={() => router.push("/post-job")} />
          <View style={s.listCard}>
            {myJobs.length === 0 ? (
              <TouchableOpacity style={[s.txRow]} onPress={() => router.push("/post-job")} activeOpacity={0.8}>
                <View style={s.txIconCircle}><Feather name="plus-circle" size={18} color="#6B7280" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.txTitle}>Post your first job</Text>
                  <Text style={s.txSub}>Takes 2 minutes</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ) : myJobs.map((job: any, i: number) => (
              <TouchableOpacity key={job.id} style={[s.txRow, i < myJobs.length - 1 && s.txRowBorder]} onPress={() => router.push(`/job/${job.id}`)} activeOpacity={0.8}>
                <View style={s.txIconCircle}><Feather name="briefcase" size={18} color="#6B7280" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.txTitle}>{job.title}</Text>
                  <Text style={s.txSub}>{job.applicantsCount} applicants</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View style={s.openPill}><View style={s.openDot} /><Text style={s.openText}>Open</Text></View>
                  <Text style={s.txSubRight}>{job.startDate}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── AI INSIGHTS ── */}
      <View style={[s.sectionWrap, { marginBottom: 8 }]}>
        <SectionRow title="AI Insights" linkLabel="View all ↗" onLink={() => {}} />
        <View style={s.listCard}>
          <View style={[s.txRow, s.txRowBorder]}>
            <View style={[s.txIconCircle, { backgroundColor: "#F0FDF4" }]}>
              <Feather name="trending-up" size={18} color="#16A34A" />
            </View>
            <Text style={[s.txTitle, { flex: 1, fontWeight: "400", color: "#374151" }]}>
              {isEmployer ? "Great! Jobs with pay ranges fill 3× faster." : "Complete your profile to get more job matches."}
            </Text>
          </View>
          <View style={s.txRow}>
            <View style={[s.txIconCircle, { backgroundColor: "#FAF5FF" }]}>
              <Feather name="bar-chart-2" size={18} color="#7C3AED" />
            </View>
            <Text style={[s.txTitle, { flex: 1, fontWeight: "400", color: "#374151" }]}>
              {isEmployer ? "Urgent listings get 2× more applications." : "Workers with verified badges get 2× more callbacks."}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionRow({ title, linkLabel, onLink }: { title: string; linkLabel?: string; onLink?: () => void }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {onLink && linkLabel && (
        <TouchableOpacity onPress={onLink}>
          <Text style={s.viewAllLink}>{linkLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function HeroStat({ label, value, valueColor = "#fff" }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={s.heroStatItem}>
      <Text style={s.heroStatLabel}>{label}</Text>
      <Text style={[s.heroStatValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function MRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={ms.infoRow}>
      <View style={ms.infoIcon}><Feather name={icon as any} size={14} color="#6b7280" /></View>
      <View style={{ flex: 1 }}>
        <Text style={ms.infoLabel}>{label}</Text>
        <Text style={ms.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAFA" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  avatarWrap: {},
  avatarImg:  { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#7C3AED", justifyContent: "center", alignItems: "center" },
  avatarLetter: { color: "#fff", fontSize: 19, fontWeight: "700" },
  helloText:  { fontSize: 18, fontWeight: "700", color: "#111827", letterSpacing: -0.3 },
  dateText:   { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  bellBtn:    { position: "relative", width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  bellDot:    { position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: "#fff" },

  // Hero card
  heroPad:    { paddingHorizontal: 20, paddingTop: 20 },
  heroCard:   { borderRadius: 20, padding: 22, overflow: "hidden", ...Platform.select({ ios: { shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 }, android: { elevation: 8 } }) },
  heroRow1:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  heroLabel:  { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "500" },
  heroBadge:  { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  heroBadgeText: { color: "#E9D5FF", fontSize: 11, fontWeight: "600" },
  heroRow2:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  heroBigNum: { color: "#fff", fontSize: 46, fontWeight: "800", letterSpacing: -2 },
  eyeBtn:     { padding: 4 },
  progressTrack: { height: 5, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 3, overflow: "hidden" },
  progressFill:  { height: 5, backgroundColor: "#fff", borderRadius: 3 },
  heroStatsRow:  { flexDirection: "row", alignItems: "center", marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
  heroStatItem:  { flex: 1, alignItems: "center" },
  heroStatLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "500", marginBottom: 3 },
  heroStatValue: { color: "#fff", fontSize: 14, fontWeight: "700" },
  heroStatDiv:   { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.2)" },
  bubble1: { position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.07)", top: -40, right: -25, zIndex: 0 },
  bubble2: { position: "absolute", width: 90,  height: 90,  borderRadius: 45, backgroundColor: "rgba(255,255,255,0.05)", bottom: -25, right: 70, zIndex: 0 },

  // Action buttons  — white circle, gray border
  actionRow:   { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 20, paddingTop: 26, paddingBottom: 6 },
  actionItem:  { alignItems: "center", gap: 8, minWidth: 64 },
  actionCircle: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#E5E7EB",
    justifyContent: "center", alignItems: "center",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 }, android: { elevation: 1 } }),
  },
  actionLabel: { fontSize: 11.5, fontWeight: "500", color: "#374151", textAlign: "center", lineHeight: 16 },

  // Sections
  sectionWrap:   { paddingHorizontal: 20, marginTop: 26 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle:  { fontSize: 18, fontWeight: "700", color: "#111827", letterSpacing: -0.3 },
  viewAllLink:   { fontSize: 13, fontWeight: "600", color: "#7C3AED" },

  // List card — matches reference's white card with rows
  listCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }),
  },
  txRow:        { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  txRowBorder:  { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#F3F4F6" },
  txIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#F3F4F6",
    justifyContent: "center", alignItems: "center",
  },
  txTitle:      { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 2 },
  txTitleDone:  { color: "#9CA3AF" },
  txSub:        { fontSize: 12, color: "#9CA3AF" },
  txSubRight:   { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  txAmount:     { fontSize: 14, fontWeight: "700" },
  applyLink:    { fontSize: 12, fontWeight: "700", color: "#7C3AED" },
  grayChevron:  { width: 26, height: 26, borderRadius: 13, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },

  // Status chips
  openPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F0FDF4", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  openDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: "#22C55E" },
  openText: { fontSize: 11, fontWeight: "600", color: "#16A34A" },

  // Clock button
  clockBtn:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12 },
  clockBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  // Tips
  tipDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: "#E5E7EB" },
  tipDotActive: { width: 18, backgroundColor: "#7C3AED" },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  backdrop:  { backgroundColor: "rgba(0,0,0,0.55)" },
  sheetWrap: { flex: 1, justifyContent: "flex-end" },
  card: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingBottom: 32, paddingTop: 14, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16 }, android: { elevation: 10 } }) },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  title:  { fontSize: 18, fontWeight: "800", color: "#111827", letterSpacing: -0.3 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  body:     { gap: 14 },
  infoCard: { backgroundColor: "#F9FAFB", borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: "#F3F4F6" },
  infoRow:  { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  infoLabel: { fontSize: 10, fontWeight: "700", color: "#9CA3AF", letterSpacing: 0.5, marginBottom: 1 },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#111827" },
  stampWrap: { flexDirection: "row", gap: 14, justifyContent: "center" },
  stampRow:  { flexDirection: "row", alignItems: "center", gap: 5 },
  stampLbl:  { fontSize: 10, fontWeight: "700", color: "#9CA3AF" },
  stampVal:  { fontSize: 13, fontWeight: "700", color: "#111827" },
  totalRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLabel: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  totalPill:  { backgroundColor: "#F3F4F6", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  totalPillText: { fontSize: 13, fontWeight: "700", color: "#111827" },
  confirmBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#7C3AED", paddingVertical: 16, borderRadius: 16, ...Platform.select({ ios: { shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }, android: { elevation: 5 } }) },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  verifiedRow:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  verifiedText:   { fontSize: 12, color: "#9CA3AF" },
});

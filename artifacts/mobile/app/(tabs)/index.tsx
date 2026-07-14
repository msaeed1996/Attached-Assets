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

// ─── Static data ─────────────────────────────────────────────────────────────

const SAMPLE_INVITATIONS = [
  { id: "inv-1", jobTitle: "Warehouse Supervisor", company: "Amazon Logistics", location: "Austin, TX", pay: 28, payType: "hourly", startDate: "Tomorrow", urgent: true, jobId: "1" },
  { id: "inv-2", jobTitle: "Event Coordinator", company: "Prestige Events Co.", location: "Houston, TX", pay: 280, payType: "daily", startDate: "Saturday", urgent: false, jobId: "2" },
];

const NEARBY_JOBS = [
  { id: "n1", title: "Event Staff", company: "Prestige Events Co.", location: "Austin, TX", pay: 22, shift: "Sat 8AM–4PM", distance: "1.2 mi", icon: "star" },
  { id: "n2", title: "Warehouse Associate", company: "Amazon Logistics", location: "Austin, TX", pay: 19, shift: "Mon–Fri 6AM–2PM", distance: "3.4 mi", icon: "package" },
  { id: "n3", title: "Food Service Worker", company: "Levy Restaurants", location: "Austin, TX", pay: 17, shift: "Fri 5PM–11PM", distance: "2.1 mi", icon: "coffee" },
];

const ONBOARDING_TIPS = [
  "Add a profile photo to increase employer trust by 3×.",
  "Set your availability to start receiving shift offers.",
  "Workers with complete profiles get matched much faster.",
];

const QUICK_ACTIONS_EMPLOYER = [
  { icon: "plus-circle", label: "Post Job", route: "/post-job", color: "#5B5FEF", bg: "#EDEDFF" },
  { icon: "users", label: "Applicants", route: "/(tabs)/jobs", color: "#7c3aed", bg: "#ede9fe" },
  { icon: "briefcase", label: "My Jobs", route: "/(tabs)/jobs", color: "#0891b2", bg: "#cffafe" },
];

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

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

  const formatTime = (d: Date | null) =>
    d ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }) : "--:--";

  const myApplications = applications.filter((a) => a.workerId === "me");
  const myJobs = jobs.filter((j) => j.employerId === "emp-me");

  const workerQuickActions = [
    { icon: "briefcase", label: "Available\nJobs",       route: "/(tabs)/jobs",        color: "#5B5FEF", bg: "#EDEDFF" },
    { icon: "mail",      label: "Job\nInvitations",      route: "/(tabs)/invitations", color: "#7c3aed", bg: "#ede9fe", badge: myApplications.length || null },
    { icon: "layers",    label: "Job\nBoard",            route: "/job-board",          color: "#059669", bg: "#d1fae5" },
    { icon: "clock",     label: "Time\nSheet",           route: "/timesheet",          color: "#0891b2", bg: "#cffafe" },
  ];

  const quickActions = isEmployer ? QUICK_ACTIONS_EMPLOYER : workerQuickActions;

  return (
    <View style={s.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP BAR ── */}
        <View style={[s.topBar, { paddingTop: topPadding + 16 }]}>
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
            <Text style={s.greeting}>Hello {userProfile?.name?.split(" ")[0] || "there"} 👋</Text>
            <Text style={s.dateText}>{getDateString()}</Text>
          </View>
          <TouchableOpacity
            style={[s.notifBtn, totalUnread > 0 && s.notifBtnActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNotifVisible(true); }}
            activeOpacity={0.8}
          >
            <Feather name="bell" size={20} color={totalUnread > 0 ? "#5B5FEF" : "#374151"} />
            {totalUnread > 0 && <View style={s.notifDot} />}
          </TouchableOpacity>
        </View>

        {showOnboarding ? (
          <OnboardingDashboard pct={pct} />
        ) : (
          <>
            {/* ── HERO BALANCE-STYLE CARD ── */}
            <View style={s.heroPad}>
              <View style={s.heroCard}>
                <View style={s.heroCardInner}>
                  <Text style={s.heroCardLabel}>{isEmployer ? "Active Jobs" : "Jobs Completed"}</Text>
                  <View style={s.heroCardRow}>
                    <Text style={s.heroCardValue}>
                      {isEmployer ? String(myJobs.length) : String(userProfile?.completedJobs || 0)}
                    </Text>
                    <View style={s.heroCardBadge}>
                      <Feather name="trending-up" size={12} color="#A5F3FC" />
                      <Text style={s.heroCardBadgeText}>+2 this week</Text>
                    </View>
                  </View>
                  <View style={s.heroCardStats}>
                    <View style={s.heroStatItem}>
                      <Text style={s.heroStatLabel}>Rating</Text>
                      <Text style={s.heroStatValue}>{userProfile?.rating ?? "—"} ⭐</Text>
                    </View>
                    <View style={s.heroStatDiv} />
                    <View style={s.heroStatItem}>
                      <Text style={s.heroStatLabel}>Hours</Text>
                      <Text style={s.heroStatValue}>455 hrs</Text>
                    </View>
                    <View style={s.heroStatDiv} />
                    <View style={s.heroStatItem}>
                      <Text style={s.heroStatLabel}>Status</Text>
                      <Text style={[s.heroStatValue, { color: "#86EFAC" }]}>Active</Text>
                    </View>
                  </View>
                </View>
                {/* Decorative circles */}
                <View style={s.heroBubble1} />
                <View style={s.heroBubble2} />
              </View>
            </View>

            {/* ── QUICK ACTIONS ── */}
            <View style={s.qaPad}>
              {quickActions.map((a) => (
                <TouchableOpacity
                  key={a.label}
                  style={s.qaItem}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (a.route) router.push(a.route as any); }}
                  activeOpacity={0.8}
                >
                  <View style={[s.qaCircle, { backgroundColor: a.bg }]}>
                    <Feather name={a.icon as any} size={20} color={a.color} />
                    {"badge" in a && a.badge != null && (
                      <View style={s.qaBadge}><Text style={s.qaBadgeText}>{a.badge}</Text></View>
                    )}
                  </View>
                  <Text style={s.qaLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── ACTIVE JOB (worker) ── */}
            {!isEmployer && (() => {
              const acceptedApp = myApplications.find((a) => a.status === "accepted");
              const activeJob = acceptedApp ? jobs.find((j) => j.id === acceptedApp.jobId) : jobs[0];
              if (!activeJob) return null;
              return (
                <View style={s.sectionWrap}>
                  <SectionHeader title="Active Job" />
                  <View style={s.activeJobCard}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={[s.txIcon, { backgroundColor: "#EDEDFF" }]}>
                        <Feather name="briefcase" size={18} color="#5B5FEF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.txTitle}>{activeJob.title}</Text>
                        <Text style={s.txSub}>{activeJob.location}</Text>
                      </View>
                      <TouchableOpacity
                        style={[s.clockBtn, { backgroundColor: isClockedIn ? "#10b981" : "#5B5FEF" }]}
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          setActiveJobForModal(activeJob);
                          setClockModalMode(isClockedIn ? "out" : "in");
                          setClockInModalVisible(true);
                        }}
                        activeOpacity={0.85}
                      >
                        <Feather name={isClockedIn ? "log-out" : "clock"} size={13} color="#fff" />
                        <Text style={s.clockBtnText}>{isClockedIn ? "Out" : "In"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })()}

            {/* ── JOB INVITATIONS ── */}
            {!isEmployer && (
              <View style={s.sectionWrap}>
                <SectionHeader title="Job Invitations" onViewAll={() => router.push("/(tabs)/invitations")} />
                <View style={s.listCard}>
                  {SAMPLE_INVITATIONS.map((inv, i) => (
                    <TouchableOpacity
                      key={inv.id}
                      style={[s.txRow, i < SAMPLE_INVITATIONS.length - 1 && s.txRowBorder]}
                      activeOpacity={0.7}
                      onPress={() => router.push("/(tabs)/invitations")}
                    >
                      <View style={[s.txIcon, { backgroundColor: inv.urgent ? "#FEF2F2" : "#EDEDFF" }]}>
                        <Feather name="mail" size={18} color={inv.urgent ? "#EF4444" : "#5B5FEF"} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.txTitle} numberOfLines={1}>{inv.jobTitle}</Text>
                        <Text style={s.txSub}>{inv.company} · {inv.startDate}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[s.txAmount, { color: "#5B5FEF" }]}>${inv.pay}/{inv.payType === "hourly" ? "hr" : "day"}</Text>
                        {inv.urgent && <Text style={s.urgentTag}>Urgent</Text>}
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
                  <SectionHeader title="Upcoming Schedule" onViewAll={() => router.push("/upcoming-schedule")} viewAllLabel={`See all (${UPCOMING_SHIFTS.length})`} />
                  <View style={s.listCard}>
                    <TouchableOpacity style={s.txRow} activeOpacity={0.7} onPress={() => router.push(`/shift/${next.id}`)}>
                      <View style={[s.txIcon, { backgroundColor: "#D1FAE5" }]}>
                        <Feather name="briefcase" size={18} color="#059669" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.txTitle} numberOfLines={1}>{next.jobTitle}</Text>
                        <Text style={s.txSub}>{next.company} · {next.displayDate}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[s.txAmount, { color: "#059669" }]}>${next.estimatedEarnings}</Text>
                        <Text style={s.confirmedTag}>✓ Confirmed</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}

            {/* ── EMPLOYER: My Job Posts ── */}
            {isEmployer && (
              <View style={s.sectionWrap}>
                <SectionHeader title="My Job Posts" onViewAll={() => router.push("/post-job")} viewAllLabel="+ New" />
                <View style={s.listCard}>
                  {myJobs.length === 0 ? (
                    <TouchableOpacity style={[s.txRow, { borderBottomWidth: 0 }]} onPress={() => router.push("/post-job")} activeOpacity={0.8}>
                      <View style={[s.txIcon, { backgroundColor: "#EDEDFF" }]}>
                        <Feather name="plus-circle" size={18} color="#5B5FEF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.txTitle}>Post your first job</Text>
                        <Text style={s.txSub}>Workers are standing by — takes 2 min</Text>
                      </View>
                      <Feather name="arrow-right" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  ) : (
                    myJobs.map((job, i) => (
                      <TouchableOpacity key={job.id} style={[s.txRow, i < myJobs.length - 1 && s.txRowBorder]} onPress={() => router.push(`/job/${job.id}`)} activeOpacity={0.8}>
                        <View style={[s.txIcon, { backgroundColor: "#EDEDFF" }]}>
                          <Feather name="briefcase" size={18} color="#5B5FEF" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.txTitle}>{job.title}</Text>
                          <Text style={s.txSub}>{job.applicantsCount} applicants · {job.startDate}</Text>
                        </View>
                        <View style={[s.openPill]}>
                          <View style={s.openDot} />
                          <Text style={s.openText}>Open</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            )}

            {/* ── INSIGHTS ── */}
            <View style={[s.sectionWrap, { marginBottom: 8 }]}>
              <SectionHeader title="AI Insights" onViewAll={() => {}} viewAllLabel="View all ↗" />
              <View style={s.listCard}>
                <View style={[s.txRow, s.txRowBorder]}>
                  <View style={[s.txIcon, { backgroundColor: "#D1FAE5" }]}>
                    <Feather name="trending-up" size={18} color="#059669" />
                  </View>
                  <Text style={[s.txTitle, { flex: 1 }]}>
                    {isEmployer ? "Jobs with pay ranges fill 3× faster." : "Great! Complete your profile to get more matches."}
                  </Text>
                </View>
                <View style={s.txRow}>
                  <View style={[s.txIcon, { backgroundColor: "#FEF9C3" }]}>
                    <Feather name="bar-chart-2" size={18} color="#CA8A04" />
                  </View>
                  <Text style={[s.txTitle, { flex: 1 }]}>
                    {isEmployer ? "Urgent listings get 2× more applications." : "Workers with verified badges get 2× more callbacks."}
                  </Text>
                </View>
              </View>
            </View>
          </>
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
                  <MRow icon="briefcase" label="EVENT" value={activeJobForModal?.title || "Lunch Service"} />
                  <MRow icon="clock" label="SHIFT TIME" value="12:03 PM - 8:00 PM" />
                  <MRow icon="map-pin" label="LOCATION" value={activeJobForModal?.location || "Manhattan"} />
                </View>
                {(clockInTime || clockOutTime) && (
                  <View style={ms.stampWrap}>
                    {clockInTime && <View style={ms.stampRow}><Feather name="log-in" size={12} color="#10b981" /><Text style={ms.stampLbl}>IN</Text><Text style={ms.stampVal}>{formatTime(clockInTime)}</Text></View>}
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

function OnboardingDashboard({ pct }: { pct: number }) {
  const { userProfile } = useApp();
  const { items, completedCount, total } = useProfileCompletion();
  const [tipIdx, setTipIdx] = useState(0);
  const profileLocked = pct < 60;

  const onboardingActions = [
    { icon: "user",         label: "Complete\nProfile",    route: "/(tabs)/profile",        color: "#5B5FEF", bg: "#EDEDFF" },
    { icon: "briefcase",    label: "Browse\nJobs",         route: "/(tabs)/jobs",           color: "#059669", bg: "#D1FAE5" },
    { icon: "upload",       label: "Upload\nResume",       route: "/signup-profile",        color: "#f97316", bg: "#ffedd5" },
    { icon: "calendar",     label: "Set\nAvailability",    route: "/(tabs)/availability",   color: "#0891b2", bg: "#CFFAFE" },
  ];

  return (
    <View>
      {/* ── Hero Completion Card ── */}
      <View style={ob.heroPad}>
        <View style={ob.heroCard}>
          <View style={ob.heroBubble1} />
          <View style={ob.heroBubble2} />
          <View style={ob.heroContent}>
            <Text style={ob.heroLabel}>Profile Completion</Text>
            <View style={ob.heroRow}>
              <Text style={ob.heroPct}>{pct}%</Text>
              <View style={ob.heroBadge}>
                <Feather name="trending-up" size={11} color="#A5F3FC" />
                <Text style={ob.heroBadgeText}>{completedCount}/{total} steps</Text>
              </View>
            </View>
            <View style={ob.progressTrack}>
              <View style={[ob.progressFill, { width: `${pct}%` as any }]} />
            </View>
            <TouchableOpacity
              style={ob.heroBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/profile"); }}
              activeOpacity={0.88}
            >
              <Text style={ob.heroBtnText}>Complete Profile</Text>
              <Feather name="arrow-right" size={15} color="#5B5FEF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Quick Action Icons ── */}
      <View style={s.qaPad}>
        {onboardingActions.map((a) => (
          <TouchableOpacity
            key={a.label}
            style={s.qaItem}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(a.route as any); }}
            activeOpacity={0.8}
          >
            <View style={[s.qaCircle, { backgroundColor: a.bg }]}>
              <Feather name={a.icon as any} size={20} color={a.color} />
            </View>
            <Text style={s.qaLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Getting Started Checklist ── */}
      <View style={s.sectionWrap}>
        <SectionHeader title="Getting Started" onViewAll={() => router.push("/(tabs)/profile")} viewAllLabel="View profile ↗" />
        <View style={s.listCard}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={item.key}
              style={[s.txRow, i < items.length - 1 && s.txRowBorder]}
              activeOpacity={0.7}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/profile"); }}
            >
              <View style={[s.txIcon, { backgroundColor: item.done ? "#D1FAE5" : "#F3F4F6" }]}>
                <Feather name={item.icon as any} size={17} color={item.done ? "#059669" : "#9CA3AF"} />
              </View>
              <Text style={[s.txTitle, { flex: 1 }, item.done && s.txTitleDone]}>{item.label}</Text>
              {item.done
                ? <Feather name="check-circle" size={18} color="#22C55E" />
                : <Feather name="chevron-right" size={16} color="#D1D5DB" />
              }
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Jobs Near You ── */}
      <View style={s.sectionWrap}>
        <SectionHeader title="Jobs Near You" onViewAll={() => router.push("/(tabs)/jobs")} viewAllLabel="View all ↗" />
        <View style={s.listCard}>
          {NEARBY_JOBS.map((job, i) => (
            <View key={job.id} style={[s.txRow, i < NEARBY_JOBS.length - 1 && s.txRowBorder]}>
              <View style={[s.txIcon, { backgroundColor: "#EDEDFF" }]}>
                <Feather name={job.icon as any} size={17} color="#5B5FEF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.txTitle} numberOfLines={1}>{job.title}</Text>
                <Text style={s.txSub}>{job.company} · {job.distance}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={[s.txAmount, { color: "#111827" }]}>${job.pay}/hr</Text>
                {profileLocked ? (
                  <View style={ob.lockTag}>
                    <Feather name="lock" size={9} color="#9CA3AF" />
                    <Text style={ob.lockTagText}>Profile needed</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={ob.applyTag}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/jobs"); }}
                  >
                    <Text style={ob.applyTagText}>Apply</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── Tips ── */}
      <View style={[s.sectionWrap, { marginBottom: 8 }]}>
        <SectionHeader title="Tips & Guidance" />
        <View style={ob.tipCard}>
          <View style={ob.tipTop}>
            <Text style={{ fontSize: 22 }}>💡</Text>
            <Text style={ob.tipText}>{ONBOARDING_TIPS[tipIdx]}</Text>
          </View>
          <View style={ob.tipNav}>
            {ONBOARDING_TIPS.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setTipIdx(i)} hitSlop={10}>
                <View style={[ob.tipDot, i === tipIdx && ob.tipDotActive]} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={ob.tipNext} onPress={() => setTipIdx((tipIdx + 1) % ONBOARDING_TIPS.length)}>
              <Text style={ob.tipNextText}>Next</Text>
              <Feather name="chevron-right" size={13} color="#5B5FEF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function SectionHeader({ title, onViewAll, viewAllLabel = "View all ↗" }: { title: string; onViewAll?: () => void; viewAllLabel?: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll}>
          <Text style={s.viewAll}>{viewAllLabel}</Text>
        </TouchableOpacity>
      )}
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

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatarWrap: { position: "relative" },
  avatarImg: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "#5B5FEF",
    justifyContent: "center", alignItems: "center",
  },
  avatarLetter: { color: "#fff", fontSize: 18, fontWeight: "700" },
  greeting: { fontSize: 17, fontWeight: "700", color: "#111827", letterSpacing: -0.2 },
  dateText: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center", alignItems: "center",
    position: "relative",
  },
  notifBtnActive: { backgroundColor: "#EDEDFF" },
  notifDot: {
    position: "absolute", top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5, borderColor: "#fff",
  },

  heroPad: { paddingHorizontal: 20, paddingTop: 20 },

  // Full dashboard hero
  heroCard: {
    borderRadius: 22,
    overflow: "hidden",
    padding: 22,
    backgroundColor: "#5B5FEF",
    ...Platform.select({ ios: { shadowColor: "#5B5FEF", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 }, android: { elevation: 8 } }),
  },
  heroCardInner: { zIndex: 2 },
  heroCardLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "500", marginBottom: 6 },
  heroCardRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  heroCardValue: { color: "#fff", fontSize: 42, fontWeight: "800", letterSpacing: -1 },
  heroCardBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  heroCardBadgeText: { color: "#A5F3FC", fontSize: 12, fontWeight: "600" },
  heroCardStats: { flexDirection: "row", alignItems: "center", paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
  heroStatItem: { flex: 1, alignItems: "center" },
  heroStatLabel: { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "500", marginBottom: 2 },
  heroStatValue: { color: "#fff", fontSize: 14, fontWeight: "700" },
  heroStatDiv: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)" },
  heroBubble1: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.08)", top: -30, right: -20 },
  heroBubble2: { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.06)", bottom: -20, right: 60 },

  // Quick Actions row
  qaPad: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  qaItem: { alignItems: "center", gap: 8 },
  qaCircle: {
    width: 56, height: 56, borderRadius: 18,
    justifyContent: "center", alignItems: "center",
    position: "relative",
  },
  qaBadge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: "#EF4444",
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: "#FAFAFA",
  },
  qaBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  qaLabel: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center", lineHeight: 15 },

  // Section
  sectionWrap: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#111827", letterSpacing: -0.2 },
  viewAll: { fontSize: 13, fontWeight: "600", color: "#5B5FEF" },

  // List card
  listCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }),
  },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  txRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  txIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  txTitle: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 2 },
  txTitleDone: { color: "#9CA3AF" },
  txSub: { fontSize: 12, color: "#9CA3AF", fontWeight: "400" },
  txAmount: { fontSize: 14, fontWeight: "700" },
  urgentTag: { fontSize: 10, fontWeight: "700", color: "#EF4444" },
  confirmedTag: { fontSize: 10, fontWeight: "600", color: "#059669" },
  openPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F0FDF4", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  openDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#22C55E" },
  openText: { fontSize: 11, fontWeight: "600", color: "#16A34A" },

  // Active job clock btn
  activeJobCard: {
    backgroundColor: "#fff", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "#F3F4F6",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }),
  },
  clockBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  clockBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});

// ─── Onboarding styles ────────────────────────────────────────────────────────

const ob = StyleSheet.create({
  heroPad: { paddingHorizontal: 20, paddingTop: 20 },
  heroCard: {
    borderRadius: 22, overflow: "hidden", padding: 22, backgroundColor: "#5B5FEF",
    ...Platform.select({ ios: { shadowColor: "#5B5FEF", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 }, android: { elevation: 8 } }),
  },
  heroBubble1: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.07)", top: -40, right: -30 },
  heroBubble2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: 20 },
  heroContent: { zIndex: 2 },
  heroLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "500", marginBottom: 6 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  heroPct: { color: "#fff", fontSize: 52, fontWeight: "800", letterSpacing: -2 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  heroBadgeText: { color: "#A5F3FC", fontSize: 12, fontWeight: "600" },
  progressTrack: { height: 6, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 3, overflow: "hidden", marginBottom: 16 },
  progressFill: { height: 6, backgroundColor: "#fff", borderRadius: 3 },
  heroBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#fff", paddingVertical: 13, borderRadius: 14,
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 }, android: { elevation: 3 } }),
  },
  heroBtnText: { color: "#5B5FEF", fontSize: 15, fontWeight: "700" },

  lockTag: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#F3F4F6", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  lockTagText: { fontSize: 9, fontWeight: "600", color: "#9CA3AF" },
  applyTag: { backgroundColor: "#5B5FEF", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  applyTagText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  tipCard: {
    backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#F3F4F6",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }),
  },
  tipTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  tipText: { flex: 1, fontSize: 14, color: "#374151", lineHeight: 22, fontWeight: "500" },
  tipNav: { flexDirection: "row", alignItems: "center", gap: 6 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#E5E7EB" },
  tipDotActive: { width: 18, backgroundColor: "#5B5FEF" },
  tipNext: { flexDirection: "row", alignItems: "center", gap: 2, marginLeft: "auto" },
  tipNextText: { fontSize: 13, fontWeight: "600", color: "#5B5FEF" },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(0,0,0,0.55)" },
  sheetWrap: { flex: 1, justifyContent: "flex-end" },
  card: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingBottom: 32, paddingTop: 14, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16 }, android: { elevation: 10 } }) },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  title: { fontSize: 18, fontWeight: "800", color: "#111827", letterSpacing: -0.3 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  body: { gap: 14 },
  infoCard: { backgroundColor: "#f9fafb", borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: "#f3f4f6" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  infoLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5, marginBottom: 1 },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#111827" },
  stampWrap: { flexDirection: "row", gap: 14, justifyContent: "center" },
  stampRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  stampLbl: { fontSize: 10, fontWeight: "700", color: "#9ca3af" },
  stampVal: { fontSize: 13, fontWeight: "700", color: "#111827" },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLabel: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  totalPill: { backgroundColor: "#f3f4f6", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  totalPillText: { fontSize: 13, fontWeight: "700", color: "#111827" },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#5B5FEF", paddingVertical: 16, borderRadius: 16, ...Platform.select({ ios: { shadowColor: "#5B5FEF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }, android: { elevation: 5 } }) },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  verifiedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  verifiedText: { fontSize: 12, color: "#9ca3af" },
});

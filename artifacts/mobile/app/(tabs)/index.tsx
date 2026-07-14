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

// ─── Sample data ────────────────────────────────────────────────────────────

const SAMPLE_INVITATIONS = [
  { id: "inv-1", jobTitle: "Warehouse Supervisor", company: "Amazon Logistics", companyRating: 4.2, location: "Austin, TX", pay: 28, payType: "hourly", startDate: "Tomorrow", duration: "1 week", sentAt: "30 min ago", urgent: true, jobId: "1" },
  { id: "inv-2", jobTitle: "Event Coordinator", company: "Prestige Events Co.", companyRating: 4.7, location: "Houston, TX", pay: 280, payType: "daily", startDate: "Saturday", duration: "2 days", sentAt: "2 hours ago", urgent: false, jobId: "2" },
];

const NEARBY_JOBS = [
  { id: "n1", title: "Event Staff", company: "Prestige Events Co.", location: "Austin, TX", pay: 22, shift: "Sat 8AM–4PM", distance: "1.2 mi" },
  { id: "n2", title: "Warehouse Associate", company: "Amazon Logistics", location: "Austin, TX", pay: 19, shift: "Mon–Fri 6AM–2PM", distance: "3.4 mi" },
  { id: "n3", title: "Food Service Worker", company: "Levy Restaurants", location: "Austin, TX", pay: 17, shift: "Fri 5PM–11PM", distance: "2.1 mi" },
];

const ONBOARDING_TIPS = [
  { icon: "camera", text: "Add a profile photo to increase employer trust by 3×." },
  { icon: "calendar", text: "Set your availability to start receiving shift offers." },
  { icon: "award", text: "Workers with complete profiles are matched much faster." },
];

const QUICK_ACTIONS_EMPLOYER = [
  { icon: "plus-circle", label: "Post Job", route: "/post-job", color: "#2563EB", bg: "#dbeafe" },
  { icon: "users", label: "Applicants", route: "/(tabs)/jobs", color: "#7c3aed", bg: "#ede9fe" },
  { icon: "briefcase", label: "My Jobs", route: "/(tabs)/jobs", color: "#0891b2", bg: "#cffafe" },
];

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Profile completion logic ────────────────────────────────────────────────

function useProfileCompletion() {
  const { userProfile } = useApp();
  const [availabilitySet] = useState(false);

  const items = [
    { key: "account",    label: "Account Created",               done: true },
    { key: "email",      label: "Verify Email",                  done: !!userProfile?.email },
    { key: "photo",      label: "Upload Profile Photo",          done: !!userProfile?.avatar },
    { key: "skills",     label: "Add Skills",                    done: (userProfile?.skills?.length ?? 0) > 0 },
    { key: "experience", label: "Add Work Experience",           done: !!userProfile?.jobTitle },
    { key: "identity",   label: "Complete Identity Verification", done: !!userProfile?.verified },
    { key: "bio",        label: "Write a Bio",                   done: !!userProfile?.bio && (userProfile.bio?.length ?? 0) > 20 },
    { key: "avail",      label: "Set Availability",              done: availabilitySet },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const pct = Math.round((completedCount / items.length) * 100);
  return { items, completedCount, total: items.length, pct };
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, userRole } = useApp();
  const { jobs, applications } = useJobs();
  const { conversations } = useMessages();
  const { pct } = useProfileCompletion();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const isEmployer = userRole === "employer";
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

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
    { icon: "briefcase", label: "Available Jobs", route: "/(tabs)/jobs", color: "#2563EB", bg: "#dbeafe", badge: null },
    { icon: "mail", label: "Job Invitation", route: "/(tabs)/invitations", color: "#7c3aed", bg: "#ede9fe", badge: myApplications.length > 0 ? myApplications.length : null },
    { icon: "layers", label: "Job Board", route: "/job-board", color: "#059669", bg: "#d1fae5", badge: null },
    { icon: "clock", label: "Time Sheet", route: "/timesheet", color: "#0891b2", bg: "#cffafe", badge: null },
  ];

  const quickActions = isEmployer ? QUICK_ACTIONS_EMPLOYER : workerQuickActions;

  const showOnboarding = !isEmployer && pct < 80;

  return (
    <View style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO HEADER ── */}
        <View style={[styles.hero, { paddingTop: topPadding + 20 }]}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.heroGreeting}>{getTimeOfDay()}</Text>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroName}>
                  {userProfile?.name?.split(" ")[0] || "Welcome"}
                </Text>
                {!isEmployer && !showOnboarding && (
                  <View style={styles.approvedBadge}>
                    <Feather name="check-circle" size={12} color="#34d399" />
                    <Text style={styles.approvedBadgeText}>Approved</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.topBarRight}>
              {totalUnread > 0 && (
                <TouchableOpacity style={styles.notifBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNotifVisible(true); }}>
                  <Feather name="bell" size={20} color="#fff" />
                  <View style={styles.notifDot} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.avatarCircle} onPress={() => router.push("/(tabs)/profile")}>
                {userProfile?.avatar ? (
                  <Image source={{ uri: userProfile.avatar }} style={{ width: "100%", height: "100%", borderRadius: 999 }} />
                ) : (
                  <Text style={styles.avatarLetter}>{(userProfile?.name || "U").charAt(0)}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {isEmployer && (
            <View style={styles.rolePill}>
              <View style={[styles.roleDot, { backgroundColor: "#60a5fa" }]} />
              <Text style={styles.rolePillText}>{`Employer · ${userProfile?.company || ""}`}</Text>
            </View>
          )}

          {/* Stat tiles — only for full dashboard */}
          {!showOnboarding && (
            <View style={styles.statTiles}>
              {isEmployer ? (
                <>
                  <StatTile icon="briefcase" value={String(myJobs.length)} label="Active Jobs" accent="#60a5fa" />
                  <StatTile icon="users" value="12" label="Total Hired" accent="#a78bfa" />
                  <StatTile icon="trending-up" value="98%" label="Fill Rate" accent="#34d399" />
                </>
              ) : (
                <>
                  <StatTile icon="award" value={String(userProfile?.completedJobs || 0)} label="Jobs Completed" accent="#60a5fa" />
                  <StatTile icon="star" value={String(userProfile?.rating || "—")} label="Rating" accent="#fbbf24" />
                  <StatTile icon="clock" value="455" label="Job Hours" accent="#34d399" />
                </>
              )}
            </View>
          )}
        </View>

        {/* ═══════════════════════════════════════════════════════════════
            ONBOARDING DASHBOARD (profile < 80%)
        ═══════════════════════════════════════════════════════════════ */}
        {showOnboarding ? (
          <OnboardingDashboard pct={pct} topPadding={topPadding} />
        ) : (
          <>
            {/* ── ACTIVE JOB CARD (worker only) ── */}
            {!isEmployer && (() => {
              const acceptedApp = myApplications.find((a) => a.status === "accepted");
              const activeJob = acceptedApp ? jobs.find((j) => j.id === acceptedApp.jobId) : jobs[0];
              if (!activeJob) return null;
              return (
                <View style={styles.activeJobSection}>
                  <View style={[styles.activeJobCard, { borderColor: isClockedIn ? "#10b981" : "#2563EB" }]}>
                    <View style={styles.activeJobLeft}>
                      <View style={styles.activeJobHeader}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activeJobBadge}>ACTIVE JOB — #1</Text>
                      </View>
                      <Text style={styles.activeJobTitle} numberOfLines={1}>{activeJob.title}</Text>
                      <View style={styles.activeJobLocation}>
                        <Feather name="map-pin" size={11} color="#2563EB" />
                        <Text style={styles.activeJobLocationText}>{activeJob.location}</Text>
                      </View>
                    </View>
                    <View style={styles.activeJobRight}>
                      <TouchableOpacity
                        style={[styles.clockInBtn, { backgroundColor: isClockedIn ? "#10b981" : "#2563EB" }]}
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          setActiveJobForModal(activeJob);
                          setClockModalMode(isClockedIn ? "out" : "in");
                          setClockInModalVisible(true);
                        }}
                        activeOpacity={0.85}
                      >
                        <Feather name={isClockedIn ? "log-out" : "clock"} size={14} color="#fff" />
                        <Text style={styles.clockInText}>{isClockedIn ? "CLOCK OUT" : "CLOCK IN"}</Text>
                      </TouchableOpacity>
                      <Text style={styles.activeJobPayBelow}>${activeJob.pay}/{activeJob.payType}</Text>
                    </View>
                  </View>
                </View>
              );
            })()}

            {/* ── QUICK ACTIONS ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: "#374151" }]}>Quick Actions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
                {quickActions.map((a) => (
                  <TouchableOpacity
                    key={a.label}
                    style={[styles.quickCard, { backgroundColor: "#fff" }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (a.route) router.push(a.route as any); }}
                    activeOpacity={0.82}
                  >
                    <View style={styles.quickIconWrap}>
                      <View style={[styles.quickIcon, { backgroundColor: a.bg }]}>
                        <Feather name={a.icon as any} size={16} color={a.color} />
                      </View>
                      {a.badge != null && (
                        <View style={styles.quickBadge}>
                          <Text style={styles.quickBadgeText}>{a.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.quickLabel, { color: "#111827" }]}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* ── JOB INVITATIONS ── */}
            {!isEmployer && (
              <View style={styles.section}>
                <View style={styles.sectionRow}>
                  <Text style={[styles.sectionLabel, { color: "#374151" }]}>Job Invitations</Text>
                  <TouchableOpacity onPress={() => router.push("/(tabs)/invitations")}>
                    <Text style={[styles.seeAllText, { color: "#2563EB" }]}>See all</Text>
                  </TouchableOpacity>
                </View>
                {SAMPLE_INVITATIONS.slice(0, 2).map((inv) => (
                  <TouchableOpacity
                    key={inv.id}
                    style={styles.upcomingJobRow}
                    activeOpacity={0.85}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/invitations"); }}
                  >
                    <View style={[styles.upcomingJobIcon, { backgroundColor: inv.urgent ? "#fef2f2" : "#ede9fe" }]}>
                      <Feather name="mail" size={17} color={inv.urgent ? "#ef4444" : "#7c3aed"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.upcomingJobTitle, { color: "#111827" }]} numberOfLines={1}>{inv.jobTitle}</Text>
                      <Text style={[styles.upcomingJobMeta, { color: "#6b7280" }]}>{inv.company} · {inv.startDate}</Text>
                    </View>
                    <View style={styles.upcomingJobRight}>
                      <Text style={[styles.upcomingJobPay, { color: "#2563EB" }]}>${inv.pay}<Text style={[styles.upcomingJobPayType, { color: "#9ca3af" }]}>/{inv.payType}</Text></Text>
                      {inv.urgent && <View style={styles.upcomingUrgentTag}><Text style={styles.upcomingUrgentText}>Urgent</Text></View>}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── UPCOMING SCHEDULE ── */}
            {!isEmployer && UPCOMING_SHIFTS.length > 0 && (() => {
              const next = UPCOMING_SHIFTS[0];
              return (
                <View style={styles.section}>
                  <View style={styles.sectionRow}>
                    <Text style={[styles.sectionLabel, { color: "#374151" }]}>Upcoming Schedule</Text>
                    <TouchableOpacity onPress={() => router.push("/upcoming-schedule")}>
                      <Text style={[styles.seeAllText, { color: "#2563EB" }]}>See all ({UPCOMING_SHIFTS.length})</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.upcomingJobRow} activeOpacity={0.85} onPress={() => router.push(`/shift/${next.id}`)}>
                    <View style={[styles.upcomingJobIcon, { backgroundColor: "#dbeafe" }]}>
                      <Feather name="briefcase" size={17} color="#2563eb" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.upcomingJobTitle, { color: "#111827" }]} numberOfLines={1}>{next.jobTitle}</Text>
                      <Text style={[styles.upcomingJobMeta, { color: "#6b7280" }]}>{next.company} · {next.displayDate} · {next.startTime}</Text>
                    </View>
                    <View style={styles.upcomingJobRight}>
                      <Text style={[styles.upcomingJobPay, { color: "#10b981" }]}>${next.estimatedEarnings}</Text>
                      <View style={styles.confirmedBadge}>
                        <Feather name="check-circle" size={10} color="#10b981" />
                        <Text style={styles.confirmedBadgeText}>Confirmed</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* ── EMPLOYER: Job Posts ── */}
            {isEmployer && (
              <View style={styles.section}>
                <View style={styles.sectionRow}>
                  <Text style={[styles.sectionLabel, { color: "#374151" }]}>My Job Posts</Text>
                  <TouchableOpacity style={styles.newJobBtn} onPress={() => router.push("/post-job")}>
                    <Feather name="plus" size={14} color="#2563EB" />
                    <Text style={[styles.newJobBtnText, { color: "#2563EB" }]}>New</Text>
                  </TouchableOpacity>
                </View>
                {myJobs.length === 0 ? (
                  <TouchableOpacity style={styles.emptyPostCard} onPress={() => router.push("/post-job")} activeOpacity={0.85}>
                    <View style={[styles.emptyPostIcon, { backgroundColor: "#dbeafe" }]}>
                      <Feather name="plus-circle" size={26} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.emptyPostTitle, { color: "#111827" }]}>Post your first job</Text>
                      <Text style={[styles.emptyPostSub, { color: "#6b7280" }]}>Workers are standing by — takes 2 minutes</Text>
                    </View>
                    <Feather name="arrow-right" size={18} color="#2563EB" />
                  </TouchableOpacity>
                ) : (
                  myJobs.map((job) => (
                    <TouchableOpacity key={job.id} style={styles.jobPostRow} onPress={() => router.push(`/job/${job.id}`)} activeOpacity={0.85}>
                      <View style={[styles.jobPostIcon, { backgroundColor: "#eff6ff" }]}>
                        <Feather name="briefcase" size={18} color="#2563EB" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.jobPostTitle, { color: "#111827" }]}>{job.title}</Text>
                        <Text style={[styles.jobPostMeta, { color: "#6b7280" }]}>{job.applicantsCount} applicants · {job.startDate}</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: "#ecfdf5" }]}>
                        <View style={[styles.openDot, { backgroundColor: "#10b981" }]} />
                        <Text style={[styles.statusPillText, { color: "#10b981" }]}>Open</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* ── INSIGHT CARD ── */}
            <View style={[styles.section, { marginBottom: 8 }]}>
              <View style={styles.insightCard}>
                <View style={styles.insightLeft}>
                  <View style={[styles.insightIcon, { backgroundColor: "rgba(96,165,250,0.15)" }]}>
                    <Feather name="trending-up" size={20} color="#60a5fa" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightTitle}>{isEmployer ? "Boost visibility" : "Improve your profile"}</Text>
                    <Text style={styles.insightBody}>
                      {isEmployer
                        ? "Jobs with clear pay ranges fill 3× faster. Add salary details to attract top candidates."
                        : "Workers with verified badges get 2× more callbacks. Complete your verification today."}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.insightCta}>
                  <Text style={styles.insightCtaText}>{isEmployer ? "Edit Job" : "Verify Now"}</Text>
                </TouchableOpacity>
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
              style={[modalStyles.backdrop, StyleSheet.absoluteFill, Platform.OS === "web" && ({ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" } as any)]}
              onPress={() => setClockInModalVisible(false)}
            />
          )}
          <Pressable style={modalStyles.sheetWrap} onPress={() => setClockInModalVisible(false)}>
            <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
              <View style={modalStyles.handle} />
              <View style={modalStyles.header}>
                <Text style={modalStyles.title}>{clockModalMode === "out" ? "Ready to Clock Out?" : "Ready to Clock In?"}</Text>
                <TouchableOpacity style={modalStyles.closeBtn} onPress={() => setClockInModalVisible(false)} hitSlop={8}>
                  <Feather name="x" size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <View style={modalStyles.body}>
                <View style={modalStyles.infoCard}>
                  <ModalInfoRow icon="briefcase" label="EVENT" value={activeJobForModal?.title || "Lunch Service"} />
                  <ModalInfoRow icon="clock" label="SHIFT TIME" value="12:03 PM - 8:00 PM" />
                  <ModalInfoRow icon="map-pin" label="LOCATION" value={activeJobForModal?.location || "Manhattan"} />
                </View>
                {(clockInTime || clockOutTime) && (
                  <View style={modalStyles.timeStampWrap}>
                    {clockInTime && (
                      <View style={modalStyles.timeStampRow}>
                        <Feather name="log-in" size={12} color="#10b981" />
                        <Text style={modalStyles.timeStampLabel}>IN</Text>
                        <Text style={modalStyles.timeStampValue}>{formatTime(clockInTime)}</Text>
                      </View>
                    )}
                    {clockOutTime && (
                      <View style={modalStyles.timeStampRow}>
                        <Feather name="log-out" size={12} color="#ef4444" />
                        <Text style={modalStyles.timeStampLabel}>OUT</Text>
                        <Text style={modalStyles.timeStampValue}>{formatTime(clockOutTime)}</Text>
                      </View>
                    )}
                  </View>
                )}
                <View style={modalStyles.totalRow}>
                  <Text style={modalStyles.totalLabel}>Total Time Logged:</Text>
                  <View style={modalStyles.totalPill}>
                    <Text style={modalStyles.totalPillText}>0.0 hours</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[modalStyles.confirmBtn, clockModalMode === "out" && { backgroundColor: "#ef4444", shadowColor: "#ef4444" }]}
                  activeOpacity={0.9}
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    if (clockModalMode === "out") { setClockOutTime(new Date()); setIsClockedIn(false); }
                    else { setClockInTime(new Date()); setClockOutTime(null); setIsClockedIn(true); }
                    setClockInModalVisible(false);
                  }}
                >
                  <Feather name={clockModalMode === "out" ? "log-out" : "clock"} size={20} color="#fff" />
                  <Text style={modalStyles.confirmBtnText}>{clockModalMode === "out" ? "Clock Out Now" : "Clock In Now"}</Text>
                </TouchableOpacity>
                <View style={modalStyles.verifiedRow}>
                  <Feather name="navigation" size={11} color="#9ca3af" />
                  <Text style={modalStyles.verifiedText}>Location verified</Text>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

// ─── Onboarding Dashboard ────────────────────────────────────────────────────

function OnboardingDashboard({ pct, topPadding }: { pct: number; topPadding: number }) {
  const { userProfile } = useApp();
  const { items } = useProfileCompletion();
  const [tipIdx, setTipIdx] = useState(0);
  const firstName = userProfile?.name?.split(" ")[0] || "there";
  const profileLocked = pct < 60;

  const onboardingQuickActions = [
    { icon: "user", label: "Complete Profile", route: "/(tabs)/profile", color: "#2563EB", bg: "#dbeafe" },
    { icon: "briefcase", label: "Browse Jobs", route: "/(tabs)/jobs", color: "#7c3aed", bg: "#ede9fe" },
    { icon: "upload", label: "Upload Resume", route: "/signup-profile", color: "#059669", bg: "#d1fae5" },
    { icon: "calendar", label: "Set Availability", route: "/(tabs)/availability", color: "#f97316", bg: "#ffedd5" },
    { icon: "headphones", label: "Contact Support", route: "/(tabs)/messages", color: "#0891b2", bg: "#cffafe" },
    { icon: "help-circle", label: "Help Center", route: "/(tabs)/messages", color: "#6b7280", bg: "#f3f4f6" },
  ];

  return (
    <View>
      {/* ── Welcome Hero Card ── */}
      <View style={ob.heroPad}>
        <View style={ob.welcomeCard}>
          <View style={ob.welcomeTop}>
            <View style={ob.waveEmoji}>
              <Text style={{ fontSize: 22 }}>👋</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ob.welcomeTitle}>Welcome, {firstName}!</Text>
              <Text style={ob.welcomeSub}>Complete your profile to unlock job opportunities near you.</Text>
            </View>
          </View>

          <View style={ob.progressSection}>
            <View style={ob.progressLabelRow}>
              <Text style={ob.progressLabel}>Profile Completion</Text>
              <Text style={ob.progressPct}>{pct}%</Text>
            </View>
            <View style={ob.progressTrack}>
              <View style={[ob.progressFill, { width: `${pct}%` as any }]} />
            </View>
          </View>

          <TouchableOpacity
            style={ob.completeProfileBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/profile"); }}
            activeOpacity={0.88}
          >
            <Feather name="user" size={16} color="#fff" />
            <Text style={ob.completeProfileBtnText}>Complete Profile</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Getting Started Checklist ── */}
      <View style={styles.section}>
        <View style={ob.checklistCard}>
          <Text style={ob.checklistTitle}>Getting Started</Text>
          <Text style={ob.checklistSub}>Complete these steps to begin receiving job offers.</Text>
          <View style={ob.checklistItems}>
            {items.map((item, i) => (
              <TouchableOpacity
                key={item.key}
                style={[ob.checklistRow, i < items.length - 1 && ob.checklistRowBorder]}
                activeOpacity={0.7}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/profile"); }}
              >
                <View style={[ob.checkCircle, item.done && ob.checkCircleDone]}>
                  {item.done
                    ? <Feather name="check" size={11} color="#fff" />
                    : <View style={ob.checkCircleEmpty} />
                  }
                </View>
                <Text style={[ob.checkLabel, item.done && ob.checkLabelDone]}>{item.label}</Text>
                {!item.done && <Feather name="chevron-right" size={14} color="#d1d5db" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* ── Jobs Near You ── */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionLabel, { color: "#374151" }]}>Jobs Near You</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")}>
            <Text style={[styles.seeAllText, { color: "#2563EB" }]}>See all</Text>
          </TouchableOpacity>
        </View>
        {NEARBY_JOBS.map((job) => (
          <View key={job.id} style={ob.nearbyJobCard}>
            <View style={ob.nearbyJobTop}>
              <View style={ob.nearbyJobIcon}>
                <Feather name="briefcase" size={18} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ob.nearbyJobTitle}>{job.title}</Text>
                <Text style={ob.nearbyJobCompany}>{job.company}</Text>
              </View>
              <View style={ob.nearbyJobPayBox}>
                <Text style={ob.nearbyJobPay}>${job.pay}</Text>
                <Text style={ob.nearbyJobPayType}>/hr</Text>
              </View>
            </View>
            <View style={ob.nearbyJobMeta}>
              <View style={ob.nearbyMetaItem}>
                <Feather name="map-pin" size={11} color="#6b7280" />
                <Text style={ob.nearbyMetaText}>{job.location}</Text>
              </View>
              <View style={ob.nearbyMetaDot} />
              <View style={ob.nearbyMetaItem}>
                <Feather name="clock" size={11} color="#6b7280" />
                <Text style={ob.nearbyMetaText}>{job.shift}</Text>
              </View>
              <View style={ob.nearbyMetaDot} />
              <View style={ob.nearbyMetaItem}>
                <Feather name="navigation" size={11} color="#6b7280" />
                <Text style={ob.nearbyMetaText}>{job.distance}</Text>
              </View>
            </View>
            <View style={ob.nearbyJobActions}>
              <TouchableOpacity style={ob.saveJobBtn} hitSlop={8}>
                <Feather name="bookmark" size={15} color="#6b7280" />
              </TouchableOpacity>
              {profileLocked ? (
                <View style={ob.lockedApplyBtn}>
                  <Feather name="lock" size={13} color="#9ca3af" />
                  <Text style={ob.lockedApplyText}>Complete profile to apply</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={ob.applyBtn}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/jobs"); }}
                  activeOpacity={0.85}
                >
                  <Text style={ob.applyBtnText}>Apply Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* ── Profile Strength Card ── */}
      <View style={styles.section}>
        <View style={ob.strengthCard}>
          <View style={ob.strengthHeader}>
            <View style={ob.strengthIcon}>
              <Feather name="trending-up" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ob.strengthTitle}>Increase Your Hiring Chances</Text>
              <Text style={ob.strengthSub}>Workers with complete profiles receive more job invitations.</Text>
            </View>
          </View>
          <View style={ob.benefitsList}>
            {["Receive job invitations sooner", "Appear in employer searches", "Faster approval process"].map((b) => (
              <View key={b} style={ob.benefitRow}>
                <View style={ob.benefitCheck}>
                  <Feather name="check" size={11} color="#2563EB" />
                </View>
                <Text style={ob.benefitText}>{b}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={ob.strengthBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/profile"); }}
            activeOpacity={0.88}
          >
            <Text style={ob.strengthBtnText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Quick Actions Grid ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: "#374151" }]}>Quick Actions</Text>
        <View style={ob.qaGrid}>
          {onboardingQuickActions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={ob.qaCard}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(a.route as any); }}
              activeOpacity={0.82}
            >
              <View style={[ob.qaIconWrap, { backgroundColor: a.bg }]}>
                <Feather name={a.icon as any} size={20} color={a.color} />
              </View>
              <Text style={ob.qaLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Tips & Guidance ── */}
      <View style={[styles.section, { marginBottom: 8 }]}>
        <View style={ob.tipCard}>
          <View style={ob.tipHeader}>
            <View style={ob.tipBulb}>
              <Text style={{ fontSize: 18 }}>💡</Text>
            </View>
            <Text style={ob.tipCardTitle}>Tips & Guidance</Text>
          </View>
          <Text style={ob.tipText}>{ONBOARDING_TIPS[tipIdx].text}</Text>
          <View style={ob.tipNav}>
            {ONBOARDING_TIPS.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setTipIdx(i)} hitSlop={8}>
                <View style={[ob.tipDot, i === tipIdx && ob.tipDotActive]} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={ob.tipNextBtn}
              onPress={() => setTipIdx((tipIdx + 1) % ONBOARDING_TIPS.length)}
            >
              <Text style={ob.tipNextText}>Next tip</Text>
              <Feather name="chevron-right" size={13} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatTile({ icon, value, label, accent }: { icon: string; value: string; label: string; accent: string }) {
  return (
    <View style={styles.statTile}>
      <View style={[styles.statTileIcon, { backgroundColor: `${accent}22` }]}>
        <Feather name={icon as any} size={14} color={accent} />
      </View>
      <Text style={styles.statTileValue}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

function ModalInfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={modalStyles.infoRow}>
      <View style={modalStyles.infoIcon}>
        <Feather name={icon as any} size={14} color="#6b7280" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={modalStyles.infoLabel}>{label}</Text>
        <Text style={modalStyles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F7FA" },

  hero: {
    backgroundColor: "#1e40af",
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  heroGreeting: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "500" },
  heroNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  heroName: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  approvedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(52,211,153,0.18)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  approvedBadgeText: { color: "#34d399", fontSize: 11, fontWeight: "700" },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  notifBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  notifDot: { position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444", borderWidth: 1.5, borderColor: "#1e40af" },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  avatarLetter: { color: "#fff", fontSize: 17, fontWeight: "700" },
  rolePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 12 },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  rolePillText: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "600" },
  statTiles: { flexDirection: "row", gap: 10, marginTop: 4 },
  statTile: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 12, alignItems: "center", gap: 5 },
  statTileIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  statTileValue: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  statTileLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "500", textAlign: "center" },

  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionLabel: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  seeAllText: { fontSize: 13, fontWeight: "600" },

  // Active Job
  activeJobSection: { paddingHorizontal: 20, marginTop: 20 },
  activeJobCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "space-between", ...Platform.select({ ios: { shadowColor: "#2563EB", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8 }, android: { elevation: 3 } }) },
  activeJobLeft: { flex: 1 },
  activeJobHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#10b981" },
  activeJobBadge: { fontSize: 10, fontWeight: "800", color: "#10b981", letterSpacing: 0.5 },
  activeJobTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 5 },
  activeJobLocation: { flexDirection: "row", alignItems: "center", gap: 4 },
  activeJobLocationText: { fontSize: 12, color: "#6b7280" },
  activeJobRight: { alignItems: "center", gap: 6 },
  clockInBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  clockInText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  activeJobPayBelow: { fontSize: 12, fontWeight: "700", color: "#374151" },

  // Quick Actions
  quickCard: { alignItems: "center", gap: 6, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: "#f3f4f6", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }, android: { elevation: 1 } }) },
  quickIconWrap: { position: "relative" },
  quickIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  quickBadge: { position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#ef4444", justifyContent: "center", alignItems: "center", paddingHorizontal: 3, borderWidth: 1.5, borderColor: "#F5F7FA" },
  quickBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  quickLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },

  // Job rows
  upcomingJobRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 14, padding: 13, marginBottom: 10, borderWidth: 1, borderColor: "#e5e7eb", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }, android: { elevation: 1 } }) },
  upcomingJobIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  upcomingJobTitle: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  upcomingJobMeta: { fontSize: 12 },
  upcomingJobRight: { alignItems: "flex-end", gap: 4 },
  upcomingJobPay: { fontSize: 14, fontWeight: "800" },
  upcomingJobPayType: { fontSize: 11, fontWeight: "400" },
  upcomingUrgentTag: { backgroundColor: "#fef2f2", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  upcomingUrgentText: { fontSize: 10, fontWeight: "700", color: "#ef4444" },
  confirmedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#ecfdf5", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  confirmedBadgeText: { fontSize: 11, fontWeight: "700", color: "#10b981" },

  // Employer
  newJobBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#eff6ff", borderRadius: 20 },
  newJobBtnText: { fontSize: 13, fontWeight: "600" },
  emptyPostCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fff", padding: 18, borderRadius: 16, borderWidth: 1.5, borderColor: "#bfdbfe", borderStyle: "dashed" },
  emptyPostIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  emptyPostTitle: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  emptyPostSub: { fontSize: 12, lineHeight: 17 },
  jobPostRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", padding: 14, borderRadius: 14, marginBottom: 8, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }, android: { elevation: 1 } }) },
  jobPostIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  jobPostTitle: { fontSize: 14, fontWeight: "600", marginBottom: 3 },
  jobPostMeta: { fontSize: 12 },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },

  // Insight
  insightCard: { backgroundColor: "#0f172a", borderRadius: 18, padding: 18, gap: 12 },
  insightLeft: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  insightIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  insightTitle: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 4 },
  insightBody: { color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 18 },
  insightCta: { alignSelf: "flex-start", backgroundColor: "rgba(96,165,250,0.18)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginLeft: 52 },
  insightCtaText: { color: "#60a5fa", fontSize: 13, fontWeight: "600" },
});

// ─── Onboarding Styles ────────────────────────────────────────────────────────

const ob = StyleSheet.create({
  heroPad: { paddingHorizontal: 20, marginTop: 20 },

  welcomeCard: {
    backgroundColor: "#2563EB",
    borderRadius: 20,
    padding: 20,
    gap: 16,
    ...Platform.select({ ios: { shadowColor: "#2563EB", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 }, android: { elevation: 6 } }),
  },
  welcomeTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  waveEmoji: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },
  welcomeTitle: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.3, marginBottom: 4 },
  welcomeSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 18 },
  progressSection: { gap: 8 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" },
  progressPct: { color: "#fff", fontSize: 15, fontWeight: "800" },
  progressTrack: { height: 8, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: "#fff", borderRadius: 4 },
  completeProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    paddingVertical: 13,
    borderRadius: 14,
  },
  completeProfileBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Checklist
  checklistCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#e5e7eb", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 2 } }) },
  checklistTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 4 },
  checklistSub: { fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 18 },
  checklistItems: { gap: 0 },
  checklistRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  checklistRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  checkCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  checkCircleDone: { backgroundColor: "#22C55E" },
  checkCircleEmpty: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: "#9ca3af" },
  checkLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#374151" },
  checkLabelDone: { color: "#9ca3af", textDecorationLine: "line-through" },

  // Nearby Jobs
  nearbyJobCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb", gap: 10, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 2 } }) },
  nearbyJobTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  nearbyJobIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#dbeafe", justifyContent: "center", alignItems: "center" },
  nearbyJobTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 2 },
  nearbyJobCompany: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  nearbyJobPayBox: { flexDirection: "row", alignItems: "baseline", gap: 1 },
  nearbyJobPay: { fontSize: 17, fontWeight: "800", color: "#111827" },
  nearbyJobPayType: { fontSize: 11, color: "#9ca3af" },
  nearbyJobMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  nearbyMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  nearbyMetaText: { fontSize: 12, color: "#6b7280" },
  nearbyMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#d1d5db" },
  nearbyJobActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  saveJobBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#f9fafb", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb" },
  applyBtn: { flex: 1, marginLeft: 10, backgroundColor: "#2563EB", paddingVertical: 9, borderRadius: 10, alignItems: "center", ...Platform.select({ ios: { shadowColor: "#2563EB", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5 }, android: { elevation: 2 } }) },
  applyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  lockedApplyBtn: { flex: 1, marginLeft: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#f3f4f6", paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  lockedApplyText: { color: "#9ca3af", fontSize: 12, fontWeight: "600" },

  // Strength Card
  strengthCard: { backgroundColor: "#eff6ff", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#bfdbfe", gap: 14 },
  strengthHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  strengthIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#dbeafe", justifyContent: "center", alignItems: "center" },
  strengthTitle: { fontSize: 15, fontWeight: "800", color: "#1e40af", marginBottom: 3 },
  strengthSub: { fontSize: 12, color: "#3b82f6", lineHeight: 17 },
  benefitsList: { gap: 8 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#dbeafe", justifyContent: "center", alignItems: "center" },
  benefitText: { fontSize: 13, color: "#1e40af", fontWeight: "500" },
  strengthBtn: { backgroundColor: "#2563EB", paddingVertical: 13, borderRadius: 13, alignItems: "center", ...Platform.select({ ios: { shadowColor: "#2563EB", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 }, android: { elevation: 3 } }) },
  strengthBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Quick Actions Grid
  qaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  qaCard: { width: "30%", alignItems: "center", gap: 8, backgroundColor: "#fff", paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }, android: { elevation: 1 } }) },
  qaIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  qaLabel: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center", paddingHorizontal: 4 },

  // Tips Card
  tipCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#e5e7eb", gap: 12, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 2 } }) },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  tipBulb: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#fef9c3", justifyContent: "center", alignItems: "center" },
  tipCardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  tipText: { fontSize: 14, color: "#374151", lineHeight: 21 },
  tipNav: { flexDirection: "row", alignItems: "center", gap: 6 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#e5e7eb" },
  tipDotActive: { backgroundColor: "#2563EB", width: 16 },
  tipNextBtn: { flexDirection: "row", alignItems: "center", gap: 3, marginLeft: "auto" },
  tipNextText: { fontSize: 13, fontWeight: "600", color: "#2563EB" },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
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
  timeStampWrap: { flexDirection: "row", gap: 14, justifyContent: "center" },
  timeStampRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  timeStampLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af" },
  timeStampValue: { fontSize: 13, fontWeight: "700", color: "#111827" },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLabel: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  totalPill: { backgroundColor: "#f3f4f6", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  totalPillText: { fontSize: 13, fontWeight: "700", color: "#111827" },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#2563eb", paddingVertical: 16, borderRadius: 16, ...Platform.select({ ios: { shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }, android: { elevation: 5 } }) },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  verifiedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  verifiedText: { fontSize: 12, color: "#9ca3af" },
});

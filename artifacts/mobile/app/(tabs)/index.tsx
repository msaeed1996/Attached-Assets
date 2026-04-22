import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useJobs } from "@/context/JobsContext";
import { useMessages } from "@/context/MessagesContext";
import * as Haptics from "expo-haptics";
import NotificationsSheet from "@/components/NotificationsSheet";
import { UPCOMING_SHIFTS } from "@/data/upcomingShifts";

const SAMPLE_INVITATIONS = [
  {
    id: "inv-1",
    jobTitle: "Warehouse Supervisor",
    company: "Amazon Logistics",
    companyRating: 4.2,
    location: "Austin, TX",
    pay: 28,
    payType: "hourly",
    startDate: "Tomorrow",
    duration: "1 week",
    sentAt: "30 min ago",
    urgent: true,
    jobId: "1",
  },
  {
    id: "inv-2",
    jobTitle: "Event Coordinator",
    company: "Prestige Events Co.",
    companyRating: 4.7,
    location: "Houston, TX",
    pay: 280,
    payType: "daily",
    startDate: "Saturday",
    duration: "2 days",
    sentAt: "2 hours ago",
    urgent: false,
    jobId: "2",
  },
];

const QUICK_ACTIONS_EMPLOYER = [
  { icon: "plus-circle", label: "Post Job", route: "/post-job", color: "#2563EB", bg: "#dbeafe", badge: null, isAvailability: false },
  { icon: "users", label: "Applicants", route: "/(tabs)/jobs", color: "#7c3aed", bg: "#ede9fe", badge: null, isAvailability: false },
  { icon: "briefcase", label: "My Jobs", route: "/(tabs)/jobs", color: "#0891b2", bg: "#cffafe", badge: null, isAvailability: false },
];

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, userRole } = useApp();
  const { jobs, applications, savedJobs } = useJobs();
  const { conversations } = useMessages();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const isEmployer = userRole === "employer";
  const [isClockedIn, setIsClockedIn] = React.useState(false);
  const [notifVisible, setNotifVisible] = React.useState(false);
  const [clockInModalVisible, setClockInModalVisible] = React.useState(false);
  const [activeJobForModal, setActiveJobForModal] = React.useState<any>(null);
  const [clockInTime, setClockInTime] = React.useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = React.useState<Date | null>(null);

  const formatTime = (d: Date | null) =>
    d
      ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
      : "--:--";

  const myApplications = applications.filter((a) => a.workerId === "me");
  const myJobs = jobs.filter((j) => j.employerId === "emp-me");
  const urgentJobs = jobs.filter((j) => j.urgency === "urgent").slice(0, 3);
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  const workerQuickActions = [
    { icon: "briefcase", label: "Available Jobs", route: "/(tabs)/jobs", color: "#2563EB", bg: "#dbeafe", badge: null, isAvailability: false },
    { icon: "mail", label: "Job Invitation", route: "/(tabs)/invitations", color: "#7c3aed", bg: "#ede9fe", badge: myApplications.length > 0 ? myApplications.length : null, isAvailability: false },
    { icon: "layers", label: "Job Board", route: "/job-board", color: "#059669", bg: "#d1fae5", badge: null, isAvailability: false },
    { icon: "clock", label: "Time Sheet", route: "/timesheet", color: "#0891b2", bg: "#cffafe", badge: null, isAvailability: false },
  ];

  const quickActions = isEmployer ? QUICK_ACTIONS_EMPLOYER : workerQuickActions;

  return (
    <View style={[styles.root, { backgroundColor: "#f0f4f8" }]}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HERO HEADER ── */}
      <View style={[styles.hero, { paddingTop: topPadding + 20 }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.heroGreeting}>{getTimeOfDay()}</Text>
            <View style={styles.heroNameRow}>
              <Text style={styles.heroName}>
                {userProfile?.name?.split(" ")[0] || "Welcome"}
              </Text>
              {!isEmployer && (
                <View style={styles.approvedBadge}>
                  <Feather name="check-circle" size={12} color="#34d399" />
                  <Text style={styles.approvedBadgeText}>Approved</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.topBarRight}>
            {totalUnread > 0 && (
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNotifVisible(true);
                }}
              >
                <Feather name="bell" size={20} color="#fff" />
                <View style={styles.notifDot} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => router.push("/(tabs)/profile")}
            >
              <Text style={styles.avatarLetter}>
                {(userProfile?.name || "U").charAt(0)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Role pill — employer only */}
        {isEmployer && (
          <View style={styles.rolePill}>
            <View style={[styles.roleDot, { backgroundColor: "#60a5fa" }]} />
            <Text style={styles.rolePillText}>
              {`Employer · ${userProfile?.company || ""}`}
            </Text>
          </View>
        )}

        {/* ── STAT TILES ── */}
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
      </View>

      {/* ── ACTIVE JOB CARD (worker only) ── */}
      {!isEmployer && (() => {
        const acceptedApp = myApplications.find((a) => a.status === "accepted");
        const activeJob = acceptedApp ? jobs.find((j) => j.id === acceptedApp.jobId) : jobs[0];
        if (!activeJob) return null;
        return (
          <View style={styles.activeJobSection}>
            <View style={[styles.activeJobCard, { borderColor: isClockedIn ? "#10b981" : "#2563EB" }]}>
              {/* Left: info */}
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
              {/* Right: clock in + pay */}
              <View style={styles.activeJobRight}>
                <TouchableOpacity
                  style={[styles.clockInBtn, { backgroundColor: isClockedIn ? "#10b981" : "#2563EB" }]}
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    if (isClockedIn) {
                      setClockOutTime(new Date());
                      setIsClockedIn(false);
                    } else {
                      setActiveJobForModal(activeJob);
                      setClockInModalVisible(true);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Feather name={isClockedIn ? "log-out" : "clock"} size={14} color="#fff" />
                  <Text style={styles.clockInText}>
                    {isClockedIn ? "CLOCK OUT" : "CLOCK IN"}
                  </Text>
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
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (a.route) router.push(a.route as any);
              }}
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
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/invitations");
              }}
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
                {inv.urgent && (
                  <View style={styles.upcomingUrgentTag}>
                    <Text style={styles.upcomingUrgentText}>Urgent</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isEmployer && UPCOMING_SHIFTS.length > 0 && (() => {
        const next = UPCOMING_SHIFTS[0];
        return (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionLabel, { color: "#374151" }]}>Upcoming Schedule</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/upcoming-schedule");
                }}
              >
                <Text style={[styles.seeAllText, { color: "#2563EB" }]}>See all ({UPCOMING_SHIFTS.length})</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.upcomingJobRow}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/shift/${next.id}`);
              }}
            >
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

      {/* ── EMPLOYER: My job posts ── */}
      {isEmployer && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: "#374151" }]}>My Job Posts</Text>
            <TouchableOpacity
              style={styles.newJobBtn}
              onPress={() => router.push("/post-job")}
            >
              <Feather name="plus" size={14} color="#2563EB" />
              <Text style={[styles.newJobBtnText, { color: "#2563EB" }]}>New</Text>
            </TouchableOpacity>
          </View>
          {myJobs.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyPostCard}
              onPress={() => router.push("/post-job")}
              activeOpacity={0.85}
            >
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
              <TouchableOpacity
                key={job.id}
                style={styles.jobPostRow}
                onPress={() => router.push(`/job/${job.id}`)}
                activeOpacity={0.85}
              >
                <View style={[styles.jobPostIcon, { backgroundColor: "#eff6ff" }]}>
                  <Feather name="briefcase" size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.jobPostTitle, { color: "#111827" }]}>{job.title}</Text>
                  <Text style={[styles.jobPostMeta, { color: "#6b7280" }]}>
                    {job.applicantsCount} applicants · {job.startDate}
                  </Text>
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

      {/* ── INSIGHTS / TIP CARD ── */}
      <View style={[styles.section, { marginBottom: 8 }]}>
        <View style={styles.insightCard}>
          <View style={styles.insightLeft}>
            <View style={[styles.insightIcon, { backgroundColor: "rgba(96,165,250,0.15)" }]}>
              <Feather name="trending-up" size={20} color="#60a5fa" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTitle}>
                {isEmployer ? "Boost visibility" : "Improve your profile"}
              </Text>
              <Text style={styles.insightBody}>
                {isEmployer
                  ? "Jobs with clear pay ranges fill 3× faster. Add salary details to attract top candidates."
                  : "Workers with verified badges get 2× more callbacks. Complete your verification today."}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.insightCta}>
            <Text style={styles.insightCtaText}>
              {isEmployer ? "Edit Job" : "Verify Now"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>

    <NotificationsSheet visible={notifVisible} onClose={() => setNotifVisible(false)} />

    <Modal
      visible={clockInModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setClockInModalVisible(false)}
    >
      <Pressable style={modalStyles.backdrop} onPress={() => setClockInModalVisible(false)}>
        <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Ready to Clock In?</Text>
            <TouchableOpacity
              style={modalStyles.closeBtn}
              onPress={() => setClockInModalVisible(false)}
              hitSlop={8}
            >
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
              style={modalStyles.confirmBtn}
              activeOpacity={0.9}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setClockInTime(new Date());
                setClockOutTime(null);
                setIsClockedIn(true);
                setClockInModalVisible(false);
              }}
            >
              <Feather name="clock" size={20} color="#fff" />
              <Text style={modalStyles.confirmBtnText}>Clock In Now</Text>
            </TouchableOpacity>

            <View style={modalStyles.verifiedRow}>
              <Feather name="navigation" size={11} color="#9ca3af" />
              <Text style={modalStyles.verifiedText}>Location verified</Text>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
    </View>
  );
}

function ModalInfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={modalStyles.infoRow}>
      <View style={modalStyles.infoIcon}>
        <Feather name={icon as any} size={16} color="#2563EB" />
      </View>
      <View style={{ flex: 1, marginLeft: 4 }}>
        <Text style={modalStyles.infoLabel}>{label}</Text>
        <Text style={modalStyles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#f9fafb",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#111827" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 20, gap: 16 },
  infoCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbeafe",
    gap: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoIcon: { width: 32, alignItems: "center" },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.5,
  },
  infoValue: { fontSize: 14, fontWeight: "700", color: "#111827", marginTop: 2 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  totalLabel: { fontSize: 13, color: "#4b5563", fontWeight: "500" },
  totalPill: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  totalPillText: { fontSize: 13, fontWeight: "700", color: "#111827" },
  timeStampWrap: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  timeStampRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeStampLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.5,
  },
  timeStampValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  confirmBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  verifiedText: { fontSize: 11, color: "#9ca3af" },
});

function StatTile({ icon, value, label, accent }: { icon: string; value: string; label: string; accent: string }) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statTileTop}>
        <Feather name={icon as any} size={13} color={accent} />
        <Text style={styles.statTileValue}>{value}</Text>
      </View>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

function AppStatusCard({
  label, count, color, bg, border, icon,
}: { label: string; count: number; color: string; bg: string; border: string; icon: string }) {
  return (
    <View style={[styles.appStatusCard, { backgroundColor: bg, borderColor: border }]}>
      <Feather name={icon as any} size={18} color={color} />
      <Text style={[styles.appStatusCount, { color }]}>{count}</Text>
      <Text style={[styles.appStatusLabel, { color: "#6b7280" }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── HERO ──
  hero: {
    backgroundColor: "#0759af",
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 24,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  heroGreeting: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 3,
  },
  heroName: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  heroNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  approvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(52,211,153,0.18)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 2,
  },
  approvedBadgeText: {
    color: "#34d399",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 1.5,
    borderColor: "#0f172a",
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 22,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  rolePillText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "500",
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(96,165,250,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 4,
  },
  verifiedPillText: {
    color: "#60a5fa",
    fontSize: 11,
    fontWeight: "600",
  },

  // ── STAT TILES ──
  statTiles: {
    flexDirection: "row",
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statTileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statTileValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  statTileLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // ── SECTIONS ──
  section: {
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 13,
  },

  // ── ACTIVE JOB CARD ──
  activeJobSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  activeJobCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: "#2563EB", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  activeJobLeft: {
    flex: 1,
    gap: 3,
  },
  activeJobRight: {
    alignItems: "center",
    gap: 5,
  },
  activeJobPayBelow: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "center",
  },
  activeJobHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  activeJobBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  activeJobTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.2,
  },
  activeJobLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  activeJobLocationText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  activeJobPayRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
    marginTop: 1,
  },
  activeJobPay: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  activeJobPayUnit: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  clockInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    ...Platform.select({
      ios: { shadowColor: "#2563EB", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 5 },
      android: { elevation: 3 },
    }),
  },
  clockInText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },
  // ── QUICK ACTIONS ──
  quickGrid: {
    flexDirection: "row",
    gap: 8,
  },
  quickCard: {
    width: 90,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 7,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  quickIconWrap: {
    position: "relative",
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  quickBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#f0f4f8",
  },
  quickBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  availabilityStatus: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // ── CATEGORY GRID ──
  categoryGrid: {
    flexDirection: "row",
    gap: 8,
  },
  upcomingJobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  upcomingJobIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  upcomingJobTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  upcomingJobMeta: {
    fontSize: 12,
  },
  upcomingJobRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  upcomingJobPay: {
    fontSize: 14,
    fontWeight: "800",
  },
  upcomingJobPayType: {
    fontSize: 11,
    fontWeight: "400",
  },
  upcomingUrgentTag: {
    backgroundColor: "#fef2f2",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  upcomingUrgentText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ef4444",
  },

  // ── JOB INVITATIONS ──
  inviteBadgeCount: {
    backgroundColor: "#7c3aed",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  inviteBadgeCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },
  inviteCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 10,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  inviteCardUrgent: {
    borderColor: "#fecaca",
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
  },
  inviteUrgentRibbon: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  inviteUrgentRibbonText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  inviteTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inviteIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.1,
  },
  inviteCompany: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 1,
  },
  invitePayBox: {
    alignItems: "flex-end",
  },
  invitePayValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  invitePayType: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "500",
  },
  inviteMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  inviteMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  inviteMetaText: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "500",
  },
  inviteMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
  },
  inviteActions: {
    flexDirection: "row",
    gap: 8,
  },
  inviteDeclineBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  inviteDeclineBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
  },
  inviteAcceptBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    ...Platform.select({
      ios: { shadowColor: "#2563eb", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 5 },
      android: { elevation: 3 },
    }),
  },
  inviteAcceptBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },

  // ── UPCOMING SCHEDULE CARD ──
  upcomingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e7ff",
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  upcomingCardInner: {
    padding: 13,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
    borderRadius: 16,
  },
  upcomingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  upcomingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  upcomingCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.1,
  },
  upcomingCardCompany: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 1,
  },
  upcomingEarningsBadge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  upcomingEarningsValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#10b981",
  },
  upcomingDetailsGrid: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  upcomingDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  upcomingDetailText: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "500",
  },
  upcomingDetailDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
  },
  upcomingCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  confirmedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10b981",
  },
  seeScheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeScheduleBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
  },

  // ── APP STATUS ──
  appStatusRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  appStatusCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "flex-start",
    gap: 5,
  },
  appStatusCount: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  appStatusLabel: {
    fontSize: 11,
    fontWeight: "500",
  },

  // ── RECENT APPS ──
  recentApps: {
    gap: 8,
  },
  recentAppRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  recentAppDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recentAppTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  recentAppSub: {
    fontSize: 12,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  // ── EMPLOYER: JOB POSTS ──
  newJobBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#eff6ff",
    borderRadius: 20,
  },
  newJobBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyPostCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
    borderStyle: "dashed",
  },
  emptyPostIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyPostTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  emptyPostSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  jobPostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  jobPostIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  jobPostTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 3,
  },
  jobPostMeta: {
    fontSize: 12,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // ── URGENT JOBS ──
  urgentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  urgentJobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  urgentCategoryDot: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  urgentJobTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  urgentJobMeta: {
    fontSize: 12,
  },
  urgentPayBox: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
  },
  urgentPay: {
    fontSize: 15,
    fontWeight: "700",
  },
  urgentPayType: {
    fontSize: 11,
  },

  // ── INSIGHT CARD ──
  insightCard: {
    backgroundColor: "#0f172a",
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  insightLeft: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  insightTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  insightBody: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 18,
  },
  insightCta: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(96,165,250,0.18)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 52,
  },
  insightCtaText: {
    color: "#60a5fa",
    fontSize: 13,
    fontWeight: "600",
  },

});

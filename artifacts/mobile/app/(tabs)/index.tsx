import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
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

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPS = [
  "Keep your availability updated — workers with current schedules get matched 2× faster.",
  "Respond quickly to invitations. Recruiters prefer workers who reply within the hour.",
  "Update your work experience regularly to unlock higher-paying job categories.",
  "Enable notifications so you never miss a new job opportunity or recruiter message.",
];

const WHAT_NEXT = [
  { icon: "user-check",  label: "Your profile is reviewed by the staffing team." },
  { icon: "search",      label: "Recruiters search for workers matching your skills and availability." },
  { icon: "mail",        label: "You'll receive a job invitation directly in the app." },
  { icon: "check-circle",label: "Accept or decline the offer at your convenience." },
  { icon: "briefcase",   label: "Check in and start your shift on the confirmed date." },
];

const QUICK_ACTIONS = [
  { label: "Browse Jobs",  icon: "briefcase",      bg: "#EFF6FF", iconColor: "#2563EB", route: "/(tabs)/jobs"         },
  { label: "Availability", icon: "calendar",       bg: "#F0FDF4", iconColor: "#22C55E", route: "/(tabs)/availability" },
  { label: "Messages",     icon: "message-circle", bg: "#F5F3FF", iconColor: "#7C3AED", route: "/(tabs)/messages"     },
  { label: "Profile",      icon: "user",           bg: "#F0F9FF", iconColor: "#0284C7", route: "/(tabs)/profile"      },
  { label: "Support",      icon: "life-buoy",      bg: "#FFF1F2", iconColor: "#E11D48", route: "/(tabs)/profile"      },
  { label: "Settings",     icon: "settings",       bg: "#FFF7ED", iconColor: "#F97316", route: "/(tabs)/profile"      },
];

function getDateString() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
}

// ─── Root Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, userRole } = useApp();
  const { jobs, applications } = useJobs();
  const { conversations } = useMessages();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const isEmployer = userRole === "employer";
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
  const acceptedApps = applications.filter((a) => a.workerId === "me" && a.status === "accepted");
  const hasActiveJob = acceptedApps.length > 0;
  const myJobs = jobs.filter((j) => j.employerId === "emp-me");

  const [notifVisible, setNotifVisible] = useState(false);

  return (
    <View style={s.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={[s.header, { paddingTop: topPadding + 14 }]}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.85}>
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

        {/* ── CONTENT ── */}
        {isEmployer ? (
          <EmployerDashboard myJobs={myJobs} jobs={jobs} />
        ) : hasActiveJob ? (
          <ActiveWorkerDashboard
            userProfile={userProfile}
            acceptedApps={acceptedApps}
            jobs={jobs}
          />
        ) : (
          <NewUserDashboard userProfile={userProfile} />
        )}
      </ScrollView>

      <NotificationsSheet visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </View>
  );
}

// ─── New User Dashboard ───────────────────────────────────────────────────────

function NewUserDashboard({ userProfile }: { userProfile: any }) {
  const [tipIdx, setTipIdx] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(true);

  // Auto-rotate tips every 5 s
  useEffect(() => {
    const t = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Pulse animation for "Waiting for Match"
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const skills  = (userProfile?.skills  || []).slice(0, 4);
  const jobTitle = userProfile?.jobTitle || "Not specified";

  return (
    <View style={{ gap: 0 }}>

      {/* 1. WELCOME HERO */}
      <View style={s.pad}>
        <LinearGradient
          colors={["#1E40AF", "#2563EB", "#3B82F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroCard}
        >
          <View style={s.heroBubble1} />
          <View style={s.heroBubble2} />
          <View style={s.readyBadge}>
            <View style={s.greenDot} />
            <Text style={s.readyBadgeText}>Ready for Opportunities</Text>
          </View>
          <Text style={s.heroTitle}>Welcome to TrueGigs 🎉</Text>
          <Text style={s.heroBody}>
            Your account has been successfully created and your profile is active. We'll notify you as soon as a recruiter finds a suitable opportunity for your skills and availability.
          </Text>
          <View style={s.heroBtns}>
            <TouchableOpacity
              style={s.heroPrimaryBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/availability"); }}
              activeOpacity={0.85}
            >
              <Text style={s.heroPrimaryBtnText}>Update Availability</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.heroSecondaryBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/profile"); }}
              activeOpacity={0.85}
            >
              <Text style={s.heroSecondaryBtnText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* 2. JOB MATCH STATUS */}
      <Section title="Job Match Status">
        <View style={s.card}>
          <CheckRow icon="user-check"  label="Registration Complete"          done />
          <CheckRow icon="shield"      label="Profile Complete"               done />
          <CheckRow icon="calendar"    label="Availability Active"            done />
          <CheckRow
            icon="clock"
            label="Waiting for Matching Opportunities"
            done={false}
            pulse={pulseAnim}
            last
          />
          <View style={s.matchNote}>
            <Text style={s.matchNoteText}>
              We're actively matching your profile with available positions. You'll receive a notification when a suitable opportunity becomes available.
            </Text>
          </View>
        </View>
      </Section>

      {/* 3. WHAT HAPPENS NEXT */}
      <Section title="What Happens Next?">
        <View style={s.card}>
          {WHAT_NEXT.map((step, i) => (
            <View key={i} style={s.timelineItem}>
              <View style={s.timelineLeft}>
                <View style={[s.timelineDotCircle, { backgroundColor: i === 0 ? "#DBEAFE" : i === 1 ? "#F5F3FF" : "#F3F4F6" }]}>
                  <Feather name={step.icon as any} size={15} color={i === 0 ? "#2563EB" : i === 1 ? "#7C3AED" : "#9CA3AF"} />
                </View>
                {i < WHAT_NEXT.length - 1 && <View style={s.timelineLine} />}
              </View>
              <View style={s.timelineContent}>
                <Text style={[s.timelineText, i > 1 && { color: "#9CA3AF" }]}>{step.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </Section>

      {/* 4. PROFILE SUMMARY */}
      <Section title="Your Profile Summary">
        <View style={s.card}>
          <ProfileRow icon="award"       label="Skills"             value={skills.length > 0 ? skills.join(", ") : "Not added yet"} />
          <ProfileRow icon="briefcase"   label="Experience"         value={jobTitle} />
          <ProfileRow icon="map-pin"     label="Preferred Location" value={userProfile?.location || "Austin, TX"} />
          <ProfileRow icon="calendar"    label="Availability"       value="Full-time · Weekdays" />
          <ProfileRow icon="user"        label="Employment Type"    value="Part-time / Gig" last />
          <View style={s.cardFooter}>
            <TouchableOpacity style={s.outlineBtn} onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.85}>
              <Feather name="edit-3" size={14} color="#2563EB" />
              <Text style={s.outlineBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Section>

      {/* 5. NOTIFICATION PREFERENCES */}
      <Section title="Stay Updated">
        <View style={s.card}>
          <View style={s.notifDesc}>
            <Text style={s.notifDescText}>
              Receive instant notifications whenever a recruiter sends you an invitation, a new job matches your profile, or your application status changes.
            </Text>
          </View>
          <View style={s.notifToggleRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={[s.notifIcon, { backgroundColor: notifEnabled ? "#EFF6FF" : "#F3F4F6" }]}>
                <Feather name="bell" size={17} color={notifEnabled ? "#2563EB" : "#9CA3AF"} />
              </View>
              <View>
                <Text style={s.notifToggleLabel}>Notifications {notifEnabled ? "Enabled" : "Disabled"}</Text>
                <Text style={s.notifToggleSub}>{notifEnabled ? "You'll be notified immediately" : "Turn on to stay informed"}</Text>
              </View>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNotifEnabled(v); }}
              trackColor={{ false: "#E5E7EB", true: "#BFDBFE" }}
              thumbColor={notifEnabled ? "#2563EB" : "#fff"}
            />
          </View>
        </View>
      </Section>

      {/* 6. QUICK ACTIONS */}
      <Section title="Quick Actions">
        <View style={s.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={s.actionCard}
              activeOpacity={0.8}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(a.route as any); }}
            >
              <View style={[s.actionIcon, { backgroundColor: a.bg }]}>
                <Feather name={a.icon as any} size={22} color={a.iconColor} />
              </View>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      {/* 7. HELPFUL TIPS */}
      <Section title="Helpful Tips">
        <View style={s.card}>
          <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
            <View style={[s.tipIconWrap]}>
              <Text style={{ fontSize: 20 }}>💡</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 14, color: "#374151", lineHeight: 22 }}>
              {TIPS[tipIdx]}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            {TIPS.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setTipIdx(i)} hitSlop={10}>
                <View style={[s.tipDot, i === tipIdx && s.tipDotActive]} />
              </TouchableOpacity>
            ))}
            <Text style={s.tipAuto}>Auto-rotating</Text>
          </View>
        </View>
      </Section>

      {/* 8. SUPPORT CARD */}
      <Section title="Need Assistance?">
        <View style={s.card}>
          <Text style={s.supportDesc}>
            Our staffing team is available to answer questions and help you get started with your first assignment.
          </Text>
          <View style={s.supportBtns}>
            <TouchableOpacity style={s.supportBtnPrimary} onPress={() => router.push("/(tabs)/messages")} activeOpacity={0.85}>
              <Feather name="message-circle" size={15} color="#fff" />
              <Text style={s.supportBtnPrimaryText}>Contact Support</Text>
            </TouchableOpacity>
            <View style={s.supportBtnRow}>
              <TouchableOpacity style={s.supportBtnOutline} onPress={() => {}} activeOpacity={0.85}>
                <Feather name="phone" size={14} color="#2563EB" />
                <Text style={s.supportBtnOutlineText}>Call Recruiter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.supportBtnOutline} onPress={() => {}} activeOpacity={0.85}>
                <Feather name="mail" size={14} color="#2563EB" />
                <Text style={s.supportBtnOutlineText}>Email Us</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Section>

      {/* 9. REFERRAL CARD */}
      <View style={[s.pad, { marginTop: 20, marginBottom: 8 }]}>
        <LinearGradient
          colors={["#7C3AED", "#9333EA", "#C026D3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.referralCard}
        >
          <View style={s.referralBubble} />
          <View style={{ flex: 1 }}>
            <Text style={s.referralTitle}>Invite Friends 🎁</Text>
            <Text style={s.referralBody}>
              Invite qualified workers and earn rewards when they complete their first assignment.
            </Text>
          </View>
          <TouchableOpacity
            style={s.referralBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            activeOpacity={0.85}
          >
            <Text style={s.referralBtnText}>Invite Friends</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

    </View>
  );
}

// ─── Active Worker Dashboard ──────────────────────────────────────────────────

function ActiveWorkerDashboard({ userProfile, acceptedApps, jobs }: any) {
  const acceptedApp = acceptedApps[0];
  const activeJob = acceptedApp ? jobs.find((j: any) => j.id === acceptedApp.jobId) || jobs[0] : jobs[0];
  const [isClockedIn, setIsClockedIn] = useState(false);

  return (
    <View>
      <View style={s.pad}>
        <LinearGradient colors={["#1E40AF", "#2563EB", "#3B82F6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
          <View style={s.heroBubble1} /><View style={s.heroBubble2} />
          <Text style={s.heroLabel}>Jobs Completed</Text>
          <Text style={s.heroBigNum}>{userProfile?.completedJobs || 0}</Text>
          <View style={s.heroStatsRow}>
            <HeroStat label="Rating" value={`${userProfile?.rating ?? "—"} ⭐`} />
            <View style={s.heroStatDiv} />
            <HeroStat label="Hours" value="455 hrs" />
            <View style={s.heroStatDiv} />
            <HeroStat label="Status" value="Active" valueColor="#A5F3FC" />
          </View>
        </LinearGradient>
      </View>

      {activeJob && (
        <Section title="Active Job">
          <View style={s.card}>
            <View style={[s.timelineItem, { alignItems: "center" }]}>
              <View style={[s.timelineDotCircle, { backgroundColor: "#DBEAFE" }]}>
                <Feather name="briefcase" size={15} color="#2563EB" />
              </View>
              <View style={[s.timelineContent, { flex: 1, paddingBottom: 0, marginLeft: 14 }]}>
                <Text style={s.timelineText}>{activeJob.title}</Text>
                <Text style={{ fontSize: 12, color: "#9CA3AF" }}>{activeJob.location}</Text>
              </View>
              <TouchableOpacity
                style={[s.clockBtn, { backgroundColor: isClockedIn ? "#10B981" : "#2563EB" }]}
                onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setIsClockedIn(!isClockedIn); }}
                activeOpacity={0.85}
              >
                <Feather name={isClockedIn ? "log-out" : "clock"} size={13} color="#fff" />
                <Text style={s.clockBtnText}>{isClockedIn ? "Clock Out" : "Clock In"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Section>
      )}
    </View>
  );
}

// ─── Employer Dashboard ───────────────────────────────────────────────────────

function EmployerDashboard({ myJobs, jobs }: any) {
  return (
    <View>
      <View style={s.pad}>
        <LinearGradient colors={["#1E40AF", "#2563EB", "#3B82F6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
          <View style={s.heroBubble1} /><View style={s.heroBubble2} />
          <Text style={s.heroLabel}>Active Job Posts</Text>
          <Text style={s.heroBigNum}>{myJobs.length}</Text>
          <View style={s.heroStatsRow}>
            <HeroStat label="My Posts" value={String(myJobs.length)} />
            <View style={s.heroStatDiv} />
            <HeroStat label="Available Workers" value="10+" />
            <View style={s.heroStatDiv} />
            <HeroStat label="Status" value="Active" valueColor="#A5F3FC" />
          </View>
        </LinearGradient>
      </View>
      <Section title="My Job Posts">
        <View style={s.card}>
          {myJobs.length === 0 ? (
            <TouchableOpacity style={[s.timelineItem, { alignItems: "center", paddingBottom: 16 }]} onPress={() => router.push("/post-job")} activeOpacity={0.8}>
              <View style={[s.timelineDotCircle, { backgroundColor: "#EFF6FF" }]}>
                <Feather name="plus" size={15} color="#2563EB" />
              </View>
              <View style={[s.timelineContent, { marginLeft: 14, paddingBottom: 0 }]}>
                <Text style={s.timelineText}>Post your first job — takes 2 minutes</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ) : myJobs.map((job: any, i: number) => (
            <TouchableOpacity key={job.id} style={[s.timelineItem, { alignItems: "center", borderBottomWidth: i < myJobs.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: "#F3F4F6", paddingBottom: 14 }]} onPress={() => router.push(`/job/${job.id}`)} activeOpacity={0.8}>
              <View style={[s.timelineDotCircle, { backgroundColor: "#EFF6FF" }]}>
                <Feather name="briefcase" size={15} color="#2563EB" />
              </View>
              <View style={[s.timelineContent, { marginLeft: 14, paddingBottom: 0 }]}>
                <Text style={s.timelineText}>{job.title}</Text>
                <Text style={{ fontSize: 12, color: "#9CA3AF" }}>{job.applicantsCount} applicants</Text>
              </View>
              <View style={s.openPill}><View style={s.openDot} /><Text style={s.openText}>Open</Text></View>
            </TouchableOpacity>
          ))}
        </View>
      </Section>
    </View>
  );
}

// ─── Reusable Components ──────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function CheckRow({ icon, label, done, pulse, last }: { icon: string; label: string; done: boolean; pulse?: Animated.Value; last?: boolean }) {
  return (
    <View style={[s.checkRow, !last && s.checkRowBorder]}>
      <View style={[s.checkIcon, { backgroundColor: done ? "#F0FDF4" : "#F9FAFB" }]}>
        {pulse ? (
          <Animated.View style={{ opacity: pulse }}>
            <Feather name={icon as any} size={16} color="#F97316" />
          </Animated.View>
        ) : (
          <Feather name={icon as any} size={16} color={done ? "#22C55E" : "#9CA3AF"} />
        )}
      </View>
      <Text style={[s.checkLabel, !done && { color: "#6B7280" }]}>{label}</Text>
      {done
        ? <Feather name="check-circle" size={18} color="#22C55E" />
        : pulse
          ? <View style={s.pendingPill}><Text style={s.pendingText}>Pending</Text></View>
          : null
      }
    </View>
  );
}

function ProfileRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.checkRow, !last && s.checkRowBorder]}>
      <View style={[s.checkIcon, { backgroundColor: "#EFF6FF" }]}>
        <Feather name={icon as any} size={16} color="#2563EB" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.profileRowLabel}>{label}</Text>
        <Text style={s.profileRowValue}>{value}</Text>
      </View>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
  android: { elevation: 2 },
  default: {},
}) as object;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F7FA" },
  pad:  { paddingHorizontal: 20 },

  // Header
  header:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E7EB" },
  avatarImg:      { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#2563EB", justifyContent: "center", alignItems: "center" },
  avatarLetter:   { color: "#fff", fontSize: 18, fontWeight: "700" },
  helloText:      { fontSize: 18, fontWeight: "700", color: "#111827", letterSpacing: -0.3 },
  dateText:       { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  bellBtn:        { position: "relative", width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  bellDot:        { position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: "#fff" },

  // Hero
  heroCard: {
    borderRadius: 20, padding: 22, overflow: "hidden", marginTop: 20,
    ...(Platform.select({ ios: { shadowColor: "#2563EB", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 }, android: { elevation: 8 } }) as object || {}),
  },
  heroBubble1:      { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.07)", top: -60, right: -40 },
  heroBubble2:      { position: "absolute", width: 110, height: 110, borderRadius: 55, backgroundColor: "rgba(255,255,255,0.05)", bottom: -35, right: 90 },
  readyBadge:       { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.18)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 14 },
  greenDot:         { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ADE80" },
  readyBadgeText:   { color: "#fff", fontSize: 12, fontWeight: "600" },
  heroTitle:        { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.4, marginBottom: 10 },
  heroBody:         { color: "rgba(255,255,255,0.82)", fontSize: 13.5, lineHeight: 21, marginBottom: 20 },
  heroBtns:         { flexDirection: "row", gap: 10 },
  heroPrimaryBtn:   { flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  heroPrimaryBtnText: { color: "#2563EB", fontSize: 14, fontWeight: "700" },
  heroSecondaryBtn: { flex: 1, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 12, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  heroSecondaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  heroLabel:    { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "500", marginBottom: 6 },
  heroBigNum:   { color: "#fff", fontSize: 48, fontWeight: "800", letterSpacing: -2, marginBottom: 14 },
  heroStatsRow: { flexDirection: "row", alignItems: "center", paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
  heroStatItem: { flex: 1, alignItems: "center" },
  heroStatLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "500", marginBottom: 3 },
  heroStatValue: { color: "#fff", fontSize: 14, fontWeight: "700" },
  heroStatDiv:   { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.2)" },

  // Sections
  section:      { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827", letterSpacing: -0.3, marginBottom: 12 },

  // White card
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    ...CARD_SHADOW,
  },

  // Check/Profile rows inside cards
  checkRow:       { flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 16, paddingVertical: 14 },
  checkRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#F3F4F6" },
  checkIcon:      { width: 38, height: 38, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  checkLabel:     { flex: 1, fontSize: 14, fontWeight: "600", color: "#111827" },
  pendingPill:    { backgroundColor: "#FFF7ED", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pendingText:    { fontSize: 11, fontWeight: "600", color: "#F97316" },

  // Match note
  matchNote:     { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  matchNoteText: { fontSize: 13, color: "#6B7280", lineHeight: 20 },

  // Timeline
  timelineItem:   { flexDirection: "row", paddingHorizontal: 16, paddingTop: 14 },
  timelineLeft:   { alignItems: "center", width: 38 },
  timelineDotCircle: { width: 38, height: 38, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  timelineLine:   { width: 2, flex: 1, backgroundColor: "#F3F4F6", marginTop: 6, marginBottom: 0, minHeight: 12 },
  timelineContent:{ flex: 1, paddingLeft: 14, paddingBottom: 14 },
  timelineText:   { fontSize: 14, fontWeight: "600", color: "#111827", lineHeight: 21 },

  // Profile rows
  profileRowLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "500", marginBottom: 2 },
  profileRowValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  cardFooter:      { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#F3F4F6" },
  outlineBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1.5, borderColor: "#2563EB", borderRadius: 12, paddingVertical: 11 },
  outlineBtnText:  { color: "#2563EB", fontSize: 14, fontWeight: "700" },

  // Notifications
  notifDesc:        { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  notifDescText:    { fontSize: 13, color: "#6B7280", lineHeight: 20 },
  notifToggleRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#F3F4F6" },
  notifIcon:        { width: 38, height: 38, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  notifToggleLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  notifToggleSub:   { fontSize: 11, color: "#9CA3AF", marginTop: 1 },

  // Quick actions (3-col)
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard:  { width: "30.5%", backgroundColor: "#fff", borderRadius: 16, padding: 14, alignItems: "flex-start", borderWidth: StyleSheet.hairlineWidth, borderColor: "#E5E7EB", ...CARD_SHADOW },
  actionIcon:  { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  actionLabel: { fontSize: 12, fontWeight: "600", color: "#374151", lineHeight: 17 },

  // Tips
  tipIconWrap:    { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFBEB", justifyContent: "center", alignItems: "center" },
  tipDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: "#E5E7EB" },
  tipDotActive:   { width: 18, backgroundColor: "#2563EB" },
  tipAuto:        { fontSize: 11, color: "#9CA3AF", marginLeft: "auto" },

  // Support
  supportDesc:   { fontSize: 13, color: "#6B7280", lineHeight: 20, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 },
  supportBtns:   { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  supportBtnPrimary:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 13 },
  supportBtnPrimaryText:{ color: "#fff", fontSize: 14, fontWeight: "700" },
  supportBtnRow:        { flexDirection: "row", gap: 10 },
  supportBtnOutline:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: "#BFDBFE", borderRadius: 12, paddingVertical: 11, backgroundColor: "#EFF6FF" },
  supportBtnOutlineText:{ color: "#2563EB", fontSize: 13, fontWeight: "600" },

  // Referral
  referralCard:   { borderRadius: 18, padding: 20, overflow: "hidden", flexDirection: "row", alignItems: "center", gap: 14, ...(Platform.select({ ios: { shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14 }, android: { elevation: 6 } }) as object || {}) },
  referralBubble: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.07)", top: -30, right: 100 },
  referralTitle:  { color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 5 },
  referralBody:   { color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 18 },
  referralBtn:    { backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignSelf: "flex-start" },
  referralBtnText:{ color: "#7C3AED", fontSize: 13, fontWeight: "700" },

  // Active job
  clockBtn:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12 },
  clockBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  openPill:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F0FDF4", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  openDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: "#22C55E" },
  openText:     { fontSize: 11, fontWeight: "600", color: "#16A34A" },
});

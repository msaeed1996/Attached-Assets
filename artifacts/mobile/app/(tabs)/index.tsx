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

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  blue:    "#2563EB",
  blueDark:"#1E40AF",
  blueLight:"#DBEAFE",
  green:   "#22C55E",
  greenBg: "#DCFCE7",
  orange:  "#F97316",
  orangeBg:"#FFF7ED",
  purple:  "#8B5CF6",
  purpleBg:"#F5F3FF",
  red:     "#EF4444",
  redBg:   "#FFF1F2",
  bg:      "#F5F7FA",
  white:   "#FFFFFF",
  text:    "#111827",
  textMid: "#374151",
  textSub: "#6B7280",
  textMuted:"#9CA3AF",
  border:  "#E5E7EB",
  borderLight:"#F3F4F6",
};

const SHADOW_CARD = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
  android: { elevation: 3 },
  default: {},
}) as object;

const SHADOW_BLUE = Platform.select({
  ios:     { shadowColor: C.blue, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 18 },
  android: { elevation: 8 },
  default: {},
}) as object;

// ─── Constants ────────────────────────────────────────────────────────────────
const TIPS = [
  "Keep your availability updated — workers with current schedules get matched 2× faster.",
  "Respond quickly to invitations. Recruiters prefer workers who reply within the hour.",
  "Update your work experience regularly to unlock higher-paying job categories.",
  "Enable notifications so you never miss a new job opportunity or recruiter message.",
];

const WHAT_NEXT = [
  { icon: "user-check",   label: "Your profile is reviewed by the staffing team.", color: C.blue,   bg: C.blueLight  },
  { icon: "search",       label: "Recruiters search for workers matching your skills and availability.", color: C.purple, bg: C.purpleBg },
  { icon: "mail",         label: "You'll receive a job invitation directly in the app.", color: C.green,  bg: C.greenBg  },
  { icon: "check-circle", label: "Accept or decline the offer at your convenience.", color: C.orange, bg: C.orangeBg },
  { icon: "briefcase",    label: "Check in and start your shift on the confirmed date.", color: C.blue,   bg: C.blueLight },
];

const QUICK_ACTIONS = [
  { label: "Availability", sub: "Update schedule",       icon: "calendar",       grad: ["#2563EB", "#3B82F6"] as [string,string], route: "/(tabs)/availability" },
  { label: "Messages",     sub: "View recruiter messages",icon: "message-circle", grad: ["#8B5CF6", "#A78BFA"] as [string,string], route: "/(tabs)/messages"     },
  { label: "Profile",      sub: "Manage your account",   icon: "user",           grad: ["#F97316", "#FB923C"] as [string,string], route: "/(tabs)/profile"      },
  { label: "Support",      sub: "Need help?",             icon: "headphones",     grad: ["#22C55E", "#4ADE80"] as [string,string], route: "/(tabs)/messages"     },
  { label: "Settings",     sub: "Preferences",            icon: "settings",       grad: ["#64748B", "#94A3B8"] as [string,string], route: "/(tabs)/profile"      },
  { label: "My Jobs",      sub: "View applications",      icon: "briefcase",      grad: ["#EF4444", "#F87171"] as [string,string], route: "/(tabs)/jobs"         },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

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
  const isEmployer  = userRole === "employer";
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
  const acceptedApps = applications.filter((a) => a.workerId === "me" && a.status === "accepted");
  const hasActiveJob = acceptedApps.length > 0;
  const myJobs = jobs.filter((j: any) => j.employerId === "emp-me");

  const [notifVisible, setNotifVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const firstName = userProfile?.name?.split(" ")[0] || "there";

  return (
    <View style={s.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── PREMIUM HEADER ── */}
        <LinearGradient
          colors={["#1E3A8A", "#1D4ED8", "#2563EB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.header, { paddingTop: topPadding + 18 }]}
        >
          {/* Decorative bubbles */}
          <View style={s.headerBubble1} />
          <View style={s.headerBubble2} />

          <View style={s.headerTop}>
            <View style={s.headerLeft}>
              {/* TrueGigs Logo mark */}
              <View style={s.logoMark}>
                <Text style={s.logoMarkText}>TG</Text>
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={s.headerGreeting}>{getGreeting()} 👋</Text>
                <Text style={s.headerName}>Welcome back,</Text>
                <Text style={s.headerBrand}>TrueGigs</Text>
              </View>
            </View>
            <View style={s.headerRight}>
              <TouchableOpacity
                style={s.headerIconBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNotifVisible(true); }}
                activeOpacity={0.8}
              >
                <Feather name="bell" size={20} color="#fff" />
                {totalUnread > 0 && <View style={s.bellDot} />}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/profile")}
                style={s.avatarWrap}
                activeOpacity={0.85}
              >
                {userProfile?.avatar ? (
                  <Image source={{ uri: userProfile.avatar }} style={s.avatarImg} />
                ) : (
                  <View style={s.avatarFallback}>
                    <Text style={s.avatarLetter}>{firstName.charAt(0)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.headerTaglineRow}>
            <Text style={s.headerTagline}>Connecting Great People with Great Opportunities.</Text>
          </View>
        </LinearGradient>

        {/* ── CONTENT ── */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {isEmployer ? (
            <EmployerDashboard myJobs={myJobs} jobs={jobs} />
          ) : hasActiveJob ? (
            <ActiveWorkerDashboard userProfile={userProfile} acceptedApps={acceptedApps} jobs={jobs} />
          ) : (
            <NewUserDashboard userProfile={userProfile} firstName={firstName} />
          )}
        </Animated.View>
      </ScrollView>

      <NotificationsSheet visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </View>
  );
}

// ─── New User Dashboard ───────────────────────────────────────────────────────
function NewUserDashboard({ userProfile, firstName }: { userProfile: any; firstName: string }) {
  const [tipIdx, setTipIdx] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const skills   = (userProfile?.skills || []).slice(0, 4);
  const jobTitle = userProfile?.jobTitle || "Not specified";

  return (
    <View>
      {/* 1. HERO CARD */}
      <View style={s.pad}>
        <LinearGradient
          colors={["#1E40AF", "#2563EB", "#3B82F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroCard}
        >
          <View style={s.heroBubble1} />
          <View style={s.heroBubble2} />
          <View style={s.heroBubble3} />
          <View style={s.readyBadge}>
            <Animated.View style={[s.greenDot, { opacity: pulseAnim }]} />
            <Text style={s.readyBadgeText}>Ready for Opportunities</Text>
          </View>
          <Text style={s.heroTitle}>Welcome, {firstName}! 🎉</Text>
          <Text style={s.heroBody}>
            Your profile is active and visible to recruiters. We'll notify you the moment a suitable opportunity matches your skills and availability.
          </Text>
          <View style={s.heroBtns}>
            <TouchableOpacity
              style={s.heroPrimaryBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/availability"); }}
              activeOpacity={0.85}
            >
              <Feather name="calendar" size={15} color={C.blue} style={{ marginRight: 6 }} />
              <Text style={s.heroPrimaryBtnText}>Update Availability</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.heroSecondaryBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/profile"); }}
              activeOpacity={0.85}
            >
              <Feather name="user" size={15} color="#fff" style={{ marginRight: 6 }} />
              <Text style={s.heroSecondaryBtnText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* 2. QUICK ACTIONS */}
      <Section title="Quick Actions" icon="zap" iconColor={C.orange}>
        <View style={s.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <ActionCard key={a.label} {...a} />
          ))}
        </View>
      </Section>

      {/* 3. JOB MATCH STATUS */}
      <Section title="Job Match Status" icon="activity" iconColor={C.green}>
        <View style={s.card}>
          <CheckRow icon="user-check"  label="Registration Complete"              done />
          <CheckRow icon="shield"      label="Profile Complete"                   done />
          <CheckRow icon="calendar"    label="Availability Active"                done />
          <CheckRow
            icon="clock"
            label="Waiting for Matching Opportunities"
            done={false}
            pulse={pulseAnim}
            last
          />
          <View style={s.matchNote}>
            <Feather name="info" size={13} color={C.blue} style={{ marginRight: 6, marginTop: 1 }} />
            <Text style={s.matchNoteText}>
              We're actively matching your profile. You'll be notified as soon as a suitable opportunity becomes available.
            </Text>
          </View>
        </View>
      </Section>

      {/* 4. WHAT HAPPENS NEXT */}
      <Section title="What Happens Next?" icon="map" iconColor={C.purple}>
        <View style={s.card}>
          {WHAT_NEXT.map((step, i) => (
            <View key={i} style={s.timelineItem}>
              <View style={s.timelineLeft}>
                <View style={[s.timelineDotCircle, { backgroundColor: step.bg }]}>
                  <Feather name={step.icon as any} size={16} color={step.color} />
                </View>
                {i < WHAT_NEXT.length - 1 && <View style={s.timelineLine} />}
              </View>
              <View style={s.timelineContent}>
                <Text style={[s.timelineText, i > 1 && { color: C.textSub }]}>{step.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </Section>

      {/* 5. PROFILE SUMMARY */}
      <Section title="Your Profile Summary" icon="user" iconColor={C.blue}>
        <View style={s.card}>
          <ProfileRow icon="award"     label="Skills"             value={skills.length > 0 ? skills.join(", ") : "Not added yet"} iconColor={C.purple} iconBg={C.purpleBg} />
          <ProfileRow icon="briefcase" label="Experience"         value={jobTitle}                iconColor={C.blue}   iconBg={C.blueLight} />
          <ProfileRow icon="map-pin"   label="Preferred Location" value={userProfile?.location || "Austin, TX"} iconColor={C.orange} iconBg={C.orangeBg} />
          <ProfileRow icon="calendar"  label="Availability"       value="Full-time · Weekdays"   iconColor={C.green}  iconBg={C.greenBg}  />
          <ProfileRow icon="user"      label="Employment Type"    value="Part-time / Gig"        iconColor={C.blue}   iconBg={C.blueLight} last />
          <View style={s.cardFooter}>
            <TouchableOpacity style={s.outlineBtn} onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.85}>
              <Feather name="edit-3" size={14} color={C.blue} />
              <Text style={s.outlineBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Section>

      {/* 6. STAY UPDATED */}
      <Section title="Stay Updated" icon="bell" iconColor={C.blue}>
        <View style={s.card}>
          <View style={s.notifDesc}>
            <Text style={s.notifDescText}>
              Receive instant notifications whenever a recruiter sends you an invitation, a new job matches your profile, or your application status changes.
            </Text>
          </View>
          <View style={s.notifToggleRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <LinearGradient
                colors={notifEnabled ? [C.blue, "#3B82F6"] : ["#E5E7EB", "#E5E7EB"]}
                style={s.notifIconGrad}
              >
                <Feather name="bell" size={17} color={notifEnabled ? "#fff" : C.textMuted} />
              </LinearGradient>
              <View>
                <Text style={s.notifToggleLabel}>Notifications {notifEnabled ? "Enabled" : "Disabled"}</Text>
                <Text style={s.notifToggleSub}>{notifEnabled ? "You'll be notified immediately" : "Turn on to stay informed"}</Text>
              </View>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNotifEnabled(v); }}
              trackColor={{ false: "#E5E7EB", true: "#BFDBFE" }}
              thumbColor={notifEnabled ? C.blue : "#fff"}
            />
          </View>
        </View>
      </Section>

      {/* 7. HELPFUL TIPS */}
      <Section title="Helpful Tips" icon="sun" iconColor={C.orange}>
        <View style={s.card}>
          <View style={s.tipRow}>
            <LinearGradient colors={[C.orange, "#FB923C"]} style={s.tipIconWrap}>
              <Text style={{ fontSize: 18 }}>💡</Text>
            </LinearGradient>
            <Text style={s.tipText}>{TIPS[tipIdx]}</Text>
          </View>
          <View style={s.tipFooter}>
            {TIPS.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setTipIdx(i)} hitSlop={10}>
                <Animated.View style={[s.tipDot, i === tipIdx && s.tipDotActive]} />
              </TouchableOpacity>
            ))}
            <Text style={s.tipAuto}>Auto-rotating</Text>
          </View>
        </View>
      </Section>

      {/* 8. NEED ASSISTANCE */}
      <Section title="Need Assistance?" icon="headphones" iconColor={C.green}>
        <View style={s.card}>
          <Text style={s.supportDesc}>
            Our staffing team is available to answer questions and help you get started with your first assignment.
          </Text>
          <View style={s.supportBtns}>
            <TouchableOpacity
              style={s.supportBtnPrimary}
              onPress={() => router.push("/(tabs)/messages")}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[C.blue, "#3B82F6"]} style={s.supportBtnGrad}>
                <Feather name="message-circle" size={16} color="#fff" />
                <Text style={s.supportBtnPrimaryText}>Contact Support</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={s.supportBtnRow}>
              <TouchableOpacity style={s.supportBtnOutline} onPress={() => {}} activeOpacity={0.85}>
                <Feather name="phone" size={14} color={C.blue} />
                <Text style={s.supportBtnOutlineText}>Call Recruiter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.supportBtnOutline} onPress={() => {}} activeOpacity={0.85}>
                <Feather name="mail" size={14} color={C.blue} />
                <Text style={s.supportBtnOutlineText}>Email Us</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Section>

      {/* 9. REFERRAL CARD */}
      <View style={[s.pad, { marginTop: 8, marginBottom: 8 }]}>
        <LinearGradient
          colors={["#7C3AED", "#9333EA", "#C026D3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.referralCard}
        >
          <View style={s.referralBubble1} />
          <View style={s.referralBubble2} />
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
            <Text style={s.referralBtnText}>Invite Now</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

// ─── Active Worker Dashboard ──────────────────────────────────────────────────
function ActiveWorkerDashboard({ userProfile, acceptedApps, jobs }: any) {
  const acceptedApp = acceptedApps[0];
  const activeJob   = acceptedApp ? jobs.find((j: any) => j.id === acceptedApp.jobId) || jobs[0] : jobs[0];
  const [isClockedIn, setIsClockedIn] = useState(false);

  return (
    <View>
      <View style={s.pad}>
        <LinearGradient
          colors={["#1E40AF", "#2563EB", "#3B82F6"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.heroCard}
        >
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

      {/* Quick Actions for active worker */}
      <Section title="Quick Actions" icon="zap" iconColor={C.orange}>
        <View style={s.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <ActionCard key={a.label} {...a} />
          ))}
        </View>
      </Section>

      {activeJob && (
        <Section title="Active Job" icon="briefcase" iconColor={C.green}>
          <View style={s.card}>
            <View style={[s.timelineItem, { alignItems: "center", paddingBottom: 16 }]}>
              <View style={[s.timelineDotCircle, { backgroundColor: C.blueLight }]}>
                <Feather name="briefcase" size={16} color={C.blue} />
              </View>
              <View style={[s.timelineContent, { flex: 1, paddingBottom: 0, marginLeft: 14 }]}>
                <Text style={s.timelineText}>{activeJob.title}</Text>
                <Text style={{ fontSize: 12, color: C.textMuted }}>{activeJob.location}</Text>
              </View>
              <TouchableOpacity
                style={[s.clockBtn, { backgroundColor: isClockedIn ? C.green : C.blue }]}
                onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setIsClockedIn(!isClockedIn); }}
                activeOpacity={0.85}
              >
                <Feather name={isClockedIn ? "log-out" : "clock"} size={14} color="#fff" />
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
        <LinearGradient
          colors={["#1E40AF", "#2563EB", "#3B82F6"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.heroCard}
        >
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

      <Section title="My Job Posts" icon="briefcase" iconColor={C.blue}>
        <View style={s.card}>
          {myJobs.length === 0 ? (
            <TouchableOpacity
              style={[s.timelineItem, { alignItems: "center", paddingBottom: 16 }]}
              onPress={() => router.push("/post-job")}
              activeOpacity={0.8}
            >
              <View style={[s.timelineDotCircle, { backgroundColor: C.blueLight }]}>
                <Feather name="plus" size={16} color={C.blue} />
              </View>
              <View style={[s.timelineContent, { marginLeft: 14, paddingBottom: 0 }]}>
                <Text style={s.timelineText}>Post your first job — takes 2 minutes</Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.textMuted} />
            </TouchableOpacity>
          ) : myJobs.map((job: any, i: number) => (
            <TouchableOpacity
              key={job.id}
              style={[s.timelineItem, { alignItems: "center", borderBottomWidth: i < myJobs.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: C.borderLight, paddingBottom: 14 }]}
              onPress={() => router.push(`/job/${job.id}`)}
              activeOpacity={0.8}
            >
              <View style={[s.timelineDotCircle, { backgroundColor: C.blueLight }]}>
                <Feather name="briefcase" size={16} color={C.blue} />
              </View>
              <View style={[s.timelineContent, { marginLeft: 14, paddingBottom: 0 }]}>
                <Text style={s.timelineText}>{job.title}</Text>
                <Text style={{ fontSize: 12, color: C.textMuted }}>{job.applicantsCount} applicants</Text>
              </View>
              <View style={s.openPill}>
                <View style={s.openDot} />
                <Text style={s.openText}>Open</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Section>
    </View>
  );
}

// ─── Reusable Components ──────────────────────────────────────────────────────

function Section({ title, children, icon, iconColor }: { title: string; children: React.ReactNode; icon?: string; iconColor?: string }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        {icon && iconColor && (
          <View style={[s.sectionIconWrap, { backgroundColor: iconColor + "18" }]}>
            <Feather name={icon as any} size={14} color={iconColor} />
          </View>
        )}
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ActionCard({ label, sub, icon, grad, route }: { label: string; sub: string; icon: string; grad: [string, string]; route: string }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={[s.actionCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(route as any); }}
      >
        <LinearGradient colors={grad} style={s.actionIconGrad}>
          <Feather name={icon as any} size={24} color="#fff" />
        </LinearGradient>
        <Text style={s.actionLabel}>{label}</Text>
        <Text style={s.actionSub}>{sub}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function CheckRow({ icon, label, done, pulse, last }: { icon: string; label: string; done: boolean; pulse?: Animated.Value; last?: boolean }) {
  return (
    <View style={[s.checkRow, !last && s.checkRowBorder]}>
      <View style={[s.checkIcon, { backgroundColor: done ? C.greenBg : "#F9FAFB" }]}>
        {pulse ? (
          <Animated.View style={{ opacity: pulse }}>
            <Feather name={icon as any} size={17} color={C.orange} />
          </Animated.View>
        ) : (
          <Feather name={icon as any} size={17} color={done ? C.green : C.textMuted} />
        )}
      </View>
      <Text style={[s.checkLabel, !done && { color: C.textSub }]}>{label}</Text>
      {done ? (
        <Feather name="check-circle" size={20} color={C.green} />
      ) : pulse ? (
        <View style={s.pendingPill}><Text style={s.pendingText}>Pending</Text></View>
      ) : null}
    </View>
  );
}

function ProfileRow({ icon, label, value, last, iconColor, iconBg }: { icon: string; label: string; value: string; last?: boolean; iconColor: string; iconBg: string }) {
  return (
    <View style={[s.checkRow, !last && s.checkRowBorder]}>
      <View style={[s.checkIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={17} color={iconColor} />
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
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  pad:  { paddingHorizontal: 20 },

  // ── Premium Header ──
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    ...(Platform.select({ ios: { shadowColor: C.blue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16 }, android: { elevation: 10 } }) as object || {}),
  },
  headerBubble1: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.06)", top: -80, right: -50 },
  headerBubble2: { position: "absolute", width: 120, height: 120, borderRadius: 60,  backgroundColor: "rgba(255,255,255,0.04)", bottom: -40, left: 30  },
  headerTop:     { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerLeft:    { flexDirection: "row", alignItems: "center" },
  headerRight:   { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  logoMark:      { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  logoMarkText:  { color: "#fff", fontSize: 15, fontWeight: "900", letterSpacing: 0.5 },
  headerGreeting:{ color: "rgba(255,255,255,0.75)", fontSize: 12.5, fontWeight: "500" },
  headerName:    { color: "rgba(255,255,255,0.9)", fontSize: 13.5, fontWeight: "500", marginTop: 1 },
  headerBrand:   { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: -0.5, marginTop: 0 },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  bellDot:       { position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: "#fff" },
  avatarWrap:    {},
  avatarImg:     { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)" },
  avatarFallback:{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  avatarLetter:  { color: "#fff", fontSize: 17, fontWeight: "800" },
  headerTaglineRow: { marginTop: 14 },
  headerTagline: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontStyle: "italic", letterSpacing: 0.2 },

  // ── Hero Card ──
  heroCard: {
    borderRadius: 22, padding: 22, overflow: "hidden", marginTop: 20,
    ...SHADOW_BLUE,
  },
  heroBubble1: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.07)", top: -70, right: -50 },
  heroBubble2: { position: "absolute", width: 130, height: 130, borderRadius: 65,  backgroundColor: "rgba(255,255,255,0.05)", bottom: -45, right: 80  },
  heroBubble3: { position: "absolute", width: 80,  height: 80,  borderRadius: 40,  backgroundColor: "rgba(255,255,255,0.04)", bottom: 20,  left: -20   },
  readyBadge: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.18)", alignSelf: "flex-start", paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, marginBottom: 16 },
  greenDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ADE80" },
  readyBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  heroTitle:  { color: "#fff", fontSize: 23, fontWeight: "800", letterSpacing: -0.5, marginBottom: 10 },
  heroBody:   { color: "rgba(255,255,255,0.82)", fontSize: 13.5, lineHeight: 21, marginBottom: 22 },
  heroBtns:   { flexDirection: "row", gap: 10 },
  heroPrimaryBtn: {
    flex: 1, flexDirection: "row", backgroundColor: "#fff", borderRadius: 13, paddingVertical: 13, alignItems: "center", justifyContent: "center",
    ...(Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 }, android: { elevation: 2 } }) as object || {}),
  },
  heroPrimaryBtnText: { color: C.blue, fontSize: 14, fontWeight: "700" },
  heroSecondaryBtn:   { flex: 1, flexDirection: "row", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 13, paddingVertical: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.32)" },
  heroSecondaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  heroLabel:    { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "500", marginBottom: 6 },
  heroBigNum:   { color: "#fff", fontSize: 50, fontWeight: "900", letterSpacing: -2, marginBottom: 16 },
  heroStatsRow: { flexDirection: "row", alignItems: "center", paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
  heroStatItem: { flex: 1, alignItems: "center" },
  heroStatLabel:{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "500", marginBottom: 3 },
  heroStatValue:{ color: "#fff", fontSize: 14, fontWeight: "700" },
  heroStatDiv:  { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.2)" },

  // ── Sections ──
  section:      { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader:{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionIconWrap: { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: C.text, letterSpacing: -0.4 },

  // ── White Card ──
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    ...SHADOW_CARD,
  },

  // ── Check Rows ──
  checkRow:      { flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 16, paddingVertical: 15 },
  checkRowBorder:{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.borderLight },
  checkIcon:     { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  checkLabel:    { flex: 1, fontSize: 14, fontWeight: "600", color: C.text },
  pendingPill:   { backgroundColor: C.orangeBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pendingText:   { fontSize: 11, fontWeight: "700", color: C.orange },

  // ── Match Note ──
  matchNote:    { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  matchNoteText:{ flex: 1, fontSize: 12.5, color: C.textSub, lineHeight: 19 },

  // ── Timeline ──
  timelineItem:    { flexDirection: "row", paddingHorizontal: 16, paddingTop: 14 },
  timelineLeft:    { alignItems: "center", width: 40 },
  timelineDotCircle:{ width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  timelineLine:    { width: 2, flex: 1, backgroundColor: C.borderLight, marginTop: 6, minHeight: 12 },
  timelineContent: { flex: 1, paddingLeft: 14, paddingBottom: 14 },
  timelineText:    { fontSize: 13.5, fontWeight: "600", color: C.text, lineHeight: 20 },

  // ── Profile Rows ──
  profileRowLabel: { fontSize: 11, color: C.textMuted, fontWeight: "500", marginBottom: 2 },
  profileRowValue: { fontSize: 14, fontWeight: "600", color: C.text },
  cardFooter:      { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.borderLight },
  outlineBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1.5, borderColor: C.blue, borderRadius: 12, paddingVertical: 12 },
  outlineBtnText:  { color: C.blue, fontSize: 14, fontWeight: "700" },

  // ── Notification Toggle ──
  notifDesc:       { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  notifDescText:   { fontSize: 13, color: C.textSub, lineHeight: 20 },
  notifToggleRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.borderLight },
  notifIconGrad:   { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  notifToggleLabel:{ fontSize: 14, fontWeight: "600", color: C.text },
  notifToggleSub:  { fontSize: 11, color: C.textMuted, marginTop: 1 },

  // ── Premium Action Cards ──
  actionsGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard:   {
    width: (SCREEN_W - 40 - 12 * 2) / 3,
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    ...SHADOW_CARD,
  },
  actionIconGrad: { width: 52, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  actionLabel:    { fontSize: 12.5, fontWeight: "700", color: C.text,    lineHeight: 17, marginBottom: 2 },
  actionSub:      { fontSize: 10.5, fontWeight: "500", color: C.textMuted, lineHeight: 15 },

  // ── Tips ──
  tipRow:      { flexDirection: "row", gap: 14, alignItems: "flex-start", padding: 16, paddingBottom: 12 },
  tipIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  tipText:     { flex: 1, fontSize: 13.5, color: C.textMid, lineHeight: 21 },
  tipFooter:   { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 16, paddingBottom: 16 },
  tipDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  tipDotActive:{ width: 20, borderRadius: 3, backgroundColor: C.blue },
  tipAuto:     { fontSize: 11, color: C.textMuted, marginLeft: "auto" },

  // ── Support ──
  supportDesc:          { fontSize: 13, color: C.textSub, lineHeight: 20, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 },
  supportBtns:          { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  supportBtnPrimary:    { borderRadius: 13, overflow: "hidden" },
  supportBtnGrad:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  supportBtnPrimaryText:{ color: "#fff", fontSize: 14, fontWeight: "700" },
  supportBtnRow:        { flexDirection: "row", gap: 10 },
  supportBtnOutline:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: "#BFDBFE", borderRadius: 13, paddingVertical: 12, backgroundColor: C.blueLight },
  supportBtnOutlineText:{ color: C.blue, fontSize: 13, fontWeight: "600" },

  // ── Referral ──
  referralCard:    {
    borderRadius: 20, padding: 20, overflow: "hidden", flexDirection: "row", alignItems: "center", gap: 14,
    ...(Platform.select({ ios: { shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14 }, android: { elevation: 6 } }) as object || {}),
  },
  referralBubble1: { position: "absolute", width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.07)", top: -30, right: 90  },
  referralBubble2: { position: "absolute", width: 80,  height: 80,  borderRadius: 40, backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: -10 },
  referralTitle:   { color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 5 },
  referralBody:    { color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 18 },
  referralBtn:     { backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignSelf: "flex-start" },
  referralBtnText: { color: "#7C3AED", fontSize: 13, fontWeight: "700" },

  // ── Active Job ──
  clockBtn:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12 },
  clockBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  openPill:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.greenBg, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 },
  openDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green },
  openText:     { fontSize: 11, fontWeight: "700", color: "#16A34A" },
});

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
  StatusBar,
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

const { width: W } = Dimensions.get("window");

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg:       "#FFFFFF",
  bgSoft:   "#F8F9FB",
  text:     "#0A0A0F",
  textMid:  "#3D3D50",
  textSub:  "#72728A",
  textMute: "#B0B0C3",
  border:   "#EBEBF0",

  blue:     "#2563EB",
  blueL:    "#EEF3FF",
  indigo:   "#4F46E5",
  indigoL:  "#EEEEFF",
  purple:   "#7C3AED",
  purpleL:  "#F4EEFF",
  emerald:  "#059669",
  emeraldL: "#EDFAF4",
  orange:   "#EA580C",
  orangeL:  "#FFF3EC",
  coral:    "#E11D48",
  coralL:   "#FFF0F3",
  amber:    "#D97706",
  amberL:   "#FFFBEB",
  teal:     "#0D9488",
  tealL:    "#EDFAFA",
};

function shadow(color = "#000", opacity = 0.08, radius = 16, y = 4) {
  return Platform.select({
    ios: { shadowColor: color, shadowOffset: { width: 0, height: y }, shadowOpacity: opacity, shadowRadius: radius },
    android: { elevation: Math.round(y * 1.5) },
    default: {},
  }) as object;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const TIPS = [
  "Workers who respond to invitations within 1 hour get hired 3× more often.",
  "Keeping availability updated signals that you're serious and reliable.",
  "Adding a profile photo increases recruiter contact rates by 60%.",
  "Completing your work history unlocks access to higher-paying job categories.",
];

const STEPS = [
  { icon: "user-check",   label: "Profile reviewed by our team",              done: true  },
  { icon: "search",       label: "Matched with suitable employers",            done: true  },
  { icon: "mail",         label: "Receive a job invitation in-app",            done: false },
  { icon: "check-square", label: "Accept the offer and confirm your schedule", done: false },
  { icon: "briefcase",    label: "Check in and start your first shift",        done: false },
];

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets   = useSafeAreaInsets();
  const { userProfile, userRole } = useApp();
  const { jobs, applications } = useJobs();
  const { conversations }      = useMessages();

  const webOffset    = Platform.OS === "web" ? 67 : 0;
  const isEmployer   = userRole === "employer";
  const totalUnread  = conversations.reduce((s, c) => s + c.unreadCount, 0);
  const acceptedApps = applications.filter((a: any) => a.workerId === "me" && a.status === "accepted");
  const hasActiveJob = acceptedApps.length > 0;
  const myJobs       = jobs.filter((j: any) => j.employerId === "emp-me");

  const [notifVisible, setNotifVisible] = useState(false);
  const fadeIn = useRef(new Animated.Value(1)).current;

  const firstName = userProfile?.name?.split(" ")[0] || "there";
  const safeTop   = insets.top + webOffset;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* ── Compact Sticky Header ── */}
      <View style={[st.header, { paddingTop: safeTop + 10 }]}>
        <View style={st.headerLeft}>
          <View style={st.logoCircle}>
            <Text style={st.logoText}>TG</Text>
          </View>
          <Text style={st.logoLabel}>TrueGigs</Text>
        </View>
        <View style={st.headerRight}>
          <TouchableOpacity
            style={st.iconBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNotifVisible(true); }}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={21} color={T.text} />
            {totalUnread > 0 && <View style={st.badgeDot} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.85}>
            {userProfile?.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={st.avatar} />
            ) : (
              <LinearGradient colors={[T.blue, T.indigo]} style={st.avatarGrad}>
                <Text style={st.avatarLetter}>{firstName.charAt(0)}</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        <Animated.View style={{ opacity: fadeIn }}>
          {isEmployer ? (
            <EmployerHome myJobs={myJobs} firstName={firstName} />
          ) : hasActiveJob ? (
            <ActiveWorkerHome userProfile={userProfile} acceptedApps={acceptedApps} jobs={jobs} firstName={firstName} />
          ) : (
            <NewUserHome userProfile={userProfile} firstName={firstName} />
          )}
        </Animated.View>
      </ScrollView>

      <NotificationsSheet visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </View>
  );
}

// ─── New User Home ─────────────────────────────────────────────────────────────
function NewUserHome({ userProfile, firstName }: any) {
  const [tipIdx, setTipIdx] = useState(0);

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale,   { toValue: 1.6,  duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseScale,   { toValue: 1,    duration: 1000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0,    duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6,  duration: 1000, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const skills   = (userProfile?.skills || []).slice(0, 3);
  const jobTitle = userProfile?.jobTitle || "Not specified";

  return (
    <View>
      {/* ── Greeting ── */}
      <View style={st.greetingBlock}>
        <Text style={st.greeting}>{getGreeting()},</Text>
        <Text style={st.greetingName}>{firstName} 👋</Text>
        <View style={st.statusPill}>
          <View style={st.statusPillDotWrap}>
            <Animated.View style={[st.statusPillPulse, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
            <View style={st.statusPillDot} />
          </View>
          <Text style={st.statusPillText}>Matching in progress</Text>
        </View>
      </View>

      {/* ── Hero Card — frosted glass style ── */}
      <View style={st.px}>
        <View style={st.heroCard}>
          {/* Colorful background blobs */}
          <View style={[st.blob, { width: 160, height: 160, backgroundColor: "#DBEAFE", top: -40, right: -30,  borderRadius: 80  }]} />
          <View style={[st.blob, { width: 100, height: 100, backgroundColor: "#EDE9FE", bottom: -20, left: -20, borderRadius: 50  }]} />
          <View style={[st.blob, { width: 80,  height: 80,  backgroundColor: "#D1FAE5", bottom: 20,  right: 60,  borderRadius: 40 }]} />

          <View style={st.heroInner}>
            <View style={st.heroReadyRow}>
              <View style={st.heroReadyDotWrap}>
                <View style={st.heroReadyDot} />
              </View>
              <Text style={st.heroReadyLabel}>Ready for Opportunities</Text>
            </View>
            <Text style={st.heroTitle}>Your profile is{"\n"}live & active</Text>
            <Text style={st.heroBody}>
              We're currently matching you with suitable employers. Expect an invitation soon.
            </Text>
            <View style={st.heroActions}>
              <TouchableOpacity
                style={st.heroCTA}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/availability"); }}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[T.blue, T.indigo]} style={st.heroCTAGrad}>
                  <Feather name="calendar" size={14} color="#fff" />
                  <Text style={st.heroCTAText}>Set Availability</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={st.heroSecondary}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/profile"); }}
                activeOpacity={0.85}
              >
                <Text style={st.heroSecondaryText}>My Profile →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* ── Quick Actions — premium feature cards ── */}
      <SectionLabel label="Quick Actions" />
      <View style={st.px}>
        {/* Row 1 — two wide-ish cards */}
        <View style={st.qaRow}>
          <QuickAction
            icon="calendar"
            label="Availability"
            sub="Update your schedule"
            colors={[T.blue, T.indigo]}
            bgColor={T.blueL}
            size="large"
            route="/(tabs)/availability"
          />
          <QuickAction
            icon="message-circle"
            label="Messages"
            sub="Recruiter inbox"
            colors={[T.purple, "#9333EA"]}
            bgColor={T.purpleL}
            size="large"
            route="/(tabs)/messages"
          />
        </View>
        {/* Row 2 — three compact circles */}
        <View style={st.qaRowSmall}>
          <QuickActionSmall icon="user"       label="Profile"  colors={[T.orange, "#F97316"]} bgColor={T.orangeL} route="/(tabs)/profile"      />
          <QuickActionSmall icon="headphones" label="Support"  colors={[T.teal,   T.emerald]} bgColor={T.tealL}   route="/(tabs)/messages"     />
          <QuickActionSmall icon="briefcase"  label="My Jobs"  colors={[T.coral,  "#F43F5E"]} bgColor={T.coralL}  route="/(tabs)/jobs"         />
          <QuickActionSmall icon="settings"   label="Settings" colors={["#64748B","#475569"]} bgColor={"#F1F5F9"} route="/(tabs)/profile"      />
        </View>
      </View>

      {/* ── Match Progress ── */}
      <SectionLabel label="Your Progress" />
      <View style={st.px}>
        <View style={[st.card, { padding: 20 }]}>
          <View style={st.progressHeaderRow}>
            <Text style={st.progressHeading}>Job Matching</Text>
            <View style={st.progressBadge}>
              <Text style={st.progressBadgeText}>2 / 5 steps</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={st.progressTrack}>
            <LinearGradient colors={[T.blue, T.indigo]} style={[st.progressFill, { width: "40%" }]} />
          </View>
          <View style={{ gap: 14, marginTop: 18 }}>
            {STEPS.map((step, i) => (
              <ProgressStep key={i} step={step} index={i} isLast={i === STEPS.length - 1} />
            ))}
          </View>
        </View>
      </View>

      {/* ── What Happens Next ── */}
      <SectionLabel label="What Happens Next" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.hscrollContent}>
        {[
          { icon: "user-check",   color: T.blue,    bg: T.blueL,    label: "Profile Review",     body: "Our team reviews your work history and skills." },
          { icon: "search",       color: T.purple,  bg: T.purpleL,  label: "Smart Matching",     body: "You're matched with employers that fit your profile." },
          { icon: "mail",         color: T.emerald, bg: T.emeraldL, label: "Job Invitation",     body: "Receive a direct invitation right here in the app." },
          { icon: "check-square", color: T.orange,  bg: T.orangeL,  label: "Accept & Confirm",   body: "Accept the offer and agree on start date and time." },
          { icon: "briefcase",    color: T.teal,    bg: T.tealL,    label: "Start Working",      body: "Check in at the job site and begin your first shift." },
        ].map((step, i) => (
          <View key={i} style={st.nextCard}>
            <View style={[st.nextIconCircle, { backgroundColor: step.bg }]}>
              <Feather name={step.icon as any} size={22} color={step.color} />
            </View>
            <View style={[st.nextStepNum, { backgroundColor: step.bg }]}>
              <Text style={[st.nextStepNumText, { color: step.color }]}>{i + 1}</Text>
            </View>
            <Text style={st.nextCardLabel}>{step.label}</Text>
            <Text style={st.nextCardBody}>{step.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ── Profile Snapshot ── */}
      <SectionLabel label="Your Profile" trailing={{ label: "Edit", onPress: () => router.push("/(tabs)/profile") }} />
      <View style={st.px}>
        <View style={[st.card, { padding: 0, overflow: "hidden" }]}>
          {[
            { icon: "award",     label: "Skills",    value: skills.length > 0 ? skills.join(" · ") : "Add your skills", color: T.purple, bg: T.purpleL },
            { icon: "briefcase", label: "Role",      value: jobTitle,                                                   color: T.blue,   bg: T.blueL   },
            { icon: "map-pin",   label: "Location",  value: userProfile?.location || "Austin, TX",                     color: T.teal,   bg: T.tealL   },
            { icon: "calendar",  label: "Schedule",  value: "Full-time · Weekdays",                                     color: T.orange, bg: T.orangeL },
          ].map((row, i, arr) => (
            <ProfileInfoRow key={i} {...row} last={i === arr.length - 1} />
          ))}
        </View>
      </View>

      {/* ── Tip of the Day ── */}
      <SectionLabel label="Tip of the Day" />
      <View style={st.px}>
        <LinearGradient colors={["#0F172A", "#1E293B"]} style={st.tipCard}>
          <View style={[st.blob, { width: 120, height: 120, backgroundColor: "rgba(99,102,241,0.25)", top: -30, right: -20, borderRadius: 60 }]} />
          <View style={[st.blob, { width: 80,  height: 80,  backgroundColor: "rgba(16,185,129,0.15)", bottom: -20, left: 30,  borderRadius: 40 }]} />
          <View style={st.tipIconWrap}>
            <Text style={{ fontSize: 22 }}>💡</Text>
          </View>
          <Text style={st.tipText}>{TIPS[tipIdx]}</Text>
          <View style={st.tipDots}>
            {TIPS.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setTipIdx(i)} hitSlop={10}>
                <View style={[st.tipDot, i === tipIdx && st.tipDotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>
      </View>

      {/* ── Referral Banner ── */}
      <View style={[st.px, { marginTop: 24 }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
          <LinearGradient colors={["#6D28D9", "#8B5CF6", "#A78BFA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.referralBanner}>
            <View style={[st.blob, { width: 100, height: 100, backgroundColor: "rgba(255,255,255,0.1)", top: -25, right: 60, borderRadius: 50 }]} />
            <View style={st.referralLeft}>
              <Text style={st.referralEmoji}>🎁</Text>
              <View>
                <Text style={st.referralTitle}>Invite a Friend</Text>
                <Text style={st.referralSub}>Earn rewards when they land their first job</Text>
              </View>
            </View>
            <View style={st.referralChevron}>
              <Feather name="arrow-right" size={18} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Contact Support ── */}
      <View style={[st.px, { marginTop: 16, flexDirection: "row", gap: 12 }]}>
        <TouchableOpacity style={[st.supportChip, { flex: 1 }]} onPress={() => router.push("/(tabs)/messages")} activeOpacity={0.85}>
          <Feather name="message-circle" size={16} color={T.blue} />
          <Text style={st.supportChipText}>Message Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.supportChip, { flex: 1 }]} onPress={() => {}} activeOpacity={0.85}>
          <Feather name="phone" size={16} color={T.emerald} />
          <Text style={st.supportChipText}>Call Recruiter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Active Worker Home ────────────────────────────────────────────────────────
function ActiveWorkerHome({ userProfile, acceptedApps, jobs, firstName }: any) {
  const acceptedApp = acceptedApps[0];
  const activeJob   = acceptedApp ? jobs.find((j: any) => j.id === acceptedApp.jobId) || jobs[0] : jobs[0];
  const [isClockedIn, setIsClockedIn] = useState(false);

  return (
    <View>
      <View style={st.greetingBlock}>
        <Text style={st.greeting}>Welcome back,</Text>
        <Text style={st.greetingName}>{firstName} 👋</Text>
        <View style={[st.statusPill, { backgroundColor: "#DCFCE7" }]}>
          <View style={[st.statusPillDot, { backgroundColor: "#22C55E" }]} />
          <Text style={[st.statusPillText, { color: "#15803D" }]}>On assignment</Text>
        </View>
      </View>

      <View style={st.px}>
        {/* Stats row */}
        <View style={st.statsRow}>
          <View style={[st.statCard, { backgroundColor: T.blueL }]}>
            <Text style={[st.statNum, { color: T.blue }]}>{userProfile?.completedJobs || 0}</Text>
            <Text style={st.statLabel}>Completed</Text>
          </View>
          <View style={[st.statCard, { backgroundColor: T.emeraldL }]}>
            <Text style={[st.statNum, { color: T.emerald }]}>{userProfile?.rating ?? "—"}⭐</Text>
            <Text style={st.statLabel}>Rating</Text>
          </View>
          <View style={[st.statCard, { backgroundColor: T.purpleL }]}>
            <Text style={[st.statNum, { color: T.purple }]}>455h</Text>
            <Text style={st.statLabel}>Hours</Text>
          </View>
        </View>

        {/* Active job card */}
        {activeJob && (
          <View style={[st.card, { padding: 18, marginTop: 16 }]}>
            <View style={st.activeJobHeader}>
              <View style={[st.nextIconCircle, { backgroundColor: T.blueL, width: 48, height: 48, borderRadius: 14 }]}>
                <Feather name="briefcase" size={20} color={T.blue} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={st.activeJobTitle}>{activeJob.title}</Text>
                <Text style={st.activeJobSub}>{activeJob.location}</Text>
              </View>
              <View style={[st.openPill]}>
                <View style={st.openDot} />
                <Text style={st.openText}>Active</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[st.clockBtn, { backgroundColor: isClockedIn ? T.emerald : T.blue }]}
              onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setIsClockedIn(!isClockedIn); }}
              activeOpacity={0.85}
            >
              <Feather name={isClockedIn ? "log-out" : "clock"} size={16} color="#fff" />
              <Text style={st.clockBtnText}>{isClockedIn ? "Clock Out" : "Clock In"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <SectionLabel label="Quick Actions" />
      <View style={st.px}>
        <View style={st.qaRow}>
          <QuickAction icon="calendar" label="Availability" sub="Update your schedule" colors={[T.blue, T.indigo]}   bgColor={T.blueL}   size="large" route="/(tabs)/availability" />
          <QuickAction icon="message-circle" label="Messages" sub="Recruiter inbox"     colors={[T.purple, "#9333EA"]} bgColor={T.purpleL} size="large" route="/(tabs)/messages"     />
        </View>
        <View style={st.qaRowSmall}>
          <QuickActionSmall icon="user"       label="Profile"  colors={[T.orange, "#F97316"]} bgColor={T.orangeL} route="/(tabs)/profile"  />
          <QuickActionSmall icon="headphones" label="Support"  colors={[T.teal,   T.emerald]} bgColor={T.tealL}   route="/(tabs)/messages" />
          <QuickActionSmall icon="briefcase"  label="My Jobs"  colors={[T.coral,  "#F43F5E"]} bgColor={T.coralL}  route="/(tabs)/jobs"     />
          <QuickActionSmall icon="settings"   label="Settings" colors={["#64748B","#475569"]} bgColor={"#F1F5F9"} route="/(tabs)/profile"  />
        </View>
      </View>
    </View>
  );
}

// ─── Employer Home ─────────────────────────────────────────────────────────────
function EmployerHome({ myJobs, firstName }: any) {
  return (
    <View>
      <View style={st.greetingBlock}>
        <Text style={st.greeting}>Welcome back,</Text>
        <Text style={st.greetingName}>{firstName} 👋</Text>
        <View style={[st.statusPill, { backgroundColor: T.blueL }]}>
          <View style={[st.statusPillDot, { backgroundColor: T.blue }]} />
          <Text style={[st.statusPillText, { color: T.blue }]}>Employer account</Text>
        </View>
      </View>

      <View style={st.px}>
        <View style={st.statsRow}>
          <View style={[st.statCard, { backgroundColor: T.blueL }]}>
            <Text style={[st.statNum, { color: T.blue }]}>{myJobs.length}</Text>
            <Text style={st.statLabel}>Active Posts</Text>
          </View>
          <View style={[st.statCard, { backgroundColor: T.emeraldL }]}>
            <Text style={[st.statNum, { color: T.emerald }]}>10+</Text>
            <Text style={st.statLabel}>Workers Ready</Text>
          </View>
          <View style={[st.statCard, { backgroundColor: T.orangeL }]}>
            <Text style={[st.statNum, { color: T.orange }]}>—</Text>
            <Text style={st.statLabel}>Avg Response</Text>
          </View>
        </View>
      </View>

      <SectionLabel label="My Job Posts" trailing={{ label: "Post New", onPress: () => router.push("/post-job") }} />
      <View style={st.px}>
        <View style={[st.card, { padding: 0, overflow: "hidden" }]}>
          {myJobs.length === 0 ? (
            <TouchableOpacity style={st.emptyPostRow} onPress={() => router.push("/post-job")} activeOpacity={0.8}>
              <LinearGradient colors={[T.blue, T.indigo]} style={st.emptyPostIcon}>
                <Feather name="plus" size={20} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={st.emptyPostTitle}>Post your first job</Text>
                <Text style={st.emptyPostSub}>Takes less than 2 minutes</Text>
              </View>
              <Feather name="arrow-right" size={18} color={T.textMute} />
            </TouchableOpacity>
          ) : myJobs.map((job: any, i: number) => (
            <TouchableOpacity
              key={job.id}
              style={[st.emptyPostRow, i < myJobs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.border }]}
              onPress={() => router.push(`/job/${job.id}`)}
              activeOpacity={0.8}
            >
              <View style={[st.nextIconCircle, { backgroundColor: T.blueL, width: 46, height: 46, borderRadius: 14 }]}>
                <Feather name="briefcase" size={18} color={T.blue} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={st.emptyPostTitle}>{job.title}</Text>
                <Text style={st.emptyPostSub}>{job.applicantsCount} applicants</Text>
              </View>
              <View style={st.openPill}>
                <View style={st.openDot} /><Text style={st.openText}>Open</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SectionLabel label="Quick Actions" />
      <View style={st.px}>
        <View style={st.qaRow}>
          <QuickAction icon="plus-circle" label="Post a Job"   sub="Find the right worker" colors={[T.blue, T.indigo]}   bgColor={T.blueL}   size="large" route="/post-job"          />
          <QuickAction icon="users"       label="Browse Workers" sub="View available talent" colors={[T.purple, "#9333EA"]} bgColor={T.purpleL} size="large" route="/(tabs)/messages"  />
        </View>
      </View>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ label, trailing }: { label: string; trailing?: { label: string; onPress: () => void } }) {
  return (
    <View style={st.sectionLabel}>
      <Text style={st.sectionLabelText}>{label}</Text>
      {trailing && (
        <TouchableOpacity onPress={trailing.onPress} activeOpacity={0.7}>
          <Text style={st.sectionTrailing}>{trailing.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function QuickAction({ icon, label, sub, colors, bgColor, size, route }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => { Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 0 }).start(); };
  const lift  = () => { Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }).start(); };

  return (
    <Animated.View style={[st.qaLargeCard, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={1}
        onPressIn={press}
        onPressOut={lift}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(route); }}
      >
        <LinearGradient colors={colors} style={st.qaLargeIcon}>
          <Feather name={icon} size={26} color="#fff" />
        </LinearGradient>
        <Text style={st.qaLargeLabel}>{label}</Text>
        <Text style={st.qaLargeSub}>{sub}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function QuickActionSmall({ icon, label, colors, bgColor, route }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => { Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 40 }).start(); };
  const lift  = () => { Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }).start(); };

  return (
    <Animated.View style={{ transform: [{ scale }], alignItems: "center" }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={press}
        onPressOut={lift}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(route); }}
        style={{ alignItems: "center" }}
      >
        <LinearGradient colors={colors} style={st.qaSmallCircle}>
          <Feather name={icon} size={22} color="#fff" />
        </LinearGradient>
        <Text style={st.qaSmallLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ProgressStep({ step, index, isLast }: { step: typeof STEPS[0]; index: number; isLast: boolean }) {
  const colors: Record<number, [string, string]> = {
    0: [T.blue,    T.blueL   ],
    1: [T.purple,  T.purpleL ],
    2: [T.emerald, T.emeraldL],
    3: [T.orange,  T.orangeL ],
    4: [T.teal,    T.tealL   ],
  };
  const [iconColor, iconBg] = colors[index] || [T.blue, T.blueL];

  return (
    <View style={st.progressStepRow}>
      <View style={st.progressStepLeft}>
        <View style={[st.progressStepCircle, { backgroundColor: step.done ? iconBg : "#F1F5F9" }]}>
          <Feather name={step.icon as any} size={15} color={step.done ? iconColor : T.textMute} />
        </View>
        {!isLast && <View style={[st.progressStepLine, { backgroundColor: step.done ? iconColor + "30" : T.border }]} />}
      </View>
      <View style={st.progressStepRight}>
        <Text style={[st.progressStepLabel, !step.done && { color: T.textMute }]}>{step.label}</Text>
        {step.done && (
          <View style={[st.donePill]}>
            <Feather name="check" size={10} color={iconColor} />
            <Text style={[st.donePillText, { color: iconColor }]}>Done</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ProfileInfoRow({ icon, label, value, color, bg, last }: any) {
  return (
    <View style={[st.profileRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.border }]}>
      <View style={[st.profileRowIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={15} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.profileRowLabel}>{label}</Text>
        <Text style={st.profileRowValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  // ── Header ──
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: T.bg,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.border,
    ...shadow("#000", 0.04, 8, 2),
  },
  headerLeft:   { flexDirection: "row", alignItems: "center", gap: 8 },
  headerRight:  { flexDirection: "row", alignItems: "center", gap: 12 },
  logoCircle:   { width: 32, height: 32, borderRadius: 10, backgroundColor: T.blue, justifyContent: "center", alignItems: "center" },
  logoText:     { color: "#fff", fontSize: 12, fontWeight: "900", letterSpacing: 0.3 },
  logoLabel:    { fontSize: 17, fontWeight: "800", color: T.text, letterSpacing: -0.5 },
  iconBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: T.bgSoft, justifyContent: "center", alignItems: "center" },
  badgeDot:     { position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: T.coral, borderWidth: 1.5, borderColor: T.bg },
  avatar:       { width: 38, height: 38, borderRadius: 19 },
  avatarGrad:   { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },
  avatarLetter: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // ── Greeting ──
  greetingBlock: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 4 },
  greeting:      { fontSize: 16, fontWeight: "500", color: T.textSub, letterSpacing: -0.1 },
  greetingName:  { fontSize: 32, fontWeight: "800", color: T.text, letterSpacing: -1.2, marginTop: 2, marginBottom: 14 },
  statusPill:    { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", backgroundColor: "#EEF3FF", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  statusPillDotWrap: { width: 10, height: 10, justifyContent: "center", alignItems: "center" },
  statusPillPulse:   { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: T.blue },
  statusPillDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: T.blue },
  statusPillText:    { fontSize: 12, fontWeight: "600", color: T.blue },

  // ── Layout ──
  px: { paddingHorizontal: 20 },

  // ── Hero Card ──
  heroCard: {
    marginTop: 20, borderRadius: 24, backgroundColor: T.bg, overflow: "hidden",
    borderWidth: 1, borderColor: T.border,
    ...shadow(T.blue, 0.1, 24, 6),
  },
  blob:      { position: "absolute", zIndex: 0 },
  heroInner: { padding: 22, zIndex: 1 },
  heroReadyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  heroReadyDotWrap: { width: 10, height: 10, justifyContent: "center", alignItems: "center" },
  heroReadyDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#22C55E" },
  heroReadyLabel: { fontSize: 12, fontWeight: "700", color: T.textMid, textTransform: "uppercase", letterSpacing: 0.5 },
  heroTitle: { fontSize: 26, fontWeight: "800", color: T.text, letterSpacing: -0.8, lineHeight: 34, marginBottom: 10 },
  heroBody:  { fontSize: 14, color: T.textSub, lineHeight: 21, marginBottom: 20 },
  heroActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroCTA:     { borderRadius: 14, overflow: "hidden", ...shadow(T.blue, 0.2, 10, 4) },
  heroCTAGrad: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 13 },
  heroCTAText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  heroSecondary:    {},
  heroSecondaryText:{ fontSize: 14, fontWeight: "700", color: T.blue },

  // ── Section Label ──
  sectionLabel: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, marginTop: 32, marginBottom: 14 },
  sectionLabelText: { fontSize: 19, fontWeight: "800", color: T.text, letterSpacing: -0.5 },
  sectionTrailing:  { fontSize: 14, fontWeight: "600", color: T.blue },

  // ── Quick Actions Large ──
  qaRow:      { flexDirection: "row", gap: 12 },
  qaLargeCard:{
    flex: 1, borderRadius: 20, backgroundColor: T.bg, padding: 18,
    borderWidth: StyleSheet.hairlineWidth, borderColor: T.border,
    ...shadow("#000", 0.06, 14, 3),
  },
  qaLargeIcon:  { width: 58, height: 58, borderRadius: 18, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  qaLargeLabel: { fontSize: 15, fontWeight: "700", color: T.text, marginBottom: 3 },
  qaLargeSub:   { fontSize: 12, color: T.textMute },

  // ── Quick Actions Small ──
  qaRowSmall:   { flexDirection: "row", justifyContent: "space-between", marginTop: 20, paddingHorizontal: 8 },
  qaSmallCircle:{ width: 58, height: 58, borderRadius: 29, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  qaSmallLabel: { fontSize: 11.5, fontWeight: "600", color: T.textMid, textAlign: "center" },

  // ── Card ──
  card: {
    borderRadius: 20, backgroundColor: T.bg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: T.border,
    ...shadow("#000", 0.05, 12, 2),
  },

  // ── Progress ──
  progressHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  progressHeading:   { fontSize: 16, fontWeight: "700", color: T.text },
  progressBadge:     { backgroundColor: T.blueL, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  progressBadgeText: { fontSize: 12, fontWeight: "600", color: T.blue },
  progressTrack:     { height: 5, borderRadius: 3, backgroundColor: T.border, overflow: "hidden" },
  progressFill:      { height: "100%", borderRadius: 3 },

  progressStepRow:    { flexDirection: "row", gap: 14 },
  progressStepLeft:   { alignItems: "center", width: 32 },
  progressStepCircle: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  progressStepLine:   { width: 2, flex: 1, marginTop: 4, minHeight: 10 },
  progressStepRight:  { flex: 1, paddingBottom: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressStepLabel:  { fontSize: 13.5, fontWeight: "600", color: T.text, flex: 1, paddingRight: 8 },
  donePill:           { flexDirection: "row", alignItems: "center", gap: 3 },
  donePillText:       { fontSize: 11, fontWeight: "700" },

  // ── Next Steps Horizontal ──
  hscrollContent: { paddingLeft: 20, paddingRight: 8, gap: 12 },
  nextCard: {
    width: 170, borderRadius: 20, backgroundColor: T.bg, padding: 18,
    borderWidth: StyleSheet.hairlineWidth, borderColor: T.border,
    ...shadow("#000", 0.05, 12, 2),
  },
  nextIconCircle: { width: 52, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 8, position: "relative" },
  nextStepNum:    { position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  nextStepNumText:{ fontSize: 10, fontWeight: "800" },
  nextCardLabel:  { fontSize: 14, fontWeight: "700", color: T.text, marginBottom: 6, lineHeight: 20 },
  nextCardBody:   { fontSize: 12, color: T.textSub, lineHeight: 18 },

  // ── Profile ──
  profileRow:      { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  profileRowIcon:  { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  profileRowLabel: { fontSize: 11, color: T.textMute, fontWeight: "500", marginBottom: 2 },
  profileRowValue: { fontSize: 14, fontWeight: "600", color: T.text },

  // ── Tip ──
  tipCard:    { borderRadius: 22, padding: 22, overflow: "hidden", ...shadow("#000", 0.15, 20, 6) },
  tipIconWrap:{ width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", justifyContent: "center", alignItems: "center", marginBottom: 14 },
  tipText:    { fontSize: 15, color: "rgba(255,255,255,0.9)", lineHeight: 23, marginBottom: 18, fontWeight: "500" },
  tipDots:    { flexDirection: "row", gap: 6 },
  tipDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.3)" },
  tipDotActive:{ width: 22, backgroundColor: "#fff" },

  // ── Referral ──
  referralBanner: { borderRadius: 20, paddingVertical: 18, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", overflow: "hidden", ...shadow("#6D28D9", 0.2, 16, 6) },
  referralLeft:   { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  referralEmoji:  { fontSize: 26 },
  referralTitle:  { color: "#fff", fontSize: 15, fontWeight: "800" },
  referralSub:    { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  referralChevron:{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },

  // ── Support Chips ──
  supportChip: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: T.bg, borderWidth: 1.5, borderColor: T.border,
    ...shadow("#000", 0.04, 8, 2),
  },
  supportChipText: { fontSize: 13, fontWeight: "600", color: T.textMid },

  // ── Active Worker ──
  statsRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  statCard:  { flex: 1, borderRadius: 16, padding: 14, alignItems: "center" },
  statNum:   { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: "500", color: T.textMute, marginTop: 3 },

  activeJobHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  activeJobTitle:  { fontSize: 15, fontWeight: "700", color: T.text },
  activeJobSub:    { fontSize: 12, color: T.textMute, marginTop: 2 },
  clockBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14 },
  clockBtnText:    { color: "#fff", fontSize: 14, fontWeight: "700" },

  // ── Employer ──
  emptyPostRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  emptyPostIcon:{ width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  emptyPostTitle:{ fontSize: 15, fontWeight: "700", color: T.text },
  emptyPostSub: { fontSize: 12, color: T.textMute, marginTop: 2 },

  openPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#DCFCE7", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  openDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  openText: { fontSize: 11.5, fontWeight: "700", color: "#15803D" },
});

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
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
import { BlurView } from "expo-blur";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Static data ──────────────────────────────────────────────────────────────

const FEATURED_JOBS = [
  { id: "j1", title: "Warehouse Associate",  company: "Amazon Logistics",   pay: 24, location: "Austin, TX", distance: "5 mi",   shift: "Tomorrow 6AM–2PM", type: "Full-time", icon: "package",      color: "#FF9900", bg: "#FFF8E7" },
  { id: "j2", title: "Event Staff",          company: "Prestige Events Co.", pay: 22, location: "Austin, TX", distance: "1.2 mi", shift: "Sat 8AM–4PM",     type: "Part-time", icon: "star",         color: "#7C3AED", bg: "#F5F3FF" },
  { id: "j3", title: "Delivery Driver",      company: "FedEx Ground",        pay: 21, location: "Austin, TX", distance: "3.4 mi", shift: "Mon–Fri Flexible", type: "Temp",      icon: "truck",        color: "#4D148C", bg: "#EDE9FE" },
  { id: "j4", title: "Retail Associate",     company: "Target",              pay: 18, location: "Austin, TX", distance: "2.1 mi", shift: "Flexible",         type: "Part-time", icon: "shopping-bag", color: "#CC0000", bg: "#FEF2F2" },
  { id: "j5", title: "Food Service Worker",  company: "Levy Restaurants",    pay: 17, location: "Austin, TX", distance: "0.8 mi", shift: "Fri 5PM–11PM",    type: "Gig",       icon: "coffee",       color: "#F97316", bg: "#FFF7ED" },
];

const FEATURED_EMPLOYERS = [
  { id: "e1", name: "Amazon",   positions: 47, color: "#FF9900", letter: "A" },
  { id: "e2", name: "FedEx",    positions: 23, color: "#4D148C", letter: "F" },
  { id: "e3", name: "UPS",      positions: 18, color: "#351C15", letter: "U" },
  { id: "e4", name: "Hilton",   positions: 12, color: "#003B5C", letter: "H" },
  { id: "e5", name: "Target",   positions: 31, color: "#CC0000", letter: "T" },
  { id: "e6", name: "Marriott", positions: 9,  color: "#8B1A1A", letter: "M" },
];

const JOB_CATEGORIES = [
  { label: "Warehouse",        icon: "package",       bg: "#DBEAFE", iconColor: "#2563EB" },
  { label: "Hospitality",      icon: "coffee",        bg: "#FEF3C7", iconColor: "#D97706" },
  { label: "Retail",           icon: "shopping-bag",  bg: "#FCE7F3", iconColor: "#DB2777" },
  { label: "Event Staff",      icon: "star",          bg: "#EDE9FE", iconColor: "#7C3AED" },
  { label: "Cust. Support",    icon: "headphones",    bg: "#D1FAE5", iconColor: "#059669" },
  { label: "Delivery",         icon: "truck",         bg: "#FEE2E2", iconColor: "#DC2626" },
  { label: "Healthcare",       icon: "heart",         bg: "#FFE4E6", iconColor: "#E11D48" },
  { label: "Construction",     icon: "tool",          bg: "#FFF7ED", iconColor: "#EA580C" },
];

const QUICK_ACTIONS = [
  { label: "Browse Jobs",  icon: "briefcase",      bg: "#EFF6FF", iconColor: "#2563EB", route: "/(tabs)/jobs"         },
  { label: "Availability", icon: "calendar",       bg: "#F0FDF4", iconColor: "#22C55E", route: "/(tabs)/availability" },
  { label: "Saved Jobs",   icon: "bookmark",       bg: "#FFF7ED", iconColor: "#F97316", route: "/(tabs)/jobs"         },
  { label: "Messages",     icon: "message-circle", bg: "#F5F3FF", iconColor: "#7C3AED", route: "/(tabs)/messages"     },
  { label: "Support",      icon: "life-buoy",      bg: "#FFF1F2", iconColor: "#E11D48", route: "/(tabs)/profile"      },
  { label: "Edit Profile", icon: "user",           bg: "#F0F9FF", iconColor: "#0284C7", route: "/(tabs)/profile"      },
];

const MARKET_STATS = [
  { value: "124", label: "Warehouse jobs\nposted today",     icon: "package",     color: "#2563EB", bg: "#EFF6FF" },
  { value: "38",  label: "Hospitality shifts\navailable",    icon: "coffee",      color: "#D97706", bg: "#FFFBEB" },
  { value: "17",  label: "Employers\nhiring nearby",         icon: "users",       color: "#7C3AED", bg: "#F5F3FF" },
  { value: "46",  label: "New jobs added\nthis week",        icon: "trending-up", color: "#22C55E", bg: "#F0FDF4" },
];

const HIRING_ACTIVITY = [
  { icon: "check-circle", label: "Your profile is complete",               color: "#22C55E", time: "Just now",    done: true,  active: false },
  { icon: "check-circle", label: "Your availability has been saved",       color: "#22C55E", time: "Just now",    done: true,  active: false },
  { icon: "search",       label: "Matching you with nearby employers",      color: "#2563EB", time: "In progress", done: false, active: true  },
  { icon: "mail",         label: "Job invitations will appear here soon",   color: "#9CA3AF", time: "Pending",     done: false, active: false },
];

const TIPS = [
  "Respond quickly to job invitations — workers who reply within 1 hour are hired 3× more often.",
  "Keep your availability updated to get matched with more relevant shifts near you.",
  "Save jobs you're interested in so you can apply quickly when the time is right.",
];

function getDateString() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, userRole } = useApp();
  const { jobs, applications } = useJobs();
  const { conversations } = useMessages();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const isEmployer = userRole === "employer";
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
  const myApplications = applications.filter((a) => a.workerId === "me" && a.status === "accepted");
  const hasActiveJob = myApplications.length > 0;

  const [notifVisible, setNotifVisible] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockModalVisible, setClockModalVisible] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [activeJobForModal, setActiveJobForModal] = useState<any>(null);

  const toggleSave = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedJobs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const myJobs = jobs.filter((j) => j.employerId === "emp-me");

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

        {isEmployer ? (
          <EmployerDashboard myJobs={myJobs} jobs={jobs} />
        ) : hasActiveJob ? (
          <ActiveWorkerDashboard
            userProfile={userProfile}
            myApplications={myApplications}
            jobs={jobs}
            isClockedIn={isClockedIn}
            onClockPress={(job: any) => { setActiveJobForModal(job); setClockModalVisible(true); }}
          />
        ) : (
          <NewUserDashboard
            userProfile={userProfile}
            savedJobs={savedJobs}
            onToggleSave={toggleSave}
          />
        )}
      </ScrollView>

      <NotificationsSheet visible={notifVisible} onClose={() => setNotifVisible(false)} />

      {/* Clock-in Modal */}
      <Modal visible={clockModalVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setClockModalVisible(false)}>
        <View style={{ flex: 1 }}>
          {Platform.OS === "ios" ? (
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setClockModalVisible(false)}>
              <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFill} />
            </Pressable>
          ) : (
            <Pressable style={[ms.backdrop, StyleSheet.absoluteFill]} onPress={() => setClockModalVisible(false)} />
          )}
          <Pressable style={ms.sheetWrap} onPress={() => setClockModalVisible(false)}>
            <Pressable style={ms.card} onPress={(e) => e.stopPropagation()}>
              <View style={ms.handle} />
              <View style={ms.header}>
                <Text style={ms.title}>{isClockedIn ? "Ready to Clock Out?" : "Ready to Clock In?"}</Text>
                <TouchableOpacity style={ms.closeBtn} onPress={() => setClockModalVisible(false)} hitSlop={8}>
                  <Feather name="x" size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <View style={ms.body}>
                <TouchableOpacity
                  style={[ms.confirmBtn, isClockedIn && { backgroundColor: "#EF4444" }]}
                  activeOpacity={0.9}
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    if (isClockedIn) { setIsClockedIn(false); } else { setClockInTime(new Date()); setIsClockedIn(true); }
                    setClockModalVisible(false);
                  }}
                >
                  <Feather name={isClockedIn ? "log-out" : "clock"} size={20} color="#fff" />
                  <Text style={ms.confirmBtnText}>{isClockedIn ? "Clock Out Now" : "Clock In Now"}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

// ─── New User Dashboard ───────────────────────────────────────────────────────

function NewUserDashboard({ userProfile, savedJobs, onToggleSave }: { userProfile: any; savedJobs: string[]; onToggleSave: (id: string) => void }) {
  const [tipIdx, setTipIdx] = useState(0);

  return (
    <View>
      {/* 1. WELCOME HERO */}
      <View style={s.pad}>
        <LinearGradient colors={["#1E40AF", "#2563EB", "#3B82F6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
          <View style={s.heroBubble1} /><View style={s.heroBubble2} />
          <View style={s.heroMatchBadge}>
            <View style={s.greenDot} />
            <Text style={s.heroMatchText}>Matching in Progress</Text>
          </View>
          <Text style={s.heroTitle}>Welcome, {userProfile?.name?.split(" ")[0] || "there"}! 👋</Text>
          <Text style={s.heroSubtitle}>
            We're already matching your profile with employers based on your skills and location.
          </Text>
          <Text style={s.heroCaption}>
            You'll receive job opportunities as soon as employers review your profile.
          </Text>
          <View style={s.heroBtns}>
            <TouchableOpacity
              style={s.heroPrimaryBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/jobs"); }}
              activeOpacity={0.85}
            >
              <Text style={s.heroPrimaryBtnText}>Browse Jobs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.heroSecondaryBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/profile"); }}
              activeOpacity={0.85}
            >
              <Text style={s.heroSecondaryBtnText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* 2. RECOMMENDED JOBS */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Recommended Jobs Near You</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")}><Text style={s.viewAll}>View all ↗</Text></TouchableOpacity>
      </View>
      <FlatList
        data={FEATURED_JOBS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 8, gap: 12 }}
        renderItem={({ item }) => (
          <View style={s.jobCard}>
            <View style={s.jobCardTop}>
              <View style={[s.jobIconCircle, { backgroundColor: item.bg }]}>
                <Feather name={item.icon as any} size={20} color={item.color} />
              </View>
              <TouchableOpacity onPress={() => onToggleSave(item.id)} hitSlop={10}>
                <Feather name={savedJobs.includes(item.id) ? "bookmark" : "bookmark"} size={20} color={savedJobs.includes(item.id) ? "#2563EB" : "#D1D5DB"} />
              </TouchableOpacity>
            </View>
            <Text style={s.jobTitle}>{item.title}</Text>
            <Text style={s.jobCompany}>{item.company}</Text>
            <View style={s.jobMeta}>
              <Feather name="map-pin" size={11} color="#9CA3AF" />
              <Text style={s.jobMetaText}>{item.location} · {item.distance}</Text>
            </View>
            <View style={s.jobMeta}>
              <Feather name="clock" size={11} color="#9CA3AF" />
              <Text style={s.jobMetaText}>{item.shift}</Text>
            </View>
            <View style={s.jobCardFooter}>
              <View>
                <Text style={s.jobPay}>${item.pay}<Text style={s.jobPayUnit}>/hr</Text></Text>
                <View style={[s.jobTypePill, { backgroundColor: item.bg }]}>
                  <Text style={[s.jobTypeText, { color: item.color }]}>{item.type}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={s.applyBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/jobs"); }}
                activeOpacity={0.85}
              >
                <Text style={s.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* 3. HIRING ACTIVITY */}
      <View style={[s.sectionHeader, { marginTop: 28 }]}>
        <Text style={s.sectionTitle}>Your Hiring Activity</Text>
      </View>
      <View style={[s.pad, { paddingTop: 0 }]}>
        <View style={s.card}>
          {HIRING_ACTIVITY.map((item, i) => (
            <View key={i} style={[s.timelineRow, i < HIRING_ACTIVITY.length - 1 && s.timelineBorder]}>
              <View style={[s.timelineIcon, { backgroundColor: item.done ? "#F0FDF4" : item.active ? "#EFF6FF" : "#F9FAFB" }]}>
                <Feather name={item.icon as any} size={16} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.timelineLabel, !item.done && !item.active && { color: "#9CA3AF" }]}>{item.label}</Text>
                <View style={s.timelineTimeRow}>
                  {item.active && <View style={s.activeDot} />}
                  <Text style={[s.timelineTime, item.active && { color: "#2563EB" }]}>{item.time}</Text>
                </View>
              </View>
              {item.done && <Feather name="check-circle" size={18} color="#22C55E" />}
            </View>
          ))}
        </View>
      </View>

      {/* 4. FEATURED EMPLOYERS */}
      <View style={[s.sectionHeader, { marginTop: 28 }]}>
        <Text style={s.sectionTitle}>Companies Hiring This Week</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")}><Text style={s.viewAll}>View all ↗</Text></TouchableOpacity>
      </View>
      <FlatList
        data={FEATURED_EMPLOYERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 8, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.employerCard} activeOpacity={0.8} onPress={() => router.push("/(tabs)/jobs")}>
            <View style={[s.employerLogo, { backgroundColor: item.color }]}>
              <Text style={s.employerLetter}>{item.letter}</Text>
            </View>
            <Text style={s.employerName}>{item.name}</Text>
            <Text style={s.employerPositions}>{item.positions} open</Text>
          </TouchableOpacity>
        )}
      />

      {/* 5. JOB CATEGORIES */}
      <View style={[s.sectionHeader, { marginTop: 28 }]}>
        <Text style={s.sectionTitle}>Explore Job Categories</Text>
      </View>
      <View style={[s.pad, { paddingTop: 0 }]}>
        <View style={s.categoryGrid}>
          {JOB_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              style={s.categoryCard}
              activeOpacity={0.8}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/jobs"); }}
            >
              <View style={[s.categoryIcon, { backgroundColor: cat.bg }]}>
                <Feather name={cat.icon as any} size={20} color={cat.iconColor} />
              </View>
              <Text style={s.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 6. QUICK ACTIONS */}
      <View style={[s.sectionHeader, { marginTop: 28 }]}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={[s.pad, { paddingTop: 0 }]}>
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
      </View>

      {/* 7. MARKET INSIGHTS */}
      <View style={[s.sectionHeader, { marginTop: 28 }]}>
        <Text style={s.sectionTitle}>Hiring Near You</Text>
      </View>
      <View style={[s.pad, { paddingTop: 0 }]}>
        <View style={s.statsGrid}>
          {MARKET_STATS.map((stat) => (
            <View key={stat.label} style={[s.statCard, { backgroundColor: stat.bg }]}>
              <Feather name={stat.icon as any} size={20} color={stat.color} />
              <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 8. TIPS */}
      <View style={[s.sectionHeader, { marginTop: 28 }]}>
        <Text style={s.sectionTitle}>Tips & Guidance</Text>
      </View>
      <View style={[s.pad, { paddingTop: 0, marginBottom: 8 }]}>
        <View style={s.card}>
          <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
            <View style={[s.timelineIcon, { backgroundColor: "#FFFBEB", width: 40, height: 40, borderRadius: 12 }]}>
              <Text style={{ fontSize: 18 }}>💡</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 14, color: "#374151", lineHeight: 22, fontWeight: "400" }}>
              {TIPS[tipIdx]}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {TIPS.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setTipIdx(i)} hitSlop={10}>
                <View style={[s.tipDot, i === tipIdx && s.tipDotActive]} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 3, marginLeft: "auto" }}
              onPress={() => setTipIdx((tipIdx + 1) % TIPS.length)}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#2563EB" }}>Next tip</Text>
              <Feather name="chevron-right" size={13} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Active Worker Dashboard (has an accepted job) ────────────────────────────

function ActiveWorkerDashboard({ userProfile, myApplications, jobs, isClockedIn, onClockPress }: any) {
  const acceptedApp = myApplications[0];
  const activeJob = acceptedApp ? jobs.find((j: any) => j.id === acceptedApp.jobId) || jobs[0] : jobs[0];

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
        <View style={s.pad}>
          <Text style={[s.sectionTitle, { marginBottom: 12 }]}>Active Job</Text>
          <View style={s.card}>
            <View style={s.timelineRow}>
              <View style={s.timelineIcon}><Feather name="briefcase" size={16} color="#6B7280" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.timelineLabel}>{activeJob.title}</Text>
                <Text style={s.timelineTime}>{activeJob.location}</Text>
              </View>
              <TouchableOpacity
                style={[s.clockBtn, { backgroundColor: isClockedIn ? "#10B981" : "#2563EB" }]}
                onPress={() => onClockPress(activeJob)}
                activeOpacity={0.85}
              >
                <Feather name={isClockedIn ? "log-out" : "clock"} size={13} color="#fff" />
                <Text style={s.clockBtnText}>{isClockedIn ? "Clock Out" : "Clock In"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
            <HeroStat label="Total Jobs" value={String(myJobs.length)} />
            <View style={s.heroStatDiv} />
            <HeroStat label="Available" value={String(jobs.length)} />
            <View style={s.heroStatDiv} />
            <HeroStat label="Status" value="Active" valueColor="#A5F3FC" />
          </View>
        </LinearGradient>
      </View>
      <View style={[s.sectionHeader, { marginTop: 8 }]}>
        <Text style={s.sectionTitle}>My Job Posts</Text>
        <TouchableOpacity onPress={() => router.push("/post-job")}><Text style={s.viewAll}>+ New</Text></TouchableOpacity>
      </View>
      <View style={s.pad}>
        <View style={s.card}>
          {myJobs.length === 0 ? (
            <TouchableOpacity style={s.timelineRow} onPress={() => router.push("/post-job")} activeOpacity={0.8}>
              <View style={s.timelineIcon}><Feather name="plus-circle" size={16} color="#6B7280" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.timelineLabel}>Post your first job</Text>
                <Text style={s.timelineTime}>Takes 2 minutes</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ) : myJobs.map((job: any, i: number) => (
            <TouchableOpacity key={job.id} style={[s.timelineRow, i < myJobs.length - 1 && s.timelineBorder]} onPress={() => router.push(`/job/${job.id}`)} activeOpacity={0.8}>
              <View style={s.timelineIcon}><Feather name="briefcase" size={16} color="#6B7280" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.timelineLabel}>{job.title}</Text>
                <Text style={s.timelineTime}>{job.applicantsCount} applicants</Text>
              </View>
              <View style={s.openPill}><View style={s.openDot} /><Text style={s.openText}>Open</Text></View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

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
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F7FA" },
  pad:  { paddingHorizontal: 20 },

  // Header
  header:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E7EB" },
  avatarImg:     { width: 46, height: 46, borderRadius: 23 },
  avatarFallback:{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#2563EB", justifyContent: "center", alignItems: "center" },
  avatarLetter:  { color: "#fff", fontSize: 18, fontWeight: "700" },
  helloText:     { fontSize: 18, fontWeight: "700", color: "#111827", letterSpacing: -0.3 },
  dateText:      { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  bellBtn:       { position: "relative", width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  bellDot:       { position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: "#fff" },

  // Hero
  heroCard:     { borderRadius: 20, padding: 22, overflow: "hidden", marginTop: 20, ...(Platform.select({ ios: { shadowColor: "#2563EB", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 }, android: { elevation: 8 } }) || {}) },
  heroBubble1:  { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.07)", top: -50, right: -30 },
  heroBubble2:  { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, right: 80 },
  heroMatchBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.18)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 14 },
  greenDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ADE80" },
  heroMatchText:{ color: "#fff", fontSize: 12, fontWeight: "600" },
  heroTitle:    { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.5, marginBottom: 8 },
  heroSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 21, marginBottom: 6 },
  heroCaption:  { color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 18, marginBottom: 20 },
  heroBtns:     { flexDirection: "row", gap: 10 },
  heroPrimaryBtn:     { flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  heroPrimaryBtnText: { color: "#2563EB", fontSize: 14, fontWeight: "700" },
  heroSecondaryBtn:     { flex: 1, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 12, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  heroSecondaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  heroLabel:    { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "500", marginBottom: 6 },
  heroBigNum:   { color: "#fff", fontSize: 48, fontWeight: "800", letterSpacing: -2, marginBottom: 14 },
  heroStatsRow: { flexDirection: "row", alignItems: "center", paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
  heroStatItem: { flex: 1, alignItems: "center" },
  heroStatLabel:{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "500", marginBottom: 3 },
  heroStatValue:{ color: "#fff", fontSize: 14, fontWeight: "700" },
  heroStatDiv:  { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.2)" },

  // Section headers
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 14, marginTop: 28 },
  sectionTitle:  { fontSize: 18, fontWeight: "700", color: "#111827", letterSpacing: -0.3 },
  viewAll:       { fontSize: 13, fontWeight: "600", color: "#2563EB" },

  // Generic white card
  card: { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: "#E5E7EB", ...CARD_SHADOW },

  // Job cards (horizontal scroll)
  jobCard: {
    width: SCREEN_W * 0.72,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    ...CARD_SHADOW,
  },
  jobCardTop:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  jobIconCircle:{ width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  jobTitle:     { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 3 },
  jobCompany:   { fontSize: 13, color: "#6B7280", marginBottom: 8 },
  jobMeta:      { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  jobMetaText:  { fontSize: 12, color: "#9CA3AF" },
  jobCardFooter:{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#F3F4F6" },
  jobPay:       { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 4 },
  jobPayUnit:   { fontSize: 12, fontWeight: "500", color: "#6B7280" },
  jobTypePill:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
  jobTypeText:  { fontSize: 11, fontWeight: "600" },
  applyBtn:     { backgroundColor: "#2563EB", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, ...(Platform.select({ ios: { shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 4 } }) || {}) },
  applyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Timeline
  timelineRow:    { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  timelineBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#F3F4F6" },
  timelineIcon:   { width: 38, height: 38, borderRadius: 10, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  timelineLabel:  { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 3 },
  timelineTimeRow:{ flexDirection: "row", alignItems: "center", gap: 5 },
  activeDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2563EB" },
  timelineTime:   { fontSize: 12, color: "#9CA3AF" },

  // Employer cards
  employerCard:  { alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 16, minWidth: 100, borderWidth: StyleSheet.hairlineWidth, borderColor: "#E5E7EB", ...CARD_SHADOW },
  employerLogo:  { width: 52, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  employerLetter:{ color: "#fff", fontSize: 22, fontWeight: "800" },
  employerName:  { fontSize: 13, fontWeight: "700", color: "#111827", marginBottom: 2 },
  employerPositions: { fontSize: 11, color: "#9CA3AF" },

  // Categories grid (2 cols)
  categoryGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryCard:  { width: "47.5%", backgroundColor: "#fff", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: "#E5E7EB", ...CARD_SHADOW },
  categoryIcon:  { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  categoryLabel: { fontSize: 13, fontWeight: "600", color: "#374151", flex: 1 },

  // Quick actions (3 cols)
  actionsGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard:    { width: "30.5%", backgroundColor: "#fff", borderRadius: 16, padding: 14, alignItems: "flex-start", borderWidth: StyleSheet.hairlineWidth, borderColor: "#E5E7EB", ...CARD_SHADOW },
  actionIcon:    { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  actionLabel:   { fontSize: 12, fontWeight: "600", color: "#374151", lineHeight: 17 },

  // Stats (2 cols)
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard:  { width: "47.5%", borderRadius: 16, padding: 16, gap: 6 },
  statValue: { fontSize: 28, fontWeight: "800", letterSpacing: -1 },
  statLabel: { fontSize: 12, color: "#6B7280", lineHeight: 17 },

  // Tips
  tipDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: "#E5E7EB" },
  tipDotActive: { width: 18, backgroundColor: "#2563EB" },

  // Clock / status chips
  clockBtn:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12 },
  clockBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  openPill:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F0FDF4", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  openDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: "#22C55E" },
  openText:     { fontSize: 11, fontWeight: "600", color: "#16A34A" },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  backdrop:  { backgroundColor: "rgba(0,0,0,0.55)" },
  sheetWrap: { flex: 1, justifyContent: "flex-end" },
  card: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingBottom: 32, paddingTop: 14, ...(Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16 }, android: { elevation: 10 } }) || {}) },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  title:  { fontSize: 18, fontWeight: "800", color: "#111827", letterSpacing: -0.3 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  body:     { gap: 14 },
  confirmBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#2563EB", paddingVertical: 16, borderRadius: 16, ...(Platform.select({ ios: { shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }, android: { elevation: 5 } }) || {}) },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

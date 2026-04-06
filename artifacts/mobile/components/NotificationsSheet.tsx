import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const SCREEN_W = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 140;

type NotifType = "job" | "application" | "reminder" | "payment" | "system";
type NotifStatus = "active" | "muted" | "dismissed";

type Notification = {
  id: string;
  type: NotifType;
  category: string;
  title: string;
  body: string;
  detail: string;
  time: string;
  read: boolean;
  status: NotifStatus;
};

const INITIAL_NOTIFS: Notification[] = [
  {
    id: "n1",
    type: "job",
    category: "Job Alert",
    title: "High Priority Gig",
    body: "Breakfast Cook ($28/hr) is open for you.",
    detail: "A new high-priority shift has been posted that matches your profile. Breakfast Cook at Metro Kitchen — $28/hr, starts tomorrow at 6am. Apply before it fills up.",
    time: "2m ago",
    read: false,
    status: "active",
  },
  {
    id: "n2",
    type: "payment",
    category: "Payment",
    title: "Payment Processed",
    body: "$180.00 deposited for Shift #40460.",
    detail: "Your payment of $180.00 for Shift #40460 (Warehouse Associate, Apr 3) has been successfully processed. Funds typically arrive within 1–2 business days.",
    time: "1h ago",
    read: false,
    status: "active",
  },
  {
    id: "n3",
    type: "reminder",
    category: "Reminder",
    title: "Shift Reminder",
    body: "Check-in for #40474 starts in 30 mins.",
    detail: "Your upcoming shift #40474 at LogiCo Warehouse begins in 30 minutes. Please arrive on time and check in via the app. Location: 220 Industrial Blvd, Unit 4.",
    time: "3h ago",
    read: false,
    status: "active",
  },
  {
    id: "n4",
    type: "application",
    category: "Application",
    title: "Application Accepted",
    body: "Your application for Warehouse Associate at LogiCo has been accepted.",
    detail: "Congratulations! LogiCo has accepted your application for the Warehouse Associate position. Start date: April 8. Pay: $19/hr. Report to the front desk on your first day.",
    time: "5h ago",
    read: true,
    status: "active",
  },
  {
    id: "n5",
    type: "job",
    category: "Job Alert",
    title: "New Job Near You",
    body: "Event Staff needed at Downtown Convention Center — $22/hr.",
    detail: "TechEvent Inc. is looking for Event Staff at the Downtown Convention Center this weekend. $22/hr, flexible hours. Previous experience preferred but not required.",
    time: "Yesterday",
    read: true,
    status: "active",
  },
  {
    id: "n6",
    type: "system",
    category: "System",
    title: "Profile Verified",
    body: "Your identity has been verified. You now appear in employer searches.",
    detail: "Your profile verification is complete. Your name, ID, and work eligibility have been confirmed. Employers can now find and invite you directly.",
    time: "2 days ago",
    read: true,
    status: "active",
  },
];

const NOTIF_META: Record<NotifType, { icon: string; color: string; bg: string }> = {
  job:         { icon: "zap",         color: "#2563EB", bg: "#dbeafe" },
  application: { icon: "file-text",   color: "#10b981", bg: "#d1fae5" },
  reminder:    { icon: "clock",       color: "#64748b", bg: "#f1f5f9" },
  payment:     { icon: "credit-card", color: "#059669", bg: "#d1fae5" },
  system:      { icon: "shield",      color: "#d97706", bg: "#fef3c7" },
};

type Tab = "all" | "unread" | "dismissed";

// ─── Swipeable Row ───────────────────────────────────────────────────────────
function SwipeableRow({
  notif,
  onPress,
  onMute,
  onDismiss,
}: {
  notif: Notification;
  onPress: () => void;
  onMute: () => void;
  onDismiss: () => void;
}) {
  const meta = NOTIF_META[notif.type];
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(Math.max(g.dx, -ACTION_WIDTH));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESHOLD) {
          Animated.spring(translateX, { toValue: -ACTION_WIDTH, useNativeDriver: true }).start();
          setSwiped(true);
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          setSwiped(false);
        }
      },
    })
  ).current;

  function close() {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    setSwiped(false);
  }

  return (
    <View style={swStyles.wrap}>
      {/* Revealed actions behind */}
      <View style={swStyles.actions}>
        <TouchableOpacity
          style={[swStyles.actionBtn, { backgroundColor: "#f97316" }]}
          onPress={() => { close(); onMute(); }}
        >
          <Feather name="bell-off" size={18} color="#fff" />
          <Text style={swStyles.actionText}>Mute</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[swStyles.actionBtn, { backgroundColor: "#ef4444" }]}
          onPress={() => { close(); onDismiss(); }}
        >
          <Feather name="trash-2" size={18} color="#fff" />
          <Text style={swStyles.actionText}>Dismiss</Text>
        </TouchableOpacity>
      </View>

      {/* Sliding card */}
      <Animated.View
        style={[swStyles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.78}
          onPress={() => { if (swiped) { close(); } else { onPress(); } }}
          style={[
            swStyles.inner,
            !notif.read && { backgroundColor: "#eff6ff", borderColor: meta.color + "33" },
          ]}
        >
          {!notif.read && (
            <View style={[swStyles.stripe, { backgroundColor: meta.color }]} />
          )}

          <View style={[swStyles.iconWrap, { backgroundColor: meta.bg }]}>
            <Feather name={meta.icon as any} size={16} color={meta.color} />
          </View>

          <View style={swStyles.content}>
            <View style={swStyles.topRow}>
              <Text style={swStyles.category}>{notif.category}</Text>
              <Text style={swStyles.time}>{notif.time}</Text>
            </View>
            <Text style={[swStyles.body, !notif.read && { color: "#0f172a", fontWeight: "700" }]} numberOfLines={2}>
              {notif.body}
            </Text>
          </View>

          {/* Swipe hint */}
          <Feather name="chevron-left" size={13} color="#cbd5e1" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const swStyles = StyleSheet.create({
  wrap: { position: "relative", marginBottom: 8, borderRadius: 16, overflow: "hidden" },
  actions: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    width: ACTION_WIDTH,
  },
  actionBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  card: { zIndex: 1 },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  stripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginLeft: 3,
  },
  content: { flex: 1, gap: 3 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  time: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  body: { fontSize: 13, color: "#334155", lineHeight: 18 },
});

// ─── Main Sheet ───────────────────────────────────────────────────────────────
type Props = { visible: boolean; onClose: () => void };

export default function NotificationsSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFS);
  const [tab, setTab] = useState<Tab>("all");
  const [selected, setSelected] = useState<Notification | null>(null);
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const active = notifications.filter(n => n.status === "active");
  const unread = active.filter(n => !n.read);
  const dismissed = notifications.filter(n => n.status === "dismissed");

  const displayed =
    tab === "all" ? active :
    tab === "unread" ? unread :
    dismissed;

  const unreadCount = unread.length;

  function markAllRead() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function muteNotif(id: string) {
    Haptics.selectionAsync();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "muted" as NotifStatus } : n));
  }

  function dismissNotif(id: string) {
    Haptics.selectionAsync();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "dismissed" as NotifStatus, read: true } : n));
  }

  function openDetail(notif: Notification) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setSelected({ ...notif, read: true });
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "dismissed", label: "Dismissed" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Blur / dim backdrop */}
      {isIOS ? (
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
          <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFill} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.backdrop,
            isWeb && ({ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" } as any),
          ]}
          activeOpacity={1}
          onPress={onClose}
        />
      )}

      {/* Sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheen} />
        <View style={styles.handle} />

        {selected ? (
          /* ── Detail View ─────────────────────────────── */
          <View style={styles.detailView}>
            {/* Detail header */}
            <View style={styles.detailHeader}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setSelected(null)}
              >
                <Feather name="arrow-left" size={18} color="#334155" />
              </TouchableOpacity>
              <Text style={styles.detailHeaderTitle}>Notification</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Feather name="x" size={15} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Scrollable detail content */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Detail card */}
              <View style={[styles.detailCard, { borderColor: NOTIF_META[selected.type].color + "33" }]}>
                <View style={styles.detailCardTop}>
                  <View style={[styles.detailIconBig, { backgroundColor: NOTIF_META[selected.type].bg }]}>
                    <Feather name={NOTIF_META[selected.type].icon as any} size={26} color={NOTIF_META[selected.type].color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailCategory, { color: NOTIF_META[selected.type].color }]}>
                      {selected.category}
                    </Text>
                    <Text style={styles.detailTime}>{selected.time}</Text>
                  </View>
                </View>
                <Text style={styles.detailTitle}>{selected.title}</Text>
                <Text style={styles.detailBody}>{selected.detail}</Text>
              </View>
            </ScrollView>

            {/* Mute / Dismiss actions — pinned at bottom */}
            <View style={[styles.detailActions, { paddingTop: 12, paddingHorizontal: 2, paddingBottom: 8 }]}>
              <TouchableOpacity
                style={styles.muteBtn}
                onPress={() => { muteNotif(selected.id); setSelected(null); }}
                activeOpacity={0.8}
              >
                <Feather name="bell-off" size={16} color="#f97316" />
                <Text style={styles.muteBtnText}>Mute</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => { dismissNotif(selected.id); setSelected(null); }}
                activeOpacity={0.8}
              >
                <Feather name="trash-2" size={16} color="#ef4444" />
                <Text style={styles.dismissBtnText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewBtn, { backgroundColor: NOTIF_META[selected.type].color }]}
                onPress={() => setSelected(null)}
                activeOpacity={0.85}
              >
                <Text style={styles.viewBtnText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ── List View ───────────────────────────────── */
          <>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllRead}>
                    <Text style={styles.unreadLabel}>{unreadCount} unread · Mark all read</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.headerRight}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllRead} style={styles.checkBtn}>
                    <Feather name="check-circle" size={18} color="#2563EB" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Feather name="x" size={15} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              {TABS.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tab, tab === t.key && styles.tabActive]}
                  onPress={() => { Haptics.selectionAsync(); setTab(t.key); }}
                >
                  <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                    {t.label}{t.count ? ` (${t.count})` : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Swipe hint */}
            {tab !== "dismissed" && displayed.length > 0 && (
              <View style={styles.swipeHint}>
                <Feather name="chevrons-left" size={12} color="#94a3b8" />
                <Text style={styles.swipeHintText}>Swipe left for Mute / Dismiss</Text>
              </View>
            )}

            {/* List */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
              {displayed.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Feather name="bell-off" size={24} color="#94a3b8" />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {tab === "dismissed" ? "No dismissed notifications" : "All caught up!"}
                  </Text>
                  <Text style={styles.emptyBody}>
                    {tab === "unread" ? "No unread alerts right now." : "Nothing here yet."}
                  </Text>
                </View>
              ) : (
                displayed.map(notif =>
                  tab === "dismissed" ? (
                    /* Dismissed — simple non-swipeable row */
                    <TouchableOpacity
                      key={notif.id}
                      style={styles.dismissedRow}
                      onPress={() => openDetail(notif)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.dismissedIcon, { backgroundColor: NOTIF_META[notif.type].bg }]}>
                        <Feather name={NOTIF_META[notif.type].icon as any} size={14} color={NOTIF_META[notif.type].color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dismissedCategory}>{notif.category}</Text>
                        <Text style={styles.dismissedBody} numberOfLines={1}>{notif.body}</Text>
                      </View>
                      <Text style={styles.dismissedTime}>{notif.time}</Text>
                    </TouchableOpacity>
                  ) : (
                    <SwipeableRow
                      key={notif.id}
                      notif={notif}
                      onPress={() => openDetail(notif)}
                      onMute={() => muteNotif(notif.id)}
                      onDismiss={() => dismissNotif(notif.id)}
                    />
                  )
                )
              )}
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,8,23,0.58)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "86%",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 10,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.18, shadowRadius: 28 },
      android: { elevation: 28 },
    }),
  },
  sheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginBottom: 16,
  },

  // List header
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.6,
  },
  unreadLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
    marginTop: 3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  checkBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 8,
    gap: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginBottom: -1,
  },
  tabActive: {
    borderBottomColor: "#2563EB",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
  },
  tabTextActive: {
    color: "#2563EB",
  },

  // Swipe hint
  swipeHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  swipeHintText: {
    fontSize: 11,
    color: "#94a3b8",
    fontStyle: "italic",
  },

  // Empty
  emptyState: { paddingVertical: 40, alignItems: "center", gap: 8 },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#f1f5f9",
    justifyContent: "center", alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#334155" },
  emptyBody: { fontSize: 13, color: "#94a3b8" },

  // Dismissed row
  dismissedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    opacity: 0.6,
  },
  dismissedIcon: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: "center", alignItems: "center",
  },
  dismissedCategory: {
    fontSize: 10, fontWeight: "700", color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: 0.4,
  },
  dismissedBody: { fontSize: 12, color: "#64748b" },
  dismissedTime: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },

  // ── Detail View ──
  detailView: { flex: 1, display: "flex", flexDirection: "column" },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#f1f5f9",
    justifyContent: "center", alignItems: "center",
    marginRight: 12,
  },
  detailHeaderTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },
  detailCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 10,
  },
  detailCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  detailIconBig: {
    width: 54, height: 54, borderRadius: 27,
    justifyContent: "center", alignItems: "center",
  },
  detailCategory: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  detailTime: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.4,
  },
  detailBody: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
  },

  detailActions: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 2,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  muteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#fff7ed",
    borderWidth: 1.5,
    borderColor: "#fed7aa",
  },
  muteBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f97316",
  },
  dismissBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#fef2f2",
    borderWidth: 1.5,
    borderColor: "#fecaca",
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ef4444",
  },
  viewBtn: {
    flex: 1.4,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 14,
  },
  viewBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});

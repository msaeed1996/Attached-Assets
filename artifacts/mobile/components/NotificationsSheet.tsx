import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

type NotifType = "job" | "application" | "reminder" | "payment" | "system";

type Notification = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  detail: string;
  time: string;
  read: boolean;
  route?: string;
};

const INITIAL_NOTIFS: Notification[] = [
  {
    id: "n1",
    type: "job",
    title: "High Priority Gig",
    body: "Breakfast Cook ($28/hr) is open for you.",
    detail: "A new high-priority shift has been posted that matches your profile. Breakfast Cook at Metro Kitchen — $28/hr, starts tomorrow at 6am. Tap below to view and apply before it fills up.",
    time: "2m ago",
    read: false,
    route: "/(tabs)/jobs",
  },
  {
    id: "n2",
    type: "payment",
    title: "Payment Processed",
    body: "$180.00 deposited for Shift #40460.",
    detail: "Your payment of $180.00 for Shift #40460 (Warehouse Associate, Apr 3) has been successfully processed and deposited to your account. Funds typically arrive within 1–2 business days.",
    time: "1h ago",
    read: false,
  },
  {
    id: "n3",
    type: "reminder",
    title: "Shift Reminder",
    body: "Check-in for #40474 starts in 30 mins.",
    detail: "Your upcoming shift #40474 at LogiCo Warehouse begins in 30 minutes. Please arrive on time and check in via the app. Location: 220 Industrial Blvd, Unit 4.",
    time: "3h ago",
    read: false,
  },
  {
    id: "n4",
    type: "application",
    title: "Application Accepted",
    body: "Your application for Warehouse Associate at LogiCo has been accepted.",
    detail: "Congratulations! LogiCo has accepted your application for the Warehouse Associate position. Report to the front desk on your first day. Start date: April 8. Pay: $19/hr.",
    time: "5h ago",
    read: true,
    route: "/(tabs)/jobs",
  },
  {
    id: "n5",
    type: "job",
    title: "New Job Near You",
    body: "Event Staff needed at Downtown Convention Center — $22/hr.",
    detail: "TechEvent Inc. is looking for Event Staff at the Downtown Convention Center this weekend. $22/hr, flexible hours. Previous experience preferred but not required.",
    time: "Yesterday",
    read: true,
    route: "/(tabs)/jobs",
  },
  {
    id: "n6",
    type: "system",
    title: "Profile Verified",
    body: "Your identity has been verified. You now appear in employer searches.",
    detail: "Your profile verification is complete. Your name, ID, and work eligibility have been confirmed. Employers can now find and invite you directly. Keep your availability up to date for best results.",
    time: "2 days ago",
    read: true,
  },
];

const NOTIF_META: Record<NotifType, { icon: string; color: string; bg: string; gradientColor: string }> = {
  job:         { icon: "zap",         color: "#2563EB", bg: "#dbeafe", gradientColor: "#eff6ff" },
  application: { icon: "file-text",   color: "#10b981", bg: "#d1fae5", gradientColor: "#f0fdf4" },
  reminder:    { icon: "clock",       color: "#64748b", bg: "#f1f5f9", gradientColor: "#f8fafc" },
  payment:     { icon: "credit-card", color: "#059669", bg: "#d1fae5", gradientColor: "#f0fdf4" },
  system:      { icon: "shield",      color: "#d97706", bg: "#fef3c7", gradientColor: "#fffbeb" },
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function NotificationsSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFS);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selected, setSelected] = useState<Notification | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayed = filter === "unread" ? notifications.filter(n => !n.read) : notifications;

  function markOneRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function markAllRead() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function openDetail(notif: Notification) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markOneRead(notif.id);
    setSelected(notif);
  }

  function deleteNotif(id: string) {
    Haptics.selectionAsync();
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        {/* Blur backdrop */}
        {isIOS ? (
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.backdropFallback,
              isWeb && ({ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" } as any),
            ]}
            activeOpacity={1}
            onPress={onClose}
          />
        )}

        {/* Glossy sheet */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          {/* Glossy top sheen */}
          <View style={styles.sheen} />

          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Activity</Text>
              {unreadCount > 0 ? (
                <Text style={styles.unreadSubtitle}>
                  {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}
                </Text>
              ) : (
                <Text style={styles.allReadSubtitle}>All caught up ✓</Text>
              )}
            </View>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead} activeOpacity={0.75}>
                  <Feather name="check-circle" size={12} color="#2563EB" />
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <Feather name="x" size={15} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter tabs */}
          <View style={styles.filterRow}>
            {(["all", "unread"] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, filter === tab && styles.filterTabActive]}
                onPress={() => { Haptics.selectionAsync(); setFilter(tab); }}
              >
                <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
                  {tab === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* List */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {displayed.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Feather name="bell-off" size={24} color="#94a3b8" />
                </View>
                <Text style={styles.emptyTitle}>No notifications</Text>
                <Text style={styles.emptyBody}>
                  {filter === "unread" ? "No unread alerts right now." : "You're all caught up!"}
                </Text>
              </View>
            ) : (
              displayed.map(notif => {
                const meta = NOTIF_META[notif.type];
                return (
                  <TouchableOpacity
                    key={notif.id}
                    style={[styles.notifCard, !notif.read && { backgroundColor: meta.gradientColor, borderColor: meta.color + "33" }]}
                    onPress={() => openDetail(notif)}
                    activeOpacity={0.78}
                  >
                    {!notif.read && <View style={[styles.unreadStripe, { backgroundColor: meta.color }]} />}

                    <View style={[styles.notifIcon, { backgroundColor: meta.bg }]}>
                      <Feather name={meta.icon as any} size={17} color={meta.color} />
                    </View>

                    <View style={styles.notifContent}>
                      <View style={styles.notifTopRow}>
                        <Text style={[styles.notifTitle, !notif.read && { fontWeight: "800", color: "#0f172a" }]} numberOfLines={1}>
                          {notif.title}
                        </Text>
                        <Text style={styles.notifTime}>{notif.time}</Text>
                      </View>
                      <Text style={styles.notifBody} numberOfLines={1}>{notif.body}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.dismissBtn}
                      onPress={() => deleteNotif(notif.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather name="x" size={12} color="#cbd5e1" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Notification detail popup */}
      {selected && (
        <Modal
          visible={!!selected}
          transparent
          animationType="fade"
          onRequestClose={() => setSelected(null)}
          statusBarTranslucent
        >
          <TouchableOpacity style={styles.detailOverlay} activeOpacity={1} onPress={() => setSelected(null)}>
            <TouchableOpacity style={styles.detailCard} activeOpacity={1}>
              {/* Glossy sheen */}
              <View style={styles.detailSheen} />

              {/* Icon + close */}
              <View style={styles.detailHeader}>
                <View style={[styles.detailIconWrap, { backgroundColor: NOTIF_META[selected.type].bg }]}>
                  <Feather name={NOTIF_META[selected.type].icon as any} size={24} color={NOTIF_META[selected.type].color} />
                </View>
                <TouchableOpacity style={styles.detailClose} onPress={() => setSelected(null)}>
                  <Feather name="x" size={15} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.detailTime}>{selected.time}</Text>
              <Text style={styles.detailTitle}>{selected.title}</Text>
              <Text style={styles.detailBody}>{selected.detail}</Text>

              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.detailDismissBtn}
                  onPress={() => { deleteNotif(selected.id); setSelected(null); }}
                >
                  <Text style={styles.detailDismissText}>Dismiss</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailPrimaryBtn, { backgroundColor: NOTIF_META[selected.type].color }]}
                  onPress={() => setSelected(null)}
                >
                  <Text style={styles.detailPrimaryText}>
                    {selected.route ? "View Details" : "Got it"}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdropFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,8,23,0.6)",
  },

  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: "84%",
    overflow: "hidden",
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
    height: 60,
    backgroundColor: "rgba(255,255,255,0.6)",
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

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.7,
  },
  unreadSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
    marginTop: 2,
  },
  allReadSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10b981",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  markAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  filterRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
    gap: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: "#fff",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  filterTabText: { fontSize: 13, fontWeight: "600", color: "#94a3b8" },
  filterTabTextActive: { color: "#0f172a" },

  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "#f8fafc",
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  unreadStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginLeft: 3,
  },
  notifContent: { flex: 1, gap: 2 },
  notifTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  notifTime: { fontSize: 10, color: "#94a3b8", fontWeight: "600", flexShrink: 0 },
  notifBody: { fontSize: 12, color: "#64748b", lineHeight: 16 },
  dismissBtn: { padding: 2, flexShrink: 0 },

  emptyState: { paddingVertical: 40, alignItems: "center", gap: 8 },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#334155" },
  emptyBody: { fontSize: 13, color: "#94a3b8" },

  // Detail popup
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,8,23,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  detailCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 28,
    padding: 24,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 32 },
      android: { elevation: 24 },
    }),
  },
  detailSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  detailIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  detailClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  detailTime: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  detailBody: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
    marginBottom: 24,
  },
  detailActions: {
    flexDirection: "row",
    gap: 10,
  },
  detailDismissBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  detailDismissText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  detailPrimaryBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  detailPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});

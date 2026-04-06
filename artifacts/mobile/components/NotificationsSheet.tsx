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
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

type NotifType = "job" | "application" | "reminder" | "payment" | "system";

type Notification = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
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
    time: "2m ago",
    read: false,
    route: "/(tabs)/jobs",
  },
  {
    id: "n2",
    type: "payment",
    title: "Payment Processed",
    body: "$180.00 deposited for Shift #40460.",
    time: "1h ago",
    read: false,
  },
  {
    id: "n3",
    type: "reminder",
    title: "Shift Reminder",
    body: "Check-in for #40474 starts in 30 mins.",
    time: "3h ago",
    read: false,
  },
  {
    id: "n4",
    type: "application",
    title: "Application Accepted",
    body: "Your application for Warehouse Associate at LogiCo has been accepted.",
    time: "5h ago",
    read: true,
    route: "/(tabs)/jobs",
  },
  {
    id: "n5",
    type: "job",
    title: "New Job Near You",
    body: "Event Staff needed at Downtown Convention Center — $22/hr.",
    time: "Yesterday",
    read: true,
    route: "/(tabs)/jobs",
  },
  {
    id: "n6",
    type: "system",
    title: "Profile Verified",
    body: "Your identity has been verified. You now appear in employer searches.",
    time: "2 days ago",
    read: true,
  },
];

const NOTIF_META: Record<NotifType, { icon: string; color: string; bg: string }> = {
  job:         { icon: "zap",          color: "#2563EB", bg: "#dbeafe" },
  application: { icon: "file-text",    color: "#10b981", bg: "#d1fae5" },
  reminder:    { icon: "clock",        color: "#64748b", bg: "#f1f5f9" },
  payment:     { icon: "credit-card",  color: "#059669", bg: "#d1fae5" },
  system:      { icon: "shield",       color: "#f59e0b", bg: "#fef3c7" },
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function NotificationsSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayed = filter === "unread" ? notifications.filter(n => !n.read) : notifications;

  function markOneRead(id: string) {
    Haptics.selectionAsync();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function markAllRead() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function handlePress(notif: Notification) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markOneRead(notif.id);
    if (notif.route) {
      onClose();
      setTimeout(() => router.push(notif.route as any), 300);
    }
  }

  function deleteNotif(id: string) {
    Haptics.selectionAsync();
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Blurred / dimmed backdrop */}
      {isIOS ? (
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.backdropFallback,
            isWeb && ({ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" } as any),
          ]}
          activeOpacity={1}
          onPress={onClose}
        />
      )}

      {/* Sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Activity</Text>
            {unreadCount > 0 ? (
              <TouchableOpacity onPress={markAllRead} style={styles.unreadPill}>
                <View style={styles.unreadDotSmall} />
                <Text style={styles.unreadLabel}>
                  {unreadCount} unread · Tap to clear all
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.allReadLabel}>All caught up!</Text>
            )}
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Feather name="x" size={16} color="#6b7280" />
          </TouchableOpacity>
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
        >
          {displayed.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Feather name="bell-off" size={26} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyBody}>
                {filter === "unread" ? "You have no unread alerts." : "You're all caught up!"}
              </Text>
            </View>
          ) : (
            displayed.map(notif => {
              const meta = NOTIF_META[notif.type];
              return (
                <TouchableOpacity
                  key={notif.id}
                  style={[
                    styles.notifCard,
                    !notif.read && styles.notifCardUnread,
                  ]}
                  onPress={() => handlePress(notif)}
                  activeOpacity={0.78}
                >
                  {/* Unread indicator stripe */}
                  {!notif.read && (
                    <View style={[styles.unreadStripe, { backgroundColor: meta.color }]} />
                  )}

                  {/* Icon */}
                  <View style={[styles.notifIcon, { backgroundColor: meta.bg }]}>
                    <Feather name={meta.icon as any} size={18} color={meta.color} />
                  </View>

                  {/* Content */}
                  <View style={styles.notifContent}>
                    <View style={styles.notifTopRow}>
                      <Text
                        style={[styles.notifTitle, { fontWeight: notif.read ? "600" : "800" }]}
                        numberOfLines={1}
                      >
                        {notif.title}
                      </Text>
                      <Text style={styles.notifTime}>{notif.time}</Text>
                    </View>
                    <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>

                    {/* Mark as read inline (only for unread) */}
                    {!notif.read && (
                      <TouchableOpacity
                        style={styles.markReadBtn}
                        onPress={() => markOneRead(notif.id)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Feather name="check" size={11} color="#2563EB" />
                        <Text style={styles.markReadText}>Mark as read</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Dismiss */}
                  <TouchableOpacity
                    style={styles.dismissBtn}
                    onPress={() => deleteNotif(notif.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="x" size={13} color="#cbd5e1" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Bottom action */}
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead} activeOpacity={0.8}>
            <Feather name="check-circle" size={16} color="#fff" />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "84%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: { elevation: 24 },
    }),
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginBottom: 18,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    gap: 6,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.8,
  },
  unreadPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unreadDotSmall: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#2563EB",
  },
  unreadLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.1,
  },
  allReadLabel: {
    fontSize: 13,
    color: "#10b981",
    fontWeight: "600",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  filterRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    gap: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: "#fff",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
  },
  filterTabTextActive: {
    color: "#0f172a",
  },

  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  notifCardUnread: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  unreadStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginLeft: 4,
  },
  notifContent: {
    flex: 1,
    gap: 3,
  },
  notifTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  notifTitle: {
    fontSize: 14,
    color: "#0f172a",
    flex: 1,
  },
  notifTime: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    flexShrink: 0,
  },
  notifBody: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  markReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  markReadText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  dismissBtn: {
    padding: 2,
    marginTop: 2,
    flexShrink: 0,
  },

  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
  },
  markAllText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  emptyState: {
    paddingVertical: 44,
    alignItems: "center",
    gap: 10,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#334155",
  },
  emptyBody: {
    fontSize: 13,
    color: "#94a3b8",
  },
});

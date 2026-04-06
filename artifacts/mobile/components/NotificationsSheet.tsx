import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Animated,
} from "react-native";
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
    time: "2M AGO",
    read: false,
    route: "/(tabs)/jobs",
  },
  {
    id: "n2",
    type: "payment",
    title: "Payment Processed",
    body: "$180.00 deposited for Shift #40460.",
    time: "1H AGO",
    read: false,
  },
  {
    id: "n3",
    type: "reminder",
    title: "Shift Reminder",
    body: "Check-in for #40474 starts in 30 mins.",
    time: "3H AGO",
    read: false,
  },
  {
    id: "n4",
    type: "application",
    title: "Application Accepted",
    body: "Your application for Warehouse Associate at LogiCo has been accepted.",
    time: "5H AGO",
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
  reminder:    { icon: "clock",        color: "#6b7280", bg: "#f3f4f6" },
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

  const unreadCount = notifications.filter(n => !n.read).length;

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function markAllRead() {
    Haptics.selectionAsync();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function handlePress(notif: Notification) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markRead(notif.id);
    onClose();
    if (notif.route) {
      setTimeout(() => router.push(notif.route as any), 300);
    }
  }

  function deleteNotif(id: string) {
    Haptics.selectionAsync();
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dimmed backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      {/* Sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Activity</Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllRead}>
                <Text style={styles.unreadLabel}>{unreadCount} UNREAD ALERT{unreadCount !== 1 ? "S" : ""}</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Feather name="x" size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Notifications list */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="bell-off" size={28} color="#9ca3af" />
              <Text style={styles.emptyText}>You're all caught up!</Text>
            </View>
          ) : (
            notifications.map(notif => {
              const meta = NOTIF_META[notif.type];
              return (
                <TouchableOpacity
                  key={notif.id}
                  style={[
                    styles.notifCard,
                    { borderLeftColor: notif.read ? "transparent" : meta.color, borderLeftWidth: notif.read ? 0 : 3 },
                  ]}
                  onPress={() => handlePress(notif)}
                  activeOpacity={0.8}
                >
                  {/* Icon */}
                  <View style={[styles.notifIcon, { backgroundColor: meta.bg }]}>
                    <Feather name={meta.icon as any} size={18} color={meta.color} />
                  </View>

                  {/* Content */}
                  <View style={styles.notifContent}>
                    <View style={styles.notifTopRow}>
                      <Text style={[styles.notifTitle, { fontWeight: notif.read ? "600" : "800" }]} numberOfLines={1}>
                        {notif.title}
                      </Text>
                      <Text style={styles.notifTime}>{notif.time}</Text>
                    </View>
                    <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
                  </View>

                  {/* Delete */}
                  <TouchableOpacity
                    onPress={() => deleteNotif(notif.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="x" size={13} color="#d1d5db" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "82%",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.6,
  },
  unreadLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },

  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 14,
    overflow: "hidden",
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
    gap: 3,
  },
  notifTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  notifTitle: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  notifTime: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
    flexShrink: 0,
  },
  notifBody: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },

  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
  },
});

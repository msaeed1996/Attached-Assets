import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

type NotifType = "job" | "application" | "message" | "system" | "payment";

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
    title: "New ASAP Job Near You",
    body: "Event Staff needed at Downtown Convention Center — $22/hr, starts today.",
    time: "2m ago",
    read: false,
    route: "/(tabs)/jobs",
  },
  {
    id: "n2",
    type: "application",
    title: "Application Accepted",
    body: "Congrats! Your application for Warehouse Associate at LogiCo has been accepted.",
    time: "1h ago",
    read: false,
    route: "/(tabs)/jobs",
  },
  {
    id: "n3",
    type: "job",
    title: "Job Invitation",
    body: "TechEvent Inc. has invited you to apply for their Event Crew position.",
    time: "3h ago",
    read: false,
    route: "/(tabs)/invitations",
  },
  {
    id: "n4",
    type: "payment",
    title: "Payment Received",
    body: "You've received $176.00 for your shift at Metro Kitchen on Apr 4.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "n5",
    type: "system",
    title: "Profile Verified",
    body: "Your identity has been verified. You now appear in employer searches.",
    time: "2 days ago",
    read: true,
  },
  {
    id: "n6",
    type: "application",
    title: "Application Viewed",
    body: "Bright Logistics viewed your application for Forklift Operator.",
    time: "2 days ago",
    read: true,
    route: "/(tabs)/jobs",
  },
  {
    id: "n7",
    type: "job",
    title: "New Jobs Matching Your Skills",
    body: "3 new jobs posted in your area match your profile — tap to browse.",
    time: "3 days ago",
    read: true,
    route: "/(tabs)/jobs",
  },
];

const NOTIF_META: Record<NotifType, { icon: string; color: string; bg: string }> = {
  job:         { icon: "briefcase",   color: "#2563EB", bg: "#dbeafe" },
  application: { icon: "file-text",   color: "#10b981", bg: "#d1fae5" },
  message:     { icon: "message-circle", color: "#8b5cf6", bg: "#ede9fe" },
  system:      { icon: "shield",      color: "#f59e0b", bg: "#fef3c7" },
  payment:     { icon: "dollar-sign", color: "#059669", bg: "#d1fae5" },
};

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFS);

  const unreadCount = notifications.filter(n => !n.read).length;

  function markRead(id: string) {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  function markAllRead() {
    Haptics.selectionAsync();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function handlePress(notif: Notification) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markRead(notif.id);
    if (notif.route) router.push(notif.route as any);
  }

  function deleteNotif(id: string) {
    Haptics.selectionAsync();
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  return (
    <View style={[styles.root, { backgroundColor: "#f0f4f8" }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: "#0759af" }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: "#dbeafe" }]}>
            <Feather name="bell-off" size={32} color="#2563EB" />
          </View>
          <Text style={[styles.emptyTitle, { color: "#111827" }]}>All caught up!</Text>
          <Text style={[styles.emptyBody, { color: "#6b7280" }]}>You have no notifications right now.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((notif) => {
            const meta = NOTIF_META[notif.type];
            return (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notifRow,
                  { backgroundColor: notif.read ? "#fff" : "#eff6ff", borderColor: notif.read ? "#e5e7eb" : "#bfdbfe" }
                ]}
                onPress={() => handlePress(notif)}
                activeOpacity={0.82}
              >
                {/* Unread indicator */}
                {!notif.read && <View style={styles.unreadDot} />}

                <View style={[styles.notifIcon, { backgroundColor: meta.bg }]}>
                  <Feather name={meta.icon as any} size={18} color={meta.color} />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.notifTitleRow}>
                    <Text style={[styles.notifTitle, { color: "#111827", fontWeight: notif.read ? "600" : "800" }]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    <Text style={[styles.notifTime, { color: "#9ca3af" }]}>{notif.time}</Text>
                  </View>
                  <Text style={[styles.notifBody, { color: "#6b7280" }]} numberOfLines={2}>
                    {notif.body}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteNotif(notif.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x" size={14} color="#9ca3af" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.4,
  },
  unreadBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  markAllBtn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  markAllText: {
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: "600",
  },

  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    position: "relative",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    left: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#2563EB",
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 3,
  },
  notifTitle: {
    fontSize: 14,
    flex: 1,
  },
  notifTime: {
    fontSize: 11,
    fontWeight: "500",
    flexShrink: 0,
  },
  notifBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  deleteBtn: {
    padding: 4,
    flexShrink: 0,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontSize: 14,
  },
});

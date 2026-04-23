import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

type NotifType = "match" | "application" | "payment" | "reminder" | "message";

type Notif = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  cta?: string;
  ctaPath?: string;
};

const ICONS: Record<NotifType, { icon: string; color: string; bg: string; label: string }> = {
  match: { icon: "zap", color: "#2563eb", bg: "#dbeafe", label: "Match" },
  application: { icon: "briefcase", color: "#7c3aed", bg: "#ede9fe", label: "Application" },
  payment: { icon: "dollar-sign", color: "#16a34a", bg: "#dcfce7", label: "Payment" },
  reminder: { icon: "clock", color: "#d97706", bg: "#fef3c7", label: "Reminder" },
  message: { icon: "message-circle", color: "#0891b2", bg: "#cffafe", label: "Message" },
};

const FILTERS: Array<{ key: "all" | NotifType; label: string }> = [
  { key: "all", label: "All" },
  { key: "match", label: "Matches" },
  { key: "application", label: "Applications" },
  { key: "payment", label: "Payments" },
  { key: "reminder", label: "Reminders" },
  { key: "message", label: "Messages" },
];

const SEED: Notif[] = [
  {
    id: "n1",
    type: "match",
    title: "New gig match: Bartender",
    body: "Moody Theater is hiring a bartender Saturday 6pm — $35/hr + tips. Matches your skills.",
    time: "2m ago",
    read: false,
    cta: "View Gig",
  },
  {
    id: "n2",
    type: "payment",
    title: "Payment of $138.00 sent",
    body: "Your earnings from Hilton Austin (Banquet Server, 6h) were sent via Direct Deposit.",
    time: "1h ago",
    read: false,
    cta: "View Earnings",
    ctaPath: "/earnings",
  },
  {
    id: "n3",
    type: "application",
    title: "Application accepted",
    body: "Whole Foods accepted your application for Cashier on Friday at 2pm.",
    time: "3h ago",
    read: false,
    cta: "See Details",
  },
  {
    id: "n4",
    type: "reminder",
    title: "Shift starts in 1 hour",
    body: "Forklift Operator at Amazon DFW7 starts at 9:00 AM. Don't forget to clock in.",
    time: "5h ago",
    read: true,
  },
  {
    id: "n5",
    type: "message",
    title: "Hilton Austin sent you a message",
    body: "Thanks for the great service last night — we'd love to have you back next weekend.",
    time: "Yesterday",
    read: true,
    cta: "Reply",
  },
  {
    id: "n6",
    type: "match",
    title: "3 new gigs near you",
    body: "Catering Server, Stock Associate, and Event Setup Crew opportunities posted today.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "n7",
    type: "payment",
    title: "Tip received: $24.00",
    body: "Moody Theater added a tip from your bartender shift on Apr 17.",
    time: "2d ago",
    read: true,
  },
  {
    id: "n8",
    type: "application",
    title: "New review on your profile",
    body: "Fairmont Austin gave you a 5-star rating: \"Punctual, friendly, and professional.\"",
    time: "3d ago",
    read: true,
  },
  {
    id: "n9",
    type: "reminder",
    title: "Add a payment method",
    body: "Set up Direct Deposit so you can get paid as soon as your shifts complete.",
    time: "5d ago",
    read: true,
    cta: "Set Up",
    ctaPath: "/payment-methods",
  },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === "ios" ? 50 : 24);

  const [items, setItems] = useState<Notif[]>(SEED);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((n) => n.type === filter)),
    [items, filter]
  );
  const unreadCount = items.filter((n) => !n.read).length;

  function markAllRead() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function tapItem(n: Notif) {
    Haptics.selectionAsync();
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    if (n.ctaPath) router.push(n.ctaPath as any);
  }

  function clearAll() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems([]);
  }

  function pickFilter(k: (typeof FILTERS)[number]["key"]) {
    Haptics.selectionAsync();
    setFilter(k);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={markAllRead}
          style={styles.headerAction}
          activeOpacity={0.7}
          disabled={unreadCount === 0}
        >
          <Feather name="check-circle" size={18} color={unreadCount === 0 ? "#94a3b8" : "#fff"} />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count = f.key === "all" ? items.length : items.filter((n) => n.type === f.key).length;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => pickFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {f.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.countPill, active && styles.countPillActive]}>
                    <Text style={[styles.countText, active && styles.countTextActive]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="bell-off" size={26} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptyBody}>
              {items.length === 0
                ? "No notifications yet. We'll let you know when there's something new."
                : "No notifications in this category."}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {filtered.map((n) => {
              const meta = ICONS[n.type];
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.card, !n.read && styles.cardUnread]}
                  onPress={() => tapItem(n)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.iconBubble, { backgroundColor: meta.bg }]}>
                    <Feather name={meta.icon as any} size={15} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, !n.read && styles.cardTitleUnread]} numberOfLines={1}>
                        {n.title}
                      </Text>
                      {!n.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.cardBody} numberOfLines={2}>
                      {n.body}
                    </Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardTime}>{n.time}</Text>
                      {n.cta && (
                        <View style={styles.ctaPill}>
                          <Text style={styles.ctaText}>{n.cta}</Text>
                          <Feather name="arrow-right" size={11} color="#2563eb" />
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {items.length > 0 && (
              <TouchableOpacity onPress={clearAll} style={styles.clearBtn} activeOpacity={0.7}>
                <Feather name="trash-2" size={13} color="#ef4444" />
                <Text style={styles.clearBtnText}>Clear all notifications</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0759af",
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerAction: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.2 },
  headerSub: { fontSize: 11, color: "#bfdbfe", fontWeight: "600", marginTop: 1 },

  filterBar: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingVertical: 10 },
  chipRow: { gap: 6, paddingHorizontal: 16 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#0759af", borderColor: "#0759af" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  chipTextActive: { color: "#fff" },
  countPill: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  countPillActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  countText: { fontSize: 10, fontWeight: "800", color: "#475569" },
  countTextActive: { color: "#fff" },

  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardUnread: { borderColor: "#bfdbfe", backgroundColor: "#f8fafc" },
  iconBubble: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1, fontSize: 13, fontWeight: "700", color: "#1f2937" },
  cardTitleUnread: { color: "#0f172a", fontWeight: "800" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563eb" },
  cardBody: { fontSize: 12, color: "#64748b", marginTop: 3, lineHeight: 17 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  cardTime: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  ctaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#eff6ff",
    borderRadius: 999,
  },
  ctaText: { fontSize: 11, fontWeight: "700", color: "#2563eb" },

  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    marginTop: 6,
  },
  clearBtnText: { fontSize: 12, fontWeight: "700", color: "#ef4444" },

  empty: { alignItems: "center", paddingTop: 70, paddingHorizontal: 32, gap: 10 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: "#111827", marginTop: 4 },
  emptyBody: { fontSize: 12, color: "#64748b", textAlign: "center", lineHeight: 18 },
});

import React, { useState } from "react";
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
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

type InvitationStatus = "pending" | "accepted" | "no_show" | "rejected" | "history";

interface Invitation {
  id: string;
  jobTitle: string;
  company: string;
  companyRating: number;
  location: string;
  pay: number;
  payType: "hourly" | "daily" | "fixed";
  startDate: string;
  duration: string;
  message: string;
  sentAt: string;
  status: InvitationStatus;
  urgent: boolean;
  jobId: string;
}

const SAMPLE_INVITATIONS: Invitation[] = [
  {
    id: "inv-1",
    jobTitle: "Warehouse Supervisor",
    company: "Amazon Logistics",
    companyRating: 4.2,
    location: "Austin, TX",
    pay: 28,
    payType: "hourly",
    startDate: "Tomorrow",
    duration: "1 week",
    message: "We reviewed your profile and think you'd be a great fit for this role. Your previous warehouse experience stands out!",
    sentAt: "30 min ago",
    status: "pending",
    urgent: true,
    jobId: "1",
  },
  {
    id: "inv-2",
    jobTitle: "Event Coordinator",
    company: "Prestige Events Co.",
    companyRating: 4.7,
    location: "Houston, TX",
    pay: 280,
    payType: "daily",
    startDate: "Saturday",
    duration: "2 days",
    message: "Hi! We're looking for reliable staff for an upcoming gala. Your hospitality background is exactly what we need.",
    sentAt: "2 hours ago",
    status: "pending",
    urgent: false,
    jobId: "2",
  },
  {
    id: "inv-3",
    jobTitle: "Retail Floor Lead",
    company: "Nordstrom Rack",
    companyRating: 4.4,
    location: "Dallas, TX",
    pay: 19,
    payType: "hourly",
    startDate: "Monday",
    duration: "3 days",
    message: "Your retail experience makes you an ideal candidate. We'd love to have you on the team for our upcoming sale event.",
    sentAt: "Yesterday",
    status: "accepted",
    urgent: false,
    jobId: "5",
  },
  {
    id: "inv-5",
    jobTitle: "Forklift Operator",
    company: "DHL Supply Chain",
    companyRating: 3.9,
    location: "San Antonio, TX",
    pay: 22,
    payType: "hourly",
    startDate: "Mar 28",
    duration: "3 days",
    message: "We need experienced forklift operators for an urgent project.",
    sentAt: "3 days ago",
    status: "no_show",
    urgent: false,
    jobId: "6",
  },
  {
    id: "inv-6",
    jobTitle: "Security Guard",
    company: "SecureForce Inc.",
    companyRating: 4.1,
    location: "Dallas, TX",
    pay: 17,
    payType: "hourly",
    startDate: "Apr 1",
    duration: "1 week",
    message: "Looking for a dependable security officer for our client site.",
    sentAt: "4 days ago",
    status: "rejected",
    urgent: false,
    jobId: "7",
  },
  {
    id: "inv-7",
    jobTitle: "Office Admin Assistant",
    company: "MetaLaw LLP",
    companyRating: 4.5,
    location: "Austin, TX",
    pay: 18,
    payType: "hourly",
    startDate: "Mar 10",
    duration: "2 weeks",
    message: "We came across your profile and believe your admin skills match our requirements perfectly.",
    sentAt: "3 weeks ago",
    status: "history",
    urgent: false,
    jobId: "3",
  },
];

const FILTER_TABS = ["All", "Pending", "Accepted", "No Show Shift", "Rejected", "Job History"] as const;
type FilterTab = typeof FILTER_TABS[number];

const STATUS_MAP: Record<FilterTab, InvitationStatus | null> = {
  All: null,
  Pending: "pending",
  Accepted: "accepted",
  "No Show Shift": "no_show",
  Rejected: "rejected",
  "Job History": "history",
};

const TAB_CONFIG: Record<FilterTab, { color: string; bg: string; icon: string }> = {
  All: { color: "#6b7280", bg: "#f3f4f6", icon: "list" },
  Pending: { color: "#f59e0b", bg: "#fffbeb", icon: "clock" },
  Accepted: { color: "#10b981", bg: "#ecfdf5", icon: "check-circle" },
  "No Show Shift": { color: "#f97316", bg: "#fff7ed", icon: "alert-circle" },
  Rejected: { color: "#ef4444", bg: "#fef2f2", icon: "x-circle" },
  "Job History": { color: "#2563EB", bg: "#eff6ff", icon: "archive" },
};

export default function JobBoardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [invitations, setInvitations] = useState<Invitation[]>(SAMPLE_INVITATIONS);
  const [filter, setFilter] = useState<FilterTab>("All");

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const pendingCount = invitations.filter((i) => i.status === "pending").length;
  const statusKey = STATUS_MAP[filter];
  const filtered = statusKey === null ? invitations : invitations.filter((i) => i.status === statusKey);

  function handleAccept(id: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setInvitations((prev) =>
      prev.map((inv) => inv.id === id ? { ...inv, status: "accepted" } : inv)
    );
  }

  function handleDecline(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setInvitations((prev) =>
      prev.map((inv) => inv.id === id ? { ...inv, status: "rejected" } : inv)
    );
  }

  const cfg = TAB_CONFIG[filter];
  const cfgColor = cfg.color;
  const cfgBg = cfg.bg;
  const cfgIcon = cfg.icon;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Job Board</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {pendingCount > 0 ? `${pendingCount} pending response${pendingCount > 1 ? "s" : ""}` : "All caught up!"}
          </Text>
        </View>
        {pendingCount > 0 && (
          <View style={[styles.pendingBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>

      {/* Filter tabs — scrollable */}
      <View style={[styles.tabBarWrap, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {FILTER_TABS.map((tab) => {
            const active = filter === tab;
            const tabCfg = TAB_CONFIG[tab];
            const tabStatus = STATUS_MAP[tab];
            const count = tabStatus === null
              ? invitations.length
              : invitations.filter((i) => i.status === tabStatus).length;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, active && { borderBottomColor: tabCfg.color, borderBottomWidth: 2 }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(tab);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.tabInner}>
                  <Feather
                    name={tabCfg.icon as any}
                    size={12}
                    color={active ? tabCfg.color : colors.mutedForeground}
                  />
                  <Text style={[styles.tabLabel, { color: active ? tabCfg.color : colors.mutedForeground }]}>
                    {tab}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.tabBadge, { backgroundColor: active ? tabCfg.color : colors.muted }]}>
                      <Text style={[styles.tabBadgeText, { color: active ? "#fff" : colors.mutedForeground }]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: cfgBg }]}>
              <Feather name={cfgIcon as any} size={32} color={cfgColor} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No {filter === "All" ? "invitations" : filter.toLowerCase()}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {filter === "Pending"
                ? "No pending invitations. Set your availability to get discovered."
                : `No ${filter.toLowerCase()} records yet.`}
            </Text>
          </View>
        ) : (
          filtered.map((inv) => (
            <InvitationCard
              key={inv.id}
              invitation={inv}
              colors={colors}
              onAccept={() => handleAccept(inv.id)}
              onDecline={() => handleDecline(inv.id)}
              onView={() => router.push(`/job/${inv.jobId}` as any)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function InvitationCard({
  invitation: inv,
  colors,
  onAccept,
  onDecline,
  onView,
}: {
  invitation: Invitation;
  colors: any;
  onAccept: () => void;
  onDecline: () => void;
  onView: () => void;
}) {
  const statusConfig = {
    pending: { color: "#f59e0b", bg: "#fffbeb", label: "Pending", icon: "clock" },
    accepted: { color: "#10b981", bg: "#ecfdf5", label: "Accepted", icon: "check-circle" },
    declined: { color: "#ef4444", bg: "#fef2f2", label: "Declined", icon: "x-circle" },
  }[inv.status];

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.card,
        borderColor: inv.status === "pending" && inv.urgent ? colors.primary : colors.border,
        borderWidth: inv.status === "pending" && inv.urgent ? 1.5 : 1,
      }
    ]}>
      {inv.urgent && inv.status === "pending" && (
        <View style={styles.urgentBanner}>
          <Feather name="zap" size={11} color="#fff" />
          <Text style={styles.urgentBannerText}>URGENT — Respond Soon</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <View style={[styles.companyAvatar, { backgroundColor: "#dbeafe" }]}>
          <Feather name="briefcase" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardJobTitle, { color: colors.foreground }]} numberOfLines={1}>
            {inv.jobTitle}
          </Text>
          <View style={styles.cardCompanyRow}>
            <Text style={[styles.cardCompany, { color: colors.mutedForeground }]}>{inv.company}</Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={10} color="#f59e0b" />
              <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>{inv.companyRating}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
          <Feather name={statusConfig.icon as any} size={11} color={statusConfig.color} />
          <Text style={[styles.statusPillText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>
      </View>

      <View style={[styles.detailsRow, { borderColor: colors.border }]}>
        <DetailItem icon="map-pin" label={inv.location} colors={colors} />
        <DetailItem icon="dollar-sign" label={`$${inv.pay}/${inv.payType}`} colors={colors} />
        <DetailItem icon="calendar" label={inv.startDate} colors={colors} />
        <DetailItem icon="clock" label={inv.duration} colors={colors} />
      </View>

      <View style={[styles.messageBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="message-square" size={12} color={colors.mutedForeground} />
        <Text style={[styles.messageText, { color: colors.foreground }]} numberOfLines={2}>
          {inv.message}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={[styles.sentAt, { color: colors.mutedForeground }]}>Sent {inv.sentAt}</Text>
        <TouchableOpacity onPress={onView}>
          <Text style={[styles.viewJobText, { color: colors.primary }]}>View job</Text>
        </TouchableOpacity>
      </View>

      {inv.status === "pending" && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.declineBtn, { borderColor: colors.border }]}
            onPress={onDecline}
            activeOpacity={0.8}
          >
            <Feather name="x" size={15} color={colors.mutedForeground} />
            <Text style={[styles.declineBtnText, { color: colors.mutedForeground }]}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
            onPress={onAccept}
            activeOpacity={0.85}
          >
            <Feather name="check" size={15} color="#fff" />
            <Text style={styles.acceptBtnText}>Accept Invitation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function DetailItem({ icon, label, colors }: { icon: string; label: string; colors: any }) {
  return (
    <View style={styles.detailItem}>
      <Feather name={icon as any} size={11} color={colors.mutedForeground} />
      <Text style={[styles.detailText, { color: colors.mutedForeground }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 1,
  },
  pendingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  pendingBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  tabBarWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBarContent: {
    paddingHorizontal: 12,
    gap: 4,
  },
  tab: {
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabBadge: {
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  card: {
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  urgentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  urgentBannerText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    paddingBottom: 10,
  },
  companyAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardJobTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  cardCompanyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardCompany: { fontSize: 12 },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    fontWeight: "500",
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 14,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  messageText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sentAt: { fontSize: 11 },
  viewJobText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  declineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  acceptBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});

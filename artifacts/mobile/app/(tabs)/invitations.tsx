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
import { SAMPLE_INVITATIONS, Invitation } from "@/data/invitations";

export default function InvitationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [invitations, setInvitations] = useState<Invitation[]>(SAMPLE_INVITATIONS);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const pendingCount = invitations.filter((i) => i.status === "pending").length;

  const filtered = invitations;

  function handleAccept(id: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setInvitations((prev) =>
      prev.map((inv) => inv.id === id ? { ...inv, status: "accepted" } : inv)
    );
  }

  function handleDecline(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setInvitations((prev) =>
      prev.map((inv) => inv.id === id ? { ...inv, status: "declined" } : inv)
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Blue hero header */}
      <View style={[styles.hero, { paddingTop: topPadding + 16 }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Job Invitations</Text>
            <Text style={styles.headerSub}>
              {pendingCount > 0 ? `${pendingCount} pending response${pendingCount > 1 ? "s" : ""}` : "All caught up!"}
            </Text>
          </View>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather name="mail" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No invitations here</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No invitations yet. Set your availability to get discovered.
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
              onView={() => router.push(`/invitation/${inv.id}` as any)}
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
      {/* Urgent badge */}
      {inv.urgent && inv.status === "pending" && (
        <View style={styles.urgentBanner}>
          <Feather name="zap" size={11} color="#fff" />
          <Text style={styles.urgentBannerText}>URGENT — Respond Soon</Text>
        </View>
      )}

      {/* Card header */}
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

      {/* Job details */}
      <View style={[styles.detailsRow, { borderColor: colors.border }]}>
        <DetailItem icon="map-pin" label={inv.location} colors={colors} />
        <DetailItem icon="dollar-sign" label={`$${inv.pay}/${inv.payType}`} colors={colors} />
        <DetailItem icon="calendar" label={inv.startDate} colors={colors} />
        <DetailItem icon="clock" label={inv.duration} colors={colors} />
      </View>

      {/* Message */}
      <View style={[styles.messageBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="message-square" size={12} color={colors.mutedForeground} />
        <Text style={[styles.messageText, { color: colors.foreground }]} numberOfLines={2}>
          {inv.message}
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={[styles.sentAt, { color: colors.mutedForeground }]}>
          Sent {inv.sentAt}
        </Text>
        <TouchableOpacity onPress={onView}>
          <Text style={[styles.viewJobText, { color: colors.primary }]}>View job</Text>
        </TouchableOpacity>
      </View>

      {/* Action buttons (only for pending) */}
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
  hero: {
    backgroundColor: "#0759af",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#fff",
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
    color: "rgba(255,255,255,0.6)",
  },
  pendingBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  pendingBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: "#fff",
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
  cardCompany: {
    fontSize: 12,
  },
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
  sentAt: {
    fontSize: 11,
  },
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

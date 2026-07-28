import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { SAMPLE_INVITATIONS, InvitationStatus, ScheduleDay } from "@/data/invitations";

export default function InvitationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const base = SAMPLE_INVITATIONS.find((i) => i.id === id);
  const [status, setStatus] = useState<InvitationStatus>(base?.status ?? "pending");

  if (!base) {
    return (
      <View style={styles.notFound}>
        <Text style={{ color: "#111827", fontSize: 16 }}>Invitation not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: "#2563eb", fontWeight: "700" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const inv = base;

  function accept() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStatus("accepted");
    Alert.alert("Invitation Accepted", "Great! The employer has been notified.");
  }

  function decline() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Decline this invitation?", "You can still view it later in your inbox.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setStatus("declined");
        },
      },
    ]);
  }

  function getDirections() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const q = encodeURIComponent(inv.location);
    Linking.openURL(`https://maps.google.com/?q=${q}`).catch(() => {});
  }

  function messageEmployer() {
    Haptics.selectionAsync();
    router.push("/(tabs)/messages");
  }

  const payLabel =
    inv.payType === "hourly"
      ? `$${inv.pay} / hr`
      : inv.payType === "daily"
        ? `$${inv.pay} / day`
        : `$${inv.pay} flat`;

  const statusConfig = {
    pending: { color: "#f59e0b", bg: "#fffbeb", label: "Pending Response", icon: "clock" },
    accepted: { color: "#10b981", bg: "#ecfdf5", label: "Accepted", icon: "check-circle" },
    declined: { color: "#ef4444", bg: "#fef2f2", label: "Declined", icon: "x-circle" },
  }[status];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#2563eb", "#1d4ed8"]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Invitation</Text>
        <View style={styles.headerBtn} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: status === "pending" ? insets.bottom + 110 : insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgent banner */}
        {inv.urgent && status === "pending" && (
          <View style={styles.urgentBanner}>
            <Feather name="zap" size={13} color="#fff" />
            <Text style={styles.urgentBannerText}>
              URGENT — {inv.responseDeadline ?? "Respond Soon"}
            </Text>
          </View>
        )}

        {/* Status pill */}
        <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
          <Feather name={statusConfig.icon as any} size={13} color={statusConfig.color} />
          <Text style={[styles.statusPillText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        {/* Summary card */}
        <View style={styles.card}>
          <View style={styles.summaryTop}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.jobTitle}>{inv.jobTitle}</Text>
              <View style={styles.companyRow}>
                <Feather name="briefcase" size={13} color="#2563eb" />
                <Text style={styles.companyText}>{inv.company}</Text>
                <View style={styles.ratingRow}>
                  <Feather name="star" size={11} color="#f59e0b" />
                  <Text style={styles.ratingText}>{inv.companyRating}</Text>
                </View>
              </View>
            </View>
            <View style={styles.payCol}>
              <View style={styles.payBadge}>
                <Text style={styles.payAmount}>{payLabel}</Text>
              </View>
              <Text style={styles.payRate}>{inv.type.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.summaryRows}>
            {/* Date row — start & end side by side */}
            <View style={styles.dateGrid}>
              <View style={styles.dateCell}>
                <View style={[styles.iconBox, { backgroundColor: "#EFF6FF" }]}>
                  <Feather name="calendar" size={15} color="#2563eb" />
                </View>
                <Text style={styles.fieldLabel}>START DATE</Text>
                <Text style={styles.fieldValue}>{inv.startDate}</Text>
              </View>
              {inv.endDate && (
                <>
                  <View style={styles.dateDivider} />
                  <View style={styles.dateCell}>
                    <View style={[styles.iconBox, { backgroundColor: "#F0FDF4" }]}>
                      <Feather name="calendar" size={15} color="#16a34a" />
                    </View>
                    <Text style={styles.fieldLabel}>END DATE</Text>
                    <Text style={styles.fieldValue}>{inv.endDate}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Job Timing */}
            {inv.schedule && inv.schedule.length > 0 && (
              <View style={styles.timingRow}>
                <View style={[styles.iconBox, { backgroundColor: "#FEF3C7" }]}>
                  <Feather name="clock" size={15} color="#d97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>JOB TIMING</Text>
                  <Text style={styles.fieldValue}>
                    {inv.schedule[0].startTime} – {inv.schedule[0].endTime}
                  </Text>
                </View>
                <View style={styles.timingBadge}>
                  <Text style={styles.timingBadgeText}>{inv.duration}</Text>
                </View>
              </View>
            )}

            {/* Location */}
            <View style={styles.locationRow}>
              <View style={[styles.iconBox, { backgroundColor: "#FEF2F2" }]}>
                <Feather name="map-pin" size={15} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>LOCATION</Text>
                <Text style={styles.fieldValue}>{inv.location}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={getDirections}
            activeOpacity={0.85}
          >
            <Feather name="navigation" size={15} color="#2563eb" />
            <Text style={styles.directionsText}>Get Directions</Text>
          </TouchableOpacity>
        </View>

        {/* About the role */}
        {inv.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About the Role</Text>
            <Text style={styles.bodyText}>{inv.description}</Text>
          </View>
        )}

        {/* Responsibilities */}
        {inv.responsibilities && inv.responsibilities.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Responsibilities</Text>
            <View style={{ gap: 8 }}>
              {inv.responsibilities.map((r, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Feather name="check" size={14} color="#10b981" />
                  <Text style={styles.bulletText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Requirements */}
        {inv.requirements && inv.requirements.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Requirements</Text>
            <View style={{ gap: 8 }}>
              {inv.requirements.map((r, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {status === "pending" && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity
            onPress={decline}
            style={styles.declineBtn}
            activeOpacity={0.85}
          >
            <Feather name="x" size={16} color="#6b7280" />
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={accept}
            style={styles.acceptBtn}
            activeOpacity={0.9}
          >
            <Feather name="check" size={16} color="#fff" />
            <Text style={styles.acceptText}>Accept Invitation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconCol}>
        <Feather name={icon} size={18} color="#2563eb" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f3f4f6" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  scroll: { padding: 16, gap: 14 },

  urgentBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    borderRadius: 12,
  },
  urgentBannerText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.4,
  },

  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPillText: { fontSize: 12, fontWeight: "800" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 18,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  jobTitle: { fontSize: 20, fontWeight: "900", color: "#111827", lineHeight: 24 },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  companyText: { fontSize: 13, fontWeight: "700", color: "#2563eb" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 2, marginLeft: 4 },
  ratingText: { fontSize: 12, fontWeight: "700", color: "#6b7280" },
  payCol: { alignItems: "flex-end" },
  payBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  payAmount: { fontSize: 15, fontWeight: "900", color: "#166534" },
  payRate: { fontSize: 10, fontWeight: "800", color: "#6b7280", marginTop: 4, letterSpacing: 0.6 },

  summaryRows: { marginTop: 14, gap: 10 },

  dateGrid: {
    flexDirection: "row",
    backgroundColor: "#f8faff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8effd",
    overflow: "hidden",
  },
  dateCell: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  dateDivider: {
    width: 1,
    backgroundColor: "#e8effd",
  },

  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  timingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fffbeb",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
    padding: 12,
  },
  timingBadge: {
    backgroundColor: "#d97706",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timingBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff5f5",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 12,
  },

  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  infoRow: { flexDirection: "row", alignItems: "center" },
  iconCol: { width: 28, alignItems: "center" },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9ca3af",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  fieldValue: { fontSize: 14, fontWeight: "700", color: "#111827", marginTop: 2 },

  directionsBtn: {
    marginTop: 14,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  directionsText: { color: "#2563eb", fontWeight: "700", fontSize: 14 },

  messageBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 12,
    padding: 14,
  },
  messageText: { flex: 1, fontSize: 14, color: "#1e3a8a", lineHeight: 21, fontStyle: "italic" },

  signature: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#1d4ed8", fontWeight: "800", fontSize: 12 },
  signName: { fontSize: 13, fontWeight: "800", color: "#111827" },
  signMeta: { fontSize: 11, color: "#6b7280", marginTop: 1 },
  msgBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 10,
  },
  scheduleHeaderTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },
  scheduleDaysBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  scheduleDaysBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563eb",
  },
  scheduleDateRange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  scheduleDateRangeText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginBottom: 10,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  scheduleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  scheduleDate: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  scheduleTimeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  scheduleTime: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
  },

  bodyText: { fontSize: 14, color: "#4b5563", lineHeight: 21 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6b7280",
    marginTop: 7,
  },
  bulletText: { flex: 1, fontSize: 13, color: "#374151", fontWeight: "600", lineHeight: 19 },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  declineText: { color: "#6b7280", fontWeight: "700", fontSize: 14 },
  acceptBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#2563eb",
  },
  acceptText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});

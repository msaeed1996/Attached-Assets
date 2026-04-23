import React from "react";
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
import { UPCOMING_SHIFTS } from "@/data/upcomingShifts";

const REPORT_TO: Record<string, string> = {
  us1: "Manager Sara",
  us2: "Supervisor Mike",
  us3: "Coordinator Lily",
  us4: "Office Lead Dana",
  us5: "Floor Lead Alex",
};

const OVERVIEW: Record<string, { summary: string; bullets: string[] }> = {
  us1: {
    summary:
      "Lead the bar service for an upscale hotel event, crafting cocktails, managing inventory and supporting junior staff throughout the shift.",
    bullets: [
      "Prepare classic and signature cocktails",
      "Manage bar inventory and restocks",
      "Deliver a premium guest experience",
    ],
  },
  us2: {
    summary:
      "Support warehouse fulfillment operations including picking, packing, and staging outbound shipments in a fast-paced logistics environment.",
    bullets: [
      "Pick and pack customer orders accurately",
      "Operate pallet jacks and basic equipment",
      "Maintain a clean and safe work area",
    ],
  },
  us3: {
    summary:
      "Provide on-site event support including guest check-in, floor coverage, and breakdown for a high-profile evening event.",
    bullets: [
      "Greet and check in guests",
      "Assist with event setup and breakdown",
      "Respond to guest needs throughout the night",
    ],
  },
  us4: {
    summary:
      "Cover the front desk for a corporate law office, greeting visitors, managing calls, and supporting administrative tasks.",
    bullets: [
      "Greet visitors and clients professionally",
      "Manage phones and conference room bookings",
      "Provide light administrative support",
    ],
  },
  us5: {
    summary:
      "Support the retail floor team with customer service, restocking and fitting room coverage during a busy weekday shift.",
    bullets: [
      "Assist customers on the sales floor",
      "Restock merchandise and maintain displays",
      "Operate point-of-sale as needed",
    ],
  },
};

function splitAddress(loc: string) {
  const parts = loc.split(",").map((p) => p.trim());
  if (parts.length <= 1) return { line1: loc, line2: "" };
  return { line1: parts[0], line2: parts.slice(1).join(", ") };
}

export default function ShiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const shift = UPCOMING_SHIFTS.find((s) => s.id === id);

  if (!shift) {
    return (
      <View style={styles.notFound}>
        <Text style={{ color: "#111827", fontSize: 16 }}>Shift not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: "#2563eb", fontWeight: "700" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const addr = splitAddress(shift.location);
  const reportTo = REPORT_TO[shift.id] ?? "On-site Manager";
  const overview = OVERVIEW[shift.id] ?? {
    summary: "Details for this shift will be confirmed upon arrival.",
    bullets: ["Arrive 10 minutes early", "Bring a valid photo ID", "Dress per role guidelines"],
  };
  const dateLong = new Date(shift.dateISO).toLocaleDateString(undefined, {
    weekday: "long",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  function getDirections() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const q = encodeURIComponent(shift!.location);
    Linking.openURL(`https://maps.google.com/?q=${q}`).catch(() => {});
  }

  function cancelShift() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Cancel this shift?",
      "Cancellation policies apply and may affect your reliability score.",
      [
        { text: "Keep Shift", style: "cancel" },
        {
          text: "Cancel Shift",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ],
    );
  }

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
        <Text style={styles.headerTitle}>Shift Details</Text>
        <View style={styles.headerBtn} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary card */}
        <View style={styles.card}>
          <View style={styles.summaryTop}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.jobTitle}>{shift.jobTitle}</Text>
              <View style={styles.companyRow}>
                <Feather name="briefcase" size={13} color="#2563eb" />
                <Text style={styles.companyText}>{shift.company}</Text>
              </View>
            </View>
            <View style={styles.payCol}>
              <View style={styles.payBadge}>
                <Text style={styles.payAmount}>${shift.estimatedEarnings.toLocaleString()}</Text>
              </View>
              <Text style={styles.payRate}>
                ${shift.payRate.toFixed(2)}{shift.payType === "hourly" ? " / hr" : " flat"}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRows}>
            <InfoRow
              icon="calendar"
              label="Date"
              value={dateLong}
            />
            <InfoRow
              icon="clock"
              label={`Time (${shift.durationHours}h)`}
              value={`${shift.startTime} – ${shift.endTime}`}
            />
          </View>
        </View>

        {/* Location & Contact */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location & Contact</Text>

          <View style={styles.addressRow}>
            <View style={styles.iconCol}>
              <Feather name="map-pin" size={18} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Address</Text>
              <Text style={styles.fieldValue}>{addr.line1}</Text>
              {addr.line2 ? <Text style={styles.fieldValue}>{addr.line2}</Text> : null}

              <TouchableOpacity
                style={styles.directionsBtn}
                onPress={getDirections}
                activeOpacity={0.85}
              >
                <Feather name="navigation" size={15} color="#2563eb" />
                <Text style={styles.directionsText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <InfoRow icon="user" label="Report To" value={reportTo} />
        </View>

        {/* Job overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Job Overview</Text>
          <Text style={styles.overviewText}>{overview.summary}</Text>
          <View style={{ marginTop: 10, gap: 6 }}>
            {overview.bullets.map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          onPress={cancelShift}
          style={styles.cancelBtn}
          activeOpacity={0.8}
        >
          <Feather name="alert-triangle" size={15} color="#ef4444" />
          <Text style={styles.cancelText}>Cancel this Shift</Text>
        </TouchableOpacity>
        <Text style={styles.cancelNote}>Cancellation policies apply.</Text>
      </View>
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
  payCol: { alignItems: "flex-end" },
  payBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  payAmount: { fontSize: 17, fontWeight: "900", color: "#166534" },
  payRate: { fontSize: 11, fontWeight: "700", color: "#6b7280", marginTop: 4, letterSpacing: 0.4 },

  summaryRows: { marginTop: 12, gap: 12 },

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
  addressRow: { flexDirection: "row", alignItems: "flex-start" },
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
    marginTop: 12,
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

  divider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 14 },

  overviewText: { fontSize: 14, color: "#4b5563", lineHeight: 21 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#6b7280",
    marginTop: 8,
  },
  bulletText: { flex: 1, fontSize: 13, color: "#374151", fontWeight: "600", lineHeight: 19 },

  footer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  cancelText: { color: "#ef4444", fontWeight: "800", fontSize: 14 },
  cancelNote: { fontSize: 10, color: "#9ca3af", marginTop: 2 },
});

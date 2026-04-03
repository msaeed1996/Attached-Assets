import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHIFTS = [
  { label: "Morning", sub: "6am – 12pm", icon: "sun" },
  { label: "Afternoon", sub: "12pm – 6pm", icon: "cloud" },
  { label: "Evening", sub: "6pm – 10pm", icon: "moon" },
  { label: "Night", sub: "10pm – 6am", icon: "star" },
];

export default function AvailabilityTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeDays, setActiveDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [activeShifts, setActiveShifts] = useState<string[]>(["Morning", "Afternoon"]);
  const [maxHours, setMaxHours] = useState(40);
  const [saved, setSaved] = useState(false);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  function toggleDay(d: string) {
    Haptics.selectionAsync();
    setSaved(false);
    setActiveDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function toggleShift(s: string) {
    Haptics.selectionAsync();
    setSaved(false);
    setActiveShifts((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Availability</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: isAvailable ? "#dcfce7" : "#fee2e2" }
          ]}>
            <View style={[styles.statusDot, { backgroundColor: isAvailable ? "#10b981" : "#ef4444" }]} />
            <Text style={[styles.statusText, { color: isAvailable ? "#10b981" : "#ef4444" }]}>
              {isAvailable ? "Open to Work" : "Not Available"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Available toggle card */}
        <View style={[styles.toggleCard, {
          borderColor: isAvailable ? "#10b981" : colors.border,
          backgroundColor: colors.card,
        }]}>
          <View style={styles.toggleLeft}>
            <View style={[styles.toggleIconWrap, { backgroundColor: isAvailable ? "#dcfce7" : "#f3f4f6" }]}>
              <Feather name={isAvailable ? "check-circle" : "x-circle"} size={20} color={isAvailable ? "#10b981" : "#9ca3af"} />
            </View>
            <View>
              <Text style={[styles.toggleTitle, { color: colors.foreground }]}>
                {isAvailable ? "Available for Work" : "Not Available"}
              </Text>
              <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                {isAvailable
                  ? "Employers can see and invite you"
                  : "You are hidden from job listings"}
              </Text>
            </View>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsAvailable(v);
              setSaved(false);
            }}
            trackColor={{ false: "#e5e7eb", true: "#6ee7b7" }}
            thumbColor={isAvailable ? "#10b981" : "#9ca3af"}
          />
        </View>

        {/* Days */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Available Days</Text>
          <View style={styles.daysRow}>
            {DAYS.map((d) => {
              const active = activeDays.includes(d);
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dayChip,
                    { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }
                  ]}
                  onPress={() => toggleDay(d)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayChipText, { color: active ? "#fff" : colors.mutedForeground }]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Shifts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preferred Shifts</Text>
          <View style={styles.shiftsGrid}>
            {SHIFTS.map((s) => {
              const active = activeShifts.includes(s.label);
              return (
                <TouchableOpacity
                  key={s.label}
                  style={[
                    styles.shiftCard,
                    {
                      backgroundColor: active ? "#eff6ff" : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => toggleShift(s.label)}
                  activeOpacity={0.82}
                >
                  <View style={[styles.shiftIcon, { backgroundColor: active ? "#dbeafe" : colors.muted }]}>
                    <Feather name={s.icon as any} size={16} color={active ? colors.primary : colors.mutedForeground} />
                  </View>
                  <Text style={[styles.shiftLabel, { color: active ? "#1d4ed8" : colors.foreground }]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.shiftSub, { color: active ? "#3b82f6" : colors.mutedForeground }]}>
                    {s.sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Max hours */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Max Hours per Week</Text>
          <View style={[styles.hoursCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.hoursBtn, { backgroundColor: colors.muted }]}
              onPress={() => {
                Haptics.selectionAsync();
                setSaved(false);
                setMaxHours((h) => Math.max(10, h - 5));
              }}
            >
              <Feather name="minus" size={18} color={colors.foreground} />
            </TouchableOpacity>
            <View style={styles.hoursCenter}>
              <Text style={[styles.hoursValue, { color: colors.foreground }]}>{maxHours}</Text>
              <Text style={[styles.hoursUnit, { color: colors.mutedForeground }]}>hrs / week</Text>
            </View>
            <TouchableOpacity
              style={[styles.hoursBtn, { backgroundColor: colors.muted }]}
              onPress={() => {
                Haptics.selectionAsync();
                setSaved(false);
                setMaxHours((h) => Math.min(80, h + 5));
              }}
            >
              <Feather name="plus" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary card */}
        <View style={[styles.summaryCard, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
          <Feather name="info" size={15} color={colors.primary} />
          <Text style={[styles.summaryText, { color: "#1d4ed8" }]}>
            You're available <Text style={{ fontWeight: "700" }}>{activeDays.length} days/week</Text> for{" "}
            <Text style={{ fontWeight: "700" }}>{activeShifts.join(", ") || "no shifts"}</Text>{" "}
            up to <Text style={{ fontWeight: "700" }}>{maxHours} hrs</Text>
          </Text>
        </View>

        {/* Save button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: saved ? "#10b981" : (isAvailable ? colors.primary : "#6b7280") }
            ]}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setSaved(true);
            }}
            activeOpacity={0.88}
          >
            <Feather name={saved ? "check-circle" : "check"} size={18} color="#fff" />
            <Text style={styles.saveBtnText}>
              {saved ? "Availability Saved!" : "Save Availability"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  toggleCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  toggleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  toggleSub: {
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  daysRow: {
    flexDirection: "row",
    gap: 6,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1.5,
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  shiftsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  shiftCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1.5,
  },
  shiftIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  shiftLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  shiftSub: {
    fontSize: 11,
  },
  hoursCard: {
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  hoursBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  hoursCenter: {
    alignItems: "center",
  },
  hoursValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  hoursUnit: {
    fontSize: 12,
    fontWeight: "500",
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

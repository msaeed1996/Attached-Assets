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
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHIFTS = [
  { label: "Morning", sub: "6am – 12pm", icon: "sun" },
  { label: "Afternoon", sub: "12pm – 6pm", icon: "cloud" },
  { label: "Evening", sub: "6pm – 10pm", icon: "moon" },
  { label: "Night", sub: "10pm – 6am", icon: "star" },
];

export default function AvailabilityScreen() {
  const insets = useSafeAreaInsets();
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeDays, setActiveDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [unavailableDays, setUnavailableDays] = useState<string[]>([]);
  const [activeShifts, setActiveShifts] = useState<string[]>(["Morning", "Afternoon"]);
  const [maxHours, setMaxHours] = useState(40);
  const [timeSlots, setTimeSlots] = useState<Record<string, string[]>>({});

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  function toggleDay(d: string) {
    if (unavailableDays.includes(d)) return;
    Haptics.selectionAsync();
    setActiveDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function toggleShift(s: string) {
    Haptics.selectionAsync();
    setActiveShifts((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function addTimeSlot(day: string) {
    Haptics.selectionAsync();
    const slots = timeSlots[day] ?? [];
    const defaults = ["9:00 AM – 1:00 PM", "2:00 PM – 6:00 PM", "7:00 AM – 3:00 PM"];
    const next = defaults[slots.length % defaults.length];
    setTimeSlots((prev) => ({ ...prev, [day]: [...slots, next] }));
    if (!activeDays.includes(day)) {
      setActiveDays((prev) => [...prev, day]);
    }
  }

  function markUnavailable(day: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUnavailableDays((prev) =>
      prev.includes(day) ? prev.filter((x) => x !== day) : [...prev, day]
    );
    setActiveDays((prev) => prev.filter((x) => x !== day));
    setTimeSlots((prev) => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
  }

  return (
    <View style={[styles.root, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Availability</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Available toggle card */}
        <View style={[styles.toggleCard, { borderColor: isAvailable ? "#10b981" : "#e5e7eb" }]}>
          <View style={styles.toggleLeft}>
            <View style={[styles.toggleDot, { backgroundColor: isAvailable ? "#10b981" : "#9ca3af" }]} />
            <View>
              <Text style={styles.toggleTitle}>
                {isAvailable ? "Available for Work" : "Not Available"}
              </Text>
              <Text style={styles.toggleSub}>
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
            }}
            trackColor={{ false: "#e5e7eb", true: "#6ee7b7" }}
            thumbColor={isAvailable ? "#10b981" : "#9ca3af"}
          />
        </View>

        {/* Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Days</Text>
          <View style={styles.daysContainer}>
            {DAYS.map((d) => {
              const active = activeDays.includes(d);
              const unavailable = unavailableDays.includes(d);
              const slots = timeSlots[d] ?? [];
              return (
                <View
                  key={d}
                  style={[
                    styles.dayRow,
                    unavailable && styles.dayRowUnavailable,
                    active && !unavailable && styles.dayRowActive,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.dayLabelArea}
                    onPress={() => toggleDay(d)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.dayDot,
                      unavailable ? styles.dayDotUnavailable : active ? styles.dayDotActive : styles.dayDotInactive,
                    ]} />
                    <Text style={[
                      styles.dayName,
                      unavailable && styles.dayNameUnavailable,
                      active && !unavailable && styles.dayNameActive,
                    ]}>
                      {d}
                    </Text>
                    {slots.length > 0 && !unavailable && (
                      <Text style={styles.slotPreview} numberOfLines={1}>{slots[0]}{slots.length > 1 ? ` +${slots.length - 1}` : ""}</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.dayActions}>
                    {!unavailable && (
                      <TouchableOpacity
                        style={styles.actionBtnSlot}
                        onPress={() => addTimeSlot(d)}
                        activeOpacity={0.75}
                      >
                        <Feather name="plus" size={10} color="#2563EB" />
                        <Text style={styles.actionBtnSlotText}>Slot</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionBtnUnavail, unavailable && styles.actionBtnUnavailActive]}
                      onPress={() => markUnavailable(d)}
                      activeOpacity={0.75}
                    >
                      <Feather
                        name={unavailable ? "rotate-ccw" : "slash"}
                        size={10}
                        color={unavailable ? "#6b7280" : "#ef4444"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Shifts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Shifts</Text>
          <View style={styles.shiftsGrid}>
            {SHIFTS.map((s) => {
              const active = activeShifts.includes(s.label);
              return (
                <TouchableOpacity
                  key={s.label}
                  style={[styles.shiftCard, active && styles.shiftCardActive]}
                  onPress={() => toggleShift(s.label)}
                  activeOpacity={0.82}
                >
                  <View style={[styles.shiftIcon, { backgroundColor: active ? "#dbeafe" : "#f3f4f6" }]}>
                    <Feather name={s.icon as any} size={16} color={active ? "#2563EB" : "#9ca3af"} />
                  </View>
                  <Text style={[styles.shiftLabel, { color: active ? "#1d4ed8" : "#374151" }]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.shiftSub, { color: active ? "#3b82f6" : "#9ca3af" }]}>
                    {s.sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Max hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Max Hours per Week</Text>
          <View style={styles.hoursCard}>
            <TouchableOpacity
              style={styles.hoursBtn}
              onPress={() => {
                Haptics.selectionAsync();
                setMaxHours((h) => Math.max(10, h - 5));
              }}
            >
              <Feather name="minus" size={18} color="#374151" />
            </TouchableOpacity>
            <View style={styles.hoursCenter}>
              <Text style={styles.hoursValue}>{maxHours}</Text>
              <Text style={styles.hoursUnit}>hrs / week</Text>
            </View>
            <TouchableOpacity
              style={styles.hoursBtn}
              onPress={() => {
                Haptics.selectionAsync();
                setMaxHours((h) => Math.min(80, h + 5));
              }}
            >
              <Feather name="plus" size={18} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Save button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: isAvailable ? "#2563EB" : "#6b7280" }]}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            }}
            activeOpacity={0.88}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Availability</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
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
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  toggleCard: {
    margin: 16,
    backgroundColor: "#fff",
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
  toggleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  toggleSub: {
    fontSize: 12,
    color: "#6b7280",
  },

  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 12,
  },

  daysContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
  },
  dayRowActive: {
    backgroundColor: "#f0f7ff",
  },
  dayRowUnavailable: {
    backgroundColor: "#fef2f2",
  },
  dayLabelArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayDotActive: {
    backgroundColor: "#2563EB",
  },
  dayDotInactive: {
    backgroundColor: "#d1d5db",
  },
  dayDotUnavailable: {
    backgroundColor: "#ef4444",
  },
  dayName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  dayNameActive: {
    color: "#1d4ed8",
  },
  dayNameUnavailable: {
    color: "#ef4444",
    textDecorationLine: "line-through",
  },
  slotPreview: {
    fontSize: 10,
    color: "#3b82f6",
    flex: 1,
  },

  dayActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionBtnSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  actionBtnSlotText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#2563EB",
  },
  actionBtnUnavail: {
    width: 24,
    height: 24,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  actionBtnUnavailActive: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
  },
  actionBtnUnavailText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ef4444",
  },
  actionBtnUnavailTextActive: {
    color: "#6b7280",
  },

  shiftsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  shiftCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  shiftCardActive: {
    borderColor: "#2563EB",
    backgroundColor: "#eff6ff",
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
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  hoursBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  hoursCenter: {
    alignItems: "center",
  },
  hoursValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  hoursUnit: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
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

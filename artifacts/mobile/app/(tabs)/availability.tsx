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
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ShiftType = "Morning" | "Afternoon" | "Evening" | "Night";
type AvailabilityEntry = {
  shifts: ShiftType[];
  note: string;
};

const SHIFT_META: Record<ShiftType, { time: string; icon: string; color: string; bg: string }> = {
  Morning:   { time: "6am – 12pm",  icon: "sun",   color: "#f59e0b", bg: "#fef3c7" },
  Afternoon: { time: "12pm – 6pm",  icon: "cloud", color: "#3b82f6", bg: "#dbeafe" },
  Evening:   { time: "6pm – 10pm",  icon: "moon",  color: "#8b5cf6", bg: "#ede9fe" },
  Night:     { time: "10pm – 6am",  icon: "star",  color: "#0891b2", bg: "#cffafe" },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function AvailabilityTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [availability, setAvailability] = useState<Record<string, AvailabilityEntry>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShifts, setEditingShifts] = useState<ShiftType[]>([]);
  const [editingNote, setEditingNote] = useState("");

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  function prevMonth() {
    Haptics.selectionAsync();
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    Haptics.selectionAsync();
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function openDay(day: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const key = toKey(viewYear, viewMonth, day);
    setSelectedKey(key);
    const existing = availability[key];
    setEditingShifts(existing?.shifts ?? []);
    setEditingNote(existing?.note ?? "");
    setModalVisible(true);
  }

  function toggleShift(shift: ShiftType) {
    Haptics.selectionAsync();
    setEditingShifts(prev =>
      prev.includes(shift) ? prev.filter(s => s !== shift) : [...prev, shift]
    );
  }

  function saveDay() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (selectedKey) {
      if (editingShifts.length === 0) {
        const next = { ...availability };
        delete next[selectedKey];
        setAvailability(next);
      } else {
        setAvailability(prev => ({
          ...prev,
          [selectedKey]: { shifts: editingShifts, note: editingNote },
        }));
      }
    }
    setModalVisible(false);
  }

  function clearDay() {
    Haptics.selectionAsync();
    if (selectedKey) {
      const next = { ...availability };
      delete next[selectedKey];
      setAvailability(next);
    }
    setModalVisible(false);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  function formatSelectedDate(key: string) {
    const [y, m, d] = key.split("-");
    return `${MONTH_NAMES[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
  }

  const markedCount = Object.keys(availability).filter(k => k.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`)).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: "#0759af", borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Availability</Text>
          <View style={styles.markedBadge}>
            <Feather name="calendar" size={13} color="#60a5fa" />
            <Text style={styles.markedBadgeText}>{markedCount} day{markedCount !== 1 ? "s" : ""} set</Text>
          </View>
        </View>

        {/* Month navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.monthArrow} onPress={prevMonth}>
            <Feather name="chevron-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
          <TouchableOpacity style={styles.monthArrow} onPress={nextMonth}>
            <Feather name="chevron-right" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Day of week headers */}
        <View style={styles.dowRow}>
          {DAYS_OF_WEEK.map(d => (
            <Text key={d} style={styles.dowText}>{d}</Text>
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar grid */}
        <View style={styles.calGrid}>
          {cells.map((day, idx) => {
            if (!day) return <View key={`empty-${idx}`} style={styles.calCell} />;
            const key = toKey(viewYear, viewMonth, day);
            const entry = availability[key];
            const isToday = key === todayKey;
            const hasAvailability = !!entry && entry.shifts.length > 0;
            const isPast = new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.calCell,
                  isToday && styles.todayCell,
                  hasAvailability && styles.markedCell,
                  isPast && styles.pastCell,
                ]}
                onPress={() => openDay(day)}
                activeOpacity={0.75}
              >
                <Text style={[
                  styles.calDayText,
                  isToday && styles.todayText,
                  hasAvailability && styles.markedText,
                  isPast && styles.pastText,
                ]}>
                  {day}
                </Text>
                {hasAvailability && (
                  <View style={styles.dotRow}>
                    {entry.shifts.slice(0, 3).map(s => (
                      <View key={s} style={[styles.shiftDot, { backgroundColor: SHIFT_META[s].color }]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legendSection}>
          <Text style={[styles.legendTitle, { color: colors.mutedForeground }]}>Shift Legend</Text>
          <View style={styles.legendRow}>
            {(Object.keys(SHIFT_META) as ShiftType[]).map(s => (
              <View key={s} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: SHIFT_META[s].color }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming marked days */}
        {Object.keys(availability).filter(k => k >= todayKey).sort().length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={[styles.upcomingTitle, { color: colors.foreground }]}>Upcoming Availability</Text>
            {Object.entries(availability)
              .filter(([k]) => k >= todayKey)
              .sort(([a], [b]) => a.localeCompare(b))
              .slice(0, 5)
              .map(([key, entry]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.upcomingRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    const [y, m, d] = key.split("-");
                    const dayNum = parseInt(d);
                    setViewYear(parseInt(y));
                    setViewMonth(parseInt(m) - 1);
                    setSelectedKey(key);
                    setEditingShifts(entry.shifts);
                    setEditingNote(entry.note);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.upcomingDateBox, { backgroundColor: "#eff6ff" }]}>
                    <Text style={styles.upcomingDateDay}>{key.split("-")[2]}</Text>
                    <Text style={styles.upcomingDateMon}>{MONTH_NAMES[parseInt(key.split("-")[1]) - 1].slice(0, 3)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.shiftTagsRow}>
                      {entry.shifts.map(s => (
                        <View key={s} style={[styles.shiftTag, { backgroundColor: SHIFT_META[s].bg }]}>
                          <Feather name={SHIFT_META[s].icon as any} size={10} color={SHIFT_META[s].color} />
                          <Text style={[styles.shiftTagText, { color: SHIFT_META[s].color }]}>{s}</Text>
                        </View>
                      ))}
                    </View>
                    {entry.note ? (
                      <Text style={[styles.upcomingNote, { color: colors.mutedForeground }]} numberOfLines={1}>{entry.note}</Text>
                    ) : null}
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
          </View>
        )}
      </ScrollView>

      {/* Day detail modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity style={[styles.modalSheet, { backgroundColor: colors.background }]} activeOpacity={1}>
            {/* Handle */}
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

            <Text style={[styles.modalDate, { color: colors.foreground }]}>
              {selectedKey ? formatSelectedDate(selectedKey) : ""}
            </Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Tap shifts to mark your availability
            </Text>

            {/* Shift selector */}
            <View style={styles.modalShiftsGrid}>
              {(Object.keys(SHIFT_META) as ShiftType[]).map(shift => {
                const meta = SHIFT_META[shift];
                const active = editingShifts.includes(shift);
                return (
                  <TouchableOpacity
                    key={shift}
                    style={[
                      styles.modalShiftCard,
                      {
                        backgroundColor: active ? meta.bg : colors.card,
                        borderColor: active ? meta.color : colors.border,
                      }
                    ]}
                    onPress={() => toggleShift(shift)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.modalShiftIcon, { backgroundColor: active ? meta.color + "22" : colors.muted }]}>
                      <Feather name={meta.icon as any} size={18} color={active ? meta.color : colors.mutedForeground} />
                    </View>
                    <Text style={[styles.modalShiftLabel, { color: active ? meta.color : colors.foreground }]}>{shift}</Text>
                    <Text style={[styles.modalShiftTime, { color: active ? meta.color : colors.mutedForeground }]}>{meta.time}</Text>
                    {active && (
                      <View style={[styles.modalShiftCheck, { backgroundColor: meta.color }]}>
                        <Feather name="check" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Existing info summary */}
            {editingShifts.length > 0 && (
              <View style={[styles.modalSummary, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
                <Feather name="info" size={14} color="#2563EB" />
                <Text style={styles.modalSummaryText}>
                  Available for <Text style={{ fontWeight: "700" }}>{editingShifts.join(", ")}</Text>
                </Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.modalActions}>
              {availability[selectedKey ?? ""] && (
                <TouchableOpacity style={[styles.clearBtn, { borderColor: "#ef4444" }]} onPress={clearDay}>
                  <Feather name="trash-2" size={16} color="#ef4444" />
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: editingShifts.length > 0 ? "#2563EB" : "#9ca3af", flex: 1 }]}
                onPress={saveDay}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  markedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  markedBadgeText: {
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: "600",
  },

  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  monthLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  dowRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dowText: {
    flex: 1,
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  calCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    gap: 2,
  },
  todayCell: {
    backgroundColor: "#dbeafe",
  },
  markedCell: {
    backgroundColor: "#eff6ff",
    borderWidth: 1.5,
    borderColor: "#2563EB",
  },
  pastCell: {
    opacity: 0.4,
  },
  calDayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  todayText: {
    color: "#2563EB",
    fontWeight: "800",
  },
  markedText: {
    color: "#1d4ed8",
    fontWeight: "800",
  },
  pastText: {
    color: "#9ca3af",
  },
  dotRow: {
    flexDirection: "row",
    gap: 2,
  },
  shiftDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  legendSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },

  upcomingSection: {
    paddingHorizontal: 16,
    gap: 10,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  upcomingDateBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  upcomingDateDay: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2563EB",
    lineHeight: 20,
  },
  upcomingDateMon: {
    fontSize: 10,
    fontWeight: "600",
    color: "#3b82f6",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  shiftTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 2,
  },
  shiftTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  shiftTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  upcomingNote: {
    fontSize: 12,
    marginTop: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  modalSub: {
    fontSize: 13,
    marginTop: -8,
  },
  modalShiftsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modalShiftCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: 1.5,
    position: "relative",
  },
  modalShiftIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  modalShiftLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalShiftTime: {
    fontSize: 11,
  },
  modalShiftCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalSummaryText: {
    color: "#1d4ed8",
    fontSize: 13,
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  clearBtnText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

import React, { useState, useRef, useEffect } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

const DAYS_SHORT  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAYS_LONG   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

type ShiftType = "Morning" | "Afternoon" | "Evening" | "Night";
type JobStatus = "ACCEPTED" | "INVITED" | "PENDING" | "CONFIRMED";
type AvailabilityEntry = { shifts: ShiftType[]; note: string };

const SHIFT_META: Record<ShiftType, {
  shiftRange: string; icon: string; color: string; bg: string;
  jobTitle: string; location: string;
  startTime: string; endTime: string;
  status: JobStatus;
}> = {
  Morning:   { shiftRange: "6am – 12pm",  icon: "sun",   color: "#f59e0b", bg: "#fef3c7", jobTitle: "Breakfast Prep Cook",  location: "Visitor Center Dr",       startTime: "9:00 AM",  endTime: "1:00 PM",  status: "ACCEPTED"  },
  Afternoon: { shiftRange: "12pm – 6pm",  icon: "cloud", color: "#f97316", bg: "#fff7ed", jobTitle: "Food Service Worker",  location: "Legion Field, 400 Graymont Ave W", startTime: "1:00 PM",  endTime: "6:00 PM",  status: "INVITED"   },
  Evening:   { shiftRange: "6pm – 10pm",  icon: "moon",  color: "#10b981", bg: "#f0fdf4", jobTitle: "Event Server",         location: "Grand Hotel Ballroom",    startTime: "6:00 PM",  endTime: "10:00 PM", status: "ACCEPTED"  },
  Night:     { shiftRange: "10pm – 6am",  icon: "star",  color: "#6b7280", bg: "#f9fafb", jobTitle: "Security Staff",       location: "Metro Station West",      startTime: "10:00 PM", endTime: "6:00 AM",  status: "PENDING"   },
};

const STATUS_STYLE: Record<JobStatus, { color: string; bg: string; border: string; bar: string }> = {
  ACCEPTED:  { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", bar: "#22c55e" },
  INVITED:   { color: "#c2410c", bg: "#fff7ed", border: "#fed7aa", bar: "#f97316" },
  CONFIRMED: { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", bar: "#3b82f6" },
  PENDING:   { color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", bar: "#9ca3af" },
};

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function parseDow(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}
function formatDayHeader(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return `${DAYS_LONG[parseDow(key)]}, ${MONTH_NAMES[m - 1]} ${d}`;
}

export default function AvailabilityTab() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const topPad  = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const today    = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [availability, setAvailability] = useState<Record<string, AvailabilityEntry>>({});
  const [selectedKey, setSelectedKey]   = useState(todayKey);
  const [showFullCal, setShowFullCal]   = useState(false);

  // online / offline
  const [isOnline,  setIsOnline]  = useState(true);
  const [showTip,   setShowTip]   = useState(true);
  const tipAnim = useRef(new Animated.Value(1)).current;

  function dismissTip() {
    Animated.timing(tipAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => setShowTip(false));
  }

  function toggleOnline() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOnline(v => !v);
    setShowTip(true);
    tipAnim.setValue(1);
  }

  // modal
  const [modalVisible,   setModalVisible]   = useState(false);
  const [editingShifts,  setEditingShifts]  = useState<ShiftType[]>([]);
  const [editingNote,    setEditingNote]    = useState("");

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDay(viewYear, viewMonth);

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

  function selectDay(key: string) {
    Haptics.selectionAsync();
    setSelectedKey(key);
    if (showFullCal) setShowFullCal(false);
  }

  function openModal(key?: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const k = key ?? selectedKey;
    const existing = availability[k];
    setEditingShifts(existing?.shifts ?? []);
    setEditingNote(existing?.note ?? "");
    setModalVisible(true);
  }

  function toggleShift(s: ShiftType) {
    Haptics.selectionAsync();
    setEditingShifts(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function saveDay() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editingShifts.length === 0) {
      const next = { ...availability };
      delete next[selectedKey];
      setAvailability(next);
    } else {
      setAvailability(prev => ({ ...prev, [selectedKey]: { shifts: editingShifts, note: editingNote } }));
    }
    setModalVisible(false);
  }

  function clearDay() {
    Haptics.selectionAsync();
    const next = { ...availability };
    delete next[selectedKey];
    setAvailability(next);
    setModalVisible(false);
  }

  function getDotColors(key: string) {
    const shifts = availability[key]?.shifts ?? [];
    const hasAccepted = shifts.some(s => ["ACCEPTED","CONFIRMED"].includes(SHIFT_META[s].status));
    const hasInvited  = shifts.some(s => SHIFT_META[s].status === "INVITED");
    const hasPending  = shifts.some(s => SHIFT_META[s].status === "PENDING");
    return { hasAccepted, hasInvited, hasPending, hasAny: shifts.length > 0 };
  }

  const days    = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const cells   = [...Array(firstDay).fill(null), ...days];
  const selJobs = availability[selectedKey]?.shifts ?? [];
  const markedCount = Object.keys(availability).filter(k =>
    k.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`)
  ).length;

  return (
    <View style={[styles.root, { backgroundColor: "#f1f5f9" }]}>

      {/* ── BLUE HEADER ── */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View>
          <Text style={styles.headerTitle}>My Availability</Text>
          {markedCount > 0 && (
            <Text style={styles.headerSub}>{markedCount} day{markedCount !== 1 ? "s" : ""} marked this month</Text>
          )}
        </View>

        {/* Online / Offline toggle */}
        <TouchableOpacity
          style={[styles.onlineToggle, { backgroundColor: isOnline ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.12)" }]}
          onPress={toggleOnline}
          activeOpacity={0.8}
        >
          <View style={[styles.onlineDot, { backgroundColor: isOnline ? "#4ade80" : "#9ca3af" }]} />
          <Text style={[styles.onlineToggleText, { color: isOnline ? "#4ade80" : "rgba(255,255,255,0.5)" }]}>
            {isOnline ? "Online" : "Offline"}
          </Text>
          <Feather name="chevron-down" size={12} color={isOnline ? "#4ade80" : "rgba(255,255,255,0.4)"} />
        </TouchableOpacity>
      </View>

      {/* ── STATUS TIP BANNER ── */}
      {showTip && (
        <Animated.View style={[styles.tipBanner, { opacity: tipAnim, backgroundColor: isOnline ? "#f0fdf4" : "#fff7ed", borderColor: isOnline ? "#bbf7d0" : "#fed7aa" }]}>
          <View style={[styles.tipIcon, { backgroundColor: isOnline ? "#dcfce7" : "#ffedd5" }]}>
            <Feather name={isOnline ? "wifi" : "wifi-off"} size={16} color={isOnline ? "#16a34a" : "#f97316"} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipTitle, { color: isOnline ? "#15803d" : "#c2410c" }]}>
              {isOnline ? "You're visible to employers" : "You're hidden from employers"}
            </Text>
            <Text style={[styles.tipBody, { color: isOnline ? "#166534" : "#9a3412" }]}>
              {isOnline
                ? "Employers can see your profile and invite you to jobs. Tap \"Offline\" anytime to pause new invitations."
                : "You won't receive new job invitations while offline. Tap \"Online\" to start receiving jobs again."}
            </Text>
          </View>
          <TouchableOpacity onPress={dismissTip} style={styles.tipClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={14} color={isOnline ? "#16a34a" : "#f97316"} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── CALENDAR CARD ── */}
      <View style={styles.calCard}>
        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navArrow} onPress={prevMonth}>
            <Feather name="chevron-left" size={18} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
          <TouchableOpacity style={styles.navArrow} onPress={nextMonth}>
            <Feather name="chevron-right" size={18} color="#374151" />
          </TouchableOpacity>
        </View>

        {showFullCal ? (
          /* ── FULL MONTH GRID ── */
          <>
            <View style={styles.dowRow}>
              {DAYS_SHORT.map(d => <Text key={d} style={styles.dowText}>{d}</Text>)}
            </View>
            <View style={styles.gridWrap}>
              {cells.map((day, idx) => {
                if (!day) return <View key={`e-${idx}`} style={styles.gridCell} />;
                const key = toKey(viewYear, viewMonth, day);
                const isToday    = key === todayKey;
                const isSel      = key === selectedKey;
                const isPast     = new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const { hasAccepted, hasInvited, hasPending, hasAny } = getDotColors(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.gridCell, isSel && styles.gridCellSel, isToday && !isSel && styles.gridCellToday]}
                    onPress={() => selectDay(key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.gridDayNum,
                      isSel && { color: "#fff" },
                      isToday && !isSel && { color: "#2563EB", fontWeight: "800" },
                      isPast && !isSel && { color: "#cbd5e1" },
                    ]}>{day}</Text>
                    {hasAny && (
                      <View style={styles.dotRow}>
                        {hasAccepted && <View style={[styles.dot, { backgroundColor: isSel ? "#bbf7d0" : "#22c55e" }]} />}
                        {hasInvited  && <View style={[styles.dot, { backgroundColor: isSel ? "#fed7aa" : "#f97316" }]} />}
                        {hasPending  && <View style={[styles.dot, { backgroundColor: isSel ? "#e5e7eb" : "#9ca3af" }]} />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          /* ── HORIZONTAL DAY STRIP ── */
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
            {days.map(day => {
              const key     = toKey(viewYear, viewMonth, day);
              const isToday = key === todayKey;
              const isSel   = key === selectedKey;
              const isPast  = new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const dow     = DAYS_SHORT[new Date(viewYear, viewMonth, day).getDay()];
              const { hasAccepted, hasInvited, hasPending, hasAny } = getDotColors(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.dayCell,
                    isSel && styles.dayCellSel,
                    isToday && !isSel && styles.dayCellToday,
                  ]}
                  onPress={() => selectDay(key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dayCellDow, isSel && { color: "#fff" }, isPast && !isSel && { color: "#cbd5e1" }]}>{dow}</Text>
                  <Text style={[
                    styles.dayCellNum,
                    isSel && { color: "#fff" },
                    isToday && !isSel && { color: "#2563EB", fontWeight: "800" },
                    isPast && !isSel && { color: "#cbd5e1" },
                  ]}>{day}</Text>
                  <View style={styles.dotRow}>
                    {hasAccepted && <View style={[styles.dot, { backgroundColor: isSel ? "#bbf7d0" : "#22c55e" }]} />}
                    {hasInvited  && <View style={[styles.dot, { backgroundColor: isSel ? "#fed7aa" : "#f97316" }]} />}
                    {hasPending  && !hasAccepted && !hasInvited && <View style={[styles.dot, { backgroundColor: isSel ? "#e5e7eb" : "#9ca3af" }]} />}
                    {!hasAny     && <View style={{ width: 6, height: 6 }} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Toggle + Legend row */}
        <View style={styles.calFooter}>
          <TouchableOpacity
            style={styles.calToggleBtn}
            onPress={() => { Haptics.selectionAsync(); setShowFullCal(v => !v); }}
            activeOpacity={0.8}
          >
            <Feather name={showFullCal ? "chevron-up" : "grid"} size={12} color="#2563EB" />
            <Text style={styles.calToggleText}>{showFullCal ? "Week view" : "Full month"}</Text>
          </TouchableOpacity>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
              <Text style={styles.legendText}>Accepted</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#f97316" }]} />
              <Text style={styles.legendText}>Invited</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#9ca3af" }]} />
              <Text style={styles.legendText}>Pending</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── JOB LIST ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.dayHeader}>{formatDayHeader(selectedKey)}</Text>

        {selJobs.length > 0 ? (
          selJobs.map(shift => {
            const meta   = SHIFT_META[shift];
            const sStyle = STATUS_STYLE[meta.status];
            return (
              <TouchableOpacity
                key={shift}
                style={styles.jobCard}
                onPress={() => openModal()}
                activeOpacity={0.85}
              >
                <View style={[styles.jobBar, { backgroundColor: sStyle.bar }]} />
                <View style={styles.jobBody}>
                  <View style={styles.jobRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.jobTitle}>{meta.jobTitle}</Text>
                      <View style={styles.jobDetailRow}>
                        <Feather name="map-pin" size={11} color="#3b82f6" style={{ marginTop: 1 }} />
                        <Text style={styles.jobDetailText} numberOfLines={1}>{meta.location}</Text>
                      </View>
                      <View style={styles.jobDetailRow}>
                        <Feather name="clock" size={11} color="#3b82f6" />
                        <Text style={styles.jobDetailText}>{meta.startTime} – {meta.endTime}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: sStyle.bg, borderColor: sStyle.border }]}>
                      <Text style={[styles.statusText, { color: sStyle.color }]}>{meta.status}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="calendar" size={30} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No shifts scheduled</Text>
            <Text style={styles.emptySub}>Mark yourself available by tapping the button below</Text>
          </View>
        )}

        {/* Add Availability Block */}
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal()} activeOpacity={0.8}>
          <Feather name="plus" size={16} color="#2563EB" />
          <Text style={styles.addBtnText}>Add Availability Block</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── SHIFT PICKER MODAL ── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{formatDayHeader(selectedKey)}</Text>
            <Text style={styles.modalSub}>Select your available shifts</Text>

            <View style={styles.shiftsGrid}>
              {(Object.keys(SHIFT_META) as ShiftType[]).map(shift => {
                const meta   = SHIFT_META[shift];
                const active = editingShifts.includes(shift);
                return (
                  <TouchableOpacity
                    key={shift}
                    style={[styles.shiftCard, { backgroundColor: active ? meta.bg : "#f9fafb", borderColor: active ? meta.color : "#e5e7eb" }]}
                    onPress={() => toggleShift(shift)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.shiftIconBox, { backgroundColor: active ? meta.color + "22" : "#f3f4f6" }]}>
                      <Feather name={meta.icon as any} size={18} color={active ? meta.color : "#9ca3af"} />
                    </View>
                    <Text style={[styles.shiftLabel, { color: active ? meta.color : "#374151" }]}>{shift}</Text>
                    <Text style={[styles.shiftTime, { color: active ? meta.color : "#9ca3af" }]}>{meta.shiftRange}</Text>
                    {active && (
                      <View style={[styles.shiftCheck, { backgroundColor: meta.color }]}>
                        <Feather name="check" size={9} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {editingShifts.length > 0 && (
              <View style={styles.shiftSummary}>
                <Feather name="check-circle" size={13} color="#2563EB" />
                <Text style={styles.shiftSummaryText}>
                  Available for <Text style={{ fontWeight: "700" }}>{editingShifts.join(", ")}</Text>
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              {availability[selectedKey] && (
                <TouchableOpacity style={styles.clearBtn} onPress={clearDay}>
                  <Feather name="trash-2" size={15} color="#ef4444" />
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: editingShifts.length > 0 ? "#2563EB" : "#9ca3af" }]}
                onPress={saveDay}
              >
                <Feather name="check" size={15} color="#fff" />
                <Text style={styles.saveBtnText}>Save Availability</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    backgroundColor: "#0759af",
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2, fontWeight: "500" },
  headerBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  headerBadgeText: { color: "#93c5fd", fontSize: 12, fontWeight: "600" },

  // Online toggle
  onlineToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineToggleText: { fontSize: 13, fontWeight: "700" },

  // Tip banner
  tipBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tipIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", flexShrink: 0, marginTop: 1 },
  tipTitle: { fontSize: 13, fontWeight: "800", marginBottom: 2 },
  tipBody: { fontSize: 12, lineHeight: 18, fontWeight: "400" },
  tipClose: { padding: 4, marginTop: 2 },

  // Calendar card
  calCard: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  navArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  monthLabel: { fontSize: 15, fontWeight: "800", color: "#111827", letterSpacing: -0.2 },

  // Day strip
  dayStrip: { paddingHorizontal: 10, paddingBottom: 4, gap: 4, flexDirection: "row" },
  dayCell: {
    width: 52,
    height: 72,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    marginHorizontal: 2,
  },
  dayCellSel: { backgroundColor: "#2563EB", ...Platform.select({ ios: { shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 6 } }) },
  dayCellToday: { backgroundColor: "#eff6ff", borderWidth: 1.5, borderColor: "#bfdbfe" },
  dayCellDow: { fontSize: 10, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.3 },
  dayCellNum: { fontSize: 20, fontWeight: "700", color: "#111827" },

  // Full month grid
  dowRow: { flexDirection: "row", paddingHorizontal: 8, marginBottom: 2 },
  dowText: { flex: 1, textAlign: "center", fontSize: 10, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4, paddingVertical: 4 },
  gridWrap: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8, paddingBottom: 4 },
  gridCell: { width: "14.28%", aspectRatio: 1, justifyContent: "center", alignItems: "center", borderRadius: 10, gap: 2 },
  gridCellSel: { backgroundColor: "#2563EB" },
  gridCellToday: { backgroundColor: "#eff6ff", borderWidth: 1.5, borderColor: "#bfdbfe" },
  gridDayNum: { fontSize: 13, fontWeight: "600", color: "#111827" },

  // Dots
  dotRow: { flexDirection: "row", gap: 2, alignItems: "center", height: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },

  // Calendar footer
  calFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  calToggleBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#eff6ff", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  calToggleText: { fontSize: 11, fontWeight: "700", color: "#2563EB" },
  legend: { flexDirection: "row", gap: 10, alignItems: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.3 },

  // Day header + job list
  dayHeader: { fontSize: 13, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10, marginLeft: 2 },

  jobCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  jobBar: { width: 5, flexShrink: 0 },
  jobBody: { flex: 1, padding: 14 },
  jobRow: { flexDirection: "row", alignItems: "flex-start" },
  jobTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 6, letterSpacing: -0.2 },
  jobDetailRow: { flexDirection: "row", alignItems: "flex-start", gap: 5, marginBottom: 3 },
  jobDetailText: { fontSize: 12, color: "#6b7280", fontWeight: "500", flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, flexShrink: 0 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptySub: { fontSize: 13, color: "#9ca3af", textAlign: "center", paddingHorizontal: 20, lineHeight: 20 },

  // Add button
  addBtn: {
    marginTop: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#93c5fd",
    backgroundColor: "rgba(239,246,255,0.6)",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addBtnText: { fontSize: 14, fontWeight: "700", color: "#2563EB" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", letterSpacing: -0.3, marginBottom: 2 },
  modalSub: { fontSize: 13, color: "#94a3b8", marginBottom: 16 },

  shiftsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  shiftCard: { width: "47%", borderRadius: 14, padding: 14, gap: 6, borderWidth: 1.5, position: "relative" },
  shiftIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  shiftLabel: { fontSize: 14, fontWeight: "700" },
  shiftTime: { fontSize: 11 },
  shiftCheck: { position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center" },

  shiftSummary: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", padding: 12, borderRadius: 12, marginBottom: 12 },
  shiftSummaryText: { color: "#1d4ed8", fontSize: 13, flex: 1 },

  modalActions: { flexDirection: "row", gap: 10 },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: "#ef4444" },
  clearBtnText: { color: "#ef4444", fontSize: 14, fontWeight: "700" },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Animated,
  Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

const DAYS_SHORT  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAYS_LONG   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

type ShiftType   = "Morning" | "Afternoon" | "Evening" | "Night";
type JobStatus   = "ACCEPTED" | "INVITED" | "PENDING" | "CONFIRMED";
type AvailabilityEntry = { shifts: ShiftType[]; note: string };
type BlockEntry  = { dayBlocked: boolean; blockedShifts: ShiftType[] };

const SHIFT_META: Record<ShiftType, {
  shiftRange: string; icon: string; color: string; bg: string;
  jobTitle: string; location: string;
  startTime: string; endTime: string; status: JobStatus;
}> = {
  Morning:   { shiftRange: "6am – 12pm",  icon: "sun",   color: "#f59e0b", bg: "#fef3c7", jobTitle: "Breakfast Prep Cook",  location: "Visitor Center Dr",               startTime: "9:00 AM",  endTime: "1:00 PM",  status: "ACCEPTED" },
  Afternoon: { shiftRange: "12pm – 6pm",  icon: "cloud", color: "#f97316", bg: "#fff7ed", jobTitle: "Food Service Worker",  location: "Legion Field, 400 Graymont Ave W", startTime: "1:00 PM",  endTime: "6:00 PM",  status: "INVITED"  },
  Evening:   { shiftRange: "6pm – 10pm",  icon: "moon",  color: "#10b981", bg: "#f0fdf4", jobTitle: "Event Server",         location: "Grand Hotel Ballroom",            startTime: "6:00 PM",  endTime: "10:00 PM", status: "ACCEPTED" },
  Night:     { shiftRange: "10pm – 6am",  icon: "star",  color: "#6b7280", bg: "#f9fafb", jobTitle: "Security Staff",       location: "Metro Station West",              startTime: "10:00 PM", endTime: "6:00 AM",  status: "PENDING"  },
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
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const today    = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [availability, setAvailability] = useState<Record<string, AvailabilityEntry>>({});
  const [dayBlocks, setDayBlocks] = useState<Record<string, BlockEntry>>({});
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [showFullCal, setShowFullCal] = useState(false);

  // global online/offline
  const [isOnline, setIsOnline] = useState(true);
  const [showTip,  setShowTip]  = useState(true);
  const tipAnim = useRef(new Animated.Value(1)).current;

  function dismissTip() {
    Animated.timing(tipAnim, { toValue: 0, duration: 280, useNativeDriver: true })
      .start(() => setShowTip(false));
  }
  function toggleOnline() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOnline(v => !v);
    setShowTip(true);
    tipAnim.setValue(1);
  }

  // availability modal
  const [modalVisible,  setModalVisible]  = useState(false);
  const [editingShifts, setEditingShifts] = useState<ShiftType[]>([]);

  // block modal
  const [blockVisible,      setBlockVisible]      = useState(false);
  const [editingDayBlocked, setEditingDayBlocked] = useState(false);
  const [editingBlockedShifts, setEditingBlockedShifts] = useState<ShiftType[]>([]);

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

  // ── Availability modal ──
  function openModal() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingShifts(availability[selectedKey]?.shifts ?? []);
    setModalVisible(true);
  }
  function toggleShift(s: ShiftType) {
    Haptics.selectionAsync();
    setEditingShifts(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }
  function saveDay() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editingShifts.length === 0) {
      const next = { ...availability }; delete next[selectedKey]; setAvailability(next);
    } else {
      setAvailability(prev => ({ ...prev, [selectedKey]: { shifts: editingShifts, note: "" } }));
    }
    setModalVisible(false);
  }
  function clearDay() {
    Haptics.selectionAsync();
    const next = { ...availability }; delete next[selectedKey]; setAvailability(next);
    setModalVisible(false);
  }

  // ── Block modal ──
  function openBlockModal() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const existing = dayBlocks[selectedKey];
    setEditingDayBlocked(existing?.dayBlocked ?? false);
    setEditingBlockedShifts(existing?.blockedShifts ?? []);
    setBlockVisible(true);
  }
  function toggleBlockShift(s: ShiftType) {
    Haptics.selectionAsync();
    setEditingBlockedShifts(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }
  function saveBlock() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const hasAnything = editingDayBlocked || editingBlockedShifts.length > 0;
    if (!hasAnything) {
      const next = { ...dayBlocks }; delete next[selectedKey]; setDayBlocks(next);
    } else {
      setDayBlocks(prev => ({ ...prev, [selectedKey]: { dayBlocked: editingDayBlocked, blockedShifts: editingBlockedShifts } }));
    }
    setBlockVisible(false);
  }
  function clearBlock() {
    Haptics.selectionAsync();
    const next = { ...dayBlocks }; delete next[selectedKey]; setDayBlocks(next);
    setBlockVisible(false);
  }

  // ── helpers ──
  function getCalInfo(key: string) {
    const shifts = availability[key]?.shifts ?? [];
    const block  = dayBlocks[key];
    const hasAccepted = shifts.some(s => ["ACCEPTED","CONFIRMED"].includes(SHIFT_META[s].status));
    const hasInvited  = shifts.some(s => SHIFT_META[s].status === "INVITED");
    const hasPending  = shifts.some(s => SHIFT_META[s].status === "PENDING");
    return {
      hasAccepted, hasInvited, hasPending, hasAny: shifts.length > 0,
      isDayBlocked: block?.dayBlocked ?? false,
      hasBlockedShifts: (block?.blockedShifts?.length ?? 0) > 0,
    };
  }

  const days  = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const cells = [...Array(firstDay).fill(null), ...days];
  const selJobs  = availability[selectedKey]?.shifts ?? [];
  const selBlock = dayBlocks[selectedKey];
  const isDayBlocked = selBlock?.dayBlocked ?? false;
  const blockedShifts = selBlock?.blockedShifts ?? [];
  const hasAnyBlock = isDayBlocked || blockedShifts.length > 0;

  const markedCount = Object.keys(availability).filter(k =>
    k.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`)
  ).length;

  // ── shared day/cell renderer ──
  function renderCalCell(day: number, compact = false) {
    const key  = toKey(viewYear, viewMonth, day);
    const isToday = key === todayKey;
    const isSel   = key === selectedKey;
    const isPast  = new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dow     = DAYS_SHORT[new Date(viewYear, viewMonth, day).getDay()];
    const { hasAccepted, hasInvited, hasPending, hasAny, isDayBlocked: dayB, hasBlockedShifts } = getCalInfo(key);

    if (compact) {
      // Full-month grid cell
      return (
        <TouchableOpacity
          key={key}
          style={[styles.gridCell, isSel && styles.gridCellSel, isToday && !isSel && styles.gridCellToday, dayB && !isSel && styles.gridCellBlocked]}
          onPress={() => selectDay(key)}
          activeOpacity={0.7}
        >
          {dayB
            ? <Feather name="x" size={14} color={isSel ? "#fff" : "#ef4444"} />
            : <Text style={[styles.gridDayNum, isSel && { color: "#fff" }, isToday && !isSel && { color: "#2563EB", fontWeight: "800" }, isPast && !isSel && { color: "#cbd5e1" }]}>{day}</Text>
          }
          <View style={styles.dotRow}>
            {!dayB && hasAccepted  && <View style={[styles.dot, { backgroundColor: isSel ? "#bbf7d0" : "#22c55e" }]} />}
            {!dayB && hasInvited   && <View style={[styles.dot, { backgroundColor: isSel ? "#fed7aa" : "#f97316" }]} />}
            {!dayB && hasPending   && <View style={[styles.dot, { backgroundColor: isSel ? "#e5e7eb" : "#9ca3af" }]} />}
            {hasBlockedShifts && !dayB && <View style={[styles.dot, { backgroundColor: isSel ? "#fecaca" : "#ef4444" }]} />}
          </View>
        </TouchableOpacity>
      );
    }

    // Horizontal strip cell
    return (
      <TouchableOpacity
        key={key}
        style={[styles.dayCell, isSel && styles.dayCellSel, isToday && !isSel && styles.dayCellToday, dayB && !isSel && styles.dayCellBlocked]}
        onPress={() => selectDay(key)}
        activeOpacity={0.75}
      >
        <Text style={[styles.dayCellDow, isSel && { color: "#fff" }, isPast && !isSel && { color: "#cbd5e1" }, dayB && !isSel && { color: "#ef4444" }]}>{dow}</Text>
        {dayB
          ? <Feather name="x-circle" size={22} color={isSel ? "#fca5a5" : "#ef4444"} />
          : <Text style={[styles.dayCellNum, isSel && { color: "#fff" }, isToday && !isSel && { color: "#2563EB", fontWeight: "800" }, isPast && !isSel && { color: "#cbd5e1" }]}>{day}</Text>
        }
        <View style={styles.dotRow}>
          {!dayB && hasAccepted && <View style={[styles.dot, { backgroundColor: isSel ? "#bbf7d0" : "#22c55e" }]} />}
          {!dayB && hasInvited  && <View style={[styles.dot, { backgroundColor: isSel ? "#fed7aa" : "#f97316" }]} />}
          {!dayB && hasPending && !hasAccepted && !hasInvited && <View style={[styles.dot, { backgroundColor: isSel ? "#e5e7eb" : "#9ca3af" }]} />}
          {hasBlockedShifts && !dayB && <View style={[styles.dot, { backgroundColor: isSel ? "#fca5a5" : "#ef4444" }]} />}
          {!hasAny && !dayB && !hasBlockedShifts && <View style={{ width: 6, height: 6 }} />}
        </View>
      </TouchableOpacity>
    );
  }

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
                ? "You're online by default. Mark specific days or shifts as unavailable below."
                : "You won't receive new job invitations. Tap \"Online\" to start receiving jobs again."}
            </Text>
          </View>
          <TouchableOpacity onPress={dismissTip} style={styles.tipClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={14} color={isOnline ? "#16a34a" : "#f97316"} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── CALENDAR CARD ── */}
      <View style={styles.calCard}>
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
          <>
            <View style={styles.dowRow}>
              {DAYS_SHORT.map(d => <Text key={d} style={styles.dowText}>{d}</Text>)}
            </View>
            <View style={styles.gridWrap}>
              {cells.map((day, idx) =>
                !day
                  ? <View key={`e-${idx}`} style={styles.gridCell} />
                  : renderCalCell(day, true)
              )}
            </View>
          </>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
            {days.map(day => renderCalCell(day, false))}
          </ScrollView>
        )}

        {/* Footer: toggle + legend */}
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
              <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
              <Text style={styles.legendText}>Blocked</Text>
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
        {/* Day header + block status */}
        <View style={styles.dayHeaderRow}>
          <Text style={styles.dayHeader}>{formatDayHeader(selectedKey)}</Text>
          {isDayBlocked && (
            <View style={styles.dayBlockedBadge}>
              <Feather name="slash" size={11} color="#ef4444" />
              <Text style={styles.dayBlockedBadgeText}>Day Blocked</Text>
            </View>
          )}
        </View>

        {/* Day-blocked banner */}
        {isDayBlocked && (
          <View style={styles.blockedDayBanner}>
            <Feather name="alert-circle" size={16} color="#ef4444" />
            <View style={{ flex: 1 }}>
              <Text style={styles.blockedDayBannerTitle}>You're marked unavailable this day</Text>
              <Text style={styles.blockedDayBannerSub}>Employers won't be able to invite you for any shift on this date.</Text>
            </View>
            <TouchableOpacity onPress={openBlockModal} style={styles.blockedEditBtn}>
              <Text style={styles.blockedEditBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}

        {selJobs.length > 0 ? (
          selJobs.map(shift => {
            const meta    = SHIFT_META[shift];
            const sStyle  = STATUS_STYLE[meta.status];
            const isShiftBlocked = !isDayBlocked && blockedShifts.includes(shift);
            return (
              <TouchableOpacity
                key={shift}
                style={[styles.jobCard, isShiftBlocked && styles.jobCardBlocked]}
                onPress={() => openModal()}
                activeOpacity={0.85}
              >
                <View style={[styles.jobBar, { backgroundColor: isShiftBlocked ? "#ef4444" : sStyle.bar }]} />
                <View style={styles.jobBody}>
                  <View style={styles.jobRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={[styles.jobTitle, isShiftBlocked && { color: "#9ca3af" }]}>{meta.jobTitle}</Text>
                      <View style={styles.jobDetailRow}>
                        <Feather name="map-pin" size={11} color={isShiftBlocked ? "#d1d5db" : "#3b82f6"} style={{ marginTop: 1 }} />
                        <Text style={[styles.jobDetailText, isShiftBlocked && { color: "#d1d5db" }]} numberOfLines={1}>{meta.location}</Text>
                      </View>
                      <View style={styles.jobDetailRow}>
                        <Feather name="clock" size={11} color={isShiftBlocked ? "#d1d5db" : "#3b82f6"} />
                        <Text style={[styles.jobDetailText, isShiftBlocked && { color: "#d1d5db" }]}>{meta.startTime} – {meta.endTime}</Text>
                      </View>
                    </View>
                    {isShiftBlocked ? (
                      <View style={styles.shiftBlockedBadge}>
                        <Feather name="slash" size={10} color="#ef4444" />
                        <Text style={styles.shiftBlockedText}>UNAVAILABLE</Text>
                      </View>
                    ) : (
                      <View style={[styles.statusBadge, { backgroundColor: sStyle.bg, borderColor: sStyle.border }]}>
                        <Text style={[styles.statusText, { color: sStyle.color }]}>{meta.status}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : !isDayBlocked ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="calendar" size={30} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No shifts scheduled</Text>
            <Text style={styles.emptySub}>Mark yourself available by tapping the button below</Text>
          </View>
        ) : null}

        {/* Action buttons */}
        {!isDayBlocked && (
          <TouchableOpacity style={styles.addBtn} onPress={() => openModal()} activeOpacity={0.8}>
            <Feather name="plus" size={16} color="#2563EB" />
            <Text style={styles.addBtnText}>Add Availability Block</Text>
          </TouchableOpacity>
        )}

        {/* Mark unavailable button */}
        <TouchableOpacity
          style={[styles.blockBtn, hasAnyBlock && styles.blockBtnActive]}
          onPress={openBlockModal}
          activeOpacity={0.8}
        >
          <Feather name={hasAnyBlock ? "slash" : "x-circle"} size={16} color={hasAnyBlock ? "#ef4444" : "#ef4444"} />
          <Text style={styles.blockBtnText}>
            {hasAnyBlock ? "Edit Unavailability" : "Mark as Unavailable"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ══ AVAILABILITY MODAL ══ */}
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

      {/* ══ BLOCK / UNAVAILABILITY MODAL ══ */}
      <Modal visible={blockVisible} transparent animationType="slide" onRequestClose={() => setBlockVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setBlockVisible(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.blockModalHeader}>
              <View style={styles.blockModalIconBox}>
                <Feather name="slash" size={18} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Mark Unavailable</Text>
                <Text style={styles.modalSub}>{formatDayHeader(selectedKey)}</Text>
              </View>
            </View>

            {/* Block entire day toggle */}
            <View style={[styles.blockDayRow, editingDayBlocked && styles.blockDayRowActive]}>
              <View style={styles.blockDayRowLeft}>
                <View style={[styles.blockDayIcon, { backgroundColor: editingDayBlocked ? "#fee2e2" : "#f3f4f6" }]}>
                  <Feather name="calendar" size={16} color={editingDayBlocked ? "#ef4444" : "#9ca3af"} />
                </View>
                <View>
                  <Text style={[styles.blockDayLabel, editingDayBlocked && { color: "#ef4444" }]}>Block Entire Day</Text>
                  <Text style={styles.blockDaySubLabel}>Unavailable for all shifts this day</Text>
                </View>
              </View>
              <Switch
                value={editingDayBlocked}
                onValueChange={v => { Haptics.selectionAsync(); setEditingDayBlocked(v); if (v) setEditingBlockedShifts([]); }}
                trackColor={{ false: "#e5e7eb", true: "#fca5a5" }}
                thumbColor={editingDayBlocked ? "#ef4444" : "#fff"}
              />
            </View>

            {/* Per-shift blocks (only when day is not fully blocked) */}
            {!editingDayBlocked && (
              <>
                <View style={styles.blockShiftsDivider}>
                  <View style={styles.blockShiftsDividerLine} />
                  <Text style={styles.blockShiftsDividerText}>OR BLOCK SPECIFIC SHIFTS</Text>
                  <View style={styles.blockShiftsDividerLine} />
                </View>

                <View style={styles.blockShiftsList}>
                  {(Object.keys(SHIFT_META) as ShiftType[]).map(shift => {
                    const meta    = SHIFT_META[shift];
                    const blocked = editingBlockedShifts.includes(shift);
                    return (
                      <TouchableOpacity
                        key={shift}
                        style={[styles.blockShiftRow, blocked && styles.blockShiftRowActive]}
                        onPress={() => toggleBlockShift(shift)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.blockShiftIcon, { backgroundColor: blocked ? "#fee2e2" : meta.bg }]}>
                          <Feather name={meta.icon as any} size={15} color={blocked ? "#ef4444" : meta.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.blockShiftName, blocked && { color: "#ef4444" }]}>{shift}</Text>
                          <Text style={styles.blockShiftRange}>{meta.shiftRange}</Text>
                        </View>
                        {blocked ? (
                          <View style={styles.blockShiftBadge}>
                            <Feather name="slash" size={10} color="#ef4444" />
                            <Text style={styles.blockShiftBadgeText}>Blocked</Text>
                          </View>
                        ) : (
                          <View style={styles.blockShiftCheckbox}>
                            <Feather name="circle" size={18} color="#d1d5db" />
                          </View>
                        )}
                        {blocked && (
                          <View style={[styles.blockShiftActiveIcon]}>
                            <Feather name="x-circle" size={18} color="#ef4444" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Day-blocked summary */}
            {editingDayBlocked && (
              <View style={styles.blockSummary}>
                <Feather name="alert-circle" size={13} color="#ef4444" />
                <Text style={styles.blockSummaryText}>
                  Employers <Text style={{ fontWeight: "700" }}>cannot invite you</Text> on this day.
                </Text>
              </View>
            )}
            {!editingDayBlocked && editingBlockedShifts.length > 0 && (
              <View style={styles.blockSummary}>
                <Feather name="info" size={13} color="#f97316" />
                <Text style={[styles.blockSummaryText, { color: "#9a3412" }]}>
                  Blocking <Text style={{ fontWeight: "700" }}>{editingBlockedShifts.join(", ")}</Text> shifts this day.
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.modalActions}>
              {dayBlocks[selectedKey] && (
                <TouchableOpacity style={styles.clearBtn} onPress={clearBlock}>
                  <Feather name="trash-2" size={15} color="#ef4444" />
                  <Text style={styles.clearBtnText}>Remove</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveBtn, {
                  backgroundColor: (editingDayBlocked || editingBlockedShifts.length > 0) ? "#ef4444" : "#9ca3af",
                  flex: 1,
                }]}
                onPress={saveBlock}
              >
                <Feather name="check" size={15} color="#fff" />
                <Text style={styles.saveBtnText}>Save</Text>
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
  header: { backgroundColor: "#0759af", paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2, fontWeight: "500" },
  onlineToggle: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineToggleText: { fontSize: 13, fontWeight: "700" },

  // Tip banner
  tipBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  tipIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", flexShrink: 0, marginTop: 1 },
  tipTitle: { fontSize: 13, fontWeight: "800", marginBottom: 2 },
  tipBody: { fontSize: 12, lineHeight: 18 },
  tipClose: { padding: 4, marginTop: 2 },

  // Calendar
  calCard: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 3 } }) },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  navArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  monthLabel: { fontSize: 15, fontWeight: "800", color: "#111827", letterSpacing: -0.2 },

  dayStrip: { paddingHorizontal: 10, paddingBottom: 4, gap: 4, flexDirection: "row" },
  dayCell: { width: 52, height: 72, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 2, marginHorizontal: 2 },
  dayCellSel: { backgroundColor: "#2563EB", ...Platform.select({ ios: { shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 6 } }) },
  dayCellToday: { backgroundColor: "#eff6ff", borderWidth: 1.5, borderColor: "#bfdbfe" },
  dayCellBlocked: { backgroundColor: "#fff1f2", borderWidth: 1.5, borderColor: "#fecaca" },
  dayCellDow: { fontSize: 10, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.3 },
  dayCellNum: { fontSize: 20, fontWeight: "700", color: "#111827" },

  dowRow: { flexDirection: "row", paddingHorizontal: 8, marginBottom: 2 },
  dowText: { flex: 1, textAlign: "center", fontSize: 10, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4, paddingVertical: 4 },
  gridWrap: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8, paddingBottom: 4 },
  gridCell: { width: "14.28%", aspectRatio: 1, justifyContent: "center", alignItems: "center", borderRadius: 10, gap: 2 },
  gridCellSel: { backgroundColor: "#2563EB" },
  gridCellToday: { backgroundColor: "#eff6ff", borderWidth: 1.5, borderColor: "#bfdbfe" },
  gridCellBlocked: { backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecaca" },
  gridDayNum: { fontSize: 13, fontWeight: "600", color: "#111827" },

  dotRow: { flexDirection: "row", gap: 2, alignItems: "center", height: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },

  calFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  calToggleBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#eff6ff", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  calToggleText: { fontSize: 11, fontWeight: "700", color: "#2563EB" },
  legend: { flexDirection: "row", gap: 10, alignItems: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.3 },

  // Day header + block indicators
  dayHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  dayHeader: { fontSize: 13, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 },
  dayBlockedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fee2e2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  dayBlockedBadgeText: { fontSize: 10, fontWeight: "800", color: "#ef4444", textTransform: "uppercase", letterSpacing: 0.4 },

  blockedDayBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, padding: 12, marginBottom: 12 },
  blockedDayBannerTitle: { fontSize: 13, fontWeight: "700", color: "#dc2626", marginBottom: 2 },
  blockedDayBannerSub: { fontSize: 12, color: "#ef4444", lineHeight: 17 },
  blockedEditBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: "#fee2e2", alignSelf: "flex-start", marginTop: 2 },
  blockedEditBtnText: { fontSize: 12, fontWeight: "700", color: "#dc2626" },

  // Job cards
  jobCard: { backgroundColor: "#fff", borderRadius: 14, marginBottom: 10, flexDirection: "row", overflow: "hidden", borderWidth: 1, borderColor: "#e5e7eb", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 }, android: { elevation: 2 } }) },
  jobCardBlocked: { borderColor: "#fecaca", backgroundColor: "#fffafa", opacity: 0.85 },
  jobBar: { width: 5, flexShrink: 0 },
  jobBody: { flex: 1, padding: 14 },
  jobRow: { flexDirection: "row", alignItems: "flex-start" },
  jobTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 6, letterSpacing: -0.2 },
  jobDetailRow: { flexDirection: "row", alignItems: "flex-start", gap: 5, marginBottom: 3 },
  jobDetailText: { fontSize: 12, color: "#6b7280", fontWeight: "500", flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, flexShrink: 0 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  shiftBlockedBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fff1f2", flexShrink: 0 },
  shiftBlockedText: { fontSize: 9, fontWeight: "800", color: "#ef4444", letterSpacing: 0.3 },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptySub: { fontSize: 13, color: "#9ca3af", textAlign: "center", paddingHorizontal: 20, lineHeight: 20 },

  // Buttons
  addBtn: { marginTop: 4, marginBottom: 10, borderWidth: 2, borderStyle: "dashed", borderColor: "#93c5fd", backgroundColor: "rgba(239,246,255,0.6)", borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  addBtnText: { fontSize: 14, fontWeight: "700", color: "#2563EB" },
  blockBtn: { borderWidth: 2, borderStyle: "dashed", borderColor: "#fca5a5", backgroundColor: "rgba(255,241,242,0.6)", borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  blockBtnActive: { borderColor: "#ef4444", backgroundColor: "#fff1f2" },
  blockBtnText: { fontSize: 14, fontWeight: "700", color: "#ef4444" },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20 }, android: { elevation: 20 } }) },
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

  // Block modal specific
  blockModalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  blockModalIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fee2e2", justifyContent: "center", alignItems: "center" },
  blockDayRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f9fafb", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12 },
  blockDayRowActive: { backgroundColor: "#fff1f2", borderColor: "#fecaca" },
  blockDayRowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  blockDayIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  blockDayLabel: { fontSize: 14, fontWeight: "700", color: "#374151" },
  blockDaySubLabel: { fontSize: 11, color: "#9ca3af", marginTop: 1 },

  blockShiftsDivider: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  blockShiftsDividerLine: { flex: 1, height: 1, backgroundColor: "#f1f5f9" },
  blockShiftsDividerText: { fontSize: 9, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.8, textTransform: "uppercase" },

  blockShiftsList: { gap: 8, marginBottom: 12 },
  blockShiftRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  blockShiftRowActive: { backgroundColor: "#fff1f2", borderColor: "#fecaca" },
  blockShiftIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  blockShiftName: { fontSize: 13, fontWeight: "700", color: "#374151" },
  blockShiftRange: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  blockShiftBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: "#fee2e2" },
  blockShiftBadgeText: { fontSize: 10, fontWeight: "700", color: "#ef4444" },
  blockShiftCheckbox: { width: 22, alignItems: "center" },
  blockShiftActiveIcon: { position: "absolute", right: 12 },

  blockSummary: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecaca", padding: 12, borderRadius: 12, marginBottom: 12 },
  blockSummaryText: { color: "#dc2626", fontSize: 13, flex: 1 },

  modalActions: { flexDirection: "row", gap: 10 },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: "#ef4444" },
  clearBtnText: { color: "#ef4444", fontSize: 14, fontWeight: "700" },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

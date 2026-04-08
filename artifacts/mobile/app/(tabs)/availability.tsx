import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

const DAYS_SHORT  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAYS_LONG   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

type TimeSlot = { id: string; startH: number; startM: number; endH: number; endM: number };
type AvailabilityEntry = { slots: TimeSlot[] };
type BlockEntry = { dayBlocked: boolean; blockedSlots: TimeSlot[] };

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
function fmt(h: number, min: number) {
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(min).padStart(2, "0")} ${ap}`;
}
function uid() { return Math.random().toString(36).slice(2, 9); }

const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function TimePicker({
  label, hour, minute, onHourChange, onMinuteChange,
}: {
  label: string; hour: number; minute: number;
  onHourChange: (h: number) => void; onMinuteChange: (m: number) => void;
}) {
  const ampm = hour >= 12 ? "PM" : "AM";
  const display12 = hour % 12 === 0 ? 12 : hour % 12;

  function stepHour(dir: 1 | -1) {
    Haptics.selectionAsync();
    onHourChange((hour + dir + 24) % 24);
  }
  function stepMinute(dir: 1 | -1) {
    Haptics.selectionAsync();
    const idx = MINUTES.indexOf(minute);
    const next = (idx + dir + MINUTES.length) % MINUTES.length;
    onMinuteChange(MINUTES[next]);
  }
  function toggleAmPm() {
    Haptics.selectionAsync();
    onHourChange((hour + 12) % 24);
  }

  return (
    <View style={tpStyles.wrap}>
      <Text style={tpStyles.label}>{label}</Text>
      <View style={tpStyles.row}>
        {/* Hour */}
        <View style={tpStyles.col}>
          <TouchableOpacity style={tpStyles.arrow} onPress={() => stepHour(1)}>
            <Feather name="chevron-up" size={18} color="#2563EB" />
          </TouchableOpacity>
          <Text style={tpStyles.timeNum}>{String(display12).padStart(2, "0")}</Text>
          <TouchableOpacity style={tpStyles.arrow} onPress={() => stepHour(-1)}>
            <Feather name="chevron-down" size={18} color="#2563EB" />
          </TouchableOpacity>
        </View>

        <Text style={tpStyles.colon}>:</Text>

        {/* Minute */}
        <View style={tpStyles.col}>
          <TouchableOpacity style={tpStyles.arrow} onPress={() => stepMinute(1)}>
            <Feather name="chevron-up" size={18} color="#2563EB" />
          </TouchableOpacity>
          <Text style={tpStyles.timeNum}>{String(minute).padStart(2, "0")}</Text>
          <TouchableOpacity style={tpStyles.arrow} onPress={() => stepMinute(-1)}>
            <Feather name="chevron-down" size={18} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* AM / PM */}
        <TouchableOpacity style={tpStyles.ampmBox} onPress={toggleAmPm} activeOpacity={0.8}>
          <Text style={[tpStyles.ampmHalf, ampm === "AM" && tpStyles.ampmActive]}>AM</Text>
          <Text style={[tpStyles.ampmHalf, ampm === "PM" && tpStyles.ampmActive]}>PM</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const tpStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center" },
  label: { fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  col: { alignItems: "center", gap: 4 },
  arrow: { width: 32, height: 28, justifyContent: "center", alignItems: "center" },
  timeNum: { fontSize: 28, fontWeight: "800", color: "#0f172a", width: 42, textAlign: "center" },
  colon: { fontSize: 26, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  ampmBox: { backgroundColor: "#f1f5f9", borderRadius: 10, overflow: "hidden", marginLeft: 4 },
  ampmHalf: { paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, fontWeight: "700", color: "#9ca3af" },
  ampmActive: { backgroundColor: "#2563EB", color: "#fff" },
});

export default function AvailabilityTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const today    = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [availability, setAvailability] = useState<Record<string, AvailabilityEntry>>({});
  const [dayBlocks,    setDayBlocks]    = useState<Record<string, BlockEntry>>({});
  const [selectedKey,  setSelectedKey]  = useState(todayKey);
  const [showFullCal,  setShowFullCal]  = useState(false);

  // ── Add-time modal ──
  const [addVisible,  setAddVisible]  = useState(false);
  const [startH, setStartH] = useState(9);
  const [startM, setStartM] = useState(0);
  const [endH,   setEndH]   = useState(17);
  const [endM,   setEndM]   = useState(0);

  function openAddModal() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStartH(9); setStartM(0); setEndH(17); setEndM(0);
    setAddVisible(true);
  }
  function saveSlot() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const slot: TimeSlot = { id: uid(), startH, startM, endH, endM };
    setAvailability(prev => {
      const existing = prev[selectedKey]?.slots ?? [];
      return { ...prev, [selectedKey]: { slots: [...existing, slot] } };
    });
    setAddVisible(false);
  }
  function deleteSlot(id: string) {
    Haptics.selectionAsync();
    setAvailability(prev => {
      const slots = (prev[selectedKey]?.slots ?? []).filter(s => s.id !== id);
      if (slots.length === 0) {
        const next = { ...prev }; delete next[selectedKey]; return next;
      }
      return { ...prev, [selectedKey]: { slots } };
    });
  }

  // ── Block modal ──
  const [blockVisible,      setBlockVisible]      = useState(false);
  const [editingDayBlocked, setEditingDayBlocked] = useState(false);

  function openBlockModal() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingDayBlocked(dayBlocks[selectedKey]?.dayBlocked ?? false);
    setBlockVisible(true);
  }
  function saveBlock() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!editingDayBlocked) {
      const next = { ...dayBlocks }; delete next[selectedKey]; setDayBlocks(next);
    } else {
      setDayBlocks(prev => ({ ...prev, [selectedKey]: { dayBlocked: true, blockedSlots: [] } }));
    }
    setBlockVisible(false);
  }
  function clearBlock() {
    const next = { ...dayBlocks }; delete next[selectedKey]; setDayBlocks(next);
    setBlockVisible(false);
  }

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

  const days  = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const cells = [...Array(firstDay).fill(null), ...days];

  const selSlots     = availability[selectedKey]?.slots ?? [];
  const selBlock     = dayBlocks[selectedKey];
  const isDayBlocked = selBlock?.dayBlocked ?? false;

  const markedCount = Object.keys(availability).filter(k =>
    k.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`)
  ).length;

  function getCalFlags(key: string) {
    const hasSlots  = (availability[key]?.slots?.length ?? 0) > 0;
    const isDayB    = dayBlocks[key]?.dayBlocked ?? false;
    return { hasSlots, isDayB };
  }

  function renderDayCell(day: number, compact = false) {
    const key   = toKey(viewYear, viewMonth, day);
    const isToday = key === todayKey;
    const isSel   = key === selectedKey;
    const dow     = DAYS_SHORT[new Date(viewYear, viewMonth, day).getDay()];
    const { hasSlots, isDayB } = getCalFlags(key);

    if (compact) {
      return (
        <TouchableOpacity
          key={key}
          style={[styles.gridCell, isSel && styles.gridCellSel, isToday && !isSel && styles.gridCellToday, isDayB && !isSel && styles.gridCellBlocked]}
          onPress={() => selectDay(key)}
          activeOpacity={0.7}
        >
          {isDayB
            ? <Feather name="x" size={14} color={isSel ? "#fff" : "#ef4444"} />
            : <Text style={[styles.gridDayNum, isSel && { color: "#fff" }, isToday && !isSel && { color: "#2563EB", fontWeight: "800" }]}>{day}</Text>
          }
          {hasSlots && !isDayB && (
            <View style={[styles.dot, { backgroundColor: isSel ? "#bfdbfe" : "#2563EB" }]} />
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={key}
        style={[styles.dayCell, isSel && styles.dayCellSel, isToday && !isSel && styles.dayCellToday, isDayB && !isSel && styles.dayCellBlocked]}
        onPress={() => selectDay(key)}
        activeOpacity={0.75}
      >
        <Text style={[styles.dayCellDow, isSel && { color: "#fff" }, isDayB && !isSel && { color: "#ef4444" }]}>{dow}</Text>
        {isDayB
          ? <Feather name="x-circle" size={22} color={isSel ? "#fca5a5" : "#ef4444"} />
          : <Text style={[styles.dayCellNum, isSel && { color: "#fff" }, isToday && !isSel && { color: "#2563EB", fontWeight: "800" }]}>{day}</Text>
        }
        {hasSlots && !isDayB
          ? <View style={[styles.dot, { backgroundColor: isSel ? "#bfdbfe" : "#2563EB" }]} />
          : <View style={{ width: 6, height: 6 }} />
        }
      </TouchableOpacity>
    );
  }

  const isTimeValid = (() => {
    const s = startH * 60 + startM;
    const e = endH   * 60 + endM;
    return e > s;
  })();

  // Status: unavailable only if the selected day is blocked
  const selectedBlock = dayBlocks[selectedKey];
  const isUnavailable = !!(selectedBlock?.dayBlocked || (selectedBlock?.blockedSlots?.length ?? 0) > 0);

  return (
    <View style={[styles.root, { backgroundColor: "#f1f5f9" }]}>

      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View>
          <Text style={styles.headerTitle}>My Availability</Text>
          {markedCount > 0 && (
            <Text style={styles.headerSub}>{markedCount} day{markedCount !== 1 ? "s" : ""} marked this month</Text>
          )}
        </View>
        <View style={[styles.availableStatusPill, isUnavailable && styles.unavailableStatusPill]}>
          <View style={[styles.availableStatusDot, isUnavailable && styles.unavailableStatusDot]} />
          <Text style={[styles.availableStatusText, isUnavailable && styles.unavailableStatusText]}>
            {isUnavailable ? "Unavailable" : "Available"}
          </Text>
        </View>
      </View>

      {/* ── STATUS BANNER ── */}
      <View style={[styles.tipBanner, isUnavailable && styles.tipBannerUnavailable]}>
        <View style={[styles.tipIcon, isUnavailable && styles.tipIconUnavailable]}>
          <Feather name={isUnavailable ? "x-circle" : "check-circle"} size={16} color={isUnavailable ? "#dc2626" : "#16a34a"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tipTitle, { color: isUnavailable ? "#b91c1c" : "#15803d" }]}>
            {isUnavailable ? "You have unavailable days" : "You're available for jobs"}
          </Text>
          <Text style={[styles.tipBody, { color: isUnavailable ? "#991b1b" : "#166534" }]}>
            {isUnavailable
              ? "Some days are blocked. Employers won't be able to book you on those days."
              : "Employers can see your profile. Tap any day to add or update your availability."}
          </Text>
        </View>
      </View>

      {/* ── CALENDAR ── */}
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
                !day ? <View key={`e-${idx}`} style={styles.gridCell} /> : renderDayCell(day, true)
              )}
            </View>
          </>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
            {days.map(day => renderDayCell(day, false))}
          </ScrollView>
        )}

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
              <View style={[styles.legendDot, { backgroundColor: "#2563EB" }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
              <Text style={styles.legendText}>Blocked</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── DAY VIEW ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dayHeaderRow}>
          <Text style={styles.dayHeader}>{formatDayHeader(selectedKey)}</Text>
          {isDayBlocked && (
            <View style={styles.dayBlockedBadge}>
              <Feather name="slash" size={11} color="#ef4444" />
              <Text style={styles.dayBlockedBadgeText}>Blocked</Text>
            </View>
          )}
        </View>

        {isDayBlocked && (
          <View style={styles.blockedDayBanner}>
            <Feather name="alert-circle" size={16} color="#ef4444" />
            <View style={{ flex: 1 }}>
              <Text style={styles.blockedDayBannerTitle}>Unavailable all day</Text>
              <Text style={styles.blockedDayBannerSub}>Employers won't be able to invite you on this date.</Text>
            </View>
            <TouchableOpacity onPress={openBlockModal} style={styles.blockedEditBtn}>
              <Text style={styles.blockedEditBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Time slot cards */}
        {selSlots.length > 0 ? (
          selSlots
            .sort((a, b) => a.startH * 60 + a.startM - (b.startH * 60 + b.startM))
            .map(slot => (
              <View key={slot.id} style={styles.slotCard}>
                <View style={styles.slotTimeBox}>
                  <Text style={styles.slotStartTime}>{fmt(slot.startH, slot.startM)}</Text>
                  <View style={styles.slotArrow}>
                    <Feather name="arrow-right" size={12} color="#94a3b8" />
                  </View>
                  <Text style={styles.slotEndTime}>{fmt(slot.endH, slot.endM)}</Text>
                </View>
                <View style={styles.slotMeta}>
                  <Feather name="clock" size={12} color="#94a3b8" />
                  <Text style={styles.slotDuration}>
                    {(() => {
                      const mins = (slot.endH * 60 + slot.endM) - (slot.startH * 60 + slot.startM);
                      if (mins <= 0) return "—";
                      const h = Math.floor(mins / 60);
                      const m = mins % 60;
                      return h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
                    })()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.slotDelete}
                  onPress={() => deleteSlot(slot.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="trash-2" size={15} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
        ) : !isDayBlocked ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="clock" size={28} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No time slots</Text>
            <Text style={styles.emptySub}>Tap "Add Time Slot" to set when you're available</Text>
          </View>
        ) : null}

        {/* Add time slot button */}
        {!isDayBlocked && (
          <TouchableOpacity style={styles.addSlotBtn} onPress={openAddModal} activeOpacity={0.8}>
            <Feather name="plus" size={16} color="#2563EB" />
            <Text style={styles.addSlotBtnText}>Add Time Slot</Text>
          </TouchableOpacity>
        )}

        {/* Mark unavailable button */}
        <TouchableOpacity
          style={[styles.blockBtn, isDayBlocked && styles.blockBtnActive]}
          onPress={openBlockModal}
          activeOpacity={0.8}
        >
          <Feather name={isDayBlocked ? "slash" : "x-circle"} size={16} color="#ef4444" />
          <Text style={styles.blockBtnText}>{isDayBlocked ? "Edit Unavailability" : "Mark Day as Unavailable"}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ══ ADD TIME SLOT MODAL ══ */}
      <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setAddVisible(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{formatDayHeader(selectedKey)}</Text>
            <Text style={styles.modalSub}>Select your available time range</Text>

            {/* Time pickers */}
            <View style={styles.pickersRow}>
              <TimePicker label="Start Time" hour={startH} minute={startM} onHourChange={setStartH} onMinuteChange={setStartM} />
              <View style={styles.pickerDivider} />
              <TimePicker label="End Time"   hour={endH}   minute={endM}   onHourChange={setEndH}   onMinuteChange={setEndM}   />
            </View>

            {/* Preview */}
            <View style={[styles.slotPreview, !isTimeValid && { backgroundColor: "#fff1f2", borderColor: "#fecaca" }]}>
              <Feather name={isTimeValid ? "clock" : "alert-circle"} size={14} color={isTimeValid ? "#2563EB" : "#ef4444"} />
              {isTimeValid ? (
                <Text style={styles.slotPreviewText}>
                  Available <Text style={{ fontWeight: "800" }}>{fmt(startH, startM)}</Text> to <Text style={{ fontWeight: "800" }}>{fmt(endH, endM)}</Text>
                </Text>
              ) : (
                <Text style={[styles.slotPreviewText, { color: "#ef4444" }]}>End time must be after start time</Text>
              )}
            </View>

            {/* Existing slots for this day */}
            {selSlots.length > 0 && (
              <View style={styles.existingSlots}>
                <Text style={styles.existingSlotsLabel}>Already added today</Text>
                {selSlots.map(s => (
                  <View key={s.id} style={styles.existingSlotRow}>
                    <Feather name="check-circle" size={12} color="#22c55e" />
                    <Text style={styles.existingSlotText}>{fmt(s.startH, s.startM)} – {fmt(s.endH, s.endM)}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: isTimeValid ? "#2563EB" : "#d1d5db" }]}
              onPress={isTimeValid ? saveSlot : undefined}
              activeOpacity={isTimeValid ? 0.85 : 1}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.saveBtnText}>Add Time Slot</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ BLOCK MODAL ══ */}
      <Modal visible={blockVisible} transparent animationType="slide" onRequestClose={() => setBlockVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setBlockVisible(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.blockModalHeader}>
              <View style={styles.blockModalIconBox}>
                <Feather name="slash" size={18} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Mark Unavailable</Text>
                <Text style={styles.modalSub}>{formatDayHeader(selectedKey)}</Text>
              </View>
            </View>

            <View style={[styles.blockDayRow, editingDayBlocked && styles.blockDayRowActive]}>
              <View style={styles.blockDayRowLeft}>
                <View style={[styles.blockDayIcon, { backgroundColor: editingDayBlocked ? "#fee2e2" : "#f3f4f6" }]}>
                  <Feather name="calendar" size={16} color={editingDayBlocked ? "#ef4444" : "#9ca3af"} />
                </View>
                <View>
                  <Text style={[styles.blockDayLabel, editingDayBlocked && { color: "#ef4444" }]}>Block Entire Day</Text>
                  <Text style={styles.blockDaySubLabel}>Unavailable for all time slots this day</Text>
                </View>
              </View>
              <Switch
                value={editingDayBlocked}
                onValueChange={v => { Haptics.selectionAsync(); setEditingDayBlocked(v); }}
                trackColor={{ false: "#e5e7eb", true: "#fca5a5" }}
                thumbColor={editingDayBlocked ? "#ef4444" : "#fff"}
              />
            </View>

            {editingDayBlocked && (
              <View style={styles.blockSummary}>
                <Feather name="alert-circle" size={13} color="#ef4444" />
                <Text style={styles.blockSummaryText}>
                  Employers <Text style={{ fontWeight: "700" }}>cannot invite you</Text> on this day.
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              {dayBlocks[selectedKey] && (
                <TouchableOpacity style={styles.clearBtn} onPress={clearBlock}>
                  <Feather name="trash-2" size={15} color="#ef4444" />
                  <Text style={styles.clearBtnText}>Remove</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: editingDayBlocked ? "#ef4444" : "#9ca3af", flex: 1 }]}
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

  header: { backgroundColor: "#0759af", paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2, fontWeight: "500" },
  availableStatusPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(34,197,94,0.18)", borderWidth: 1, borderColor: "rgba(74,222,128,0.4)" },
  availableStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" },
  availableStatusText: { fontSize: 13, fontWeight: "700", color: "#4ade80" },
  unavailableStatusPill: { backgroundColor: "rgba(239,68,68,0.18)", borderColor: "rgba(239,68,68,0.4)" },
  unavailableStatusDot: { backgroundColor: "#f87171" },
  unavailableStatusText: { color: "#f87171" },

  tipBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, backgroundColor: "#f0fdf4", borderBottomColor: "#bbf7d0" },
  tipBannerUnavailable: { backgroundColor: "#fef2f2", borderBottomColor: "#fecaca" },
  tipIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#dcfce7", justifyContent: "center", alignItems: "center", flexShrink: 0, marginTop: 1 },
  tipIconUnavailable: { backgroundColor: "#fee2e2" },
  tipTitle: { fontSize: 13, fontWeight: "800", marginBottom: 2 },
  tipBody: { fontSize: 12, lineHeight: 18 },

  calCard: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 3 } }) },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  navArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  monthLabel: { fontSize: 15, fontWeight: "800", color: "#111827", letterSpacing: -0.2 },

  dayStrip: { paddingHorizontal: 10, paddingBottom: 4, flexDirection: "row" },
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

  dot: { width: 6, height: 6, borderRadius: 3 },

  calFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  calToggleBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#eff6ff", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  calToggleText: { fontSize: 11, fontWeight: "700", color: "#2563EB" },
  legend: { flexDirection: "row", gap: 10, alignItems: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.3 },

  dayHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  dayHeader: { fontSize: 13, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 },
  dayBlockedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fee2e2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  dayBlockedBadgeText: { fontSize: 10, fontWeight: "800", color: "#ef4444", textTransform: "uppercase", letterSpacing: 0.4 },

  blockedDayBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, padding: 12, marginBottom: 12 },
  blockedDayBannerTitle: { fontSize: 13, fontWeight: "700", color: "#dc2626", marginBottom: 2 },
  blockedDayBannerSub: { fontSize: 12, color: "#ef4444", lineHeight: 17 },
  blockedEditBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: "#fee2e2", alignSelf: "flex-start", marginTop: 2 },
  blockedEditBtnText: { fontSize: 12, fontWeight: "700", color: "#dc2626" },

  // Slot cards
  slotCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 }, android: { elevation: 2 } }),
  },
  slotTimeBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  slotStartTime: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  slotArrow: { paddingHorizontal: 2 },
  slotEndTime: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  slotMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  slotDuration: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  slotDelete: { padding: 6 },

  emptyState: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptySub: { fontSize: 13, color: "#9ca3af", textAlign: "center", paddingHorizontal: 20, lineHeight: 20 },

  addSlotBtn: { marginBottom: 10, borderWidth: 2, borderStyle: "dashed", borderColor: "#93c5fd", backgroundColor: "rgba(239,246,255,0.6)", borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  addSlotBtnText: { fontSize: 14, fontWeight: "700", color: "#2563EB" },

  blockBtn: { borderWidth: 2, borderStyle: "dashed", borderColor: "#fca5a5", backgroundColor: "rgba(255,241,242,0.6)", borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  blockBtnActive: { borderColor: "#ef4444", backgroundColor: "#fff1f2" },
  blockBtnText: { fontSize: 14, fontWeight: "700", color: "#ef4444" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20 }, android: { elevation: 20 } }) },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", letterSpacing: -0.3, marginBottom: 2 },
  modalSub: { fontSize: 13, color: "#94a3b8", marginBottom: 16 },

  pickersRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16, backgroundColor: "#f8fafc", borderRadius: 16, padding: 16 },
  pickerDivider: { width: 1, backgroundColor: "#e5e7eb", marginHorizontal: 12, alignSelf: "stretch" },

  slotPreview: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", padding: 12, borderRadius: 12, marginBottom: 12 },
  slotPreviewText: { color: "#1d4ed8", fontSize: 13, flex: 1 },

  existingSlots: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 12, marginBottom: 12, gap: 6 },
  existingSlotsLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  existingSlotRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  existingSlotText: { fontSize: 13, color: "#374151", fontWeight: "500" },

  blockModalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  blockModalIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fee2e2", justifyContent: "center", alignItems: "center" },
  blockDayRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f9fafb", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12 },
  blockDayRowActive: { backgroundColor: "#fff1f2", borderColor: "#fecaca" },
  blockDayRowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  blockDayIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  blockDayLabel: { fontSize: 14, fontWeight: "700", color: "#374151" },
  blockDaySubLabel: { fontSize: 11, color: "#9ca3af", marginTop: 1 },

  blockSummary: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecaca", padding: 12, borderRadius: 12, marginBottom: 12 },
  blockSummaryText: { color: "#dc2626", fontSize: 13, flex: 1 },

  modalActions: { flexDirection: "row", gap: 10 },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: "#ef4444" },
  clearBtnText: { color: "#ef4444", fontSize: 14, fontWeight: "700" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

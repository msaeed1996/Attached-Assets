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
import * as Haptics from "expo-haptics";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

interface ShiftEvent {
  id: string;
  time: string;
  endTime: string;
  jobTitle: string;
  company: string;
  status: "accepted" | "invited" | "missed";
  pay: number;
  payType: string;
}

type WeekSchedule = Record<number, ShiftEvent[]>;

const SCHEDULE: WeekSchedule = {
  0: [
    {
      id: "e1",
      time: "8:00 AM",
      endTime: "4:00 PM",
      jobTitle: "Warehouse Associate",
      company: "Amazon Logistics",
      status: "accepted",
      pay: 22,
      payType: "hourly",
    },
  ],
  1: [
    {
      id: "e2",
      time: "9:00 AM",
      endTime: "5:00 PM",
      jobTitle: "Office Receptionist",
      company: "MetaLaw LLP",
      status: "accepted",
      pay: 18,
      payType: "hourly",
    },
  ],
  2: [
    {
      id: "e3",
      time: "4:00 PM",
      endTime: "12:00 AM",
      jobTitle: "Lead Bartender",
      company: "The Grand Hotel",
      status: "accepted",
      pay: 30,
      payType: "hourly",
    },
  ],
  3: [],
  4: [
    {
      id: "e4",
      time: "10:00 AM",
      endTime: "6:00 PM",
      jobTitle: "Retail Floor Associate",
      company: "Nordstrom Rack",
      status: "invited",
      pay: 16,
      payType: "hourly",
    },
  ],
  5: [
    {
      id: "e5",
      time: "6:00 PM",
      endTime: "11:00 PM",
      jobTitle: "Event Staff",
      company: "Prestige Events Co.",
      status: "accepted",
      pay: 250,
      payType: "daily",
    },
  ],
  6: [
    {
      id: "e6",
      time: "2:00 PM",
      endTime: "8:00 PM",
      jobTitle: "Forklift Operator",
      company: "FreshFoods Distribution",
      status: "invited",
      pay: 26,
      payType: "hourly",
    },
  ],
};

function getWeekDates(baseDate: Date) {
  const day = baseDate.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

export default function TimesheetScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const today = new Date();
  const [baseDate, setBaseDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const weekDates = getWeekDates(baseDate);
  const selectedDayIndex = weekDates.findIndex((d) => isSameDay(d, selectedDate));
  const dayEvents: ShiftEvent[] = SCHEDULE[selectedDayIndex === -1 ? 0 : selectedDayIndex] ?? [];

  function prevMonth() {
    Haptics.selectionAsync();
    const d = new Date(currentYear, currentMonth - 1, 1);
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
    const newBase = new Date(baseDate);
    newBase.setMonth(newBase.getMonth() - 1);
    setBaseDate(newBase);
    setSelectedDate(newBase);
  }

  function nextMonth() {
    Haptics.selectionAsync();
    const d = new Date(currentYear, currentMonth + 1, 1);
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
    const newBase = new Date(baseDate);
    newBase.setMonth(newBase.getMonth() + 1);
    setBaseDate(newBase);
    setSelectedDate(newBase);
  }

  function selectDay(date: Date, index: number) {
    Haptics.selectionAsync();
    setSelectedDate(date);
  }

  const hasEvent = (index: number) => (SCHEDULE[index] ?? []).length > 0;
  const getEventStatus = (index: number): "accepted" | "invited" | null => {
    const evts = SCHEDULE[index] ?? [];
    if (evts.length === 0) return null;
    if (evts.some((e) => e.status === "invited")) return "invited";
    return "accepted";
  };

  return (
    <View style={styles.root}>
      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule</Text>

        {/* Month navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.monthArrow} onPress={prevMonth}>
            <Feather name="chevron-left" size={16} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity style={styles.monthArrow} onPress={nextMonth}>
            <Feather name="chevron-right" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── WEEK STRIP ── */}
      <View style={styles.weekStrip}>
        {weekDates.map((date, i) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const status = getEventStatus(i);

          return (
            <TouchableOpacity
              key={i}
              style={styles.dayCol}
              onPress={() => selectDay(date, i)}
              activeOpacity={0.75}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                {DAY_LABELS[i]}
              </Text>
              <View style={[styles.dayPill, isSelected && styles.dayPillSelected, isToday && !isSelected && styles.dayPillToday]}>
                <Text style={[styles.dayNum, isSelected && styles.dayNumSelected, isToday && !isSelected && styles.dayNumToday]}>
                  {date.getDate()}
                </Text>
              </View>
              {status ? (
                <View style={[styles.eventDot, { backgroundColor: status === "accepted" ? "#10b981" : "#f59e0b" }]} />
              ) : (
                <View style={styles.eventDotEmpty} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.divider]} />

      {/* ── LEGEND ── */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#10b981" }]} />
          <Text style={styles.legendText}>Accepted</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#f59e0b" }]} />
          <Text style={styles.legendText}>Invited</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#d1d5db" }]} />
          <Text style={styles.legendText}>No Shift</Text>
        </View>
      </View>

      {/* ── TIMELINE ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.timeline, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {dayEvents.length === 0 ? (
          <View style={styles.emptyDay}>
            <View style={styles.emptyIconWrap}>
              <Feather name="calendar" size={28} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No shifts scheduled</Text>
            <Text style={styles.emptyText}>
              You're free on this day. Add an availability block to get discovered.
            </Text>
            <TouchableOpacity style={styles.addBlockBtnInline}>
              <Feather name="plus" size={15} color="#10b981" />
              <Text style={styles.addBlockBtnInlineText}>Add Availability Block</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {dayEvents.map((event) => (
              <View key={event.id} style={styles.timelineRow}>
                {/* Time label */}
                <View style={styles.timeCol}>
                  <Text style={styles.timeText}>{event.time}</Text>
                </View>

                {/* Connector */}
                <View style={styles.connectorCol}>
                  <View style={[styles.connectorDot, { backgroundColor: event.status === "accepted" ? "#10b981" : "#f59e0b" }]} />
                  <View style={[styles.connectorLine, { backgroundColor: event.status === "accepted" ? "#d1fae5" : "#fef3c7" }]} />
                </View>

                {/* Event card */}
                <View style={[styles.eventCard, {
                  borderLeftColor: event.status === "accepted" ? "#10b981" : "#f59e0b",
                }]}>
                  <View style={styles.eventCardTop}>
                    <Text style={styles.eventTitle}>{event.jobTitle}</Text>
                    <View style={[styles.statusChip, {
                      backgroundColor: event.status === "accepted" ? "#dcfce7" : "#fef3c7",
                    }]}>
                      <Text style={[styles.statusChipText, {
                        color: event.status === "accepted" ? "#10b981" : "#f59e0b",
                      }]}>
                        {event.status === "accepted" ? "Accepted" : "Invited"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.eventMeta}>
                    {event.company} • {event.time} – {event.endTime}
                  </Text>
                  <View style={styles.eventFooter}>
                    <View style={styles.eventPayRow}>
                      <Feather name="dollar-sign" size={12} color="#10b981" />
                      <Text style={styles.eventPay}>
                        {event.payType === "daily"
                          ? `$${event.pay} flat`
                          : `$${event.pay}/hr`}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => Haptics.selectionAsync()}>
                      <Text style={styles.viewDetails}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* Earnings summary for day */}
            <View style={styles.daySummary}>
              <View style={styles.daySummaryItem}>
                <Text style={styles.daySummaryValue}>{dayEvents.length}</Text>
                <Text style={styles.daySummaryLabel}>Shift{dayEvents.length !== 1 ? "s" : ""}</Text>
              </View>
              <View style={styles.daySummaryDivider} />
              <View style={styles.daySummaryItem}>
                <Text style={styles.daySummaryValue}>
                  {dayEvents.reduce((s, e) => {
                    if (e.payType === "daily") return s + e.pay;
                    const hrs = parseFloat(e.endTime) - parseFloat(e.time) || 8;
                    return s + e.pay * 8;
                  }, 0) > 0
                    ? `$${dayEvents.reduce((s, e) => s + (e.payType === "daily" ? e.pay : e.pay * 8), 0)}`
                    : "—"}
                </Text>
                <Text style={styles.daySummaryLabel}>Est. Earnings</Text>
              </View>
              <View style={styles.daySummaryDivider} />
              <View style={styles.daySummaryItem}>
                <Text style={[styles.daySummaryValue, { color: dayEvents.every(e => e.status === "accepted") ? "#10b981" : "#f59e0b" }]}>
                  {dayEvents.every(e => e.status === "accepted") ? "Confirmed" : "Pending"}
                </Text>
                <Text style={styles.daySummaryLabel}>Status</Text>
              </View>
            </View>
          </>
        )}

        {/* Add availability block */}
        <TouchableOpacity
          style={styles.addBlockBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/availability");
          }}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={16} color="#9ca3af" />
          <Text style={styles.addBlockText}>Add Availability Block</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.4,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  monthArrow: {
    padding: 2,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    minWidth: 110,
    textAlign: "center",
  },
  weekStrip: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.4,
  },
  dayLabelSelected: {
    color: "#10b981",
  },
  dayPill: {
    width: 36,
    height: 42,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  dayPillSelected: {
    backgroundColor: "#10b981",
  },
  dayPillToday: {
    backgroundColor: "#f0fdf4",
  },
  dayNum: {
    fontSize: 17,
    fontWeight: "700",
    color: "#374151",
  },
  dayNumSelected: {
    color: "#fff",
  },
  dayNumToday: {
    color: "#10b981",
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eventDotEmpty: {
    width: 6,
    height: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e7eb",
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  timeline: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 0,
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 0,
  },
  timeCol: {
    width: 68,
    paddingTop: 2,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  connectorCol: {
    width: 24,
    alignItems: "center",
  },
  connectorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    zIndex: 1,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    borderRadius: 1,
  },
  eventCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginLeft: 12,
    borderLeftWidth: 3,
    gap: 6,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  eventCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  eventMeta: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  eventPayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  eventPay: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10b981",
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10b981",
  },
  daySummary: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  daySummaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  daySummaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e7eb",
    alignSelf: "stretch",
  },
  daySummaryValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  daySummaryLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  emptyDay: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 20,
  },
  addBlockBtnInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  addBlockBtnInlineText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10b981",
  },
  addBlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
    backgroundColor: "#fff",
  },
  addBlockText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
  },
});

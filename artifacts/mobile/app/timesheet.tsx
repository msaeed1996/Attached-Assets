import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_W } = Dimensions.get("window");

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_SHORT = ["MON","TUE","WED","THU","FRI","SAT","SUN"];

interface ShiftEvent {
  id: string;
  startTime: string;
  endTime: string;
  startHour: number;
  endHour: number;
  jobTitle: string;
  company: string;
  location: string;
  status: "confirmed" | "pending" | "completed" | "missed";
  pay: number;
  payType: "hourly" | "flat";
  hoursLogged?: number;
}

type WeekSchedule = Record<number, ShiftEvent[]>;

const SCHEDULE: WeekSchedule = {
  0: [
    {
      id: "e1",
      startTime: "8:00 AM",
      endTime: "4:00 PM",
      startHour: 8,
      endHour: 16,
      jobTitle: "Warehouse Associate",
      company: "Amazon Logistics",
      location: "Brooklyn, NY",
      status: "completed",
      pay: 22,
      payType: "hourly",
      hoursLogged: 8,
    },
  ],
  1: [
    {
      id: "e2",
      startTime: "9:00 AM",
      endTime: "5:00 PM",
      startHour: 9,
      endHour: 17,
      jobTitle: "Office Receptionist",
      company: "MetaLaw LLP",
      location: "Midtown, NY",
      status: "completed",
      pay: 18,
      payType: "hourly",
      hoursLogged: 8,
    },
  ],
  2: [
    {
      id: "e3",
      startTime: "4:00 PM",
      endTime: "12:00 AM",
      startHour: 16,
      endHour: 24,
      jobTitle: "Lead Bartender",
      company: "The Grand Hotel",
      location: "Manhattan, NY",
      status: "confirmed",
      pay: 30,
      payType: "hourly",
    },
  ],
  3: [],
  4: [
    {
      id: "e4",
      startTime: "10:00 AM",
      endTime: "6:00 PM",
      startHour: 10,
      endHour: 18,
      jobTitle: "Retail Floor Associate",
      company: "Nordstrom Rack",
      location: "SoHo, NY",
      status: "pending",
      pay: 16,
      payType: "hourly",
    },
  ],
  5: [
    {
      id: "e5",
      startTime: "6:00 PM",
      endTime: "11:00 PM",
      startHour: 18,
      endHour: 23,
      jobTitle: "Event Staff",
      company: "Prestige Events Co.",
      location: "Chelsea, NY",
      status: "confirmed",
      pay: 250,
      payType: "flat",
    },
  ],
  6: [
    {
      id: "e6",
      startTime: "2:00 PM",
      endTime: "8:00 PM",
      startHour: 14,
      endHour: 20,
      jobTitle: "Forklift Operator",
      company: "FreshFoods Distribution",
      location: "Bronx, NY",
      status: "pending",
      pay: 26,
      payType: "hourly",
    },
  ],
};

const STATUS_CONFIG = {
  confirmed: { label: "Confirmed", color: "#10b981", bg: "#d1fae5", dot: "#10b981" },
  pending:   { label: "Pending",   color: "#f59e0b", bg: "#fef3c7", dot: "#f59e0b" },
  completed: { label: "Completed", color: "#6366f1", bg: "#ede9fe", dot: "#6366f1" },
  missed:    { label: "Missed",    color: "#ef4444", bg: "#fee2e2", dot: "#ef4444" },
};

function getWeekDates(baseDate: Date) {
  const day = baseDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function calcShiftHours(e: ShiftEvent) {
  return e.endHour - e.startHour;
}

function calcShiftEarnings(e: ShiftEvent) {
  if (e.payType === "flat") return e.pay;
  return e.pay * calcShiftHours(e);
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function TimesheetScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const today = new Date();
  const [baseDate, setBaseDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [activeTab, setActiveTab] = useState<"schedule" | "hours">("schedule");

  const tabAnim = useRef(new Animated.Value(0)).current;

  const weekDates = getWeekDates(baseDate);
  const selectedDayIndex = weekDates.findIndex((d) => isSameDay(d, selectedDate));
  const dayEvents: ShiftEvent[] = SCHEDULE[selectedDayIndex === -1 ? 0 : selectedDayIndex] ?? [];

  const weeklyHours = Object.values(SCHEDULE).flat().reduce((s, e) => s + calcShiftHours(e), 0);
  const weeklyEarnings = Object.values(SCHEDULE).flat().reduce((s, e) => s + calcShiftEarnings(e), 0);
  const weeklyCompleted = Object.values(SCHEDULE).flat().filter(e => e.status === "completed").length;
  const weeklyShifts = Object.values(SCHEDULE).flat().length;

  const dayHours = dayEvents.reduce((s, e) => s + calcShiftHours(e), 0);
  const dayEarnings = dayEvents.reduce((s, e) => s + calcShiftEarnings(e), 0);

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

  function selectDay(date: Date) {
    Haptics.selectionAsync();
    setSelectedDate(date);
  }

  function switchTab(tab: "schedule" | "hours") {
    Haptics.selectionAsync();
    setActiveTab(tab);
    Animated.spring(tabAnim, {
      toValue: tab === "schedule" ? 0 : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
  }

  const getEventStatus = (index: number) => {
    const evts = SCHEDULE[index] ?? [];
    if (evts.length === 0) return null;
    if (evts.some((e) => e.status === "pending")) return "pending";
    if (evts.some((e) => e.status === "confirmed")) return "confirmed";
    return "completed";
  };

  return (
    <View style={styles.root}>
      {/* ── GRADIENT HEADER ── */}
      <LinearGradient
        colors={["#0a47a9", "#1e63d0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPadding + 14 }]}
      >
        {/* Top row */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Time Sheet</Text>
          <TouchableOpacity style={styles.monthPill} onPress={() => {}}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
              <Feather name="chevron-left" size={14} color="#93c5fd" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTHS[currentMonth]} {currentYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthArrow}>
              <Feather name="chevron-right" size={14} color="#93c5fd" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Weekly summary cards */}
        <View style={styles.weekSummaryRow}>
          <View style={styles.weekSummaryCard}>
            <Text style={styles.weekSummaryValue}>{weeklyHours}h</Text>
            <Text style={styles.weekSummaryLabel}>This Week</Text>
          </View>
          <View style={styles.weekSummaryDivider} />
          <View style={styles.weekSummaryCard}>
            <Text style={styles.weekSummaryValue}>{formatCurrency(weeklyEarnings)}</Text>
            <Text style={styles.weekSummaryLabel}>Est. Earnings</Text>
          </View>
          <View style={styles.weekSummaryDivider} />
          <View style={styles.weekSummaryCard}>
            <Text style={styles.weekSummaryValue}>{weeklyCompleted}/{weeklyShifts}</Text>
            <Text style={styles.weekSummaryLabel}>Completed</Text>
          </View>
        </View>

        {/* Week strip */}
        <View style={styles.weekStrip}>
          {weekDates.map((date, i) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);
            const status = getEventStatus(i);
            const hasShift = (SCHEDULE[i] ?? []).length > 0;

            return (
              <TouchableOpacity
                key={i}
                style={styles.dayCol}
                onPress={() => selectDay(date)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayLabel, isSelected && styles.dayLabelSel]}>
                  {DAY_SHORT[i]}
                </Text>
                <View
                  style={[
                    styles.dayPill,
                    isSelected && styles.dayPillSel,
                    isToday && !isSelected && styles.dayPillToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      isSelected && styles.dayNumSel,
                      isToday && !isSelected && styles.dayNumToday,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
                {hasShift ? (
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          STATUS_CONFIG[status ?? "confirmed"].dot,
                      },
                    ]}
                  />
                ) : (
                  <View style={styles.statusDotEmpty} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {/* ── TABS ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "schedule" && styles.tabActive]}
          onPress={() => switchTab("schedule")}
          activeOpacity={0.8}
        >
          <Feather
            name="calendar"
            size={14}
            color={activeTab === "schedule" ? "#1d4ed8" : "#9ca3af"}
          />
          <Text style={[styles.tabText, activeTab === "schedule" && styles.tabTextActive]}>
            Schedule
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "hours" && styles.tabActive]}
          onPress={() => switchTab("hours")}
          activeOpacity={0.8}
        >
          <Feather
            name="clock"
            size={14}
            color={activeTab === "hours" ? "#1d4ed8" : "#9ca3af"}
          />
          <Text style={[styles.tabText, activeTab === "hours" && styles.tabTextActive]}>
            Hours Logged
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "schedule" ? (
          <>
            {/* Day header */}
            <View style={styles.dayHeader}>
              <View>
                <Text style={styles.dayHeaderDate}>
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
                {dayEvents.length > 0 && (
                  <Text style={styles.dayHeaderSub}>
                    {dayHours}h · {formatCurrency(dayEarnings)} est.
                  </Text>
                )}
              </View>
              {isSameDay(selectedDate, today) && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>Today</Text>
                </View>
              )}
            </View>

            {/* Shift cards or empty state */}
            {dayEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Feather name="sun" size={30} color="#3b82f6" />
                </View>
                <Text style={styles.emptyTitle}>No shifts scheduled</Text>
                <Text style={styles.emptyBody}>
                  You're free on this day. Add your availability so employers can discover you.
                </Text>
                <TouchableOpacity
                  style={styles.addAvailBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/(tabs)/availability");
                  }}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={15} color="#fff" />
                  <Text style={styles.addAvailBtnText}>Add Availability</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.shiftList}>
                {dayEvents.map((event, idx) => {
                  const cfg = STATUS_CONFIG[event.status];
                  const hours = calcShiftHours(event);
                  const earnings = calcShiftEarnings(event);

                  return (
                    <View key={event.id}>
                      {/* Time label */}
                      <View style={styles.timelineLabel}>
                        <View style={[styles.timelineDot, { backgroundColor: cfg.dot }]} />
                        <Text style={styles.timelineLabelText}>{event.startTime}</Text>
                      </View>

                      {/* Card */}
                      <View style={styles.shiftCard}>
                        {/* Left accent bar */}
                        <View style={[styles.shiftAccentBar, { backgroundColor: cfg.dot }]} />

                        <View style={styles.shiftCardBody}>
                          {/* Top row */}
                          <View style={styles.shiftCardTop}>
                            <View style={styles.shiftCardTitleWrap}>
                              <Text style={styles.shiftTitle}>{event.jobTitle}</Text>
                              <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                                <Text style={[styles.statusPillText, { color: cfg.color }]}>
                                  {cfg.label}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Company & location */}
                          <View style={styles.shiftMeta}>
                            <Feather name="briefcase" size={12} color="#6b7280" />
                            <Text style={styles.shiftMetaText}>{event.company}</Text>
                          </View>
                          <View style={styles.shiftMeta}>
                            <Feather name="map-pin" size={12} color="#6b7280" />
                            <Text style={styles.shiftMetaText}>{event.location}</Text>
                          </View>

                          {/* Divider */}
                          <View style={styles.shiftCardDivider} />

                          {/* Stats row */}
                          <View style={styles.shiftStats}>
                            <View style={styles.shiftStat}>
                              <Feather name="clock" size={13} color="#6366f1" />
                              <Text style={styles.shiftStatText}>
                                {event.startTime} – {event.endTime}
                              </Text>
                            </View>
                            <View style={styles.shiftStat}>
                              <Feather name="activity" size={13} color="#6366f1" />
                              <Text style={styles.shiftStatText}>{hours}h shift</Text>
                            </View>
                            <View style={styles.shiftStat}>
                              <Feather name="dollar-sign" size={13} color="#10b981" />
                              <Text style={[styles.shiftStatText, { color: "#10b981", fontWeight: "700" }]}>
                                {event.payType === "flat"
                                  ? `${formatCurrency(event.pay)} flat`
                                  : `$${event.pay}/hr`}
                              </Text>
                            </View>
                          </View>

                          {/* Earnings highlight */}
                          <View style={styles.shiftEarningsRow}>
                            <Text style={styles.shiftEarningsLabel}>Estimated Earnings</Text>
                            <Text style={styles.shiftEarningsValue}>{formatCurrency(earnings)}</Text>
                          </View>

                          {/* Action buttons for pending shifts */}
                          {event.status === "pending" && (
                            <View style={styles.shiftActions}>
                              <TouchableOpacity
                                style={styles.shiftActionAccept}
                                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
                                activeOpacity={0.85}
                              >
                                <Feather name="check" size={13} color="#fff" />
                                <Text style={styles.shiftActionAcceptText}>Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.shiftActionDecline}
                                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)}
                                activeOpacity={0.85}
                              >
                                <Text style={styles.shiftActionDeclineText}>Decline</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* End time label on last item */}
                      {idx === dayEvents.length - 1 && (
                        <View style={styles.timelineLabel}>
                          <View style={[styles.timelineDot, { backgroundColor: "#d1d5db" }]} />
                          <Text style={[styles.timelineLabelText, { color: "#9ca3af" }]}>
                            {event.endTime}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Hours logged tab */}
            <View style={styles.hoursHeader}>
              <Text style={styles.hoursHeaderTitle}>Weekly Hours</Text>
              <Text style={styles.hoursHeaderSub}>April 7 – 13, 2026</Text>
            </View>

            {/* Progress towards target */}
            <View style={styles.hoursProgressCard}>
              <View style={styles.hoursProgressTop}>
                <Text style={styles.hoursProgressLabel}>Hours vs Target</Text>
                <Text style={styles.hoursProgressValue}>{weeklyHours} / 40h</Text>
              </View>
              <View style={styles.hoursProgressBar}>
                <View
                  style={[
                    styles.hoursProgressFill,
                    { width: `${Math.min((weeklyHours / 40) * 100, 100)}%` as any },
                  ]}
                />
              </View>
              <Text style={styles.hoursProgressNote}>
                {weeklyHours >= 40
                  ? "Full week reached!"
                  : `${40 - weeklyHours}h remaining to full week`}
              </Text>
            </View>

            {/* Daily breakdown */}
            <Text style={styles.sectionTitle}>Daily Breakdown</Text>
            {weekDates.map((date, i) => {
              const events = SCHEDULE[i] ?? [];
              const totalH = events.reduce((s, e) => s + calcShiftHours(e), 0);
              const totalE = events.reduce((s, e) => s + calcShiftEarnings(e), 0);
              const isToday = isSameDay(date, today);

              return (
                <View key={i} style={[styles.dayLogRow, isToday && styles.dayLogRowToday]}>
                  <View style={styles.dayLogLeft}>
                    <Text style={[styles.dayLogDay, isToday && styles.dayLogDayToday]}>
                      {DAY_SHORT[i]}
                    </Text>
                    <Text style={styles.dayLogDate}>{date.getDate()}</Text>
                  </View>
                  <View style={styles.dayLogBar}>
                    {totalH > 0 ? (
                      <View style={styles.dayLogFillWrap}>
                        <View
                          style={[
                            styles.dayLogFill,
                            {
                              width: `${Math.min((totalH / 12) * 100, 100)}%` as any,
                              backgroundColor: isToday ? "#3b82f6" : "#6366f1",
                            },
                          ]}
                        />
                      </View>
                    ) : (
                      <View style={styles.dayLogFillWrap} />
                    )}
                    <Text style={styles.dayLogHrs}>
                      {totalH > 0 ? `${totalH}h` : "—"}
                    </Text>
                  </View>
                  <Text style={styles.dayLogEarnings}>
                    {totalE > 0 ? formatCurrency(totalE) : "—"}
                  </Text>
                </View>
              );
            })}

            {/* Earnings breakdown */}
            <Text style={styles.sectionTitle}>Earnings Summary</Text>
            <View style={styles.earningsSummaryCard}>
              <View style={styles.earningsSummaryRow}>
                <Text style={styles.earningsSummaryLabel}>Hourly Earnings</Text>
                <Text style={styles.earningsSummaryValue}>
                  {formatCurrency(
                    Object.values(SCHEDULE)
                      .flat()
                      .filter(e => e.payType === "hourly")
                      .reduce((s, e) => s + calcShiftEarnings(e), 0)
                  )}
                </Text>
              </View>
              <View style={styles.earningsSummaryRow}>
                <Text style={styles.earningsSummaryLabel}>Flat Rate Earnings</Text>
                <Text style={styles.earningsSummaryValue}>
                  {formatCurrency(
                    Object.values(SCHEDULE)
                      .flat()
                      .filter(e => e.payType === "flat")
                      .reduce((s, e) => s + calcShiftEarnings(e), 0)
                  )}
                </Text>
              </View>
              <View style={styles.earningsSummaryDivider} />
              <View style={styles.earningsSummaryRow}>
                <Text style={[styles.earningsSummaryLabel, { fontWeight: "700", color: "#111827" }]}>
                  Total This Week
                </Text>
                <Text style={[styles.earningsSummaryValue, { color: "#10b981", fontSize: 17 }]}>
                  {formatCurrency(weeklyEarnings)}
                </Text>
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
          <Feather name="plus-circle" size={16} color="#3b82f6" />
          <Text style={styles.addBlockText}>Add Availability Block</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f0f4ff",
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  monthPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  monthArrow: {
    padding: 2,
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    minWidth: 96,
    textAlign: "center",
  },

  // Weekly summary
  weekSummaryRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 18,
  },
  weekSummaryCard: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  weekSummaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "stretch",
  },
  weekSummaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  weekSummaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Week strip
  weekStrip: {
    flexDirection: "row",
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.5,
  },
  dayLabelSel: {
    color: "#fff",
  },
  dayPill: {
    width: 36,
    height: 40,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  dayPillSel: {
    backgroundColor: "#fff",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  dayPillToday: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dayNum: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
  },
  dayNumSel: {
    color: "#1d4ed8",
  },
  dayNumToday: {
    color: "#fff",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotEmpty: {
    width: 6,
    height: 6,
  },

  // Tabs
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#1d4ed8",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
  },
  tabTextActive: {
    color: "#1d4ed8",
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Day header
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  dayHeaderDate: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
  },
  dayHeaderSub: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  todayBadge: {
    backgroundColor: "#dbeafe",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  todayBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1d4ed8",
  },

  // Shift list
  shiftList: {
    gap: 0,
  },
  timelineLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#fff",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  timelineLabelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366f1",
  },

  // Shift card
  shiftCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 8,
    marginLeft: 18,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#6366f1", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  shiftAccentBar: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  shiftCardBody: {
    flex: 1,
    padding: 14,
    gap: 7,
  },
  shiftCardTop: {
    gap: 6,
  },
  shiftCardTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  shiftTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  shiftMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  shiftMetaText: {
    fontSize: 12,
    color: "#6b7280",
  },
  shiftCardDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 2,
  },
  shiftStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  shiftStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  shiftStatText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
  },
  shiftEarningsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shiftEarningsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  shiftEarningsValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#10b981",
  },
  shiftActions: {
    flexDirection: "row",
    gap: 10,
  },
  shiftActionAccept: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#10b981",
    borderRadius: 10,
    paddingVertical: 9,
  },
  shiftActionAcceptText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  shiftActionDecline: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    paddingVertical: 9,
  },
  shiftActionDeclineText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ef4444",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e40af",
  },
  emptyBody: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 24,
  },
  addAvailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    ...Platform.select({
      ios: { shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  addAvailBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  // Hours tab
  hoursHeader: {
    marginBottom: 16,
  },
  hoursHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  hoursHeaderSub: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  hoursProgressCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: "#6366f1", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  hoursProgressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hoursProgressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  hoursProgressValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1d4ed8",
  },
  hoursProgressBar: {
    height: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 5,
    overflow: "hidden",
  },
  hoursProgressFill: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 5,
  },
  hoursProgressNote: {
    fontSize: 12,
    color: "#6b7280",
  },

  // Daily breakdown
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  dayLogRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 12,
  },
  dayLogRowToday: {
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
  },
  dayLogLeft: {
    alignItems: "center",
    width: 36,
  },
  dayLogDay: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.5,
  },
  dayLogDayToday: {
    color: "#1d4ed8",
  },
  dayLogDate: {
    fontSize: 15,
    fontWeight: "800",
    color: "#374151",
    marginTop: 1,
  },
  dayLogBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayLogFillWrap: {
    flex: 1,
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  dayLogFill: {
    height: "100%",
    borderRadius: 4,
  },
  dayLogHrs: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    width: 28,
    textAlign: "right",
  },
  dayLogEarnings: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10b981",
    width: 48,
    textAlign: "right",
  },

  // Earnings summary
  earningsSummaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: "#10b981", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  earningsSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earningsSummaryLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  earningsSummaryValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
  },
  earningsSummaryDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
  },

  // Add block button
  addBlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
    backgroundColor: "#fff",
  },
  addBlockText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
});

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

type Status = "paid" | "pending" | "processing";
type Transaction = {
  id: string;
  date: string;
  month: string;
  gig: string;
  category: "Hospitality" | "Warehouse" | "Retail" | "Events";
  employer: string;
  hours: number;
  amount: number;
  status: Status;
};

const TRANSACTIONS: Transaction[] = [
  { id: "t1", date: "Apr 22", month: "Apr", gig: "Banquet Server", category: "Events", employer: "Hilton Austin", hours: 6, amount: 138, status: "paid" },
  { id: "t2", date: "Apr 20", month: "Apr", gig: "Forklift Operator", category: "Warehouse", employer: "Amazon DFW7", hours: 8, amount: 192, status: "paid" },
  { id: "t3", date: "Apr 18", month: "Apr", gig: "Cashier", category: "Retail", employer: "Whole Foods", hours: 5, amount: 90, status: "paid" },
  { id: "t4", date: "Apr 17", month: "Apr", gig: "Bartender", category: "Hospitality", employer: "Moody Theater", hours: 7, amount: 245, status: "processing" },
  { id: "t5", date: "Apr 15", month: "Apr", gig: "Catering Server", category: "Events", employer: "Fairmont Austin", hours: 6, amount: 144, status: "paid" },
  { id: "t6", date: "Apr 13", month: "Apr", gig: "Stock Associate", category: "Retail", employer: "Target SOCO", hours: 8, amount: 168, status: "paid" },
  { id: "t7", date: "Apr 11", month: "Apr", gig: "Event Setup Crew", category: "Events", employer: "ACL Live", hours: 4, amount: 88, status: "paid" },
  { id: "t8", date: "Mar 30", month: "Mar", gig: "Line Cook", category: "Hospitality", employer: "Uchi", hours: 8, amount: 224, status: "paid" },
  { id: "t9", date: "Mar 27", month: "Mar", gig: "Picker / Packer", category: "Warehouse", employer: "FedEx Hub", hours: 9, amount: 207, status: "paid" },
  { id: "t10", date: "Mar 24", month: "Mar", gig: "Server", category: "Hospitality", employer: "Franklin BBQ", hours: 6, amount: 156, status: "paid" },
  { id: "t11", date: "Mar 21", month: "Mar", gig: "Visual Merchandiser", category: "Retail", employer: "Nordstrom", hours: 7, amount: 161, status: "paid" },
  { id: "t12", date: "Mar 18", month: "Mar", gig: "Event Host", category: "Events", employer: "Austin Convention", hours: 5, amount: 125, status: "paid" },
  { id: "t13", date: "Feb 28", month: "Feb", gig: "Banquet Server", category: "Hospitality", employer: "Four Seasons", hours: 8, amount: 200, status: "paid" },
  { id: "t14", date: "Feb 24", month: "Feb", gig: "Loader", category: "Warehouse", employer: "UPS Hub", hours: 10, amount: 240, status: "paid" },
  { id: "t15", date: "Feb 19", month: "Feb", gig: "Cashier", category: "Retail", employer: "H-E-B", hours: 6, amount: 108, status: "paid" },
];

const MONTHS = ["All", "Apr", "Mar", "Feb"];
const CATEGORIES: Array<"All" | Transaction["category"]> = ["All", "Hospitality", "Warehouse", "Retail", "Events"];

function statusStyle(s: Status) {
  if (s === "paid") return { bg: "#dcfce7", color: "#15803d", label: "Paid" };
  if (s === "processing") return { bg: "#dbeafe", color: "#1d4ed8", label: "Processing" };
  return { bg: "#fef3c7", color: "#a16207", label: "Pending" };
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === "ios" ? 50 : 24);

  const [month, setMonth] = useState<string>("All");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return TRANSACTIONS.filter((t) => {
      if (month !== "All" && t.month !== month) return false;
      if (category !== "All" && t.category !== category) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!t.gig.toLowerCase().includes(q) && !t.employer.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [month, category, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filtered.forEach((t) => {
      const arr = map.get(t.month) ?? [];
      arr.push(t);
      map.set(t.month, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const total = filtered.reduce((s, t) => s + t.amount, 0);

  function pickMonth(m: string) {
    Haptics.selectionAsync();
    setMonth(m);
  }
  function pickCategory(c: (typeof CATEGORIES)[number]) {
    Haptics.selectionAsync();
    setCategory(c);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Transactions</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryLabel}>{filtered.length} transactions</Text>
          <Text style={styles.summaryAmount}>
            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.searchWrap}>
          <Feather name="search" size={14} color="#9ca3af" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search gig or employer"
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterBlock}>
        <Text style={styles.filterLabel}>Month</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {MONTHS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.chip, month === m && styles.chipActive]}
              onPress={() => pickMonth(m)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, month === m && styles.chipTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.filterLabel, { marginTop: 8 }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => pickCategory(c)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {grouped.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={28} color="#9ca3af" />
            <Text style={styles.emptyText}>No transactions match your filters.</Text>
          </View>
        ) : (
          grouped.map(([m, items]) => {
            const groupTotal = items.reduce((s, t) => s + t.amount, 0);
            return (
              <View key={m} style={{ marginBottom: 14 }}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{m}</Text>
                  <Text style={styles.groupTotal}>${groupTotal.toFixed(2)}</Text>
                </View>
                <View style={styles.list}>
                  {items.map((t, i) => {
                    const st = statusStyle(t.status);
                    return (
                      <View key={t.id} style={[styles.row, i !== items.length - 1 && styles.rowBorder]}>
                        <View style={styles.rowIcon}>
                          <Feather name="briefcase" size={13} color="#64748b" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rowTitle} numberOfLines={1}>{t.gig}</Text>
                          <Text style={styles.rowSub} numberOfLines={1}>
                            {t.employer} · {t.date} · {t.hours}h
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={styles.rowAmount}>${t.amount.toFixed(2)}</Text>
                          <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0759af",
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.2 },

  summary: {
    backgroundColor: "#0759af",
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryLabel: { fontSize: 11, color: "#bfdbfe", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  summaryAmount: { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: -0.5, marginTop: 2 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flex: 1,
    maxWidth: 180,
  },
  searchInput: { flex: 1, fontSize: 12, color: "#fff", padding: 0 },

  filterBlock: { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  filterLabel: { fontSize: 10, fontWeight: "800", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  chipRow: { gap: 6, paddingRight: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e5e7eb" },
  chipActive: { backgroundColor: "#0759af", borderColor: "#0759af" },
  chipText: { fontSize: 12, color: "#475569", fontWeight: "700" },
  chipTextActive: { color: "#fff" },

  groupHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4, marginBottom: 6 },
  groupTitle: { flex: 1, fontSize: 12, fontWeight: "800", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 },
  groupTotal: { fontSize: 12, fontWeight: "800", color: "#2563eb" },

  list: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 9, gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 12, fontWeight: "700", color: "#111827" },
  rowSub: { fontSize: 10, color: "#6b7280", marginTop: 1 },
  rowAmount: { fontSize: 13, fontWeight: "800", color: "#111827" },
  statusPill: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999, marginTop: 3 },
  statusText: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },

  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 13, color: "#6b7280" },
});

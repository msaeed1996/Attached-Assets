import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const OPTIONS = [
  { id: "", label: "Select a Payment Method" },
  { id: "debit", label: "Debit Card / Pay Card" },
  { id: "direct", label: "Direct Deposit" },
  { id: "check", label: "Pay Check" },
];

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string>("");
  const [open, setOpen] = useState(false);

  const headerPad = Platform.OS === "web" ? insets.top + 67 : Math.max(insets.top, 12) + 4;
  const current = OPTIONS.find((o) => o.id === selected) || OPTIONS[0];

  function pick(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(id);
    setOpen(false);
    if (id) {
      router.push({ pathname: "/payment-method", params: { method: id, returnTo: "/payment-methods" } });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={[styles.header, { paddingTop: headerPad }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Pressable
          style={styles.dropdown}
          onPress={() => {
            Haptics.selectionAsync();
            setOpen((o) => !o);
          }}
        >
          <Text style={[styles.dropdownText, !selected && styles.placeholder]}>
            {current.label}
          </Text>
          <Feather name={open ? "chevron-up" : "chevron-down"} size={20} color="#374151" />
        </Pressable>

        {open && (
          <View style={styles.menu}>
            {OPTIONS.map((opt, idx) => {
              const isSel = opt.id === selected;
              return (
                <Pressable
                  key={opt.id || "placeholder"}
                  onPress={() => pick(opt.id)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    idx !== OPTIONS.length - 1 && styles.menuItemBorder,
                    (isSel || pressed) && styles.menuItemActive,
                  ]}
                >
                  <Text style={styles.menuItemText}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0759AF",
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownText: { fontSize: 15, color: "#111827" },
  placeholder: { color: "#374151" },

  menu: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  menuItemActive: { backgroundColor: "#E5E7EB" },
  menuItemText: { fontSize: 15, color: "#111827" },
});

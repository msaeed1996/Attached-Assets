import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const METHODS = ["Debit Card / Pay Card", "Direct Deposit", "Pay Check"] as const;
type Method = (typeof METHODS)[number];

export default function PaymentMethodScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const [method, setMethod] = useState<Method | null>(null);
  const [comments, setComments] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function selectMethod(m: Method) {
    Haptics.selectionAsync();
    setMethod(m);
    setDropdownOpen(false);
  }

  function save() {
    if (!method || !comments.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (params.returnTo) {
      router.replace({ pathname: params.returnTo as any, params: { paymentAdded: "1" } });
    } else {
      router.back();
    }
  }

  function exit() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }

  const canSave = !!method && comments.trim().length > 0;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        <Pressable
          onPress={() => setDropdownOpen(true)}
          style={styles.selectField}
        >
          <Text style={[styles.selectText, !method && styles.placeholder]}>
            {method ?? "Select a Payment Method"}
          </Text>
          <Feather name="chevron-down" size={18} color="#6b7280" />
        </Pressable>

        {method && (
          <View style={styles.commentsField}>
            <Text style={styles.commentsLabel}>Comments</Text>
            <TextInput
              value={comments}
              onChangeText={setComments}
              placeholder=""
              placeholderTextColor="#9ca3af"
              style={styles.commentsInput}
              keyboardType={method === "Pay Check" ? "default" : "number-pad"}
            />
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={save}
            disabled={!canSave}
            activeOpacity={0.85}
            style={[
              styles.actionBtn,
              { backgroundColor: canSave ? "#2563EB" : "#93c5fd" },
            ]}
          >
            <Text style={styles.actionBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={exit}
            activeOpacity={0.85}
            style={[styles.actionBtn, { backgroundColor: "#9ca3af" }]}
          >
            <Text style={styles.actionBtnText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable style={styles.dropdownBackdrop} onPress={() => setDropdownOpen(false)}>
          <Pressable style={styles.dropdownCard} onPress={(e) => e.stopPropagation()}>
            <Pressable
              style={styles.dropdownItem}
              onPress={() => {
                Haptics.selectionAsync();
                setMethod(null);
                setDropdownOpen(false);
              }}
            >
              <Text style={styles.dropdownText}>Select a Payment Method</Text>
            </Pressable>
            {METHODS.map((m) => {
              const active = m === method;
              return (
                <Pressable
                  key={m}
                  style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                  onPress={() => selectMethod(m)}
                >
                  <Text style={[styles.dropdownText, active && styles.dropdownTextActive]}>{m}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  body: {
    padding: 16,
    gap: 14,
  },
  selectField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  selectText: { fontSize: 15, color: "#111827" },
  placeholder: { color: "#6b7280" },
  commentsField: {
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: "#fff",
    position: "relative",
  },
  commentsLabel: {
    position: "absolute",
    top: -8,
    left: 10,
    paddingHorizontal: 4,
    backgroundColor: "#fff",
    fontSize: 11,
    color: "#6b7280",
  },
  commentsInput: {
    paddingVertical: 8,
    fontSize: 15,
    color: "#111827",
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingTop: 130,
    paddingHorizontal: 16,
  },
  dropdownCard: {
    backgroundColor: "#fff",
    borderRadius: 4,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownItemActive: {
    backgroundColor: "#e5e7eb",
  },
  dropdownText: {
    fontSize: 15,
    color: "#111827",
  },
  dropdownTextActive: {
    fontWeight: "600",
  },
});

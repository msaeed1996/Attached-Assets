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

type Method = {
  id: "debit" | "direct" | "check";
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  bg: string;
  badge?: string;
};

const METHODS: Method[] = [
  {
    id: "direct",
    title: "Direct Deposit",
    subtitle: "Bank account transfer",
    description: "Get paid directly to your bank account in 1–2 business days.",
    icon: "home",
    color: "#16A34A",
    bg: "#F0FDF4",
    badge: "Recommended",
  },
  {
    id: "debit",
    title: "Debit Card / Pay Card",
    subtitle: "Instant transfer to your card",
    description: "Receive your earnings within minutes on any eligible debit or pay card.",
    icon: "credit-card",
    color: "#2563EB",
    bg: "#EFF6FF",
    badge: "Fastest",
  },
  {
    id: "check",
    title: "Pay Check",
    subtitle: "Physical check by mail",
    description: "Get a paper check delivered to your address every pay period.",
    icon: "file-text",
    color: "#EA580C",
    bg: "#FFF7ED",
  },
];

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Method["id"] | null>(null);

  const headerPad = Math.max(insets.top, Platform.OS === "web" ? 67 : 56) + 8;

  function pick(id: Method["id"]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(id);
  }

  function proceed() {
    if (!selected) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <View style={[styles.header, { paddingTop: headerPad }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.introTitle}>How would you like to get paid?</Text>
          <Text style={styles.introSub}>
            Choose your preferred payment method. You can change it anytime.
          </Text>
        </View>

        {METHODS.map((m) => {
          const isSel = selected === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => pick(m.id)}
              style={[
                styles.card,
                isSel && { borderColor: m.color, borderWidth: 2, shadowOpacity: 0.08 },
              ]}
            >
              <View style={[styles.cardIcon, { backgroundColor: m.bg }]}>
                <Feather name={m.icon as any} size={22} color={m.color} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{m.title}</Text>
                  {m.badge && (
                    <View style={[styles.badge, { backgroundColor: m.bg }]}>
                      <Text style={[styles.badgeText, { color: m.color }]}>{m.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSubtitle}>{m.subtitle}</Text>
                <Text style={styles.cardDesc}>{m.description}</Text>
              </View>

              <View
                style={[
                  styles.radio,
                  isSel && { borderColor: m.color, backgroundColor: m.color },
                ]}
              >
                {isSel && <Feather name="check" size={12} color="#fff" />}
              </View>
            </Pressable>
          );
        })}

        <View style={styles.secureNote}>
          <Feather name="shield" size={14} color="#16A34A" />
          <Text style={styles.secureText}>
            Your payment details are encrypted and stored securely.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
          onPress={proceed}
          disabled={!selected}
        >
          <Text style={styles.continueText}>Continue</Text>
          <Feather name="arrow-right" size={16} color="#fff" />
        </Pressable>
      </View>
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

  intro: { marginBottom: 4 },
  introTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  introSub: { fontSize: 13, color: "#6B7280", marginTop: 4, lineHeight: 18 },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  cardSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  cardDesc: { fontSize: 12, color: "#374151", marginTop: 6, lineHeight: 17 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  secureText: { fontSize: 12, color: "#166534", flex: 1, lineHeight: 17 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#0759AF",
  },
  continueBtnDisabled: { backgroundColor: "#9CA3AF" },
  continueText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

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
import { SignupHeader } from "@/components/SignupHeader";
import { useColors } from "@/hooks/useColors";

interface WorkEntry {
  id: string;
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  zip: string;
}

export default function SignupWorkHistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<WorkEntry[]>([]);

  function handleAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/signup-add-work-history" });
  }

  function handleRemove(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleContinue() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/signup-identification");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SignupHeader
        title="Work History"
        subtitle="Add all your work histories. Clients review your work history to invite you for jobs."
        step={4}
        totalSteps={6}
        rightSlot={
          <TouchableOpacity
            onPress={handleAdd}
            style={styles.addBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No Work History Found.
            </Text>
          </View>
        ) : (
          entries.map((entry) => (
            <View
              key={entry.id}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.cardLeft}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoText}>
                    {entry.companyName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    {entry.jobTitle || "Untitled Position"}
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                    {entry.companyName}
                  </Text>
                  {(entry.startDate || entry.endDate) && (
                    <View style={styles.dateRow}>
                      <Feather name="calendar" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                        {[entry.startDate, entry.endDate].filter(Boolean).join(" – ")}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleRemove(entry.id)}
                style={[styles.removeBtn, { backgroundColor: "#fee2e2" }]}
                hitSlop={6}
              >
                <Feather name="trash-2" size={15} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.addHistoryBtn, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
          activeOpacity={0.88}
        >
          <Text style={styles.addHistoryBtnText}>Add Work History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: colors.muted }]}
          onPress={handleContinue}
          activeOpacity={0.88}
        >
          <Text style={[styles.continueBtnText, { color: colors.mutedForeground }]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 120,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1d4ed8",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    fontWeight: "500",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  addHistoryBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addHistoryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  continueBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});

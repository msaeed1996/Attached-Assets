import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  subtitle?: string;
  step: number;
  totalSteps: number;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}

export function SignupHeader({
  title,
  subtitle,
  step,
  totalSteps,
  onBack,
  rightSlot,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const progress = `${Math.round((step / totalSteps) * 100)}%` as const;

  return (
    <LinearGradient
      colors={[colors.primary, "#1d4ed8", colors.navy]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.decorTop} />
      <View style={styles.row}>
        <TouchableOpacity
          onPress={onBack ?? (() => router.back())}
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        {rightSlot ?? (
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              {step} / {totalSteps}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progress }]} />
      </View>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  decorTop: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -90,
    right: -60,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: 16,
  },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  stepBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  progressTrack: {
    height: 5,
    marginTop: 14,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 5,
  },
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
});

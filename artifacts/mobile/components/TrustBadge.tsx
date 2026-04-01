import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Props {
  rating: number;
  reviewCount?: number;
  verified?: boolean;
  size?: "sm" | "md" | "lg";
}

export function TrustBadge({ rating, reviewCount, verified, size = "md" }: Props) {
  const colors = useColors();
  const fontSize = size === "sm" ? 11 : size === "lg" ? 16 : 13;
  const starSize = size === "sm" ? 11 : size === "lg" ? 16 : 13;

  return (
    <View style={styles.row}>
      <Feather name="star" size={starSize} color="#f59e0b" />
      <Text style={[styles.rating, { fontSize, color: colors.foreground }]}>
        {rating.toFixed(1)}
      </Text>
      {reviewCount !== undefined && (
        <Text style={[styles.reviews, { fontSize: fontSize - 1, color: colors.mutedForeground }]}>
          ({reviewCount})
        </Text>
      )}
      {verified && (
        <View style={[styles.verifiedBadge, { backgroundColor: colors.accent }]}>
          <Feather name="check-circle" size={starSize - 1} color={colors.primary} />
          <Text style={[styles.verifiedText, { fontSize: fontSize - 2, color: colors.primary }]}>
            Verified
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontWeight: "700",
  },
  reviews: {},
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 3,
    marginLeft: 4,
  },
  verifiedText: {
    fontWeight: "600",
  },
});

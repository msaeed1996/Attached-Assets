import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { Job } from "@/context/JobsContext";

interface Props {
  job: Job;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  compact?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Warehouse: "#dbeafe",
  Hospitality: "#fce7f3",
  Admin: "#e0e7ff",
  Retail: "#fef3c7",
  Cleaning: "#d1fae5",
  Construction: "#ffedd5",
  Default: "#f1f5f9",
};

const CATEGORY_TEXT_COLORS: Record<string, string> = {
  Warehouse: "#1d4ed8",
  Hospitality: "#9d174d",
  Admin: "#4338ca",
  Retail: "#b45309",
  Cleaning: "#065f46",
  Construction: "#c2410c",
  Default: "#475569",
};

export function JobCard({ job, onPress, onSave, isSaved, compact }: Props) {
  const colors = useColors();
  const catBg = CATEGORY_COLORS[job.category] || CATEGORY_COLORS.Default;
  const catText = CATEGORY_TEXT_COLORS[job.category] || CATEGORY_TEXT_COLORS.Default;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          ...(Platform.OS === "ios"
            ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 }
            : { elevation: 2 }),
        },
      ]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.header}>
        <View style={[styles.categoryBadge, { backgroundColor: catBg }]}>
          <Text style={[styles.categoryText, { color: catText }]}>{job.category}</Text>
        </View>
        <View style={styles.headerRight}>
          {job.urgency === "urgent" && (
            <View style={[styles.urgentBadge, { backgroundColor: "#fef2f2" }]}>
              <View style={[styles.urgentDot, { backgroundColor: "#ef4444" }]} />
              <Text style={[styles.urgentText, { color: "#ef4444" }]}>Urgent</Text>
            </View>
          )}
          {onSave && (
            <TouchableOpacity onPress={onSave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather
                name={isSaved ? "bookmark" : "bookmark"}
                size={20}
                color={isSaved ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
        {job.title}
      </Text>
      <View style={styles.companyRow}>
        <Text style={[styles.company, { color: colors.mutedForeground }]}>{job.company}</Text>
        {job.verified && (
          <Feather name="check-circle" size={13} color={colors.primary} style={{ marginLeft: 4 }} />
        )}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{job.location}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="calendar" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{job.startDate}</Text>
        </View>
      </View>

      {!compact && (
        <View style={styles.footer}>
          <View style={styles.payBox}>
            <Text style={[styles.payAmount, { color: colors.primary }]}>
              ${job.pay}
            </Text>
            <Text style={[styles.payType, { color: colors.mutedForeground }]}>/{job.payType}</Text>
          </View>
          <View style={styles.applicantsRow}>
            <Feather name="users" size={12} color={colors.mutedForeground} />
            <Text style={[styles.applicantsText, { color: colors.mutedForeground }]}>
              {job.applicantsCount} applied
            </Text>
          </View>
        </View>
      )}

      {compact && (
        <Text style={[styles.payCompact, { color: colors.primary }]}>
          ${job.pay}/{job.payType}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  urgentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: "600",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 22,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  company: {
    fontSize: 13,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  payBox: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  payAmount: {
    fontSize: 20,
    fontWeight: "700",
  },
  payType: {
    fontSize: 13,
    marginLeft: 2,
  },
  applicantsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  applicantsText: {
    fontSize: 12,
  },
  payCompact: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 6,
  },
});

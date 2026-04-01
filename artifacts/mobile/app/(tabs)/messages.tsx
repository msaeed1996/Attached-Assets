import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMessages } from "@/context/MessagesContext";
import type { Conversation } from "@/context/MessagesContext";

function ConversationItem({ conv }: { conv: Conversation }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.convItem, { borderBottomColor: colors.border }]}
      onPress={() => router.push(`/chat/${conv.id}`)}
      activeOpacity={0.85}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.avatarText}>{conv.participantName.charAt(0)}</Text>
        <View style={[styles.roleIndicator, { backgroundColor: conv.participantRole === "employer" ? colors.primary : colors.success }]} />
      </View>
      <View style={styles.convContent}>
        <View style={styles.convHeader}>
          <Text style={[styles.participantName, { color: colors.foreground }]}>
            {conv.participantName}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {conv.lastMessageAt}
          </Text>
        </View>
        <Text style={[styles.jobTitle, { color: colors.primary }]} numberOfLines={1}>
          {conv.jobTitle} · {conv.company}
        </Text>
        <Text style={[styles.lastMsg, { color: conv.unreadCount > 0 ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
          {conv.lastMessage}
        </Text>
      </View>
      {conv.unreadCount > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.unreadCount}>{conv.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { conversations } = useMessages();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Messages</Text>
        {totalUnread > 0 && (
          <View style={[styles.totalUnread, { backgroundColor: colors.primary }]}>
            <Text style={styles.totalUnreadText}>{totalUnread} new</Text>
          </View>
        )}
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="message-circle" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No messages yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Apply to a job or hire a worker to start a conversation
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <ConversationItem conv={item} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          scrollEnabled={conversations.length > 0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  totalUnread: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  totalUnreadText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  roleIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
  convContent: { flex: 1, minWidth: 0 },
  convHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  participantName: { fontSize: 15, fontWeight: "700" },
  time: { fontSize: 12 },
  jobTitle: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  lastMsg: { fontSize: 13 },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadCount: { color: "#fff", fontSize: 11, fontWeight: "700" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginTop: 12 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});

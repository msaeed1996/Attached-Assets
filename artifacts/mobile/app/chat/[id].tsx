import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useColors } from "@/hooks/useColors";
import { useMessages } from "@/context/MessagesContext";
import type { Message } from "@/context/MessagesContext";
import { useApp } from "@/context/AppContext";
import * as Haptics from "expo-haptics";

function MessageBubble({ msg, isMe, myAvatar }: { msg: Message; isMe: boolean; myAvatar?: string | null }) {
  const colors = useColors();
  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      {!isMe && (
        <View style={[styles.bubbleAvatar, { backgroundColor: colors.primary }]}>
          <Feather name="user" size={14} color="#fff" />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isMe
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
        ]}
      >
        <Text style={[styles.bubbleText, { color: isMe ? "#fff" : colors.foreground }]}>
          {msg.text}
        </Text>
        <Text style={[styles.bubbleTime, { color: isMe ? "rgba(255,255,255,0.6)" : colors.mutedForeground }]}>
          {msg.sentAt}
        </Text>
      </View>
      {isMe && (
        <View style={[styles.bubbleAvatar, { backgroundColor: colors.primary, marginLeft: 8, marginRight: 0 }]}>
          {myAvatar ? (
            <Image source={{ uri: myAvatar }} style={{ width: "100%", height: "100%", borderRadius: 999 }} />
          ) : (
            <Feather name="user" size={14} color="#fff" />
          )}
        </View>
      )}
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { conversations, messages, sendMessage, markAsRead } = useMessages();
  const { userProfile } = useApp();
  const [text, setText] = useState("");
  const flatRef = useRef<FlatList>(null);

  const conv = conversations.find((c) => c.id === id);
  const msgs = messages[id] || [];

  useEffect(() => {
    markAsRead(id);
  }, [id]);

  function handleSend() {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(id, text.trim());
    setText("");
  }

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.chatHeader, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerAvatarText}>{(conv?.participantName || "?").charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.foreground }]}>{conv?.participantName}</Text>
          <Text style={[styles.headerSub, { color: colors.primary }]} numberOfLines={1}>
            {conv?.jobTitle} · {conv?.company}
          </Text>
        </View>
        <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatRef}
          data={msgs}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MessageBubble msg={item} isMe={item.senderId === "me"} myAvatar={userProfile?.avatar} />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Feather name="send" size={18} color={text.trim() ? "#fff" : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  headerAvatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 16, fontWeight: "700" },
  headerSub: { fontSize: 12, fontWeight: "500" },
  onlineIndicator: { width: 10, height: 10, borderRadius: 5 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10, gap: 8 },
  bubbleRowMe: { flexDirection: "row-reverse" },
  bubbleAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  bubble: { maxWidth: "74%", padding: 12, borderRadius: 16 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 10, marginTop: 4, textAlign: "right" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});

import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  sentAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: "employer" | "worker";
  participantAvatar?: string;
  jobTitle: string;
  company: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: "active" | "archived";
}

interface MessagesContextType {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  sendMessage: (conversationId: string, text: string) => void;
  markAsRead: (conversationId: string) => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: "conv1",
    participantId: "emp1",
    participantName: "Sarah M.",
    participantRole: "employer",
    jobTitle: "Warehouse Associate",
    company: "Amazon Logistics",
    lastMessage: "Hi! We reviewed your application and would love to have you start tomorrow.",
    lastMessageAt: "10 min ago",
    unreadCount: 2,
    status: "active",
  },
  {
    id: "conv2",
    participantId: "emp2",
    participantName: "James R.",
    participantRole: "employer",
    jobTitle: "Event Staff",
    company: "Prestige Events",
    lastMessage: "Can you confirm you have TABC certification?",
    lastMessageAt: "1 hr ago",
    unreadCount: 1,
    status: "active",
  },
];

const SAMPLE_MESSAGES: Record<string, Message[]> = {
  conv1: [
    {
      id: "m1",
      conversationId: "conv1",
      senderId: "emp1",
      text: "Hi! We reviewed your application for the Warehouse Associate position.",
      sentAt: "11:40 AM",
      read: true,
    },
    {
      id: "m2",
      conversationId: "conv1",
      senderId: "me",
      text: "Thanks! I'm really interested in the role.",
      sentAt: "11:42 AM",
      read: true,
    },
    {
      id: "m3",
      conversationId: "conv1",
      senderId: "emp1",
      text: "Great! We reviewed your application and would love to have you start tomorrow.",
      sentAt: "11:45 AM",
      read: false,
    },
    {
      id: "m4",
      conversationId: "conv1",
      senderId: "emp1",
      text: "Please bring steel-toed boots. Start time is 7 AM.",
      sentAt: "11:46 AM",
      read: false,
    },
  ],
  conv2: [
    {
      id: "m5",
      conversationId: "conv2",
      senderId: "emp2",
      text: "Hello! Thanks for applying to our Event Staff role.",
      sentAt: "9:00 AM",
      read: true,
    },
    {
      id: "m6",
      conversationId: "conv2",
      senderId: "emp2",
      text: "Can you confirm you have TABC certification?",
      sentAt: "9:05 AM",
      read: false,
    },
  ],
};

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(SAMPLE_MESSAGES);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      const [convData, msgData] = await Promise.all([
        AsyncStorage.getItem("conversations"),
        AsyncStorage.getItem("messages"),
      ]);
      if (convData) {
        const parsed = JSON.parse(convData) as Conversation[];
        setConversations([...SAMPLE_CONVERSATIONS, ...parsed.filter((c) => !SAMPLE_CONVERSATIONS.find((s) => s.id === c.id))]);
      }
      if (msgData) {
        const parsed = JSON.parse(msgData);
        setMessages({ ...SAMPLE_MESSAGES, ...parsed });
      }
    } catch {}
  }

  function sendMessage(conversationId: string, text: string) {
    const msg: Message = {
      id: Date.now().toString(),
      conversationId,
      senderId: "me",
      text,
      sentAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: true,
    };
    const updatedMsgs = {
      ...messages,
      [conversationId]: [...(messages[conversationId] || []), msg],
    };
    setMessages(updatedMsgs);

    const updatedConvs = conversations.map((c) =>
      c.id === conversationId
        ? { ...c, lastMessage: text, lastMessageAt: "Just now" }
        : c
    );
    setConversations(updatedConvs);

    const customConvs = updatedConvs.filter(
      (c) => !SAMPLE_CONVERSATIONS.find((s) => s.id === c.id)
    );
    AsyncStorage.setItem("conversations", JSON.stringify(customConvs));
    const customMsgs: Record<string, Message[]> = {};
    Object.keys(updatedMsgs).forEach((k) => {
      if (!SAMPLE_MESSAGES[k]) customMsgs[k] = updatedMsgs[k];
      else {
        const extra = updatedMsgs[k].filter((m) => !SAMPLE_MESSAGES[k].find((s) => s.id === m.id));
        if (extra.length > 0) customMsgs[k] = extra;
      }
    });
    AsyncStorage.setItem("messages", JSON.stringify(customMsgs));
  }

  function markAsRead(conversationId: string) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
    setMessages((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map((m) => ({
        ...m,
        read: true,
      })),
    }));
  }

  return (
    <MessagesContext.Provider value={{ conversations, messages, sendMessage, markAsRead }}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error("useMessages must be used within MessagesProvider");
  return ctx;
}

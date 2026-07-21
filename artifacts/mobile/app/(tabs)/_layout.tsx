import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React, { useRef, useEffect } from "react";
import {
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  useColorScheme,
  Dimensions,
} from "react-native";
import { useMessages } from "@/context/MessagesContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BLUE   = "#2563EB";
const GRAY   = "#9CA3AF";
const { width: SW } = Dimensions.get("window");

// ─── Native (iOS liquid glass) ─────────────────────────────────────────────────
function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="availability">
        <Icon sf={{ default: "calendar", selected: "calendar.fill" }} />
        <Label>Availability</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <Icon sf={{ default: "message", selected: "message.fill" }} />
        <Label>Messages</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// ─── Custom Tab Bar ────────────────────────────────────────────────────────────
const TAB_ITEMS = [
  { name: "index",        label: "Home",         icon: "home"          as const },
  { name: "availability", label: "Schedule",     icon: "calendar"      as const },
  { name: "messages",     label: "Messages",     icon: "message-circle" as const },
  { name: "profile",      label: "Profile",      icon: "user"          as const },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets  = useSafeAreaInsets();
  const { conversations } = useMessages();
  const unread  = conversations.reduce((s: number, c: any) => s + c.unreadCount, 0);
  const isDark  = useColorScheme() === "dark";

  // Animated underline / pill
  const tabWidth   = (SW - 32) / TAB_ITEMS.length;
  const pillX      = useRef(new Animated.Value(state.index * tabWidth)).current;

  useEffect(() => {
    Animated.spring(pillX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View
      style={[
        tb.bar,
        {
          paddingBottom: insets.bottom + 6,
          backgroundColor: isDark ? "#1C1C1E" : "#fff",
        },
      ]}
    >
      {/* Sliding active pill */}
      <Animated.View
        style={[
          tb.activePill,
          {
            width: tabWidth - 16,
            transform: [{ translateX: Animated.add(pillX, new Animated.Value(8)) }],
          },
        ]}
      />

      {TAB_ITEMS.map((tab, idx) => {
        const focused   = state.index === idx;
        const msgTab    = tab.name === "messages";
        const descriptor = Object.values(descriptors as any).find(
          (d: any) => d.route.name === tab.name
        ) as any;

        return (
          <TouchableOpacity
            key={tab.name}
            style={[tb.tab, { width: tabWidth }]}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: descriptor?.route?.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(tab.name);
            }}
            activeOpacity={0.8}
          >
            <View style={tb.iconWrap}>
              <Feather
                name={tab.icon}
                size={26}
                color={focused ? BLUE : GRAY}
              />
              {msgTab && unread > 0 && (
                <View style={tb.badge}>
                  <Text style={tb.badgeText}>{unread > 9 ? "9+" : unread}</Text>
                </View>
              )}
            </View>
            <Text style={[tb.label, { color: focused ? BLUE : GRAY }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Classic Layout (Android + Web) ───────────────────────────────────────────
function ClassicTabLayout() {
  const { conversations } = useMessages();
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const isDark = useColorScheme() === "dark";
  const isIOS  = Platform.OS === "ios";
  const isWeb  = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BLUE,
        tabBarInactiveTintColor: GRAY,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : isDark ? "#1C1C1E" : "#fff",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: "#E5E7EB",
          elevation: 0,
          height: isWeb ? 84 : 64,
        },
        tabBarIconStyle: { marginTop: 4 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginBottom: isWeb ? 8 : 2 },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "#1C1C1E" : "#fff" }]} />
          ),
      }}
      tabBar={isWeb || isIOS ? undefined : (props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={size} />
            ) : (
              <Feather name="home" size={28} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="calendar" tintColor={color} size={size} />
            ) : (
              <Feather name="calendar" size={28} color={color} />
            ),
        }}
      />
      <Tabs.Screen name="invitations" options={{ href: null }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="message" tintColor={color} size={size} />
            ) : (
              <Feather name="message-circle" size={28} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={size} />
            ) : (
              <Feather name="user" size={28} color={color} />
            ),
        }}
      />
      <Tabs.Screen name="jobs"       options={{ href: null }} />
      <Tabs.Screen name="dashboard"  options={{ href: null }} />
    </Tabs>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}

// ─── Tab Bar Styles ───────────────────────────────────────────────────────────
const tb = StyleSheet.create({
  bar: {
    flexDirection: "row",
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    position: "relative",
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 16 },
      default: {},
    }) as object,
  },
  activePill: {
    position: "absolute",
    top: 6,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
  },
  tab:      { alignItems: "center", justifyContent: "center", paddingVertical: 6, position: "relative" },
  iconWrap: { position: "relative" },
  label:    { fontSize: 11, fontWeight: "700", marginTop: 4 },
  badge:    { position: "absolute", top: -4, right: -8, backgroundColor: "#EF4444", borderRadius: 8, minWidth: 16, height: 16, justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: "#fff" },
  badgeText:{ color: "#fff", fontSize: 9, fontWeight: "800" },
});

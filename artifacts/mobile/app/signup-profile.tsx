import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { SignupHeader } from "@/components/SignupHeader";
import { useApp } from "@/context/AppContext";

type Done = { signature: boolean; picture: boolean; payment: boolean };

export default function SignupProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, setUserProfile, setIsOnboarded } = useApp();

  const [done, setDone] = useState<Done>({
    signature: false,
    picture: false,
    payment: false,
  });

  async function pickImage(key: "picture") {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });
      if (!res.canceled) {
        setDone((d) => ({ ...d, [key]: true }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not open file picker.");
    }
  }

  function captureSignature() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.prompt?.(
      "Add Signature",
      "Type your full legal name to sign",
      (text) => {
        if (text && text.trim().length > 1) {
          setDone((d) => ({ ...d, signature: true }));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
    );
    if (!Alert.prompt) {
      setDone((d) => ({ ...d, signature: true }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function addPayment() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Add Payment Method",
      "Connect your bank or debit card to receive payouts.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add (demo)",
          onPress: () => {
            setDone((d) => ({ ...d, payment: true }));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  }

  const allDone = done.signature && done.picture && done.payment;

  function finish() {
    if (!allDone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Almost there", "Please complete all requirements above.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (userProfile) setUserProfile({ ...userProfile, verified: true });
    setIsOnboarded(true);
    router.replace("/(tabs)");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SignupHeader title="My Profile" step={5} totalSteps={5} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.foreground }]}>
          Please complete the following requirements to complete your profile and use TrueGigs.
        </Text>

        <RequirementButton
          label="Signature"
          done={done.signature}
          onPress={captureSignature}
        />

        <RequirementButton
          label="Profile Picture"
          done={done.picture}
          onPress={() => pickImage("picture")}
        />

        <View style={{ height: 40 }} />

        <RequirementButton
          label="Add Payment Method"
          done={done.payment}
          onPress={addPayment}
        />

        <TouchableOpacity
          onPress={finish}
          activeOpacity={0.9}
          style={[
            styles.finishBtn,
            { backgroundColor: allDone ? "#10b981" : "#9ca3af" },
          ]}
        >
          <Feather name="check-circle" size={18} color="#fff" />
          <Text style={styles.finishBtnText}>
            {allDone ? "Finish & Continue" : "Complete all requirements"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function RequirementButton({
  label,
  done,
  onPress,
}: {
  label: string;
  done: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.reqBtn, done && styles.reqBtnDone]}
    >
      <Text style={styles.reqBtnText}>{label}</Text>
      {done && (
        <View style={styles.checkBadge}>
          <Feather name="check" size={14} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 14,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reqBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  reqBtnDone: {
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
  },
  reqBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  checkBadge: {
    position: "absolute",
    right: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  finishBtn: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  finishBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

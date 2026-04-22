import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { SignupHeader } from "@/components/SignupHeader";
import { useApp } from "@/context/AppContext";
import SignaturePadModal from "@/components/SignaturePadModal";

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
  const [signatureVisible, setSignatureVisible] = useState(false);
  const [pictureUri, setPictureUri] = useState<string | null>(null);
  const params = useLocalSearchParams<{ paymentAdded?: string }>();

  React.useEffect(() => {
    if (params.paymentAdded === "1") {
      setDone((d) => ({ ...d, payment: true }));
    }
  }, [params.paymentAdded]);

  async function takePhoto() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Camera permission needed", "Please allow camera access to take a photo.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setPictureUri(res.assets[0].uri);
        setDone((d) => ({ ...d, picture: true }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not open camera.");
    }
  }

  async function chooseFromLibrary() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setPictureUri(res.assets[0].uri);
        setDone((d) => ({ ...d, picture: true }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not open file picker.");
    }
  }

  function pickImage() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Profile Picture",
      "Choose how you'd like to add your profile picture.",
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Library", onPress: chooseFromLibrary },
        { text: "Cancel", style: "cancel" },
      ],
    );
  }

  function captureSignature() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSignatureVisible(true);
  }

  function addPayment() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/payment-method", params: { returnTo: "/signup-profile" } });
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
          onPress={pickImage}
          thumbnailUri={pictureUri}
        />

        <View style={{ height: 40 }} />

        <RequirementButton
          label="Add Payment Method"
          done={done.payment}
          onPress={addPayment}
        />

        <SignaturePadModal
          visible={signatureVisible}
          onClose={() => setSignatureVisible(false)}
          onSave={() => setDone((d) => ({ ...d, signature: true }))}
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
  thumbnailUri,
}: {
  label: string;
  done: boolean;
  onPress: () => void;
  thumbnailUri?: string | null;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.reqBtn, done && styles.reqBtnDone]}
    >
      {thumbnailUri && (
        <Image source={{ uri: thumbnailUri }} style={styles.thumb} />
      )}
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
  thumb: {
    position: "absolute",
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "#fff",
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

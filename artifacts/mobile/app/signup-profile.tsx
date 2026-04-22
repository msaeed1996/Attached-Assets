import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const params = useLocalSearchParams<{ paymentAdded?: string }>();

  React.useEffect(() => {
    if (params.paymentAdded === "1") {
      setDone((d) => ({ ...d, payment: true }));
    }
  }, [params.paymentAdded]);

  async function takePhoto() {
    setPhotoSheetVisible(false);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Camera permission needed",
          "Please allow camera access in your device settings to take a photo.",
        );
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
      Alert.alert("Camera error", e?.message ?? "Could not open camera.");
    }
  }

  async function chooseFromLibrary() {
    setPhotoSheetVisible(false);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Gallery permission needed",
          "Please allow photo library access to choose a picture.",
        );
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setPictureUri(res.assets[0].uri);
        setDone((d) => ({ ...d, picture: true }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
    } catch {
      // fall through to document picker
    }
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

  function removePhoto() {
    setPhotoSheetVisible(false);
    setPictureUri(null);
    setDone((d) => ({ ...d, picture: false }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function pickImage() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotoSheetVisible(true);
  }

  function captureSignature() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSignatureVisible(true);
  }

  function addPayment() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/payment-method", params: { returnTo: "/signup-profile" } });
  }

  const completedCount = Number(done.signature) + Number(done.picture) + Number(done.payment);
  const allDone = completedCount === 3;
  const progressPct = (completedCount / 3) * 100;

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
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <SignupHeader title="My Profile" step={5} totalSteps={5} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            {pictureUri ? (
              <Image source={{ uri: pictureUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Feather name="user" size={32} color="#9CA3AF" />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Feather name={allDone ? "check" : "edit-2"} size={11} color="#fff" />
            </View>
          </View>
          <Text style={styles.heroTitle}>Almost done!</Text>
          <Text style={styles.heroSubtitle}>
            Complete these {3 - completedCount === 0 ? "final touches" : `${3 - completedCount} steps`} to start working on TrueGigs.
          </Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {completedCount} of 3 completed
          </Text>
        </View>

        {/* Requirements */}
        <Text style={styles.sectionLabel}>Profile Requirements</Text>

        <RequirementCard
          icon="draw-pen"
          title="Signature"
          description="Sign with your finger to authorize timesheets."
          done={done.signature}
          onPress={captureSignature}
        />

        <RequirementCard
          icon="camera-outline"
          title="Profile Picture"
          description="Help employers recognize you on the job site."
          done={done.picture}
          onPress={pickImage}
          thumbnailUri={pictureUri}
        />

        <RequirementCard
          icon="credit-card-outline"
          title="Payment Method"
          description="Tell us how you'd like to receive your earnings."
          done={done.payment}
          onPress={addPayment}
        />

        <View style={styles.helpRow}>
          <Feather name="help-circle" size={14} color="#6B7280" />
          <Text style={styles.helpText}>
            All info is encrypted. You can update these later in Settings.
          </Text>
        </View>

        <SignaturePadModal
          visible={signatureVisible}
          onClose={() => setSignatureVisible(false)}
          onSave={() => setDone((d) => ({ ...d, signature: true }))}
        />

        <Modal
          visible={photoSheetVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPhotoSheetVisible(false)}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => setPhotoSheetVisible(false)}>
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Profile Picture</Text>
              <Text style={styles.sheetSubtitle}>Choose how to add your photo</Text>

              <TouchableOpacity style={styles.sheetOption} onPress={takePhoto} activeOpacity={0.7}>
                <View style={[styles.sheetIcon, { backgroundColor: "#EFF6FF" }]}>
                  <Feather name="camera" size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetOptionTitle}>Take Photo</Text>
                  <Text style={styles.sheetOptionDesc}>Use your camera now</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.sheetOption} onPress={chooseFromLibrary} activeOpacity={0.7}>
                <View style={[styles.sheetIcon, { backgroundColor: "#F3E8FF" }]}>
                  <Feather name="image" size={20} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetOptionTitle}>Choose from Gallery</Text>
                  <Text style={styles.sheetOptionDesc}>Pick an existing photo</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              {pictureUri && (
                <TouchableOpacity style={styles.sheetOption} onPress={removePhoto} activeOpacity={0.7}>
                  <View style={[styles.sheetIcon, { backgroundColor: "#FEE2E2" }]}>
                    <Feather name="trash-2" size={20} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sheetOptionTitle, { color: "#DC2626" }]}>Remove Photo</Text>
                    <Text style={styles.sheetOptionDesc}>Delete current picture</Text>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.sheetCancel}
                onPress={() => setPhotoSheetVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        <TouchableOpacity
          onPress={finish}
          activeOpacity={0.9}
          style={[
            styles.finishBtn,
            { backgroundColor: allDone ? "#10B981" : "#D1D5DB" },
          ]}
        >
          <Feather name={allDone ? "check-circle" : "lock"} size={18} color="#fff" />
          <Text style={styles.finishBtnText}>
            {allDone ? "Finish & Continue" : `Complete ${3 - completedCount} more to continue`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function RequirementCard({
  icon,
  title,
  description,
  done,
  onPress,
  thumbnailUri,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  done: boolean;
  onPress: () => void;
  thumbnailUri?: string | null;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.reqCard, done && styles.reqCardDone]}
    >
      <View
        style={[
          styles.reqIconWrap,
          { backgroundColor: done ? "#D1FAE5" : "#EFF6FF" },
        ]}
      >
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} style={styles.reqThumb} />
        ) : (
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color={done ? "#059669" : "#2563EB"}
          />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.reqTitleRow}>
          <Text style={styles.reqTitle}>{title}</Text>
          {done && (
            <View style={styles.doneBadge}>
              <Feather name="check" size={10} color="#fff" />
              <Text style={styles.doneBadgeText}>Done</Text>
            </View>
          )}
        </View>
        <Text style={styles.reqDesc}>{description}</Text>
      </View>

      <Feather
        name={done ? "edit-2" : "chevron-right"}
        size={16}
        color={done ? "#059669" : "#9CA3AF"}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },

  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F3F4F6",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  heroSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    fontWeight: "600",
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 4,
  },

  reqCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  reqCardDone: {
    backgroundColor: "#F0FDF4",
    borderColor: "#A7F3D0",
  },
  reqIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  reqThumb: { width: 44, height: 44 },
  reqTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reqTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  reqDesc: { fontSize: 12, color: "#6B7280", marginTop: 2, lineHeight: 16 },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  doneBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  helpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  helpText: { fontSize: 12, color: "#6B7280", textAlign: "center" },

  finishBtn: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  finishBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 8,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  sheetSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  sheetIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetOptionTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  sheetOptionDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  sheetCancel: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  sheetCancelText: { fontSize: 15, fontWeight: "600", color: "#374151" },
});

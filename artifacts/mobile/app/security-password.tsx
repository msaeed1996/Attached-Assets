import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Alert,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as LocalAuth from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BIOMETRIC_KEY = "tg.biometric.enabled";

export default function SecurityPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [showChange, setShowChange] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometric Login");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const headerPad = Math.max(insets.top, Platform.OS === "web" ? 67 : 56) + 8;

  React.useEffect(() => {
    (async () => {
      try {
        const hasHw = await LocalAuth.hasHardwareAsync();
        const enrolled = await LocalAuth.isEnrolledAsync();
        const types = await LocalAuth.supportedAuthenticationTypesAsync();
        let label = "Biometric Login";
        if (types.includes(LocalAuth.AuthenticationType.FACIAL_RECOGNITION)) label = "Face ID Login";
        else if (types.includes(LocalAuth.AuthenticationType.FINGERPRINT)) label = "Touch ID Login";
        else if (types.includes(LocalAuth.AuthenticationType.IRIS)) label = "Iris Login";
        setBiometricLabel(label);
        setBiometricAvailable(hasHw && enrolled);
        const saved = await AsyncStorage.getItem(BIOMETRIC_KEY);
        if (saved === "1" && hasHw && enrolled) setBiometric(true);
      } catch {}
    })();
  }, []);

  async function toggleBiometric(value: boolean) {
    Haptics.selectionAsync();
    if (Platform.OS === "web") {
      Alert.alert("Not available on web", "Biometric login works on iOS and Android only.");
      return;
    }
    if (value) {
      const hasHw = await LocalAuth.hasHardwareAsync();
      const enrolled = await LocalAuth.isEnrolledAsync();
      if (!hasHw) {
        Alert.alert("Unsupported device", "Your device doesn't support biometric authentication.");
        return;
      }
      if (!enrolled) {
        Alert.alert(
          "Set up biometrics first",
          `Please enable Face ID, Touch ID, or fingerprint in your device settings, then try again.`
        );
        return;
      }
      const result = await LocalAuth.authenticateAsync({
        promptMessage: `Enable ${biometricLabel}`,
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      if (result.success) {
        setBiometric(true);
        await AsyncStorage.setItem(BIOMETRIC_KEY, "1");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else {
      setBiometric(false);
      await AsyncStorage.setItem(BIOMETRIC_KEY, "0");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <View style={[styles.header, { paddingTop: headerPad }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security & Password</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.sectionLabel}>ACCOUNT SECURITY</Text>
          <View style={styles.card}>
            <Row
              icon="lock"
              iconBg="#EFF6FF"
              iconColor="#2563EB"
              title="Change Password"
              subtitle="Update your account password"
              onPress={() => setShowChange(true)}
            />
            <Divider />
            <Row
              icon="smartphone"
              iconBg="#F3E8FF"
              iconColor="#7C3AED"
              title={biometricLabel}
              subtitle={
                Platform.OS === "web"
                  ? "Available on iOS and Android only"
                  : !biometricAvailable
                  ? "Set up Face ID or fingerprint in device settings"
                  : biometric
                  ? "Enabled · Use to sign in faster"
                  : "Use biometrics to sign in faster"
              }
              right={
                <Switch
                  value={biometric}
                  onValueChange={toggleBiometric}
                  disabled={Platform.OS === "web" || !biometricAvailable}
                  trackColor={{ true: "#7C3AED", false: "#D1D5DB" }}
                  thumbColor="#fff"
                />
              }
            />
            <Divider />
            <Row
              icon="shield"
              iconBg="#F0FDF4"
              iconColor="#16A34A"
              title="Two-Factor Authentication"
              subtitle={twoFactor ? "Enabled · SMS code on sign-in" : "Add an extra layer of security"}
              right={
                <Switch
                  value={twoFactor}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setTwoFactor(v);
                  }}
                  trackColor={{ true: "#16A34A", false: "#D1D5DB" }}
                  thumbColor="#fff"
                />
              }
            />
          </View>
        </View>

        <View style={styles.tipBox}>
          <Feather name="info" size={14} color="#0759AF" />
          <Text style={styles.tipText}>
            Use a strong password with at least 8 characters, mixing letters, numbers, and symbols.
          </Text>
        </View>
      </ScrollView>

      <ChangePasswordModal visible={showChange} onClose={() => setShowChange(false)} />
    </View>
  );
}

function Row({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const Wrap: any = onPress ? TouchableOpacity : View;
  return (
    <Wrap
      style={styles.row}
      onPress={
        onPress
          ? () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress();
            }
          : undefined
      }
      activeOpacity={0.75}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={17} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {right ?? <Feather name="chevron-right" size={18} color="#D1D5DB" />}
    </Wrap>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ c: false, n: false, cf: false });

  React.useEffect(() => {
    if (!visible) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setShow({ c: false, n: false, cf: false });
      setError(null);
    }
  }, [visible]);

  function strength(pw: string) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  }
  const sLevel = strength(next);
  const sColors = ["#E5E7EB", "#EF4444", "#F59E0B", "#10B981", "#16A34A"];
  const sLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const [error, setError] = useState<string | null>(null);

  function notify(title: string, msg?: string) {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.alert) window.alert(msg ? `${title}\n\n${msg}` : title);
    } else {
      Alert.alert(title, msg);
    }
  }

  function save() {
    setError(null);
    if (!current || !next || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (next.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
    setTimeout(() => notify("Password updated", "Your password has been changed successfully."), 100);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalCenterWrap}
        pointerEvents="box-none"
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.modalIconBtn}>
              <Feather name="arrow-left" size={20} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.modalIconBtn}>
              <Feather name="x" size={20} color="#111827" />
            </TouchableOpacity>
          </View>

          <PasswordField
            placeholder="Current Password"
            value={current}
            onChange={setCurrent}
            visible={show.c}
            onToggle={() => setShow((s) => ({ ...s, c: !s.c }))}
          />
          <PasswordField
            placeholder="New Password"
            value={next}
            onChange={setNext}
            visible={show.n}
            onToggle={() => setShow((s) => ({ ...s, n: !s.n }))}
          />

          {!!next && (
            <View style={styles.strengthRow}>
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.strengthBar,
                    { backgroundColor: i <= sLevel ? sColors[sLevel] : "#E5E7EB" },
                  ]}
                />
              ))}
              <Text style={[styles.strengthLabel, { color: sColors[sLevel] || "#6B7280" }]}>
                {sLabels[sLevel] || ""}
              </Text>
            </View>
          )}

          <PasswordField
            placeholder="Confirm New Password"
            value={confirm}
            onChange={setConfirm}
            visible={show.cf}
            onToggle={() => setShow((s) => ({ ...s, cf: !s.cf }))}
          />

          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.modalActions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Feather name="x-circle" size={14} color="#6B7280" />
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={save}>
              <Feather name="check-circle" size={14} color="#fff" />
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PasswordField({
  placeholder,
  value,
  onChange,
  visible,
  onToggle,
}: {
  placeholder: string;
  value: string;
  onChange: (s: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.pwWrap}>
      <TextInput
        style={styles.pwInput}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChange}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity onPress={onToggle} hitSlop={8} style={styles.pwToggle}>
        <Feather name={visible ? "eye-off" : "eye"} size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0759AF",
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  rowSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 60 },

  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 12,
  },
  tipText: { fontSize: 12, color: "#0759AF", flex: 1, lineHeight: 17 },

  // Modal
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  modalCenterWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  modalIconBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },

  pwWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  pwInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
  },
  pwToggle: { padding: 6 },

  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "700", marginLeft: 6, minWidth: 44, textAlign: "right" },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  errorText: { color: "#B91C1C", fontSize: 12, flex: 1 },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  cancelText: { color: "#374151", fontWeight: "600", fontSize: 13 },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#0759AF",
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});

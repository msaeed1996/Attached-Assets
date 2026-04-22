import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  PanResponder,
  LayoutChangeEvent,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (svgPaths: string[]) => void;
}

export default function SignaturePadModal({ visible, onClose, onSave }: Props) {
  const [paths, setPaths] = useState<string[]>([]);
  const currentPath = useRef<string>("");
  const padOffset = useRef({ x: 0, y: 0 });
  const padRef = useRef<View>(null);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        const x = pageX - padOffset.current.x;
        const y = pageY - padOffset.current.y;
        currentPath.current = `M ${x.toFixed(2)} ${y.toFixed(2)}`;
        setPaths((prev) => [...prev, currentPath.current]);
      },
      onPanResponderMove: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        const x = pageX - padOffset.current.x;
        const y = pageY - padOffset.current.y;
        currentPath.current += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
        setPaths((prev) => {
          const next = [...prev];
          next[next.length - 1] = currentPath.current;
          return next;
        });
      },
      onPanResponderRelease: () => {
        currentPath.current = "";
      },
    }),
  ).current;

  function handleLayout(_e: LayoutChangeEvent) {
    if (padRef.current && typeof padRef.current.measure === "function") {
      padRef.current.measure((_x, _y, _w, _h, pageX, pageY) => {
        padOffset.current = { x: pageX, y: pageY };
      });
    } else if (padRef.current && typeof (padRef.current as any).measureInWindow === "function") {
      (padRef.current as any).measureInWindow((x: number, y: number) => {
        padOffset.current = { x, y };
      });
    }
  }

  function clear() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaths([]);
  }

  function save() {
    if (paths.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(paths);
    setPaths([]);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Sign Below</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Feather name="x" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Use your finger to sign in the box.</Text>

          <View
            ref={padRef}
            style={styles.pad}
            onLayout={handleLayout}
            {...responder.panHandlers}
          >
            <Svg style={StyleSheet.absoluteFill}>
              {paths.map((d, i) => (
                <Path
                  key={i}
                  d={d}
                  stroke="#111827"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
            </Svg>
            {paths.length === 0 && (
              <Text pointerEvents="none" style={styles.padHint}>
                ✍️  Sign here
              </Text>
            )}
            <View pointerEvents="none" style={styles.signLine} />
          </View>

          <View style={styles.actions}>
            <Pressable onPress={clear} style={styles.clearBtn}>
              <Feather name="rotate-ccw" size={14} color="#6b7280" />
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
            <Pressable
              onPress={save}
              style={[
                styles.saveBtn,
                { backgroundColor: paths.length === 0 ? "#9ca3af" : "#2563EB" },
              ]}
              disabled={paths.length === 0}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.saveText}>Save Signature</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.6)",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#111827" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 6, marginBottom: 14 },
  pad: {
    height: 220,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  padHint: {
    position: "absolute",
    alignSelf: "center",
    top: "45%",
    color: "#9ca3af",
    fontSize: 14,
  },
  signLine: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    height: 1,
    backgroundColor: "#d1d5db",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    gap: 12,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  clearText: { color: "#6b7280", fontWeight: "600", fontSize: 13 },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

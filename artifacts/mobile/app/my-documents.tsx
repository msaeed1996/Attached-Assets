import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  FlatList,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";

type Doc = {
  id: string;
  name: string;
  type: string;
  size?: number;
  uri?: string;
  addedAt: string;
};

export default function MyDocumentsScreen() {
  const insets = useSafeAreaInsets();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftFile, setDraftFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const headerPad = Platform.OS === "web" ? insets.top + 67 : Math.max(insets.top, 12) + 4;

  async function pickFile() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        setDraftFile(res.assets[0]);
        if (!draftName) setDraftName(res.assets[0].name.replace(/\.[^.]+$/, ""));
      }
    } catch {
      Alert.alert("Couldn't open file picker");
    }
  }

  function saveDoc() {
    if (!draftName.trim() || !draftFile) {
      Alert.alert("Missing info", "Please add a document name and select a file.");
      return;
    }
    const ext = draftFile.name?.split(".").pop()?.toUpperCase() || "FILE";
    const newDoc: Doc = {
      id: Date.now().toString(),
      name: draftName.trim(),
      type: ext,
      size: draftFile.size,
      uri: draftFile.uri,
      addedAt: new Date().toLocaleDateString(),
    };
    setDocs((d) => [newDoc, ...d]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAdding(false);
    setDraftFile(null);
    setDraftName("");
  }

  function deleteDoc(id: string) {
    Alert.alert("Delete document?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setDocs((d) => d.filter((x) => x.id !== id));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }

  function fmtSize(bytes?: number) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={[styles.header, { paddingTop: headerPad }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Documents</Text>
        <View style={{ width: 36 }} />
      </View>

      {docs.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Feather name="file-text" size={42} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Data Found.</Text>
          <Text style={styles.emptySubtitle}>
            You haven't uploaded any documents yet. Add your first document below.
          </Text>
        </View>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 14, paddingBottom: 110, gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.docCard}>
              <View style={styles.docIcon}>
                <Feather name="file-text" size={20} color="#0759AF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.docName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.docMeta}>
                  {item.type}
                  {item.size ? ` · ${fmtSize(item.size)}` : ""} · {item.addedAt}
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteDoc(item.id)} hitSlop={8} style={styles.delBtn}>
                <Feather name="trash-2" size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Bottom CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setAdding(true);
          }}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add Documents</Text>
        </TouchableOpacity>
      </View>

      {/* Add modal */}
      <Modal visible={adding} animationType="slide" onRequestClose={() => setAdding(false)} transparent={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, backgroundColor: "#F9FAFB" }}
        >
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 56) + 8 }]}>
            <TouchableOpacity onPress={() => setAdding(false)} hitSlop={10} style={styles.iconBtn}>
              <Feather name="x" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Document</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={{ padding: 16, gap: 16 }}>
            <View>
              <Text style={styles.fieldLabel}>Document Name</Text>
              <TextInput
                style={styles.input}
                value={draftName}
                onChangeText={setDraftName}
                placeholder="e.g. W-9 Tax Form"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text style={styles.fieldLabel}>File</Text>
              <TouchableOpacity style={styles.fileBox} onPress={pickFile} activeOpacity={0.85}>
                <Feather
                  name={draftFile ? "check-circle" : "upload-cloud"}
                  size={28}
                  color={draftFile ? "#16a34a" : "#0759AF"}
                />
                <Text style={styles.fileBoxTitle}>
                  {draftFile ? draftFile.name : "Tap to choose a file"}
                </Text>
                <Text style={styles.fileBoxSub}>
                  {draftFile
                    ? `${fmtSize(draftFile.size)} · Tap to change`
                    : "PDF or image, up to 10 MB"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable style={styles.cancelBtn} onPress={() => setAdding(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={saveDoc}>
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.saveText}>Save Document</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: "#6B7280", textAlign: "center", lineHeight: 19 },

  docCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  docIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  docName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  docMeta: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  delBtn: { padding: 8 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#0759AF",
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
  },
  fileBox: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  fileBoxTitle: { fontSize: 14, fontWeight: "600", color: "#111827", textAlign: "center" },
  fileBoxSub: { fontSize: 12, color: "#6B7280", textAlign: "center" },

  modalFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelBtn: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: "#374151", fontWeight: "600", fontSize: 14 },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#0759AF",
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

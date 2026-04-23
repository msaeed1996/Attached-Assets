import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

type IdStatus = "verified" | "pending" | "expired" | "none";

type IdDoc = {
  id: string;
  type: string;
  name: string;
  expiry: string | null;
  status: IdStatus;
  uploadedAt: string;
  fileSize?: string;
};

const ID_TYPES: Array<{ key: string; label: string; icon: string; color: string; bg: string }> = [
  { key: "drivers-license", label: "Driver's License", icon: "credit-card", color: "#2563eb", bg: "#dbeafe" },
  { key: "passport", label: "Passport", icon: "book", color: "#7c3aed", bg: "#ede9fe" },
  { key: "state-id", label: "State ID", icon: "credit-card", color: "#0891b2", bg: "#cffafe" },
  { key: "ssn", label: "Social Security Card", icon: "shield", color: "#16a34a", bg: "#dcfce7" },
  { key: "work-permit", label: "Work Permit", icon: "briefcase", color: "#d97706", bg: "#fef3c7" },
  { key: "resume", label: "Resume", icon: "file-text", color: "#475569", bg: "#f1f5f9" },
  { key: "other", label: "Other Document", icon: "file", color: "#64748b", bg: "#f1f5f9" },
];

const INITIAL: IdDoc[] = [
  { id: "id1", type: "resume", name: "Resume", expiry: null, status: "verified", uploadedAt: "Mar 12, 2026", fileSize: "284 KB" },
  { id: "id2", type: "drivers-license", name: "Driver's License", expiry: "2028-06-14", status: "verified", uploadedAt: "Feb 28, 2026", fileSize: "1.2 MB" },
];

function statusMeta(s: IdStatus) {
  if (s === "verified") return { label: "Verified", color: "#15803d", bg: "#dcfce7", icon: "check-circle" };
  if (s === "pending") return { label: "Pending Review", color: "#a16207", bg: "#fef3c7", icon: "clock" };
  if (s === "expired") return { label: "Expired", color: "#b91c1c", bg: "#fee2e2", icon: "alert-triangle" };
  return { label: "Action Needed", color: "#64748b", bg: "#f1f5f9", icon: "alert-circle" };
}

function formatExpiry(dateStr: string | null) {
  if (!dateStr) return "No expiry";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function isExpiringSoon(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const days = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days > 0 && days <= 60;
}

function isExpired(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

export default function MyIdsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === "ios" ? 50 : 24);

  const [items, setItems] = useState<IdDoc[]>(INITIAL);

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [pickedType, setPickedType] = useState<string | null>(null);
  const [pickedSource, setPickedSource] = useState<"camera" | "gallery" | "file" | null>(null);
  const [expiry, setExpiry] = useState("");

  // Confirm delete
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Preview / download
  const [previewItem, setPreviewItem] = useState<IdDoc | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = items.length;
    const verified = items.filter((i) => i.status === "verified").length;
    const expiringSoon = items.filter((i) => isExpiringSoon(i.expiry)).length;
    return { total, verified, expiringSoon };
  }, [items]);

  function openAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickedType(null);
    setPickedSource(null);
    setExpiry("");
    setAddOpen(true);
  }

  function pickType(k: string) {
    Haptics.selectionAsync();
    setPickedType(k);
  }
  function pickSource(s: "camera" | "gallery" | "file") {
    Haptics.selectionAsync();
    setPickedSource(s);
  }

  function saveNew() {
    if (!pickedType || !pickedSource) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    const def = ID_TYPES.find((t) => t.key === pickedType)!;
    const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    setItems((prev) => [
      {
        id: `id_${Date.now()}`,
        type: pickedType,
        name: def.label,
        expiry: expiry.trim() || null,
        status: "pending",
        uploadedAt: today,
        fileSize: pickedSource === "camera" ? "1.4 MB" : "892 KB",
      },
      ...prev,
    ]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAddOpen(false);
  }

  function download(item: IdDoc) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDownloadedId(item.id);
    setTimeout(() => setDownloadedId((cur) => (cur === item.id ? null : cur)), 2000);
    if (Platform.OS === "web") {
      const safe = item.name.replace(/[^a-z0-9]+/gi, "_");
      const content = `TrueGigs Document\n\nName: ${item.name}\nUploaded: ${item.uploadedAt}\nExpiry: ${item.expiry ?? "N/A"}\nStatus: ${item.status}\n`;
      try {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safe}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch {}
      return;
    }
    Alert.alert("Download started", `${item.name} has been saved to your device.`);
  }

  function view(item: IdDoc) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewItem(item);
  }

  function confirmDelete(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfirmId(id);
  }

  function doDelete() {
    if (!confirmId) return;
    setItems((prev) => prev.filter((i) => i.id !== confirmId));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConfirmId(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My IDs</Text>
        <TouchableOpacity onPress={openAdd} style={styles.headerAction} activeOpacity={0.8}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Documents</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: "#16a34a" }]}>{stats.verified}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: stats.expiringSoon > 0 ? "#d97706" : "#111827" }]}>
            {stats.expiringSoon}
          </Text>
          <Text style={styles.statLabel}>Expiring Soon</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="folder" size={26} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No IDs uploaded yet</Text>
            <Text style={styles.emptyBody}>
              Upload your IDs and documents so employers can verify you and you can apply faster.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openAdd} activeOpacity={0.85}>
              <Feather name="plus" size={14} color="#fff" />
              <Text style={styles.emptyBtnText}>Upload Your First ID</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => {
            const def = ID_TYPES.find((t) => t.key === item.type) ?? ID_TYPES[ID_TYPES.length - 1];
            const expiringSoon = isExpiringSoon(item.expiry);
            const expired = isExpired(item.expiry);
            const effectiveStatus: IdStatus = expired ? "expired" : item.status;
            const st = statusMeta(effectiveStatus);
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconBubble, { backgroundColor: def.bg }]}>
                    <Feather name={def.icon as any} size={18} color={def.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta}>
                      Uploaded {item.uploadedAt}
                      {item.fileSize ? ` · ${item.fileSize}` : ""}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                    <Feather name={st.icon as any} size={10} color={st.color} />
                    <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>

                <View style={styles.cardMid}>
                  <View style={styles.midItem}>
                    <Feather name="calendar" size={11} color="#94a3b8" />
                    <Text style={styles.midLabel}>Expires:</Text>
                    <Text
                      style={[
                        styles.midValue,
                        expired && { color: "#b91c1c" },
                        !expired && expiringSoon && { color: "#d97706" },
                      ]}
                    >
                      {formatExpiry(item.expiry)}
                    </Text>
                    {expiringSoon && !expired && (
                      <View style={styles.warnPill}>
                        <Text style={styles.warnText}>Soon</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => view(item)} activeOpacity={0.8}>
                    <Feather name="eye" size={13} color="#475569" />
                    <Text style={styles.actionText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => download(item)} activeOpacity={0.8}>
                    <Feather
                      name={downloadedId === item.id ? "check" : "download"}
                      size={13}
                      color={downloadedId === item.id ? "#16a34a" : "#475569"}
                    />
                    <Text
                      style={[
                        styles.actionText,
                        downloadedId === item.id && { color: "#16a34a" },
                      ]}
                    >
                      {downloadedId === item.id ? "Saved" : "Download"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDanger]}
                    onPress={() => confirmDelete(item.id)}
                    activeOpacity={0.8}
                  >
                    <Feather name="trash-2" size={13} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {items.length > 0 && (
          <View style={styles.tipBox}>
            <Feather name="shield" size={13} color="#16a34a" />
            <Text style={styles.tipText}>
              Your documents are encrypted and only shared with employers when you apply.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add ID Modal */}
      <Modal visible={addOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setAddOpen(false)}>
        {Platform.OS === "ios" ? (
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddOpen(false)}>
            <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.backdrop,
              StyleSheet.absoluteFill,
              Platform.OS === "web" &&
                ({ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" } as any),
            ]}
            onPress={() => setAddOpen(false)}
          />
        )}
        <Pressable style={styles.previewWrap} onPress={() => setAddOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Upload a Document</Text>
            <Text style={styles.sheetSub}>Pick a document type and where to upload from.</Text>

            <Text style={styles.sectionLabel}>Document Type</Text>
            <View style={styles.typeGrid}>
              {ID_TYPES.map((t) => {
                const active = pickedType === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.typeChip, active && { borderColor: t.color, backgroundColor: t.bg }]}
                    onPress={() => pickType(t.key)}
                    activeOpacity={0.8}
                  >
                    <Feather name={t.icon as any} size={13} color={active ? t.color : "#64748b"} />
                    <Text style={[styles.typeChipText, active && { color: t.color, fontWeight: "800" }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Upload Source</Text>
            <View style={styles.sourceRow}>
              {[
                { key: "camera" as const, label: "Camera", icon: "camera" },
                { key: "gallery" as const, label: "Gallery", icon: "image" },
                { key: "file" as const, label: "File", icon: "file-text" },
              ].map((s) => {
                const active = pickedSource === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.sourceBtn, active && styles.sourceBtnActive]}
                    onPress={() => pickSource(s.key)}
                    activeOpacity={0.8}
                  >
                    <Feather name={s.icon as any} size={18} color={active ? "#2563eb" : "#475569"} />
                    <Text style={[styles.sourceText, active && styles.sourceTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Expiry Date (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={expiry}
              onChangeText={setExpiry}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, (!pickedType || !pickedSource) && styles.primaryBtnDisabled]}
              onPress={saveNew}
              disabled={!pickedType || !pickedSource}
              activeOpacity={0.85}
            >
              <Feather name="upload" size={15} color="#fff" />
              <Text style={styles.primaryBtnText}>Upload Document</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete confirm */}

      <Modal visible={!!confirmId} animationType="fade" transparent onRequestClose={() => setConfirmId(null)}>
        <View style={styles.backdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Feather name="alert-triangle" size={20} color="#dc2626" />
            </View>
            <Text style={styles.confirmTitle}>Delete this document?</Text>
            <Text style={styles.confirmBody}>
              This will permanently remove the document from your account.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setConfirmId(null)} activeOpacity={0.85}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDelete} onPress={doDelete} activeOpacity={0.85}>
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Preview modal */}
      <Modal visible={!!previewItem} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setPreviewItem(null)}>
        {Platform.OS === "ios" ? (
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPreviewItem(null)}>
            <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.backdrop,
              StyleSheet.absoluteFill,
              Platform.OS === "web" &&
                ({ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" } as any),
            ]}
            onPress={() => setPreviewItem(null)}
          />
        )}
        <Pressable style={styles.previewWrap} onPress={() => setPreviewItem(null)}>
          <Pressable style={styles.previewCard} onPress={() => {}}>
            {previewItem && (() => {
              const def = ID_TYPES.find((t) => t.key === previewItem.type) ?? ID_TYPES[ID_TYPES.length - 1];
              const st = statusMeta(previewItem.status);
              return (
                <>
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewTitle}>{previewItem.name}</Text>
                    <TouchableOpacity onPress={() => setPreviewItem(null)} hitSlop={8}>
                      <Feather name="x" size={20} color="#475569" />
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.previewDoc, { backgroundColor: def.bg }]}>
                    <Feather name={def.icon as any} size={56} color={def.color} />
                    <Text style={[styles.previewDocLabel, { color: def.color }]}>
                      Document Preview
                    </Text>
                    <Text style={styles.previewDocSub}>
                      Secure preview — full document visible only to verified employers.
                    </Text>
                  </View>
                  <View style={styles.previewMetaRow}>
                    <Text style={styles.previewMetaKey}>Status</Text>
                    <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                      <Feather name={st.icon as any} size={11} color={st.color} />
                      <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  <View style={styles.previewMetaRow}>
                    <Text style={styles.previewMetaKey}>Uploaded</Text>
                    <Text style={styles.previewMetaVal}>{previewItem.uploadedAt}</Text>
                  </View>
                  <View style={styles.previewMetaRow}>
                    <Text style={styles.previewMetaKey}>Expires</Text>
                    <Text style={styles.previewMetaVal}>{formatExpiry(previewItem.expiry)}</Text>
                  </View>
                  {previewItem.fileSize && (
                    <View style={styles.previewMetaRow}>
                      <Text style={styles.previewMetaKey}>File size</Text>
                      <Text style={styles.previewMetaVal}>{previewItem.fileSize}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.previewBtn}
                    onPress={() => {
                      const it = previewItem;
                      setPreviewItem(null);
                      if (it) download(it);
                    }}
                    activeOpacity={0.85}
                  >
                    <Feather name="download" size={15} color="#fff" />
                    <Text style={styles.previewBtnText}>Download</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0759af",
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerAction: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "rgba(255,255,255,0.18)" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.2 },

  statsBanner: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "900", color: "#111827", letterSpacing: -0.4 },
  statLabel: { fontSize: 10, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#e5e7eb", marginVertical: 6 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    gap: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBubble: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "800", color: "#111827" },
  meta: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },

  cardMid: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  midItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  midLabel: { fontSize: 11, color: "#6b7280", fontWeight: "600" },
  midValue: { fontSize: 11, color: "#111827", fontWeight: "700", flex: 1 },
  warnPill: { backgroundColor: "#fef3c7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  warnText: { fontSize: 9, color: "#a16207", fontWeight: "800", textTransform: "uppercase" },

  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  actionBtnDanger: { flex: 0, paddingHorizontal: 14, backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  actionText: { fontSize: 12, fontWeight: "700", color: "#475569" },

  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  tipText: { flex: 1, fontSize: 11, color: "#166534", lineHeight: 16 },

  empty: { alignItems: "center", paddingTop: 50, paddingHorizontal: 24, gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: "#111827", marginTop: 4 },
  emptyBody: { fontSize: 12, color: "#64748b", textAlign: "center", lineHeight: 18 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0759af",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 10,
  },
  emptyBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  // Modal
  backdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.55)", justifyContent: "flex-end" },
  previewWrap: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  sheetHandle: { alignSelf: "center", width: 38, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  sheetSub: { fontSize: 12, color: "#6b7280", marginTop: 4 },

  sectionLabel: { fontSize: 11, fontWeight: "800", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  typeChipText: { fontSize: 12, color: "#475569", fontWeight: "600" },

  sourceRow: { flexDirection: "row", gap: 8 },
  sourceBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sourceBtnActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  sourceText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  sourceTextActive: { color: "#2563eb" },

  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },

  primaryBtn: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0759af",
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnDisabled: { backgroundColor: "#94a3b8" },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: -0.2 },

  // Confirm
  confirmCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    margin: 24,
    alignItems: "center",
    gap: 8,
  },
  confirmIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  confirmTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  confirmBody: { fontSize: 12, color: "#64748b", textAlign: "center", lineHeight: 18 },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 14, alignSelf: "stretch" },
  confirmCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#f1f5f9", alignItems: "center" },
  confirmCancelText: { fontSize: 13, fontWeight: "800", color: "#475569" },
  confirmDelete: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#dc2626", alignItems: "center" },
  confirmDeleteText: { fontSize: 13, fontWeight: "800", color: "#fff" },

  previewCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
  },
  previewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  previewTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  previewDoc: {
    height: 180,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginBottom: 14,
    gap: 6,
  },
  previewDocLabel: { fontSize: 13, fontWeight: "800", marginTop: 6 },
  previewDocSub: { fontSize: 11, color: "#475569", textAlign: "center", marginTop: 2 },
  previewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  previewMetaKey: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  previewMetaVal: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  previewBtn: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#0759AF",
  },
  previewBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});

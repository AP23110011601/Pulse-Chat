import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import api, { uploadFormData, uploadFileUri, ensureFileLocal } from "../api";
import { getSocket } from "../socket";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import MessageBubble from "../components/MessageBubble";
import ReactionPicker from "../components/ReactionPicker";
import SmartReplyBar from "../components/SmartReplyBar";

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function GroupChatScreen({ route, navigation }) {
  const { groupId, name } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingLabel, setTypingLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [replyMessage, setReplyMessage] = useState(null);
  const [activePickerMsg, setActivePickerMsg] = useState(null);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const listRef = useRef(null);
  const typingTimeout = useRef(null);

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleGenerateSummary = useCallback(async () => {
    setSummaryVisible(true);
    setGeneratingSummary(true);
    try {
      let currentMsgs = messagesRef.current;
      if (!currentMsgs || currentMsgs.length === 0) {
        try {
          const { data } = await api.get(`/api/messages/group/${groupId}`);
          if (data && data.length > 0) {
            currentMsgs = data;
          }
        } catch (fetchErr) {
          console.log("Group fallback message fetch error:", fetchErr.message);
        }
      }

      const payloadMsgs = (currentMsgs || [])
        .map((m) => {
          const senderId = m.sender?._id || m.sender;
          const isMe = String(senderId) === String(user.id);
          const senderName = m.sender?.username || (isMe ? user.username : "Member");

          const textValue =
            m.text?.trim() ||
            (m.type === "image"
              ? "📷 Photo"
              : m.type === "audio"
              ? "🎤 Voice message"
              : m.type === "document"
              ? `📄 ${m.fileName || "Document"}`
              : "Message");

          return {
            senderName,
            text: textValue,
            createdAt: m.createdAt || new Date().toISOString(),
          };
        })
        .filter((m) => m.text?.trim());

      if (payloadMsgs.length === 0) {
        setSummaryText("No messages found in this group yet to summarize.");
        setGeneratingSummary(false);
        return;
      }

      const { data } = await api.post("/api/ai/summary", { messages: payloadMsgs });
      setSummaryText(data?.summary || "No summary available.");
    } catch (err) {
      console.log("Group summary error:", err.response?.data || err.message || err);
      const errMsg = err.response?.data?.error || err.message || "Could not generate summary.";
      setSummaryText(`Summary Error: ${errMsg}`);
    } finally {
      setGeneratingSummary(false);
    }
  }, [groupId, user.id, user.username]);

  useEffect(() => {
    navigation.setOptions({
      title: name,
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginRight: 8 }}>
          <TouchableOpacity onPress={handleGenerateSummary}>
            <Text style={{ fontSize: 18 }}>✨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("GroupInfo", { groupId, name })}
          >
            <Text style={{ color: theme.primary, fontWeight: "800", fontSize: 14 }}>Info ℹ️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, groupId, name, theme, handleGenerateSummary]);

  useEffect(() => {
    let mounted = true;
    const socket = getSocket();
    socket?.emit("join_group", groupId);

    (async () => {
      try {
        const { data } = await api.get(`/api/messages/group/${groupId}`);
        if (mounted) setMessages(data);
      } catch (error) {
        console.log(error.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const onMessage = (msg) => {
      if (String(msg.group) !== String(groupId)) return;
      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
        return [...prev, msg];
      });
    };

    const onTyping = (payload) => {
      if (String(payload.groupId) !== String(groupId)) return;
      if (String(payload.userId) === String(user.id)) return;
      setTypingLabel(
        payload.isTyping ? `${payload.username || "Someone"} is typing…` : ""
      );
    };

    const onMessageReacted = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(messageId) ? { ...m, reactions } : m))
      );
    };

    const onMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(messageId)
            ? { ...m, isDeletedForEveryone: true, text: "🚫 This message was deleted" }
            : m
        )
      );
    };

    socket?.on("receive_group_message", onMessage);
    socket?.on("typing_group", onTyping);
    socket?.on("message_reacted", onMessageReacted);
    socket?.on("message_deleted", onMessageDeleted);

    return () => {
      mounted = false;
      socket?.off("receive_group_message", onMessage);
      socket?.off("typing_group", onTyping);
      socket?.off("message_reacted", onMessageReacted);
      socket?.off("message_deleted", onMessageDeleted);
      socket?.emit("typing_group", {
        groupId,
        isTyping: false,
        username: user.username,
      });
    };
  }, [groupId, user.id, user.username]);

  const emitTyping = (isTyping) => {
    getSocket()?.emit("typing_group", {
      groupId,
      isTyping,
      username: user.username,
    });
  };

  const onChangeText = (value) => {
    setText(value);
    emitTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(false), 1200);
  };

  const sendPayload = (payload) => {
    getSocket()?.emit("send_group_message", payload, (ack) => {
      if (ack?.error) Alert.alert("Send failed", ack.error);
    });
  };

  const sendMessage = (overrideText) => {
    const content = (overrideText || text).trim();
    if (!content) return;
    setText("");
    emitTyping(false);
    sendPayload({
      groupId,
      text: content,
      type: "text",
      replyToId: replyMessage?._id || null,
    });
    setReplyMessage(null);
  };

  const getMimeType = (filename) => {
    const ext = (filename || "").split(".").pop()?.toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "pdf":
        return "application/pdf";
      case "mp3":
        return "audio/mpeg";
      case "wav":
        return "audio/wav";
      case "aac":
        return "audio/aac";
      case "m4a":
        return "audio/mp4";
      default:
        return "application/octet-stream";
    }
  };

  const sendFileMessage = async (mode) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });
    if (result.canceled || result.type === "cancel") return;

    const file = result.assets?.[0] || result;
    if (!file) return;

    const uri = file.fileCopyUri || file.uri;
    const filename = file.name || file.originalname || uri?.split("/").pop() || `file-${Date.now()}`;
    const mimeType = file.mimeType || file.type || getMimeType(filename);
    console.log("Group document selected", { uri, filename, mimeType, result });

    setUploading(true);
    try {
      // Ensure content URIs are cached locally first
      const uploadUri = uri && uri.startsWith("content://") ? await ensureFileLocal(uri, filename) : uri;
      let data;
      if (uploadUri && (uploadUri.startsWith("content://") || uploadUri.startsWith("file://") || uploadUri.startsWith("/"))) {
        data = await uploadFileUri("/api/messages/upload-file", uploadUri, "file", filename, mimeType);
      } else {
        const formData = new FormData();
        formData.append("file", { uri, name: filename, type: mimeType });
        data = await uploadFormData("/api/messages/upload-file", formData);
      }
      sendPayload({
        groupId,
        type: mode === "audio" ? "audio" : "document",
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        text: mode === "audio" ? `🎵 ${data.fileName}` : `📄 ${data.fileName}`,
        replyToId: replyMessage?._id || null,
      });
      setReplyMessage(null);
    } catch (error) {
      console.log("Group file upload error", error);
      const message = error.response?.data?.error || error.message || "Could not send file.";
      Alert.alert("Upload failed", message);
    } finally {
      setUploading(false);
    }
  };

  const uploadVoiceRecording = async (uri, durationSeconds) => {
    const filename = uri.split("/").pop() || `voice-${Date.now()}.m4a`;
    const mimeType = getMimeType(filename);
    setUploading(true);
    try {
      let data;
      if (uri && (uri.startsWith("content://") || uri.startsWith("file://"))) {
        data = await uploadFileUri("/api/messages/upload-file", uri, "file", filename, mimeType);
      } else {
        const formData = new FormData();
        formData.append("file", { uri, name: filename, type: mimeType });
        data = await uploadFormData("/api/messages/upload-file", formData);
      }
      sendPayload({
        groupId,
        type: "audio",
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        text: `🎤 Voice message (${durationSeconds}s)`,

        replyToId: replyMessage?._id || null,
      });
      setReplyMessage(null);
    } catch (error) {
      console.log("Group voice upload error", error);
      const message = error.response?.data?.error || error.message || "Could not send voice recording.";
      Alert.alert("Upload failed", message);
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Microphone access required", "Allow microphone access to record voice messages.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingInstance = new Audio.Recording();
      await recordingInstance.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      recordingInstance.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && typeof status.durationMillis === "number") {
          setRecordingDuration(Math.ceil(status.durationMillis / 1000));
        }
      });
      await recordingInstance.startAsync();
      setRecording(recordingInstance);
      setIsRecording(true);
    } catch (error) {
      console.log("Recording start error", error);
      Alert.alert("Recording error", "Could not start recording.");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const status = await recording.getStatusAsync();
      const durationSeconds = Math.ceil((status.durationMillis || recordingDuration || 1000) / 1000);
      const uri = recording.getURI();
      setIsRecording(false);
      setRecording(null);
      setRecordingDuration(0);

      if (!uri) throw new Error("Recording file not available");
      await uploadVoiceRecording(uri, durationSeconds || 1);
    } catch (error) {
      console.log("Recording stop error", error);
      Alert.alert("Recording error", "Could not finish recording.");
      setIsRecording(false);
      setRecording(null);
      setRecordingDuration(0);
    }
  };

  const sendVoiceMessage = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sendCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow camera access.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const filename = asset.uri.split("/").pop() || "camera.jpg";
    const type = "image/jpeg";

    setUploading(true);
    try {
      const uploadUri = asset.uri && asset.uri.startsWith("content://") ? await ensureFileLocal(asset.uri, filename) : asset.uri;
      let data;
      if (uploadUri && (uploadUri.startsWith("content://") || uploadUri.startsWith("file://") || uploadUri.startsWith("/"))) {
        data = await uploadFileUri("/api/messages/upload-image", uploadUri, "image", filename, type);
      } else {
        const formData = new FormData();
        formData.append("image", { uri: asset.uri, name: filename, type });
        data = await uploadFormData("/api/messages/upload-image", formData);
      }
      sendPayload({
        groupId,
        type: "image",
        imageUrl: data.imageUrl,
        text: "📷 Photo",
        replyToId: replyMessage?._id || null,
      });
      setReplyMessage(null);
    } catch (error) {
      console.log("Group camera upload error", error);
      Alert.alert("Upload failed", error.response?.data?.error || "Could not send camera photo.");
    } finally {
      setUploading(false);
    }
  };

  const sendImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const filename = asset.uri.split("/").pop() || "chat.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    setUploading(true);
    try {
      const uploadUri = asset.uri && asset.uri.startsWith("content://") ? await ensureFileLocal(asset.uri, filename) : asset.uri;
      let data;
      if (uploadUri && (uploadUri.startsWith("content://") || uploadUri.startsWith("file://") || uploadUri.startsWith("/"))) {
        data = await uploadFileUri("/api/messages/upload-image", uploadUri, "image", filename, type);
      } else {
        const formData = new FormData();
        formData.append("image", { uri: asset.uri, name: filename, type });
        data = await uploadFormData("/api/messages/upload-image", formData);
      }
      sendPayload({
        groupId,
        type: "image",
        imageUrl: data.imageUrl,
        text: "📷 Photo",
        replyToId: replyMessage?._id || null,
      });
      setReplyMessage(null);
    } catch (error) {
      console.log("Group gallery upload error", error);
      Alert.alert("Upload failed", error.response?.data?.error || "Could not send image.");
    } finally {
      setUploading(false);
    }
  };

  const handleReact = (emoji) => {
    if (!activePickerMsg) return;
    const socket = getSocket();
    socket?.emit("react_message", {
      messageId: activePickerMsg._id,
      emoji,
      targetRoom: `group:${groupId}`,
    });
    api.post(`/api/messages/${activePickerMsg._id}/react`, { emoji });
  };

  const handleDelete = (mode) => {
    if (!activePickerMsg) return;
    const socket = getSocket();
    socket?.emit("delete_message", {
      messageId: activePickerMsg._id,
      mode,
      targetRoom: `group:${groupId}`,
    });
    api.post(`/api/messages/${activePickerMsg._id}/delete`, { mode });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.mainWrapper}>
        {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item._id)}
          renderItem={({ item }) => {
            const senderId = item.sender?._id || item.sender;
            const isMine = String(senderId) === String(user.id);
            return (
              <MessageBubble
                message={item}
                isMine={isMine}
                senderName={!isMine ? item.sender?.username : null}
                time={formatTime(item.createdAt)}
                onLongPress={(msg) => setActivePickerMsg(msg)}
              />
            );
          }}
          contentContainerStyle={{ paddingVertical: 12 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {typingLabel ? (
        <Text style={[styles.typing, { color: theme.royalPurple }]}>{typingLabel}</Text>
      ) : null}

      {/* Reply Quote Bar */}
      {replyMessage ? (
        <View style={[styles.replyBox, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.replyBoxTitle, { color: theme.primary }]}>
              Replying to {replyMessage.sender?.username || "Message"}
            </Text>
            <Text style={[styles.replyBoxSub, { color: theme.textSecondary }]} numberOfLines={1}>
              {replyMessage.text}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyMessage(null)}>
            <Text style={styles.replyClose}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Composer */}
      <View style={[styles.composer, { backgroundColor: theme.surface, borderTopColor: theme.cardBorder }]}>
        <TouchableOpacity style={[styles.attachBtn, { backgroundColor: theme.card }]} onPress={sendCamera} disabled={uploading}>
          <Text style={[styles.attachText, { color: theme.primary }]}>{uploading ? "…" : "📷"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.attachBtn, { backgroundColor: theme.card }]} onPress={sendImage} disabled={uploading}>
          <Text style={[styles.attachText, { color: theme.primary }]}>🖼️</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.attachBtn, { backgroundColor: theme.card }]} onPress={sendVoiceMessage} disabled={uploading}>
          <Text style={[styles.attachText, { color: theme.royalPurple }]}> {isRecording ? `⏹ ${recordingDuration}s` : "🎤"} </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.attachBtn, { backgroundColor: theme.card }]} onPress={() => sendFileMessage("document")} disabled={uploading}>
          <Text style={[styles.attachText, { color: theme.cyan }]}>📄</Text>
        </TouchableOpacity>

        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
          ]}
          placeholder="Message group…"
          placeholderTextColor={theme.textMuted}
          value={text}
          onChangeText={onChangeText}
          multiline
        />

        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: theme.primary }]}
          onPress={() => sendMessage()}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
      </View>

      <ReactionPicker
        visible={!!activePickerMsg}
        onClose={() => setActivePickerMsg(null)}
        onReact={handleReact}
        onReply={() => setReplyMessage(activePickerMsg)}
        onForward={() => Alert.alert("Forward", "Message copied to clipboard.")}
        onDelete={handleDelete}
        isMine={String(activePickerMsg?.sender?._id || activePickerMsg?.sender) === String(user.id)}
      />

      {/* AI Summary Modal */}
      <Modal transparent visible={summaryVisible} animationType="slide" onRequestClose={() => setSummaryVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>✨ AI Group Chat Summary</Text>
            {generatingSummary ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 250, marginVertical: 12 }}>
                <Text style={{ color: theme.textSecondary, lineHeight: 22, fontSize: 14 }}>
                  {summaryText}
                </Text>
              </ScrollView>
            )}
            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: theme.primary }]}
              onPress={() => setSummaryVisible(false)}
            >
              <Text style={{ color: "#FFF", fontWeight: "700" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 850,
    alignSelf: "center",
  },
  typing: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  replyBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  replyBoxTitle: { fontSize: 12, fontWeight: "800" },
  replyBoxSub: { fontSize: 13, marginTop: 2 },
  replyClose: { fontSize: 16, fontWeight: "900", color: "#9CA3AF", padding: 4 },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  attachText: { fontSize: 16, fontWeight: "700" },
  input: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendBtn: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendText: { color: "#FFF", fontWeight: "800" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 500,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalCloseBtn: {
    alignSelf: "flex-end",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginTop: 10,
  },
});

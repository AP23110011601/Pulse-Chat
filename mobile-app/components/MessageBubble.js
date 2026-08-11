import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Linking,
  Alert,
  Modal,
} from "react-native";
import { Audio } from "expo-av";
import { API_URL } from "../config";
import { useTheme } from "../context/ThemeContext";

function renderTicks(status, theme) {
  if (status === "read") return { text: "✓✓", color: theme.tickRead };
  if (status === "delivered") return { text: "✓✓", color: "rgba(255,255,255,0.75)" };
  return { text: "✓", color: "rgba(255,255,255,0.65)" };
}

function getMediaUrl(urlPath) {
  if (!urlPath) return "";
  if (urlPath.startsWith("http://") || urlPath.startsWith("https://")) {
    return urlPath;
  }
  const cleanApi = API_URL.replace(/\/$/, "");
  const cleanPath = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
  return `${cleanApi}${cleanPath}`;
}

export default function MessageBubble({
  message,
  isMine,
  senderName,
  time,
  onLongPress,
  onTranslate,
}) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { theme } = useTheme();
  const {
    text,
    type = "text",
    imageUrl,
    fileUrl,
    fileName,
    fileSize,
    status,
    replyTo,
    reactions = [],
    isDeletedForEveryone,
    forwarded,
    translatedText,
  } = message || {};

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playAudio = async () => {
    if (!fileUrl) return;
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isPlaying) {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
          setIsPlaying(false);
          return;
        }
      }

      const uri = getMediaUrl(fileUrl);
      const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (err) {
      console.log("Audio playback error:", err);
    }
  };

  const openDocument = async () => {
    try {
      if (!fileUrl) {
        Alert.alert("Error", "File URL not available");
        return;
      }

      const url = getMediaUrl(fileUrl);

      console.log("Opening file:", url);

      await Linking.openURL(encodeURI(url));
    } catch (error) {
      console.log("Open document error:", error);
      Alert.alert("Error", "Unable to open file");
    }
  };

  const [imageModalVisible, setImageModalVisible] = useState(false);

  const isImageFile =
    type === "image" ||
    (imageUrl && imageUrl.trim().length > 0) ||
    (fileUrl && /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl)) ||
    (fileName && /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName));

  const resolvedImageSource = imageUrl || (isImageFile ? fileUrl : null);
  const imageUri = resolvedImageSource ? getMediaUrl(resolvedImageSource) : null;

  const ticks = isMine && !isDeletedForEveryone ? renderTicks(status, theme) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={() => onLongPress?.(message)}
      style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}
    >
      <View
        style={[
          styles.bubble,
          isMine
            ? {
                backgroundColor: theme.mineBubble,
                borderBottomRightRadius: 4,
                shadowColor: theme.mineBubble,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              }
            : {
                backgroundColor: theme.cardElevated,
                borderColor: theme.cardBorder,
                borderWidth: 1,
                borderBottomLeftRadius: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              },
        ]}
      >
        {/* Forwarded Tag */}
        {forwarded ? (
          <Text style={[styles.forwardTag, isMine ? { color: "rgba(255,255,255,0.85)" } : { color: theme.textMuted }]}>
            ↪️ Forwarded
          </Text>
        ) : null}

        {/* Sender Username */}
        {!isMine && senderName ? (
          <Text style={[styles.sender, { color: theme.royalPurple }]}>{senderName}</Text>
        ) : null}

        {/* Quoted Reply Card */}
        {replyTo ? (
          <View
            style={[
              styles.replyCard,
              {
                backgroundColor: isMine ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.15)",
                borderLeftColor: isMine ? "#FFF" : theme.primary,
              },
            ]}
          >
            <Text style={[styles.replySender, { color: isMine ? "#FFF" : theme.primary }]}>
              {replyTo.sender?.username || "Reply"}
            </Text>
            <Text style={[styles.replyText, { color: isMine ? "rgba(255,255,255,0.9)" : theme.textSecondary }]} numberOfLines={1}>
              {replyTo.text || "Media"}
            </Text>
          </View>
        ) : null}

        {/* Image Attachment (shows for any image message or jpg/png file) */}
        {isImageFile && imageUri ? (
          <TouchableOpacity activeOpacity={0.85} onPress={() => setImageModalVisible(true)}>
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          </TouchableOpacity>
        ) : null}

        {/* Voice Audio Player UI */}
        {type === "audio" ? (
          <View style={styles.audioRow}>
            <TouchableOpacity
              onPress={playAudio}
              style={[styles.playBtn, { backgroundColor: isMine ? "rgba(255,255,255,0.25)" : theme.primary }]}
            >
              <Text style={styles.playIcon}>{isPlaying ? "⏸" : "▶"}</Text>
            </TouchableOpacity>
            <Text style={[styles.audioTime, { color: isMine ? "#FFF" : theme.textSecondary }]}> 
              {(() => {
                const match = text?.match(/\((\d+)s\)/);
                return match ? `${match[1]}s` : "0:15";
              })()}
            </Text>
          </View>
        ) : null}

        {/* Non-image Document Attachment */}
        {type === "document" && !isImageFile ? (
          <Pressable onPress={openDocument} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }] }>
            <View style={styles.docRow}>
              <Text style={styles.docIcon}>📄</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.docName, { color: isMine ? "#FFF" : theme.text }]} numberOfLines={1}>
                  {fileName || "Document.pdf"}
                </Text>
                <Text style={[styles.docSize, { color: isMine ? "rgba(255,255,255,0.75)" : theme.textMuted }]}> 
                  {fileSize || "1.4 MB"}
                </Text>
                <Text style={styles.openText}>
                  Tap to open
                </Text>
              </View>
            </View>
          </Pressable>
        ) : null}

        {/* Message Text */}
        {text && !isDeletedForEveryone ? (
          <Text
            style={[
              styles.text,
              { color: isMine ? "#FFFFFF" : theme.text },
            ]}
          >
            {text}
          </Text>
        ) : isDeletedForEveryone ? (
          <Text style={[styles.deletedText, { color: isMine ? "rgba(255,255,255,0.75)" : theme.textMuted }]}> 
            🚫 This message was deleted
          </Text>
        ) : null}

        {/* Translated Text */}
        {translatedText ? (
          <View style={styles.translationBox}>
            <Text style={styles.translationLabel}>🌐 Translated:</Text>
            <Text style={styles.translationText}>{translatedText}</Text>
          </View>
        ) : null}

        {/* Footer Meta (Timestamp + Status Ticks) */}
        <View style={styles.meta}>
          {time ? (
            <Text
              style={[
                styles.time,
                { color: isMine ? "rgba(255,255,255,0.8)" : theme.textMuted },
              ]}
            >
              {time}
            </Text>
          ) : null}

          {ticks ? (
            <Text style={[styles.ticks, { color: ticks.color }]}>{ticks.text}</Text>
          ) : null}
        </View>

        {/* Reactions Badges */}
        {/* Fullscreen Image Preview Modal */}
        <Modal
          transparent
          visible={imageModalVisible}
          animationType="fade"
          onRequestClose={() => setImageModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalCloseArea} activeOpacity={1} onPress={() => setImageModalVisible(false)}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setImageModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕ Close</Text>
              </TouchableOpacity>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.fullImage} resizeMode="contain" />
              ) : null}
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  rowMine: { alignItems: "flex-end" },
  rowTheirs: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "82%",
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 11,
    position: "relative",
  },
  forwardTag: {
    fontSize: 10.5,
    fontWeight: "800",
    marginBottom: 4,
  },
  sender: {
    fontSize: 12.5,
    fontWeight: "800",
    marginBottom: 4,
  },
  replyCard: {
    borderLeftWidth: 3.5,
    paddingLeft: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 8,
  },
  replySender: {
    fontSize: 11.5,
    fontWeight: "800",
  },
  replyText: {
    fontSize: 12.5,
  },
  image: {
    width: 230,
    height: 230,
    borderRadius: 16,
    marginBottom: 6,
  },
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    minWidth: 190,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    color: "#FFF",
    fontSize: 12,
  },
  waveBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
  },
  waveFill: {
    width: "50%",
    height: 4,
    borderRadius: 2,
  },
  audioTime: {
    fontSize: 11,
    fontWeight: "700",
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    maxWidth: 210,
  },
  docIcon: {
    fontSize: 26,
  },
  docName: {
    fontSize: 13.5,
    fontWeight: "800",
  },
  docSize: {
    fontSize: 11,
  },
  openText: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  text: {
    fontSize: 15.5,
    lineHeight: 22,
  },
  deletedText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  translationBox: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  translationLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#F59E0B",
  },
  translationText: {
    fontSize: 13,
    color: "#FFFFFF",
    marginTop: 2,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 5,
    gap: 4,
  },
  time: {
    fontSize: 10.5,
    fontWeight: "600",
  },
  ticks: {
    fontSize: 11.5,
    fontWeight: "900",
  },
  reactionsRow: {
    flexDirection: "row",
    position: "absolute",
    bottom: -13,
    right: 14,
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    elevation: 4,
  },
  reactionBadge: {
    marginHorizontal: 1,
  },
  reactionEmoji: {
    fontSize: 12.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseArea: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  closeBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 14,
  },
  fullImage: {
    width: "95%",
    height: "80%",
    borderRadius: 12,
  },
});

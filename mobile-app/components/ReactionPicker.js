import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useTheme } from "../context/ThemeContext";

const EMOJIS = ["👍", "❤️", "😂", "😮", "🔥"];

export default function ReactionPicker({ visible, onClose, onReact, onReply, onForward, onDelete, isMine }) {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {/* Reaction Emoji Row */}
          <View style={styles.emojiRow}>
            {EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiBtn}
                onPress={() => {
                  onReact(emoji);
                  onClose();
                }}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          {/* Action List */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              onReply();
              onClose();
            }}
          >
            <Text style={[styles.actionText, { color: theme.text }]}>💬 Reply</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              onForward();
              onClose();
            }}
          >
            <Text style={[styles.actionText, { color: theme.text }]}>↪️ Forward</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              onDelete("me");
              onClose();
            }}
          >
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>🗑️ Delete for me</Text>
          </TouchableOpacity>

          {isMine ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                onDelete("everyone");
                onClose();
              }}
            >
              <Text style={[styles.actionText, { color: "#EF4444" }]}>❌ Delete for everyone</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: 280,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 10,
  },
  emojiBtn: {
    padding: 8,
    borderRadius: 12,
  },
  emojiText: {
    fontSize: 24,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

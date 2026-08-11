import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function SmartReplyBar({ suggestions = [], onSelect }) {
  const { theme } = useTheme();

  if (!suggestions || !suggestions.length) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.cardBorder }]}>
      <View style={styles.badgeRow}>
        <Text style={[styles.aiTitle, { color: theme.royalPurple }]}>✨ AI Smart Reply</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {suggestions.map((text, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.chip,
              {
                backgroundColor: theme.mode === "dark" ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)",
                borderColor: theme.primary,
              },
            ]}
            onPress={() => onSelect(text)}
          >
            <Text style={[styles.chipText, { color: theme.text }]}>{text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  badgeRow: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  aiTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

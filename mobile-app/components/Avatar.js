import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { API_URL } from "../config";

export default function Avatar({ uri, name, size = 52, status, showStatus = false }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const source = uri
    ? { uri: uri.startsWith("http") ? uri : `${API_URL}${uri}` }
    : null;

  const statusColor =
    status === "online"
      ? "#10B981"
      : status === "away"
      ? "#F59E0B"
      : status === "busy"
      ? "#EF4444"
      : "#64748B";

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.outerRing,
          status === "online" && styles.onlineRing,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <View
          style={[
            styles.avatarInner,
            { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 },
          ]}
        >
          {source ? (
            <Image
              source={source}
              style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }}
            />
          ) : (
            <Text style={[styles.initial, { fontSize: (size - 4) * 0.42 }]}>
              {initial}
            </Text>
          )}
        </View>
      </View>

      {showStatus && status ? (
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: statusColor,
              width: Math.max(12, size * 0.28),
              height: Math.max(12, size * 0.28),
              borderRadius: Math.max(6, size * 0.14),
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  outerRing: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  onlineRing: {
    borderColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarInner: {
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initial: {
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  statusDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    borderWidth: 2.5,
    borderColor: "#070A12",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
});

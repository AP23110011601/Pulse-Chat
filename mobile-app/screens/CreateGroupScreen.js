import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import api from "../api";
import Avatar from "../components/Avatar";
import { useTheme } from "../context/ThemeContext";
import { getSocket } from "../socket";

export default function CreateGroupScreen({ navigation }) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/users/friends");
        setUsers(data || []);
      } catch (error) {
        Alert.alert("Error", "Could not load friends list.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const createGroup = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Enter a group name.");
      return;
    }

    const memberIds = Object.keys(selected).filter((id) => selected[id]);

    setCreating(true);
    try {
      const { data } = await api.post("/api/groups", {
        name: name.trim(),
        memberIds,
      });

      getSocket()?.emit("join_group", data._id);

      navigation.replace("GroupChat", {
        groupId: data._id,
        name: data.name,
        profileImage: data.profileImage,
      });
    } catch (error) {
      Alert.alert(
        "Create failed",
        error.response?.data?.error || "Could not create group."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.mainWrapper}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>GROUP NAME</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
          ]}
          placeholder="e.g. Project Launch Team 🚀"
          placeholderTextColor={theme.textMuted}
          value={name}
          onChangeText={setName}
        />

        <View style={styles.sectionHeader}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>ADD MEMBERS</Text>
          <Text style={[styles.badgeCount, { color: theme.primary }]}>
            {selectedCount} selected
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const active = !!selected[item.id];
              return (
                <TouchableOpacity
                  style={[
                    styles.row,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                    active && { backgroundColor: theme.cardElevated, borderColor: theme.primary },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => toggle(item.id)}
                >
                  <Avatar uri={item.profileImage} name={item.username} status={item.status} showStatus size={44} />
                  <Text style={[styles.name, { color: theme.text }]}>{item.username}</Text>
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: theme.inputBorder },
                      active && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                  >
                    {active ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.textMuted }]}>
                No members found to add.
              </Text>
            }
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        )}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            creating && { opacity: 0.7 },
          ]}
          onPress={createGroup}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Create Group ✨</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainWrapper: {
    flex: 1,
    padding: 20,
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  badgeCount: {
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  name: { marginLeft: 12, flex: 1, fontWeight: "700", fontSize: 15 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
});

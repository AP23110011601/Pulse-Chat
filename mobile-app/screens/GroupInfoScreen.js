import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import api from "../api";
import Avatar from "../components/Avatar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function GroupInfoScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();

  const [group, setGroup] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  const load = async () => {
    try {
      const [groupRes, usersRes] = await Promise.all([
        api.get(`/api/groups/${groupId}`),
        api.get("/api/users"),
      ]);
      setGroup(groupRes.data);
      setName(groupRes.data.name || "");
      setUsers(usersRes.data);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Failed to load group.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [groupId])
  );

  const isAdmin =
    group && String(group.admin?._id || group.admin) === String(user.id);

  const memberIds = new Set(
    (group?.members || []).map((m) => String(m._id || m))
  );

  const saveName = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.put(`/api/groups/${groupId}`, {
        name: name.trim(),
      });
      setGroup(data);
      Alert.alert("Saved", "Group name updated.");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Update failed.");
    }
  };

  const addMember = async (memberId) => {
    try {
      const { data } = await api.post(`/api/groups/${groupId}/members`, {
        memberIds: [memberId],
      });
      setGroup(data);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Could not add member.");
    }
  };

  const removeMember = (memberId, memberName) => {
    Alert.alert("Remove member", `Remove ${memberName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const { data } = await api.delete(
              `/api/groups/${groupId}/members/${memberId}`
            );
            setGroup(data);
          } catch (error) {
            Alert.alert(
              "Error",
              error.response?.data?.error || "Could not remove member."
            );
          }
        },
      },
    ]);
  };

  const changeImage = async () => {
    if (!isAdmin) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const formData = new FormData();
    const filename = asset.uri.split("/").pop() || "group.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("profileImage", {
      uri: asset.uri,
      name: filename,
      type,
    });

    try {
      const { data } = await api.post(`/api/groups/${groupId}/image`, formData);
      setGroup(data);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Upload failed.");
    }
  };

  if (loading || !group) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const nonMembers = users.filter((u) => !memberIds.has(String(u.id)));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.mainWrapper}>
        <FlatList
          data={group.members}
          keyExtractor={(item) => String(item._id)}
          ListHeaderComponent={
            <View style={styles.header}>
              <TouchableOpacity onPress={changeImage} disabled={!isAdmin} style={styles.avatarWrap}>
                <Avatar uri={group.profileImage} name={group.name} size={96} />
                {isAdmin ? (
                  <Text style={[styles.changePhoto, { color: theme.primary }]}>📷 Change group photo</Text>
                ) : null}
              </TouchableOpacity>

              {isAdmin ? (
                <View style={styles.editWrap}>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                    ]}
                    value={name}
                    onChangeText={setName}
                  />
                  <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={saveName}>
                    <Text style={styles.buttonText}>Save Name 💾</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={[styles.title, { color: theme.text }]}>{group.name}</Text>
              )}

              <Text style={[styles.section, { color: theme.textSecondary }]}>
                GROUP MEMBERS ({group.members?.length || 0})
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const adminId = String(group.admin?._id || group.admin);
            const memberId = String(item._id);
            return (
              <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Avatar uri={item.profileImage} name={item.username} status={item.status} showStatus size={44} />
                <View style={styles.rowText}>
                  <Text style={[styles.name, { color: theme.text }]}>{item.username}</Text>
                  {memberId === adminId ? (
                    <Text style={[styles.admin, { color: theme.primary }]}>👑 Group Admin</Text>
                  ) : null}
                </View>
                {isAdmin && memberId !== adminId ? (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeMember(memberId, item.username)}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          }}
          ListFooterComponent={
            isAdmin ? (
              <View style={styles.footer}>
                <Text style={[styles.section, { color: theme.textSecondary }]}>ADD MEMBERS</Text>
                {nonMembers.length === 0 ? (
                  <Text style={[styles.empty, { color: theme.textMuted }]}>
                    Everyone on the network is in this group.
                  </Text>
                ) : (
                  nonMembers.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.row, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                      onPress={() => addMember(u.id)}
                    >
                      <Avatar uri={u.profileImage} name={u.username} status={u.status} showStatus size={44} />
                      <Text style={[styles.name, { marginLeft: 12, flex: 1, color: theme.text }]}>
                        {u.username}
                      </Text>
                      <View style={[styles.addBtn, { backgroundColor: theme.primary }]}>
                        <Text style={styles.addText}>Add +</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            ) : null
          }
          contentContainerStyle={{ padding: 16 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: { alignItems: "center", marginBottom: 12 },
  avatarWrap: { alignItems: "center", marginBottom: 12 },
  changePhoto: { marginTop: 10, fontWeight: "700", fontSize: 13 },
  title: {
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
  },
  editWrap: { width: "100%", marginTop: 8 },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  button: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  section: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowText: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: "700" },
  admin: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  removeText: { color: "#EF4444", fontWeight: "800", fontSize: 12 },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
  footer: { marginTop: 12, paddingBottom: 30 },
  empty: { fontSize: 13, marginTop: 4 },
});

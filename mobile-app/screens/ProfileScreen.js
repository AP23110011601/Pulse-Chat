import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Avatar from "../components/Avatar";

export default function ProfileScreen() {
  const { user, updateUser, logout } = useAuth();
  const { theme, themeMode, toggleTheme } = useTheme();

  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [status, setStatus] = useState(user?.status || "online");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/api/users/profile", {
        username: username.trim(),
        bio: bio.trim(),
        status,
      });
      updateUser(data.user);
      Alert.alert("Profile Saved", "Your profile details have been updated.");
    } catch (error) {
      Alert.alert(
        "Update failed",
        error.response?.data?.error || "Could not update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
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
    const filename = asset.uri.split("/").pop() || "profile.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("profileImage", {
      uri: asset.uri,
      name: filename,
      type,
    });

    setUploading(true);
    try {
      const { data } = await api.post("/api/users/profile-image", formData);
      updateUser(data.user);
    } catch (error) {
      Alert.alert(
        "Upload failed",
        error.response?.data?.error || "Could not upload photo."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.mainWrapper}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
          <Avatar uri={user?.profileImage} name={user?.username} size={96} status={status} showStatus />
          <Text style={[styles.changePhoto, { color: theme.primary }]}>
            {uploading ? "Uploading photo…" : "📷 Change profile photo"}
          </Text>
        </TouchableOpacity>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
          <Text style={[styles.email, { color: theme.text }]}>{user?.email}</Text>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Username</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Bio / Status Quote</Text>
          <TextInput
            style={[
              styles.input,
              styles.bio,
              { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
            ]}
            value={bio}
            onChangeText={setBio}
            multiline
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Active Presence Status</Text>
          <View style={styles.statusRow}>
            {["online", "away", "busy", "offline"].map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusChip,
                  { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                  status === s && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setStatus(s)}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: theme.textSecondary },
                    status === s && { color: "#FFF", fontWeight: "800" },
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.textSecondary, marginTop: 16 }]}>App Visual Theme</Text>
          <TouchableOpacity
            style={[styles.themeRow, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
            onPress={toggleTheme}
          >
            <Text style={[styles.themeLabel, { color: theme.text }]}>
              {themeMode === "dark" ? "🌙 Dark Navy & Indigo Mode" : "☀️ Soft Light Lavender Mode"}
            </Text>
            <Text style={[styles.toggleBadge, { color: theme.primary }]}>Switch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={saveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Save Profile Changes 💾</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Log Out of Account 🚪</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  mainWrapper: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
  },
  avatarWrap: { alignItems: "center", marginBottom: 20 },
  changePhoto: { marginTop: 12, fontWeight: "700", fontSize: 14 },
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  email: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  bio: { minHeight: 70, textAlignVertical: "top" },
  statusRow: { flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: { fontSize: 13, textTransform: "capitalize", fontWeight: "600" },
  themeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  themeLabel: { fontSize: 14, fontWeight: "700" },
  toggleBadge: { fontSize: 13, fontWeight: "800" },
  button: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
  logoutBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  logoutText: { color: "#EF4444", fontWeight: "800", fontSize: 14 },
});

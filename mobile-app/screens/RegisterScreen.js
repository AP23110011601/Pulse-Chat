import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Avatar from "../components/Avatar";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { theme } = useTheme();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("Learning Full Stack Development");
  const [loading, setLoading] = useState(false);

const handleRegister = async () => {

  if (
    !username.trim() ||
    !email.trim() ||
    !password.trim()
  ) {
    Alert.alert(
      "Missing fields",
      "Username, email, and password are required."
    );
    return;
  }


  setLoading(true);


  try {

    await register({

      username: username.trim(),

      email: email.trim(),

      password: password.trim(),

      bio: bio.trim(),

    });


  } catch(error) {


    console.log(
      "Register screen error:",
      error.message
    );


    Alert.alert(
      "Registration failed",
      error.message || "Could not create account."
    );


  } finally {

    setLoading(false);

  }

};

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.mainWrapper}>
          <View style={styles.headerWrap}>
            <Text style={[styles.title, { color: theme.text }]}>Create Account ✨</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Join the next-gen communication experience.
            </Text>
          </View>

          <View style={styles.avatarRow}>
            <Avatar name={username || "User"} size={84} />
            <Text style={[styles.avatarHint, { color: theme.primary }]}>
              Personalize your identity
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="kusumanjali"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="kusumanjali@example.com"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="At least 6 characters"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Bio / Status Quote</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="Learning Full Stack Development"
              placeholderTextColor={theme.textMuted}
              value={bio}
              onChangeText={setBio}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Get Started 🚀</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, flexGrow: 1, justifyContent: "center" },
  mainWrapper: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  headerWrap: { marginBottom: 20, alignItems: "center" },
  title: { fontSize: 28, fontWeight: "900", textAlign: "center" },
  subtitle: { fontSize: 14, marginTop: 4, textAlign: "center" },
  avatarRow: { alignItems: "center", marginBottom: 20 },
  avatarHint: { fontSize: 12, fontWeight: "700", marginTop: 8 },
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  label: { fontSize: 11, fontWeight: "800", marginBottom: 6, marginTop: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 6 },
  button: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 18 },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});

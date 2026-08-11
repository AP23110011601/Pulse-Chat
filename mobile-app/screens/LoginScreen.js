import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetting, setResetting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      const serverError = error.response?.data?.error;
      const validationErrors = error.response?.data?.errors;
      const message = serverError
        || (Array.isArray(validationErrors) && validationErrors[0]?.msg)
        || error.message
        || "Invalid credentials.";

      console.log("Login error details:", {
        status: error.response?.status,
        serverError,
        validationErrors,
        message,
      });

      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert("Required", "Please enter your registered email address.");
      return;
    }

    setResetting(true);
    try {
      await api.post("/api/auth/forgot-password", { email: forgotEmail.trim() });
      Alert.alert("Email Sent", "If an account exists, a password reset link has been dispatched.");
      setForgotVisible(false);
      setForgotEmail("");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Could not process reset request.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.mainWrapper}>
        <View style={styles.headerWrap}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <Text style={[styles.brand, { color: theme.primary }]}>PULSECHAT</Text>
          <Text style={[styles.title, { color: theme.text }]}>Welcome Back 👋</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Connect. Communicate. Collaborate.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
            placeholder="name@company.com"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
            placeholder="••••••••"
            placeholderTextColor={theme.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.rememberRow} onPress={() => setRemember(!remember)}>
              <View style={[styles.checkbox, { borderColor: theme.inputBorder }, remember && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                {remember ? <Text style={styles.checkIcon}>✓</Text> : null}
              </View>
              <Text style={[styles.rememberText, { color: theme.textSecondary }]}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setForgotVisible(true)}>
              <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Sign In 🚀</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.footerLink}>
            <Text style={[styles.linkText, { color: theme.textSecondary }]}>
              New here? <Text style={[styles.linkBold, { color: theme.primary }]}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot Password Modal */}
      <Modal transparent visible={forgotVisible} animationType="slide" onRequestClose={() => setForgotVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Reset Password 🔑</Text>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
              Enter your account email to receive reset instructions.
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="Email address"
              placeholderTextColor={theme.textMuted}
              value={forgotEmail}
              onChangeText={setForgotEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setForgotVisible(false)}>
                <Text style={{ color: theme.textSecondary, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmit, { backgroundColor: theme.primary }]}
                onPress={handleForgotPassword}
                disabled={resetting}
              >
                {resetting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: "#FFF", fontWeight: "700" }}>Send Link</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  mainWrapper: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  headerWrap: {
    marginBottom: 24,
    alignItems: "center",
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 26,
  },
  brand: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
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
  label: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 6,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 14,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "900",
  },
  rememberText: {
    fontSize: 13,
    fontWeight: "600",
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "700",
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  footerLink: {
    marginTop: 18,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
  },
  linkBold: {
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 440,
    width: "100%",
    alignSelf: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  modalSub: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalSubmit: {
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
});

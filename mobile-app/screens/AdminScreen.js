import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import api from "../api";
import Avatar from "../components/Avatar";
import { useTheme } from "../context/ThemeContext";

export default function AdminScreen() {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/api/admin/users"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      Alert.alert("Admin Access Error", error.response?.data?.error || "Could not fetch admin data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleBlock = async (userItem) => {
    try {
      const { data } = await api.post(`/api/admin/toggle-block/${userItem._id}`);
      Alert.alert("Moderation Action", data.message);
      setUsers((prev) =>
        prev.map((u) => (u._id === userItem._id ? { ...u, isBlocked: !u.isBlocked } : u))
      );
      fetchAdminData();
    } catch (error) {
      Alert.alert("Action Error", error.response?.data?.error || "Could not toggle block.");
    }
  };

  const renderStatCard = (label, value, icon) => (
    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: theme.text }]}>{value ?? "-"}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.mainWrapper}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => String(item._id)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAdminData} tintColor={theme.primary} />}
            ListHeaderComponent={
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.title, { color: theme.text }]}>Platform Command Center ⚙️</Text>
                <Text style={[styles.sub, { color: theme.textSecondary }]}>
                  Real-Time Statistics & User Moderation
                </Text>

                {/* Stats Grid */}
                {stats ? (
                  <View style={styles.statsGrid}>
                    {renderStatCard("Total Users", stats.totalUsers, "👥")}
                    {renderStatCard("Online Now", stats.onlineUsers, "🟢")}
                    {renderStatCard("Messages", stats.totalMessages, "💬")}
                    {renderStatCard("Groups", stats.totalGroups, "🚀")}
                  </View>
                ) : null}

                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>USER MANAGEMENT</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Avatar uri={item.profileImage} name={item.username} status={item.status} showStatus size={44} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[styles.userName, { color: theme.text }]}>{item.username}</Text>
                    {item.role === "admin" ? (
                      <Text style={[styles.adminBadge, { backgroundColor: theme.primary }]}>ADMIN</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{item.email}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.blockBtn,
                    item.isBlocked
                      ? { backgroundColor: "#10B981" }
                      : { backgroundColor: "#EF4444" },
                  ]}
                  onPress={() => handleToggleBlock(item)}
                >
                  <Text style={styles.blockBtnText}>{item.isBlocked ? "Unblock" : "Block"}</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ padding: 16 }}
          />
        )}
      </View>
    </View>
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
  title: { fontSize: 24, fontWeight: "900" },
  sub: { fontSize: 13, marginTop: 2, marginBottom: 16 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: "900" },
  statLabel: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 8 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  userName: { fontSize: 15, fontWeight: "800" },
  adminBadge: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  userEmail: { fontSize: 12, marginTop: 2 },
  blockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  blockBtnText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
});

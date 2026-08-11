import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api";
import Avatar from "../components/Avatar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFriends } from "../hooks/useFriends";
import { getSocket } from "../socket";
import {
  getCachedConversations,
  saveCachedConversations,
  syncOfflineMessages,
} from "../services/offlineStorage";

function formatPreviewTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { theme, themeMode, toggleTheme } = useTheme();
  const {
    friends,
    pendingRequests,
    sentRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    refetchRequests,
  } = useFriends();

  const [tab, setTab] = useState("chats");
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = async (query = search) => {
    try {
      const usersPath = query.trim()
        ? `/api/users?q=${encodeURIComponent(query.trim())}`
        : "/api/users";

      const [convRes, usersRes, groupsRes] = await Promise.all([
        api.get("/api/messages/conversations"),
        api.get(usersPath),
        api.get("/api/groups"),
      ]);

      setConversations(convRes.data);
      setUsers(usersRes.data);
      setGroups(groupsRes.data);

      await saveCachedConversations(convRes.data);
    } catch (error) {
      console.log("Home load error, fetching cache:", error.message);
      const cached = await getCachedConversations();
      if (cached && cached.length) setConversations(cached);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    syncOfflineMessages(socket);

    const onStatus = ({ userId, status, lastSeen }) => {
      setUsers((prev) =>
        prev.map((u) => (String(u.id) === String(userId) ? { ...u, status, lastSeen } : u))
      );
      setConversations((prev) =>
        prev.map((c) =>
          String(c.user.id) === String(userId)
            ? { ...c, user: { ...c.user, status, lastSeen } }
            : c
        )
      );
    };

    socket.on("user_status", onStatus);
    return () => socket.off("user_status", onStatus);
  }, []);

  useEffect(() => {
    if (tab !== "users") return;
    const t = setTimeout(() => loadData(search), 300);
    return () => clearTimeout(t);
  }, [search, tab]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openChat = (u) => {
    const isFriend = friends.some((friend) => String(friend.id) === String(u.id));
    if (!isFriend) {
      Alert.alert(
        "Friend request required",
        "You must be friends before sending direct messages.",
        [{ text: "OK" }]
      );
      return;
    }

    navigation.navigate("Chat", {
      userId: u.id,
      username: u.username,
      profileImage: u.profileImage,
      status: u.status,
      lastSeen: u.lastSeen,
    });
  };

  const onlineUsersList = users.filter((u) => u.status === "online");

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.cardRow,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
      ]}
      activeOpacity={0.8}
      onPress={() => openChat(item.user)}
    >
      <Avatar
        uri={item.user.profileImage}
        name={item.user.username}
        status={item.user.status}
        showStatus
        size={54}
      />
      <View style={styles.cardText}>
        <View style={styles.cardTop}>
          <Text style={[styles.name, { color: theme.text }]}>{item.user.username}</Text>
          <Text style={[styles.time, { color: theme.textMuted }]}>
            {formatPreviewTime(item.lastMessage?.createdAt)}
          </Text>
        </View>
        <View style={styles.cardBottom}>
          <Text style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.lastMessage?.type === "image"
              ? "📷 Photo"
              : item.lastMessage?.type === "audio"
              ? "🎤 Voice message (0:15)"
              : item.lastMessage?.type === "document"
              ? "📄 Document"
              : item.lastMessage?.text || "No messages yet"}
          </Text>
          {item.unreadCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: theme.badgeBg }]}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUser = ({ item }) => {
    const isFriend = friends.some((friend) => String(friend.id) === String(item.id));
    const isPending = pendingRequests.some((req) => String(req.id) === String(item.id));
    const isSent = sentRequests.some((req) => String(req.id) === String(item.id));

    return (
      <View
        style={[
          styles.cardRow,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
        ]}
      >
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
          activeOpacity={0.8}
          onPress={() => openChat(item)}
        >
          <Avatar
            uri={item.profileImage}
            name={item.username}
            status={item.status}
            showStatus
            size={54}
          />
          <View style={styles.cardText}>
            <Text style={[styles.name, { color: theme.text }]}>{item.username}</Text>
            <Text style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.status === "online" ? "🟢 Online" : item.bio || "Tap to start conversation"}
            </Text>
          </View>
        </TouchableOpacity>

        {!isFriend && (
          <View style={styles.userActionRow}>
            {isPending ? (
              <>
                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: theme.primary }]}
                  onPress={async () => {
                    const result = await acceptFriendRequest(item.id);
                    if (!result.success) {
                      Alert.alert("Accept failed", result.error || "Could not accept request.");
                    }
                  }}
                >
                  <Text style={[styles.smallActionText, { color: "#FFF" }]}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: theme.cardElevated, borderWidth: 1, borderColor: theme.cardBorder }]}
                  onPress={async () => {
                    const result = await rejectFriendRequest(item.id);
                    if (!result.success) {
                      Alert.alert("Reject failed", result.error || "Could not reject request.");
                    }
                  }}
                >
                  <Text style={[styles.smallActionText, { color: theme.textSecondary }]}>Reject</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[
                  styles.friendBtn,
                  {
                    backgroundColor: isSent ? theme.cardElevated : theme.primary,
                    borderColor: theme.cardBorder,
                  },
                ]}
                activeOpacity={0.8}
                onPress={async () => {
                  if (isSent) return;
                  const result = await sendFriendRequest(item.id);
                  if (!result.success) {
                    Alert.alert("Request failed", result.error || "Could not send friend request.");
                  }
                }}
              >
                <Text style={[styles.friendBtnText, { color: isSent ? theme.textSecondary : "#FFFFFF" }]}> 
                  {isSent ? "Pending" : "Add"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderFriend = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.cardRow,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
      ]}
      activeOpacity={0.8}
      onPress={() => openChat(item)}
    >
      <Avatar uri={item.profileImage} name={item.username} status={item.status} showStatus size={54} />
      <View style={styles.cardText}>
        <Text style={[styles.name, { color: theme.text }]}>{item.username}</Text>
        <Text style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.status === "online" ? "🟢 Online" : item.bio || "Tap to start conversation"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderGroup = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.cardRow,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
      ]}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate("GroupChat", {
          groupId: item._id,
          name: item.name,
          profileImage: item.profileImage,
        })
      }
    >
      <Avatar uri={item.profileImage} name={item.name} size={54} />
      <View style={styles.cardText}>
        <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.preview, { color: theme.textSecondary }]}>
          👥 {item.members?.length || 0} members
        </Text>
      </View>
    </TouchableOpacity>
  );

  const data =
    tab === "chats"
      ? conversations
      : tab === "users"
      ? users
      : tab === "friends"
      ? friends
      : groups;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.mainWrapper}>
        {/* Sleek Header Bar */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}>
          <View style={styles.brandRow}>
            <Text style={[styles.brandLogo, { color: theme.primary }]}>⚡ PULSE</Text>
            <Text style={[styles.welcome, { color: theme.textSecondary }]}>Hi, {user?.username} 👋</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder }]}
              onPress={toggleTheme}
            >
              <Text style={styles.btnIcon}>{themeMode === "dark" ? "☀️" : "🌙"}</Text>
            </TouchableOpacity>

            {(user?.role === "admin" || user?.email === "admin@pulsechat.com") && (
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder }]}
                onPress={() => navigation.navigate("Admin")}
              >
                <Text style={styles.btnIcon}>⚙️</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder }]}
              onPress={() => navigation.navigate("CreateGroup")}
            >
              <Text style={styles.btnIcon}>➕</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={styles.profileBtn}>
              <Avatar uri={user?.profileImage} name={user?.username} size={48} />
            </TouchableOpacity>
          </View>
        </View>

        {onlineUsersList.length > 0 ? (
          <View style={styles.storiesWrap}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ONLINE NOW</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
              {onlineUsersList.map((u) => (
                <TouchableOpacity key={u.id} style={styles.storyItem} onPress={() => openChat(u)}>
                  <Avatar uri={u.profileImage} name={u.username} status="online" showStatus size={56} />
                  <Text style={[styles.storyName, { color: theme.text }]} numberOfLines={1}>
                    {u.username}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={[styles.tabsWrap, { backgroundColor: theme.cardElevated }]}>
        {['chats', 'users', 'friends', 'groups'].map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.tabBtn,
              tab === key && {
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: 4,
              },
            ]}
            onPress={() => setTab(key)}
          >
            <Text
              style={[
                styles.tabText,
                { color: tab === key ? "#FFFFFF" : theme.textSecondary },
                tab === key && { fontWeight: "800" },
              ]}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <TextInput
          style={[
            styles.search,
            { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
          ]}
          placeholder={`Search ${tab}…`}
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {/* Main List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} size="large" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => String(item.user?.id || item.id || item._id || index)}
          renderItem={
            tab === "chats"
              ? renderConversation
              : tab === "users"
              ? renderUser
              : tab === "friends"
              ? renderFriend
              : renderGroup
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.textMuted }]}>
              {tab === "chats"
                ? "No active conversations yet. Start one from Users!"
                : tab === "users"
                ? "No users found."                : tab === "friends"
                ? "No friends yet. Send a request from Users."                : "No groups created yet."}
            </Text>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
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
    maxWidth: 800,
    alignSelf: "center",
  },
  header: {
    paddingTop: 28,
    paddingHorizontal: 18,
    paddingBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    minHeight: 96,
  },
  brandRow: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 12,
  },
  brandLogo: { fontSize: 26, fontWeight: "900", letterSpacing: 1.5 },
  welcome: { fontSize: 14, fontWeight: "700", marginTop: 4, color: "#666" },
  actionRow: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  profileBtn: {
    alignSelf: "flex-end",
  },
  btnIcon: { fontSize: 17 },
  storiesWrap: { paddingTop: 14, paddingBottom: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  storiesScroll: { paddingHorizontal: 16, gap: 16 },
  storyItem: { alignItems: "center", width: 60 },
  storyName: { fontSize: 11, fontWeight: "700", marginTop: 6, textAlign: "center" },
  tabsWrap: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 18,
    padding: 5,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: "center",
  },
  tabText: { fontWeight: "700", fontSize: 13 },
  searchWrap: { paddingHorizontal: 16, marginBottom: 14 },
  search: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 15,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardText: { flex: 1, marginLeft: 14 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "800", letterSpacing: 0.2 },
  time: { fontSize: 11, fontWeight: "600" },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 5 },
  preview: { fontSize: 13.5, flex: 1, marginRight: 8, lineHeight: 18 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  empty: { textAlign: "center", marginTop: 40, paddingHorizontal: 24, fontSize: 14 },
  userActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  friendBtn: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 82,
    alignItems: "center",
    justifyContent: "center",
  },
  friendBtnText: {
    fontSize: 13,
    fontWeight: "800",
  },
  smallActionBtn: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  smallActionText: {
    fontSize: 12,
    fontWeight: "800",
  },
});

import AsyncStorage from "@react-native-async-storage/async-storage";

const CONVERSATIONS_KEY = "pulse_cached_conversations";
const MESSAGES_KEY_PREFIX = "pulse_messages_";
const OUTBOX_KEY = "pulse_pending_outbox";

export const saveCachedConversations = async (conversations) => {
  try {
    await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (err) {
    console.log("Failed to cache conversations:", err);
  }
};

export const getCachedConversations = async () => {
  try {
    const data = await AsyncStorage.getItem(CONVERSATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};

export const saveCachedMessages = async (chatId, messages) => {
  try {
    await AsyncStorage.setItem(`${MESSAGES_KEY_PREFIX}${chatId}`, JSON.stringify(messages));
  } catch (err) {
    console.log("Failed to cache messages:", err);
  }
};

export const getCachedMessages = async (chatId) => {
  try {
    const data = await AsyncStorage.getItem(`${MESSAGES_KEY_PREFIX}${chatId}`);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};

export const enqueueOfflineMessage = async (msgPayload) => {
  try {
    const outbox = await getOfflineOutbox();
    outbox.push({ ...msgPayload, localId: Date.now() });
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
  } catch (err) {
    console.log("Failed to enqueue offline message:", err);
  }
};

export const getOfflineOutbox = async () => {
  try {
    const data = await AsyncStorage.getItem(OUTBOX_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};

export const clearOfflineOutbox = async () => {
  try {
    await AsyncStorage.removeItem(OUTBOX_KEY);
  } catch (err) {
    console.log("Failed to clear outbox:", err);
  }
};

export const syncOfflineMessages = async (socket) => {
  if (!socket || !socket.connected) return;
  const outbox = await getOfflineOutbox();
  if (!outbox.length) return;

  console.log(`Syncing ${outbox.length} offline messages...`);
  const remaining = [];

  for (const item of outbox) {
    const event = item.groupId ? "send_group_message" : "send_direct_message";
    await new Promise((resolve) => {
      socket.emit(event, item, (ack) => {
        if (ack?.error) remaining.push(item);
        resolve();
      });
    });
  }

  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(remaining));
};

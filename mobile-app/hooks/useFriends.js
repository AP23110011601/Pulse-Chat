import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export function useFriends() {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchFriends = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/users/friends', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchPendingRequests = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await api.get('/api/users/requests/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRequests(response.data);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  }, [token]);

  const fetchSentRequests = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await api.get('/api/users/requests/sent', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSentRequests(response.data);
    } catch (err) {
      console.error('Error fetching sent requests:', err);
    }
  }, [token]);

  const sendFriendRequest = useCallback(async (receiverId) => {
    try {
      await api.post(`/api/users/request/${receiverId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await Promise.all([fetchPendingRequests(), fetchSentRequests()]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [token, fetchPendingRequests, fetchSentRequests]);

  const acceptFriendRequest = useCallback(async (requesterId) => {
    try {
      await api.post(`/api/users/accept/${requesterId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await Promise.all([fetchFriends(), fetchPendingRequests(), fetchSentRequests()]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [token, fetchFriends, fetchPendingRequests, fetchSentRequests]);

  const rejectFriendRequest = useCallback(async (requesterId) => {
    try {
      await api.post(`/api/users/reject/${requesterId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await Promise.all([fetchPendingRequests(), fetchSentRequests()]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [token, fetchPendingRequests, fetchSentRequests]);

  const removeFriend = useCallback(async (friendId) => {
    try {
      await api.delete(`/api/users/friend/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchFriends();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [token, fetchFriends]);

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
    fetchSentRequests();
  }, [fetchFriends, fetchPendingRequests, fetchSentRequests]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    error,
    refetchFriends: fetchFriends,
    refetchRequests: fetchPendingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  };
}

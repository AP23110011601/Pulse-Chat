import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export function useGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchGroups = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createGroup = useCallback(async (groupData) => {
    try {
      const response = await api.post('/api/groups', groupData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchGroups();
      return { success: true, group: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [token, fetchGroups]);

  const updateGroup = useCallback(async (groupId, updates) => {
    try {
      const response = await api.put(`/api/groups/${groupId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(prev => prev.map(g => 
        g._id === groupId ? response.data : g
      ));
      return { success: true, group: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [token]);

  const addMember = useCallback(async (groupId, memberIds) => {
    try {
      const response = await api.post(`/api/groups/${groupId}/members`, 
        { memberIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups(prev => prev.map(g => 
        g._id === groupId ? response.data : g
      ));
      return { success: true, group: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [token]);

  const removeMember = useCallback(async (groupId, userId) => {
    try {
      const response = await api.delete(`/api/groups/${groupId}/members/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(prev => prev.map(g => 
        g._id === groupId ? response.data : g
      ));
      return { success: true, group: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [token]);

  const leaveGroup = useCallback(async (groupId) => {
    try {
      await api.delete(`/api/groups/${groupId}/members/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchGroups();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [token, fetchGroups]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    refetch: fetchGroups,
    createGroup,
    updateGroup,
    addMember,
    removeMember,
    leaveGroup
  };
}

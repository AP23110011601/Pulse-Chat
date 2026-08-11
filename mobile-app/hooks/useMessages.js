import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export function useMessages(conversationId, isGroup = false) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = isGroup 
        ? `/api/messages/group/${conversationId}`
        : `/api/messages/direct/${conversationId}`;
      
      const response = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId, isGroup, token]);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((messageId, updates) => {
    setMessages(prev => prev.map(msg => 
      msg._id === messageId ? { ...msg, ...updates } : msg
    ));
  }, []);

  const deleteMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(msg => msg._id !== messageId));
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
    addMessage,
    updateMessage,
    deleteMessage
  };
}

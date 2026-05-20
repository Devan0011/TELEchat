import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createSocket } from '../services/socket.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useChatStore } from '../store/useChatStore.js';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const jwt = useAuthStore((state) => state.jwt);
  const appendMessage = useChatStore((state) => state.appendMessage);
  const upsertMessage = useChatStore((state) => state.upsertMessage);
  const removeMessage = useChatStore((state) => state.removeMessage);
  const setTyping = useChatStore((state) => state.setTyping);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!jwt) return undefined;
    const socket = createSocket(jwt);
    socketRef.current = socket;
    socket.connect();
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('message:new', appendMessage);
    socket.on('message:update', upsertMessage);
    socket.on('message:delete', removeMessage);
    socket.on('typing:update', ({ chatId, users }) => setTyping(chatId, users));
    socket.on('notification:new', (notification) => {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, { body: notification.body });
      }
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [appendMessage, jwt, removeMessage, setTyping, upsertMessage]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
      emit: (event, payload, callback) => socketRef.current?.emit(event, payload, callback),
      joinChat: (chatId) => socketRef.current?.emit('chat:join', { chatId }),
      leaveChat: (chatId) => socketRef.current?.emit('chat:leave', { chatId }),
      typing: (chatId, isTyping) => socketRef.current?.emit('typing:set', { chatId, isTyping })
    }),
    [connected]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

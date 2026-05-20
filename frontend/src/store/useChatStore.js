import { create } from 'zustand';
import { chatApi } from '../services/api.js';

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChatId: null,
  messages: {},
  typing: {},
  drafts: JSON.parse(localStorage.getItem('telechat-drafts') || '{}'),
  loading: false,
  setActiveChat: (chatId) => set({ activeChatId: chatId }),
  setTyping: (chatId, users) => set((state) => ({ typing: { ...state.typing, [chatId]: users } })),
  saveDraft: (chatId, draft) => {
    const drafts = { ...get().drafts, [chatId]: draft };
    localStorage.setItem('telechat-drafts', JSON.stringify(drafts));
    set({ drafts });
  },
  loadChats: async () => {
    set({ loading: true });
    const { data } = await chatApi.list();
    set({ chats: data.chats, loading: false, activeChatId: get().activeChatId || data.chats[0]?.id || null });
  },
  loadMessages: async (chatId, cursor) => {
    const { data } = await chatApi.messages(chatId, cursor);
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: cursor ? [...data.messages, ...(state.messages[chatId] || [])] : data.messages
      }
    }));
    return data.nextCursor;
  },
  appendMessage: (message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.chat_id]: [...(state.messages[message.chat_id] || []), message]
      },
      chats: state.chats.map((chat) =>
        chat.id === message.chat_id
          ? { ...chat, last_message: message, updated_at: message.created_at, unread_count: chat.unread_count + 1 }
          : chat
      )
    }));
  },
  upsertMessage: (message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.chat_id]: (state.messages[message.chat_id] || []).map((item) =>
          item.id === message.id ? message : item
        )
      }
    }));
  },
  removeMessage: (message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.chat_id]: (state.messages[message.chat_id] || []).filter((item) => item.id !== message.id)
      }
    }));
  }
}));

import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import ChatList from '../components/ChatList.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import CallOverlay from '../components/CallOverlay.jsx';
import SearchPanel from '../components/SearchPanel.jsx';
import { chatApi, mediaApi } from '../services/api.js';
import { supabase } from '../services/supabase.js';
import { useChatStore } from '../store/useChatStore.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuthStore } from '../store/useAuthStore.js';

export default function ChatPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { connected, joinChat, leaveChat, typing } = useSocket() || {};
  const user = useAuthStore((state) => state.user);
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const messages = useChatStore((state) => state.messages);
  const drafts = useChatStore((state) => state.drafts);
  const typingState = useChatStore((state) => state.typing);
  const loading = useChatStore((state) => state.loading);
  const loadChats = useChatStore((state) => state.loadChats);
  const loadMessages = useChatStore((state) => state.loadMessages);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const saveDraft = useChatStore((state) => state.saveDraft);
  const appendMessage = useChatStore((state) => state.appendMessage);
  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId), [activeChatId, chats]);

  useEffect(() => {
    loadChats().catch(console.error);
  }, [loadChats]);

  useEffect(() => {
    if (!activeChatId) return undefined;
    joinChat?.(activeChatId);
    return () => leaveChat?.(activeChatId);
  }, [activeChatId, joinChat, leaveChat]);

  const uploadFiles = useCallback(async (files, chatId) => {
    const uploaded = [];
    for (const file of files) {
      const path = `${chatId}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from('chat-media').upload(path, file, {
        upsert: false,
        contentType: file.type
      });
      if (error) throw error;
      const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
      const registered = await mediaApi.register({
        chatId,
        bucket: 'chat-media',
        storagePath: path,
        publicUrl: data.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      });
      uploaded.push(registered.data.media);
    }
    return uploaded;
  }, []);

  const send = useCallback(async ({ content, files, replyTo }) => {
    if (!activeChatId) return;
    const mediaFiles = files?.length ? await uploadFiles(files, activeChatId) : [];
    const { data } = await chatApi.send({
      chatId: activeChatId,
      content,
      replyTo,
      mediaFileIds: mediaFiles.map((item) => item.id)
    });
    appendMessage({ ...data.message, media_files: mediaFiles, sender_id: user?.id });
  }, [activeChatId, appendMessage, uploadFiles, user?.id]);

  const startChat = async (participantId) => {
    const { data } = await chatApi.createDirect(participantId);
    await loadChats();
    setActiveChat(data.chat.id);
    setSearchOpen(false);
  };

  return (
    <main className="app-shell">
      <Sidebar onSearch={() => setSearchOpen(true)} />
      <ChatList
        chats={chats}
        activeChatId={activeChatId}
        loading={loading}
        onSelect={setActiveChat}
        onCreate={() => setSearchOpen(true)}
      />
      <ChatWindow
        chat={activeChat}
        messages={messages[activeChatId] || []}
        draft={drafts[activeChatId] || ''}
        typingUsers={(typingState[activeChatId] || []).filter((item) => item !== user?.email)}
        onLoadMessages={loadMessages}
        onSend={send}
        onDraft={saveDraft}
        onTyping={(chatId, isTyping) => typing?.(chatId, isTyping)}
        onUpdated={() => activeChatId && loadMessages(activeChatId)}
      />
      <div className={`connection-pill ${connected ? 'online' : ''}`}>{connected ? 'Live' : 'Reconnecting'}</div>
      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} onStartChat={startChat} />
      <CallOverlay />
    </main>
  );
}

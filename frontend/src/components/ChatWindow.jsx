import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Phone, Search, Star, Video } from 'lucide-react';
import Avatar from './Avatar.jsx';
import Composer from './Composer.jsx';
import MessageBubble from './MessageBubble.jsx';
import { chatApi } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useCall } from '../context/CallContext.jsx';

export default function ChatWindow({
  chat,
  messages,
  draft,
  typingUsers,
  onLoadMessages,
  onSend,
  onDraft,
  onTyping,
  onUpdated
}) {
  const user = useAuthStore((state) => state.user);
  const { startCall } = useCall();
  const [reply, setReply] = useState(null);
  const listRef = useRef(null);
  const peer = chat?.participants?.find((participant) => participant.user_id !== user?.id)?.profile;
  const title = chat?.title || peer?.username || 'Select a chat';
  const subtitle = typingUsers?.length ? `${typingUsers.join(', ')} typing...` : chat?.is_online ? 'Online now' : chat?.last_seen || 'Secure messages';
  const safeMessages = useMemo(() => messages || [], [messages]);

  useEffect(() => {
    if (!chat?.id) return;
    onLoadMessages(chat.id);
  }, [chat?.id, onLoadMessages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [safeMessages.length]);

  if (!chat) {
    return (
      <section className="empty-chat glass-panel">
        <div className="orbital-logo">T</div>
        <h2>Choose a conversation</h2>
        <p>Your chats, groups, calls, files, and admin-ready moderation tools live in one responsive workspace.</p>
      </section>
    );
  }

  const targetId = peer?.id || chat.participants?.find((participant) => participant.user_id !== user?.id)?.user_id;

  return (
    <motion.section className="chat-window glass-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="chat-header">
        <div className="chat-title">
          <Avatar profile={peer || { username: title }} online={chat.is_online} />
          <div>
            <h2>{title}</h2>
            <small>{subtitle}</small>
          </div>
        </div>
        <div className="chat-tools">
          <button type="button" className="icon-button" aria-label="Search chat"><Search size={19} /></button>
          <button type="button" className="icon-button" aria-label="Voice call" onClick={() => startCall({ toUserId: targetId, chatId: chat.id, video: false })}><Phone size={19} /></button>
          <button type="button" className="icon-button glow" aria-label="Video call" onClick={() => startCall({ toUserId: targetId, chatId: chat.id, video: true })}><Video size={19} /></button>
          <button type="button" className="icon-button" aria-label="Pinned messages"><Star size={19} /></button>
          <button type="button" className="icon-button" aria-label="More"><MoreVertical size={19} /></button>
        </div>
      </header>
      <main className="messages" ref={listRef}>
        <button className="load-more" type="button" onClick={() => onLoadMessages(chat.id, safeMessages[0]?.created_at)}>
          Load earlier messages
        </button>
        {safeMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            mine={message.sender_id === user?.id}
            onReply={setReply}
            onReact={async (item, emoji) => {
              await chatApi.react(item.id, emoji);
              onUpdated?.();
            }}
            onPin={async (item) => {
              await chatApi.pin(item.id);
              onUpdated?.();
            }}
          />
        ))}
      </main>
      <Composer
        draft={draft}
        reply={reply}
        onCancelReply={() => setReply(null)}
        onDraft={(value) => onDraft(chat.id, value)}
        onTyping={(isTyping) => onTyping(chat.id, isTyping)}
        onSend={(payload) => {
          onSend({ ...payload, replyTo: reply?.id });
          setReply(null);
        }}
      />
    </motion.section>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import { Plus, UsersRound } from 'lucide-react';
import Avatar from './Avatar.jsx';
import Skeleton from './Skeleton.jsx';

export default function ChatList({ chats, activeChatId, loading, onSelect, onCreate }) {
  return (
    <section className="chat-list-panel glass-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Messages</p>
          <h1>Chats</h1>
        </div>
        <button className="icon-button glow" type="button" onClick={onCreate} aria-label="Create chat">
          <Plus size={20} />
        </button>
      </div>
      <div className="chat-filters" role="tablist">
        <button className="active" type="button">All</button>
        <button type="button">Unread</button>
        <button type="button">Groups</button>
      </div>
      <div className="chat-list">
        {loading && <Skeleton rows={8} />}
        <AnimatePresence>
          {chats.map((chat) => (
            <motion.button
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`chat-list-item ${activeChatId === chat.id ? 'active' : ''}`}
              type="button"
              key={chat.id}
              onClick={() => onSelect(chat.id)}
            >
              <Avatar profile={chat.peer || { username: chat.title }} online={chat.is_online} />
              <span className="chat-list-copy">
                <strong>{chat.title || chat.peer?.username || 'Secure chat'}</strong>
                <small>{chat.last_message?.content || chat.description || 'No messages yet'}</small>
              </span>
              <span className="chat-meta">
                <time>{chat.last_message_time || ''}</time>
                {chat.unread_count > 0 && <i>{chat.unread_count}</i>}
              </span>
              {chat.type !== 'direct' && <UsersRound className="group-indicator" size={15} />}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { CheckCheck, Download, MoreHorizontal, Pin, Reply, SmilePlus } from 'lucide-react';
import { format } from 'date-fns';

export default function MessageBubble({ message, mine, onReact, onReply, onPin }) {
  const html = DOMPurify.sanitize(marked.parse(message.content || ''));

  return (
    <article className={`message-row ${mine ? 'mine' : ''}`}>
      <div className="message-bubble">
        {message.reply_to && <div className="reply-preview">Replying to {message.reply_to.content}</div>}
        {message.media_files?.map((file) => (
          <a className="media-preview" href={file.public_url} target="_blank" rel="noreferrer" key={file.id}>
            {file.mime_type?.startsWith('image/') ? (
              <img src={file.public_url} alt={file.file_name} />
            ) : (
              <span><Download size={16} /> {file.file_name}</span>
            )}
          </a>
        ))}
        <div className="message-content" dangerouslySetInnerHTML={{ __html: html }} />
        {message.reactions?.length > 0 && (
          <div className="reaction-strip">
            {message.reactions.map((reaction) => (
              <span key={`${reaction.user_id}-${reaction.emoji}`}>{reaction.emoji}</span>
            ))}
          </div>
        )}
        <footer>
          <time>{message.created_at ? format(new Date(message.created_at), 'HH:mm') : ''}</time>
          {message.pinned_at && <Pin size={12} />}
          {mine && <CheckCheck size={14} className={message.seen_at ? 'seen' : ''} />}
        </footer>
        <div className="message-actions">
          <button type="button" onClick={() => onReply(message)} aria-label="Reply"><Reply size={14} /></button>
          <button type="button" onClick={() => onReact(message, '💚')} aria-label="React"><SmilePlus size={14} /></button>
          <button type="button" onClick={() => onPin(message)} aria-label="Pin"><Pin size={14} /></button>
          <button type="button" aria-label="More"><MoreHorizontal size={14} /></button>
        </div>
      </div>
    </article>
  );
}

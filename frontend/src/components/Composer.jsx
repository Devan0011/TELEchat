import { useEffect, useRef, useState } from 'react';
import { CalendarClock, FileUp, Mic, Paperclip, Send, Smile, X } from 'lucide-react';
import FileDropzone from './FileDropzone.jsx';

export default function Composer({ draft, reply, onCancelReply, onSend, onDraft, onTyping }) {
  const [content, setContent] = useState(draft || '');
  const [files, setFiles] = useState([]);
  const [recording, setRecording] = useState(false);
  const typingTimer = useRef(null);

  useEffect(() => setContent(draft || ''), [draft]);

  const update = (value) => {
    setContent(value);
    onDraft(value);
    onTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping(false), 900);
  };

  const submit = (event) => {
    event.preventDefault();
    if (!content.trim() && files.length === 0) return;
    onSend({ content, files });
    setContent('');
    setFiles([]);
    onDraft('');
  };

  return (
    <form className="composer glass-panel" onSubmit={submit}>
      {reply && (
        <div className="composer-reply">
          <span>Replying to {reply.content}</span>
          <button type="button" onClick={onCancelReply} aria-label="Cancel reply"><X size={14} /></button>
        </div>
      )}
      <FileDropzone files={files} onFiles={setFiles} />
      <div className="composer-row">
        <button className="icon-button" type="button" aria-label="Emoji picker"><Smile size={19} /></button>
        <button className="icon-button" type="button" aria-label="Attach file">
          <Paperclip size={19} />
        </button>
        <textarea
          value={content}
          onChange={(event) => update(event.target.value)}
          placeholder="Message with markdown, files, voice notes..."
          rows={1}
        />
        <button className="icon-button" type="button" aria-label="Schedule message"><CalendarClock size={19} /></button>
        <button className={`icon-button ${recording ? 'danger' : ''}`} type="button" onClick={() => setRecording(!recording)} aria-label="Voice note">
          <Mic size={19} />
        </button>
        <button className="send-button" type="submit" aria-label="Send message">
          {files.length ? <FileUp size={18} /> : <Send size={18} />}
        </button>
      </div>
      {recording && <div className="waveform"><span /><span /><span /><span /><span /></div>}
    </form>
  );
}

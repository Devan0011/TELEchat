import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { userApi } from '../services/api.js';
import Avatar from './Avatar.jsx';

export default function SearchPanel({ open, onClose, onStartChat }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      const { data } = await userApi.search(query);
      setResults(data.users);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <section className="search-panel glass-panel">
        <header>
          <Search size={20} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="Search username, phone, groups, messages" />
          <button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="search-results">
          {results.map((profile) => (
            <button type="button" key={profile.id} onClick={() => onStartChat(profile.id)}>
              <Avatar profile={profile} online={profile.is_online} />
              <span>
                <strong>{profile.username}</strong>
                <small>{profile.phone || profile.bio || 'Start secure chat'}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

import { Archive, Bell, Compass, MessageCircle, Moon, Search, Settings, Shield, UserRound } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { useAuthStore } from '../store/useAuthStore.js';

const links = [
  { to: '/', icon: MessageCircle, label: 'Chats' },
  { to: '/profile', icon: UserRound, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' }
];

export default function Sidebar({ onSearch }) {
  const profile = useAuthStore((state) => state.profile);
  const logout = useAuthStore((state) => state.logout);

  return (
    <aside className="sidebar glass-panel">
      <Link to="/" className="brand" aria-label="TELEchat home">
        <span className="brand-mark">T</span>
        <span>TELEchat</span>
      </Link>
      <button className="search-pill" type="button" onClick={onSearch}>
        <Search size={17} />
        <span>Search everything</span>
      </button>
      <nav className="nav-stack" aria-label="Primary">
        {links.map((item) => (
          <NavLink className="nav-item" to={item.to} key={item.to}>
            <item.icon size={19} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        {profile?.is_admin && (
          <NavLink className="nav-item" to="/admin">
            <Shield size={19} />
            <span>Admin</span>
          </NavLink>
        )}
      </nav>
      <div className="sidebar-capsules">
        <span><Bell size={14} /> Live alerts</span>
        <span><Archive size={14} /> Archive</span>
        <span><Compass size={14} /> Communities</span>
        <span><Moon size={14} /> Dark</span>
      </div>
      <div className="sidebar-user">
        <Avatar profile={profile} online />
        <div>
          <strong>{profile?.username || 'Telechatter'}</strong>
          <small>{profile?.custom_status || 'Available'}</small>
        </div>
        <button type="button" onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}

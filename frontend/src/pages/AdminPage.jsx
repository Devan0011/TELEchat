import { Ban, BarChart3, ShieldAlert, Trash2, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { adminApi } from '../services/api.js';

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    adminApi.overview().then(({ data }) => setOverview(data));
    adminApi.users().then(({ data }) => setUsers(data.users));
  }, []);

  return (
    <main className="app-shell settings-shell">
      <Sidebar />
      <section className="settings-page glass-panel">
        <div className="panel-header">
          <div><p className="eyebrow">Moderation</p><h1>Admin dashboard</h1></div>
        </div>
        <div className="stats-grid">
          <article><UsersRound size={22} /><strong>{overview?.users || 0}</strong><span>Users</span></article>
          <article><BarChart3 size={22} /><strong>{overview?.messages || 0}</strong><span>Messages</span></article>
          <article><ShieldAlert size={22} /><strong>{overview?.reports || 0}</strong><span>Reports</span></article>
          <article><Ban size={22} /><strong>{overview?.banned || 0}</strong><span>Banned</span></article>
        </div>
        <div className="admin-table">
          <header><span>User</span><span>Status</span><span>Role</span><span>Actions</span></header>
          {users.map((user) => (
            <div key={user.id}>
              <span>{user.username || user.email}</span>
              <span>{user.is_online ? 'Online' : 'Offline'}</span>
              <span>{user.is_admin ? 'Admin' : 'Member'}</span>
              <span>
                <button type="button" onClick={() => adminApi.moderate({ action: 'ban_user', targetId: user.id })}><Ban size={15} /></button>
                <button type="button" onClick={() => adminApi.moderate({ action: 'delete_user_content', targetId: user.id })}><Trash2 size={15} /></button>
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

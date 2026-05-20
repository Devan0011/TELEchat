import { Camera, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useAuthStore } from '../store/useAuthStore.js';
import { supabase } from '../services/supabase.js';
import { userApi } from '../services/api.js';

export default function ProfilePage() {
  const profile = useAuthStore((state) => state.profile);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [form, setForm] = useState({
    username: profile?.username || '',
    bio: profile?.bio || '',
    custom_status: profile?.custom_status || '',
    privacy: profile?.privacy || 'contacts'
  });

  const uploadAvatar = async (file) => {
    const path = `${profile.id}/${Date.now()}-${file.name}`;
    await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await updateProfile({ avatar_url: data.publicUrl });
  };

  return (
    <main className="app-shell settings-shell">
      <Sidebar />
      <section className="settings-page glass-panel">
        <header className="profile-cover">
          <Avatar profile={profile} size="lg" online />
          <label className="floating-upload">
            <Camera size={17} />
            <input hidden type="file" accept="image/*" onChange={(event) => uploadAvatar(event.target.files[0])} />
          </label>
          <h1>{profile?.username || 'Profile'}</h1>
          <p>{profile?.email}</p>
        </header>
        <form className="settings-grid" onSubmit={async (event) => {
          event.preventDefault();
          await updateProfile(form);
        }}>
          <label>Username<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
          <label>Bio<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>
          <label>Status<input value={form.custom_status} onChange={(event) => setForm({ ...form, custom_status: event.target.value })} /></label>
          <label>Privacy<select value={form.privacy} onChange={(event) => setForm({ ...form, privacy: event.target.value })}><option value="everyone">Everyone</option><option value="contacts">Contacts</option><option value="private">Private</option></select></label>
          <button className="primary-button" type="submit"><Save size={17} /> Save profile</button>
          <button className="danger-button" type="button" onClick={() => userApi.remove()}><Trash2 size={17} /> Delete account</button>
        </form>
      </section>
    </main>
  );
}

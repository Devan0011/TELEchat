import { Bell, Database, Globe2, LockKeyhole, Palette, Smartphone } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';

const sections = [
  { icon: LockKeyhole, title: 'Privacy', text: 'Last seen, blocked users, encrypted backup, profile visibility.' },
  { icon: Bell, title: 'Notifications', text: 'Sound, mentions, browser alerts, push notification preferences.' },
  { icon: Palette, title: 'Appearance', text: 'Dark theme, chat wallpapers, animation intensity, accent colors.' },
  { icon: Smartphone, title: 'Devices', text: 'Multi-device sessions, trusted browsers, active login review.' },
  { icon: Database, title: 'Data & storage', text: 'Media auto-download, cache limits, chat exports, retention.' },
  { icon: Globe2, title: 'Language', text: 'Locale, input hints, timezone and regional formats.' }
];

export default function SettingsPage() {
  return (
    <main className="app-shell settings-shell">
      <Sidebar />
      <section className="settings-page glass-panel">
        <div className="panel-header">
          <div><p className="eyebrow">Control center</p><h1>Settings</h1></div>
        </div>
        <div className="settings-cards">
          {sections.map((section) => (
            <article className="settings-card" key={section.title}>
              <section.icon size={22} />
              <div>
                <h2>{section.title}</h2>
                <p>{section.text}</p>
              </div>
              <label className="switch"><input type="checkbox" defaultChecked /><span /></label>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

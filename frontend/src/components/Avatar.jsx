export default function Avatar({ profile, size = 'md', online = false }) {
  const sizes = { sm: 32, md: 44, lg: 72 };
  const px = sizes[size] || sizes.md;
  const label = profile?.username?.slice(0, 2)?.toUpperCase() || profile?.email?.slice(0, 2)?.toUpperCase() || 'TC';

  return (
    <div className="avatar" style={{ width: px, height: px }}>
      {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.username || 'Avatar'} /> : <span>{label}</span>}
      {online && <i className="presence-dot" />}
    </div>
  );
}

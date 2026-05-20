import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const navigate = useNavigate();

  return (
    <main className="center-page">
      <form className="auth-card glass-panel" onSubmit={async (event) => {
        event.preventDefault();
        await resetPassword(password);
        navigate('/auth');
      }}>
        <h1>Reset password</h1>
        <label><KeyRound size={17} /><input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" /></label>
        <button className="primary-button" type="submit">Update password</button>
        <Link to="/auth">Back to login</Link>
      </form>
    </main>
  );
}

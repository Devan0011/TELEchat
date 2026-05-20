import { motion } from 'framer-motion';
import { Eye, KeyRound, Mail, Phone, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [otpSent, setOtpSent] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', username: '', phone: '', otp: '', remember: true });
  const { jwt, signInEmail, signUpEmail, sendPhoneOtp, verifyPhoneOtp, requestPasswordReset, loading, error } = useAuthStore();

  if (jwt) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (mode === 'signup') await signUpEmail(form);
    if (mode === 'login') await signInEmail(form);
    if (mode === 'phone' && !otpSent) {
      await sendPhoneOtp(form.phone);
      setOtpSent(true);
    } else if (mode === 'phone') {
      await verifyPhoneOtp({ phone: form.phone, token: form.otp });
    }
    if (mode === 'forgot') await requestPasswordReset(form.email);
  };

  return (
    <main className="auth-page">
      <motion.section className="auth-hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="brand huge"><span className="brand-mark">T</span><span>TELEchat</span></div>
        <h1>Secure conversations with calls, communities, and media built in.</h1>
        <div className="auth-points">
          <span><ShieldCheck size={16} /> Supabase Auth + JWT</span>
          <span><Sparkles size={16} /> Premium realtime UI</span>
          <span><KeyRound size={16} /> Protected routes</span>
        </div>
      </motion.section>
      <motion.form className="auth-card glass-panel" onSubmit={submit} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="mode-tabs">
          {['login', 'signup', 'phone'].map((item) => (
            <button className={mode === item ? 'active' : ''} type="button" key={item} onClick={() => setMode(item)}>
              {item}
            </button>
          ))}
        </div>
        {mode !== 'phone' && mode !== 'forgot' && (
          <>
            {mode === 'signup' && (
              <label><Sparkles size={17} /><input required placeholder="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
            )}
            <label><Mail size={17} /><input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label><Eye size={17} /><input required type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
            <div className="auth-options">
              <label className="check-label"><input type="checkbox" checked={form.remember} onChange={(event) => setForm({ ...form, remember: event.target.checked })} /> Remember me</label>
              <button type="button" onClick={() => setMode('forgot')}>Forgot password?</button>
            </div>
          </>
        )}
        {mode === 'phone' && (
          <>
            <label><Phone size={17} /><input required placeholder="+15551234567" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
            {otpSent && <label><KeyRound size={17} /><input required placeholder="OTP code" value={form.otp} onChange={(event) => setForm({ ...form, otp: event.target.value })} /></label>}
          </>
        )}
        {mode === 'forgot' && (
          <label><Mail size={17} /><input required type="email" placeholder="Recovery email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        )}
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" type="submit" disabled={loading}>
          <Send size={17} /> {loading ? 'Working...' : mode === 'forgot' ? 'Send reset link' : 'Continue'}
        </button>
      </motion.form>
    </main>
  );
}

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';

export default function AdminRoute({ children }) {
  const jwt = useAuthStore((state) => state.jwt);
  const profile = useAuthStore((state) => state.profile);
  if (!jwt) return <Navigate to="/auth" replace />;
  if (!profile?.is_admin) return <Navigate to="/" replace />;
  return children;
}

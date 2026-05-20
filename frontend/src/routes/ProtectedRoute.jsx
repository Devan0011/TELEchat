import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';

export default function ProtectedRoute({ children }) {
  const jwt = useAuthStore((state) => state.jwt);
  if (!jwt) return <Navigate to="/auth" replace />;
  return children;
}

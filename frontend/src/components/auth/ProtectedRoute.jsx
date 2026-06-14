import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Full-screen spinner while auth loads
const AuthLoader = () => (
  <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0a0f' }}>
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-indigo-500 border-r-violet-500 animate-spin" />
      <p className="text-slate-400 text-sm">Verifying session…</p>
    </div>
  </div>
);

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

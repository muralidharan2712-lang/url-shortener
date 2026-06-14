import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import LinksPage from './pages/LinksPage';
import AnalyticsListPage from './pages/AnalyticsListPage';
import AnalyticsPage from './pages/AnalyticsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'rgba(15, 15, 26, 0.97)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, system-ui, sans-serif',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: 'transparent' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: 'transparent' },
            },
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

          {/* Protected routes inside AppLayout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/links"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <LinksPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AnalyticsListPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AnalyticsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

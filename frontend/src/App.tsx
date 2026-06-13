import { useState, useEffect } from 'react';
import apiClient from './services/api';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Homepage } from './components/Homepage';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/Toast';

type View = 'login' | 'register' | 'dashboard';

function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('access_token');
      if (!savedToken) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userEmail');
        setUserEmail(null);
        setCurrentView('login');
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/me');
        const user = response.data?.data;
        if (user && user.email) {
          setUserEmail(user.email);
          localStorage.setItem('userEmail', user.email);
          setCurrentView('dashboard');
        } else {
          throw new Error('Invalid user response');
        }
      } catch (err: any) {
        const errCode = err.response?.data?.data?.error_code;

        if (errCode === 'TOKEN_EXPIRED') {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const refreshResponse = await apiClient.post('/auth/refresh', {
                refresh_token: refreshToken
              });
              const newTokens = refreshResponse.data?.data;
              if (newTokens?.access_token && newTokens?.refresh_token) {
                localStorage.setItem('access_token', newTokens.access_token);
                localStorage.setItem('refresh_token', newTokens.refresh_token);
                const retryResponse = await apiClient.get('/auth/me');
                const user = retryResponse.data?.data;
                if (user && user.email) {
                  setUserEmail(user.email);
                  localStorage.setItem('userEmail', user.email);
                  setCurrentView('dashboard');
                  setLoading(false);
                  return;
                }
              }
            } catch {
              // token refresh failed
            }
          }
        }

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userEmail');
        setUserEmail(null);
        setCurrentView('login');
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const handleLoginSuccess = (_token: string, email: string) => {
    setUserEmail(email);
    localStorage.setItem('userEmail', email);
    setCurrentView('dashboard');
  };

  const handleRegisterSuccess = () => {
    setCurrentView('login');
  };

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      try {
        const payloadBase64 = accessToken.split('.')[1];
        if (payloadBase64) {
          const payload = JSON.parse(atob(payloadBase64));
          const userId = payload.sub;
          if (userId) {
            const refreshToken = localStorage.getItem('refresh_token');
            await apiClient.post('/auth/logout', {
              user_id: userId,
              access_token: refreshToken
            });
          }
        }
      } catch {
        // logout error is non-critical
      }
    }

    setUserEmail(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userEmail');
    setCurrentView('login');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'register':
        return (
          <Register
            onSuccess={handleRegisterSuccess}
            onToggleView={(view) => setCurrentView(view)}
          />
        );
      case 'dashboard':
        return (
          <Homepage
            userEmail={userEmail || ''}
            onLogout={handleLogout}
          />
        );
      case 'login':
      default:
        return (
          <Login
            onSuccess={handleLoginSuccess}
            onToggleView={(view) => setCurrentView(view)}
          />
        );
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        background: 'var(--bg-base)'
      }}>
        {/* Animated Logo */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          boxShadow: '0 0 40px rgba(99,102,241,0.4)',
          animation: 'pulse-glow 2s ease-in-out infinite'
        }}>
          🚀
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Applo
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 18,
              height: 18,
              border: '2px solid rgba(99,102,241,0.3)',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite'
            }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Verifying session...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {renderContent()}
        </main>
      </div>
      <ToastContainer />
    </ToastProvider>
  );
}

export default App;

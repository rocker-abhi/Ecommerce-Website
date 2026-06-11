import { useState, useEffect } from 'react';
import apiClient from './services/api';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Homepage } from './components/Homepage';

type View = 'login' | 'register' | 'dashboard';

function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load auth session on startup
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
        console.error('Session verification failed:', err);
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

                // Retry auth/me
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
            } catch (refreshErr) {
              console.error('Token refresh failed:', refreshErr);
            }
          }
        }

        // Clear everything and route to login if we get any other error or if refresh flow failed
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
      } catch (err) {
        console.error('Error logging out from server:', err);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 font-sans">
        <div className="text-zinc-600 text-sm animate-pulse">Verifying session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 font-sans">
      <main className="flex-grow flex flex-col justify-center relative">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;

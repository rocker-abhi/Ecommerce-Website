import { useState, useEffect } from 'react';
import apiClient from './services/api';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Dashboard } from './components/Dashboard';

type View = 'login' | 'register' | 'dashboard';

function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Load auth session on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedEmail = localStorage.getItem('userEmail');
    if (savedToken && savedEmail) {
      setUserEmail(savedEmail);
      setCurrentView('dashboard');
    } else {
      setCurrentView('login');
    }
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
          <Dashboard
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

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 font-sans">
      <main className="flex-grow flex flex-col justify-center relative">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;

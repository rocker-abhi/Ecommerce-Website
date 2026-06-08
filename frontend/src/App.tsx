import { useState, useEffect } from 'react';
import axios from 'axios';
import reactLogo from './assets/react.svg';
import { Login } from './components/Login';
import { Register } from './components/Register';

type View = 'login' | 'register' | 'dashboard';

function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Load auth session on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedEmail = localStorage.getItem('userEmail');
    if (savedToken && savedEmail) {
      setAuthToken(savedToken);
      setUserEmail(savedEmail);
      setCurrentView('dashboard');
    } else {
      setCurrentView('login');
    }
  }, []);

  const handleLoginSuccess = (token: string, email: string) => {
    setAuthToken(token);
    setUserEmail(email);
    // access_token & refresh_token are already saved inside Login.tsx,
    // but we write userEmail and sync state here.
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
            await axios.post(
              '/auth/logout',
              {
                user_id: userId,
                access_token: refreshToken
              },
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
          }
        }
      } catch (err) {
        console.error('Error logging out from server:', err);
      }
    }

    setAuthToken(null);
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
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8 animate-fade-in relative z-10">
            <div className="w-full max-w-lg bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl shadow-black/80">
              <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-3xl font-bold flex items-center justify-center mx-auto mb-6">
                {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
              </div>

              <h2 className="text-3xl font-bold text-white mb-2 text-center">User Dashboard</h2>
              <p className="text-zinc-400 text-sm text-center mb-8">
                You have successfully authenticated via Flask JWT token.
              </p>

              <div className="grid grid-cols-[100px_1fr] text-sm gap-y-4 border-t border-white/5 pt-6 text-left">
                <span className="font-semibold text-zinc-300">Email:</span>
                <span className="text-zinc-400 break-all">{userEmail}</span>

                <span className="font-semibold text-zinc-300">Status:</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active (Authenticated)
                </span>

                <span className="font-semibold text-zinc-300">Auth Token:</span>
                <span className="text-zinc-500 font-mono text-[11px] break-all bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5">
                  {authToken ? `${authToken.substring(0, 48)}...` : 'None'}
                </span>
              </div>

              <button
                type="button"
                className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold py-3.5 px-4 rounded-lg shadow-lg shadow-purple-950/40 hover:shadow-purple-900/50 transition-all duration-200 mt-8"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
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
    <div className="relative min-h-screen flex flex-col">
      {/* Glow blobs for premium background aesthetic */}
      <div className="glow-blob glow-purple"></div>
      <div className="glow-blob glow-blue"></div>

      <header className="flex justify-between items-center px-6 md:px-12 py-5 border-b border-white/5 bg-black/20 backdrop-blur-md relative z-20">
        <div
          className="flex items-center gap-2.5 font-bold text-lg text-white cursor-pointer select-none"
          onClick={() => setCurrentView(authToken ? 'dashboard' : 'login')}
        >
          <img src={reactLogo} className="h-6 animate-[spin_20s_linear_infinite]" alt="logo" />
          <span className="tracking-wide bg-linear-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            E-Shop Admin
          </span>
        </div>

        <nav className="flex items-center gap-4">
          {authToken ? (
            <>
              <button
                type="button"
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${currentView === 'dashboard' ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-white'
                  }`}
                onClick={() => setCurrentView('dashboard')}
              >
                Dashboard
              </button>
              <button
                type="button"
                className="text-sm font-medium bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-lg transition-all"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${currentView === 'login' ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-white'
                  }`}
                onClick={() => setCurrentView('login')}
              >
                Login
              </button>
              <button
                type="button"
                className="text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-purple-950/20"
                onClick={() => setCurrentView('register')}
              >
                Register
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="flex-grow flex flex-col justify-center relative">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;

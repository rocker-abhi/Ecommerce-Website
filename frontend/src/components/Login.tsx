import React, { useState } from 'react';
import axios from 'axios';

interface LoginProps {
  onSuccess: (accessToken: string, email: string) => void;
  onToggleView: (view: 'register') => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onToggleView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Error modal states
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Field validation states
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const isEmailValid = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  const isPasswordValid = (val: string) => {
    // Backend length 6 to 10
    return val.length >= 6 && val.length <= 10 && !val.includes(' ');
  };

  const getEmailError = () => {
    if (!emailTouched) return '';
    if (!email) return 'Email is required.';
    if (!isEmailValid(email)) return 'Email format is invalid.';
    return '';
  };

  const getPasswordError = () => {
    if (!passwordTouched) return '';
    if (!password) return 'Password is required.';
    if (password.length < 6 || password.length > 10) {
      return 'Password must be between 6 and 10 characters.';
    }
    if (password.includes(' ')) {
      return 'Password cannot contain spaces.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!email || !password || !isEmailValid(email) || !isPasswordValid(password)) {
      setErrorMessage('Please resolve validation errors before logging in.');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      // Axios POST request to /auth/login
      const response = await axios.post('/auth/login', {
        email,
        password
      });

      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || 'Login failed.');
      }

      // Save tokens in localStorage as requested
      const accessToken = result.data?.access_token || '';
      const refreshToken = result.data?.refresh_token || '';
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('userEmail', email);

      // Trigger success callback
      onSuccess(accessToken, email);
    } catch (err: any) {
      // Axios error handling
      const backendMessage = err.response?.data?.message || err.message;
      setErrorMessage(backendMessage || 'An unexpected error occurred during login.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    email &&
    password &&
    isEmailValid(email) &&
    isPasswordValid(password);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8 animate-fade-in relative z-10">
      {/* Sleek transparent black glass card */}
      <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl shadow-black/80 transition-all duration-300">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight text-center">Welcome Back</h2>
        <p className="text-zinc-400 text-sm mb-8 text-center">Log in to manage your e-commerce account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="w-full bg-black/35 border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none rounded-lg px-4 py-3 text-white text-sm transition-all duration-200 placeholder-zinc-600"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              disabled={loading}
              autoComplete="email"
              required
            />
            {getEmailError() && (
              <span className="text-red-400 text-xs mt-1 font-medium">{getEmailError()}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full bg-black/35 border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none rounded-lg px-4 py-3 text-white text-sm transition-all duration-200 placeholder-zinc-600"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
            {getPasswordError() && (
              <span className="text-red-400 text-xs mt-1 font-medium">{getPasswordError()}</span>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 disabled:pointer-events-none text-white text-sm font-semibold py-3.5 px-4 rounded-lg shadow-lg shadow-purple-950/40 hover:shadow-purple-900/50 transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            disabled={loading || (emailTouched && passwordTouched && !isFormValid)}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-zinc-400">
          Don't have an account?
          <button
            type="button"
            className="text-purple-400 hover:text-purple-300 font-semibold ml-1.5 hover:underline focus:outline-none"
            onClick={() => onToggleView('register')}
            disabled={loading}
          >
            Register new user
          </button>
        </div>
      </div>

      {/* Premium White Popup Error Modal matching the theme's glassmorphism style */}
      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-xs z-50 animate-fade-in p-4">
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-2xl text-zinc-900 animate-fade-in flex flex-col items-center">
            {/* Warning Icon */}
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 shadow-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-zinc-950 mb-2">Login Error</h3>
            <p className="text-sm text-zinc-600 text-center mb-6 leading-relaxed">
              {errorMessage}
            </p>

            <button
              type="button"
              className="w-full bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-950 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500/50"
              onClick={() => {
                setShowErrorModal(false);
                setErrorMessage('');
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

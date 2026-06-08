import React, { useState } from 'react';
import apiClient from '../services/api';

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
      // API client POST request to /auth/login
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });

      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || 'Login failed.');
      }

      // Save tokens in localStorage
      const accessToken = result.data?.access_token || '';
      const refreshToken = result.data?.refresh_token || '';
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('userEmail', email);

      // Trigger success callback
      onSuccess(accessToken, email);
    } catch (err: any) {
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8 bg-zinc-50 font-sans">
      
      {/* Amazon Logo */}
      <div className="mb-6 flex flex-col items-center">
        <svg className="w-28 h-10 text-zinc-900" viewBox="0 0 100 30" fill="currentColor">
          <path d="M13.2 12c-1.3-.2-2.6-.3-3.9-.3-1.6 0-3.2.2-4.5.7C3.5 13 2.8 13.9 2.8 15c0 1.9 1.8 3 4.2 3 1.8 0 3.3-.6 4.4-1.6V12.1v-.1zm8.3 5.4c0 1.2.2 2.4.5 3.3.2.6.4 1 .7 1.2.2.2.5.3.8.3h.1c.3 0 .7-.2 1-.5.3-.3.6-.8.8-1.4l1.6.4c-.4 1.2-.9 2.1-1.6 2.8-.7.7-1.7 1-2.9 1-1.2 0-2.1-.4-2.8-1.2-.6-.8-.9-1.9-.9-3.3v-9.6H17.4v-1.9H19V8.6l2.5-.7v1.8h2.8v1.9H21.5v7.8zm11.7-8.1l.1 2.3c.7-.9 1.5-1.6 2.4-2 1-.5 2.1-.7 3.3-.7 1.8 0 3.2.5 4.2 1.5 1 1 1.5 2.5 1.5 4.5v6.5h-2.6v-6c0-1.2-.3-2.1-.8-2.6-.5-.5-1.3-.8-2.3-.8-1 0-1.8.3-2.5.9-.7.6-1.1 1.4-1.3 2.5v6h-2.6v-14h2.6v2zm24.6 2.1c-.9-.7-2.1-1-3.6-1-1.6 0-2.9.4-4 1.2-1.1.8-1.7 1.9-1.8 3.3h2.6c.1-.8.4-1.3.9-1.7.5-.4 1.2-.6 2.2-.6.9 0 1.6.2 2.1.5.5.3.7.8.7 1.4v.9c-1-.1-2.1-.2-3.3-.2-2.2 0-3.9.4-5 1.3-1.1.9-1.6 2.1-1.6 3.7 0 1.5.5 2.7 1.4 3.5 1 .8 2.3 1.2 3.9 1.2 1.6 0 2.9-.4 3.8-1.2.9-.8 1.4-1.7 1.6-2.7l.1 1h2.5V17c.2-2.1-.3-3.7-1.3-4.7-.9-1-2.5-1.5-4.7-1.5z" />
          <path d="M72.2 9.3c-1.3 0-2.5.2-3.6.7-1.1.5-2 1.1-2.7 2-.7-.9-1.6-1.5-2.7-2-1.1-.5-2.3-.7-3.6-.7-2.2 0-3.9.7-5.1 2-1.2 1.3-1.8 3.2-1.8 5.6 0 2.4.6 4.3 1.8 5.6 1.2 1.3 2.9 2 5.1 2 1.3 0 2.5-.2 3.6-.7 1.1-.5 2-1.1 2.7-2 .7.9 1.6 1.5 2.7 2 1.1.5 2.3.7 3.6.7 2.2 0 3.9-.7 5.1-2 1.2-1.3 1.8-3.2 1.8-5.6 0-2.4-.6-4.3-1.8-5.6-1.2-1.3-2.9-2-5.1-2zm-12.7 8.3c0 1.5-.3 2.7-.9 3.4-.6.7-1.4 1.1-2.4 1.1-1 0-1.8-.4-2.4-1.1-.6-.7-.9-1.9-.9-3.4s.3-2.7.9-3.4c.6-.7 1.4-1.1 2.4-1.1 1 0 1.8.4 2.4 1.1.6.7.9 1.9.9 3.4zm12.7 0c0 1.5-.3 2.7-.9 3.4-.6.7-1.4 1.1-2.4 1.1-1 0-1.8-.4-2.4-1.1-.6-.7-.9-1.9-.9-3.4s.3-2.7.9-3.4c.6-.7 1.4-1.1 2.4-1.1 1 0 1.8.4 2.4 1.1.6.7.9 1.9.9 3.4zM86.8 9.3c-1.3 0-2.5.2-3.6.7-1.1.5-2 1.1-2.7 2v-2.4h-2.5v14.1h2.5v-7.8c0-1.2.3-2.1.8-2.6.5-.5 1.3-.8 2.3-.8 1 0 1.8.3 2.5.9.7.6 1.1 1.4 1.3 2.5v7.8h2.6v-8.9c0-1.8-.5-3.3-1.4-4.3-.9-1-2.3-1.5-4.2-1.5z" />
          <path d="M12.8 24.1c11.2 4.4 26.2 6.7 41.2 6.7 12 0 24-1.5 34.6-4.6l.8 2c-11 3.2-23.4 4.8-35.4 4.8-15.4 0-30.8-2.3-42.3-6.9l.1-2z" fill="#f9a825" />
          <path d="M91.3 22c-.5.3-.9.6-1.5.9-.6.3-1.3.5-2 .7h-.1l-.1-.2.4-.8.5-.8.5-.8c.2-.3.4-.6.6-1l.5.2c-.2.6-.4 1.2-.5 1.8h.3c.3-.1.6-.2.9-.3.3-.1.6-.2.8-.4h.1l.1.3z" fill="#f9a825" />
        </svg>
      </div>

      {/* Error Alert Box (matching Amazon error style) */}
      {showErrorModal && (
        <div className="w-full max-w-[350px] mb-4 bg-white border border-red-700 rounded-md p-4 flex gap-3 shadow-sm animate-fade-in text-sm text-zinc-900">
          <div className="text-red-700 font-bold text-lg leading-none">!</div>
          <div>
            <h4 className="font-bold text-red-700 mb-0.5">There was a problem</h4>
            <p className="text-zinc-700 text-xs leading-normal">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* White Sign-In Card */}
      <div className="w-full max-w-[350px] bg-white border border-zinc-200 rounded-lg p-6 shadow-xs">
        <h2 className="text-2xl font-normal text-zinc-900 mb-4">Sign in</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Email field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-900" htmlFor="email">
              Email or mobile phone number
            </label>
            <input
              id="email"
              type="email"
              className="w-full bg-white border border-zinc-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none rounded-md px-3 py-1.5 text-zinc-900 text-sm transition-all placeholder-zinc-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              disabled={loading}
              autoComplete="email"
              required
            />
            {getEmailError() && (
              <span className="text-red-700 text-[11px] mt-0.5">{getEmailError()}</span>
            )}
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-zinc-900" htmlFor="password">
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              className="w-full bg-white border border-zinc-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none rounded-md px-3 py-1.5 text-zinc-900 text-sm transition-all placeholder-zinc-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
            {getPasswordError() && (
              <span className="text-red-700 text-[11px] mt-0.5">{getPasswordError()}</span>
            )}
          </div>

          {/* Sign In button */}
          <button
            type="submit"
            className="w-full amazon-btn-primary py-1.5 px-4 text-xs font-normal shadow-xs mt-2"
            disabled={loading || (emailTouched && passwordTouched && !isFormValid)}
          >
            {loading ? 'Loading...' : 'Sign in'}
          </button>
        </form>

        <p className="text-[11px] text-zinc-600 mt-4 leading-normal">
          By continuing, you agree to Amazon's <span className="text-cyan-800 hover:text-orange-700 hover:underline cursor-pointer">Conditions of Use</span> and <span className="text-cyan-800 hover:text-orange-700 hover:underline cursor-pointer">Privacy Notice</span>.
        </p>
      </div>

      {/* New to Amazon Divider */}
      <div className="w-full max-w-[350px] mt-6 flex items-center justify-between gap-3 text-zinc-500 text-xs">
        <span className="flex-1 h-[1px] bg-zinc-200"></span>
        <span className="shrink-0 text-zinc-500 text-[11px]">New to Amazon?</span>
        <span className="flex-1 h-[1px] bg-zinc-200"></span>
      </div>

      {/* Create Account button */}
      <button
        type="button"
        className="w-full max-w-[350px] amazon-btn-secondary py-1.5 px-4 text-xs font-normal shadow-xs mt-3.5 border border-zinc-300 rounded-md"
        onClick={() => onToggleView('register')}
        disabled={loading}
      >
        Create your Amazon account
      </button>

    </div>
  );
};

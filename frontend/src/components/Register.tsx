import React, { useState } from 'react';
import axios from 'axios';

interface RegisterProps {
  onSuccess: () => void;
  onToggleView: (view: 'login') => void;
}

export const Register: React.FC<RegisterProps> = ({ onSuccess, onToggleView }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer');

  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  // Field touch states
  const [nameTouched, setNameTouched] = useState(false);
  const [ageTouched, setAgeTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Validation functions
  const isNameValid = (val: string) => val.trim().length >= 1 && val.trim().length <= 100;
  
  const isAgeValid = (val: string) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 18 && num <= 80;
  };

  const isEmailValid = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  const isPasswordValid = (val: string) => {
    // Backend length 6 to 12 for register
    return val.length >= 6 && val.length <= 12 && !val.includes(' ');
  };

  // Error messages resolver
  const getNameError = () => {
    if (!nameTouched) return '';
    if (!name.trim()) return 'Name is required.';
    if (name.length > 100) return 'Name must be 100 characters or less.';
    return '';
  };

  const getAgeError = () => {
    if (!ageTouched) return '';
    if (!age) return 'Age is required.';
    const num = parseInt(age, 10);
    if (isNaN(num) || num < 18 || num > 80) {
      return 'Age must be between 18 and 80.';
    }
    return '';
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
    if (password.length < 6 || password.length > 12) {
      return 'Password must be between 6 and 12 characters.';
    }
    if (password.includes(' ')) {
      return 'Password cannot contain spaces.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setAgeTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);

    const parsedAge = parseInt(age, 10);
    if (
      !isNameValid(name) ||
      !isAgeValid(age) ||
      !isEmailValid(email) ||
      !isPasswordValid(password)
    ) {
      setErrorMessage('Please resolve validation errors before submitting.');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      // Axios POST request to /auth/register
      const response = await axios.post('/auth/register', {
        name: name.trim(),
        age: parsedAge,
        email: email.trim(),
        password,
        userType, // sets either 'buyer' or 'seller'
      });

      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || 'Registration failed.');
      }

      setSuccess('Account created successfully!');
      
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      const backendMessage = err.response?.data?.message || err.message;
      setErrorMessage(backendMessage || 'An unexpected error occurred during registration.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    isNameValid(name) &&
    isAgeValid(age) &&
    isEmailValid(email) &&
    isPasswordValid(password);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8 animate-fade-in relative z-10">
      <div className="w-full max-w-lg bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl shadow-black/80 transition-all duration-300">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight text-center">Create Account</h2>
        <p className="text-zinc-400 text-sm mb-8 text-center">Sign up to get started on our e-commerce platform</p>

        {success && (
          <div className="flex items-start gap-3 bg-green-950/40 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm mb-6 animate-fade-in">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Account Type Role Cards (Replaces dropdown) */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Choose Account Type
            </span>
            <div className="grid grid-cols-2 gap-4">
              {/* Buyer Card */}
              <div
                onClick={() => !loading && setUserType('buyer')}
                className={`flex flex-col items-center p-4 rounded-xl border cursor-pointer select-none transition-all duration-200 text-center ${
                  userType === 'buyer'
                    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-950/25'
                    : 'border-white/10 bg-black/20 hover:border-white/20'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2.5 ${
                  userType === 'buyer' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-zinc-400'
                }`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-white mb-0.5">Buyer</span>
                <span className="text-[11px] text-zinc-400 leading-tight">Order products & review items</span>
              </div>

              {/* Seller Card */}
              <div
                onClick={() => !loading && setUserType('seller')}
                className={`flex flex-col items-center p-4 rounded-xl border cursor-pointer select-none transition-all duration-200 text-center ${
                  userType === 'seller'
                    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-950/25'
                    : 'border-white/10 bg-black/20 hover:border-white/20'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2.5 ${
                  userType === 'seller' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-zinc-400'
                }`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V21M3 6h18" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-white mb-0.5">Seller</span>
                <span className="text-[11px] text-zinc-400 leading-tight">Sell items & view analytics</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="w-full bg-black/35 border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none rounded-lg px-4 py-2.5 text-white text-sm transition-all duration-200 placeholder-zinc-600"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setNameTouched(true)}
              disabled={loading}
              required
            />
            {getNameError() && (
              <span className="text-red-400 text-xs mt-1 font-medium">{getNameError()}</span>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider" htmlFor="age">
                Age
              </label>
              <input
                id="age"
                type="number"
                className="w-full bg-black/35 border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none rounded-lg px-4 py-2.5 text-white text-sm transition-all duration-200 placeholder-zinc-600"
                placeholder="25"
                min="18"
                max="80"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                onBlur={() => setAgeTouched(true)}
                disabled={loading}
                required
              />
              {getAgeError() && (
                <span className="text-red-400 text-xs mt-1 font-medium">{getAgeError()}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="w-full bg-black/35 border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none rounded-lg px-4 py-2.5 text-white text-sm transition-all duration-200 placeholder-zinc-600"
              placeholder="john@example.com"
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
              className="w-full bg-black/35 border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none rounded-lg px-4 py-2.5 text-white text-sm transition-all duration-200 placeholder-zinc-600"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              disabled={loading}
              autoComplete="new-password"
              required
            />
            {getPasswordError() && (
              <span className="text-red-400 text-xs mt-1 font-medium">{getPasswordError()}</span>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 disabled:pointer-events-none text-white text-sm font-semibold py-3.5 px-4 rounded-lg shadow-lg shadow-purple-950/40 hover:shadow-purple-900/50 transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            disabled={loading || (nameTouched && ageTouched && emailTouched && passwordTouched && !isFormValid)}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-zinc-400">
          Already have an account?
          <button
            type="button"
            className="text-purple-400 hover:text-purple-300 font-semibold ml-1.5 hover:underline focus:outline-none"
            onClick={() => onToggleView('login')}
            disabled={loading}
          >
            Log in
          </button>
        </div>
      </div>

      {/* Premium White Popup Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-xs z-50 animate-fade-in p-4">
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-2xl text-zinc-900 animate-fade-in flex flex-col items-center">
            {/* Warning Icon */}
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 shadow-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-zinc-950 mb-2">Registration Error</h3>
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

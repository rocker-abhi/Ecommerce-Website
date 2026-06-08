import React, { useState } from 'react';
import apiClient from '../services/api';

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
      // API client POST request to /auth/register
      const response = await apiClient.post('/auth/register', {
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

      {/* Success Banner */}
      {success && (
        <div className="w-full max-w-[350px] mb-4 bg-white border border-emerald-600 rounded-md p-4 flex gap-3 shadow-sm animate-fade-in text-sm text-zinc-900">
          <div className="text-emerald-600 font-bold text-lg leading-none">✓</div>
          <div>
            <h4 className="font-bold text-emerald-600 mb-0.5">Account Created</h4>
            <p className="text-zinc-600 text-xs leading-normal">{success}</p>
          </div>
        </div>
      )}

      {/* Error Alert Box */}
      {showErrorModal && (
        <div className="w-full max-w-[350px] mb-4 bg-white border border-red-700 rounded-md p-4 flex gap-3 shadow-sm animate-fade-in text-sm text-zinc-900">
          <div className="text-red-700 font-bold text-lg leading-none">!</div>
          <div>
            <h4 className="font-bold text-red-700 mb-0.5">There was a problem</h4>
            <p className="text-zinc-700 text-xs leading-normal">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* White Create Account Card */}
      <div className="w-full max-w-[350px] bg-white border border-zinc-200 rounded-lg p-6 shadow-xs">
        <h2 className="text-2xl font-normal text-zinc-900 mb-4">Create account</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5" noValidate>
          {/* Name field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-900" htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              type="text"
              placeholder="First and last name"
              className="w-full bg-white border border-zinc-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none rounded-md px-3 py-1.5 text-zinc-900 text-sm transition-all placeholder-zinc-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setNameTouched(true)}
              disabled={loading}
              required
            />
            {getNameError() && (
              <span className="text-red-700 text-[11px] mt-0.5">{getNameError()}</span>
            )}
          </div>

          {/* Age field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-900" htmlFor="age">
              Age
            </label>
            <input
              id="age"
              type="number"
              className="w-full bg-white border border-zinc-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none rounded-md px-3 py-1.5 text-zinc-900 text-sm transition-all placeholder-zinc-400"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              onBlur={() => setAgeTouched(true)}
              disabled={loading}
              required
            />
            {getAgeError() && (
              <span className="text-red-700 text-[11px] mt-0.5">{getAgeError()}</span>
            )}
          </div>

          {/* Email field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-900" htmlFor="email">
              Email
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
            <label className="text-xs font-bold text-zinc-900" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              className="w-full bg-white border border-zinc-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none rounded-md px-3 py-1.5 text-zinc-900 text-sm transition-all placeholder-zinc-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              disabled={loading}
              autoComplete="new-password"
              required
            />
            <span className="text-[10px] text-zinc-500 mt-0.5 font-normal">
              Passwords must be between 6 and 12 characters.
            </span>
            {getPasswordError() && (
              <span className="text-red-700 text-[11px] mt-0.5">{getPasswordError()}</span>
            )}
          </div>

          {/* Account Type Selection (Sleek Radio Inputs to fit the clean layout) */}
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-xs font-bold text-zinc-900">
              Account Type
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-xs text-zinc-800 cursor-pointer select-none">
                <input
                  type="radio"
                  name="userType"
                  value="buyer"
                  checked={userType === 'buyer'}
                  onChange={() => setUserType('buyer')}
                  className="accent-amber-500 cursor-pointer"
                  disabled={loading}
                />
                Buyer (Order items)
              </label>
              
              <label className="flex items-center gap-1.5 text-xs text-zinc-800 cursor-pointer select-none">
                <input
                  type="radio"
                  name="userType"
                  value="seller"
                  checked={userType === 'seller'}
                  onChange={() => setUserType('seller')}
                  className="accent-amber-500 cursor-pointer"
                  disabled={loading}
                />
                Seller (Sell items)
              </label>
            </div>
          </div>

          {/* Create Account button */}
          <button
            type="submit"
            className="w-full amazon-btn-primary py-1.5 px-4 text-xs font-normal shadow-xs mt-3.5"
            disabled={loading || (nameTouched && ageTouched && emailTouched && passwordTouched && !isFormValid)}
          >
            {loading ? 'Creating...' : 'Create your Amazon account'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-zinc-200 text-xs text-zinc-900 leading-normal">
          Already have an account?{' '}
          <button
            type="button"
            className="text-cyan-800 hover:text-orange-700 hover:underline font-normal cursor-pointer"
            onClick={() => onToggleView('login')}
            disabled={loading}
          >
            Sign in
          </button>
        </div>
      </div>

    </div>
  );
};

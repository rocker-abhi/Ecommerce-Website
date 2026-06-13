import React, { useState } from 'react';
import apiClient from '../services/api';
import { useToast } from '../context/ToastContext';

interface LoginProps {
  onSuccess: (accessToken: string, email: string) => void;
  onToggleView: (view: 'register') => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onToggleView }) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const isEmailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPasswordValid = (v: string) => v.length >= 6 && v.length <= 12 && !v.includes(' ');

  const emailError = emailTouched
    ? !email ? 'Email is required.' : !isEmailValid(email) ? 'Invalid email format.' : ''
    : '';
  const passwordError = passwordTouched
    ? !password ? 'Password is required.'
    : password.length < 6 || password.length > 12 ? 'Password must be 6–12 characters.'
    : password.includes(' ') ? 'No spaces allowed.' : ''
    : '';

  const isFormValid = email && password && isEmailValid(email) && isPasswordValid(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    if (!isFormValid) return;

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const result = response.data;
      if (!result.success) throw new Error(result.message || 'Login failed.');

      const accessToken = result.data?.access_token || '';
      const refreshToken = result.data?.refresh_token || '';
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('userEmail', email);
      showToast('success', 'Welcome back!', `Signed in as ${email}`);
      onSuccess(accessToken, email);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'An unexpected error occurred.';
      showToast('error', 'Sign in failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 16px',
            boxShadow: '0 0 40px rgba(99,102,241,0.35)'
          }}>🛍️</div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: 28, fontWeight: 800, margin: '0 0 6px',
            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>ShopVerse</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="glass-card-static" style={{ padding: '32px 28px' }}>
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Email */}
            <div>
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="glass-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                disabled={loading}
                autoComplete="email"
              />
              {emailError && (
                <p style={{ color: 'var(--error)', fontSize: 12, marginTop: 6, marginBottom: 0 }}>
                  {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="form-label" htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  disabled={loading}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 4, display: 'flex'
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && (
                <p style={{ color: 'var(--error)', fontSize: 12, marginTop: 6, marginBottom: 0 }}>
                  {passwordError}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '13px', fontSize: 15, marginTop: 4 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite'
                  }} />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              Don't have an account?{' '}
              <button
                onClick={() => onToggleView('register')}
                disabled={loading}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--accent-secondary)', fontWeight: 600, fontSize: 13,
                  padding: 0, textDecoration: 'none'
                }}
              >
                Create account
              </button>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 24, lineHeight: 1.6 }}>
          By signing in, you agree to our{' '}
          <span style={{ color: 'var(--accent-tertiary)', cursor: 'pointer' }}>Terms of Service</span>{' '}
          and{' '}
          <span style={{ color: 'var(--accent-tertiary)', cursor: 'pointer' }}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
};

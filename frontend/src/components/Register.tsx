import React, { useState } from 'react';
import apiClient from '../services/api';
import { useToast } from '../context/ToastContext';

interface RegisterProps {
  onSuccess: () => void;
  onToggleView: (view: 'login') => void;
}

export const Register: React.FC<RegisterProps> = ({ onSuccess, onToggleView }) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer');
  const [loading, setLoading] = useState(false);

  const [nameTouched, setNameTouched] = useState(false);
  const [ageTouched, setAgeTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const isNameValid = (v: string) => v.trim().length >= 1 && v.trim().length <= 100;
  const isAgeValid = (v: string) => { const n = parseInt(v, 10); return !isNaN(n) && n >= 18 && n <= 80; };
  const isEmailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPasswordValid = (v: string) => v.length >= 6 && v.length <= 12 && !v.includes(' ');

  const nameError = nameTouched ? (!name.trim() ? 'Name is required.' : name.length > 100 ? 'Max 100 characters.' : '') : '';
  const ageError = ageTouched ? (!age ? 'Age is required.' : !isAgeValid(age) ? 'Age must be between 18 and 80.' : '') : '';
  const emailError = emailTouched ? (!email ? 'Email is required.' : !isEmailValid(email) ? 'Invalid email format.' : '') : '';
  const passwordError = passwordTouched
    ? (!password ? 'Password is required.'
      : password.length < 6 || password.length > 12 ? 'Password must be 6–12 characters.'
      : password.includes(' ') ? 'No spaces allowed.' : '') : '';

  const isFormValid = isNameValid(name) && isAgeValid(age) && isEmailValid(email) && isPasswordValid(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setAgeTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    if (!isFormValid) return;

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        name: name.trim(),
        age: parseInt(age, 10),
        email: email.trim(),
        password,
        userType,
      });
      const result = response.data;
      if (!result.success) throw new Error(result.message || 'Registration failed.');
      showToast('success', 'Account created!', 'You can now sign in to your account.');
      setTimeout(() => onSuccess(), 1000);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'An unexpected error occurred.';
      showToast('error', 'Registration failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (error: string) => ({
    borderColor: error ? 'rgba(239,68,68,0.5)' : undefined,
  });

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
        position: 'absolute', top: '-15%', right: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, margin: '0 auto 14px',
            boxShadow: '0 0 36px rgba(99,102,241,0.35)'
          }}>🚀</div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, margin: '0 0 4px',
            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Applo</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Create your account</p>
        </div>

        {/* Card */}
        <div className="glass-card-static" style={{ padding: '28px 28px' }}>
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Name + Age row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 14 }}>
              <div>
                <label className="form-label" htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
                  type="text"
                  className="glass-input"
                  placeholder="Your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  disabled={loading}
                  style={inputStyle(nameError)}
                />
                {nameError && <p style={{ color: 'var(--error)', fontSize: 11, marginTop: 4, marginBottom: 0 }}>{nameError}</p>}
              </div>
              <div>
                <label className="form-label" htmlFor="reg-age">Age</label>
                <input
                  id="reg-age"
                  type="number"
                  className="glass-input"
                  placeholder="18–80"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  onBlur={() => setAgeTouched(true)}
                  disabled={loading}
                  min={18} max={80}
                  style={inputStyle(ageError)}
                />
                {ageError && <p style={{ color: 'var(--error)', fontSize: 11, marginTop: 4, marginBottom: 0 }}>{ageError}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                type="email"
                className="glass-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                disabled={loading}
                autoComplete="email"
                style={inputStyle(emailError)}
              />
              {emailError && <p style={{ color: 'var(--error)', fontSize: 11, marginTop: 4, marginBottom: 0 }}>{emailError}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="form-label" htmlFor="reg-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input"
                  placeholder="6–12 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  disabled={loading}
                  autoComplete="new-password"
                  style={{ ...inputStyle(passwordError), paddingRight: 44 }}
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <p style={{ color: 'var(--error)', fontSize: 11, marginTop: 4, marginBottom: 0 }}>{passwordError}</p>}
            </div>

            {/* Account Type */}
            <div>
              <label className="form-label">Account Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['buyer', 'seller'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setUserType(type)}
                    disabled={loading}
                    style={{
                      padding: '12px 16px',
                      background: userType === type ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${userType === type ? 'rgba(99,102,241,0.5)' : 'var(--glass-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      color: userType === type ? 'var(--accent-tertiary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{type === 'buyer' ? '🛒' : '🏪'}</span>
                    <span style={{ textTransform: 'capitalize' }}>{type}</span>
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>
                      {type === 'buyer' ? 'Order items' : 'Sell items'}
                    </span>
                  </button>
                ))}
              </div>
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
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              Already have an account?{' '}
              <button
                onClick={() => onToggleView('login')}
                disabled={loading}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--accent-secondary)', fontWeight: 600, fontSize: 13, padding: 0
                }}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

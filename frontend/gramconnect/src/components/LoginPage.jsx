import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, User, Cpu, UserCheck, CheckCircle, Mail, Lock, Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { GramConnectIcon } from './GramConnectLogo';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getRedirectDestination } from '../utils/authNavigation';
import './LoginPage.css';

const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT', error);
    return null;
  }
};

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { fetchProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Toast notifier helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3s
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  // Close language switcher dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Audit Google Client ID configuration on mount
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log('[DEV] Auditing Google Client ID configuration...');
    if (!clientId) {
      console.error('[DEV] Google Authentication Error: VITE_GOOGLE_CLIENT_ID environment variable is missing or empty.');
    } else if (clientId.includes('mock') || clientId.includes('placeholder') || clientId === 'your_google_client_id_here') {
      console.warn(`[DEV] Google Authentication Warning: You are using a mock/placeholder Client ID ("${clientId}"). Google Sign-In will fail with Error 401: invalid_client.`);
    } else {
      console.log(`[DEV] Google Client ID loaded: "${clientId}"`);
    }
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangDropdownOpen(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      const profile = await fetchProfile();
      setIsLoading(false);
      showToast('Login Successful!', 'success');
      setTimeout(() => {
        const isAdmin = profile && profile.role && (profile.role.toLowerCase() === 'admin');
        window.location.replace(isAdmin ? '/admin/dashboard' : '/dashboard');
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      const errorMsg = err.message || 'Invalid email or password';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const { credential } = credentialResponse;
    if (!credential) {
      console.error('[DEV] Google Authentication Success Callback fired, but no ID token (credential) was returned.');
      return;
    }

    console.log('[DEV] Google login popup completed successfully.');
    console.log('[DEV] ID Token (Credential) obtained. Decoding profile details...');

    const profile = decodeJwt(credential);
    if (profile) {
      console.log('[DEV] Google Profile Decoded successfully:', {
        googleId: profile.sub,
        email: profile.email,
        fullName: profile.name,
        profilePicture: profile.picture
      });
    } else {
      console.warn('[DEV] Warning: Could not decode Google ID Token locally. Sending raw token to backend.');
    }

    setIsLoading(true);
    setError('');

    try {
      showToast('Authenticating with Google...', 'success');
      console.log('[DEV] Sending Google ID token to backend for verification...');

      // Send the token to the backend using axios client
      const response = await api.post('/auth/google', { token: credential });

      console.log('[DEV] Backend authenticated successfully. Storing session JWT and redirecting...');
      localStorage.setItem('token', response.data.token);
      const profile = await fetchProfile();
      setIsLoading(false);
      showToast('Login Successful!', 'success');
      setTimeout(() => {
        const isAdmin = profile && profile.role && (profile.role.toLowerCase() === 'admin');
        window.location.replace(isAdmin ? '/admin/dashboard' : '/dashboard');
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      const errorMsg = err.message || 'Google authentication failed';
      console.error('[DEV] Backend Google Authentication Request Failed:', err);
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleGoogleError = (error) => {
    setIsLoading(false);
    console.error('[DEV] Google Sign-In failed or was cancelled.', error);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    let message = 'Google login failed.';

    if (!clientId) {
      message = 'Google Auth Error: VITE_GOOGLE_CLIENT_ID environment variable is not loaded. Verify your .env file.';
    } else if (clientId.includes('mock') || clientId.includes('placeholder') || clientId === 'your_google_client_id_here') {
      message = 'Google Auth Error: You are using a mock/placeholder Client ID. Replace with a valid Google Client ID in .env.';
    } else if (!/^[0-9]+-[a-zA-Z0-9_]+\.apps\.googleusercontent\.com$/.test(clientId)) {
      message = 'Google Auth Error: Client ID format is invalid. It should end with .apps.googleusercontent.com.';
    } else {
      message = 'Google Auth Error: Authentication failed. Verify client ID, Authorized Origins, and Consent Screen settings in Google Cloud Console.';
    }

    setError(message);
    showToast(message, 'error');

    // Print detailed developer diagnostic checklist to console
    console.group('--- Google Authentication Diagnostics ---');
    console.error('Status: FAILED / CANCELLED');
    console.error(`Client ID Detected: "${clientId}"`);
    console.error(`1. Environment Variable Loaded: ${clientId ? '✔ YES' : '❌ NO (Check .env file)'}`);
    console.error(`2. ID Type Check: ${clientId && !clientId.includes('mock') && !clientId.includes('placeholder') ? '✔ VALID' : '❌ INVALID/MOCK (Must be replaced with a real Google Web Client ID)'}`);
    console.error(`3. Format Check: ${clientId && /^[0-9]+-[a-zA-Z0-9_]+\.apps\.googleusercontent\.com$/.test(clientId) ? '✔ OK' : '❌ INVALID FORMAT (Should match *.apps.googleusercontent.com)'}`);
    console.error('4. Authorized JavaScript Origins: Must contain http://localhost:5173 and http://127.0.0.1:5173');
    console.error('5. Authorized Redirect URIs: Must be set if code exchange flow is used.');
    console.error('6. OAuth Client Type: Must be "Web Application" in Google Cloud Console.');
    console.error('-----------------------------------------');
    console.groupEnd();
  };

  return (
    <div className="login-page-wrapper">
      {/* Dynamic Toast Alerts Container */}
      <div className="toasts-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
            {toast.type === 'error' ? <Sparkles size={16} color="#ef4444" /> : <CheckCircle size={16} color="#22c55e" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
      {/* Header with Navigation and Language Swapper */}
      <header className="login-header-nav">
        <a href="#home" className="brand-section login-header-logo">
          <div className="brand-logo">
            <GramConnectIcon className="logo-icon" />
            <span className="text-gradient-green">Gram</span>
            <span className="text-gradient-blue">Connect</span>
          </div>
        </a>

        <div className="nav-actions">
          {/* Language Switcher */}
          <div className="lang-switcher-wrapper" ref={dropdownRef}>
            <button
              className="lang-dropdown-btn"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              aria-label="Change Language"
            >
              <Globe size={16} className="lang-icon" />
              <span>Language</span>
              <ChevronDown size={12} style={{ transform: langDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'var(--transition-fast)' }} />
            </button>
            <div className={`lang-dropdown-menu ${langDropdownOpen ? 'open' : ''}`}>
              <button
                onClick={() => changeLanguage('en')}
                className={`lang-option ${i18n.language === 'en' ? 'active' : ''}`}
              >
                English
              </button>
              <button
                onClick={() => changeLanguage('ml')}
                className={`lang-option ${i18n.language === 'ml' ? 'active' : ''}`}
              >
                മലയാളം
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Left Column: Scenic Civic Illustration */}
      <div className="login-left-col">
        <div className="login-illustration-container">
          <div className="login-illustration-card">
            {/* SVG Background scenery */}
            <svg
              viewBox="0 0 500 500"
              className="login-scenery-bg"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Sky Gradient */}
                <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#eff6ff" />
                  <stop offset="50%" stopColor="#fef08a" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
                {/* Hills Gradient */}
                <linearGradient id="hillGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#15803d" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="hillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#15803d" stopOpacity="0.6" />
                </linearGradient>
                {/* Phone Gradient */}
                <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1f2937" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>
              </defs>

              {/* Sky */}
              <rect x="-3000" y="0" width="6000" height="500" fill="url(#skyGrad)" />

              {/* Sun */}
              <circle cx="250" cy="180" r="50" fill="#fef08a" opacity="0.6" />

              {/* Distant Hills */}
              <path d="M -3000 1000 L -3000 380 Q -2880 320 -2750 360 T -2500 340 T -2250 360 T -2000 340 T -1750 360 T -1500 340 T -1250 360 T -1000 340 T -750 360 T -500 340 T -250 360 T 0 380 Q 120 320 250 360 T 500 340 T 750 360 T 1000 340 T 1250 360 T 1500 340 T 1750 360 T 2000 340 T 2250 360 T 2500 340 T 2750 360 T 3000 340 L 3000 1000 Z" fill="url(#hillGrad1)" />
              <path d="M -3000 1000 L -3000 410 Q -2820 370 -2670 400 T -2500 380 T -2000 410 Q -1820 370 -1670 400 T -1500 380 T -1000 410 Q -820 370 -670 400 T -500 380 T 0 410 Q 180 370 330 400 T 500 380 T 1000 410 Q 1180 370 1330 400 T 1500 380 T 2000 410 Q 2180 370 2330 400 T 2500 380 T 3000 410 L 3000 1000 Z" fill="url(#hillGrad2)" />

              {/* Traditional Kerala Roof House (Left) */}
              <g transform="translate(40, 370)">
                <rect x="0" y="30" width="60" height="40" fill="#f8fafc" rx="4" />
                <rect x="15" y="45" width="12" height="25" fill="#475569" />
                <circle cx="45" cy="45" r="5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                <polygon points="-10,30 30,0 70,30" fill="#ea580c" />
                <line x1="-5" y1="26" x2="65" y2="26" stroke="#c2410c" strokeWidth="2" />
              </g>

              {/* Coconut Trees (Left side) */}
              <g transform="translate(120, 330)" stroke="#78350f" strokeWidth="3" fill="none">
                <path d="M 10 70 Q 0 35 15 0" />
                <g transform="translate(15, 0)" fill="#16a34a" stroke="none">
                  <path d="M 0 0 Q -20 -15 -35 -5 C -25 5 -10 5 0 0 Z" />
                  <path d="M 0 0 Q -25 5 -40 20 C -25 25 -10 15 0 0 Z" />
                  <path d="M 0 0 Q 20 -15 35 -5 C 25 5 10 5 0 0 Z" />
                  <path d="M 0 0 Q 25 5 40 20 C 25 25 10 15 0 0 Z" />
                  <path d="M 0 0 Q 0 -30 10 -40 C 5 -25 5 -10 0 0 Z" />
                </g>
              </g>

              {/* Traditional Kerala Roof House (Right) */}
              <g transform="translate(390, 390)">
                <rect x="0" y="20" width="50" height="30" fill="#f8fafc" rx="3" />
                <rect x="18" y="30" width="14" height="20" fill="#475569" />
                <polygon points="-5,20 25,0 55,20" fill="#ea580c" />
              </g>

              {/* Coconut Tree (Right side) */}
              <g transform="translate(370, 340)" stroke="#78350f" strokeWidth="3.5" fill="none">
                <path d="M 10 70 Q 20 35 5 0" />
                <g transform="translate(5, 0)" fill="#15803d" stroke="none">
                  <path d="M 0 0 Q -20 -15 -30 -2 C -20 8 -10 5 0 0 Z" />
                  <path d="M 0 0 Q 20 -15 30 -2 C 20 8 10 5 0 0 Z" />
                  <path d="M 0 0 Q -15 15 -25 30 C -10 25 0 15 0 0 Z" />
                  <path d="M 0 0 Q 15 15 25 30 C 10 25 0 15 0 0 Z" />
                </g>
              </g>

              {/* Curved Dotted Flow Arrows */}
              <path d="M 120 120 Q 250 80 380 120" fill="none" stroke="#16a34a" strokeWidth="2.5" className="dotted-connector" />
              <path d="M 380 160 Q 450 250 380 340" fill="none" stroke="#2563eb" strokeWidth="2.5" className="dotted-connector" />
              <path d="M 380 380 Q 250 420 120 380" fill="none" stroke="#16a34a" strokeWidth="2.5" className="dotted-connector" />
              <path d="M 120 340 Q 50 250 120 160" fill="none" stroke="#2563eb" strokeWidth="2.5" className="dotted-connector" />

              {/* Central Phone Body */}
              <g className="illus-phone" transform="translate(200, 160)">
                <rect x="-5" y="5" width="110" height="200" rx="20" fill="rgba(0,0,0,0.06)" />
                <rect x="0" y="0" width="100" height="190" rx="18" fill="url(#phoneGrad)" stroke="#374151" strokeWidth="3" />
                <rect x="5" y="5" width="90" height="180" rx="14" fill="#ffffff" />
                <path d="M 30 5 L 70 5 Q 65 14 50 14 Q 35 14 30 5" fill="url(#phoneGrad)" />
                <rect x="12" y="25" width="76" height="30" rx="6" fill="rgba(22, 163, 74, 0.1)" />
                <circle cx="24" cy="40" r="8" fill="#16a34a" opacity="0.8" />
                <path d="M 21 40 L 23 42 L 27 38" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <rect x="38" y="32" width="42" height="6" rx="3" fill="#16a34a" opacity="0.6" />
                <rect x="38" y="42" width="28" height="4" rx="2" fill="#94a3b8" />
                <rect x="12" y="65" width="76" height="70" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                <circle cx="50" cy="100" r="22" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4 2" />
                <circle cx="50" cy="100" r="14" fill="none" stroke="#16a34a" strokeWidth="1.5" />
                <path d="M 45 100 L 49 104 L 56 96" fill="none" stroke="#16a34a" strokeWidth="2" />
                <rect x="12" y="145" width="76" height="30" rx="6" fill="url(#phoneGrad)" />
                <text x="50" y="164" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-sans)">AI CONFIRMED</text>
              </g>
            </svg>

            {/* Floating absolute glass cards */}
            {/* Citizen Node */}
            <div
              className="glass-card login-node-card-1 node-glow-green"
              style={{
                position: 'absolute',
                top: '40px',
                left: '20px',
                width: '100px',
                padding: '10px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                zIndex: 3
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} />
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dark)' }}>{t('hero.citizen')}</span>
            </div>

            {/* AI Analysis Node */}
            <div
              className="glass-card login-node-card-2 node-glow-blue"
              style={{
                position: 'absolute',
                top: '40px',
                right: '20px',
                width: '110px',
                padding: '10px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                zIndex: 3
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--secondary-light)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={16} />
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dark)', textAlign: 'center' }}>{t('hero.ai_analysis')}</span>
            </div>

            {/* Department Officer Node */}
            <div
              className="glass-card login-node-card-3 node-glow-green"
              style={{
                position: 'absolute',
                bottom: '80px',
                right: '20px',
                width: '120px',
                padding: '10px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                zIndex: 3
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={16} />
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dark)', textAlign: 'center' }}>{t('hero.officer')}</span>
            </div>

            {/* Issue Resolved Node */}
            <div
              className="glass-card login-node-card-4 node-glow-blue"
              style={{
                position: 'absolute',
                bottom: '80px',
                left: '20px',
                width: '110px',
                padding: '10px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                zIndex: 3
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--secondary-light)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={16} />
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dark)' }}>{t('hero.resolved')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Login Card */}
      <div className="login-right-col">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-welcome-tag">
              <Sparkles size={11} style={{ marginRight: '4px' }} />
              {t('login.welcome_back')}
            </div>
            <h2 className="login-title">{t('login.sign_in')}</h2>
            <p className="login-subtitle">{t('login.subheading')}</p>
            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center', marginTop: '10px' }}>
                {error}
              </div>
            )}
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            {/* Email Address */}
            <div className="input-field-group">
              <label className="input-label" htmlFor="email">
                {t('login.email')}
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon-left" />
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="name@example.com"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="input-field-group">
              <label className="input-label" htmlFor="password">
                {t('login.password')}
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  placeholder="••••••••"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Form Options (Remember Me / Forgot Password) */}
            <div className="form-options-row">
              <label className="remember-me-label">
                <input type="checkbox" className="remember-me-checkbox" />
                <span>{t('login.remember_me')}</span>
              </label>
              <a href="#forgot-password" className="forgot-password-link">
                {t('login.forgot_password')}
              </a>
            </div>

            {/* Primary Submit Button */}
            <button type="submit" className="btn-login-submit" disabled={isLoading}>
              {isLoading ? (
                <span className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite' }} />
              ) : (
                <>
                  <LogIn size={18} />
                  <span>{t('login.login_btn')}</span>
                </>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="login-divider-container">
            {t('login.or')}
          </div>

          {/* Social login Google */}
          <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <button type="button" className="btn-social-login" style={{ width: '100%' }}>
              <svg className="google-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>{t('login.google_btn')}</span>
            </button>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.01, overflow: 'hidden', zIndex: 10 }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                type="standard"
                theme="outline"
                size="large"
                shape="rectangular"
                width="400"
              />
            </div>
          </div>

          {/* Create new account section */}
          <div className="login-footer-register">
            <span>Don't have an account?</span>
            <button type="button" className="register-link-btn" onClick={() => (window.location.hash = '#register')}>
              {t('login.create_account')}
            </button>
          </div>

          {/* Footer copyright */}
          <div className="login-footer-copyright">
            {t('login.copyright')}
          </div>
        </div>
      </div>
    </div>
  );
}

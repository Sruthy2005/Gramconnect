import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Mail, ArrowLeft, Send, CheckCircle2, ShieldAlert, LifeBuoy, RotateCcw, Shield, Cpu, Lock, Key, Eye, EyeOff, Check, X, AlertTriangle } from 'lucide-react';
import { GramConnectIcon } from './GramConnectLogo';
import api from '../utils/api';
import './ForgotPasswordPage.css'; // Reuse ForgotPassword splitscreen layout styles!
import './ResetPasswordPage.css';   // Additional reset page specific overrides

export default function ResetPasswordPage({ token }) {
  const { t, i18n } = useTranslation();
  
  // Reset Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangDropdownOpen(false);
  };

  // Toast notifier helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3s
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  // Password strength checklist validators
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  const isPasswordStrong = hasMinLength && hasLetter && hasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPasswordStrong) {
      showToast('Please satisfy all password strength requirements.', 'error');
      return;
    }

    if (!passwordsMatch) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setIsLoading(false);
      setIsSubmitted(true);
      showToast('Password reset successfully!');
    } catch (err) {
      setIsLoading(false);
      showToast(err.message || 'Error occurred while resetting password', 'error');
    }
  };

  return (
    <div className="forgot-page-wrapper">
      {/* Dynamic Toast Alerts Container */}
      <div className="toasts-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
            {toast.type === 'error' ? <ShieldAlert size={16} color="#ef4444" /> : <CheckCircle2 size={16} color="#22c55e" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header with Navigation and Language Swapper */}
      <header className="forgot-header-nav">
        <a href="#home" className="brand-section forgot-header-logo">
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

      {/* Left Column: Scenic Security themed Illustration */}
      <div className="forgot-left-col">
        <div className="forgot-illustration-container">
          <div className="forgot-illustration-card">
            {/* SVG Background scenery */}
            <svg viewBox="0 0 500 500" className="forgot-scenery-bg" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#eff6ff" />
                  <stop offset="50%" stopColor="#fef08a" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
                <linearGradient id="hillGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#15803d" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="hillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#15803d" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1f2937" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>
              </defs>

              <rect x="-3000" y="0" width="6000" height="500" fill="url(#skyGrad)" />
              <circle cx="250" cy="180" r="50" fill="#fef08a" opacity="0.6" />

              <path d="M -3000 1000 L -3000 380 Q -2880 320 -2750 360 T -2500 340 T -2250 360 T -2000 340 T -1750 360 T -1500 340 T -1250 360 T -1000 340 T -750 360 T -500 340 T -250 360 T 0 380 Q 120 320 250 360 T 500 340 T 750 360 T 1000 340 T 1250 360 T 1500 340 T 1750 360 T 2000 340 T 2250 360 T 2500 340 T 2750 360 T 3000 340 L 3000 1000 Z" fill="url(#hillGrad1)" />
              <path d="M -3000 1000 L -3000 410 Q -2820 370 -2670 400 T -2500 380 T -2000 410 Q -1820 370 -1670 400 T -1500 380 T -1000 410 Q -820 370 -670 400 T -500 380 T 0 410 Q 180 370 330 400 T 500 380 T 1000 410 Q 1180 370 1330 400 T 1500 380 T 2000 410 Q 2180 370 2330 400 T 2500 380 T 3000 410 L 3000 1000 Z" fill="url(#hillGrad2)" />

              <g transform="translate(40, 370)">
                <rect x="0" y="30" width="60" height="40" fill="#f8fafc" rx="4" />
                <rect x="15" y="45" width="12" height="25" fill="#475569" />
                <circle cx="45" cy="45" r="5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                <polygon points="-10,30 30,0 70,30" fill="#ea580c" />
                <line x1="-5" y1="26" x2="65" y2="26" stroke="#c2410c" strokeWidth="2" />
              </g>

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

              <g transform="translate(390, 390)">
                <rect x="0" y="20" width="50" height="30" fill="#f8fafc" rx="3" />
                <rect x="18" y="30" width="14" height="20" fill="#475569" />
                <polygon points="-5,20 25,0 55,20" fill="#ea580c" />
              </g>

              <path d="M 120 120 Q 250 80 380 120" fill="none" stroke="#16a34a" strokeWidth="2.5" className="dotted-connector" />
              <path d="M 380 160 Q 450 250 380 340" fill="none" stroke="#2563eb" strokeWidth="2.5" className="dotted-connector" />
              <path d="M 380 380 Q 250 420 120 380" fill="none" stroke="#16a34a" strokeWidth="2.5" className="dotted-connector" />
              <path d="M 120 340 Q 50 250 120 160" fill="none" stroke="#2563eb" strokeWidth="2.5" className="dotted-connector" />

              <g className="illus-phone" transform="translate(200, 160)">
                <rect x="-5" y="5" width="110" height="200" rx="20" fill="rgba(0,0,0,0.06)" />
                <rect x="0" y="0" width="100" height="190" rx="18" fill="url(#phoneGrad)" stroke="#374151" strokeWidth="3" />
                <rect x="5" y="5" width="90" height="180" rx="14" fill="#ffffff" />
                <path d="M 30 5 L 70 5 Q 65 14 50 14 Q 35 14 30 5" fill="url(#phoneGrad)" />
                
                <rect x="12" y="25" width="76" height="30" rx="6" fill="rgba(37, 99, 237, 0.1)" />
                <circle cx="24" cy="40" r="8" fill="#2563eb" opacity="0.8" />
                <path d="M 24 35 L 24 45 M 20 40 L 28 40" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <rect x="38" y="32" width="42" height="6" rx="3" fill="#2563eb" opacity="0.6" />
                <rect x="38" y="42" width="28" height="4" rx="2" fill="#94a3b8" />
                
                <g transform="translate(50, 100)" fill="none" strokeWidth="2">
                  <path d="M -12 -5 V -14 C -12 -22 12 -22 12 -14 V -5" stroke="#2563eb" strokeWidth="3" />
                  <rect x="-18" y="-5" width="36" height="28" rx="6" fill="#16a34a" stroke="#15803d" strokeWidth="1.5" />
                  <circle cx="0" cy="5" r="4" fill="#ffffff" />
                  <path d="M 0 9 V 15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                </g>

                <rect x="12" y="145" width="76" height="30" rx="6" fill="url(#phoneGrad)" />
                <text x="50" y="164" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-sans)">SECURE RESET</text>
              </g>
            </svg>

            <div className="glass-card forgot-node-card-1 node-glow-green" style={{ position: 'absolute', top: '40px', left: '20px', width: '110px', padding: '10px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 3 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={16} />
              </div>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-dark)', textAlign: 'center' }}>Identity Guard</span>
            </div>

            <div className="glass-card forgot-node-card-2 node-glow-blue" style={{ position: 'absolute', top: '40px', right: '20px', width: '110px', padding: '10px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 3 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--secondary-light)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={16} />
              </div>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-dark)', textAlign: 'center' }}>Token Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Reset Password Card */}
      <div className="forgot-right-col">
        <div className="forgot-card">
          {!isSubmitted ? (
            <>
              <div className="forgot-card-header">
                <div className="forgot-welcome-tag">
                  <Key size={11} style={{ marginRight: '4px' }} />
                  Secure Password Reset
                </div>
                <h2 className="forgot-title">Reset Your Password</h2>
                <p className="forgot-subtitle">Please select a strong password to recover your account.</p>
              </div>

              <form className="forgot-form" onSubmit={handleSubmit} noValidate>
                {/* New Password */}
                <div className="input-field-group">
                  <label className="input-label" htmlFor="password">New Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon-left" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      required
                      placeholder="••••••••"
                      className="forgot-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-eye-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{ position: 'absolute', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="input-field-group">
                  <label className="input-label" htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon-left" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      required
                      placeholder="••••••••"
                      className="forgot-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-eye-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      style={{ position: 'absolute', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Checklist */}
                <div className="password-checklist-card">
                  <span className="checklist-heading">Password Security Checklist:</span>
                  <div className="checklist-grid">
                    <div className={`checklist-item ${hasMinLength ? 'success' : ''}`}>
                      {hasMinLength ? <Check size={12} /> : <X size={12} />}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`checklist-item ${hasLetter ? 'success' : ''}`}>
                      {hasLetter ? <Check size={12} /> : <X size={12} />}
                      <span>Contains letters</span>
                    </div>
                    <div className={`checklist-item ${hasNumber ? 'success' : ''}`}>
                      {hasNumber ? <Check size={12} /> : <X size={12} />}
                      <span>Contains numbers</span>
                    </div>
                    <div className={`checklist-item ${passwordsMatch ? 'success' : ''}`}>
                      {passwordsMatch ? <Check size={12} /> : <X size={12} />}
                      <span>Passwords match</span>
                    </div>
                  </div>
                </div>

                {/* Primary Submit Button */}
                <button type="submit" className="btn-forgot-submit" disabled={isLoading || !isPasswordStrong || !passwordsMatch}>
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite' }} />
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Reset Password</span>
                    </>
                  )}
                </button>
              </form>

              {/* Back to Login link */}
              <div className="forgot-footer-login" style={{ marginTop: '24px' }}>
                <button type="button" className="back-login-btn" onClick={() => (window.location.hash = '#login')}>
                  <ArrowLeft size={14} />
                  <span>Back to Login</span>
                </button>
              </div>
            </>
          ) : (
            /* Success View State */
            <>
              <div className="forgot-success-icon-box" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <CheckCircle2 size={32} />
              </div>
              <h2 className="forgot-success-title">Password Reset Complete!</h2>
              <p className="forgot-success-desc" style={{ marginBottom: '32px' }}>
                Your account password has been updated securely. You can now use your new password to access your dashboard.
              </p>

              <button type="button" className="btn-forgot-submit" style={{ gap: '6px' }} onClick={() => (window.location.hash = '#login')}>
                <ArrowLeft size={16} />
                <span>Go to Login</span>
              </button>
            </>
          )}

          {/* Footer copyright */}
          <div className="forgot-footer-copyright">
            {t('login.copyright')}
          </div>
        </div>
      </div>
    </div>
  );
}

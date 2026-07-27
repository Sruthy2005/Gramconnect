import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Mail, ArrowLeft, Send, CheckCircle2, ShieldAlert, LifeBuoy, RotateCcw, Shield, Cpu, Lock, Key, AlertTriangle } from 'lucide-react';
import { GramConnectIcon } from './GramConnectLogo';
import api from '../utils/api';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  
  const [step, setStep] = useState('email'); // 'email', 'otp', 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 6-digit OTP input helper states
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  useEffect(() => {
    setOtp(otpValues.join(''));
  }, [otpValues]);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
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

  // Field validation
  const validateEmail = (val) => {
    let errorMsg = '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!val) {
      errorMsg = t('register.validation.required');
    } else if (!emailRegex.test(val)) {
      errorMsg = t('register.validation.email');
    }

    setErrors({ email: errorMsg });
    return errorMsg === '';
  };

  const handleOtpChange = (index, value) => {
    const newVal = value.replace(/\D/g, '');
    if (!newVal) {
      const updated = [...otpValues];
      updated[index] = '';
      setOtpValues(updated);
      return;
    }

    const char = newVal.slice(-1);
    const updated = [...otpValues];
    updated[index] = char;
    setOtpValues(updated);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const updated = [...otpValues];
        updated[index - 1] = '';
        setOtpValues(updated);
        inputRefs.current[index - 1]?.focus();
      } else {
        const updated = [...otpValues];
        updated[index] = '';
        setOtpValues(updated);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const updated = [...otpValues];
      for (let i = 0; i < 6; i++) {
        updated[i] = pastedData[i] || '';
      }
      setOtpValues(updated);

      const targetIndex = Math.min(pastedData.length, 5);
      inputRefs.current[targetIndex]?.focus();
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateEmail(email);
    if (!isValid) {
      showToast(t('register.validation.email'), 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setIsLoading(false);
      showToast(res.data.message || 'OTP sent successfully to your email.');
      setStep('otp');
      setErrors({});
    } catch (err) {
      setIsLoading(false);
      showToast(err.message || 'Error occurred', 'error');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setErrors({ otp: 'Please enter a 6-digit OTP code' });
      showToast('Please enter a 6-digit OTP code', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      setIsLoading(false);
      showToast(res.data.message || 'OTP verified successfully.');
      setStep('reset');
      setErrors({});
    } catch (err) {
      setIsLoading(false);
      showToast(err.message || 'Invalid or expired OTP', 'error');
      setErrors({ otp: err.message || 'Invalid OTP' });
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setIsLoading(false);
      showToast(i18n.language === 'ml' ? 'ഒടിപി വീണ്ടും അയച്ചു!' : 'OTP resent successfully!');
    } catch (err) {
      setIsLoading(false);
      showToast(err.message || 'Error occurred', 'error');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    
    let currentErrors = {};
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (password.length < 8 || !hasLetter || !hasNumber) {
      currentErrors.password = 'Password must be at least 8 characters long and contain both letters and numbers';
    }

    if (password !== confirmPassword) {
      currentErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      showToast('Password validation failed', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, otp, password });
      setIsLoading(false);
      showToast(res.data.message || 'Password reset successful!');
      
      setTimeout(() => {
        window.location.hash = '#login';
      }, 1500);
    } catch (err) {
      setIsLoading(false);
      showToast(err.message || 'Failed to reset password', 'error');
    }
  };

  const handleSupport = () => {
    showToast(i18n.language === 'ml' ? 'സപ്പോർട്ട് ഡെസ്ക് സിമുലേഷൻ സജീവമാക്കി!' : 'Support desk simulation activated!');
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
            <svg 
              viewBox="0 0 500 500" 
              className="forgot-scenery-bg" 
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

              {/* Central Phone Body with Secure Graphic */}
              <g className="illus-phone" transform="translate(200, 160)">
                <rect x="-5" y="5" width="110" height="200" rx="20" fill="rgba(0,0,0,0.06)" />
                <rect x="0" y="0" width="100" height="190" rx="18" fill="url(#phoneGrad)" stroke="#374151" strokeWidth="3" />
                <rect x="5" y="5" width="90" height="180" rx="14" fill="#ffffff" />
                <path d="M 30 5 L 70 5 Q 65 14 50 14 Q 35 14 30 5" fill="url(#phoneGrad)" />
                
                {/* Security Shield Lock Content graphic inside Screen */}
                <rect x="12" y="25" width="76" height="30" rx="6" fill="rgba(37, 99, 237, 0.1)" />
                <circle cx="24" cy="40" r="8" fill="#2563eb" opacity="0.8" />
                <path d="M 24 35 L 24 45 M 20 40 L 28 40" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <rect x="38" y="32" width="42" height="6" rx="3" fill="#2563eb" opacity="0.6" />
                <rect x="38" y="42" width="28" height="4" rx="2" fill="#94a3b8" />
                
                {/* Padlock Illustration */}
                <g transform="translate(50, 100)" fill="none" strokeWidth="2">
                  {/* Shackle */}
                  <path d="M -12 -5 V -14 C -12 -22 12 -22 12 -14 V -5" stroke="#2563eb" strokeWidth="3" />
                  {/* Lock Body */}
                  <rect x="-18" y="-5" width="36" height="28" rx="6" fill="#16a34a" stroke="#15803d" strokeWidth="1.5" />
                  {/* Keyhole */}
                  <circle cx="0" cy="5" r="4" fill="#ffffff" />
                  <path d="M 0 9 V 15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                </g>

                <rect x="12" y="145" width="76" height="30" rx="6" fill="url(#phoneGrad)" />
                <text x="50" y="164" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-sans)">SECURE RESET</text>
              </g>
            </svg>

            {/* Floating absolute glass cards */}
            {/* Secure Verification Node */}
            <div 
              className="glass-card forgot-node-card-1 node-glow-green" 
              style={{
                position: 'absolute',
                top: '40px',
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
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={16} />
              </div>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-dark)', textAlign: 'center' }}>{t('forgot_password.floating_card_1')}</span>
            </div>

            {/* Email Verification Node */}
            <div 
              className="glass-card forgot-node-card-2 node-glow-blue" 
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
                <Mail size={16} />
              </div>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-dark)', textAlign: 'center' }}>{t('forgot_password.floating_card_2')}</span>
            </div>

            {/* AI Security Node */}
            <div 
              className="glass-card forgot-node-card-3 node-glow-green" 
              style={{
                position: 'absolute',
                bottom: '80px',
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
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={16} />
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dark)', textAlign: 'center' }}>{t('forgot_password.floating_card_3')}</span>
            </div>

            {/* Password Reset Node */}
            <div 
              className="glass-card forgot-node-card-4 node-glow-blue" 
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
                <Key size={16} />
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dark)', textAlign: 'center' }}>{t('forgot_password.floating_card_4')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Forgot Password / Success Card */}
      <div className="forgot-right-col">
        <div className="forgot-card">
          {step === 'email' && (
            <>
              <div className="forgot-card-header">
                <div className="forgot-welcome-tag">
                  <Lock size={11} style={{ marginRight: '4px' }} />
                  {t('forgot_password.welcome_tag')}
                </div>
                <h2 className="forgot-title">{t('forgot_password.heading')}</h2>
                <p className="forgot-subtitle">
                  {i18n.language === 'ml' 
                    ? 'രജിസ്റ്റർ ചെയ്ത ഇമെയിൽ വിലാസം നൽകുക, ഞങ്ങൾ ഒരു സുരക്ഷിത ഒടിപി കോഡ് അയയ്ക്കും.' 
                    : "Enter your registered email address and we'll send you a secure 6-digit OTP code."}
                </p>
              </div>

              <form className="forgot-form" onSubmit={handleEmailSubmit} noValidate>
                {/* Email Address */}
                <div className="input-field-group">
                  <label className="input-label" htmlFor="email">
                    {t('forgot_password.email')}
                  </label>
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon-left" />
                    <input
                      type="email"
                      id="email"
                      required
                      placeholder="name@example.com"
                      className={`forgot-input ${errors.email ? 'error-border' : ''}`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) validateEmail(e.target.value);
                      }}
                      onBlur={(e) => validateEmail(e.target.value)}
                    />
                  </div>
                  {errors.email && (
                    <span className="error-message-inline">
                      <AlertTriangle size={12} style={{ flexShrink: 0 }} /> {errors.email}
                    </span>
                  )}
                </div>

                {/* Primary Submit Button */}
                <button type="submit" className="btn-forgot-submit" disabled={isLoading}>
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite' }} />
                  ) : (
                    <>
                      <Send size={15} />
                      <span>{i18n.language === 'ml' ? 'ഒടിപി അയക്കുക' : 'Send Reset OTP'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="forgot-divider-container">
                {t('forgot_password.or')}
              </div>

              {/* Alternative Contact Support */}
              <button type="button" className="forgot-support-btn" onClick={handleSupport}>
                <LifeBuoy size={18} />
                <span>{t('forgot_password.contact_support')}</span>
              </button>

              {/* Back to Login anchor */}
              <div className="forgot-footer-login">
                <button type="button" className="back-login-btn" onClick={() => (window.location.hash = '#login')}>
                  <ArrowLeft size={14} />
                  <span>{t('forgot_password.back_to_login')}</span>
                </button>
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="forgot-card-header">
                <div className="forgot-welcome-tag">
                  <Lock size={11} style={{ marginRight: '4px' }} />
                  {t('forgot_password.welcome_tag')}
                </div>
                <h2 className="forgot-title">{i18n.language === 'ml' ? 'ഒടിപി നൽകുക' : 'Enter Verification OTP'}</h2>
                <p className="forgot-subtitle">
                  {i18n.language === 'ml' 
                    ? `നിങ്ങളുടെ ഇമെയിൽ (${email}) വിലാസത്തിലേക്ക് അയച്ച 6 അക്ക ഒടിപി കോഡ് നൽകുക.` 
                    : `Enter the secure 6-digit OTP code sent to your email address: ${email}`}
                </p>
              </div>

              <form className="forgot-form" onSubmit={handleOtpSubmit} noValidate>
                {/* OTP code field */}
                <div className="input-field-group">
                  <label className="input-label" htmlFor="otp">
                    {i18n.language === 'ml' ? 'ഒടിപി കോഡ്' : 'OTP Verification Code'}
                  </label>
                  <div className="otp-boxes-container" onPaste={handleOtpPaste}>
                    {otpValues.map((val, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="text"
                        maxLength="1"
                        pattern="\d*"
                        inputMode="numeric"
                        className={`otp-digit-box ${errors.otp ? 'error-border' : ''}`}
                        value={val}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      />
                    ))}
                  </div>
                  {errors.otp && (
                    <span className="error-message-inline">
                      <AlertTriangle size={12} style={{ flexShrink: 0 }} /> {errors.otp}
                    </span>
                  )}
                </div>

                {/* Primary Verify Button */}
                <button type="submit" className="btn-forgot-submit" disabled={isLoading}>
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite' }} />
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>{i18n.language === 'ml' ? 'ഒടിപി സ്ഥിരീകരിക്കുക' : 'Verify OTP'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Resend OTP button */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="forgot-support-btn" 
                  style={{ width: '100%', border: '1px solid #cbd5e1', background: '#f1f5f9' }} 
                  onClick={handleResendOtp} 
                  disabled={isLoading}
                >
                  <RotateCcw size={16} />
                  <span>{i18n.language === 'ml' ? 'ഒടിപി വീണ്ടും അയക്കുക' : 'Resend OTP'}</span>
                </button>
              </div>

              {/* Back button */}
              <div className="forgot-footer-login">
                <button type="button" className="back-login-btn" onClick={() => setStep('email')}>
                  <ArrowLeft size={14} />
                  <span>{i18n.language === 'ml' ? 'തിരികെ ഇമെയിൽ നൽകുക' : 'Back to Email Step'}</span>
                </button>
              </div>
            </>
          )}

          {step === 'reset' && (
            <>
              <div className="forgot-card-header">
                <div className="forgot-welcome-tag">
                  <Lock size={11} style={{ marginRight: '4px' }} />
                  {t('forgot_password.welcome_tag')}
                </div>
                <h2 className="forgot-title">{i18n.language === 'ml' ? 'പുതിയ പാസ്‌വേഡ്' : 'Reset Your Password'}</h2>
                <p className="forgot-subtitle">
                  {i18n.language === 'ml' 
                    ? 'അക്ഷരങ്ങളും അക്കങ്ങളും അടങ്ങിയ ശക്തമായ ഒരു പുതിയ പാസ്‌വേഡ് തിരഞ്ഞെടുക്കുക.' 
                    : 'Choose a strong new password containing both letters and numbers (min 8 characters).'}
                </p>
              </div>

              <form className="forgot-form" onSubmit={handleResetSubmit} noValidate>
                {/* New Password */}
                <div className="input-field-group">
                  <label className="input-label" htmlFor="password">
                    {i18n.language === 'ml' ? 'പുതിയ പാസ്‌വേഡ്' : 'New Password'}
                  </label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon-left" />
                    <input
                      type="password"
                      id="password"
                      required
                      placeholder="••••••••"
                      className={`forgot-input ${errors.password ? 'error-border' : ''}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {errors.password && (
                    <span className="error-message-inline">
                      <AlertTriangle size={12} style={{ flexShrink: 0 }} /> {errors.password}
                    </span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="input-field-group">
                  <label className="input-label" htmlFor="confirm-password">
                    {i18n.language === 'ml' ? 'പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക' : 'Confirm Password'}
                  </label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon-left" />
                    <input
                      type="password"
                      id="confirm-password"
                      required
                      placeholder="••••••••"
                      className={`forgot-input ${errors.confirmPassword ? 'error-border' : ''}`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span className="error-message-inline">
                      <AlertTriangle size={12} style={{ flexShrink: 0 }} /> {errors.confirmPassword}
                    </span>
                  )}
                </div>

                {/* Reset submit button */}
                <button type="submit" className="btn-forgot-submit" disabled={isLoading}>
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite' }} />
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>{i18n.language === 'ml' ? 'പാസ്‌വേഡ് മാറ്റുക' : 'Reset Password'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Cancel back to login */}
              <div className="forgot-footer-login">
                <button type="button" className="back-login-btn" onClick={() => (window.location.hash = '#login')}>
                  <ArrowLeft size={14} />
                  <span>{t('forgot_password.back_to_login')}</span>
                </button>
              </div>
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

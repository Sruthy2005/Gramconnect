import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X, ChevronDown, Shield, LogIn, UserPlus } from 'lucide-react';
import { GramConnectIcon } from './GramConnectLogo';
import { useAuth } from '../context/AuthContext';
import { handleAuthNavigation } from '../utils/authNavigation';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  const handleNavItemClick = (e, item) => {
    handleAuthNavigation(item.href, user, e);
    setMobileMenuOpen(false);
  };

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dropdownRef = useRef(null);
  const avatarDropdownRef = useRef(null);

  // Close language switcher dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(event.target)) {
        setAvatarDropdownOpen(false);
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

  const currentLanguageLabel = i18n.language === 'ml' ? 'മലയാളം' : 'English';

  const navItems = [
    { key: 'home', href: '#home' },
    { key: 'report', href: '#report-category' },
    { key: 'track', href: '#live-map' },
    { key: 'hub', href: '#why-us' },
    { key: 'lost', href: '#lost-found' },
    { key: 'announcements', href: '#announcements' },
    { key: 'about', href: '#about' },
    { key: 'contact', href: '#footer' }
  ];

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* Branding Logo */}
        <a href="#home" className="brand-section">
          <div className="brand-logo">
            <GramConnectIcon className="logo-icon" />
            <span className="text-gradient-green">Gram</span>
            <span className="text-gradient-blue">Connect</span>
          </div>
          <span className="brand-tagline">{t('nav.tagline')}</span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.key}>
                <a
                  href={item.href}
                  className="nav-item-link"
                  onClick={(e) => handleNavItemClick(e, item)}
                >
                  {t(`nav.${item.key}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Action Controls & Language Switcher */}
        <div className="nav-actions">
          {/* Custom Language Dropdown */}
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

          {user ? (
            /* User profile section in navbar */
            <div className="user-profile-nav" ref={avatarDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                className="lang-dropdown-btn navbar-avatar-btn"
                style={{ gap: '8px', padding: '4px 8px', borderRadius: '12px', border: '1px solid rgba(229, 231, 235, 0.8)', background: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.fullName}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e 0%, #2563eb 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {(user.fullName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                  {user.fullName ? user.fullName.split(' ')[0] : 'User'}
                </span>
                <ChevronDown size={11} style={{ transform: avatarDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'var(--transition-fast)' }} />
              </button>

              {avatarDropdownOpen && (
                <div
                  className="lang-dropdown-menu open"
                  style={{ top: '42px', right: 0, width: '160px', display: 'flex', flexDirection: 'column', zIndex: 1000 }}
                >
                  <a
                    href="#dashboard"
                    className="lang-option"
                    style={{ padding: '10px 16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937', fontWeight: 600, fontSize: '0.82rem' }}
                    onClick={() => setAvatarDropdownOpen(false)}
                  >
                    Dashboard
                  </a>
                  <a
                    href="#dashboard/profile"
                    className="lang-option"
                    style={{ padding: '10px 16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937', fontWeight: 600, fontSize: '0.82rem' }}
                    onClick={() => setAvatarDropdownOpen(false)}
                  >
                    Profile
                  </a>
                  <hr style={{ margin: '4px 0', border: 0, borderTop: '1px solid #edf2f7' }} />
                  <button
                    onClick={() => { logout(); setAvatarDropdownOpen(false); }}
                    className="lang-option"
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 700, fontSize: '0.82rem', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Authentication CTA */
            <a href="#login" className="btn-login-nav">
              <LogIn size={15} />
              <span>{t('nav.login')}</span>
            </a>
          )}
        </div>

        {/* Mobile Nav Toggle */}
        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Mobile Menu"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <nav>
          <ul className="mobile-nav-links">
            {navItems.map((item) => (
              <li key={item.key}>
                <a
                  href={item.href}
                  className="mobile-nav-item-link"
                  onClick={(e) => handleNavItemClick(e, item)}
                >
                  {t(`nav.${item.key}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mobile-actions-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Language / ഭാഷ:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => changeLanguage('en')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  background: i18n.language === 'en' ? 'var(--primary-light)' : 'transparent',
                  color: i18n.language === 'en' ? 'var(--primary)' : 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                English
              </button>
              <button
                onClick={() => changeLanguage('ml')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  background: i18n.language === 'ml' ? 'var(--primary-light)' : 'transparent',
                  color: i18n.language === 'ml' ? 'var(--primary)' : 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                മലയാളം
              </button>
            </div>
          </div>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '14px', background: 'rgba(255,255,255,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.fullName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e 0%, #2563eb 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {(user.fullName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)' }}>{user.fullName}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user.role}</span>
                </div>
              </div>
              <a
                href="#dashboard"
                className="mobile-nav-item-link"
                style={{ fontSize: '0.82rem', fontWeight: 600, padding: '8px 0' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </a>
              <a
                href="#dashboard/profile"
                className="mobile-nav-item-link"
                style={{ fontSize: '0.82rem', fontWeight: 600, padding: '8px 0' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </a>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                style={{ background: '#fee2e2', border: 'none', color: '#ef4444', fontWeight: 700, fontSize: '0.82rem', padding: '10px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <a
              href="#login"
              className="btn-login-nav"
              style={{ justifyContent: 'center', height: '44px' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <LogIn size={15} />
              <span>{t('nav.login')}</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

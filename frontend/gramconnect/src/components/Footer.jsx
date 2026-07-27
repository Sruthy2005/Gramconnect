import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { GramConnectIcon } from './GramConnectLogo';

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const LinkedinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isMl = i18n.language === 'ml';

  const quickLinks = [
    { key: 'home', href: '#home' },
    { key: 'report', href: '#report-category' },
    { key: 'track', href: '#live-map' },
    { key: 'hub', href: '#why-us' }
  ];

  const secondaryLinks = [
    { key: 'lost', href: '#lost-found' },
    { key: 'announcements', href: '#announcements' },
    { key: 'about', href: '#about' },
    { key: 'contact', href: '#footer' }
  ];

  return (
    <footer id="footer">
      {/* Top Footer Widget Section */}
      <div className="footer-top">
        <div className="container footer-grid">
          {/* Brand Col */}
          <div className="footer-brand">
            <div className="footer-brand-logo">
              <GramConnectIcon size={26} className="logo-icon" />
              <span className="text-gradient-green">Gram</span>
              <span className="text-gradient-blue">Connect</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
              {t('footer.tagline')}
            </span>
            <p className="footer-brand-desc">
              {t('footer.desc')}
            </p>
            <div className="footer-socials">
              <a href="#" className="social-icon-btn" aria-label="Facebook"><FacebookIcon /></a>
              <a href="#" className="social-icon-btn" aria-label="Twitter"><TwitterIcon /></a>
              <a href="#" className="social-icon-btn" aria-label="Instagram"><InstagramIcon /></a>
              <a href="#" className="social-icon-btn" aria-label="LinkedIn"><LinkedinIcon /></a>
            </div>
          </div>

          {/* Quick Links Col */}
          <div className="footer-column">
            <h4 className="footer-title">{isMl ? 'ദ്രുത ലിങ്കുകൾ' : 'Quick Links'}</h4>
            <ul className="footer-links">
              {quickLinks.map((link) => (
                <li key={link.key} className="footer-link-item">
                  <a href={link.href}>{t(`nav.${link.key}`)}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Secondary Links Col */}
          <div className="footer-column">
            <h4 className="footer-title">{isMl ? 'മറ്റു പേജുകൾ' : 'Resources'}</h4>
            <ul className="footer-links">
              {secondaryLinks.map((link) => (
                <li key={link.key} className="footer-link-item">
                  <a href={link.href}>{t(`nav.${link.key}`)}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Col */}
          <div className="footer-column">
            <h4 className="footer-title">{isMl ? 'ബന്ധപ്പെടുക' : 'Contact Us'}</h4>
            <ul className="footer-contact-details">
              <li className="footer-contact-item">
                <MapPin size={18} className="footer-contact-icon" />
                <span>
                  {isMl
                    ? 'ഇ-ഗവേണൻസ് സെൽ, ഐടി മിഷൻ ഡയറക്ടറേറ്റ്, തിരുവനന്തപുരം, കേരളം - 695033'
                    : 'E-Governance Cell, State IT Mission Directorate, Trivandrum, Kerala - 695033'}
                </span>
              </li>
              <li className="footer-contact-item">
                <Mail size={18} className="footer-contact-icon" />
                <a href="mailto:support@gramconnect.gov.in">support@gramconnect.gov.in</a>
              </li>
              <li className="footer-contact-item">
                <Phone size={18} className="footer-contact-icon" />
                <a href="tel:+914712345678">+91 471 234 5678</a>
              </li>
            </ul>

            {/* Newsletter widget */}
            <div className="footer-newsletter" style={{ marginTop: '16px' }}>
              <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                {isMl ? 'അറിയിപ്പുകൾ സബ്‌സ്‌ക്രൈബ് ചെയ്യുക' : 'Subscribe to Alerts'}
              </h5>
              <div className="footer-input-group">
                <input type="email" placeholder="email@domain.com" />
                <button aria-label="Subscribe"><ArrowRight size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Section */}
      <div className="footer-bottom">
        <div className="container footer-bottom-container">
          <p className="footer-copyright">
            {t('footer.copyright')}
          </p>
          <ul className="footer-legal-links">
            <li className="footer-legal-item">
              <a href="#">{isMl ? 'സ്വകാര്യതാനയം' : 'Privacy Policy'}</a>
            </li>
            <li className="footer-legal-item">
              <a href="#">{isMl ? 'ഉപയോഗനിബന്ധനകൾ' : 'Terms of Use'}</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, AlertTriangle, Search, Cpu, MapPin, Activity, TrendingUp, User, UserCheck, CheckCircle } from 'lucide-react';

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="hero-section" id="home">
      <div className="container hero-grid">
        {/* Left Content */}
        <div className="hero-left">
          <div className="ai-badge">
            <Sparkles size={14} className="ai-badge-icon" />
            <span>{t('hero.badge')}</span>
          </div>

          <h1 className="hero-title">
            <span className="text-gradient-green">{t('hero.title_part1')}</span>
            <span>{t('hero.title_part2')}</span>
            <span className="text-gradient-blue">{t('hero.title_part3')}</span>
          </h1>

          <p className="hero-desc">
            {t('hero.desc')}
          </p>

          <div className="hero-ctas">
            <a href="#report-category" className="btn btn-primary">
              <AlertTriangle size={18} />
              <span>{t('hero.btn_report')}</span>
            </a>
            <a href="#live-map" className="btn btn-secondary">
              <Search size={18} />
              <span>{t('hero.btn_track')}</span>
            </a>
          </div>

          <div className="hero-features">
            <div className="hero-feat-item">
              <div className="hero-feat-icon-box">
                <Cpu size={16} />
              </div>
              <span>{t('hero.feat_ai')}</span>
            </div>
            <div className="hero-feat-item">
              <div className="hero-feat-icon-box blue">
                <MapPin size={16} />
              </div>
              <span>{t('hero.feat_gps')}</span>
            </div>
            <div className="hero-feat-item">
              <div className="hero-feat-icon-box blue">
                <Activity size={16} />
              </div>
              <span>{t('hero.feat_track')}</span>
            </div>
            <div className="hero-feat-item">
              <div className="hero-feat-icon-box">
                <TrendingUp size={16} />
              </div>
              <span>{t('hero.feat_analytics')}</span>
            </div>
          </div>
        </div>

        {/* Right Scenery Illustration */}
        <div className="hero-right">
          <div className="illustration-card">
            {/* SVG Scenery Background */}
            <svg
              viewBox="0 0 500 500"
              className="kerala-scenery-bg"
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
                {/* Windows & Doors */}
                <rect x="15" y="45" width="12" height="25" fill="#475569" />
                <circle cx="45" cy="45" r="5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                {/* Terracotta tiled roof */}
                <polygon points="-10,30 30,0 70,30" fill="#ea580c" />
                <line x1="-5" y1="26" x2="65" y2="26" stroke="#c2410c" strokeWidth="2" />
              </g>

              {/* Coconut Trees (Left side) */}
              <g transform="translate(120, 330)" stroke="#78350f" strokeWidth="3" fill="none">
                {/* Trunk */}
                <path d="M 10 70 Q 0 35 15 0" />
                {/* Palm Leaves */}
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
              <path
                d="M 120 120 Q 250 80 380 120"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
                className="dotted-connector"
              />
              <path
                d="M 380 160 Q 450 250 380 340"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                className="dotted-connector"
              />
              <path
                d="M 380 380 Q 250 420 120 380"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
                className="dotted-connector"
              />
              <path
                d="M 120 340 Q 50 250 120 160"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                className="dotted-connector"
              />

              {/* Central Phone Body */}
              <g className="illus-phone" transform="translate(200, 160)">
                {/* Shadow */}
                <rect x="-5" y="5" width="110" height="200" rx="20" fill="rgba(0,0,0,0.06)" />
                {/* Phone Frame */}
                <rect x="0" y="0" width="100" height="190" rx="18" fill="url(#phoneGrad)" stroke="#374151" strokeWidth="3" />
                {/* Screen */}
                <rect x="5" y="5" width="90" height="180" rx="14" fill="#ffffff" />

                {/* Notch */}
                <path d="M 30 5 L 70 5 Q 65 14 50 14 Q 35 14 30 5" fill="url(#phoneGrad)" />

                {/* Screen Content Graphic - Mock Issue Report Screen */}
                <rect x="12" y="25" width="76" height="30" rx="6" fill="rgba(22, 163, 74, 0.1)" />
                <circle cx="24" cy="40" r="8" fill="#16a34a" opacity="0.8" />
                <path d="M 21 40 L 23 42 L 27 38" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

                <rect x="38" y="32" width="42" height="6" rx="3" fill="#16a34a" opacity="0.6" />
                <rect x="38" y="42" width="28" height="4" rx="2" fill="#94a3b8" />

                {/* Loading/Scanning Grid */}
                <rect x="12" y="65" width="76" height="70" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                <circle cx="50" cy="100" r="22" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4 2" />
                <circle cx="50" cy="100" r="14" fill="none" stroke="#16a34a" strokeWidth="1.5" />
                <path d="M 45 100 L 49 104 L 56 96" fill="none" stroke="#16a34a" strokeWidth="2" />

                {/* AI Text Box */}
                <rect x="12" y="145" width="76" height="30" rx="6" fill="url(#phoneGrad)" />
                <text x="50" y="164" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-sans)">AI CONFIRMED</text>
              </g>
            </svg>

            {/* Absolute Overlay Nodes for HTML presentation */}
            {/* Citizen Node */}
            <div
              className="glass-card node-glow-green"
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
              className="glass-card node-glow-blue"
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
              className="glass-card node-glow-green"
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
              className="glass-card node-glow-blue"
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
    </section>
  );
}

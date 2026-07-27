import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, User, Cpu, UserCheck, CheckCircle, Mail, Lock, Eye, EyeOff, LogIn, Phone, Shield, AlertTriangle, Menu, Bell, PlusCircle, Search, FileText, LayoutDashboard, Megaphone, Settings, LogOut, Calendar, Info } from 'lucide-react';
import { GramConnectIcon } from './GramConnectLogo';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ProfilePage from './ProfilePage';
import ReportIssuePage from './ReportIssuePage';
import MyComplaintsPage from './MyComplaintsPage';
import './UserDashboard.css';

export default function UserDashboard() {
  const { t, i18n } = useTranslation();
  const { user, setUser, logout: handleLogout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);

  // Dynamic statistics state
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const dropdownRef = useRef(null);
  const avatarDropdownRef = useRef(null);
  const notificationsDropdownRef = useRef(null);

  // Auto protect route on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.hash = '#login';
    }
  }, [user]);

  // Close dropdowns if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(event.target)) {
        setAvatarDropdownOpen(false);
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target)) {
        setNotificationsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch Dashboard Stats & Unread Notifications
  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Fetch issues statistics
      const statsRes = await api.get('/issues/stats');
      if (statsRes.data && statsRes.data.stats) {
        setStats(statsRes.data.stats);
        setRecentComplaints(statsRes.data.recent || []);
      }

      // Fetch in-app notifications
      const notifRes = await api.get('/notifications');
      if (notifRes.data) {
        setNotifications(notifRes.data.notifications || []);
        setUnreadNotificationsCount(notifRes.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('[DEV] Failed to load dashboard statistics or notifications:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, activeTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const cleanHash = hash.split('?')[0];
      if (cleanHash === '#dashboard/report-issue') {
        setActiveTab('report');
      } else if (cleanHash === '#dashboard/my-complaints') {
        setActiveTab('complaints');
      } else if (cleanHash === '#dashboard/profile') {
        setActiveTab('profile');
      } else if (cleanHash === '#dashboard/settings') {
        setActiveTab('settings');
      } else if (cleanHash === '#dashboard/status') {
        setActiveTab('status');
      } else if (cleanHash === '#dashboard/hub') {
        setActiveTab('hub');
      } else if (cleanHash === '#dashboard/lost-found') {
        setActiveTab('lost_found');
      } else if (cleanHash === '#dashboard/announcements') {
        setActiveTab('announcements');
      } else {
        setActiveTab('dashboard');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Handle Mark Notifications as Read on toggle
  const handleToggleNotifications = async () => {
    const nextState = !notificationsDropdownOpen;
    setNotificationsDropdownOpen(nextState);

    if (nextState && unreadNotificationsCount > 0) {
      try {
        await api.put('/notifications/read');
        setUnreadNotificationsCount(0);
      } catch (err) {
        console.warn('[DEV] Failed to mark notifications as read:', err);
      }
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangDropdownOpen(false);
  };

  const getTodayDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(i18n.language === 'ml' ? 'ml-IN' : 'en-US', options);
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', fontFamily: 'var(--font-sans)' }}>
        <span style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 600 }}>Loading Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      {/* Mobile Sidebar backdrop */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Fixed Top Navbar */}
      <header className="dash-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle Navigation">
            <Menu size={22} />
          </button>

          <a href="#home" className="brand-section dash-navbar-brand">
            <div className="brand-logo">
              <GramConnectIcon className="logo-icon" />
              <span className="text-gradient-green">Gram</span>
              <span className="text-gradient-blue">Connect</span>
            </div>
          </a>
        </div>

        <div className="dash-nav-actions">
          {/* Notification bell */}
          <div className="notifications-bell-wrapper" ref={notificationsDropdownRef} style={{ position: 'relative' }}>
            <button
              className="btn-nav-action"
              aria-label="View notifications"
              onClick={handleToggleNotifications}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Bell size={20} />
              {unreadNotificationsCount > 0 && (
                <span className="notification-badge" style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', width: '8px', height: '8px', borderRadius: '50%' }} />
              )}
            </button>

            {/* Notifications Dropdown Overlay */}
            {notificationsDropdownOpen && (
              <div className="notifications-dropdown-menu" style={{ position: 'absolute', top: '48px', right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1020, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: '280px', maxWidth: '320px' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #edf2f7', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                  Notifications
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id} style={{ padding: '12px 16px', borderBottom: '1px solid #edf2f7', display: 'flex', flexDirection: 'column', gap: '4px', background: n.isRead ? 'transparent' : '#f0fdf4', transition: 'all 0.15s ease' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: n.isRead ? 500 : 700, lineHeight: 1.4 }}>
                          {n.message}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="lang-switcher-wrapper" ref={dropdownRef}>
            <button
              className="lang-dropdown-btn"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              aria-label="Change Language"
            >
              <Globe size={16} className="lang-icon" />
              <span style={{ fontSize: '0.8rem' }}>Language</span>
              <ChevronDown size={11} style={{ transform: langDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'var(--transition-fast)' }} />
            </button>
            <div className={`lang-dropdown-menu ${langDropdownOpen ? 'open' : ''}`} style={{ top: '46px' }}>
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

          {/* User profile identifier */}
          <div className="nav-user-profile" ref={avatarDropdownRef} style={{ position: 'relative' }}>
            <button
              className="navbar-avatar-btn"
              onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="User Avatar" className="navbar-avatar-img" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div className="avatar-placeholder">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="nav-user-info" style={{ display: 'none' /* Hidden on small screens, shown in css */ }}>
                <span className="nav-user-name">{user.fullName}</span>
                <span className="nav-user-role">{t('hero.citizen')}</span>
              </div>
            </button>

            {/* Action Dropdown Menu */}
            {avatarDropdownOpen && (
              <div className="avatar-dropdown-menu" style={{ position: 'absolute', top: '48px', right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1020, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: '160px' }}>
                <button
                  className="dropdown-item"
                  onClick={() => { window.location.hash = '#dashboard/profile'; setAvatarDropdownOpen(false); }}
                  style={{ padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937', fontWeight: 600, fontSize: '0.82rem', width: '100%', transition: 'all 0.15s ease' }}
                >
                  <User size={14} style={{ color: '#4b5563' }} />
                  <span>My Profile</span>
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => { window.location.hash = '#dashboard/settings'; setAvatarDropdownOpen(false); }}
                  style={{ padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937', fontWeight: 600, fontSize: '0.82rem', width: '100%', transition: 'all 0.15s ease' }}
                >
                  <Settings size={14} style={{ color: '#4b5563' }} />
                  <span>Settings</span>
                </button>
                <button
                  className="dropdown-item logout"
                  onClick={() => { handleLogout(); setAvatarDropdownOpen(false); }}
                  style={{ padding: '12px 16px', background: '#fee2e2', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 700, fontSize: '0.82rem', width: '100%', transition: 'all 0.15s ease' }}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Left Sidebar Menu */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <nav className="sidebar-menu">
          <button
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#dashboard'; setSidebarOpen(false); }}
          >
            <LayoutDashboard size={18} />
            <span>{t('dashboard.menu.dashboard')}</span>
          </button>

          <button
            className={`sidebar-item ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#dashboard/report-issue'; setSidebarOpen(false); }}
          >
            <PlusCircle size={18} />
            <span>{t('dashboard.menu.report_issue')}</span>
          </button>

          <button
            className={`sidebar-item ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#dashboard/my-complaints'; setSidebarOpen(false); }}
          >
            <FileText size={18} />
            <span>{t('dashboard.menu.my_complaints')}</span>
          </button>

          <button
            className={`sidebar-item ${activeTab === 'status' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#dashboard/status'; setSidebarOpen(false); }}
          >
            <Search size={18} />
            <span>{t('dashboard.menu.complaint_status')}</span>
          </button>

          <button
            className={`sidebar-item ${activeTab === 'hub' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#dashboard/hub'; setSidebarOpen(false); }}
          >
            <Cpu size={18} />
            <span>{t('dashboard.menu.community_hub')}</span>
          </button>

          <button
            className={`sidebar-item ${activeTab === 'lost_found' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#dashboard/lost-found'; setSidebarOpen(false); }}
          >
            <Info size={18} />
            <span>{t('dashboard.menu.lost_found')}</span>
          </button>

          <button
            className={`sidebar-item ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#dashboard/announcements'; setSidebarOpen(false); }}
          >
            <Megaphone size={18} />
            <span>{t('dashboard.menu.announcements')}</span>
          </button>

          <button
            className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#dashboard/profile'; setSidebarOpen(false); }}
          >
            <User size={18} />
            <span>{t('dashboard.menu.profile')}</span>
          </button>

          <button
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#dashboard/settings'; setSidebarOpen(false); }}
          >
            <Settings size={18} />
            <span>{t('dashboard.menu.settings')}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>{t('dashboard.menu.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main content grid */}
      <main className="dash-main">
        {activeTab === 'profile' ? (
          <ProfilePage onLogout={handleLogout} onUserUpdate={(updatedUser) => setUser(updatedUser)} />
        ) : activeTab === 'report' ? (
          <ReportIssuePage onNavigate={(tab) => setActiveTab(tab)} />
        ) : activeTab === 'complaints' || activeTab === 'status' ? (
          <MyComplaintsPage />
        ) : (
          <>
            {/* Section 1: Welcome Header Card & Profile Summary Card (Requirement 4) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              {/* Welcome Card */}
              <div className="welcome-card" style={{ margin: 0 }}>
                <div className="welcome-header">
                  <h1 className="welcome-title">
                    Welcome, {user.fullName ? user.fullName.split(' ')[0] : 'User'}
                  </h1>
                  <p className="welcome-subtitle">
                    Have a look at your civic reports summary and village updates.
                  </p>
                </div>

                <div className="welcome-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">{t('dashboard.email')}</span>
                    <span className="detail-value">{user.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t('dashboard.mobile')}</span>
                    <span className="detail-value">{user.mobile || '(not provided)'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t('dashboard.date')}</span>
                    <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} />
                      {getTodayDate()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Summary Card */}
              <div className="welcome-card" style={{ margin: 0, background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(229, 231, 235, 0.8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.fullName}
                      style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-light)' }}
                    />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold' }}>
                      {(user.fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>{user.fullName}</h3>
                    <span style={{ fontSize: '0.8rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700, textTransform: 'uppercase', display: 'inline-block', marginTop: '4px' }}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Address:</span>
                    <span style={{ color: 'var(--text-dark)', fontWeight: 700, textAlign: 'right' }}>{user.address || '(not configured)'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Login Method:</span>
                    <span style={{ color: 'var(--text-dark)', fontWeight: 700, textTransform: 'capitalize' }}>{user.authProvider} Account</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Member Since:</span>
                    <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Available Modules (Requirement 4) */}
            <div className="section-container">
              <h2 className="section-title">Available Modules</h2>
              <div className="actions-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                <div className="action-card" onClick={() => { window.location.hash = '#dashboard/report-issue'; }}>
                  <div className="action-icon-box green">
                    <PlusCircle size={22} />
                  </div>
                  <span className="action-name">Report Issue</span>
                </div>

                <div className="action-card" onClick={() => { window.location.hash = '#dashboard/my-complaints'; }}>
                  <div className="action-icon-box blue">
                    <FileText size={22} />
                  </div>
                  <span className="action-name">My Reports</span>
                </div>

                <div className="action-card" onClick={() => { window.location.hash = '#dashboard/status'; }}>
                  <div className="action-icon-box blue">
                    <Search size={22} />
                  </div>
                  <span className="action-name">Track Complaints</span>
                </div>

                <div className="action-card" onClick={() => { window.location.hash = '#dashboard/hub'; }}>
                  <div className="action-icon-box green">
                    <Cpu size={22} />
                  </div>
                  <span className="action-name">Community Updates</span>
                </div>

                <div className="action-card" onClick={() => { window.location.hash = '#dashboard/profile'; }}>
                  <div className="action-icon-box blue">
                    <Settings size={22} />
                  </div>
                  <span className="action-name">Profile Settings</span>
                </div>
              </div>
            </div>

            {/* Section 3: Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-accent total" />
                <div className="stat-info">
                  <span className="stat-number">{stats.total}</span>
                  <span className="stat-label">{t('dashboard.stats.total')}</span>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-accent pending" />
                <div className="stat-info">
                  <span className="stat-number">{stats.pending}</span>
                  <span className="stat-label">{t('dashboard.stats.pending')}</span>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-accent progress" />
                <div className="stat-info">
                  <span className="stat-number">{stats.inProgress}</span>
                  <span className="stat-label">{t('dashboard.stats.in_progress')}</span>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-accent resolved" />
                <div className="stat-info">
                  <span className="stat-number">{stats.resolved}</span>
                  <span className="stat-label">{t('dashboard.stats.resolved')}</span>
                </div>
              </div>
            </div>

            {/* Two Columns Grid for Recent Complaints and Latest Announcements */}
            <div className="dashboard-grid-2col">
              {/* Section 4: Recent Complaints Table */}
              <div className="section-container">
                <h2 className="section-title">{t('dashboard.recent_table.title')}</h2>
                <div className="table-card">
                  <div className="table-responsive-wrapper">
                    <table className="complaints-table">
                      <thead>
                        <tr>
                          <th>{t('dashboard.recent_table.id')}</th>
                          <th>{t('dashboard.recent_table.type')}</th>
                          <th>{t('dashboard.recent_table.date')}</th>
                          <th>{t('dashboard.recent_table.status')}</th>
                          <th>{t('dashboard.recent_table.action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentComplaints.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="empty-table-state">
                              {t('dashboard.recent_table.empty')}
                            </td>
                          </tr>
                        ) : (
                          recentComplaints.map((c) => (
                            <tr key={c._id}>
                              <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.complaintId}</td>
                              <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{c.category}</td>
                              <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                              <td>
                                <span className={`status-badge-outline ${c.status.toLowerCase().replace(' ', '-')}`}>
                                  {c.status}
                                </span>
                              </td>
                              <td>
                                <button
                                  onClick={() => setActiveTab('complaints')}
                                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Section 5: Latest Announcements */}
              <div className="section-container">
                <h2 className="section-title">{t('dashboard.announcements_sec.title')}</h2>
                <div className="announcements-card">
                  <div className="announcements-list">
                    <div className="announcement-item">
                      <span className="announcement-title">
                        {t('dashboard.announcements_sec.a1_title')}
                      </span>
                      <span className="announcement-date">July 24, 2026</span>
                    </div>

                    <div className="announcement-item">
                      <span className="announcement-title">
                        {t('dashboard.announcements_sec.a2_title')}
                      </span>
                      <span className="announcement-date">July 20, 2026</span>
                    </div>

                    <div className="announcement-item">
                      <span className="announcement-title">
                        {t('dashboard.announcements_sec.a3_title')}
                      </span>
                      <span className="announcement-date">July 18, 2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

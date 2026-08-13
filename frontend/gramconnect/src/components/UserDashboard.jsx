import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, User, Cpu, Users, UserCheck, CheckCircle, Mail, Lock, Eye, EyeOff, LogIn, Phone, Shield, AlertTriangle, Menu, Bell, PlusCircle, Search, FileText, LayoutDashboard, Megaphone, Settings, LogOut, Calendar, Info, AlertCircle, Trash2, Check, CheckCheck, ArrowRight } from 'lucide-react';
import { GramConnectIcon } from './GramConnectLogo';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ProfilePage from './ProfilePage';
import ReportIssuePage from './ReportIssuePage';
import MyComplaintsPage from './MyComplaintsPage';
import UserCommunityHub from './CommunityHub/UserCommunityHub';
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
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Dedicated notifications page state
  const [notifFilter, setNotifFilter] = useState('All');
  const [notifSearchQuery, setNotifSearchQuery] = useState('');
  const [notifCurrentPage, setNotifCurrentPage] = useState(1);

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
      setLoadingNotifications(true);
      const notifRes = await api.get('/notifications');
      if (notifRes.data && notifRes.data.success) {
        setNotifications(notifRes.data.notifications || []);
      }

      const countRes = await api.get('/notifications/unread-count');
      if (countRes.data && countRes.data.success) {
        setUnreadNotificationsCount(countRes.data.count || 0);
      }
      setLoadingNotifications(false);
    } catch (err) {
      console.warn('[DEV] Failed to load dashboard statistics or notifications:', err);
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, activeTab]);

  // Real-time notifications via SSE
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    const eventSource = new EventSource(`http://localhost:5000/api/notifications/stream?token=${token}`);

    eventSource.addEventListener('notification', (event) => {
      try {
        const newNotif = JSON.parse(event.data);
        setNotifications((prev) => {
          // Avoid duplicates
          if (prev.some((n) => n._id === newNotif._id)) return prev;
          return [newNotif, ...prev];
        });
        setUnreadNotificationsCount((prev) => prev + 1);
      } catch (err) {
        console.error('[DEV] Failed to parse live SSE notification:', err);
      }
    });

    eventSource.addEventListener('error', (event) => {
      console.warn('[DEV] SSE stream disconnected. Retrying...');
    });

    return () => {
      eventSource.close();
    };
  }, [user]);

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
      } else if (cleanHash === '#dashboard/notifications') {
        setActiveTab('notifications');
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
  const handleToggleNotifications = () => {
    setNotificationsDropdownOpen(!notificationsDropdownOpen);
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data && res.data.success) {
        setNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.warn('[DEV] Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.patch('/notifications/read-all');
      if (res.data && res.data.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadNotificationsCount(0);
      }
    } catch (err) {
      console.warn('[DEV] Failed to mark all notifications as read:', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data && res.data.success) {
        const wasUnread = !notifications.find(n => n._id === id)?.isRead;
        setNotifications(prev => prev.filter(n => n._id !== id));
        if (wasUnread) {
          setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.warn('[DEV] Failed to delete notification:', err);
    }
  };

  const handleDeleteAllRead = async () => {
    if (!window.confirm('Are you sure you want to delete all read notifications?')) return;
    try {
      const res = await api.delete('/notifications/delete-read');
      if (res.data && res.data.success) {
        setNotifications(prev => prev.filter(n => !n.isRead));
      }
    } catch (err) {
      console.warn('[DEV] Failed to delete read notifications:', err);
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangDropdownOpen(false);
  };

  // Filtered notifications logic
  const filteredNotifs = notifications.filter(n => {
    const matchesSearch = 
      n.title.toLowerCase().includes(notifSearchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(notifSearchQuery.toLowerCase()) ||
      (n.relatedComplaint && (typeof n.relatedComplaint === 'object' ? n.relatedComplaint.complaintId : n.relatedComplaint).toLowerCase().includes(notifSearchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (notifFilter === 'Unread') return !n.isRead;
    if (notifFilter === 'Read') return n.isRead;
    
    const titleL = n.title.toLowerCase();
    const msgL = n.message.toLowerCase();
    
    if (notifFilter === 'Complaint') {
      return titleL.includes('complaint') || msgL.includes('complaint') || n.relatedComplaint;
    }
    if (notifFilter === 'Announcement') {
      return titleL.includes('announcement') || msgL.includes('announcement');
    }
    if (notifFilter === 'Community') {
      return titleL.includes('community') || msgL.includes('community') || titleL.includes('post') || msgL.includes('post');
    }
    if (notifFilter === 'Lost & Found') {
      return titleL.includes('lost') || msgL.includes('lost') || titleL.includes('found') || msgL.includes('found') || titleL.includes('claim') || msgL.includes('claim');
    }
    if (notifFilter === 'System') {
      return titleL.includes('system') || msgL.includes('system') || titleL.includes('error') || msgL.includes('error');
    }

    return true;
  });

  const notifRowsPerPage = 10;
  const notifTotalPages = Math.ceil(filteredNotifs.length / notifRowsPerPage) || 1;
  const indexOfLastNotifRow = notifCurrentPage * notifRowsPerPage;
  const indexOfFirstNotifRow = indexOfLastNotifRow - notifRowsPerPage;
  const currentNotifsPage = filteredNotifs.slice(indexOfFirstNotifRow, indexOfLastNotifRow);

  // Dedicated Notifications View
  const renderNotificationsPage = (isAdmin = false) => {
    const getNotifIcon = (n) => {
      const IconComponent = n.type === 'Success' ? CheckCircle 
                          : n.type === 'Warning' ? AlertTriangle 
                          : n.type === 'Error' ? AlertCircle 
                          : Info;
      const iconColor = n.type === 'Success' ? '#10b981' 
                      : n.type === 'Warning' ? '#f59e0b' 
                      : n.type === 'Error' ? '#ef4444' 
                      : '#3b82f6';
      return <IconComponent size={20} style={{ color: iconColor }} />;
    };

    const filterOptions = ['All', 'Unread', 'Read', 'Complaint', 'Announcement', 'Community', 'Lost & Found', 'System'];

    return (
      <div className="workspace-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>Notifications</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>View and manage all your notifications.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="admin-btn secondary" 
              onClick={handleMarkAllAsRead} 
              disabled={unreadNotificationsCount === 0}
              style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 700 }}
            >
              Mark All as Read
            </button>
            <button 
              className="admin-btn danger" 
              onClick={handleDeleteAllRead}
              disabled={!notifications.some(n => n.isRead)}
              style={{ background: '#ef4444', color: '#fff', padding: '8px 14px', fontSize: '0.8rem', fontWeight: 700, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Delete All Read
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {filterOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => { setNotifFilter(opt); setNotifCurrentPage(1); }}
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  border: '1px solid',
                  borderColor: notifFilter === opt ? 'var(--primary)' : '#e2e8f0',
                  background: notifFilter === opt ? 'var(--primary-light)' : '#ffffff',
                  color: notifFilter === opt ? 'var(--primary)' : '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={notifSearchQuery}
              onChange={(e) => { setNotifSearchQuery(e.target.value); setNotifCurrentPage(1); }}
              className="admin-input"
              style={{ paddingLeft: '36px', height: '36px', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Notifications List */}
        {loadingNotifications ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '32px', height: '32px', border: '3px solid var(--primary)', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite', display: 'inline-block' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading your notifications...</span>
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <span style={{ fontSize: '2.5rem' }}>🔔</span>
            <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text-dark)' }}>No Notifications</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>You're all caught up.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentNotifsPage.map((n) => {
              const compId = n.relatedComplaint ? (typeof n.relatedComplaint === 'object' ? n.relatedComplaint.complaintId : 'Complaint') : null;
              
              return (
                <div
                  key={n._id}
                  onClick={() => {
                    handleMarkAsRead(n._id);
                    const cleanTitle = n.title.toLowerCase();
                    const cleanMsg = n.message.toLowerCase();
                    if (n.relatedComplaint) {
                      const dbId = typeof n.relatedComplaint === 'object' ? n.relatedComplaint._id : n.relatedComplaint;
                      window.location.hash = isAdmin 
                        ? `#admin/complaints/${dbId}`
                        : `#dashboard/my-complaints?id=${dbId}`;
                    } else if (cleanTitle.includes('announcement') || cleanMsg.includes('announcement')) {
                      window.location.hash = isAdmin ? '#admin' : '#dashboard/announcements';
                    } else if (cleanTitle.includes('community') || cleanMsg.includes('community') || cleanTitle.includes('post') || cleanMsg.includes('post')) {
                      window.location.hash = isAdmin ? '#admin' : '#dashboard/hub';
                    } else if (cleanTitle.includes('lost') || cleanMsg.includes('lost') || cleanTitle.includes('found') || cleanMsg.includes('found')) {
                      window.location.hash = isAdmin ? '#admin' : '#dashboard/lost-found';
                    } else {
                      window.location.hash = isAdmin ? '#admin' : '#dashboard';
                    }
                  }}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px solid #edf2f7',
                    background: n.isRead ? '#ffffff' : '#f0fdf4',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  className="notification-page-card"
                >
                  <div>{getNotifIcon(n)}</div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{n.title}</span>
                      {!n.isRead && (
                        <span style={{ width: '6px', height: '6px', background: '#3b82f6', borderRadius: '50%' }} />
                      )}
                      {!n.isRead && (
                        <span style={{ fontSize: '0.65rem', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          Unread
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#4b5563', lineHeight: 1.4 }}>{n.message}</p>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {compId && (
                        <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700 }}>
                          ID: {compId}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(n._id);
                    }}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {filteredNotifs.length > notifRowsPerPage && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', borderTop: '1px solid #edf2f7', paddingTop: '20px' }}>
            <button
              onClick={() => setNotifCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={notifCurrentPage === 1}
              className="admin-btn secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              Previous
            </button>
            <span style={{ alignSelf: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              Page {notifCurrentPage} of {notifTotalPages}
            </span>
            <button
              onClick={() => setNotifCurrentPage(prev => Math.min(notifTotalPages, prev + 1))}
              disabled={notifCurrentPage === notifTotalPages}
              className="admin-btn secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
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
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Bell size={20} />
              {unreadNotificationsCount > 0 && (
                <span className="notification-badge" style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#ffffff', width: '16px', height: '16px', borderRadius: '50%', fontSize: '0.62rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Overlay */}
            {notificationsDropdownOpen && (
              <div className="notifications-dropdown-menu" style={{ position: 'absolute', top: '48px', right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1020, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: '320px', maxWidth: '360px' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-dark)' }}>Notifications</span>
                  {unreadNotificationsCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead} 
                      style={{ fontSize: '0.75rem', color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                
                <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {loadingNotifications ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '20px', height: '20px', border: '2px solid var(--primary)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading notifications...</span>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={32} style={{ color: '#10b981', opacity: 0.8 }} />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>No Notifications Yet</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>You're all caught up.</span>
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((n) => {
                      const IconComponent = n.type === 'Success' ? CheckCircle 
                                          : n.type === 'Warning' ? AlertTriangle 
                                          : n.type === 'Error' ? AlertCircle 
                                          : Info;
                      const iconColor = n.type === 'Success' ? '#10b981' 
                                      : n.type === 'Warning' ? '#f59e0b' 
                                      : n.type === 'Error' ? '#ef4444' 
                                      : '#3b82f6';
                      
                      return (
                        <div 
                          key={n._id} 
                          onClick={() => {
                            handleMarkAsRead(n._id);
                            setNotificationsDropdownOpen(false);
                            if (n.relatedComplaint) {
                              const compId = typeof n.relatedComplaint === 'object' ? n.relatedComplaint._id : n.relatedComplaint;
                              window.location.hash = `#dashboard/my-complaints?id=${compId}`;
                            }
                          }}
                          style={{ 
                            padding: '12px 16px', 
                            borderBottom: '1px solid #edf2f7', 
                            display: 'flex', 
                            gap: '12px', 
                            background: n.isRead ? 'transparent' : '#f0fdf4', 
                            transition: 'all 0.15s ease',
                            cursor: 'pointer',
                            alignItems: 'flex-start',
                            position: 'relative'
                          }}
                          className="notification-card-item"
                        >
                          <div style={{ marginTop: '2px', color: iconColor }}>
                            <IconComponent size={16} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, paddingRight: '12px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: 700 }}>
                              {n.title}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#4b5563', lineHeight: 1.4 }}>
                              {n.message}
                            </span>
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                            {!n.isRead && (
                              <span style={{ width: '6px', height: '6px', background: '#3b82f6', borderRadius: '50%' }} />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(n._id);
                              }}
                              style={{ 
                                border: 'none', 
                                background: 'none', 
                                color: '#9ca3af', 
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Delete notification"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* View All Notifications Link */}
                <div style={{ padding: '10px 16px', borderTop: '1px solid #edf2f7', textAlign: 'center', background: '#f8fafc' }}>
                  <button
                    onClick={() => {
                      window.location.hash = '#dashboard/notifications';
                      setNotificationsDropdownOpen(false);
                    }}
                    style={{ color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    View All Notifications <ArrowRight size={14} />
                  </button>
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
            <Users size={18} />
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
        ) : activeTab === 'notifications' ? (
          renderNotificationsPage(false)
        ) : activeTab === 'hub' ? (
          <UserCommunityHub />
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

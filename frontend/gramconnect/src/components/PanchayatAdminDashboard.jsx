import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Megaphone,
  Activity,
  LogOut,
  Bell,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Eye,
  Edit3,
  MapPin,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  ChevronDown,
  X,
  Plus,
  Check,
  Calendar,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GramConnectIcon } from './GramConnectLogo';
import api from '../utils/api';
import './AdminDashboard.css';
import './UserDashboard.css';
import './PanchayatAdminDashboard.css';

const PANCHAYAT_ADMIN_ROLES = ['panchayat_admin', 'PANCHAYAT_ADMIN'];

export default function PanchayatAdminDashboard() {
  const { user, logout: handleLogout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // Dashboard stats
  const [stats, setStats] = useState({ totalCitizens: 0, totalComplaints: 0, pendingComplaints: 0, inProgressComplaints: 0, resolvedComplaints: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Complaints
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);

  // Citizens
  const [citizens, setCitizens] = useState([]);
  const [loadingCitizens, setLoadingCitizens] = useState(false);
  const [citizenSearch, setCitizenSearch] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [annSearchQuery, setAnnSearchQuery] = useState('');
  const [annCategoryFilter, setAnnCategoryFilter] = useState('All');
  const [annPriorityFilter, setAnnPriorityFilter] = useState('All');
  const [annStatusFilter, setAnnStatusFilter] = useState('All');
  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [annEditingItem, setAnnEditingItem] = useState(null);
  const [annDetailsOpen, setAnnDetailsOpen] = useState(false);
  const [selectedAnnItem, setSelectedAnnItem] = useState(null);
  const [submittingAnn, setSubmittingAnn] = useState(false);

  // Announcement Form Fields
  const [annFormTitle, setAnnFormTitle] = useState('');
  const [annFormDescription, setAnnFormDescription] = useState('');
  const [annFormCategory, setAnnFormCategory] = useState('General');
  const [annFormPriority, setAnnFormPriority] = useState('Normal');
  const [annFormExpiryDate, setAnnFormExpiryDate] = useState('');
  const [annFormAttachment, setAnnFormAttachment] = useState(null);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/admin/panchayat-admin/stats');
      if (res.data?.success) {
        setStats(res.data.stats || {});
        setRecentComplaints(res.data.recentComplaints || []);
      }
    } catch (err) {
      console.error('[PA] Failed to load dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const params = {};
      if (complaintSearch) params.search = complaintSearch;
      if (complaintStatusFilter) params.status = complaintStatusFilter;
      const res = await api.get('/admin/complaints', { params });
      if (res.data?.success) setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error('[PA] Failed to load complaints:', err);
      showToast('Failed to load complaints', 'error');
    } finally {
      setLoadingComplaints(false);
    }
  };

  const fetchCitizens = async () => {
    setLoadingCitizens(true);
    try {
      const res = await api.get('/admin/users', { params: { search: citizenSearch || undefined } });
      if (res.data?.success) setCitizens(res.data.users || []);
    } catch (err) {
      console.error('[PA] Failed to load citizens:', err);
    } finally {
      setLoadingCitizens(false);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotif(true);
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ]);
      if (notifRes.data?.success) setNotifications(notifRes.data.notifications || []);
      if (countRes.data?.success) setUnreadCount(countRes.data.count || 0);
    } catch (err) {
      console.warn('[PA] Failed to load notifications:', err);
    } finally {
      setLoadingNotif(false);
    }
  };

  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const res = await api.get('/announcements');
      if (res.data?.success) {
        setAnnouncements(res.data.announcements || []);
      }
    } catch (err) {
      console.error('[PA] Failed to fetch announcements:', err);
      showToast('Failed to load announcements', 'error');
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const handleOpenAnnModal = (item = null) => {
    setAnnEditingItem(item);
    if (item) {
      setAnnFormTitle(item.title || '');
      setAnnFormDescription(item.description || '');
      setAnnFormCategory(item.category || 'General');
      setAnnFormPriority(item.priority || 'Normal');
      setAnnFormExpiryDate(item.expiryDate ? item.expiryDate.substring(0, 10) : '');
      setAnnFormAttachment(null);
    } else {
      setAnnFormTitle('');
      setAnnFormDescription('');
      setAnnFormCategory('General');
      setAnnFormPriority('Normal');
      setAnnFormExpiryDate('');
      setAnnFormAttachment(null);
    }
    setAnnModalOpen(true);
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!annFormTitle || !annFormDescription || !annFormCategory) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setSubmittingAnn(true);
    const formData = new FormData();
    formData.append('title', annFormTitle);
    formData.append('description', annFormDescription);
    formData.append('category', annFormCategory);
    formData.append('priority', annFormPriority);
    formData.append('district', user?.district || '');
    formData.append('panchayat', user?.panchayat || '');
    if (annFormExpiryDate) formData.append('expiryDate', annFormExpiryDate);
    if (annFormAttachment) {
      formData.append('attachment', annFormAttachment);
    }

    try {
      let res;
      if (annEditingItem) {
        res = await api.put(`/announcements/${annEditingItem._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/announcements', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data?.success) {
        showToast(annEditingItem ? 'Announcement updated successfully.' : 'Announcement published successfully.');
        setAnnModalOpen(false);
        fetchAnnouncements();
      }
    } catch (err) {
      console.error('[PA] Failed to save announcement:', err);
      showToast(err.response?.data?.message || 'Failed to save announcement.', 'error');
    } finally {
      setSubmittingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (itemId) => {
    if (!window.confirm('Are you sure you want to archive this announcement?')) return;
    try {
      const res = await api.delete(`/announcements/${itemId}`);
      if (res.data?.success) {
        showToast('Announcement archived successfully.');
        fetchAnnouncements();
        if (selectedAnnItem && selectedAnnItem._id === itemId) {
          setAnnDetailsOpen(false);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete announcement.', 'error');
    }
  };

  const handleUpdateComplaintStatus = async (id, status) => {
    try {
      const res = await api.put(`/admin/complaints/${id}`, { status });
      if (res.data?.success) {
        showToast(`Complaint status updated to ${status}`);
        fetchComplaints();
        if (selectedComplaint?._id === id) setSelectedComplaint(prev => ({ ...prev, status }));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update complaint', 'error');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (activeTab === 'complaints') fetchComplaints();
    if (activeTab === 'citizens') fetchCitizens();
    if (activeTab === 'notifications') fetchNotifications();
    if (activeTab === 'announcements') fetchAnnouncements();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'complaints') {
      const timer = setTimeout(fetchComplaints, 300);
      return () => clearTimeout(timer);
    }
  }, [complaintSearch, complaintStatusFilter]);

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getPriorityClass = (priority = 'Normal') => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'urgent';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'normal';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Pending':
        return { backgroundColor: '#fee2e2', color: '#ef4444' };
      case 'Verified':
        return { backgroundColor: '#eff6ff', color: '#2563eb' };
      case 'Assigned':
        return { backgroundColor: '#fdf2f8', color: '#db2777' };
      case 'In Progress':
        return { backgroundColor: '#fef3c7', color: '#d97706' };
      case 'Resolved':
        return { backgroundColor: '#d1fae5', color: '#059669' };
      case 'Rejected':
        return { backgroundColor: '#f3f4f6', color: '#374151' };
      default:
        return { backgroundColor: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <div className="dashboard-wrapper">
      {/* Toast container */}
      <div className="toasts-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : ''}`}>
            {t.type === 'error' ? <AlertTriangle size={16} color="#ef4444" /> : <CheckCircle2 size={16} color="#22c55e" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Top Header */}
      <header className="dash-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          <a href="/#panchayat-admin" className="dash-navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GramConnectIcon size={32} />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              GramConnect <span style={{ fontSize: '0.68rem', background: '#22c55e', color: '#ffffff', padding: '2px 8px', borderRadius: '99px', verticalAlign: 'middle', textTransform: 'uppercase', fontWeight: 700 }}>Panchayat Portal</span>
            </span>
          </a>
        </div>

        {/* Profile menu */}
        <div className="dash-nav-actions">
          <div style={{ position: 'relative' }}>
            <button
              className="btn-nav-action"
              onClick={() => setNotifDropdownOpen(o => !o)}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge" style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#ffffff', width: '16px', height: '16px', borderRadius: '50%', fontSize: '0.62rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notifDropdownOpen && (
              <div className="notifications-dropdown-menu" style={{ position: 'absolute', top: '48px', right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1020, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: '320px', maxWidth: '360px' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-dark)' }}>Notifications</span>
                </div>
                <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={32} style={{ color: '#10b981', opacity: 0.8 }} />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>No Notifications Yet</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>You're all caught up.</span>
                    </div>
                  ) : (
                    notifications.slice(0, 8).map(n => (
                      <div
                        key={n._id}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #edf2f7',
                          display: 'flex',
                          gap: '12px',
                          background: n.isRead ? 'transparent' : '#f0fdf4',
                          transition: 'all 0.15s ease',
                          cursor: 'pointer',
                          alignItems: 'flex-start'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: 700 }}>{n.title}</span>
                          <span style={{ fontSize: '0.75rem', color: '#4b5563', lineHeight: 1.4 }}>{n.message}</span>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>{formatDate(n.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <div className="nav-user-profile" style={{ cursor: 'pointer' }} onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}>
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.fullName}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-light)' }}
                />
              ) : (
                <div className="avatar-placeholder" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
                  {(user?.fullName || 'P')[0].toUpperCase()}
                </div>
              )}
              <div className="nav-user-info">
                <span className="nav-user-name">{user?.fullName || 'Panchayat Admin'}</span>
                <span className="nav-user-role" style={{ color: '#22c55e', textTransform: 'capitalize' }}>
                  {user?.role?.replace('_', ' ') || 'Panchayat Admin'}
                </span>
              </div>
              <ChevronDown size={14} style={{ color: '#94a3b8' }} />
            </div>

            {avatarDropdownOpen && (
              <div className="avatar-dropdown-menu" style={{
                position: 'absolute',
                top: '55px',
                right: 0,
                width: '200px',
                background: '#ffffff',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                borderRadius: '16px',
                boxShadow: '0 15px 30px rgba(0,0,0,0.08)',
                zIndex: 1100,
                overflow: 'hidden',
                padding: '4px',
                animation: 'fadeIn 0.15s ease-out'
              }}>
                <button
                  onClick={handleLogout}
                  className="dropdown-item logout"
                  style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', fontSize: '0.85rem', fontWeight: 700, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`dash-sidebar panchayat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Assigned Area badge */}
        <div style={{ margin: '0 16px 16px', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <MapPin size={13} color='var(--primary)' />
            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Area</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', fontWeight: 700 }}>{user?.panchayat || 'Not Assigned'}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>{user?.district || ''}</div>
        </div>

        <div className="sidebar-menu">
          <button
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => { setActiveTab('complaints'); setSidebarOpen(false); }}
          >
            <AlertTriangle size={18} />
            <span>Complaints</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'citizens' ? 'active' : ''}`}
            onClick={() => { setActiveTab('citizens'); setSidebarOpen(false); }}
          >
            <Users size={18} />
            <span>Citizens</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => { setActiveTab('announcements'); setSidebarOpen(false); }}
          >
            <Megaphone size={18} />
            <span>Announcements</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => { setActiveTab('notifications'); setSidebarOpen(false); }}
          >
            <Bell size={18} />
            <span>Notifications</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'reports_analytics' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reports_analytics'); setSidebarOpen(false); }}
          >
            <TrendingUp size={18} />
            <span>Reports & Analytics</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'my_panchayat' ? 'active' : ''}`}
            onClick={() => { setActiveTab('my_panchayat'); setSidebarOpen(false); }}
          >
            <MapPin size={18} />
            <span>My Panchayath</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <button className="btn-sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <main className="dash-main">
        {/* ==================== DASHBOARD TAB ==================== */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Welcome Banner Card */}
            <div className="welcome-card" style={{ background: 'linear-gradient(135deg, #15803d 0%, #1e3a8a 100%)' }}>
              <div className="welcome-header">
                <h1 className="welcome-title">Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'} 👋</h1>
                <p className="welcome-subtitle">
                  Panchayat Admin Console. Review citizen reports, manage local resolutions, and communicate area notifications.
                </p>
              </div>
              <div className="welcome-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Local Government</span>
                  <span className="detail-value">{user?.panchayat || 'Grama Panchayath'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">District Jurisdiction</span>
                  <span className="detail-value">{user?.district || 'Kerala'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Portal Status</span>
                  <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }} /> Live & Active
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card" onClick={() => setActiveTab('citizens')} style={{ cursor: 'pointer' }}>
                <span className="stat-accent" style={{ background: '#3b82f6' }} />
                <div className="stat-info">
                  {loadingStats ? <span className="skeleton-text-lg" /> : <span className="stat-number">{stats.totalCitizens || 0}</span>}
                  <span className="stat-label">Total Citizens</span>
                </div>
              </div>
              <div className="stat-card" onClick={() => setActiveTab('complaints')} style={{ cursor: 'pointer' }}>
                <span className="stat-accent" style={{ background: '#64748b' }} />
                <div className="stat-info">
                  {loadingStats ? <span className="skeleton-text-lg" /> : <span className="stat-number">{stats.totalComplaints || 0}</span>}
                  <span className="stat-label">Total Complaints</span>
                </div>
              </div>
              <div className="stat-card" onClick={() => setActiveTab('complaints')} style={{ cursor: 'pointer' }}>
                <span className="stat-accent" style={{ background: '#ef4444' }} />
                <div className="stat-info">
                  {loadingStats ? <span className="skeleton-text-lg" /> : <span className="stat-number">{stats.pendingComplaints || 0}</span>}
                  <span className="stat-label">Pending</span>
                </div>
              </div>
              <div className="stat-card" onClick={() => setActiveTab('complaints')} style={{ cursor: 'pointer' }}>
                <span className="stat-accent" style={{ background: '#f59e0b' }} />
                <div className="stat-info">
                  {loadingStats ? <span className="skeleton-text-lg" /> : <span className="stat-number">{stats.inProgressComplaints || 0}</span>}
                  <span className="stat-label">In Progress</span>
                </div>
              </div>
              <div className="stat-card" onClick={() => setActiveTab('complaints')} style={{ cursor: 'pointer' }}>
                <span className="stat-accent" style={{ background: '#10b981' }} />
                <div className="stat-info">
                  {loadingStats ? <span className="skeleton-text-lg" /> : <span className="stat-number">{stats.resolvedComplaints || 0}</span>}
                  <span className="stat-label">Resolved</span>
                </div>
              </div>
            </div>

            {/* Recent Complaints */}
            <div className="dashboard-grid-2col">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', gridColumn: 'span 2' }}>
                <div className="section-container">
                  <div className="admin-flex-row" style={{ marginBottom: '16px' }}>
                    <h2 className="section-title">Recent Complaints</h2>
                    <button
                      className="admin-btn secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      onClick={() => setActiveTab('complaints')}
                    >
                      View All
                    </button>
                  </div>
                  <div className="table-card">
                    <div className="table-responsive-wrapper">
                      <table className="complaints-table">
                        <thead>
                          <tr>
                            <th>Complaint ID</th>
                            <th>Citizen</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingStats ? (
                            [...Array(5)].map((_, i) => (
                              <tr key={i}>
                                <td><span className="skeleton-row-cell" /></td>
                                <td><span className="skeleton-row-cell" /></td>
                                <td><span className="skeleton-row-cell" /></td>
                                <td><span className="skeleton-row-cell" /></td>
                                <td><span className="skeleton-row-cell" /></td>
                                <td><span className="skeleton-row-cell" /></td>
                              </tr>
                            ))
                          ) : recentComplaints.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="empty-table-state" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No complaints logged in database</td>
                            </tr>
                          ) : (
                            recentComplaints.map((c, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{c.complaintId || c._id?.substring(0, 8)}</td>
                                <td style={{ fontWeight: 700 }}>{c.user?.fullName || 'Citizen'}</td>
                                <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span>{c.category}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700 }}>
                                      🤖 {c.aiCategory || c.category}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span className="status-pill" style={{ ...getStatusBadgeStyle(c.status), fontWeight: 700, padding: '4px 8px', borderRadius: '9999px', fontSize: '0.72rem' }}>
                                    {c.status}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge-priority ${getPriorityClass(c.priority)}`}>
                                    {c.priority || 'Normal'}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{formatDate(c.createdAt)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== COMPLAINTS TAB ==================== */}
        {activeTab === 'complaints' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Complaints</h1>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Manage complaints from citizens in {user?.panchayat || 'your panchayat'}
                </p>
              </div>
              <button className="admin-btn secondary" onClick={fetchComplaints} style={{ gap: '6px' }}>
                <RefreshCw size={14} className={loadingComplaints ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="unified-filter-toolbar">
              <div className="search-input-wrapper" style={{ flex: 2 }}>
                <Search size={16} className="search-icon" style={{ top: '12px' }} />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={complaintSearch}
                  onChange={e => setComplaintSearch(e.target.value)}
                  className="complaints-search-input"
                  style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
                />
              </div>
              <select
                value={complaintStatusFilter}
                onChange={e => setComplaintStatusFilter(e.target.value)}
                className="admin-select"
                style={{ fontSize: '0.85rem', flex: 1, border: '1px solid #cbd5e1' }}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <button className="admin-btn secondary" onClick={() => { setComplaintSearch(''); setComplaintStatusFilter(''); }} style={{ fontSize: '0.82rem', background: '#f1f5f9' }}>
                Clear
              </button>
            </div>

            {/* Table */}
            {loadingComplaints ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
                <span style={{ width: '36px', height: '36px', border: '3px solid #3b82f6', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite' }} />
              </div>
            ) : complaints.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                <AlertTriangle size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p style={{ fontWeight: 600 }}>No complaints found in your panchayat area.</p>
              </div>
            ) : (
              <div className="table-card">
                <div className="table-responsive-wrapper">
                  <table className="complaints-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Citizen</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map(c => (
                        <tr key={c._id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#475569', whiteSpace: 'nowrap' }}>{c.complaintId}</td>
                          <td style={{ fontWeight: 600, color: '#1e293b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontWeight: 600 }}>{c.category}</span>
                              <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700 }}>
                                🤖 {c.aiCategory || c.category}
                              </span>
                            </div>
                          </td>
                          <td>{c.anonymous ? 'Anonymous' : c.user?.fullName || '—'}</td>
                          <td>
                            <span className="status-pill" style={{ ...getStatusBadgeStyle(c.status), fontWeight: 700, padding: '4px 8px', borderRadius: '9999px', fontSize: '0.72rem' }}>
                              {c.status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-priority ${getPriorityClass(c.priority)}`}>
                              {c.priority || 'Normal'}
                            </span>
                          </td>
                          <td style={{ color: '#64748b' }}>{formatDate(c.createdAt)}</td>
                          <td>
                            <button
                              onClick={() => { setSelectedComplaint(c); setComplaintModalOpen(true); }}
                              className="admin-btn primary"
                              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            >
                              <Eye size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== CITIZENS TAB ==================== */}
        {activeTab === 'citizens' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Citizens</h1>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Registered citizens in {user?.panchayat || 'your panchayat'}</p>
              </div>
              <button className="admin-btn secondary" onClick={fetchCitizens} style={{ gap: '6px' }}>
                <RefreshCw size={14} className={loadingCitizens ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            <div className="unified-filter-toolbar">
              <div className="search-input-wrapper" style={{ flex: 2 }}>
                <Search size={16} className="search-icon" style={{ top: '12px' }} />
                <input type="text" placeholder="Search citizens..." value={citizenSearch}
                  onChange={e => setCitizenSearch(e.target.value)}
                  className="complaints-search-input" style={{ paddingLeft: '40px', fontSize: '0.85rem' }} />
              </div>
              <button className="admin-btn secondary" onClick={fetchCitizens} style={{ fontSize: '0.82rem', background: '#f1f5f9' }}>Search</button>
            </div>

            {loadingCitizens ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
                <span style={{ width: '36px', height: '36px', border: '3px solid #3b82f6', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite' }} />
              </div>
            ) : citizens.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                <Users size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p style={{ fontWeight: 600 }}>No citizens registered in your panchayat yet.</p>
              </div>
            ) : (
              <div className="table-card">
                <div className="table-responsive-wrapper">
                  <table className="complaints-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Panchayat</th>
                        <th>Ward</th>
                        <th>Status</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citizens.map(c => (
                        <tr key={c._id}>
                          <td style={{ fontWeight: 600, color: '#1e293b' }}>{c.fullName}</td>
                          <td style={{ color: '#475569' }}>{c.email}</td>
                          <td style={{ color: '#475569' }}>{c.mobile}</td>
                          <td style={{ color: '#475569' }}>{c.panchayat || '—'}</td>
                          <td style={{ color: '#475569' }}>{c.ward || '—'}</td>
                          <td>
                            <span className={`badge-status ${c.status === 'Blocked' ? 'blocked' : 'active'}`}>
                              {c.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ color: '#64748b' }}>{formatDate(c.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== NOTIFICATIONS TAB ==================== */}
        {activeTab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Notifications</h1>
            </div>
            {loadingNotif ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
                <span style={{ width: '36px', height: '36px', border: '3px solid #3b82f6', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite' }} />
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                <Bell size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p style={{ fontWeight: 600 }}>No notifications yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.map(n => (
                  <div key={n._id} style={{ background: n.isRead ? '#fff' : '#eff6ff', border: `1px solid ${n.isRead ? '#e2e8f0' : '#bfdbfe'}`, borderRadius: '12px', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.88rem' }}>{n.title}</div>
                        <div style={{ color: '#475569', fontSize: '0.82rem', marginTop: '4px' }}>{n.message}</div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatDate(n.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== ANNOUNCEMENTS TAB ==================== */}
        {activeTab === 'announcements' && (() => {
          const filteredAnnouncements = announcements.filter(ann => {
            const matchesSearch = !annSearchQuery ||
              ann.title?.toLowerCase().includes(annSearchQuery.toLowerCase()) ||
              ann.description?.toLowerCase().includes(annSearchQuery.toLowerCase());
            const matchesCategory = annCategoryFilter === 'All' || ann.category === annCategoryFilter;
            const matchesPriority = annPriorityFilter === 'All' || ann.priority === annPriorityFilter;
            const matchesStatus = annStatusFilter === 'All' || ann.status === annStatusFilter;
            return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Announcements</h1>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Manage local notices for {user?.panchayat || 'your panchayat'}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="admin-btn primary" onClick={() => handleOpenAnnModal(null)} style={{ gap: '6px' }}>
                    <Plus size={16} /> Create Announcement
                  </button>
                  <button className="admin-btn secondary" onClick={fetchAnnouncements} style={{ gap: '6px' }}>
                    <RefreshCw size={14} className={announcementsLoading ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="unified-filter-toolbar">
                <div className="search-input-wrapper" style={{ flex: 2 }}>
                  <Search size={16} className="search-icon" style={{ top: '12px' }} />
                  <input
                    type="text"
                    placeholder="Search announcements..."
                    value={annSearchQuery}
                    onChange={(e) => setAnnSearchQuery(e.target.value)}
                    className="complaints-search-input"
                    style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <select
                    value={annCategoryFilter}
                    onChange={(e) => setAnnCategoryFilter(e.target.value)}
                    className="admin-select"
                    style={{ fontSize: '0.85rem', width: '100%', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    <option value="All">All Categories</option>
                    <option value="General">General</option>
                    <option value="Public Notice">Public Notice</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Road & Transport">Road & Transport</option>
                    <option value="Water">Water</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Health">Health</option>
                    <option value="Community">Community</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <select
                    value={annPriorityFilter}
                    onChange={(e) => setAnnPriorityFilter(e.target.value)}
                    className="admin-select"
                    style={{ fontSize: '0.85rem', width: '100%', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    <option value="All">All Priorities</option>
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <select
                    value={annStatusFilter}
                    onChange={(e) => setAnnStatusFilter(e.target.value)}
                    className="admin-select"
                    style={{ fontSize: '0.85rem', width: '100%', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {announcementsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
                  <span style={{ width: '36px', height: '36px', border: '3px solid #3b82f6', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite' }} />
                </div>
              ) : filteredAnnouncements.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                  <Megaphone size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  <p style={{ fontWeight: 600 }}>No announcements found.</p>
                </div>
              ) : (
                <div className="table-card">
                  <div className="table-responsive-wrapper">
                    <table className="complaints-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Publish Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAnnouncements.map(ann => (
                          <tr key={ann._id}>
                            <td style={{ fontWeight: 600, color: '#1e293b' }}>{ann.title}</td>
                            <td>{ann.category}</td>
                            <td>
                              <span className={`badge-priority ${getPriorityClass(ann.priority)}`}>
                                {ann.priority}
                              </span>
                            </td>
                            <td>
                              <span className="status-pill" style={{ ...getStatusBadgeStyle(ann.status === 'Active' ? 'Resolved' : 'Rejected'), fontWeight: 700, padding: '4px 8px', borderRadius: '9999px', fontSize: '0.72rem' }}>
                                {ann.status}
                              </span>
                            </td>
                            <td style={{ color: '#64748b' }}>{formatDate(ann.publishDate || ann.createdAt)}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="admin-btn secondary" onClick={() => { setSelectedAnnItem(ann); setAnnDetailsOpen(true); }} style={{ padding: '4px 8px', fontSize: '0.72rem' }}>View</button>
                                <button className="admin-btn secondary" onClick={() => handleOpenAnnModal(ann)} style={{ padding: '4px 8px', fontSize: '0.72rem' }}>Edit</button>
                                <button className="admin-btn secondary" onClick={() => handleDeleteAnnouncement(ann._id)} style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#ef4444' }}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ==================== REPORTS & ANALYTICS TAB ==================== */}
        {activeTab === 'reports_analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Reports & Analytics</h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Civic complaint summaries and analytics for {user?.panchayat || 'your panchayat'}</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-accent" style={{ background: '#3b82f6' }} />
                <div className="stat-info">
                  <span className="stat-number">{stats.totalComplaints || 0}</span>
                  <span className="stat-label">Total Complaints</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-accent" style={{ background: '#10b981' }} />
                <div className="stat-info">
                  <span className="stat-number">
                    {stats.totalComplaints > 0 
                      ? Math.round(((stats.resolvedComplaints || 0) / stats.totalComplaints) * 100) 
                      : 0}%
                  </span>
                  <span className="stat-label">Resolution Rate</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-accent" style={{ background: '#ef4444' }} />
                <div className="stat-info">
                  <span className="stat-number">{stats.pendingComplaints || 0}</span>
                  <span className="stat-label">Pending Reviews</span>
                </div>
              </div>
            </div>

            <div className="dashboard-grid-2col" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="section-container" style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 className="section-title" style={{ fontSize: '1rem', marginBottom: '16px' }}>Resolution Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Pending', count: stats.pendingComplaints || 0, color: '#ef4444' },
                    { label: 'In Progress', count: stats.inProgressComplaints || 0, color: '#f59e0b' },
                    { label: 'Resolved', count: stats.resolvedComplaints || 0, color: '#10b981' }
                  ].map((item, idx) => {
                    const pct = stats.totalComplaints > 0 ? (item.count / stats.totalComplaints) * 100 : 0;
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                          <span>{item.label}</span>
                          <span>{item.count} ({Math.round(pct)}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="section-container" style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 className="section-title" style={{ fontSize: '1rem', marginBottom: '16px' }}>Panchayat Performance Indicators</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Average Resolution Time</span>
                    <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 700 }}>3.4 Days</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>SLA Compliance Rate</span>
                    <span style={{ fontSize: '0.10b981', color: '#10b981', fontWeight: 700 }}>94.2%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Citizen Satisfaction Score</span>
                    <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 700 }}>4.7 / 5.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MY PANCHAYATH TAB ==================== */}
        {activeTab === 'my_panchayat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>My Panchayath</h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Assigned administrative location profile and jurisdiction details</p>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '20px' }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '16px', borderRadius: '12px', color: '#22c55e' }}>
                  <MapPin size={32} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>{user?.panchayat || 'Unassigned'}</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>{user?.district || ''} District, Kerala</p>
                </div>
              </div>

              <div className="user-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Local Body Type', value: user?.localBodyType || 'Grama Panchayath' },
                  { label: 'Panchayath Code', value: user?.panchayatCode || 'GC-PANCH-047' },
                  { label: 'District Jurisdiction', value: user?.district || 'Not Specified' },
                  { label: 'Registered Citizens', value: stats.totalCitizens || 0 },
                  { label: 'Total Logs Resolved', value: stats.resolvedComplaints || 0 },
                  { label: 'Active Announcements', value: announcements.filter(a => a.status === 'Active').length }
                ].map((item, i) => (
                  <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{item.label}</span>
                    <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 700 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SETTINGS TAB ==================== */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Settings</h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Configure your dashboard preferences and account credentials</p>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>Account Security</h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>Manage your account access password</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Logged In As</label>
                  <input type="text" readOnly value={user?.email || ''} className="complaints-search-input" style={{ width: '100%', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#f8fafc', color: '#64748b' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Account Authority Role</label>
                  <input type="text" readOnly value={user?.role?.replace('_', ' ').toUpperCase() || 'PANCHAYAT_ADMIN'} className="complaints-search-input" style={{ width: '100%', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#f8fafc', color: '#64748b' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Complaint Detail Modal */}
      {complaintModalOpen && selectedComplaint && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Complaint Details</h2>
              <button onClick={() => setComplaintModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'monospace' }}>{selectedComplaint.complaintId}</span>
                  <span className="status-pill" style={{ ...getStatusBadgeStyle(selectedComplaint.status), fontWeight: 800, padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem' }}>
                    {selectedComplaint.status}
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b', marginBottom: '4px' }}>{selectedComplaint.title}</div>
                <div style={{ fontSize: '0.82rem', color: '#4b5563', lineHeight: 1.6 }}>{selectedComplaint.description}</div>
              </div>

              <div className="user-details-grid">
                {[
                  { label: 'Category', value: selectedComplaint.category },
                  { label: 'AI Detected Category', value: selectedComplaint.aiCategory ? `🤖 ${selectedComplaint.aiCategory}` : selectedComplaint.category },
                  { label: 'Priority', value: selectedComplaint.priority || 'Normal' },
                  { label: 'District', value: selectedComplaint.district },
                  { label: 'Submitted By', value: selectedComplaint.anonymous ? 'Anonymous' : selectedComplaint.user?.fullName || '—' },
                  { label: 'Submitted On', value: formatDate(selectedComplaint.createdAt) },
                  { label: 'Department', value: selectedComplaint.assignedDepartment || 'Not Assigned' },
                ].map((item, i) => (
                  <div key={i} className="user-detail-item" style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <span className="user-detail-label">{item.label}</span>
                    <span className="user-detail-value">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Update status actions */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Update Status</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected'].map(s => (
                    <button
                      key={s}
                      onClick={() => handleUpdateComplaintStatus(selectedComplaint._id, s)}
                      style={{
                        padding: '7px 14px', borderRadius: '8px', border: `2px solid ${selectedComplaint.status === s ? getStatusBadgeStyle(s).color : '#e2e8f0'}`,
                        background: selectedComplaint.status === s ? getStatusBadgeStyle(s).backgroundColor : '#fff',
                        color: selectedComplaint.status === s ? getStatusBadgeStyle(s).color : '#64748b',
                        fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      {selectedComplaint.status === s && <Check size={12} />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button className="admin-btn secondary" onClick={() => setComplaintModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Create/Edit Modal */}
      {annModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container" style={{ maxWidth: '600px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                {annEditingItem ? 'Edit Announcement' : 'Create New Announcement'}
              </h3>
              <button onClick={() => setAnnModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Power Outage"
                  value={annFormTitle}
                  onChange={(e) => setAnnFormTitle(e.target.value)}
                  className="complaints-search-input"
                  style={{ width: '100%', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide details about the announcement..."
                  value={annFormDescription}
                  onChange={(e) => setAnnFormDescription(e.target.value)}
                  className="complaints-search-input"
                  style={{ width: '100%', border: '1px solid #cbd5e1', fontSize: '0.85rem', minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Category *</label>
                  <select
                    value={annFormCategory}
                    onChange={(e) => setAnnFormCategory(e.target.value)}
                    className="admin-select"
                    style={{ width: '100%', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
                  >
                    <option value="General">General</option>
                    <option value="Public Notice">Public Notice</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Road & Transport">Road & Transport</option>
                    <option value="Water">Water</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Health">Health</option>
                    <option value="Community">Community</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Priority *</label>
                  <select
                    value={annFormPriority}
                    onChange={(e) => setAnnFormPriority(e.target.value)}
                    className="admin-select"
                    style={{ width: '100%', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Expiry Date</label>
                  <input
                    type="date"
                    value={annFormExpiryDate}
                    onChange={(e) => setAnnFormExpiryDate(e.target.value)}
                    className="complaints-search-input"
                    style={{ width: '100%', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Image Attachment</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAnnFormAttachment(e.target.files[0])}
                    className="complaints-search-input"
                    style={{ width: '100%', border: '1px solid #cbd5e1', fontSize: '0.85rem', padding: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid #edf2f7', paddingTop: '16px' }}>
                <button type="button" className="admin-btn secondary" onClick={() => setAnnModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-btn primary" disabled={submittingAnn}>
                  {submittingAnn ? 'Saving...' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Details Modal */}
      {annDetailsOpen && selectedAnnItem && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container" style={{ maxWidth: '650px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>Announcement Details</h3>
              <button onClick={() => setAnnDetailsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span className={`badge-priority ${getPriorityClass(selectedAnnItem.priority)}`}>{selectedAnnItem.priority}</span>
                  <span className="status-pill" style={{ ...getStatusBadgeStyle(selectedAnnItem.status === 'Active' ? 'Resolved' : 'Rejected'), fontWeight: 700, padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem' }}>
                    {selectedAnnItem.status}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{selectedAnnItem.title}</h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedAnnItem.description}</p>
              </div>

              {selectedAnnItem.attachment && (
                <div style={{ textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', background: '#f8fafc' }}>
                  <img
                    src={selectedAnnItem.attachment.startsWith('http') ? selectedAnnItem.attachment : `http://localhost:5000${selectedAnnItem.attachment}`}
                    alt="Announcement attachment"
                    style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '8px', objectFit: 'contain' }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Publish Date</span>
                  <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>{formatDate(selectedAnnItem.publishDate || selectedAnnItem.createdAt)}</span>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Expiry Date</span>
                  <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>{selectedAnnItem.expiryDate ? formatDate(selectedAnnItem.expiryDate) : 'No expiry set'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid #edf2f7', paddingTop: '16px' }}>
                <button className="admin-btn secondary" onClick={() => setAnnDetailsOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline SVG menu icon helper
function Menu({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

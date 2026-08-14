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
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GramConnectIcon } from './GramConnectLogo';
import api from '../utils/api';
import './AdminDashboard.css';
import './UserDashboard.css';

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
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
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
            className={`sidebar-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => { setActiveTab('notifications'); setSidebarOpen(false); }}
          >
            <Bell size={18} />
            <span>Notifications</span>
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
                                <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>{c.category}</td>
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
                          <td>{c.category}</td>
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

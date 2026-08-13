import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Megaphone,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  ChevronDown,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserPlus,
  Plus,
  Activity,
  TrendingUp,
  Calendar,
  MapPin,
  Phone,
  UserCheck,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Trash2,
  FolderOpen,
  Sparkles,
  CheckCircle,
  Cpu,
  Layers,
  ShieldCheck,
  ExternalLink,
  Maximize2,
  ArrowLeft,
  Play,
  Pause,
  Edit3,
  Save,
  AlertCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GramConnectIcon } from './GramConnectLogo';
import api from '../utils/api';
import './UserDashboard.css';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user, logout: handleLogout } = useAuth();

  // Component states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#admin/complaints/')) return 'complaint-details';
    if (hash.startsWith('#admin/complaints')) return 'complaints';
    if (hash === '#admin/users') return 'users';
    if (hash === '#admin/community') return 'community';
    if (hash === '#admin/lost-found') return 'lost_found';
    return 'dashboard';
  });
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Dedicated notifications page state
  const [notifFilter, setNotifFilter] = useState('All');
  const [notifSearchQuery, setNotifSearchQuery] = useState('');
  const [notifCurrentPage, setNotifCurrentPage] = useState(1);

  // Toast notifier
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  // Live database stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    inProgress: 0,
    resolved: 0,
    totalUsers: 0
  });

  // Complaints arrays
  const [complaints, setComplaints] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [charts, setCharts] = useState({
    categoryDistribution: [],
    complaintTrends: []
  });

  // Users Management states
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({ totalUsers: 0, activeUsers: 0, blockedUsers: 0 });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userPanchayatFilter, setUserPanchayatFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);

  // Community Hub states
  const [posts, setPosts] = useState([]);
  const [postStats, setPostStats] = useState({ totalPosts: 0, pendingReview: 0, approvedPosts: 0, rejectedPosts: 0 });
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState(null);
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [postStatusFilter, setPostStatusFilter] = useState('');
  const [selectedPostDetails, setSelectedPostDetails] = useState(null);
  const [loadingPostDetails, setLoadingPostDetails] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);

  // Lost & Found states
  const [lostFoundItems, setLostFoundItems] = useState([]);
  const [loadingLostFound, setLoadingLostFound] = useState(false);
  const [lostFoundError, setLostFoundError] = useState(null);
  const [lostFoundSearchQuery, setLostFoundSearchQuery] = useState('');
  const [lostFoundTypeFilter, setLostFoundTypeFilter] = useState('All');
  const [lostFoundStatusFilter, setLostFoundStatusFilter] = useState('All');
  const [selectedLostFoundItem, setSelectedLostFoundItem] = useState(null);
  const [lostFoundModalOpen, setLostFoundModalOpen] = useState(false);


  // Filter States (Complaint Management)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Single Complaint Details States (Route: /admin/complaints/:id)
  const [viewingComplaintId, setViewingComplaintId] = useState(null);
  const [detailsComplaint, setDetailsComplaint] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsActivityLogs, setDetailsActivityLogs] = useState([]);
  const [detailsAdminNote, setDetailsAdminNote] = useState('');
  const [detailsDeptAssign, setDetailsDeptAssign] = useState('');
  const [detailsOfficerAssign, setDetailsOfficerAssign] = useState('');
  const [detailsCompletionDate, setDetailsCompletionDate] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Workspace subview states
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);

  const dropdownRef = useRef(null);
  const notificationsDropdownRef = useRef(null);

  // Sync hash routing on mount & window hashchange
  const handleHashRouting = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#admin/complaints/')) {
      const dbId = hash.substring(18); // length of '#admin/complaints/' is 18
      setViewingComplaintId(dbId);
      setActiveTab('complaint-details');
    } else if (hash === '#admin/complaints') {
      setViewingComplaintId(null);
      setActiveTab('complaints');
    } else if (hash === '#admin/notifications') {
      setViewingComplaintId(null);
      setActiveTab('notifications');
    } else if (hash === '#admin/users') {
      setViewingComplaintId(null);
      setActiveTab('users');
    } else if (hash === '#admin/community') {
      setViewingComplaintId(null);
      setActiveTab('community');
    } else if (hash === '#admin/lost-found') {
      setViewingComplaintId(null);
      setActiveTab('lost_found');
    } else {
      setViewingComplaintId(null);
      setActiveTab('dashboard');
    }
  };

  useEffect(() => {
    handleHashRouting();
    window.addEventListener('hashchange', handleHashRouting);
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLostFoundModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleHashRouting);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Fetch live statistics and all complaints
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch Stats
      const statsRes = await api.get('/admin/stats');
      if (statsRes.data && statsRes.data.success) {
        const data = statsRes.data;
        setStats({
          total: data.stats.total || 0,
          pending: data.stats.pending || 0,
          verified: data.stats.verified || 0,
          inProgress: data.stats.inProgress || 0,
          resolved: data.stats.resolved || 0,
          totalUsers: data.stats.activeUsers || 0
        });
        setRecentActivity(data.recentActivity || []);
        setCharts({
          categoryDistribution: data.charts.categoryDistribution || [],
          complaintTrends: data.charts.complaintTrends || []
        });
      }

      // 2. Fetch Complaints List
      const complaintsRes = await api.get('/admin/complaints');
      if (complaintsRes.data && complaintsRes.data.success) {
        setComplaints(complaintsRes.data.complaints || []);

        // Populate first 5 recent
        const formattedRecent = complaintsRes.data.complaints.slice(0, 5).map(c => ({
          id: c.complaintId,
          citizen: c.anonymous ? 'Anonymous Citizen' : (c.user?.fullName || 'Citizen'),
          category: c.category,
          status: c.status,
          priority: c.priority || 'Normal',
          date: new Date(c.createdAt).toISOString().split('T')[0]
        }));
        setRecentComplaints(formattedRecent);
      }
    } catch (err) {
      console.error('[DEV ERROR] Failed to synchronize dashboard with MongoDB:', err);
      setError(err.message || 'Failed to establish database synchronization with Panchayat Server.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const res = await api.get('/admin/users?limit=1000');
      if (res.data && res.data.success) {
        setUsers(res.data.users || []);
        if (res.data.stats) {
          setUserStats({
            totalUsers: res.data.stats.totalUsers || 0,
            activeUsers: res.data.stats.activeUsers || 0,
            blockedUsers: res.data.stats.blockedUsers || 0
          });
        }
      }
    } catch (err) {
      console.error('[DEV ERROR] Failed to load users:', err);
      setUsersError(err.message || 'Failed to retrieve users list.');
      showToast('Error fetching users from database.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    setLoadingUserDetails(true);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      if (res.data && res.data.success) {
        setSelectedUserDetails(res.data.user);
      }
    } catch (err) {
      console.error('Failed to load user details:', err);
      showToast('Failed to load user details.', 'error');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleBlockUser = async (userId, reason) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/block`, { reason });
      if (res.data && res.data.success) {
        showToast('User has been blocked successfully.');
        fetchUsers();
        if (selectedUserDetails && selectedUserDetails._id === userId) {
          fetchUserDetails(userId);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to block user.', 'error');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/unblock`);
      if (res.data && res.data.success) {
        showToast('User has been unblocked successfully.');
        fetchUsers();
        if (selectedUserDetails && selectedUserDetails._id === userId) {
          fetchUserDetails(userId);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to unblock user.', 'error');
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    setPostsError(null);
    try {
      const res = await api.get('/admin/community/posts');
      if (res.data && res.data.success) {
        setPosts(res.data.posts || []);
        if (res.data.stats) {
          setPostStats({
            totalPosts: res.data.stats.totalPosts || 0,
            pendingReview: res.data.stats.pendingReview || 0,
            approvedPosts: res.data.stats.approvedPosts || 0,
            rejectedPosts: res.data.stats.rejectedPosts || 0
          });
        }
      }
    } catch (err) {
      console.error('[DEV ERROR] Failed to load community posts:', err);
      setPostsError(err.message || 'Failed to retrieve posts from community hub.');
      showToast('Error fetching community posts.', 'error');
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      const res = await api.patch(`/admin/community/posts/${postId}/approve`);
      if (res.data && res.data.success) {
        showToast('Post approved successfully.');
        fetchPosts();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve post.', 'error');
    }
  };

  const handleRejectPost = async (postId) => {
    try {
      const res = await api.patch(`/admin/community/posts/${postId}/reject`);
      if (res.data && res.data.success) {
        showToast('Post rejected successfully.');
        fetchPosts();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject post.', 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to permanently delete this post?')) return;
    try {
      const res = await api.delete(`/admin/community/posts/${postId}`);
      if (res.data && res.data.success) {
        showToast('Post deleted successfully.');
        fetchPosts();
        if (selectedPostDetails && selectedPostDetails._id === postId) {
          setPostModalOpen(false);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete post.', 'error');
    }
  };

  const fetchLostFoundItems = async () => {
    setLoadingLostFound(true);
    setLostFoundError(null);
    try {
      const res = await api.get('/lost-found');
      if (res.data && res.data.success) {
        setLostFoundItems(res.data.items || []);
      }
    } catch (err) {
      console.error('[DEV ERROR] Failed to load lost/found items:', err);
      setLostFoundError(err.message || 'Failed to retrieve reports from Lost & Found database.');
      showToast('Error fetching Lost & Found database.', 'error');
    } finally {
      setLoadingLostFound(false);
    }
  };

  const handleResolveLostFound = async (itemId, status) => {
    try {
      const res = await api.put(`/lost-found/${itemId}`, { status });
      if (res.data && res.data.success) {
        showToast(`Item status updated to ${status}.`);
        fetchLostFoundItems();
        if (selectedLostFoundItem && selectedLostFoundItem._id === itemId) {
          setSelectedLostFoundItem(res.data.item);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update item status.', 'error');
    }
  };

  const handleDeleteLostFoundItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to permanently delete this report?')) return;
    try {
      const res = await api.delete(`/lost-found/${itemId}`);
      if (res.data && res.data.success) {
        showToast('Report deleted successfully.');
        fetchLostFoundItems();
        if (selectedLostFoundItem && selectedLostFoundItem._id === itemId) {
          setLostFoundModalOpen(false);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete report.', 'error');
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await api.get('/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications || []);
      }
      const countRes = await api.get('/notifications/unread-count');
      if (countRes.data && countRes.data.success) {
        setUnreadNotificationsCount(countRes.data.count || 0);
      }
      setLoadingNotifications(false);
    } catch (err) {
      console.warn('[DEV] Failed to load admin notifications:', err);
      setLoadingNotifications(false);
    }
  };

  // Real-time notifications via SSE
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    const eventSource = new EventSource(`http://localhost:5000/api/notifications/stream?token=${token}`);

    eventSource.addEventListener('notification', (event) => {
      try {
        const newNotif = JSON.parse(event.data);
        setNotifications((prev) => {
          if (prev.some((n) => n._id === newNotif._id)) return prev;
          return [newNotif, ...prev];
        });
        setUnreadNotificationsCount((prev) => prev + 1);

        // Refresh admin metrics and list in real-time
        fetchData();
      } catch (err) {
        console.error('[DEV] Failed to parse live SSE admin notification:', err);
      }
    });

    eventSource.addEventListener('error', (event) => {
      console.warn('[DEV] SSE Admin stream disconnected. Retrying...');
    });

    return () => {
      eventSource.close();
    };
  }, [user]);

  // Load notifications alongside stats
  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'complaints') {
      fetchNotifications();
    }
    if (activeTab === 'users') {
      fetchUsers();
    }
    if (activeTab === 'community') {
      fetchPosts();
    }
    if (activeTab === 'lost_found') {
      fetchLostFoundItems();
    }
  }, [activeTab]);

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
        showToast('All read notifications deleted successfully.', 'success');
      }
    } catch (err) {
      console.warn('[DEV] Failed to delete read notifications:', err);
    }
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
                  borderColor: notifFilter === opt ? '#3b82f6' : '#e2e8f0',
                  background: notifFilter === opt ? '#eff6ff' : '#ffffff',
                  color: notifFilter === opt ? '#3b82f6' : '#64748b',
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
            <span style={{ width: '32px', height: '32px', border: '3px solid #3b82f6', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite', display: 'inline-block' }} />
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

  // Fetch Details of a Single Complaint
  const fetchComplaintDetails = async (dbId) => {
    setDetailsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/complaints/${dbId}`);
      if (res.data && res.data.success) {
        const comp = res.data.complaint;
        setDetailsComplaint(comp);
        setDetailsActivityLogs(res.data.activityLogs || []);
        setDetailsAdminNote(comp.adminNote || comp.landmark || '');
        setDetailsDeptAssign(comp.assignedDepartment || '');
        setDetailsOfficerAssign(comp.assignedOfficer || '');
        setDetailsCompletionDate(comp.dueDate || '');
      }
    } catch (err) {
      console.error('[DEV ERROR] Failed to fetch complaint details:', err);
      setError(err.message || 'Failed to retrieve detailed logs for this complaint.');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'complaints') {
      fetchData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'complaint-details' && viewingComplaintId) {
      fetchComplaintDetails(viewingComplaintId);
    }
  }, [activeTab, viewingComplaintId]);

  const handleRefresh = () => {
    if (activeTab === 'complaint-details' && viewingComplaintId) {
      fetchComplaintDetails(viewingComplaintId);
    } else {
      fetchData();
    }
  };

  const handleExportComplaints = async () => {
    setIsExporting(true);
    try {
      const response = await api.get('/admin/complaints/export', {
        params: {
          search: searchQuery,
          status: statusFilter,
          category: categoryFilter,
          priority: priorityFilter,
          department: deptFilter,
          fromDate: startDate,
          toDate: endDate
        },
        responseType: 'blob'
      });

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `complaints-${dateStr}.csv`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Complaints exported successfully.', 'success');
    } catch (err) {
      console.error('[DEV ERROR] Export failed:', err);
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper: priority badge color mapper
  const getPriorityClass = (priority = 'Normal') => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'urgent';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'normal';
    }
  };

  // Helper: status badge color mapper
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

  // Close dropdowns if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAvatarDropdownOpen(false);
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target)) {
        setNotificationsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update status with confirmation
  const handleUpdateStatus = async (nextStatus) => {
    if (!detailsComplaint) return;
    if (!window.confirm(`Are you sure you want to mark this complaint status as "${nextStatus}"?`)) return;

    try {
      const payload = { status: nextStatus };
      if (detailsAdminNote) payload.adminNote = detailsAdminNote;
      if (detailsDeptAssign) payload.assignedDepartment = detailsDeptAssign;

      const res = await api.put(`/admin/complaints/${detailsComplaint._id}`, payload);
      if (res.data && res.data.success) {
        setDetailsComplaint(res.data.complaint);
        fetchComplaintDetails(detailsComplaint._id);
        showToast(`Complaint status updated to ${nextStatus}`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update complaint status', 'error');
    }
  };

  // Route/Assign Department with confirm prompt
  const handleAssignDeptSubmit = async () => {
    if (!detailsComplaint) return;
    if (!detailsDeptAssign || detailsDeptAssign === 'Not Assigned') {
      alert('Please select a valid department from the dropdown list.');
      return;
    }
    if (!window.confirm(`Confirm routing this issue to the "${detailsDeptAssign}" department? This will automatically advance the status to "Assigned".`)) return;

    try {
      const res = await api.put(`/admin/complaints/${detailsComplaint._id}`, {
        assignedDepartment: detailsDeptAssign,
        assignedOfficer: detailsOfficerAssign,
        dueDate: detailsCompletionDate,
        adminNote: detailsAdminNote,
        status: 'Assigned'
      });
      if (res.data && res.data.success) {
        setDetailsComplaint(res.data.complaint);
        fetchComplaintDetails(detailsComplaint._id);
        showToast('Department assigned successfully.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to route department', 'error');
    }
  };

  // Save admin internal notes
  const handleSaveNotes = async () => {
    if (!detailsComplaint) return;
    try {
      const res = await api.put(`/admin/complaints/${detailsComplaint._id}`, {
        adminNote: detailsAdminNote,
        assignedOfficer: detailsOfficerAssign,
        dueDate: detailsCompletionDate,
        assignedDepartment: detailsDeptAssign
      });
      if (res.data && res.data.success) {
        setDetailsComplaint(res.data.complaint);
        setIsEditingNote(false);
        showToast('Administrative details saved successfully.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save admin notes', 'error');
    }
  };

  // Delete complaint report
  const handleDeleteReport = async () => {
    if (!detailsComplaint) return;
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this complaint report? This action is irreversible.')) return;

    try {
      const res = await api.delete(`/admin/complaints/${detailsComplaint._id}`);
      if (res.data && res.data.success) {
        showToast('Complaint deleted successfully.', 'success');
        window.location.hash = '#admin/complaints';
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete report', 'error');
    }
  };

  const handleApplyNoteTemplate = (templateText) => {
    setDetailsAdminNote(templateText);
    setIsEditingNote(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCategoryFilter('');
    setPriorityFilter('');
    setDeptFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Client-Side Search Filters
  const filteredComplaints = complaints.filter((c) => {
    if (searchQuery) {
      const cleanSearch = searchQuery.toLowerCase();
      const matchId = c.complaintId.toLowerCase().includes(cleanSearch);
      const matchTitle = c.title.toLowerCase().includes(cleanSearch);
      const matchCitizen = c.anonymous ? false : c.user?.fullName?.toLowerCase().includes(cleanSearch);
      const matchPhone = c.anonymous ? false : c.user?.mobile?.includes(cleanSearch);
      if (!matchId && !matchTitle && !matchCitizen && !matchPhone) return false;
    }
    if (statusFilter && c.status !== statusFilter) return false;
    if (categoryFilter && c.category !== categoryFilter) return false;
    if (priorityFilter && (c.priority || 'Normal') !== priorityFilter) return false;
    if (deptFilter && c.assignedDepartment !== deptFilter) return false;
    if (startDate) {
      const start = new Date(startDate);
      const record = new Date(c.createdAt);
      if (record < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const record = new Date(c.createdAt);
      if (record > end) return false;
    }
    return true;
  });

  // Client-Side Pagination
  const totalRows = filteredComplaints.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentComplaints = filteredComplaints.slice(indexOfFirstRow, indexOfLastRow);

  // SVG Chart parameters
  const circ = 282.74;
  const statTotal = stats.total || 1;
  const pendingDash = (stats.pending / statTotal) * circ;
  const progressDash = (stats.inProgress / statTotal) * circ;
  const resolvedDash = (stats.resolved / statTotal) * circ;
  const verifiedDash = (stats.verified / statTotal) * circ;

  const getTrendLineCoordinates = () => {
    if (!charts.complaintTrends || charts.complaintTrends.length === 0) {
      return { path: 'M 30 120 L 280 120', points: [] };
    }
    const maxVal = Math.max(...charts.complaintTrends.map(t => t.count), 1);
    const startX = 30;
    const endX = 280;
    const spacingX = (endX - startX) / (charts.complaintTrends.length - 1 || 1);
    const startY = 120;
    const endY = 20;

    const points = charts.complaintTrends.map((t, idx) => {
      const x = startX + idx * spacingX;
      const ratio = t.count / maxVal;
      const y = startY - ratio * (startY - endY);
      return { x, y, count: t.count, month: t.month };
    });

    const path = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return { path, points };
  };

  const lineChartData = getTrendLineCoordinates();

  const getCategoryBars = () => {
    if (!charts.categoryDistribution || charts.categoryDistribution.length === 0) {
      return [];
    }
    const topCategories = charts.categoryDistribution.slice(0, 5);
    const maxVal = Math.max(...topCategories.map(c => c.count), 1);

    return topCategories.map((c, idx) => {
      const barHeight = Math.max(4, (c.count / maxVal) * 90);
      const barY = 120 - barHeight;
      const startX = 50 + idx * 52;
      return {
        x: startX,
        y: barY,
        height: barHeight,
        count: c.count,
        label: c.category.split(' ')[0]
      };
    });
  };

  const barChartData = getCategoryBars();

  return (
    <div className="dashboard-wrapper">
      {/* Dynamic Toast Alerts Container */}
      <div className="toasts-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
            {toast.type === 'error' ? <Sparkles size={16} color="#ef4444" /> : <CheckCircle size={16} color="#22c55e" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Top Header */}
      <header className="dash-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          <a href="/#admin" className="dash-navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GramConnectIcon size={32} />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              GramConnect <span style={{ fontSize: '0.68rem', background: '#3b82f6', color: '#ffffff', padding: '2px 8px', borderRadius: '99px', verticalAlign: 'middle', textTransform: 'uppercase', fontWeight: 700 }}>Admin Console</span>
            </span>
          </a>
        </div>

        {/* Profile menu */}
        <div className="dash-nav-actions">
          <div style={{ position: 'relative' }} ref={notificationsDropdownRef}>
            <button
              className="btn-nav-action"
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

            {/* Admin Notifications Dropdown */}
            {notificationsDropdownOpen && (
              <div className="notifications-dropdown-menu" style={{ position: 'absolute', top: '48px', right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1020, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: '320px', maxWidth: '360px' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-dark)' }}>Admin Notifications</span>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      style={{ fontSize: '0.75rem', color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {loadingNotifications ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '20px', height: '20px', border: '2px solid #3b82f6', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite' }} />
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
                              window.location.hash = `#admin/complaints/${compId}`;
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
                      window.location.hash = '#admin/notifications';
                      setNotificationsDropdownOpen(false);
                    }}
                    style={{ color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    View All Notifications <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div className="nav-user-profile" style={{ cursor: 'pointer' }} onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}>
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.fullName}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-light)' }}
                />
              ) : (
                <div className="avatar-placeholder" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
                  {(user?.fullName || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="nav-user-info">
                <span className="nav-user-name">{user?.fullName || 'Panchayat Admin'}</span>
                <span className="nav-user-role" style={{ color: '#3b82f6', textTransform: 'capitalize' }}>
                  {user?.role || 'Panchayat Administrator'}
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
        <div className="sidebar-menu">
          <button
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#admin'; setActiveTab('dashboard'); }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'complaints' || activeTab === 'complaint-details' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#admin/complaints'; setActiveTab('complaints'); }}
          >
            <AlertTriangle size={18} />
            <span>Complaints</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#admin/users'; setActiveTab('users'); }}
          >
            <Users size={18} />
            <span>Users</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#admin/community'; setActiveTab('community'); }}
          >
            <Activity size={18} />
            <span>Community Hub</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === 'lost_found' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#admin/lost-found'; setActiveTab('lost_found'); }}
          >
            <Tag size={18} />
            <span>Lost & Found</span>
          </button>
          <button className="sidebar-item" style={{ cursor: 'not-allowed', opacity: 0.8 }}>
            <Megaphone size={18} />
            <span>Announcements</span>
          </button>
          <button className="sidebar-item" style={{ cursor: 'not-allowed', opacity: 0.8 }}>
            <TrendingUp size={18} />
            <span>Analytics</span>
          </button>
          <button className="sidebar-item" style={{ cursor: 'not-allowed', opacity: 0.8 }}>
            <SettingsIcon size={18} />
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

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Container */}
      <main className="dash-main" style={{ animation: 'fadeIn 0.4s ease-out' }}>

        {/* ==========================================
            VIEW NOTIFICATIONS: DEDICATED NOTIFICATIONS PAGE
            ========================================== */}
        {activeTab === 'notifications' && renderNotificationsPage(true)}

        {/* ==========================================
            VIEW C: USERS MANAGEMENT PAGE
            ========================================== */}
        {activeTab === 'users' && (() => {
          const uniquePanchayats = [...new Set(users.map(u => u.panchayat).filter(Boolean))];
          const filteredUsers = users.filter(u => {
            const matchesSearch = !userSearchQuery ||
              u.fullName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
              u.email?.toLowerCase().includes(userSearchQuery.toLowerCase());
            const matchesPanchayat = !userPanchayatFilter || u.panchayat === userPanchayatFilter;
            const matchesStatus = !userStatusFilter || u.status?.toLowerCase() === userStatusFilter.toLowerCase();
            return matchesSearch && matchesPanchayat && matchesStatus;
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="admin-flex-row" style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-dark)' }}>Users Management</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Manage registered citizens and account access.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="admin-btn secondary" style={{ gap: '6px', height: '40px' }} onClick={fetchUsers}>
                    <RefreshCw size={14} className={loadingUsers ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>
              </div>

              {/* Statistics Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div className="compact-stat-card">
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Total Users</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px', lineHeight: 1.1 }}>{userStats.totalUsers}</div>
                  </div>
                </div>

                <div className="compact-stat-card">
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f0fdf4', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Active Users</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#166534', marginTop: '2px', lineHeight: 1.1 }}>{userStats.activeUsers}</div>
                  </div>
                </div>

                <div className="compact-stat-card">
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fef2f2', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Blocked Users</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#991b1b', marginTop: '2px', lineHeight: 1.1 }}>{userStats.blockedUsers}</div>
                  </div>
                </div>
              </div>

              {/* Unified Filter Toolbar */}
              <div className="unified-filter-toolbar">
                <div className="search-input-wrapper" style={{ flex: 2, minWidth: '240px' }}>
                  <Search size={16} className="search-icon" style={{ top: '12px' }} />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="complaints-search-input"
                    style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: '160px' }}>
                  <select
                    value={userPanchayatFilter}
                    onChange={(e) => setUserPanchayatFilter(e.target.value)}
                    className="admin-select"
                    style={{ fontSize: '0.85rem', width: '100%', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    <option value="">All Panchayats</option>
                    {uniquePanchayats.map(panchayat => (
                      <option key={panchayat} value={panchayat}>{panchayat}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: '160px' }}>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="admin-select"
                    style={{ fontSize: '0.85rem', width: '100%', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>

                <button
                  className="admin-btn secondary"
                  onClick={() => {
                    setUserSearchQuery('');
                    setUserPanchayatFilter('');
                    setUserStatusFilter('');
                  }}
                  style={{ fontSize: '0.82rem', fontWeight: 700, padding: '0 16px', background: '#f1f5f9' }}
                >
                  Clear Filters
                </button>
              </div>

              {/* Loading / Error / Content State */}
              {loadingUsers ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--text-muted)' }}>Retrieving citizen profiles from Panchayat database...</p>
                </div>
              ) : usersError ? (
                <div className="chart-card" style={{ padding: '40px', textAlign: 'center', borderColor: '#fecaca' }}>
                  <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: '12px' }} />
                  <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Database Synchronization Error</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0 16px' }}>{usersError}</p>
                  <button className="admin-btn primary" onClick={fetchUsers}>Retry Fetching</button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="chart-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
                  <FolderOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                  <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>No Citizens Found</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px', marginBottom: '16px' }}>
                    {users.length === 0 ? 'The citizen database is currently empty.' : 'No users match the active search filters.'}
                  </p>
                  {(userSearchQuery || userPanchayatFilter || userStatusFilter) && (
                    <button
                      className="admin-btn secondary"
                      onClick={() => {
                        setUserSearchQuery('');
                        setUserPanchayatFilter('');
                        setUserStatusFilter('');
                      }}
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="chart-card" style={{ padding: 0, overflowX: 'auto', border: '1px solid #edf2f7', borderRadius: '12px' }}>
                  <table className="admin-table-clean" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: '24px', textAlign: 'left' }}>USER</th>
                        <th style={{ textAlign: 'left' }}>EMAIL</th>
                        <th style={{ textAlign: 'left' }}>PHONE</th>
                        <th style={{ textAlign: 'left' }}>STATUS</th>
                        <th style={{ textAlign: 'right', paddingRight: '24px' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => {
                        return (
                          <tr key={u._id}>
                            <td style={{ paddingLeft: '24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {u.profilePicture ? (
                                  <img
                                    src={u.profilePicture.startsWith('http') ? u.profilePicture : `http://localhost:5000${u.profilePicture}`}
                                    alt={u.fullName}
                                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div className="user-avatar-initials" style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}>
                                    {u.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{u.fullName}</span>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{u.role || 'citizen'}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.82rem', color: '#475569' }}>{u.email}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.85rem', color: '#1e293b' }}>{u.mobile || 'Not provided'}</span>
                            </td>
                            <td>
                              <span className={`badge-status ${(u.status || 'Active').toLowerCase()}`}>
                                {u.status || 'Active'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                  className="admin-btn secondary"
                                  style={{ padding: '0 12px', fontSize: '0.78rem', height: '32px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
                                  onClick={() => {
                                    setSelectedUserDetails(null);
                                    setUserModalOpen(true);
                                    fetchUserDetails(u._id);
                                  }}
                                >
                                  <Eye size={12} /> View Details
                                </button>
                                {u.status?.toLowerCase() === 'blocked' ? (
                                  <button
                                    className="admin-btn primary"
                                    style={{ padding: '0 12px', fontSize: '0.78rem', height: '32px', display: 'inline-flex', alignItems: 'center', background: '#ecfdf5', color: '#10b981' }}
                                    onClick={() => handleUnblockUser(u._id)}
                                  >
                                    Unblock
                                  </button>
                                ) : (
                                  <button
                                    className="admin-btn danger"
                                    style={{ padding: '0 12px', fontSize: '0.78rem', height: '32px', display: 'inline-flex', alignItems: 'center', background: '#fee2e2', color: '#ef4444' }}
                                    onClick={() => {
                                      const reason = prompt('Please enter a reason for blocking this user (optional):');
                                      if (reason !== null) {
                                        handleBlockUser(u._id, reason);
                                      }
                                    }}
                                  >
                                    Block
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}


        {/* ==========================================
            VIEW D: COMMUNITY HUB MANAGEMENT PAGE
            ========================================== */}
        {activeTab === 'community' && (() => {
          const filteredPosts = posts.filter(post => {
            const matchesSearch = !postSearchQuery ||
              post.caption?.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
              post.user?.fullName?.toLowerCase().includes(postSearchQuery.toLowerCase());
            const matchesStatus = !postStatusFilter || post.status === postStatusFilter;
            return matchesSearch && matchesStatus;
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="admin-flex-row" style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-dark)' }}>Community Hub</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Manage community posts and guidelines.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="admin-btn secondary" style={{ gap: '6px', height: '40px' }} onClick={fetchPosts}>
                    <RefreshCw size={14} className={loadingPosts ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>
              </div>

              {/* Statistics Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                <div className="compact-stat-card">
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Total Posts</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px', lineHeight: 1.1 }}>{postStats.totalPosts}</div>
                  </div>
                </div>

                <div className="compact-stat-card">
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fffbeb', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Pending</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#b45309', marginTop: '2px', lineHeight: 1.1 }}>{postStats.pendingReview}</div>
                  </div>
                </div>

                <div className="compact-stat-card">
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f0fdf4', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Approved</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#166534', marginTop: '2px', lineHeight: 1.1 }}>{postStats.approvedPosts}</div>
                  </div>
                </div>

                <div className="compact-stat-card">
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fef2f2', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Rejected</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#991b1b', marginTop: '2px', lineHeight: 1.1 }}>{postStats.rejectedPosts}</div>
                  </div>
                </div>
              </div>

              {/* Unified Filter Toolbar */}
              <div className="unified-filter-toolbar">
                <div className="search-input-wrapper" style={{ flex: 2, minWidth: '240px' }}>
                  <Search size={16} className="search-icon" style={{ top: '12px' }} />
                  <input
                    type="text"
                    placeholder="Search by caption or author name..."
                    value={postSearchQuery}
                    onChange={(e) => setPostSearchQuery(e.target.value)}
                    className="complaints-search-input"
                    style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: '160px' }}>
                  <select
                    value={postStatusFilter}
                    onChange={(e) => setPostStatusFilter(e.target.value)}
                    className="admin-select"
                    style={{ fontSize: '0.85rem', width: '100%', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <button
                  className="admin-btn secondary"
                  onClick={() => {
                    setPostSearchQuery('');
                    setPostStatusFilter('');
                  }}
                  style={{ fontSize: '0.82rem', fontWeight: 700, padding: '0 16px', background: '#f1f5f9' }}
                >
                  Clear Filters
                </button>
              </div>

              {/* Loading / Error / Empty States */}
              {loadingPosts ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--text-muted)' }}>Retrieving community posts from database...</p>
                </div>
              ) : postsError ? (
                <div className="chart-card" style={{ padding: '40px', textAlign: 'center', borderColor: '#fecaca' }}>
                  <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: '12px' }} />
                  <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Database Synchronization Error</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0 16px' }}>{postsError}</p>
                  <button className="admin-btn primary" onClick={fetchPosts}>Retry Fetching</button>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="chart-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
                  <FolderOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                  <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>No Posts Found</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px', marginBottom: '16px' }}>
                    {posts.length === 0 ? 'The community hub database is currently empty.' : 'No posts match the active search filters.'}
                  </p>
                  {(postSearchQuery || postStatusFilter) && (
                    <button
                      className="admin-btn secondary"
                      onClick={() => {
                        setPostSearchQuery('');
                        setPostStatusFilter('');
                      }}
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="community-grid">
                  {filteredPosts.map(post => {
                    const postImage = post.image ? (post.image.startsWith('http') ? post.image : `http://localhost:5000${post.image}`) : null;
                    return (
                      <div key={post._id} className="post-card">
                        {postImage ? (
                          <img src={postImage} alt="post media" className="post-card-img" />
                        ) : (
                          <div style={{ height: '180px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <FolderOpen size={48} />
                          </div>
                        )}
                        <div className="post-card-body">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                              Category: {post.category || 'General'}
                            </span>
                            <span className={`badge-status ${(post.status || 'Pending').toLowerCase()}`}>
                              {post.status || 'Pending'}
                            </span>
                          </div>
                          <p className="post-card-caption" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {post.caption}
                          </p>
                          <div style={{ marginTop: 'auto', borderTop: '1px solid #edf2f7', paddingTop: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>
                              <span>By: <strong>{post.user?.fullName || 'Citizen'}</strong></span>
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
                              <span>👍 {post.likes || 0} Likes</span>
                              <span>💬 {post.commentsCount || post.comments?.length || 0} Comments</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #edf2f7', paddingTop: '12px' }}>
                            <button
                              className="admin-btn secondary"
                              style={{ flex: 1, padding: '0 8px', fontSize: '0.75rem', height: '32px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                              onClick={() => {
                                setSelectedPostDetails(post);
                                setPostModalOpen(true);
                              }}
                            >
                              Details
                            </button>
                            {post.status === 'Pending' && (
                              <>
                                <button
                                  className="admin-btn primary"
                                  style={{ flex: 1, padding: '0 8px', fontSize: '0.75rem', height: '32px', background: '#ecfdf5', color: '#10b981' }}
                                  onClick={() => handleApprovePost(post._id)}
                                >
                                  Approve
                                </button>
                                <button
                                  className="admin-btn danger"
                                  style={{ flex: 1, padding: '0 8px', fontSize: '0.75rem', height: '32px', background: '#fee2e2', color: '#ef4444' }}
                                  onClick={() => handleRejectPost(post._id)}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              className="admin-btn danger"
                              style={{ padding: '0 8px', fontSize: '0.75rem', height: '32px', background: '#fee2e2', color: '#ef4444' }}
                              onClick={() => handleDeletePost(post._id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}


        {/* ==========================================
            VIEW E: LOST & FOUND MANAGEMENT PAGE
            ========================================== */}
        {activeTab === 'lost_found' && (() => {
          const filteredItems = lostFoundItems.filter(item => {
            const matchesSearch = !lostFoundSearchQuery ||
              item.itemName?.toLowerCase().includes(lostFoundSearchQuery.toLowerCase()) ||
              item.description?.toLowerCase().includes(lostFoundSearchQuery.toLowerCase()) ||
              item.location?.toLowerCase().includes(lostFoundSearchQuery.toLowerCase());
            const matchesType = lostFoundTypeFilter === 'All' || item.type === lostFoundTypeFilter;
            const matchesStatus = lostFoundStatusFilter === 'All' || item.status === lostFoundStatusFilter;
            return matchesSearch && matchesType && matchesStatus;
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="admin-flex-row" style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-dark)' }}>Lost & Found Reports</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Manage community reports of lost and found items.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="admin-btn secondary" style={{ gap: '6px', height: '40px' }} onClick={fetchLostFoundItems}>
                    <RefreshCw size={14} className={loadingLostFound ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>
              </div>

              {/* Unified Filter Toolbar */}
              <div className="unified-filter-toolbar">
                <div className="search-input-wrapper" style={{ flex: 2, minWidth: '240px' }}>
                  <Search size={16} className="search-icon" style={{ top: '12px' }} />
                  <input
                    type="text"
                    placeholder="Search by item name or location..."
                    value={lostFoundSearchQuery}
                    onChange={(e) => setLostFoundSearchQuery(e.target.value)}
                    className="complaints-search-input"
                    style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: '160px' }}>
                  <select
                    value={lostFoundTypeFilter}
                    onChange={(e) => setLostFoundTypeFilter(e.target.value)}
                    className="admin-select"
                    style={{ fontSize: '0.85rem', width: '100%', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    <option value="All">All Types</option>
                    <option value="Lost">Lost</option>
                    <option value="Found">Found</option>
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: '160px' }}>
                  <select
                    value={lostFoundStatusFilter}
                    onChange={(e) => setLostFoundStatusFilter(e.target.value)}
                    className="admin-select"
                    style={{ fontSize: '0.85rem', width: '100%', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <button
                  className="admin-btn secondary"
                  onClick={() => {
                    setLostFoundSearchQuery('');
                    setLostFoundTypeFilter('All');
                    setLostFoundStatusFilter('All');
                  }}
                  style={{ fontSize: '0.82rem', fontWeight: 700, padding: '0 16px', background: '#f1f5f9' }}
                >
                  Clear Filters
                </button>
              </div>

              {/* Loading / Error / Content State */}
              {loadingLostFound ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--text-muted)' }}>Retrieving Lost & Found records...</p>
                </div>
              ) : lostFoundError ? (
                <div className="chart-card" style={{ padding: '40px', textAlign: 'center', borderColor: '#fecaca' }}>
                  <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: '12px' }} />
                  <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Database Synchronization Error</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0 16px' }}>{lostFoundError}</p>
                  <button className="admin-btn primary" onClick={fetchLostFoundItems}>Retry Fetching</button>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="chart-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
                  <FolderOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                  <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>No Reports Found</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px', marginBottom: '16px' }}>
                    {lostFoundItems.length === 0 ? 'No lost or found items have been reported.' : 'No items match the active search filters.'}
                  </p>
                </div>
              ) : (
                <div className="chart-card" style={{ padding: 0, overflowX: 'auto', border: '1px solid #edf2f7', borderRadius: '12px' }}>
                  <table className="admin-table-clean" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: '24px', textAlign: 'left' }}>Item</th>
                        <th style={{ textAlign: 'left' }}>Type</th>
                        <th style={{ textAlign: 'left' }}>Posted By</th>
                        <th style={{ textAlign: 'left' }}>Location</th>
                        <th style={{ textAlign: 'left' }}>Status</th>
                        <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map(item => {
                        const isLost = item.type === 'Lost';
                        const itemImage = item.image ? (item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`) : null;
                        return (
                          <tr key={item._id}>
                            <td style={{ paddingLeft: '24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {itemImage ? (
                                  <img src={itemImage} alt={item.itemName} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                    <FolderOpen size={16} />
                                  </div>
                                )}
                                <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{item.itemName}</span>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: isLost ? '#fee2e2' : '#d1fae5',
                                color: isLost ? '#ef4444' : '#10b981'
                              }}>{item.type}</span>
                            </td>
                            <td>{item.user?.fullName || 'Citizen'}</td>
                            <td>{item.location}</td>
                            <td>
                              {(() => {
                                const norm = item.status === 'Active' ? 'LOST' : item.status === 'Resolved' ? 'RETURNED' : (item.status || 'LOST').toUpperCase();
                                let bg = '#fee2e2', fg = '#ef4444'; // LOST
                                if (norm === 'FOUND') { bg = '#d1fae5'; fg = '#10b981'; }
                                else if (norm === 'RETURNED') { bg = '#dbeafe'; fg = '#2563eb'; }
                                return (
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '9999px',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    background: bg,
                                    color: fg
                                  }}>{norm}</span>
                                );
                              })()}
                            </td>
                            <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                  className="admin-btn secondary"
                                  style={{ padding: '0 10px', fontSize: '0.75rem', height: '30px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
                                  onClick={() => {
                                    setSelectedLostFoundItem(item);
                                    setLostFoundModalOpen(true);
                                  }}
                                >
                                  Details
                                </button>
                                {item.status === 'Active' ? (
                                  <button
                                    className="admin-btn primary"
                                    style={{ padding: '0 10px', fontSize: '0.75rem', height: '30px', display: 'inline-flex', alignItems: 'center', background: '#ecfdf5', color: '#10b981' }}
                                    onClick={() => handleResolveLostFound(item._id, 'Resolved')}
                                  >
                                    Resolve
                                  </button>
                                ) : (
                                  <button
                                    className="admin-btn secondary"
                                    style={{ padding: '0 10px', fontSize: '0.75rem', height: '30px', display: 'inline-flex', alignItems: 'center', background: '#fffbeb', color: '#b45309' }}
                                    onClick={() => handleResolveLostFound(item._id, 'Active')}
                                  >
                                    Reopen
                                  </button>
                                )}
                                <button
                                  className="admin-btn danger"
                                  style={{ padding: '0 8px', fontSize: '0.75rem', height: '30px', display: 'inline-flex', alignItems: 'center', background: '#fee2e2', color: '#ef4444' }}
                                  onClick={() => handleDeleteLostFoundItem(item._id)}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}


        {/* ==========================================
            VIEW A: DASHBOARD HOME
            ========================================== */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="admin-flex-row" style={{ marginBottom: '8px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <Calendar size={12} /> {getTodayDate()}
                </h4>
              </div>
            </div>

            <div className="welcome-card" style={{ background: 'linear-gradient(135deg, #15803d 0%, #1e3a8a 100%)', marginBottom: '24px' }}>
              <div className="welcome-header">
                <h1 className="welcome-title">Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'} 👋</h1>
                <p className="welcome-subtitle">
                  Panchayat Digital Dashboard. Monitor live reports, route issues to local departments, and configure system parameters.
                </p>
              </div>
              <div className="welcome-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Panchayat Office</span>
                  <span className="detail-value">GramConnect Council Center</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Active SLA Limit</span>
                  <span className="detail-value">Normal: 7 Days | Critical: 2 Days</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">System Status</span>
                  <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }} /> Live & Operational
                  </span>
                </div>
              </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                <span className="stat-accent" style={{ background: '#3b82f6' }} />
                <div className="stat-info">
                  {isLoading ? <span className="skeleton-text-lg" /> : <span className="stat-number">{stats.total}</span>}
                  <span className="stat-label">Total Complaints</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-accent" style={{ background: '#ef4444' }} />
                <div className="stat-info">
                  {isLoading ? <span className="skeleton-text-lg" /> : <span className="stat-number">{stats.pending}</span>}
                  <span className="stat-label">Pending</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-accent" style={{ background: '#3b82f6' }} />
                <div className="stat-info">
                  {isLoading ? <span className="skeleton-text-lg" /> : <span className="stat-number">{stats.verified}</span>}
                  <span className="stat-label">Verified</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-accent" style={{ background: '#f59e0b' }} />
                <div className="stat-info">
                  {isLoading ? <span className="skeleton-text-lg" /> : <span className="stat-number">{stats.inProgress}</span>}
                  <span className="stat-label">In Progress</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-accent" style={{ background: '#10b981' }} />
                <div className="stat-info">
                  {isLoading ? <span className="skeleton-text-lg" /> : <span className="stat-number">{stats.resolved}</span>}
                  <span className="stat-label">Resolved</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-accent" style={{ background: '#64748b' }} />
                <div className="stat-info">
                  {isLoading ? <span className="skeleton-text-lg" /> : <span className="stat-number">{stats.totalUsers}</span>}
                  <span className="stat-label">Total Users</span>
                </div>
              </div>
            </div>

            <div className="dashboard-grid-2col">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div className="section-container">
                  <div className="admin-flex-row">
                    <h2 className="section-title">Recent Complaints Registry</h2>
                    <a
                      href="/admin/complaints"
                      className="admin-btn secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      onClick={(e) => { e.preventDefault(); window.location.hash = '#admin/complaints'; }}
                    >
                      View All
                    </a>
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
                          {isLoading ? (
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
                              <td colSpan="6" className="empty-table-state">No complaints logged in database</td>
                            </tr>
                          ) : (
                            recentComplaints.map((c, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{c.id}</td>
                                <td style={{ fontWeight: 700 }}>{c.citizen}</td>
                                <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>{c.category}</td>
                                <td>
                                  <span className="status-pill" style={{ ...getStatusBadgeStyle(c.status), fontWeight: 700, padding: '4px 8px', borderRadius: '9999px', fontSize: '0.72rem' }}>
                                    {c.status}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge-priority ${getPriorityClass(c.priority)}`}>
                                    {c.priority}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{c.date}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="section-container">
                  <h2 className="section-title">Visual Analytics Summary</h2>
                  <div className="analytics-grid-row">
                    <div className="chart-card">
                      <div className="chart-title-container">
                        <h4 className="chart-title" style={{ fontSize: '0.82rem' }}>Monthly Complaints Trend</h4>
                      </div>
                      <div className="chart-svg-container" style={{ height: '160px' }}>
                        {isLoading ? (
                          <div className="skeleton-text" style={{ width: '100%', height: '120px' }} />
                        ) : (
                          <svg width="100%" height="150" viewBox="0 0 300 150" style={{ overflow: 'visible' }}>
                            <line x1="30" y1="10" x2="280" y2="10" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="30" y1="50" x2="280" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="30" y1="90" x2="280" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="30" y1="120" x2="280" y2="120" stroke="#cbd5e1" strokeWidth="1.5" />
                            <line x1="30" y1="10" x2="30" y2="120" stroke="#cbd5e1" strokeWidth="1.5" />
                            <path d={lineChartData.path} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                            {lineChartData.points.map((p, idx) => (
                              <g key={idx}>
                                <circle cx={p.x} cy={p.y} r="4.5" fill="#2563eb" className="chart-line-point" />
                                <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1e3a8a">{p.count}</text>
                                <text x={p.x} y="136" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="600">{p.month}</text>
                              </g>
                            ))}
                          </svg>
                        )}
                      </div>
                    </div>

                    <div className="chart-card">
                      <div className="chart-title-container">
                        <h4 className="chart-title" style={{ fontSize: '0.82rem' }}>Category Distribution</h4>
                      </div>
                      <div className="chart-svg-container" style={{ height: '160px' }}>
                        {isLoading ? (
                          <div className="skeleton-text" style={{ width: '100%', height: '120px' }} />
                        ) : (
                          <svg width="100%" height="150" viewBox="0 0 300 150" style={{ overflow: 'visible' }}>
                            <line x1="30" y1="120" x2="280" y2="120" stroke="#cbd5e1" strokeWidth="1.5" />
                            {barChartData.map((b, idx) => (
                              <g key={idx}>
                                <rect x={b.x} y={b.y} width="20" height={b.height} fill="#16a34a" rx="2" className="chart-bar-rect" />
                                <text x={b.x + 10} y={b.y - 6} textAnchor="middle" fontSize="8" fontWeight="700" fill="#334155">{b.count}</text>
                                <text x={b.x + 10} y="134" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="600">{b.label}</text>
                              </g>
                            ))}
                          </svg>
                        )}
                      </div>
                    </div>

                    <div className="chart-card">
                      <div className="chart-title-container">
                        <h4 className="chart-title" style={{ fontSize: '0.82rem' }}>Status Breakdown</h4>
                      </div>
                      <div className="chart-svg-container" style={{ height: '160px' }}>
                        {isLoading ? (
                          <div className="skeleton-circle" style={{ width: '90px', height: '90px' }} />
                        ) : (
                          <svg width="100%" height="150" viewBox="0 0 150 150" style={{ overflow: 'visible' }}>
                            <circle cx="75" cy="70" r="45" fill="none" stroke="#e2e8f0" strokeWidth="18" />
                            {stats.pending > 0 && (
                              <circle cx="75" cy="70" r="45" fill="none" stroke="#ef4444" strokeWidth="18" strokeDasharray={`${pendingDash} ${circ}`} strokeDashoffset="0" />
                            )}
                            {stats.inProgress > 0 && (
                              <circle cx="75" cy="70" r="45" fill="none" stroke="#f59e0b" strokeWidth="18" strokeDasharray={`${progressDash} ${circ}`} strokeDashoffset={-pendingDash} />
                            )}
                            {stats.resolved > 0 && (
                              <circle cx="75" cy="70" r="45" fill="none" stroke="#10b981" strokeWidth="18" strokeDasharray={`${resolvedDash} ${circ}`} strokeDashoffset={-(pendingDash + progressDash)} />
                            )}
                            {stats.verified > 0 && (
                              <circle cx="75" cy="70" r="45" fill="none" stroke="#3b82f6" strokeWidth="18" strokeDasharray={`${verifiedDash} ${circ}`} strokeDashoffset={-(pendingDash + progressDash + resolvedDash)} />
                            )}
                            <circle cx="75" cy="70" r="24" fill="#ffffff" />
                            <text x="75" y="74" textAnchor="middle" fontSize="9" fontWeight="800" fill="#334155">Live SLA</text>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div className="section-container">
                  <h2 className="section-title">Administrative Actions</h2>
                  <div className="announcements-card" style={{ gap: '12px', padding: '20px' }}>
                    <button className="admin-btn primary" onClick={() => { window.location.hash = '#admin/complaints'; }} style={{ width: '100%', justifyContent: 'flex-start', background: '#3b82f6' }}>
                      <UserCheck size={16} /> Verify Civic Complaint
                    </button>
                    <button className="admin-btn secondary" onClick={() => { window.location.hash = '#admin/complaints'; }} style={{ width: '100%', justifyContent: 'flex-start' }}>
                      <ArrowRight size={16} /> Assign Department Routing
                    </button>
                    <button className="admin-btn secondary" style={{ width: '100%', justifyContent: 'flex-start', opacity: 0.6, cursor: 'not-allowed' }}>
                      <Plus size={16} /> Create Panchayat Announcement
                    </button>
                    <button className="admin-btn secondary" style={{ width: '100%', justifyContent: 'flex-start', opacity: 0.6, cursor: 'not-allowed' }}>
                      <Users size={16} /> Manage Citizen Accounts
                    </button>
                  </div>
                </div>

                <div className="section-container">
                  <h2 className="section-title">Recent Activity Logs</h2>
                  <div className="announcements-card" style={{ padding: '24px' }}>
                    <div className="timeline-container">
                      {isLoading ? (
                        [...Array(4)].map((_, i) => (
                          <div key={i} className="timeline-node" style={{ paddingBottom: '16px' }}>
                            <span className="timeline-circle" style={{ background: '#f1f5f9' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span className="skeleton-text" style={{ width: '120px' }} />
                              <span className="skeleton-text" style={{ width: '100%' }} />
                            </div>
                          </div>
                        ))
                      ) : recentActivity.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>No recent system activities logged.</div>
                      ) : (
                        recentActivity.slice(0, 4).map((act, i) => (
                          <div key={i} className="timeline-node">
                            <span className={`timeline-circle ${act.type === 'submitted' ? 'pending' : act.type === 'resolved' ? 'resolved' : 'progress'}`} />
                            <div className="timeline-meta">
                              <span className="timeline-title" style={{ textTransform: 'capitalize' }}>
                                {act.type === 'user' ? 'New User Registered' : `Complaint ${act.type}`}
                              </span>
                              <span className="timeline-time">
                                {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="timeline-desc">{act.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            VIEW B: COMPLAINT LIST TABLE
            ========================================== */}
        {activeTab === 'complaints' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="admin-flex-row" style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '20px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)' }}>Complaint Management</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>Monitor, verify, assign, and resolve citizen complaints.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="stat-card" style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Total: {filteredComplaints.length}</span>
                </div>
                <button className="admin-btn secondary" style={{ gap: '6px' }} onClick={handleRefresh}>
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
                </button>
                <button
                  className="admin-btn secondary"
                  style={{ gap: '6px' }}
                  onClick={handleExportComplaints}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={14} /> Export
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="chart-card" style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by ID, Citizen, Phone..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="complaints-search-input"
                    style={{ paddingLeft: '44px' }}
                  />
                </div>

                <div className="admin-input-group">
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="admin-select"
                    style={{ background: '#ffffff' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="admin-input-group">
                  <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                    className="admin-select"
                    style={{ background: '#ffffff' }}
                  >
                    <option value="">All Categories</option>
                    <option value="Road Damage">Road Damage</option>
                    <option value="Garbage">Garbage</option>
                    <option value="Water Supply">Water Supply</option>
                    <option value="Drainage">Drainage</option>
                    <option value="Street Light">Street Light</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Public Safety">Public Safety</option>
                    <option value="Traffic">Traffic</option>
                    <option value="Environment">Environment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="admin-input-group">
                  <select
                    value={priorityFilter}
                    onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                    className="admin-select"
                    style={{ background: '#ffffff' }}
                  >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="admin-input-group">
                  <select
                    value={deptFilter}
                    onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
                    className="admin-select"
                    style={{ background: '#ffffff' }}
                  >
                    <option value="">All Departments</option>
                    <option value="Road Department">Road Department</option>
                    <option value="Electricity Board">Electricity Board</option>
                    <option value="Water Authority">Water Authority</option>
                    <option value="Waste Management">Waste Management</option>
                    <option value="Health Department">Health Department</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="admin-input-group">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                    className="admin-input"
                    style={{ background: '#ffffff' }}
                  />
                </div>

                <div className="admin-input-group">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                    className="admin-input"
                    style={{ background: '#ffffff' }}
                  />
                </div>

                <button onClick={handleClearFilters} className="admin-btn secondary" style={{ justifySelf: 'start', height: '40px', padding: '0 16px' }}>
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="table-card">
              <div className="table-responsive-wrapper">
                <table className="complaints-table">
                  <thead>
                    <tr>
                      <th>Complaint ID</th>
                      <th>Citizen</th>
                      <th>Category</th>
                      <th>Department</th>
                      <th>Location</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Submitted Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      [...Array(rowsPerPage)].map((_, i) => (
                        <tr key={i}>
                          <td><span className="skeleton-row-cell" /></td>
                          <td><span className="skeleton-row-cell" /></td>
                          <td><span className="skeleton-row-cell" /></td>
                          <td><span className="skeleton-row-cell" /></td>
                          <td><span className="skeleton-row-cell" /></td>
                          <td><span className="skeleton-row-cell" /></td>
                          <td><span className="skeleton-row-cell" /></td>
                          <td><span className="skeleton-row-cell" /></td>
                          <td><span className="skeleton-row-cell" /></td>
                        </tr>
                      ))
                    ) : currentComplaints.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ border: 'none' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '16px' }}>
                            <FolderOpen size={48} style={{ color: '#94a3b8' }} />
                            <div style={{ textAlign: 'center' }}>
                              <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text-dark)' }}>No complaints found.</h3>
                              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Try refining filters.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentComplaints.map((c) => (
                        <tr key={c._id}>
                          <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{c.complaintId}</td>
                          <td>
                            {c.anonymous ? (
                              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 600 }}>Anonymous</span>
                            ) : (
                              <span style={{ fontWeight: 700 }}>{c.user?.fullName}</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>{c.category}</td>
                          <td style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>{c.assignedDepartment || 'Not Routed'}</td>
                          <td style={{ fontSize: '0.8rem', color: '#4b5563' }}>{c.city}, {c.ward || 'General'}</td>
                          <td>
                            <span className={`badge-priority ${getPriorityClass(c.priority)}`}>
                              {c.priority}
                            </span>
                          </td>
                          <td>
                            <span className="status-pill" style={{ ...getStatusBadgeStyle(c.status), fontWeight: 700, padding: '4px 8px', borderRadius: '9999px', fontSize: '0.72rem' }}>
                              {c.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                className="action-icon-btn edit"
                                title="View Details"
                                onClick={() => {
                                  window.location.hash = `#admin/complaints/${c._id}`;
                                }}
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {!isLoading && filteredComplaints.length > 0 && (
              <div className="admin-flex-row" style={{ justifyContent: 'space-between', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  <span>Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                    className="admin-select"
                    style={{ width: '70px', padding: '4px 8px', background: '#ffffff' }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <span>
                    Showing {indexOfFirstRow + 1} - {Math.min(indexOfLastRow, totalRows)} of {totalRows} records
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    className="admin-btn secondary"
                    style={{ padding: '6px 12px' }}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      className={`admin-btn ${currentPage === i + 1 ? 'primary' : 'secondary'}`}
                      style={{ padding: '6px 12px', minWidth: '36px' }}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    className="admin-btn secondary"
                    style={{ padding: '6px 12px' }}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Expanded details overlay removed per requirements */}
          </div>
        )}

        {/* ==========================================
            VIEW C: REDESIGNED COMPLAINT DETAILS PAGE
            ========================================== */}
        {activeTab === 'complaint-details' && (
          <div>
            {detailsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
                <span className="skeleton-text-lg" style={{ width: '200px' }} />
                <span className="skeleton-text" style={{ width: '100%', height: '140px' }} />
                <span className="skeleton-text" style={{ width: '80%' }} />
              </div>
            ) : !detailsComplaint ? (
              <div className="section-container" style={{ padding: '40px', textAlign: 'center' }}>
                <AlertTriangle size={32} style={{ color: '#ef4444', marginBottom: '16px' }} />
                <h2 style={{ fontWeight: 800 }}>Complaint Not Found</h2>
                <p style={{ color: 'var(--text-muted)' }}>Could not retrieve this complaint record from Panchayat server.</p>
                <button
                  className="admin-btn primary"
                  onClick={() => { window.location.hash = '#admin/complaints'; }}
                  style={{ marginTop: '16px' }}
                >
                  Back to Registry
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* PAGE HEADER */}
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <a
                      href="#admin/complaints"
                      onClick={(e) => { e.preventDefault(); window.location.hash = '#admin/complaints'; }}
                      style={{ fontSize: '0.88rem', fontWeight: 700, color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ArrowLeft size={16} /> Back to Complaints
                    </a>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '20px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Complaint ID</span>
                      <h1 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)', fontFamily: 'monospace' }}>
                        {detailsComplaint.complaintId}
                      </h1>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="status-pill" style={{ ...getStatusBadgeStyle(detailsComplaint.status), fontWeight: 800, padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem' }}>
                          {detailsComplaint.status}
                        </span>
                        <span className={`badge-priority ${getPriorityClass(detailsComplaint.priority)}`} style={{ borderRadius: '6px' }}>
                          {detailsComplaint.priority || 'Normal'}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                          Submitted: {new Date(detailsComplaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROW 1: Complaint Information & Citizen Information */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                  {/* Left: Complaint Information */}
                  <div className="workspace-panel">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
                      Complaint Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
                      <p><strong>Complaint Title:</strong> {detailsComplaint.title}</p>
                      <p><strong>Description:</strong> {detailsComplaint.description}</p>
                      <p><strong>Category:</strong> {detailsComplaint.category}</p>
                      <p><strong>Department:</strong> {detailsComplaint.assignedDepartment || 'Not Routed'}</p>
                      <p><strong>Complaint Type:</strong> Public Citizen Report</p>
                      <p><strong>Submitted Date:</strong> {new Date(detailsComplaint.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Right: Citizen Information */}
                  <div className="workspace-panel">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
                      Citizen Information
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                      {detailsComplaint.anonymous ? (
                        <>
                          <div className="avatar-placeholder" style={{ width: '48px', height: '48px', fontSize: '1.2rem', background: '#94a3b8' }}>A</div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Anonymous Citizen</h4>
                            <span className="insight-pill" style={{ marginTop: '2px', fontSize: '0.65rem' }}>Identity Masked</span>
                          </div>
                        </>
                      ) : (
                        <>
                          {detailsComplaint.user?.profilePicture ? (
                            <img src={detailsComplaint.user.profilePicture} alt="citizen" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6' }} />
                          ) : (
                            <div className="avatar-placeholder" style={{ width: '48px', height: '48px', fontSize: '1.2rem', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
                              {(detailsComplaint.user?.fullName || 'C').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>{detailsComplaint.user?.fullName}</h4>
                            <span className="insight-pill success" style={{ marginTop: '2px', fontSize: '0.65rem' }}>Verified Account</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                      {!detailsComplaint.anonymous ? (
                        <>
                          <p><strong>Full Name:</strong> {detailsComplaint.user?.fullName}</p>
                          <p><strong>Phone Number:</strong> {detailsComplaint.user?.mobile || '(not provided)'}</p>
                          <p><strong>Email:</strong> {detailsComplaint.user?.email}</p>
                          <p><strong>Address:</strong> {detailsComplaint.user?.address || '(not configured)'}</p>
                          <p><strong>District / Panchayat / Ward:</strong> {detailsComplaint.district} / {detailsComplaint.city} / {detailsComplaint.ward || 'General'}</p>
                        </>
                      ) : (
                        <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>Contact details withheld due to citizen anonymity.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ROW 2: Complaint Images Gallery (Full width) */}
                <div className="workspace-panel">
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
                    Complaint Images
                  </h3>
                  {detailsComplaint.images && detailsComplaint.images.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
                      {detailsComplaint.images.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setActiveImageIndex(idx); setIsFullscreenOpen(true); }}
                          className="zoom-image-container"
                          style={{ height: '100px', borderRadius: '8px', cursor: 'zoom-in', border: '1px solid #e2e8f0', overflow: 'hidden' }}
                        >
                          <img src={img} alt={`Evidence ${idx + 1}`} className="zoom-image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                      <AlertTriangle size={24} style={{ color: '#94a3b8', marginBottom: '8px', display: 'inline-block' }} />
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>No photographic evidence uploaded.</p>
                    </div>
                  )}
                </div>

                {/* ROW 3: Location Details & Timeline */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                  {/* Left: Location */}
                  <div className="workspace-panel">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
                      Location
                    </h3>
                    <div style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative', marginBottom: '16px' }}>
                      <div style={{ position: 'absolute', inset: 0, background: '#e0f2fe', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <MapPin size={24} style={{ color: '#0284c7' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369a1' }}>GPS Anchor Location</span>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: '#0284c7', fontFamily: 'monospace' }}>
                          {detailsComplaint.latitude ? `${detailsComplaint.latitude.toFixed(5)}° N, ${detailsComplaint.longitude.toFixed(5)}° E` : '9.9816° N, 76.2999° E'}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                      <p><strong>Latitude:</strong> {detailsComplaint.latitude || '9.9816'}</p>
                      <p><strong>Longitude:</strong> {detailsComplaint.longitude || '76.2999'}</p>
                      <p><strong>District / Panchayat / Ward:</strong> {detailsComplaint.district} / {detailsComplaint.city} / {detailsComplaint.ward || 'General'}</p>
                      <p><strong>Landmark:</strong> {detailsComplaint.landmark || 'None'}</p>
                      <p><strong>Full Address:</strong> {detailsComplaint.user?.address || 'Ward 3, Panchayat Colony'}</p>
                    </div>
                  </div>

                  {/* Right: Timeline */}
                  <div className="workspace-panel">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
                      Complaint Timeline
                    </h3>
                    <div className="timeline-container">
                      <div className="timeline-node">
                        <span className="timeline-circle resolved" />
                        <div className="timeline-meta">
                          <span className="timeline-title">✔ Complaint Submitted</span>
                          <span className="timeline-time">{new Date(detailsComplaint.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="timeline-desc">Submitted by citizen reporter.</p>
                      </div>

                      <div className="timeline-node">
                        <span className={`timeline-circle ${detailsComplaint.status !== 'Pending' ? 'resolved' : 'pending'}`} />
                        <div className="timeline-meta">
                          <span className="timeline-title">
                            {detailsComplaint.status !== 'Pending' ? '✔ Verified' : '○ Verified'}
                          </span>
                          <span className="timeline-time">
                            {detailsComplaint.status !== 'Pending' ? new Date(detailsComplaint.updatedAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="timeline-desc">Verification parameters processed.</p>
                      </div>

                      <div className="timeline-node">
                        <span className={`timeline-circle ${detailsComplaint.assignedDepartment ? 'resolved' : 'pending'}`} />
                        <div className="timeline-meta">
                          <span className="timeline-title">
                            {detailsComplaint.assignedDepartment ? '✔ Assigned' : '○ Assigned'}
                          </span>
                          <span className="timeline-time">
                            {detailsComplaint.assignedDepartment ? new Date(detailsComplaint.updatedAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="timeline-desc">Routed to local Panchayat crew.</p>
                      </div>

                      <div className="timeline-node" style={{ paddingBottom: 0 }}>
                        <span className={`timeline-circle ${(detailsComplaint.status === 'In Progress' || detailsComplaint.status === 'Resolved') ? 'resolved' : 'pending'}`} />
                        <div className="timeline-meta">
                          <span className="timeline-title">
                            {(detailsComplaint.status === 'In Progress' || detailsComplaint.status === 'Resolved') ? '✔ Work Started' : '○ Work Started'}
                          </span>
                          <span className="timeline-time">
                            {(detailsComplaint.status === 'In Progress' || detailsComplaint.status === 'Resolved') ? new Date(detailsComplaint.updatedAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="timeline-desc">Field assignment started.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROW 4: Admin Actions Card */}
                <div className="workspace-panel">
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
                    Admin Actions
                  </h3>

                  {/* Current Status display */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Current Status:</span>
                    <span className="status-pill" style={{ ...getStatusBadgeStyle(detailsComplaint.status), fontWeight: 800, padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem' }}>
                      {detailsComplaint.status}
                    </span>
                    {detailsComplaint.assignedDepartment && detailsComplaint.assignedDepartment !== 'Not Assigned' && (
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                        (Assigned to {detailsComplaint.assignedDepartment})
                      </span>
                    )}
                  </div>

                  {/* Form Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    {/* Status Dropdown */}
                    <div className="admin-input-group">
                      <span className="admin-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Status Workflow</span>
                      <select
                        value={detailsComplaint.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        className="admin-select"
                        style={{ background: '#ffffff' }}
                        disabled={detailsComplaint.status === 'Resolved' || detailsComplaint.status === 'Rejected'}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Verified">Verified</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Department Dropdown */}
                    <div className="admin-input-group">
                      <span className="admin-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Department Assignment</span>
                      <select
                        value={detailsDeptAssign}
                        onChange={(e) => setDetailsDeptAssign(e.target.value)}
                        className="admin-select"
                        style={{ background: '#ffffff' }}
                        disabled={detailsComplaint.status === 'Resolved' || detailsComplaint.status === 'Rejected'}
                      >
                        <option value="">Choose Department</option>
                        <option value="Road Department">Road Department</option>
                        <option value="Electricity Board">Electricity Board</option>
                        <option value="Water Authority">Water Authority</option>
                        <option value="Waste Management">Waste Management</option>
                        <option value="Health Department">Health Department</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Officer Dropdown */}
                    <div className="admin-input-group">
                      <span className="admin-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Assigned Officer</span>
                      <select
                        value={detailsOfficerAssign}
                        onChange={(e) => setDetailsOfficerAssign(e.target.value)}
                        className="admin-select"
                        style={{ background: '#ffffff' }}
                        disabled={detailsComplaint.status === 'Resolved' || detailsComplaint.status === 'Rejected'}
                      >
                        <option value="">Choose Officer</option>
                        <option value="Rajesh Nair (Senior PWD Engineer)">Rajesh Nair (Senior PWD Engineer)</option>
                        <option value="Lakshmi Priya (Sanitation Inspector)">Lakshmi Priya (Sanitation Inspector)</option>
                        <option value="Mathew Joseph (Water Authority Supervisor)">Mathew Joseph (Water Authority Supervisor)</option>
                        <option value="Sreedevi K. (Health Inspector)">Sreedevi K. (Health Inspector)</option>
                        <option value="Anoop Kumar (Electrical Engineer)">Anoop Kumar (Electrical Engineer)</option>
                        <option value="General Duty Panchayat Officer">General Duty Panchayat Officer</option>
                      </select>
                    </div>

                    {/* Due Date Picker */}
                    <div className="admin-input-group">
                      <span className="admin-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Due Date Target</span>
                      <input
                        type="date"
                        value={detailsCompletionDate}
                        onChange={(e) => setDetailsCompletionDate(e.target.value)}
                        className="admin-input"
                        style={{ background: '#ffffff' }}
                        disabled={detailsComplaint.status === 'Resolved' || detailsComplaint.status === 'Rejected'}
                      />
                    </div>
                  </div>

                  {/* Remarks Textarea */}
                  <div className="admin-input-group" style={{ marginBottom: '24px' }}>
                    <span className="admin-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Action Remarks & Notes</span>
                    <textarea
                      placeholder="Enter remarks, action logs, or details requesting more information from the citizen..."
                      value={detailsAdminNote}
                      onChange={(e) => setDetailsAdminNote(e.target.value)}
                      className="admin-textarea"
                      style={{ minHeight: '80px', background: '#ffffff' }}
                    />
                  </div>

                  {/* Action Buttons list */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid #edf2f7', paddingTop: '20px' }}>
                    {/* Verify button */}
                    <button
                      type="button"
                      className="admin-btn primary"
                      style={{ background: '#2563eb', padding: '10px 18px', fontSize: '0.85rem' }}
                      onClick={() => handleUpdateStatus('Verified')}
                      disabled={detailsComplaint.status !== 'Pending'}
                    >
                      Verify
                    </button>

                    {/* Assign button */}
                    <button
                      type="button"
                      className="admin-btn primary"
                      style={{ background: '#db2777', padding: '10px 18px', fontSize: '0.85rem' }}
                      onClick={handleAssignDeptSubmit}
                      disabled={
                        detailsComplaint.status !== 'Verified' &&
                        detailsComplaint.status !== 'Assigned' &&
                        detailsComplaint.status !== 'In Progress'
                      }
                    >
                      Assign
                    </button>

                    {/* Start Work button */}
                    <button
                      type="button"
                      className="admin-btn primary"
                      style={{ background: '#f59e0b', padding: '10px 18px', fontSize: '0.85rem' }}
                      onClick={() => handleUpdateStatus('In Progress')}
                      disabled={detailsComplaint.status !== 'Assigned'}
                    >
                      Start Work
                    </button>

                    {/* Resolve button */}
                    <button
                      type="button"
                      className="admin-btn primary"
                      style={{ background: '#10b981', padding: '10px 18px', fontSize: '0.85rem' }}
                      onClick={() => handleUpdateStatus('Resolved')}
                      disabled={detailsComplaint.status !== 'In Progress'}
                    >
                      Resolve
                    </button>

                    {/* Reject button */}
                    <button
                      type="button"
                      className="admin-btn danger"
                      style={{ background: '#dc2626', color: '#fff', padding: '10px 18px', fontSize: '0.85rem' }}
                      onClick={() => handleUpdateStatus('Rejected')}
                      disabled={detailsComplaint.status === 'Resolved' || detailsComplaint.status === 'Rejected'}
                    >
                      Reject
                    </button>

                    {/* Spacer to push Delete to the right */}
                    <div style={{ flexGrow: 1 }} />

                    {/* Save notes helper button */}
                    <button
                      type="button"
                      className="admin-btn secondary"
                      style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                      onClick={handleSaveNotes}
                    >
                      Save Notes Only
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      className="admin-btn secondary"
                      style={{ color: '#ef4444', borderColor: '#fca5a5', padding: '10px 18px', fontSize: '0.85rem' }}
                      onClick={handleDeleteReport}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* ROW 5: AI Recommendation Card */}
                <div className="workspace-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Cpu size={20} style={{ color: '#2563eb' }} />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e3a8a' }}>
                      AI Recommendation Card
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Recommended Department</span>
                      <span className="insight-pill info" style={{ alignSelf: 'flex-start' }}>{detailsComplaint.category} Division</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Estimated Resolution Time</span>
                      <span className="insight-pill" style={{ alignSelf: 'flex-start' }}>4 Business Days</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Suggested Priority</span>
                      <span className={`badge-priority ${getPriorityClass(detailsComplaint.priority)}`} style={{ alignSelf: 'flex-start', borderRadius: '99px' }}>
                        {detailsComplaint.priority || 'Normal'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Confidence Score</span>
                      <span className="insight-pill success" style={{ alignSelf: 'flex-start' }}>94% Match</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Possible Duplicate Complaint</span>
                      <span className="insight-pill danger" style={{ alignSelf: 'flex-start' }}>0 Found within 1km</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Suggested Action</span>
                      <span className="insight-pill" style={{ alignSelf: 'flex-start', fontWeight: 700 }}>Route to local crew</span>
                    </div>
                  </div>
                </div>

                {/* ROW 6: Activity Log */}
                <div className="workspace-panel">
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
                    Activity Log
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {detailsActivityLogs.length === 0 ? (
                      <div style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>No activity logs recorded in database.</div>
                    ) : (
                      detailsActivityLogs.map((log, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                          <div style={{ minWidth: '130px', color: '#64748b', fontWeight: 600 }}>
                            {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ flex: 1 }}>
                            <strong>{log.adminName || 'System Admin'}:</strong> {log.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Fullscreen zoom image preview modal */}
        {isFullscreenOpen && detailsComplaint && detailsComplaint.images && detailsComplaint.images.length > 0 && (
          <div className="admin-modal-overlay" style={{ background: 'rgba(15,23,42,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ position: 'relative', width: '80%', height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={detailsComplaint.images[activeImageIndex]}
                alt="evidence magnified"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  transform: `scale(${zoomScale})`,
                  transition: 'transform 0.2s ease'
                }}
              />

              {detailsComplaint.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(prev => (prev === 0 ? detailsComplaint.images.length - 1 : prev - 1));
                      setZoomScale(1);
                    }}
                    style={{ position: 'absolute', left: '-60px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(prev => (prev === detailsComplaint.images.length - 1 ? 0 : prev + 1));
                      setZoomScale(1);
                    }}
                    style={{ position: 'absolute', right: '-60px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '24px', background: 'rgba(255,255,255,0.1)', padding: '10px 24px', borderRadius: '30px' }}>
              <button
                onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))}
                style={{ color: '#fff', background: 'transparent', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Zoom In (+)
              </button>
              <button
                onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))}
                style={{ color: '#fff', background: 'transparent', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Zoom Out (-)
              </button>
              <button
                onClick={() => setZoomScale(1)}
                style={{ color: '#fff', background: 'transparent', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Reset Zoom
              </button>
              <a
                href={detailsComplaint.images[activeImageIndex]}
                download={`complaint-evidence-${activeImageIndex + 1}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#fff', background: 'transparent', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Download size={14} /> Download
              </a>
              <button
                onClick={() => { setIsFullscreenOpen(false); setZoomScale(1); }}
                style={{ color: '#ef4444', background: 'transparent', border: 'none', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* User Account Details Modal */}
        {userModalOpen && (
          <div className="admin-modal-overlay" onClick={() => setUserModalOpen(false)}>
            <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '16px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>User Profile & Activity Logs</h3>
                <button
                  onClick={() => setUserModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              {loadingUserDetails || !selectedUserDetails ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 8px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading user history details...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Category A: Personal Information */}
                  <div className="user-details-section" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                    <h4 className="user-details-title">Personal Information</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '16px' }}>
                      {selectedUserDetails.profilePicture ? (
                        <img
                          src={selectedUserDetails.profilePicture.startsWith('http') ? selectedUserDetails.profilePicture : `http://localhost:5000${selectedUserDetails.profilePicture}`}
                          alt={selectedUserDetails.fullName}
                          style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="user-avatar-initials" style={{ width: '64px', height: '64px', fontSize: '1.3rem' }}>
                          {selectedUserDetails.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>{selectedUserDetails.fullName || 'Not provided'}</h3>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          ID: {selectedUserDetails._id}
                        </p>
                      </div>
                    </div>

                    <div className="user-details-grid">
                      <div className="user-detail-item">
                        <span className="user-detail-label">Full Name</span>
                        <span className="user-detail-value">{selectedUserDetails.fullName || 'Not provided'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Email Address</span>
                        <span className="user-detail-value">{selectedUserDetails.email || 'Not provided'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Phone Number</span>
                        <span className="user-detail-value">{selectedUserDetails.mobile || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category B: LOCATION */}
                  <div className="user-details-section">
                    <h4 className="user-details-title">Location</h4>
                    <div className="user-details-grid">
                      <div className="user-detail-item">
                        <span className="user-detail-label">Panchayat</span>
                        <span className="user-detail-value">{selectedUserDetails.panchayat || 'Not provided'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">District</span>
                        <span className="user-detail-value">{selectedUserDetails.district || 'Not provided'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Village / Local Body</span>
                        <span className="user-detail-value">
                          {selectedUserDetails.localBody || selectedUserDetails.city || 'Not provided'}
                        </span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">PIN Code</span>
                        <span className="user-detail-value">{selectedUserDetails.pinCode || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category C: ACCOUNT */}
                  <div className="user-details-section">
                    <h4 className="user-details-title">Account</h4>
                    <div className="user-details-grid">
                      <div className="user-detail-item">
                        <span className="user-detail-label">Role</span>
                        <span className="user-detail-value" style={{ textTransform: 'capitalize' }}>
                          {selectedUserDetails.role || 'citizen'}
                        </span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Account Status</span>
                        <span className="user-detail-value">
                          <span className={`badge-status ${(selectedUserDetails.status || 'Active').toLowerCase()}`}>
                            {selectedUserDetails.status || 'Active'}
                          </span>
                        </span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Joined Date</span>
                        <span className="user-detail-value">
                          {selectedUserDetails.createdAt ? new Date(selectedUserDetails.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          }) : 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Toggles */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #edf2f7', paddingTop: '16px', marginTop: '8px' }}>
                    <button className="admin-btn secondary" onClick={() => setUserModalOpen(false)}>
                      Close Details
                    </button>
                    {selectedUserDetails.status?.toLowerCase() === 'blocked' ? (
                      <button
                        className="admin-btn primary"
                        style={{ background: '#10b981' }}
                        onClick={() => handleUnblockUser(selectedUserDetails._id)}
                      >
                        Unblock Citizen
                      </button>
                    ) : (
                      <button
                        className="admin-btn danger"
                        onClick={() => {
                          const reason = prompt('Please enter a reason for blocking this user (optional):');
                          if (reason !== null) {
                            handleBlockUser(selectedUserDetails._id, reason);
                          }
                        }}
                      >
                        Block Citizen
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Community Post Details Modal */}
        {postModalOpen && selectedPostDetails && (
          <div className="admin-modal-overlay" onClick={() => setPostModalOpen(false)}>
            <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '650px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '16px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>Community Post Details</h3>
                <button
                  onClick={() => setPostModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
                {/* Author Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #edf2f7' }}>
                  {selectedPostDetails.user?.profilePicture ? (
                    <img
                      src={selectedPostDetails.user.profilePicture.startsWith('http') ? selectedPostDetails.user.profilePicture : `http://localhost:5000${selectedPostDetails.user.profilePicture}`}
                      alt={selectedPostDetails.user?.fullName}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="user-avatar-initials" style={{ width: '48px', height: '48px', fontSize: '1.1rem' }}>
                      {selectedPostDetails.user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'C'}
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)' }}>{selectedPostDetails.user?.fullName || 'Citizen'}</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      District: {selectedPostDetails.user?.district || 'Not provided'} &bull; Role: {selectedPostDetails.user?.role || 'Citizen'}
                    </p>
                  </div>
                </div>

                {/* Post Content */}
                <div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-dark)', lineHeight: 1.6, whiteSpace: 'pre-line', margin: '0 0 16px 0' }}>
                    {selectedPostDetails.caption}
                  </p>

                  {selectedPostDetails.image && (
                    <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                      <img
                        src={selectedPostDetails.image.startsWith('http') ? selectedPostDetails.image : `http://localhost:5000${selectedPostDetails.image}`}
                        alt="Community Post"
                        style={{ width: '100%', maxHeight: '350px', objectFit: 'contain', background: '#f8fafc' }}
                      />
                    </div>
                  )}
                </div>

                {/* Meta details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Status</span>
                    <div style={{ marginTop: '4px' }}>
                      <span className={`badge-status ${(selectedPostDetails.status || 'Pending').toLowerCase()}`}>
                        {selectedPostDetails.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Visibility</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-dark)', marginTop: '4px' }}>{selectedPostDetails.visibility || 'Public'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Likes Count</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-dark)', marginTop: '4px' }}>👍 {selectedPostDetails.likes || 0}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Posted Date</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-dark)', marginTop: '4px' }}>
                      {new Date(selectedPostDetails.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Comments ({selectedPostDetails.comments?.length || 0})
                  </h4>
                  {selectedPostDetails.comments && selectedPostDetails.comments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                      {selectedPostDetails.comments.map((comment) => (
                        <div key={comment._id} style={{ display: 'flex', gap: '8px', padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
                          <div className="user-avatar-initials" style={{ width: '32px', height: '32px', fontSize: '0.8rem', minWidth: '32px' }}>
                            {comment.user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'C'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{comment.user?.fullName || 'Citizen'}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#334155' }}>{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, padding: '12px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                      No comments have been posted yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #edf2f7', paddingTop: '16px', marginTop: '20px' }}>
                <button className="admin-btn secondary" onClick={() => setPostModalOpen(false)}>
                  Close
                </button>
                {selectedPostDetails.status === 'Pending' && (
                  <>
                    <button
                      className="admin-btn primary"
                      style={{ background: '#10b981' }}
                      onClick={() => {
                        handleApprovePost(selectedPostDetails._id);
                        setPostModalOpen(false);
                      }}
                    >
                      Approve Post
                    </button>
                    <button
                      className="admin-btn danger"
                      onClick={() => {
                        handleRejectPost(selectedPostDetails._id);
                        setPostModalOpen(false);
                      }}
                    >
                      Reject Post
                    </button>
                  </>
                )}
                <button
                  className="admin-btn danger"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => {
                    handleDeletePost(selectedPostDetails._id);
                  }}
                >
                  <Trash2 size={14} /> Delete Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lost & Found Item Details Modal */}
        {lostFoundModalOpen && selectedLostFoundItem && (
          <div 
            className="admin-modal-overlay" 
            onClick={() => setLostFoundModalOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000
            }}
          >
            <div 
              className="admin-modal-container" 
              onClick={(e) => e.stopPropagation()} 
              style={{ 
                padding: '24px', 
                width: '90%',
                maxWidth: '700px', 
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                background: '#fff',
                borderRadius: '20px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '16px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>Lost & Found Details</h3>
                <button
                  onClick={() => setLostFoundModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', lineHieght: 1 }}
                >
                  &times;
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '4px', flex: 1 }}>
                
                {/* Image Area */}
                <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', textAlign: 'center', background: '#f8fafc', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1' }}>
                  {selectedLostFoundItem?.image ? (
                    <img
                      src={selectedLostFoundItem.image.startsWith('http') ? selectedLostFoundItem.image : `http://localhost:5000${selectedLostFoundItem.image}`}
                      alt={selectedLostFoundItem.itemName || 'Item'}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                      <FolderOpen size={48} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>No image available</span>
                    </div>
                  )}
                </div>

                {/* Item Information */}
                <div className="user-details-section" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                  <h4 className="user-details-title">Item Information</h4>
                  <div className="user-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Item Name</span>
                      <span className="user-detail-value" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)' }}>{selectedLostFoundItem?.itemName || 'Unnamed Item'}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Type</span>
                      <span className="user-detail-value" style={{
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        color: selectedLostFoundItem?.type === 'Lost' ? '#ef4444' : '#10b981'
                      }}>{(selectedLostFoundItem?.type || 'Lost').toUpperCase()}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Category</span>
                      <span className="user-detail-value">{selectedLostFoundItem?.category || 'N/A'}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Current Status</span>
                      <span className="user-detail-value">
                        {(() => {
                          const norm = selectedLostFoundItem?.status === 'Active' ? 'LOST' : selectedLostFoundItem?.status === 'Resolved' ? 'RETURNED' : (selectedLostFoundItem?.status || 'LOST').toUpperCase();
                          let bg = '#fee2e2', fg = '#ef4444'; // LOST
                          if (norm === 'FOUND') { bg = '#d1fae5'; fg = '#10b981'; }
                          else if (norm === 'RETURNED') { bg = '#dbeafe'; fg = '#2563eb'; }
                          return (
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              background: bg,
                              color: fg
                            }}>
                              {norm}
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <span className="user-detail-label">Description</span>
                    <p style={{ fontSize: '0.88rem', color: '#334155', margin: '4px 0 0 0', lineHeight: 1.6, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                      {selectedLostFoundItem?.description || 'Not provided'}
                    </p>
                  </div>
                </div>

                {/* Location & Date */}
                <div className="user-details-section" style={{ borderTop: '1px solid #edf2f7', paddingTop: '16px' }}>
                  <h4 className="user-details-title">Location & Date</h4>
                  <div className="user-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Location</span>
                      <span className="user-detail-value">{selectedLostFoundItem?.location || 'N/A'}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Date Lost / Found</span>
                      <span className="user-detail-value">
                        {selectedLostFoundItem?.date ? new Date(selectedLostFoundItem.date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Posted By */}
                <div className="user-details-section" style={{ borderTop: '1px solid #edf2f7', paddingTop: '16px' }}>
                  <h4 className="user-details-title">Posted By</h4>
                  <div className="user-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Name</span>
                      <span className="user-detail-value">{selectedLostFoundItem?.user?.fullName || 'Citizen'}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Email</span>
                      <span className="user-detail-value">{selectedLostFoundItem?.user?.email || 'Not provided'}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Phone</span>
                      <span className="user-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={12} style={{ color: '#94a3b8' }} />
                        {selectedLostFoundItem?.user?.mobile || 'Not provided'}
                      </span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Contact Details Provided</span>
                      <span className="user-detail-value">{selectedLostFoundItem?.contactInformation || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Recovery / Finder Info */}
                {selectedLostFoundItem?.foundBy && (
                  <div className="user-details-section" style={{ borderTop: '1px solid #edf2f7', paddingTop: '16px' }}>
                    <h4 className="user-details-title">Recovery Information</h4>
                    <div className="user-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Found By (Finder)</span>
                        <span className="user-detail-value">{selectedLostFoundItem.foundBy.fullName || 'Citizen'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Finder Email</span>
                        <span className="user-detail-value">{selectedLostFoundItem.foundBy.email || 'Not provided'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Finder Mobile</span>
                        <span className="user-detail-value">{selectedLostFoundItem.foundBy.mobile || 'Not provided'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Found At Timestamp</span>
                        <span className="user-detail-value">
                          {selectedLostFoundItem.foundAt ? new Date(selectedLostFoundItem.foundAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      {selectedLostFoundItem.returnedAt && (
                        <div className="user-detail-item" style={{ gridColumn: 'span 2' }}>
                          <span className="user-detail-label">Owner Confirmed Returned At</span>
                          <span className="user-detail-value" style={{ color: '#2563eb', fontWeight: 700 }}>
                            {new Date(selectedLostFoundItem.returnedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>


              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #edf2f7', paddingTop: '16px', marginTop: '20px' }}>
                <button className="admin-btn secondary" onClick={() => setLostFoundModalOpen(false)}>Close</button>
                {(selectedLostFoundItem?.status || 'Active') === 'Active' ? (
                  <button
                    className="admin-btn primary"
                    style={{ background: '#10b981', color: '#fff' }}
                    onClick={() => {
                      handleResolveLostFound(selectedLostFoundItem._id, 'Resolved');
                      setLostFoundModalOpen(false);
                    }}
                  >
                    Mark as Resolved
                  </button>
                ) : (
                  <button
                    className="admin-btn secondary"
                    style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
                    onClick={() => {
                      handleResolveLostFound(selectedLostFoundItem._id, 'Active');
                      setLostFoundModalOpen(false);
                    }}
                  >
                    Reopen
                  </button>
                )}
                <button
                  className="admin-btn danger"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => {
                    handleDeleteLostFoundItem(selectedLostFoundItem._id);
                  }}
                >
                  <Trash2 size={14} /> Delete Report
                </button>
              </div>
            </div>
          </div>
        )}




      </main>

    </div>
  );
}

// Inline SVG helpers
function Menu({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function Tag({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.46.94 3.4 0l6.59-6.59c.94-.94.94-2.46 0-3.4L12 2Z" />
      <path d="M6 8h.01" />
    </svg>
  );
}

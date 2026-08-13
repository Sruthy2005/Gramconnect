import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, Megaphone, Calendar, Tag, RefreshCw, AlertTriangle, Info, Eye, X } from 'lucide-react';

const UserAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Details Modal
  const [selectedAnn, setSelectedAnn] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/announcements');
      if (res.data && res.data.success) {
        const anns = res.data.announcements || [];
        console.log('[ANNOUNCEMENTS] API response:', res.data);
        console.log(`[ANNOUNCEMENTS] Number of announcements: ${anns.length}`);
        setAnnouncements(anns);
      }
    } catch (err) {
      console.error('[DEV ERROR] Failed to fetch announcements:', err);
      setError(err.message || 'Unable to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log(`[ANNOUNCEMENTS] Current User - District: ${user.district || 'N/A'}, Panchayat: ${user.panchayat || 'N/A'}`);
    }
    fetchAnnouncements();
  }, [user]);

  const getPriorityStyle = (priority) => {
    if (priority === 'Urgent') {
      return { background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' };
    }
    if (priority === 'Important') {
      return { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' };
    }
    return { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' };
  };

  const filteredAnnouncements = announcements.filter(ann => {
    const matchesSearch = !searchQuery ||
      ann.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || ann.category === categoryFilter;
    const matchesPriority = priorityFilter === 'All' || ann.priority === priorityFilter;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header section */}
      <div className="admin-flex-row" style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-dark)' }}>Panchayat Announcements</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Keep track of notifications, warnings, guidelines and public utilities updates in your village.
          </p>
        </div>
        <button className="admin-btn secondary" style={{ gap: '6px', height: '40px' }} onClick={fetchAnnouncements}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="unified-filter-toolbar">
        <div className="search-input-wrapper" style={{ flex: 2, minWidth: '240px' }}>
          <Search size={16} className="search-icon" style={{ top: '12px' }} />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="complaints-search-input"
            style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ flex: 1, minWidth: '160px' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
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

        <div style={{ flex: 1, minWidth: '160px' }}>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="admin-select"
            style={{ fontSize: '0.85rem', width: '100%', border: '1px solid #cbd5e1', background: '#fff' }}
          >
            <option value="All">All Priorities</option>
            <option value="Normal">Normal</option>
            <option value="Important">Important</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        <button
          className="admin-btn secondary"
          onClick={() => {
            setSearchQuery('');
            setCategoryFilter('All');
            setPriorityFilter('All');
          }}
          style={{ fontSize: '0.82rem', fontWeight: 700, padding: '0 16px', background: '#f1f5f9' }}
        >
          Clear Filters
        </button>
      </div>

      {/* Main Grid Feed */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Fetching latest notices...</p>
        </div>
      ) : error ? (
        <div className="chart-card" style={{ padding: '40px', textAlign: 'center', borderColor: '#fecaca' }}>
          <AlertTriangle size={40} style={{ color: '#ef4444', marginBottom: '12px' }} />
          <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Unable to load announcements.</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0 16px' }}>{error}</p>
          <button className="admin-btn primary" onClick={fetchAnnouncements}>Retry</button>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="chart-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <Megaphone size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>No announcements available.</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
            Check back later for important guidelines or updates from the Panchayat.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredAnnouncements.map(ann => {
            const hasAttachment = ann.attachment;
            const attachmentImage = hasAttachment ? (ann.attachment.startsWith('http') ? ann.attachment : `http://localhost:5000${ann.attachment}`) : null;
            const priorityBadge = getPriorityStyle(ann.priority);

            return (
              <div 
                key={ann._id} 
                className="post-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  border: ann.priority === 'Urgent' ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                  boxShadow: ann.priority === 'Urgent' ? '0 4px 12px rgba(239, 68, 68, 0.05)' : 'none'
                }}
              >
                {attachmentImage && (
                  <div style={{ height: '160px', overflow: 'hidden' }}>
                    <img src={attachmentImage} alt={ann.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div className="post-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)' }}>
                      <Tag size={12} /> {ann.category}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      ...priorityBadge
                    }}>
                      {ann.priority}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                    {ann.title}
                  </h3>
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: '#475569', 
                    lineHeight: 1.5, 
                    margin: '0 0 16px 0', 
                    display: '-webkit-box', 
                    WebkitLineClamp: 3, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden' 
                  }}>
                    {ann.description}
                  </p>

                  <div style={{ marginTop: 'auto', borderTop: '1px solid #edf2f7', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} />
                      <span>{new Date(ann.publishDate || ann.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button 
                      className="admin-btn secondary"
                      style={{ height: '30px', padding: '0 10px', fontSize: '0.76rem' }}
                      onClick={() => {
                        setSelectedAnn(ann);
                        setDetailsOpen(true);
                      }}
                    >
                      <Eye size={12} /> View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL OVERLAY MODAL */}
      {detailsOpen && selectedAnn && (() => {
        const priorityStyle = getPriorityStyle(selectedAnn.priority);
        const attachmentImage = selectedAnn.attachment ? (selectedAnn.attachment.startsWith('http') ? selectedAnn.attachment : `http://localhost:5000${selectedAnn.attachment}`) : null;
        return (
          <div className="admin-modal-overlay" onClick={() => setDetailsOpen(false)}>
            <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '600px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '16px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>Announcement Notice</h3>
                <button
                  onClick={() => setDetailsOpen(false)}
                  style={{ background: 'transparent', border: 'none', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
                {attachmentImage && (
                  <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', textAlign: 'center' }}>
                    <img src={attachmentImage} alt={selectedAnn.title} style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', background: '#f8fafc' }} />
                  </div>
                )}

                <div className="user-details-section" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      ...priorityStyle
                    }}>
                      {selectedAnn.priority}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Category: {selectedAnn.category}
                    </span>
                  </div>
                  <h2 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1.3 }}>
                    {selectedAnn.title}
                  </h2>
                  <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6, background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #edf2f7', whiteSpace: 'pre-wrap' }}>
                    {selectedAnn.description}
                  </p>
                </div>

                <div className="user-details-section">
                  <h4 className="user-details-title">Notice Properties</h4>
                  <div className="user-details-grid">
                    <div className="user-detail-item">
                      <span className="user-detail-label">District Target</span>
                      <span className="user-detail-value">{selectedAnn.district || 'All Districts'}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Panchayat Target</span>
                      <span className="user-detail-value">{selectedAnn.panchayat || 'All Panchayats'}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Published On</span>
                      <span className="user-detail-value">{new Date(selectedAnn.publishDate || selectedAnn.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Expiry Date</span>
                      <span className="user-detail-value">{selectedAnn.expiryDate ? new Date(selectedAnn.expiryDate).toLocaleDateString() : 'None (No Expiry)'}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label font-bold">Issuer Office</span>
                      <span className="user-detail-value">{selectedAnn.publishedBy?.fullName || 'Panchayat Admin'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #edf2f7', paddingTop: '16px', marginTop: '20px' }}>
                <button className="admin-btn secondary" onClick={() => setDetailsOpen(false)}>Close Notice</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default UserAnnouncements;

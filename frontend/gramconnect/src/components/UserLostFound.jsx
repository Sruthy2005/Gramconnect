import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, MapPin, Calendar, User, Phone, CheckCircle, RefreshCw, FolderOpen, AlertCircle, Eye, X, Award, HelpCircle } from 'lucide-react';

const UserLostFound = ({ showToast }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuth();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All'); // All, Lost, Found
  const [statusFilter, setStatusFilter] = useState('All'); // All, LOST, FOUND, RETURNED

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Workflow states
  const [confirmFoundItem, setConfirmFoundItem] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState([]);

  // Create Form state
  const [formType, setFormType] = useState('Lost');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Mobile / Electronics');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formImage, setFormImage] = useState(null);
  const [formImageName, setFormImageName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/lost-found');
      if (res.data && res.data.success) {
        setItems(res.data.items || []);
      }
    } catch (err) {
      console.error('[DEV ERROR] Failed to fetch lost/found items:', err);
      setError(err.message || 'Failed to retrieve reports from Lost & Found database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setFormErrors(prev => ({ ...prev, image: 'Only JPG, PNG, and WEBP images are allowed.' }));
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, image: 'Image size must not exceed 5MB.' }));
      e.target.value = '';
      return;
    }
    setFormErrors(prev => ({ ...prev, image: '' }));
    setFormImage(file);
    setFormImageName(file.name);
  };

  const resetForm = () => {
    setFormType('Lost');
    setFormName('');
    setFormCategory('Mobile / Electronics');
    setFormDescription('');
    setFormLocation('');
    setFormDate('');
    setFormContact('');
    setFormImage(null);
    setFormImageName('');
    setFormErrors({});
  };

  // Validation helpers
  const validateContact = (val) => {
    const phoneRegex = /^[+]?[\d\s\-().]{7,15}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return phoneRegex.test(val.trim()) || emailRegex.test(val.trim());
  };

  const getTodayStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    // ── Per-field validation ────────────────────────────────────────────────
    const errors = {};
    if (!formType) errors.type = 'Report Type is required.';
    if (!formName.trim()) errors.name = 'Item Name is required.';
    if (!formCategory) errors.category = 'Category is required.';
    if (!formDescription.trim()) errors.description = 'Description is required.';
    if (!formLocation.trim()) errors.location = 'Location is required.';
    else if (formLocation.trim().length < 3) errors.location = 'Enter a more specific location.';
    if (!formDate) {
      errors.date = 'Date is required.';
    } else if (formDate > getTodayStr()) {
      errors.date = 'Date cannot be in the future.';
    }
    if (!formContact.trim()) {
      errors.contact = 'Contact Information is required.';
    } else if (!validateContact(formContact)) {
      errors.contact = 'Enter a valid phone number or email address.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    setSubmitting(true);
    const formData = new FormData();
    formData.append('type', formType);
    formData.append('itemName', formName.trim());
    formData.append('category', formCategory);
    formData.append('description', formDescription.trim());
    formData.append('location', formLocation.trim());
    formData.append('date', formDate);
    formData.append('contactInformation', formContact.trim());
    if (formImage) {
      formData.append('image', formImage);
    }

    try {
      const res = await api.post('/lost-found', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.success) {
        if (showToast) showToast('Post published successfully!');
        else alert('Post published successfully!');
        setCreateModalOpen(false);
        resetForm();
        fetchItems();
      }
    } catch (err) {
      console.error('[DEV ERROR] Failed to create item:', err);
      const errMsg = err.response?.data?.message || err.message || 'Unable to submit the report. Please check the required fields and try again.';
      if (showToast) showToast(errMsg, 'error');
      else alert(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to normalize status mapping ('Active' -> 'LOST', 'Resolved' -> 'RETURNED')
  const getNormalizedStatus = (status) => {
    if (!status) return 'LOST';
    if (status === 'Active') return 'LOST';
    if (status === 'Resolved') return 'RETURNED';
    return status.toUpperCase(); // 'LOST', 'FOUND', 'RETURNED'
  };

  // Helper to get status pill styles
  const getStatusBadgeStyle = (status) => {
    const norm = getNormalizedStatus(status);
    if (norm === 'LOST') return { background: '#fee2e2', color: '#ef4444' };
    if (norm === 'FOUND') return { background: '#d1fae5', color: '#10b981' };
    return { background: '#dbeafe', color: '#2563eb' }; // RETURNED
  };

  // Workflow actions
  const handleReportAsFound = async () => {
    if (!confirmFoundItem) return;
    setSubmittingAction(true);
    try {
      const res = await api.post(`/lost-found/${confirmFoundItem._id}/found`);
      if (res.data && res.data.success) {
        if (showToast) showToast('Owner has been notified that you found this item!');
        else alert('Owner has been notified that you found this item!');
        setConfirmFoundItem(null);
        fetchItems();
      }
    } catch (err) {
      console.error('[DEV ERROR] Failed to report as found:', err);
      const msg = err.message || err.error || 'Failed to submit found report.';
      if (showToast) showToast(msg, 'error');
      else alert(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmReturned = async (itemId) => {
    try {
      const res = await api.post(`/lost-found/${itemId}/returned`);
      if (res.data && res.data.success) {
        if (showToast) showToast('Recovery confirmed! The item is marked as returned.');
        else alert('Recovery confirmed! The item is marked as returned.');
        fetchItems();
      }
    } catch (err) {
      console.error('[DEV ERROR] Failed to confirm returned:', err);
      const msg = err.message || err.error || 'Failed to confirm item recovery.';
      if (showToast) showToast(msg, 'error');
      else alert(msg);
    }
  };

  const handleDeclineReturned = (itemId) => {
    setDismissedSuggestions([...dismissedSuggestions, itemId]);
    if (showToast) showToast('Notification dismissed. Keep coordinating with the finder.');
  };

  // Real-time filtering in frontend
  const filteredItems = items.filter(item => {
    const status = getNormalizedStatus(item.status);
    
    // Hide returned items in default 'All' state to keep feed clean
    if (statusFilter === 'All' && status === 'RETURNED') {
      return false;
    }
    
    if (statusFilter !== 'All' && status !== statusFilter) {
      return false;
    }

    const matchesSearch = !searchQuery ||
      item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header section */}
      <div className="admin-flex-row" style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-dark)' }}>Lost & Found</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Help your community find lost belongings and return found items.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="admin-btn primary" 
            style={{ gap: '6px', height: '40px', background: 'var(--primary)', color: '#fff', borderRadius: '8px', padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: 700 }}
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={16} /> Report Lost / Found Item
          </button>
          <button className="admin-btn secondary" style={{ gap: '6px', height: '40px' }} onClick={fetchItems}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Unified Filter Toolbar */}
      <div className="unified-filter-toolbar">
        <div className="search-input-wrapper" style={{ flex: 2, minWidth: '240px' }}>
          <Search size={16} className="search-icon" style={{ top: '12px' }} />
          <input
            type="text"
            placeholder="Search lost or found items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="complaints-search-input"
            style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ flex: 1, minWidth: '160px' }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-select"
            style={{ fontSize: '0.85rem', width: '100%', border: '1px solid #cbd5e1', background: '#fff' }}
          >
            <option value="All">Active Posts</option>
            <option value="LOST">🔴 Lost</option>
            <option value="FOUND">🟢 Found</option>
            <option value="RETURNED">🔵 Returned / Resolved</option>
          </select>
        </div>

        <button
          className="admin-btn secondary"
          onClick={() => {
            setSearchQuery('');
            setTypeFilter('All');
            setStatusFilter('All');
          }}
          style={{ fontSize: '0.82rem', fontWeight: 700, padding: '0 16px', background: '#f1f5f9' }}
        >
          Clear Filters
        </button>
      </div>

      {/* Loading / Error / Empty States */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Retrieving items from database...</p>
        </div>
      ) : error ? (
        <div className="chart-card" style={{ padding: '40px', textAlign: 'center', borderColor: '#fecaca' }}>
          <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: '12px' }} />
          <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Database Synchronization Error</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0 16px' }}>{error}</p>
          <button className="admin-btn primary" onClick={fetchItems}>Retry Fetching</button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="chart-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <FolderOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>No Lost & Found items yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px', marginBottom: '16px' }}>
            Be the first to report a lost or found item in your community.
          </p>
          <button
            className="admin-btn primary"
            onClick={() => setCreateModalOpen(true)}
          >
            Report Lost / Found Item
          </button>
        </div>
      ) : (
        /* Cards Grid */
        <div className="community-grid">
          {filteredItems.map(item => {
            const isLost = item.type === 'Lost';
            const itemImage = item.image ? (item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`) : null;
            const normalizedStatus = getNormalizedStatus(item.status);
            const badgeStyle = getStatusBadgeStyle(item.status);
            const isOwner = currentUser && item.user?._id === currentUser._id;
            const hasFinderReported = normalizedStatus === 'FOUND';

            return (
              <div key={item._id} className="post-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {itemImage ? (
                  <img src={itemImage} alt={item.itemName} className="post-card-img" />
                ) : (
                  <div style={{ height: '180px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    <FolderOpen size={48} />
                  </div>
                )}
                
                {/* Type Tag Badge */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: isLost ? '#fee2e2' : '#d1fae5',
                    color: isLost ? '#ef4444' : '#10b981',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {item.type}
                  </span>
                </div>

                <div className="post-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {item.category}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      ...badgeStyle
                    }}>
                      {normalizedStatus}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                    {item.itemName}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.4, margin: '0 0 12px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description}
                  </p>

                  {/* Owner recovery confirmation banner */}
                  {isOwner && hasFinderReported && !dismissedSuggestions.includes(item._id) && (
                    <div style={{
                      background: '#f0fdf4',
                      border: '1px solid #10b981',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#166534' }}>
                        🎉 Your item may have been found!
                      </span>
                      <p style={{ fontSize: '0.74rem', color: '#15803d', margin: 0, lineHeight: 1.3 }}>
                        Someone reported finding your {item.itemName}.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button 
                          className="admin-btn primary" 
                          style={{ flex: 1, height: '28px', fontSize: '0.7rem', padding: 0, background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => handleConfirmReturned(item._id)}
                        >
                          I Got My Item
                        </button>
                        <button 
                          className="admin-btn secondary" 
                          style={{ flex: 1, height: '28px', fontSize: '0.7rem', padding: 0, background: '#fff', border: '1px solid #cbd5e1', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => handleDeclineReturned(item._id)}
                        >
                          I Haven't Received It
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status Helper Message */}
                  {normalizedStatus === 'FOUND' && !isOwner && (
                    <div style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.74rem', color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                      <span>Someone reported finding this item.</span>
                    </div>
                  )}
                  {normalizedStatus === 'RETURNED' && (
                    <div style={{ padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.74rem', color: '#1e40af', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={12} style={{ color: '#2563eb' }} />
                      <span>This item has been returned to its owner.</span>
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', borderTop: '1px solid #edf2f7', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={12} style={{ color: '#94a3b8' }} />
                      <span>{item.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} style={{ color: '#94a3b8' }} />
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid #edf2f7', paddingTop: '6px', marginTop: '4px' }}>
                      <User size={12} style={{ color: '#94a3b8' }} />
                      <span>Posted by: <strong>{isOwner ? 'You' : (item.user?.fullName || 'Citizen')}</strong></span>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                    {/* Finder workflow trigger */}
                    {!isOwner && normalizedStatus === 'LOST' && (
                      <button
                        className="admin-btn primary"
                        style={{ width: '100%', height: '36px', fontSize: '0.8rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700 }}
                        onClick={() => setConfirmFoundItem(item)}
                      >
                        I Found This Item
                      </button>
                    )}

                    <button
                      className="admin-btn secondary"
                      style={{ width: '100%', height: '36px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      onClick={() => {
                        setSelectedItem(item);
                        setDetailsModalOpen(true);
                      }}
                    >
                      <Eye size={14} /> View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOUND CONFIRMATION DIALOG */}
      {confirmFoundItem && (
        <div className="admin-modal-overlay" onClick={() => setConfirmFoundItem(null)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '450px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>Found this item?</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
              If you have actually found this item, notify the owner so the item can be returned safely.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="admin-btn secondary" onClick={() => setConfirmFoundItem(null)}>Cancel</button>
              <button 
                className="admin-btn primary" 
                onClick={handleReportAsFound}
                disabled={submittingAction}
              >
                {submittingAction ? 'Notifying...' : 'Yes, I Found It'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT / CREATE POST MODAL */}
      {createModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '550px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '16px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>Report Lost / Found Item</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Report Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Report Type *</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', border: `1px solid ${formErrors.type ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', cursor: 'pointer', background: formType === 'Lost' ? '#fee2e2' : '#fff', color: formType === 'Lost' ? '#ef4444' : '#475569', fontWeight: 700 }}>
                    <input type="radio" name="type" value="Lost" checked={formType === 'Lost'} onChange={() => { setFormType('Lost'); setFormErrors(prev => ({ ...prev, type: '' })); }} style={{ display: 'none' }} />
                    Lost
                  </label>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', border: `1px solid ${formErrors.type ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', cursor: 'pointer', background: formType === 'Found' ? '#d1fae5' : '#fff', color: formType === 'Found' ? '#10b981' : '#475569', fontWeight: 700 }}>
                    <input type="radio" name="type" value="Found" checked={formType === 'Found'} onChange={() => { setFormType('Found'); setFormErrors(prev => ({ ...prev, type: '' })); }} style={{ display: 'none' }} />
                    Found
                  </label>
                </div>
                {formErrors.type && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>{formErrors.type}</span>}
              </div>

              {/* Item Name + Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Item Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormName(val);
                      if (!val.trim()) setFormErrors(prev => ({ ...prev, name: 'Item Name is required.' }));
                      else setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    style={{ width: '100%', height: '40px', padding: '0 12px', border: `1px solid ${formErrors.name ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    placeholder="e.g. Black Leather Wallet"
                  />
                  {formErrors.name && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>{formErrors.name}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormCategory(val);
                      if (!val) setFormErrors(prev => ({ ...prev, category: 'Category is required.' }));
                      else setFormErrors(prev => ({ ...prev, category: '' }));
                    }}
                    style={{ width: '100%', height: '40px', padding: '0 12px', border: `1px solid ${formErrors.category ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.85rem', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="">Select Category</option>
                    <option value="Documents">Documents</option>
                    <option value="Mobile / Electronics">Mobile / Electronics</option>
                    <option value="Keys">Keys</option>
                    <option value="Wallet / Purse">Wallet / Purse</option>
                    <option value="Jewellery">Jewellery</option>
                    <option value="Pets">Pets</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.category && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>{formErrors.category}</span>}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Description *</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormDescription(val);
                    if (!val.trim()) setFormErrors(prev => ({ ...prev, description: 'Description is required.' }));
                    else setFormErrors(prev => ({ ...prev, description: '' }));
                  }}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${formErrors.description ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box', resize: 'vertical' }}
                  placeholder="Provide specific details like brand, colors, landmarks..."
                />
                {formErrors.description && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>{formErrors.description}</span>}
              </div>

              {/* Location + Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Location *</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormLocation(val);
                      if (!val.trim()) setFormErrors(prev => ({ ...prev, location: 'Location is required.' }));
                      else if (val.trim().length < 3) setFormErrors(prev => ({ ...prev, location: 'Enter a more specific location.' }));
                      else setFormErrors(prev => ({ ...prev, location: '' }));
                    }}
                    style={{ width: '100%', height: '40px', padding: '0 12px', border: `1px solid ${formErrors.location ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    placeholder="e.g. Near bus terminal"
                  />
                  {formErrors.location && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>{formErrors.location}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Date Lost / Found *</label>
                  <input
                    type="date"
                    value={formDate}
                    max={getTodayStr()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormDate(val);
                      if (!val) setFormErrors(prev => ({ ...prev, date: 'Date is required.' }));
                      else if (val > getTodayStr()) setFormErrors(prev => ({ ...prev, date: 'Date cannot be in the future.' }));
                      else setFormErrors(prev => ({ ...prev, date: '' }));
                    }}
                    style={{ width: '100%', height: '40px', padding: '0 12px', border: `1px solid ${formErrors.date ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                  {formErrors.date && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>{formErrors.date}</span>}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Contact Information *</label>
                <input
                  type="text"
                  value={formContact}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormContact(val);
                    if (!val.trim()) setFormErrors(prev => ({ ...prev, contact: 'Contact Information is required.' }));
                    else if (!validateContact(val)) setFormErrors(prev => ({ ...prev, contact: 'Enter a valid phone number or email address.' }));
                    else setFormErrors(prev => ({ ...prev, contact: '' }));
                  }}
                  style={{ width: '100%', height: '40px', padding: '0 12px', border: `1px solid ${formErrors.contact ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  placeholder="e.g. 9876543210 or email@example.com"
                />
                {formErrors.contact && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>{formErrors.contact}</span>}
              </div>

              {/* Image Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Upload Image <span style={{ fontSize: '0.68rem', fontWeight: 400, color: '#94a3b8', textTransform: 'none' }}>(Optional — JPG, PNG, WEBP · max 5MB)</span>
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  style={{ fontSize: '0.85rem', border: `1px solid ${formErrors.image ? '#ef4444' : 'transparent'}`, borderRadius: '6px', padding: '2px' }}
                />
                {formErrors.image && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>{formErrors.image}</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #edf2f7', paddingTop: '16px', marginTop: '8px' }}>
                <button type="button" className="admin-btn secondary" onClick={() => { setCreateModalOpen(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="admin-btn primary" disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {detailsModalOpen && selectedItem && (() => {
        const normStatus = getNormalizedStatus(selectedItem.status);
        return (
          <div className="admin-modal-overlay" onClick={() => setDetailsModalOpen(false)}>
            <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '600px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '16px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>Item Details</h3>
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
                {selectedItem.image && (
                  <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', textAlign: 'center' }}>
                    <img
                      src={selectedItem.image.startsWith('http') ? selectedItem.image : `http://localhost:5000${selectedItem.image}`}
                      alt={selectedItem.itemName}
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', background: '#f8fafc' }}
                    />
                  </div>
                )}

                {/* Item Info section */}
                <div className="user-details-section" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                  <h4 className="user-details-title">Item Description</h4>
                  <div className="user-details-grid">
                    <div className="user-detail-item">
                      <span className="user-detail-label">Item Name</span>
                      <span className="user-detail-value">{selectedItem.itemName}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Report Type</span>
                      <span className="user-detail-value" style={{
                        fontWeight: 800,
                        color: selectedItem.type === 'Lost' ? '#ef4444' : '#10b981'
                      }}>{selectedItem.type.toUpperCase()}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Category</span>
                      <span className="user-detail-value">{selectedItem.category}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Current Status</span>
                      <span className="user-detail-value">
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          ...getStatusBadgeStyle(selectedItem.status)
                        }}>
                          {normStatus}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <span className="user-detail-label">Full Description</span>
                    <p style={{ fontSize: '0.88rem', color: '#334155', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                      {selectedItem.description}
                    </p>
                  </div>
                </div>

                {/* Location details */}
                <div className="user-details-section">
                  <h4 className="user-details-title">Location & Date</h4>
                  <div className="user-details-grid">
                    <div className="user-detail-item">
                      <span className="user-detail-label">Location Details</span>
                      <span className="user-detail-value">{selectedItem.location}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Date of Incident</span>
                      <span className="user-detail-value">{new Date(selectedItem.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Contact / Posted by details */}
                <div className="user-details-section">
                  <h4 className="user-details-title">Contact & Reporter</h4>
                  <div className="user-details-grid">
                    <div className="user-detail-item">
                      <span className="user-detail-label">Posted By</span>
                      <span className="user-detail-value">{selectedItem.user?.fullName || 'Citizen'}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Contact Details</span>
                      <span className="user-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={12} style={{ color: '#94a3b8' }} />
                        {selectedItem.contactInformation}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Finder recovery tracking info */}
                {selectedItem.foundBy && (
                  <div className="user-details-section">
                    <h4 className="user-details-title">Recovery Information</h4>
                    <div className="user-details-grid">
                      <div className="user-detail-item">
                        <span className="user-detail-label">Found By</span>
                        <span className="user-detail-value">{selectedItem.foundBy.fullName || 'Citizen'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Found Date</span>
                        <span className="user-detail-value">{selectedItem.foundAt ? new Date(selectedItem.foundAt).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #edf2f7', paddingTop: '16px', marginTop: '20px' }}>
                <button className="admin-btn secondary" onClick={() => setDetailsModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default UserLostFound;

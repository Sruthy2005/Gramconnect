import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Eye, Trash2, Calendar, Shield, MapPin, X, Info, HelpCircle, Loader2, 
  Search, SlidersHorizontal, Clock, Edit3, Download, CheckCircle, AlertTriangle, 
  ChevronLeft, ChevronRight, RefreshCw, FileText 
} from 'lucide-react';
import api from '../utils/api';
import './MyComplaintsPage.css';

const categoryDepartmentMap = {
  'Road Damage': 'Public Works Department (PWD)',
  'Garbage': 'Sanitation Department',
  'Water Supply': 'Water Authority',
  'Drainage': 'Sewage & Drainage Board',
  'Street Light': 'Electricity Board',
  'Electricity': 'State Power Corporation',
  'Public Safety': 'Local Police Department',
  'Traffic': 'Traffic Management Authority',
  'Environment': 'Pollution Control & Forestry Board',
  'Other': 'General Panchayat Administration'
};

const categories = [
  'Road Damage',
  'Garbage',
  'Water Supply',
  'Drainage',
  'Street Light',
  'Electricity',
  'Public Safety',
  'Traffic',
  'Environment',
  'Other'
];

export default function MyComplaintsPage() {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [trackingComplaint, setTrackingComplaint] = useState(null);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Search, Filter, and Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Edit form states
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editUrgent, setEditUrgent] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/issues/my');
      if (response.data && response.data.complaints) {
        setComplaints(response.data.complaints);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load my complaints:', err);
      showToast(err.message || 'Failed to fetch complaints list.', 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleCancelComplaint = async (id, e) => {
    if (e) e.stopPropagation(); // Prevent opening detail modal
    if (!window.confirm('Are you sure you want to cancel this complaint?')) return;

    try {
      setCancellingId(id);
      const response = await api.delete(`/issues/${id}`);
      if (response.data && response.data.success) {
        showToast('Complaint cancelled successfully.', 'success');
        setComplaints((prev) => prev.filter((c) => c._id !== id));
        if (selectedComplaint && selectedComplaint._id === id) {
          setSelectedComplaint(null);
        }
        if (trackingComplaint && trackingComplaint._id === id) {
          setTrackingComplaint(null);
        }
        if (editingComplaint && editingComplaint._id === id) {
          setEditingComplaint(null);
        }
      }
      setCancellingId(null);
    } catch (err) {
      console.error('Failed to cancel complaint:', err);
      showToast(err.message || 'Failed to cancel complaint.', 'error');
      setCancellingId(null);
    }
  };

  const openEditModal = (complaint, e) => {
    if (e) e.stopPropagation();
    setEditingComplaint(complaint);
    setEditTitle(complaint.title || '');
    setEditCategory(complaint.category || '');
    setEditDescription(complaint.description || '');
    setEditUrgent(complaint.urgent || false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim() || !editCategory) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    if (editDescription.trim().length < 20) {
      showToast('Description must be at least 20 characters long.', 'error');
      return;
    }

    try {
      setIsSubmittingEdit(true);
      // Map category to department
      const departmentName = categoryDepartmentMap[editCategory] || 'General Panchayat Administration';

      // Map priority logic
      let severity = 'Low';
      let priorityLevel = 'Normal';
      const emergencyKeywords = ['danger', 'emergency', 'fire', 'flood', 'accident', 'injured', 'broken wire', 'short circuit'];
      const hasEmergencyKeywords = emergencyKeywords.some(keyword => 
        editDescription.toLowerCase().includes(keyword) || editTitle.toLowerCase().includes(keyword)
      );

      if (editUrgent || hasEmergencyKeywords) {
        severity = 'Critical';
        priorityLevel = 'Urgent';
      } else if (editCategory === 'Public Safety' || editCategory === 'Electricity') {
        severity = 'High';
        priorityLevel = 'High';
      } else if (editCategory === 'Water Supply' || editCategory === 'Drainage') {
        severity = 'Medium';
        priorityLevel = 'Medium';
      }

      const response = await api.put(`/issues/${editingComplaint._id}`, {
        title: editTitle.trim(),
        category: editCategory,
        description: editDescription.trim(),
        urgent: editUrgent,
        assignedDepartment: departmentName,
        priority: priorityLevel,
        aiCategory: editCategory,
        aiSeverity: severity
      });

      if (response.data && response.data.success) {
        showToast('Complaint updated successfully.', 'success');
        setEditingComplaint(null);
        fetchComplaints(); // Refresh list
      }
      setIsSubmittingEdit(false);
    } catch (err) {
      console.error('Failed to update complaint:', err);
      showToast(err.message || 'Failed to update complaint.', 'error');
      setIsSubmittingEdit(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Download PDF Report function
  const handleDownloadPDF = (complaint, e) => {
    if (e) e.stopPropagation();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocker prevented PDF generation. Please allow popups.', 'error');
      return;
    }

    const dateFormatted = new Date(complaint.createdAt).toLocaleString();
    const updatedFormatted = complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : dateFormatted;

    printWindow.document.write(`
      <html>
        <head>
          <title>Complaint Report - ${complaint.complaintId}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 2px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo-title { font-size: 26px; font-weight: 800; color: #1e293b; margin: 0; }
            .logo-green { color: #22c55e; }
            .report-badge { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; }
            .title { font-size: 20px; color: #0f172a; margin: 20px 0 10px 0; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .meta-grid div { page-break-inside: avoid; }
            .meta-item { background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em; }
            .value { font-size: 13px; font-weight: 600; margin-top: 4px; color: #0f172a; }
            .section { margin-bottom: 24px; page-break-inside: avoid; }
            .section-content { background: #ffffff; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #334155; }
            .photo-gallery { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px; }
            .photo { width: 140px; height: 140px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="logo-title">Gram<span class="logo-green">Connect</span></h1>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Official Civic Grievance Portal</div>
            </div>
            <div class="report-badge">COMPLAINT DOSSIER</div>
          </div>
          
          <div class="meta-grid">
            <div class="meta-item">
              <div class="label">Complaint ID</div>
              <div class="value">${complaint.complaintId}</div>
            </div>
            <div class="meta-item">
              <div class="label">Current Status</div>
              <div class="value" style="color: ${complaint.status === 'Resolved' ? '#16a34a' : complaint.status === 'In Progress' ? '#2563eb' : '#d97706'}">${complaint.status}</div>
            </div>
            <div class="meta-item">
              <div class="label">Category</div>
              <div class="value">${complaint.category}</div>
            </div>
            <div class="meta-item">
              <div class="label">Assigned Department</div>
              <div class="value">${complaint.assignedDepartment || 'Not Assigned'}</div>
            </div>
            <div class="meta-item">
              <div class="label">Date Filed</div>
              <div class="value">${dateFormatted}</div>
            </div>
            <div class="meta-item">
              <div class="label">Last Updated</div>
              <div class="value">${updatedFormatted}</div>
            </div>
            <div class="meta-item">
              <div class="label">Priority Level</div>
              <div class="value">${complaint.priority} ${complaint.urgent ? '(Urgent)' : ''}</div>
            </div>
            <div class="meta-item">
              <div class="label">Visibility Type</div>
              <div class="value">${complaint.anonymous ? 'Anonymous Report' : 'Public Profile'}</div>
            </div>
          </div>

          <div class="section">
            <div class="title">Complaint Summary</div>
            <div class="section-content">
              <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #0f172a;">${complaint.title || 'Civic Issue'}</div>
              <div style="white-space: pre-wrap; line-height: 1.6;">${complaint.description}</div>
            </div>
          </div>

          <div class="section">
            <div class="title">Location Details</div>
            <div class="section-content">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div><strong>City / Village:</strong> ${complaint.city}</div>
                <div><strong>District:</strong> ${complaint.district}</div>
                <div><strong>State:</strong> ${complaint.state}</div>
                <div><strong>PIN Code:</strong> ${complaint.pincode}</div>
                ${complaint.ward ? `<div style="grid-column: span 2;"><strong>Ward/Block:</strong> ${complaint.ward}</div>` : ''}
                ${complaint.landmark ? `<div style="grid-column: span 2;"><strong>Landmark:</strong> ${complaint.landmark}</div>` : ''}
                ${complaint.latitude ? `<div style="grid-column: span 2;"><strong>GPS Coordinates:</strong> ${complaint.latitude}, ${complaint.longitude}</div>` : ''}
              </div>
            </div>
          </div>

          ${complaint.images && complaint.images.length > 0 ? `
            <div class="section">
              <div class="title">Evidence Photos</div>
              <div class="photo-gallery">
                ${complaint.images.map(img => `<img src="${img}" class="photo" />`).join('')}
              </div>
            </div>
          ` : ''}

          <div class="footer">
            Generated officially via GramConnect on ${new Date().toLocaleString()}. This document is verified.
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Dashboard Stats calculation
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  // Search, filter, and sort pipeline
  const filteredAndSortedComplaints = complaints
    .filter((c) => {
      if (statusFilter === 'All') return true;
      return c.status.toLowerCase() === statusFilter.toLowerCase();
    })
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(c.complaintId || '').toLowerCase().includes(q) ||
        String(c.title || '').toLowerCase().includes(q) ||
        String(c.description || '').toLowerCase().includes(q) ||
        String(c.category || '').toLowerCase().includes(q) ||
        String(c.city || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, normal: 1, low: 0 };
        const prioA = priorityOrder[a.priority.toLowerCase()] || 0;
        const prioB = priorityOrder[b.priority.toLowerCase()] || 0;
        if (prioB !== prioA) {
          return prioB - prioA;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedComplaints.length / pageSize) || 1;
  const paginatedComplaints = filteredAndSortedComplaints.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  // Loading Skeletons Renderer
  if (loading) {
    return (
      <div className="my-complaints-container">
        <div className="complaints-header-card glass-card">
          <h2 className="complaints-header-title">My Filed Complaints</h2>
          <p className="complaints-header-desc">Loading reported civic complaints and status metrics...</p>
        </div>

        {/* Stats Grid Skeletons */}
        <div className="complaints-stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card glass-card skeleton-stat pulse">
              <div className="skeleton-icon" />
              <div className="skeleton-info">
                <div className="skeleton-text short" />
                <div className="skeleton-text val" />
              </div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="table-card glass-card skeleton-table pulse">
          <div className="skeleton-bar" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-row-line" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="my-complaints-container">
      {/* Toast Alert List */}
      <div className="toasts-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="complaints-header-card glass-card">
        <h2 className="complaints-header-title">My Filed Complaints</h2>
        <p className="complaints-header-desc">
          Track, review, edit, or cancel your reported civic complaints and village works requests.
        </p>
      </div>

      {/* Dashboard Stats Summary Cards */}
      <div className="complaints-stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper total"><Shield size={22} /></div>
          <div className="stat-info">
            <span className="stat-card-title">Total Complaints</span>
            <span className="stat-card-value">{totalCount}</span>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper pending"><Clock size={22} /></div>
          <div className="stat-info">
            <span className="stat-card-title">Pending</span>
            <span className="stat-card-value">{pendingCount}</span>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper progress"><RefreshCw size={22} /></div>
          <div className="stat-info">
            <span className="stat-card-title">In Progress</span>
            <span className="stat-card-value">{inProgressCount}</span>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper resolved"><CheckCircle size={22} /></div>
          <div className="stat-info">
            <span className="stat-card-title">Resolved</span>
            <span className="stat-card-value">{resolvedCount}</span>
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Controls Panel */}
      <div className="complaints-controls-card glass-card">
        <div className="controls-search-row">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by ID, title, description or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="complaints-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="btn-clear-search">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="sort-input-wrapper">
            <SlidersHorizontal size={14} className="sort-icon" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="complaints-sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="status-filter-tabs">
          {['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'].map((status) => {
            const count = status === 'All' ? totalCount : 
                          status === 'Pending' ? pendingCount : 
                          status === 'In Progress' ? inProgressCount : 
                          status === 'Resolved' ? resolvedCount : 0;
            return (
              <button 
                key={status} 
                className={`status-tab-btn ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                <span>{status}</span>
                {status !== 'Rejected' && <span className="tab-count">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {filteredAndSortedComplaints.length === 0 ? (
        <div className="empty-complaints-card glass-card">
          <HelpCircle size={44} className="empty-state-icon" />
          <h4>No complaints match your criteria</h4>
          <p>We couldn't find any filed complaints matching your filters or search query. Try resetting your search query or choosing another status.</p>
          {(searchQuery || statusFilter !== 'All') && (
            <button 
              className="btn-reset-filters"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setSortBy('newest');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-card glass-card desktop-table-view">
            <div className="table-responsive-wrapper">
              <table className="my-complaints-table">
                <thead>
                  <tr>
                    <th>Complaint ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Date Filed</th>
                    <th>Last Updated</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedComplaints.map((c) => (
                    <tr key={c._id} className="complaint-row-clickable" onClick={() => setSelectedComplaint(c)}>
                      <td className="col-id">{c.complaintId}</td>
                      <td className="col-title" title={c.title}>
                        <span className="truncate-text">{c.title || 'Civic Issue'}</span>
                      </td>
                      <td className="col-category">
                        <span className="category-text">{c.category}</span>
                        {c.urgent && <span className="urgent-badge-inline">Urgent</span>}
                      </td>
                      <td className="col-location" title={c.city}>
                        <span className="truncate-text">{c.city}</span>
                      </td>
                      <td className="col-date">{formatDate(c.createdAt)}</td>
                      <td className="col-date">{formatDate(c.updatedAt || c.createdAt)}</td>
                      <td className="col-priority">
                        <span className={`priority-badge-dot ${c.priority.toLowerCase()}`} />
                        <span>{c.priority}</span>
                      </td>
                      <td className="col-status">
                        <span className={`status-badge-outline ${c.status.toLowerCase().replace(' ', '-')}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="btn-action-view" 
                          title="View Details"
                          onClick={() => setSelectedComplaint(c)}
                        >
                          <Eye size={13} />
                        </button>
                        <button 
                          className="btn-action-track" 
                          title="Track Progress"
                          onClick={() => setTrackingComplaint(c)}
                        >
                          <Clock size={13} />
                        </button>
                        {c.status === 'Pending' && (
                          <button 
                            className="btn-action-edit" 
                            title="Edit Complaint"
                            onClick={(e) => openEditModal(c, e)}
                          >
                            <Edit3 size={13} />
                          </button>
                        )}
                        {c.status === 'Pending' && (
                          <button
                            className="btn-action-cancel"
                            title="Cancel/Delete"
                            onClick={(e) => handleCancelComplaint(c._id, e)}
                            disabled={cancellingId === c._id}
                          >
                            {cancellingId === c._id ? (
                              <Loader2 className="spinner-mini" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        )}
                        <button 
                          className="btn-action-pdf" 
                          title="Download PDF Dossier"
                          onClick={(e) => handleDownloadPDF(c, e)}
                        >
                          <Download size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="mobile-cards-view">
            {paginatedComplaints.map((c) => (
              <div key={c._id} className="mobile-complaint-card glass-card" onClick={() => setSelectedComplaint(c)}>
                <div className="card-header-row">
                  <span className="card-id">{c.complaintId}</span>
                  <span className={`status-badge-outline ${c.status.toLowerCase().replace(' ', '-')}`}>
                    {c.status}
                  </span>
                </div>
                
                <h4 className="card-title">{c.title || 'Civic Issue'}</h4>
                <div className="card-divider" />
                
                <div className="card-info-grid">
                  <div className="card-info-item">
                    <span className="info-lbl">Category</span>
                    <span className="info-val">{c.category} {c.urgent && <span className="urgent-badge-inline">Urgent</span>}</span>
                  </div>
                  <div className="card-info-item">
                    <span className="info-lbl">Priority</span>
                    <span className="info-val" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span className={`priority-badge-dot ${c.priority.toLowerCase()}`} />
                      {c.priority}
                    </span>
                  </div>
                  <div className="card-info-item">
                    <span className="info-lbl">Location</span>
                    <span className="info-val truncate-text">{c.city}</span>
                  </div>
                  <div className="card-info-item">
                    <span className="info-lbl">Last Updated</span>
                    <span className="info-val">{formatDate(c.updatedAt || c.createdAt)}</span>
                  </div>
                </div>

                <div className="card-actions-row" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setSelectedComplaint(c)} className="btn-mobile-act view">
                    <Eye size={12} />
                    <span>View</span>
                  </button>
                  <button onClick={() => setTrackingComplaint(c)} className="btn-mobile-act track">
                    <Clock size={12} />
                    <span>Track</span>
                  </button>
                  {c.status === 'Pending' && (
                    <button onClick={(e) => openEditModal(c, e)} className="btn-mobile-act edit">
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                  )}
                  {c.status === 'Pending' && (
                    <button 
                      onClick={(e) => handleCancelComplaint(c._id, e)} 
                      disabled={cancellingId === c._id}
                      className="btn-mobile-act delete"
                    >
                      {cancellingId === c._id ? <Loader2 className="spinner-mini" /> : <Trash2 size={12} />}
                      <span>Cancel</span>
                    </button>
                  )}
                  <button onClick={(e) => handleDownloadPDF(c, e)} className="btn-mobile-act pdf">
                    <Download size={12} />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="complaints-pagination-wrapper glass-card">
              <button 
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-pagination-nav"
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>
              
              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`btn-pagination-page ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-pagination-nav"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Details View Modal Panel */}
      {selectedComplaint && (
        <div className="modal-backdrop" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-content-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="modal-title-meta">
                <span className="modal-subtitle">COMPLAINT DETAIL REPORT</span>
                <h3 className="modal-title">{selectedComplaint.complaintId}</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedComplaint(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-grid">
              {/* Left Side Details */}
              <div className="modal-main-details">
                <div className="detail-meta-box">
                  <h4 className="detail-section-title">Complaint Title</h4>
                  <p className="detail-title-text" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                    {selectedComplaint.title || 'Civic Issue'}
                  </p>
                </div>

                <div className="detail-meta-box">
                  <h4 className="detail-section-title">Issue Description</h4>
                  <p className="detail-description-text">{selectedComplaint.description}</p>
                </div>

                {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                  <div className="detail-meta-box">
                    <h4 className="detail-section-title">Attached Evidence Photos</h4>
                    <div className="detail-images-gallery">
                      {selectedComplaint.images.map((img, idx) => (
                        <a href={img} target="_blank" rel="noopener noreferrer" key={idx} className="gallery-img-link">
                          <img src={img} alt={`Complaint attach ${idx + 1}`} className="gallery-thumbnail" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side Status Panel */}
              <div className="modal-aside-details">
                <div className="status-summary-card">
                  <div className="status-row">
                    <span className="status-label">Current Status</span>
                    <span className={`status-badge-outline ${selectedComplaint.status.toLowerCase().replace(' ', '-')}`}>
                      {selectedComplaint.status}
                    </span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">Department</span>
                    <span className="status-val">{selectedComplaint.assignedDepartment}</span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">Report Type</span>
                    <span className="status-val">{selectedComplaint.anonymous ? 'Anonymous Report' : 'Public Profile'}</span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">Urgency Level</span>
                    <span className={`priority-badge-text ${selectedComplaint.priority.toLowerCase()}`}>
                      {selectedComplaint.urgent ? 'Immediate Emergency' : selectedComplaint.priority}
                    </span>
                  </div>
                </div>

                <div className="location-summary-card">
                  <h4 className="detail-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} style={{ color: 'var(--primary)' }} />
                    <span>Location Address</span>
                  </h4>
                  <div className="location-address-list">
                    <span><strong>City:</strong> {selectedComplaint.city}</span>
                    {selectedComplaint.ward && <span><strong>Ward:</strong> {selectedComplaint.ward}</span>}
                    {selectedComplaint.landmark && <span><strong>Landmark:</strong> {selectedComplaint.landmark}</span>}
                    <span><strong>District:</strong> {selectedComplaint.district}</span>
                    <span><strong>PIN Code:</strong> {selectedComplaint.pincode}</span>
                  </div>

                  {selectedComplaint.latitude && selectedComplaint.longitude && (
                    <div className="modal-map-wrapper">
                      <iframe
                        title="Complaint GPS location Map"
                        width="100%"
                        height="120"
                        frameBorder="0"
                        scrolling="no"
                        src={`https://maps.google.com/maps?q=${selectedComplaint.latitude},${selectedComplaint.longitude}&z=14&output=embed`}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    className="btn-modal-action track-btn"
                    onClick={() => {
                      setSelectedComplaint(null);
                      setTrackingComplaint(selectedComplaint);
                    }}
                    style={{
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      height: '40px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Clock size={14} />
                    <span>Track Progress</span>
                  </button>

                  <button 
                    className="btn-modal-action print-btn"
                    onClick={(e) => handleDownloadPDF(selectedComplaint, e)}
                    style={{
                      background: '#f1f5f9',
                      color: 'var(--text-dark)',
                      border: '1px solid #cbd5e1',
                      height: '40px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Download size={14} />
                    <span>Download PDF Dossier</span>
                  </button>

                  {selectedComplaint.status === 'Pending' && (
                    <button 
                      className="btn-modal-cancel"
                      onClick={(e) => handleCancelComplaint(selectedComplaint._id, e)}
                      style={{ marginTop: '4px' }}
                    >
                      Cancel Complaint Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Tracking Timeline Modal */}
      {trackingComplaint && (
        <div className="modal-backdrop" onClick={() => setTrackingComplaint(null)}>
          <div className="modal-content-card glass-card timeline-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="modal-title-meta">
                <span className="modal-subtitle">COMPLAINT TRACKER</span>
                <h3 className="modal-title">Tracking Progress for {trackingComplaint.complaintId}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                  <strong>Title:</strong> {trackingComplaint.title || 'Civic Issue'}
                </span>
              </div>
              <button className="btn-close-modal" onClick={() => setTrackingComplaint(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-timeline-body">
              {/* Timeline content helper */}
              {(() => {
                const status = trackingComplaint.status;
                const isPending = status === 'Pending';
                const isInProgress = status === 'In Progress';
                const isResolved = status === 'Resolved';
                const isRejected = status === 'Rejected';

                const step1Status = 'completed';
                
                let step2Status = 'upcoming';
                if (!isPending) {
                  step2Status = (isInProgress || isResolved || isRejected) ? 'completed' : 'current';
                } else {
                  step2Status = 'current';
                }

                let step3Status = 'upcoming';
                if (isInProgress) {
                  step3Status = 'current';
                } else if (isResolved || isRejected) {
                  step3Status = 'completed';
                }

                let step4Status = 'upcoming';
                if (isResolved || isRejected) {
                  step4Status = 'completed';
                }

                return (
                  <div className="tracking-timeline">
                    <div className={`timeline-step ${step1Status}`}>
                      <div className="step-marker" />
                      <div className="step-content-box">
                        <h4 className="step-lbl">Complaint Submitted</h4>
                        <p className="step-desc">Your complaint has been successfully recorded on the portal.</p>
                        <span className="step-time-badge"><Calendar size={11} /> {formatDate(trackingComplaint.createdAt)}</span>
                      </div>
                    </div>

                    <div className={`timeline-step ${step2Status}`}>
                      <div className="step-marker" />
                      <div className="step-content-box">
                        <h4 className="step-lbl">Reviewed & Dispatched</h4>
                        <p className="step-desc">
                          {step2Status === 'completed' 
                            ? `Complaint reviewed by administrators and successfully assigned to ${trackingComplaint.assignedDepartment}.`
                            : 'Admin is currently reviewing the complaint for department routing.'}
                        </p>
                      </div>
                    </div>

                    <div className={`timeline-step ${step3Status}`}>
                      <div className="step-marker" />
                      <div className="step-content-box">
                        <h4 className="step-lbl">Investigation & In Progress</h4>
                        <p className="step-desc">
                          {step3Status === 'completed'
                            ? 'Field inspection is completed and the issue is resolved.'
                            : step3Status === 'current'
                            ? `The assigned department (${trackingComplaint.assignedDepartment}) is working on the site.`
                            : 'Resolutions will initiate after assignment review.'}
                        </p>
                      </div>
                    </div>

                    <div className={`timeline-step ${step4Status} ${isRejected ? 'rejected' : ''}`}>
                      <div className="step-marker" />
                      <div className="step-content-box">
                        <h4 className="step-lbl">{isRejected ? 'Report Rejected' : 'Issue Resolved'}</h4>
                        <p className="step-desc">
                          {isRejected 
                            ? 'This complaint could not be resolved or was rejected after inspection.'
                            : isResolved 
                            ? 'Action completed. The issue has been marked resolved.' 
                            : 'Final resolution validation is pending.'}
                        </p>
                        {(isResolved || isRejected) && (
                          <span className="step-time-badge"><Calendar size={11} /> {formatDate(trackingComplaint.updatedAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setTrackingComplaint(null)} className="btn-close-timeline-modal" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: 'var(--text-dark)', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                Close Tracker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Complaint Modal (Pending Only) */}
      {editingComplaint && (
        <div className="modal-backdrop" onClick={() => setEditingComplaint(null)}>
          <div className="modal-content-card glass-card edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="modal-title-meta">
                <span className="modal-subtitle">MODIFY REPORT</span>
                <h3 className="modal-title">Edit Complaint {editingComplaint.complaintId}</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setEditingComplaint(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="edit-complaint-form">
              <div className="form-input-group">
                <label className="form-label" htmlFor="edit-title">Complaint Title <span className="req">*</span></label>
                <input 
                  type="text" 
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Summary of the issue"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-input-group">
                <label className="form-label" htmlFor="edit-category">Category <span className="req">*</span></label>
                <select 
                  id="edit-category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="form-input select"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-input-group">
                <label className="form-label" htmlFor="edit-desc">Description <span className="req">*</span></label>
                <textarea 
                  id="edit-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Provide details about the issue..."
                  className="form-textarea"
                  rows={5}
                  required
                />
                {editDescription.length > 0 && editDescription.length < 20 && (
                  <span className="form-error-inline">
                    <AlertTriangle size={12} /> Minimum 20 characters required. (Current: {editDescription.length})
                  </span>
                )}
              </div>

              <div className="form-input-group checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <input 
                  type="checkbox" 
                  id="edit-urgent"
                  checked={editUrgent}
                  onChange={(e) => setEditUrgent(e.target.checked)}
                  className="form-checkbox"
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="edit-urgent" className="form-checkbox-label" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <strong>Urgent Issue:</strong> Flag as emergency for priority routing.
                </label>
              </div>

              <div className="edit-form-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button 
                  type="button" 
                  onClick={() => setEditingComplaint(null)} 
                  className="btn-edit-cancel"
                  disabled={isSubmittingEdit}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: 'var(--text-dark)', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-edit-submit"
                  disabled={isSubmittingEdit}
                  style={{ background: 'var(--primary)', color: 'white', border: '1px solid var(--primary)', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSubmittingEdit ? <Loader2 className="spinner-mini" style={{ color: 'white' }} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

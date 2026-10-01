import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Calendar, Clock, AlertTriangle, CheckCircle, Info, ChevronRight, HelpCircle, Loader2 } from 'lucide-react';
import api from '../utils/api';
import './ComplaintStatusPage.css';

export default function ComplaintStatusPage() {
  const { t } = useTranslation();
  
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [currentComplaint, setCurrentComplaint] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchMyComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/issues/my');
      if (res.data && res.data.complaints) {
        setMyComplaints(res.data.complaints);
        
        // Parse ID from URL parameters immediately
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const urlId = params.get('id');
        if (urlId) {
          const matched = res.data.complaints.find(
            (c) => c.complaintId === urlId || c._id === urlId
          );
          if (matched) {
            setCurrentComplaint(matched);
            setSelectedId(matched.complaintId);
            setSearchText(matched.complaintId);
          } else {
            setErrorMsg(`Complaint with ID "${urlId}" not found in your list.`);
          }
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('[DEV] Failed to load user complaints list:', err);
      setErrorMsg('Failed to load your complaints list. Please refresh the page.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  // Sync state if window location hash changes (e.g. clicking tracker link again)
  useEffect(() => {
    const handleHashChange = () => {
      const params = new URLSearchParams(window.location.hash.split('?')[1]);
      const urlId = params.get('id');
      if (urlId && myComplaints.length > 0) {
        const matched = myComplaints.find(
          (c) => c.complaintId === urlId || c._id === urlId
        );
        if (matched) {
          setCurrentComplaint(matched);
          setSelectedId(matched.complaintId);
          setSearchText(matched.complaintId);
          setErrorMsg('');
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [myComplaints]);

  const handleTrackAction = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const term = searchText.trim();
    if (!term) {
      setErrorMsg('Please enter or select a Complaint ID to track.');
      setCurrentComplaint(null);
      return;
    }

    const matched = myComplaints.find(
      (c) => c.complaintId.toLowerCase() === term.toLowerCase() || c._id === term
    );
    if (matched) {
      setCurrentComplaint(matched);
      setSelectedId(matched.complaintId);
      setSearchText(matched.complaintId);
      // Sync URL hash parameter
      window.location.hash = `#dashboard/status?id=${matched.complaintId}`;
    } else {
      setCurrentComplaint(null);
      setErrorMsg(`Complaint ID "${term}" not found in your filed list.`);
    }
  };

  const handleSelectChange = (val) => {
    setSelectedId(val);
    setSearchText(val);
    setErrorMsg('');
    if (!val) {
      setCurrentComplaint(null);
      // Remove URL parameter
      window.location.hash = '#dashboard/status';
      return;
    }
    const matched = myComplaints.find((c) => c.complaintId === val);
    if (matched) {
      setCurrentComplaint(matched);
      window.location.hash = `#dashboard/status?id=${matched.complaintId}`;
    }
  };

  const getStepStatusClass = (stepName, currentStatus) => {
    const statusOrder = ['Pending', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    if (currentIndex === -1) return 'upcoming';

    if (stepName === 'Submitted') {
      return 'completed';
    }
    
    if (stepName === 'Verified') {
      if (currentIndex >= 1) return 'completed';
      if (currentIndex === 0) return 'current';
      return 'upcoming';
    }
    
    if (stepName === 'Assigned') {
      if (currentIndex >= 2) return 'completed';
      if (currentIndex === 1) return 'current';
      return 'upcoming';
    }
    
    if (stepName === 'Work Started') {
      if (currentIndex >= 3) return 'completed';
      if (currentIndex === 2) return 'current';
      return 'upcoming';
    }
    
    if (stepName === 'Resolved/Rejected') {
      if (currentStatus === 'Resolved' || currentStatus === 'Rejected') {
        return currentStatus === 'Rejected' ? 'rejected' : 'completed';
      }
      if (currentIndex === 3) return 'current';
      return 'upcoming';
    }
    
    return 'upcoming';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="status-page-container">
      {/* Header */}
      <div className="status-header-card">
        <h2 className="status-header-title">Complaint Status Tracker</h2>
        <p className="status-header-desc">
          Track the real-time progress and resolution of your submitted civic grievances.
        </p>
      </div>

      {/* Tracker Controls Card */}
      <div className="tracker-controls-card">
        <h3 className="tracker-title">Select or Enter Complaint ID</h3>
        <form onSubmit={handleTrackAction} className="tracker-inputs-row">
          
          <div className="tracker-field">
            <label className="tracker-label">Choose from Your Reports</label>
            <select
              value={selectedId}
              onChange={(e) => handleSelectChange(e.target.value)}
              className="tracker-select"
              disabled={loading || myComplaints.length === 0}
            >
              <option value="">-- Choose Complaint --</option>
              {myComplaints.map((c) => (
                <option key={c._id} value={c.complaintId}>
                  {c.complaintId} - {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="tracker-field">
            <label className="tracker-label">Or Type Complaint ID</label>
            <div className="tracker-input-wrapper">
              <Search size={16} className="tracker-input-icon" />
              <input
                type="text"
                placeholder="e.g. GC-982180"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="tracker-input"
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn-track-submit" disabled={loading}>
            <span>Track Status</span>
            <ChevronRight size={16} />
          </button>
        </form>

        {errorMsg && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
            <AlertTriangle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 32px', gap: '12px' }}>
          <Loader2 className="spinner-gps" style={{ width: '36px', height: '36px', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Fetching tracker data...</span>
        </div>
      ) : currentComplaint ? (
        /* Detailed Complaint View */
        <div className="tracked-complaint-details">
          
          {/* Timeline Card */}
          <div className="details-main-panel">
            <div className="timeline-card">
              <h3 className="timeline-title">Real-time Resolution Timeline</h3>
              
              <div className="tracking-timeline-container">
                
                {/* Step 1: Submitted */}
                {(() => {
                  const stepClass = getStepStatusClass('Submitted', currentComplaint.status);
                  return (
                    <div className={`timeline-track-step ${stepClass}`}>
                      <div className="timeline-track-marker" />
                      <div className="timeline-track-content">
                        <h4 className="timeline-track-label">Complaint Submitted</h4>
                        <p className="timeline-track-desc">
                          The grievance was recorded successfully on the GramConnect portal.
                        </p>
                        <span className="timeline-track-time">
                          <Calendar size={11} /> {formatDate(currentComplaint.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Step 2: Verified */}
                {(() => {
                  const stepClass = getStepStatusClass('Verified', currentComplaint.status);
                  return (
                    <div className={`timeline-track-step ${stepClass}`}>
                      <div className="timeline-track-marker" />
                      <div className="timeline-track-content">
                        <h4 className="timeline-track-label">Verified & Audited</h4>
                        <p className="timeline-track-desc">
                          {stepClass === 'completed'
                            ? 'Administrators completed verification checks and confirmed the reported issue is genuine.'
                            : stepClass === 'current'
                            ? 'Administrator is currently reviewing coordinates and photos to verify the issue.'
                            : 'Awaiting administrator verification.'}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Step 3: Assigned */}
                {(() => {
                  const stepClass = getStepStatusClass('Assigned', currentComplaint.status);
                  return (
                    <div className={`timeline-track-step ${stepClass}`}>
                      <div className="timeline-track-marker" />
                      <div className="timeline-track-content">
                        <h4 className="timeline-track-label">Assigned to Department</h4>
                        <p className="timeline-track-desc">
                          {stepClass === 'completed'
                            ? `Grievance officially dispatched to ${currentComplaint.assignedDepartment}.`
                            : stepClass === 'current'
                            ? 'Preparing to dispatch and assign the report to the corresponding local authority.'
                            : 'Awaiting department assignment.'}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Step 4: Work Started */}
                {(() => {
                  const stepClass = getStepStatusClass('Work Started', currentComplaint.status);
                  return (
                    <div className={`timeline-track-step ${stepClass}`}>
                      <div className="timeline-track-marker" />
                      <div className="timeline-track-content">
                        <h4 className="timeline-track-label">Work Started & In Progress</h4>
                        <p className="timeline-track-desc">
                          {stepClass === 'completed'
                            ? 'Field work, inspection, and necessary repair works are completed.'
                            : stepClass === 'current'
                            ? `Field officers from ${currentComplaint.assignedDepartment} are on-site resolving the issue.`
                            : 'Awaiting work initiation.'}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Step 5: Resolved / Rejected */}
                {(() => {
                  const stepClass = getStepStatusClass('Resolved/Rejected', currentComplaint.status);
                  const isRejected = currentComplaint.status === 'Rejected';
                  return (
                    <div className={`timeline-track-step ${stepClass}`}>
                      <div className="timeline-track-marker" />
                      <div className="timeline-track-content">
                        <h4 className="timeline-track-label">
                          {isRejected ? 'Report Rejected' : 'Issue Resolved'}
                        </h4>
                        <p className="timeline-track-desc">
                          {isRejected
                            ? 'The issue was rejected following inspection (e.g. out of scope or invalid details).'
                            : currentComplaint.status === 'Resolved'
                            ? 'Resolution actions are completed. The issue has been marked resolved.'
                            : 'Awaiting final verification and resolution report.'}
                        </p>
                        {(currentComplaint.status === 'Resolved' || isRejected) && (
                          <span className="timeline-track-time">
                            <Clock size={11} /> {formatDate(currentComplaint.updatedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>

          {/* Aside Panel Summary */}
          <div className="details-aside-panel">
            
            {/* General Info Card */}
            <div className="info-summary-card">
              <div className="info-summary-header">
                <div>
                  <span className="aside-title">Tracked Grievance Summary</span>
                  <h4 className="info-summary-title">{currentComplaint.title || 'Civic Issue'}</h4>
                  <p className="info-summary-id">{currentComplaint.complaintId}</p>
                </div>
              </div>

              <div className="info-badge-row" style={{ flexWrap: 'wrap', gap: '6px' }}>
                <span className={`status-badge-outline ${currentComplaint.status.toLowerCase().replace(' ', '-')}`}>
                  {currentComplaint.status}
                </span>
                <span className={`priority-badge-dot ${currentComplaint.priority.toLowerCase()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '9999px', background: '#f1f5f9', fontSize: '0.72rem', fontWeight: 700 }}>
                  <span className={`priority-badge-dot ${currentComplaint.priority.toLowerCase()}`} />
                  {currentComplaint.priority}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '0.72rem', fontWeight: 700 }}>
                  🤖 AI: {currentComplaint.aiCategory || currentComplaint.category}
                </span>
              </div>

              <div className="info-desc-box">
                <span className="info-desc-title">Description</span>
                <p className="info-desc-text">{currentComplaint.description}</p>
              </div>
            </div>

            {/* Location Address Card */}
            <div className="aside-summary-card">
              <span className="aside-title">Location Summary</span>
              <h4 className="aside-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dark)' }}>
                <MapPin size={14} style={{ color: 'var(--primary)' }} />
                <span>Address Details</span>
              </h4>
              
              <div className="aside-address-list">
                <span><strong>Taluk:</strong> {currentComplaint.taluk}</span>
                <span><strong>Local Body:</strong> {currentComplaint.localBody} ({currentComplaint.localBodyType})</span>
                <span><strong>City / Village:</strong> {currentComplaint.city}</span>
                {currentComplaint.ward && <span><strong>Ward:</strong> {currentComplaint.ward}</span>}
                {currentComplaint.landmark && <span><strong>Landmark:</strong> {currentComplaint.landmark}</span>}
                <span><strong>District:</strong> {currentComplaint.district}</span>
                <span><strong>PIN Code:</strong> {currentComplaint.pincode}</span>
              </div>

              {currentComplaint.latitude && currentComplaint.longitude && (
                <div className="aside-map-box">
                  <iframe
                    title="Complaint Location Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://maps.google.com/maps?q=${currentComplaint.latitude},${currentComplaint.longitude}&z=14&output=embed`}
                  />
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* Empty Tracker State Card */
        <div className="empty-tracker-card">
          <div className="empty-tracker-icon-box">
            <HelpCircle size={32} />
          </div>
          <h4 className="empty-tracker-title">No Tracked Complaint</h4>
          <p className="empty-tracker-desc">
            Choose a complaint from your list of filed reports or input a specific Complaint ID in the fields above to trace its progress timeline.
          </p>
        </div>
      )}
    </div>
  );
}

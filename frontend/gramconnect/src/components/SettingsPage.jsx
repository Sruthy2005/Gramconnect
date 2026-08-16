import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Bell, Lock, Eye, EyeOff, LogOut, Trash2, AlertTriangle, AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './SettingsPage.css';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, logout: handleLogout } = useAuth();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Settings State
  const [notifPrefs, setNotifPrefs] = useState({
    complaintUpdates: true,
    announcements: true,
    communityNotifs: true,
    emailNotifs: true
  });
  const [privacySettings, setPrivacySettings] = useState({
    profilePublic: true,
    communityVisible: true
  });
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Dialog Modals State
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await api.get('/profile/settings');
      if (res.data && res.data.success) {
        setNotifPrefs(res.data.notificationPreferences);
        setPrivacySettings(res.data.privacySettings);
      }
      setSettingsLoading(false);
    } catch (err) {
      console.error('[DEV] Failed to fetch settings:', err);
      showToast('Failed to load preferences. Using default values.', 'error');
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handler for toggle actions (Auto-save)
  const handleToggleNotif = async (key, val) => {
    const updatedNotif = { ...notifPrefs, [key]: val };
    setNotifPrefs(updatedNotif);

    try {
      const res = await api.put('/profile/settings', {
        notificationPreferences: updatedNotif
      });
      if (res.data && res.data.success) {
        showToast('Notification preferences updated.', 'success');
      }
    } catch (err) {
      console.error('[DEV] Failed to update settings:', err);
      showToast('Failed to save notification preference.', 'error');
      // Rollback
      setNotifPrefs(notifPrefs);
    }
  };

  const handleTogglePrivacy = async (key, val) => {
    const updatedPrivacy = { ...privacySettings, [key]: val };
    setPrivacySettings(updatedPrivacy);

    try {
      const res = await api.put('/profile/settings', {
        privacySettings: updatedPrivacy
      });
      if (res.data && res.data.success) {
        showToast('Privacy settings updated.', 'success');
      }
    } catch (err) {
      console.error('[DEV] Failed to update privacy:', err);
      showToast('Failed to save privacy setting.', 'error');
      // Rollback
      setPrivacySettings(privacySettings);
    }
  };

  // Change Password Submit
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await api.put('/profile/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword
      });

      if (res.data && res.data.success) {
        setPasswordSuccess('Password updated successfully!');
        showToast('Password changed successfully.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
      setPasswordLoading(false);
    } catch (err) {
      console.error('[DEV] Change password failed:', err);
      setPasswordError(err.response?.data?.message || 'Incorrect current password or failed to change.');
      setPasswordLoading(false);
    }
  };

  // Delete Account Submit
  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      const res = await api.delete('/profile');
      if (res.data && res.data.success) {
        showToast('Your account was successfully deleted. Logging out...', 'success');
        setTimeout(() => {
          handleLogout();
        }, 1500);
      }
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('[DEV] Failed to delete account:', err);
      showToast('Failed to delete your account. Please try again.', 'error');
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="settings-page-container">
      {/* Toast Alert Portal */}
      <div className="toast-portal" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              background: toast.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'slideUp 0.2s ease-out'
            }}
          >
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="settings-header-card">
        <h2 className="settings-header-title">Account Settings</h2>
        <p className="settings-header-desc">
          Manage your account security configurations, notification preferences, privacy displays, and diagnostic logs.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="settings-details-grid">
        
        {/* Main Column (Security, Preferences) */}
        <div className="settings-main-column">
          
          {/* Security & Password */}
          <div className="settings-card">
            <div className="settings-card-header">
              <Lock size={18} style={{ color: 'var(--primary)' }} />
              <h3 className="settings-card-title">Security & Credentials</h3>
            </div>

            {user.authProvider === 'google' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', border: '1px dashed #3b82f633', background: '#3b82f60a', borderRadius: '12px', textAlign: 'center', color: '#1e40af', fontSize: '0.85rem', fontWeight: 600 }}>
                <Shield size={24} style={{ alignSelf: 'center' }} />
                <span>Google Managed Account</span>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>
                  Your authentication credentials are managed securely via Google. Manual password overrides are disabled.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="password-form">
                
                {passwordError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '10px', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}>
                    <AlertCircle size={16} />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '10px', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                    <CheckCircle size={16} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div className="input-field-group">
                  <label className="input-label" htmlFor="curr-pwd">Current Password</label>
                  <div className="input-wrapper">
                    <Shield size={16} className="input-icon-left" />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      id="curr-pwd"
                      className="profile-input"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setPasswordError('');
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      style={{ position: 'absolute', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="input-field-group">
                  <label className="input-label" htmlFor="new-pwd">New Password</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon-left" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      id="new-pwd"
                      className="profile-input"
                      placeholder="Enter new password (min. 8 chars)"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError('');
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      style={{ position: 'absolute', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="input-field-group">
                  <label className="input-label" htmlFor="conf-pwd">Confirm New Password</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon-left" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      id="conf-pwd"
                      className="profile-input"
                      placeholder="Retype new password"
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setPasswordError('');
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{ position: 'absolute', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-password-submit" disabled={passwordLoading} style={{ marginTop: '12px' }}>
                  {passwordLoading ? <Loader2 className="profile-spinner-btn" /> : 'Update Credentials'}
                </button>
              </form>
            )}
          </div>

          {/* Notification Preferences */}
          <div className="settings-card">
            <div className="settings-card-header">
              <Bell size={18} style={{ color: 'var(--primary)' }} />
              <h3 className="settings-card-title">Notification Preferences</h3>
            </div>

            {settingsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0', gap: '8px' }}>
                <Loader2 className="profile-spinner" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading preferences...</span>
              </div>
            ) : (
              <div className="settings-preference-list">
                
                <div className="preference-item">
                  <div className="preference-info">
                    <span className="preference-title">Complaint Status Updates</span>
                    <span className="preference-desc">Receive notifications when your civic complaints transition status.</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.complaintUpdates}
                      onChange={(e) => handleToggleNotif('complaintUpdates', e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <span className="preference-title">Announcements & Circulars</span>
                    <span className="preference-desc">Get notified about new local body updates and government circulars.</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.announcements}
                      onChange={(e) => handleToggleNotif('announcements', e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <span className="preference-title">Community Notifications</span>
                    <span className="preference-desc">Get alerts for replies, likes, or threads inside the local Community Hub.</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.communityNotifs}
                      onChange={(e) => handleToggleNotif('communityNotifs', e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <span className="preference-title">Email Notifications</span>
                    <span className="preference-desc">Send dispatch alerts and summaries directly to your registered email account.</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.emailNotifs}
                      onChange={(e) => handleToggleNotif('emailNotifs', e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Aside Column (Privacy, Actions) */}
        <div className="settings-aside-column">
          
          {/* Privacy Controls */}
          <div className="settings-card">
            <div className="settings-card-header">
              <Shield size={18} style={{ color: 'var(--primary)' }} />
              <h3 className="settings-card-title">Privacy Toggles</h3>
            </div>

            {settingsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0', gap: '8px' }}>
                <Loader2 className="profile-spinner" />
              </div>
            ) : (
              <div className="settings-preference-list">
                
                <div className="preference-item">
                  <div className="preference-info">
                    <span className="preference-title">Public Profile Visibility</span>
                    <span className="preference-desc">Allow other verified ward members to view your name and district details.</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={privacySettings.profilePublic}
                      onChange={(e) => handleTogglePrivacy('profilePublic', e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <span className="preference-title">Community Visibility</span>
                    <span className="preference-desc">Display your community contributions and lost-and-found claims publicly.</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={privacySettings.communityVisible}
                      onChange={(e) => handleTogglePrivacy('communityVisible', e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>

              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="settings-card">
            <div className="settings-card-header">
              <Info size={18} style={{ color: 'var(--primary)' }} />
              <h3 className="settings-card-title">Account Actions</h3>
            </div>

            <div className="account-actions-list">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="btn-action-settings logout"
              >
                <LogOut size={16} />
                <span>Sign Out of Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-action-settings delete"
              >
                <Trash2 size={16} />
                <span>Delete GramConnect Account</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-box warning">
              <LogOut size={26} />
            </div>
            <h4 className="confirm-title">Sign Out?</h4>
            <p className="confirm-desc">
              Are you sure you want to end your session? You will need to type in your credentials to access the GramConnect dashboard again.
            </p>
            <div className="confirm-actions-row">
              <button onClick={() => setShowLogoutConfirm(false)} className="btn-confirm-act cancel">
                Cancel
              </button>
              <button onClick={handleLogout} className="btn-confirm-act proceed-warning">
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-box danger">
              <AlertTriangle size={26} />
            </div>
            <h4 className="confirm-title">Delete Account Permanent?</h4>
            <p className="confirm-desc">
              This action is highly critical! Setting your profile to inactive will disable login access, cancel all pending complaints, and suspend notification dispatching. This action is irreversible.
            </p>
            <div className="confirm-actions-row">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-confirm-act cancel" disabled={deleteLoading}>
                Go Back
              </button>
              <button onClick={handleDeleteAccount} className="btn-confirm-act proceed-danger" disabled={deleteLoading}>
                {deleteLoading ? <Loader2 className="profile-spinner-btn" /> : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

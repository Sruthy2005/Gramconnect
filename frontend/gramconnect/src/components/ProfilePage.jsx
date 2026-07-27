import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Phone, MapPin, Mail, Shield, ShieldCheck, Calendar, Lock, Camera, Check, X, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './ProfilePage.css';

export default function ProfilePage({ onLogout }) {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // Profile Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);

  // Profile photo upload fields
  const [photoUploading, setPhotoUploading] = useState(false);

  // Sync state with global context user details
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.mobile || '');
      setAddress(user.address || '');
    }
  }, [user]);

  // Toast notifier helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3s
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Full name is required.', 'error');
      return;
    }
    if (user.authProvider !== 'google' && !phone.trim()) {
      showToast('Phone number is required.', 'error');
      return;
    }
    if (phone.trim() && !/^\d{10}$/.test(phone.trim())) {
      showToast('Phone number must be a valid 10-digit number.', 'error');
      return;
    }

    try {
      setProfileSaving(true);
      const response = await api.put('/profile', {
        fullName: fullName.trim(),
        mobile: phone.trim(),
        address: address.trim()
      });

      if (response.data && response.data.user) {
        setUser(response.data.user);
        showToast('Profile updated successfully!', 'success');
        setIsEditing(false);
      }
      setProfileSaving(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast(err.message || 'Failed to update profile details.', 'error');
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('All password fields are required.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    try {
      setPasswordChanging(true);
      await api.put('/profile/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword
      });

      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordChanging(false);
    } catch (err) {
      console.error('Failed to change password:', err);
      showToast(err.message || 'Failed to change password.', 'error');
      setPasswordChanging(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds maximum limit of 5MB.', 'error');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      showToast('Only JPEG, PNG, and WebP images are allowed.', 'error');
      return;
    }

    try {
      setPhotoUploading(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = reader.result;
        try {
          const response = await api.put('/profile/photo', { image: base64Data });
          if (response.data && response.data.profilePicture) {
            setUser((prev) => ({ ...prev, profilePicture: response.data.profilePicture }));
            showToast('Profile photo updated successfully!', 'success');
          }
          setPhotoUploading(false);
        } catch (err) {
          console.error('Failed to upload photo response:', err);
          showToast(err.message || 'Failed to upload photo.', 'error');
          setPhotoUploading(false);
        }
      };
    } catch (err) {
      console.error('FileReader error:', err);
      showToast('Failed to process image file.', 'error');
      setPhotoUploading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (!user) {
    return (
      <div className="profile-loading-wrapper">
        <Loader2 className="profile-spinner" />
        <span>Loading Profile Details...</span>
      </div>
    );
  }

  const roleTextMap = {
    'Citizen': 'Citizen',
    'citizen': 'Citizen',
    'Admin': 'Administrator',
    'admin': 'Administrator',
    'Officer': 'Department Officer',
    'officer': 'Department Officer'
  };

  return (
    <div className="profile-page-container">
      {/* Toast Alert List */}
      <div className="toasts-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header Profile Section */}
      <div className="profile-header-card glass-card">
        <div className="profile-avatar-wrapper">
          {photoUploading ? (
            <div className="profile-avatar-placeholder">
              <Loader2 className="profile-spinner" style={{ color: 'var(--primary)' }} />
            </div>
          ) : user.profilePicture ? (
            <img src={user.profilePicture} alt="Profile Avatar" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-placeholder">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          
          <label className="avatar-upload-trigger" htmlFor="avatar-file-input">
            <Camera size={14} />
            <input 
              type="file" 
              id="avatar-file-input" 
              accept="image/png, image/jpeg, image/jpg, image/webp" 
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
              disabled={photoUploading}
            />
          </label>
        </div>

        <div className="profile-header-meta">
          <h2 className="profile-header-name">{user.fullName}</h2>
          <div className="profile-header-badges">
            <span className="profile-badge role">
              <Shield size={12} style={{ marginRight: '4px' }} />
              {roleTextMap[user.role] || user.role}
            </span>
            <span className={`profile-badge provider ${user.authProvider}`}>
              <ShieldCheck size={12} style={{ marginRight: '4px' }} />
              {user.authProvider === 'google' ? 'Google Auth' : 'Email & Password'}
            </span>
          </div>
        </div>

        <button className="btn-profile-logout" onClick={onLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      {/* Two columns layout grid */}
      <div className="profile-details-grid">
        
        {/* Left Column: Personal Information Card */}
        <div className="profile-details-card glass-card">
          <div className="card-header-row">
            <h3 className="card-title">Personal Information</h3>
            {!isEditing && (
              <button className="btn-edit-toggle" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleProfileSave} className="profile-form">
            {/* Full Name */}
            <div className="input-field-group">
              <label className="input-label" htmlFor="fullName">Full Name</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon-left" />
                <input
                  type="text"
                  id="fullName"
                  className="profile-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!isEditing || profileSaving}
                  required
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="input-field-group">
              <label className="input-label" htmlFor="phone">Phone Number</label>
              <div className="input-wrapper">
                <Phone size={16} className="input-icon-left" />
                <input
                  type="tel"
                  id="phone"
                  className="profile-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing || profileSaving}
                  placeholder="Not provided"
                  required={user.authProvider !== 'google'}
                />
              </div>
            </div>

            {/* Address */}
            <div className="input-field-group">
              <label className="input-label" htmlFor="address">Address</label>
              <div className="input-wrapper">
                <MapPin size={16} className="input-icon-left" />
                <input
                  type="text"
                  id="address"
                  className="profile-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!isEditing || profileSaving}
                  placeholder="Not provided"
                />
              </div>
            </div>

            {/* Edit Mode Controls */}
            {isEditing && (
              <div className="form-controls-row">
                <button 
                  type="button" 
                  className="btn-form-cancel" 
                  onClick={() => {
                    setIsEditing(false);
                    setFullName(user.fullName || '');
                    setPhone(user.mobile || '');
                    setAddress(user.address || '');
                  }}
                  disabled={profileSaving}
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
                <button type="submit" className="btn-form-save" disabled={profileSaving}>
                  {profileSaving ? (
                    <Loader2 className="profile-spinner-btn" />
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Account Stats / Settings */}
        <div className="profile-aside-column">
          
          {/* Account Information Card */}
          <div className="profile-details-card glass-card">
            <h3 className="card-title">Account Information</h3>
            <div className="account-info-list">
              <div className="info-item">
                <div className="info-icon"><Mail size={16} /></div>
                <div className="info-details">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{user.email}</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon"><Calendar size={16} /></div>
                <div className="info-details">
                  <span className="info-label">Account Created</span>
                  <span className="info-value">{formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="profile-details-card glass-card">
            <h3 className="card-title">Change Password</h3>
            {user.authProvider === 'google' ? (
              <div className="managed-google-message">
                <Lock size={20} className="managed-lock-icon" />
                <span>This account is managed by Google.</span>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="password-form">
                <div className="input-field-group">
                  <label className="input-label" htmlFor="currentPassword">Current Password</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon-left" />
                    <input
                      type="password"
                      id="currentPassword"
                      className="profile-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      disabled={passwordChanging}
                    />
                  </div>
                </div>

                <div className="input-field-group">
                  <label className="input-label" htmlFor="newPassword">New Password</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon-left" />
                    <input
                      type="password"
                      id="newPassword"
                      className="profile-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Min 8 characters"
                      disabled={passwordChanging}
                    />
                  </div>
                </div>

                <div className="input-field-group">
                  <label className="input-label" htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon-left" />
                    <input
                      type="password"
                      id="confirmPassword"
                      className="profile-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      disabled={passwordChanging}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-password-submit" disabled={passwordChanging}>
                  {passwordChanging ? (
                    <Loader2 className="profile-spinner-btn" />
                  ) : (
                    <span>Change Password</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Phone, MapPin, Mail, Shield, ShieldCheck, Calendar, Lock, Camera, Check, X, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './ProfilePage.css';

const LOCATION_DATA = {
  "Thiruvananthapuram": {
    "Corporations": ["Thiruvananthapuram Corporation"],
    "Municipalities": ["Neyyattinkara", "Nedumangad", "Attingal", "Varkala"],
    "Panchayats": ["Balaramapuram", "Kanjiramkulam", "Karumkulam", "Kottukal", "Poovar"]
  },
  "Kollam": {
    "Corporations": ["Kollam Corporation"],
    "Municipalities": ["Punalur", "Paravur", "Karunagappally", "Kottarakkara"],
    "Panchayats": ["Chathannoor", "Kundara", "Anchal", "Pathanapuram", "Oyur"]
  },
  "Pathanamthitta": {
    "Corporations": [],
    "Municipalities": ["Adoor", "Pathanamthitta", "Thiruvalla"],
    "Panchayats": ["Mallappally", "Ranni", "Konni", "Pandalam Thekkekara", "Kozhenchery"]
  },
  "Alappuzha": {
    "Corporations": [],
    "Municipalities": ["Alappuzha", "Cherthala", "Kayamkulam", "Haripad", "Mavelikkara", "Chengannur"],
    "Panchayats": ["Ambalappuzha", "Mannar", "Kuttanad", "Mararikulam", "Punnapra"]
  },
  "Kottayam": {
    "Corporations": [],
    "Municipalities": ["Kottayam", "Changanassery", "Pala", "Vaikom", "Ettumanour"],
    "Panchayats": ["Kanjirappally", "Pampady", "Athirampuzha", "Kumarakom", "Puthuppally"]
  },
  "Idukki": {
    "Corporations": [],
    "Municipalities": ["Thodupuzha", "Kattappana"],
    "Panchayats": ["Munnar", "Adimali", "Nedumkandam", "Kumily", "Peerumedu"]
  },
  "Ernakulam": {
    "Corporations": ["Kochi Corporation"],
    "Municipalities": ["Aluva", "Angamaly", "North Paravur", "Perumbavoor", "Kothamangalam", "Muvattupuzha", "Tripunithura", "Kalamassery", "Thrikkakara", "Eloor", "Maradu", "Piravom", "Koothattukulam"],
    "Panchayats": ["Mulanthuruthy", "Vazhakulam", "Kumbalangi", "Cheranallur", "Kadamakkudy"]
  },
  "Thrissur": {
    "Corporations": ["Thrissur Corporation"],
    "Municipalities": ["Chalakudy", "Chavakkad", "Guruvayur", "Irinjalakuda", "Kodungallur", "Kunnamkulam", "Wadakkanchery"],
    "Panchayats": ["Cherpu", "Pudukad", "Mala", "Alagappa Nagar", "Ollur"]
  },
  "Palakkad": {
    "Corporations": [],
    "Municipalities": ["Palakkad", "Ottapalam", "Shoranur", "Chittur-Thathamangalam", "Cherpulassery", "Mannarkkad"],
    "Panchayats": ["Alathur", "Kuzhalmannam", "Pattambi", "Vaniyamkulam", "Elappully"]
  },
  "Malappuram": {
    "Corporations": [],
    "Municipalities": ["Malappuram", "Manjeri", "Kottakkal", "Perinthalmanna", "Ponnani", "Tirur", "Valanchery", "Nilambur", "Kondotty", "Tanur", "Parappanangadi", "Tirurangadi"],
    "Panchayats": ["Edappal", "Wandoor", "Areacode", "Kottakkal Rural", "Mankada"]
  },
  "Kozhikode": {
    "Corporations": ["Kozhikode Corporation"],
    "Municipalities": ["Vadakara", "Koyilandy", "Koduvally", "Mukkam", "Ramanattukara", "Feroke", "Payyoli"],
    "Panchayats": ["Balussery", "Perambra", "Kunnamangalam", "Thamarassery", "Atholi"]
  },
  "Wayanad": {
    "Corporations": [],
    "Municipalities": ["Kalpetta", "Mananthavady", "Sulthan Bathery"],
    "Panchayats": ["Meppadi", "Vythiri", "Ambalavayal", "Panamaram", "Pulpally"]
  },
  "Kannur": {
    "Corporations": ["Kannur Corporation"],
    "Municipalities": ["Thalassery", "Payyannur", "Taliparamba", "Mattannur", "Koothuparamba", "Iritty", "Anthoor", "Panoor"],
    "Panchayats": ["Peringome", "Alakode", "Kelakam", "Chakkarakkal", "Panoor Rural"]
  },
  "Kasaragod": {
    "Corporations": [],
    "Municipalities": ["Kasaragod", "Kanhangad", "Nileshwaram"],
    "Panchayats": ["Manjeshwar", "Kumbla", "Uppala", "Nileshwar Rural", "Cheruvathur"]
  }
};

export default function ProfilePage({ onLogout }) {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // Profile Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [houseName, setHouseName] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [district, setDistrict] = useState('');
  const [localBody, setLocalBody] = useState('');
  const [localBodyType, setLocalBodyType] = useState('');
  const [ward, setWard] = useState('');
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
      setHouseName(user.houseName || '');
      setStreet(user.street || '');
      setLandmark(user.landmark || '');
      setPinCode(user.pinCode || '');
      setDistrict(user.district || '');
      setLocalBody(user.localBody || '');
      setLocalBodyType(user.localBodyType || '');
      setWard(user.ward || '');
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

    if (!district) {
      showToast('District is required.', 'error');
      return;
    }
    if (!localBody) {
      showToast('Local Body is required.', 'error');
      return;
    }
    if (!ward) {
      showToast('Ward is required.', 'error');
      return;
    }
    if (!houseName.trim()) {
      showToast('House Name / Building Name is required.', 'error');
      return;
    }
    if (!street.trim()) {
      showToast('Street / Locality is required.', 'error');
      return;
    }
    if (!pinCode.trim()) {
      showToast('PIN Code is required.', 'error');
      return;
    }
    if (!/^\d{6}$/.test(pinCode.trim())) {
      showToast('PIN Code must be a valid 6-digit Indian PIN format.', 'error');
      return;
    }

    try {
      setProfileSaving(true);
      const computedAddress = `${houseName.trim()}, ${street.trim()}${landmark.trim() ? `, ${landmark.trim()}` : ''}, PIN: ${pinCode.trim()}`;
      const response = await api.put('/profile', {
        fullName: fullName.trim(),
        mobile: phone.trim(),
        address: computedAddress,
        houseName: houseName.trim(),
        street: street.trim(),
        landmark: landmark.trim(),
        pinCode: pinCode.trim(),
        district,
        localBody,
        localBodyType,
        ward
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

            {/* District */}
            <div className="input-field-group">
              <label className="input-label" htmlFor="district">District *</label>
              <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <MapPin size={16} className="input-icon-left" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', margin: 0 }} />
                <select
                  id="district"
                  className="profile-input"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setLocalBody('');
                    setLocalBodyType('');
                    setWard('');
                  }}
                  disabled={!isEditing || profileSaving}
                  required
                  style={{ width: '100%', paddingLeft: '44px', textIndent: '44px', color: district ? 'var(--text-dark)' : '#94a3b8' }}
                >
                  <option value="" style={{ color: '#94a3b8' }}>Select District</option>
                  {Object.keys(LOCATION_DATA).map((d) => (
                    <option key={d} value={d} style={{ color: 'var(--text-dark)' }}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Local Body */}
            <div className="input-field-group">
              <label className="input-label" htmlFor="localBody">Panchayat / Municipality / Corporation *</label>
              <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <MapPin size={16} className="input-icon-left" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', margin: 0 }} />
                <select
                  id="localBody"
                  className="profile-input"
                  value={localBody}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setLocalBody(selected);
                    if (district && LOCATION_DATA[district]) {
                      const distData = LOCATION_DATA[district];
                      if (distData.Corporations.includes(selected)) {
                        setLocalBodyType('Corporation');
                      } else if (distData.Municipalities.includes(selected)) {
                        setLocalBodyType('Municipality');
                      } else if (distData.Panchayats.includes(selected)) {
                        setLocalBodyType('Panchayat');
                      } else {
                        setLocalBodyType('');
                      }
                    }
                    setWard('');
                  }}
                  disabled={!isEditing || profileSaving || !district}
                  required
                  style={{ width: '100%', paddingLeft: '44px', textIndent: '44px', color: localBody ? 'var(--text-dark)' : '#94a3b8' }}
                >
                  <option value="" style={{ color: '#94a3b8' }}>Select Local Body</option>
                  {district && LOCATION_DATA[district] && (
                    <>
                      {LOCATION_DATA[district].Corporations.length > 0 && (
                        <optgroup label="Corporations" style={{ color: 'var(--text-dark)' }}>
                          {LOCATION_DATA[district].Corporations.map((c) => (
                            <option key={c} value={c} style={{ color: 'var(--text-dark)' }}>{c}</option>
                          ))}
                        </optgroup>
                      )}
                      {LOCATION_DATA[district].Municipalities.length > 0 && (
                        <optgroup label="Municipalities" style={{ color: 'var(--text-dark)' }}>
                          {LOCATION_DATA[district].Municipalities.map((m) => (
                            <option key={m} value={m} style={{ color: 'var(--text-dark)' }}>{m}</option>
                          ))}
                        </optgroup>
                      )}
                      {LOCATION_DATA[district].Panchayats.length > 0 && (
                        <optgroup label="Panchayats" style={{ color: 'var(--text-dark)' }}>
                          {LOCATION_DATA[district].Panchayats.map((p) => (
                            <option key={p} value={p} style={{ color: 'var(--text-dark)' }}>{p}</option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Ward */}
            <div className="input-field-group">
              <label className="input-label" htmlFor="ward">Ward *</label>
              <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <MapPin size={16} className="input-icon-left" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', margin: 0 }} />
                <select
                  id="ward"
                  className="profile-input"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  disabled={!isEditing || profileSaving || !localBody}
                  required
                  style={{ width: '100%', paddingLeft: '44px', textIndent: '44px', color: ward ? 'var(--text-dark)' : '#94a3b8' }}
                >
                  <option value="" style={{ color: '#94a3b8' }}>Select Ward</option>
                  {Array.from({ length: 50 }, (_, i) => `Ward ${i + 1}`).map((w) => (
                    <option key={w} value={w} style={{ color: 'var(--text-dark)' }}>{w}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* House Name / Building Name */}
            <div className="input-field-group">
              <label className="input-label" htmlFor="houseName">House Name / Building Name *</label>
              <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <MapPin size={16} className="input-icon-left" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', margin: 0 }} />
                <input
                  type="text"
                  id="houseName"
                  className="profile-input"
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  disabled={!isEditing || profileSaving}
                  placeholder="House Name / Building Name"
                  required
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            {/* Street / Locality */}
            <div className="input-field-group">
              <label className="input-label" htmlFor="street">Street / Locality *</label>
              <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <MapPin size={16} className="input-icon-left" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', margin: 0 }} />
                <input
                  type="text"
                  id="street"
                  className="profile-input"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={!isEditing || profileSaving}
                  placeholder="Street / Locality"
                  required
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            {/* Landmark */}
            <div className="input-field-group">
              <label className="input-label" htmlFor="landmark">Landmark (Optional)</label>
              <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <MapPin size={16} className="input-icon-left" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', margin: 0 }} />
                <input
                  type="text"
                  id="landmark"
                  className="profile-input"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  disabled={!isEditing || profileSaving}
                  placeholder="Landmark (Optional)"
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            {/* PIN Code */}
            <div className="input-field-group">
              <label className="input-label" htmlFor="pinCode">PIN Code *</label>
              <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <MapPin size={16} className="input-icon-left" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', margin: 0 }} />
                <input
                  type="text"
                  id="pinCode"
                  className="profile-input"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  disabled={!isEditing || profileSaving}
                  placeholder="PIN Code"
                  required
                  style={{ paddingLeft: '44px' }}
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
                    setHouseName(user.houseName || '');
                    setStreet(user.street || '');
                    setLandmark(user.landmark || '');
                    setPinCode(user.pinCode || '');
                    setDistrict(user.district || '');
                    setLocalBody(user.localBody || '');
                    setLocalBodyType(user.localBodyType || '');
                    setWard(user.ward || '');
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

const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile || '',
      address: user.address || '',
      houseName: user.houseName || '',
      street: user.street || '',
      landmark: user.landmark || '',
      pinCode: user.pinCode || '',
      district: user.district || '',
      localBody: user.localBody || '',
      localBodyType: user.localBodyType || '',
      ward: user.ward || '',
      role: user.role,
      authProvider: user.authProvider || 'local',
      profilePicture: user.profilePicture || '',
      createdAt: user.createdAt
    }
  });
});

// @desc    Update user profile details
// @route   PUT /api/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, mobile, address, district, localBody, localBodyType, ward, houseName, street, landmark, pinCode } = req.body;

  if (!fullName) {
    return res.status(400).json({ success: false, message: 'Full name is required' });
  }

  // Location fields validations
  if (!district || !district.trim()) {
    return res.status(400).json({ success: false, message: 'District is required' });
  }
  if (!localBody || !localBody.trim()) {
    return res.status(400).json({ success: false, message: 'Local Body is required' });
  }
  if (!ward || !ward.trim()) {
    return res.status(400).json({ success: false, message: 'Ward is required' });
  }

  // Address fields validations
  if (!houseName || !houseName.trim()) {
    return res.status(400).json({ success: false, message: 'House Name / Building Name is required' });
  }
  if (!street || !street.trim()) {
    return res.status(400).json({ success: false, message: 'Street / Locality is required' });
  }
  if (!pinCode || !pinCode.trim()) {
    return res.status(400).json({ success: false, message: 'PIN Code is required' });
  }
  if (!/^\d{6}$/.test(pinCode.trim())) {
    return res.status(400).json({ success: false, message: 'PIN Code must be a valid 6-digit Indian PIN format' });
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.fullName = fullName.trim();
  user.address = (address || '').trim();
  user.district = district.trim();
  user.localBody = localBody.trim();
  user.localBodyType = (localBodyType || '').trim();
  user.ward = ward.trim();
  user.houseName = houseName.trim();
  user.street = street.trim();
  user.landmark = (landmark || '').trim();
  user.pinCode = pinCode.trim();

  // Mobile number validation (if auth is local or if mobile is provided)
  if (mobile !== undefined) {
    const trimmedMobile = mobile.trim();
    if (user.authProvider !== 'google' && !trimmedMobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }
    if (trimmedMobile && !/^\d{10}$/.test(trimmedMobile)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number' });
    }
    user.mobile = trimmedMobile;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile || '',
      address: user.address || '',
      houseName: user.houseName || '',
      street: user.street || '',
      landmark: user.landmark || '',
      pinCode: user.pinCode || '',
      district: user.district || '',
      localBody: user.localBody || '',
      localBodyType: user.localBodyType || '',
      ward: user.ward || '',
      role: user.role,
      authProvider: user.authProvider || 'local',
      profilePicture: user.profilePicture || '',
      createdAt: user.createdAt
    }
  });
});

// @desc    Upload / Update profile photo
// @route   PUT /api/profile/photo
// @access  Private
const updateProfilePhoto = asyncHandler(async (req, res) => {
  const { image } = req.body; // Expects a base64 encoded image URL string

  if (!image) {
    return res.status(400).json({ success: false, message: 'No image data provided' });
  }

  // Validate base64 format and MIME type
  const matches = image.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return res.status(400).json({ success: false, message: 'Invalid image format. Must be a base64 image string.' });
  }

  const imageType = matches[1].toLowerCase();
  const base64Data = matches[2];
  const allowedTypes = ['jpeg', 'jpg', 'png', 'webp'];

  if (!allowedTypes.includes(imageType)) {
    return res.status(400).json({ success: false, message: 'Invalid image type. Only JPEG, PNG, and WebP are supported.' });
  }

  const buffer = Buffer.from(base64Data, 'base64');
  
  // Ensure size limit (e.g., max 5MB)
  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(400).json({ success: false, message: 'Image size exceeds maximum limit of 5MB.' });
  }

  // Create upload folder path if not existing
  const uploadDir = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Generate filename and save file
  const filename = `${req.user._id}_avatar_${Date.now()}.${imageType}`;
  const filepath = path.join(uploadDir, filename);

  fs.writeFileSync(filepath, buffer);

  // Generate public static URL
  const photoUrl = `http://localhost:5000/uploads/${filename}`;

  // Save to database
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.profilePicture = photoUrl;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile picture updated successfully',
    profilePicture: photoUrl
  });
});

// @desc    Change password (for local email/password users)
// @route   PUT /api/profile/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ success: false, message: 'All password fields are required' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.authProvider === 'google') {
    return res.status(400).json({ success: false, message: 'Google authentication managed profiles cannot modify password locally.' });
  }

  // Check current password matches
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Incorrect current password' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ success: false, message: 'New passwords do not match' });
  }

  // Set the password and save (mongoose pre-save hook handles hashing)
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  changePassword
};

const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const { validateEmail, validatePhone, validatePasswordStrength } = require('../utils/validation');
const asyncHandler = require('../utils/asyncHandler');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { createNotification } = require('../utils/notificationHelper');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, mobile, password, confirmPassword } = req.body;

  // Validation checks
  if (!fullName || !email || !mobile || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  if (!validatePhone(mobile)) {
    return res.status(400).json({ message: 'Please provide a valid 10-digit mobile number' });
  }

  if (!validatePasswordStrength(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  // Check duplicate email
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'Email address is already registered' });
  }

  // Create user
  const user = await User.create({
    fullName,
    email,
    mobile,
    password
  });

  if (user) {
    const token = generateToken(res, user._id);

    // Trigger "New User Registered" admin notification
    await createNotification({
      recipientRole: 'admin',
      title: 'New User Registered',
      message: `New user profile created: "${user.fullName}" (${user.email}).`,
      type: 'Information'
    });

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile || '',
      role: user.role,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture || '',
      address: user.address || '',
      houseName: user.houseName || '',
      street: user.street || '',
      landmark: user.landmark || '',
      pinCode: user.pinCode || '',
      district: user.district || '',
      localBody: user.localBody || '',
      localBodyType: user.localBodyType || '',
      ward: user.ward || '',
      token
    });
  } else {
    res.status(400).json({ message: 'Invalid user data provided' });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  // Find user by email
  const user = await User.findOne({ email, isDeleted: { $ne: true } });

  if (user && (await user.matchPassword(password))) {
    if (user.status === 'Blocked' || user.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked. Reason: ' + (user.blockedReason || 'No reason specified') });
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(res, user._id);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile || '',
      role: user.role,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture || '',
      address: user.address || '',
      houseName: user.houseName || '',
      street: user.street || '',
      landmark: user.landmark || '',
      pinCode: user.pinCode || '',
      district: user.district || '',
      localBody: user.localBody || '',
      localBodyType: user.localBodyType || '',
      ward: user.ward || '',
      token
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture || '',
      address: user.address || '',
      houseName: user.houseName || '',
      street: user.street || '',
      landmark: user.landmark || '',
      pinCode: user.pinCode || '',
      district: user.district || '',
      localBody: user.localBody || '',
      localBodyType: user.localBodyType || '',
      ward: user.ward || ''
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.fullName = req.body.fullName || user.fullName;

    if (req.body.email && req.body.email !== user.email) {
      if (!validateEmail(req.body.email)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
      }
      // Check duplicate
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email address is already in use' });
      }
      user.email = req.body.email;
    }

    if (req.body.mobile) {
      if (!validatePhone(req.body.mobile)) {
        return res.status(400).json({ message: 'Please provide a valid 10-digit mobile number' });
      }
      user.mobile = req.body.mobile;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      mobile: updatedUser.mobile,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
      profilePicture: updatedUser.profilePicture || '',
      address: updatedUser.address || ''
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: 'All password fields are required' });
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ message: 'Incorrect current password' });
  }

  if (!validatePasswordStrength(newPassword)) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: 'New passwords do not match' });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ message: 'Password updated successfully' });
});

// @desc    Forgot Password - Generate reset OTP and email it
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please add a registered email address' });
  }

  // Pre-verification: Verify EMAIL_USER and EMAIL_PASS exist (Requirement 8)
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return res.status(500).json({ message: 'Please configure EMAIL_USER and EMAIL_PASS in backend/.env' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Verification: Return error if user email not found (Requirement 13)
  if (!user) {
    return res.status(404).json({ message: 'User email not found' });
  }

  // Handle Google auth accounts
  if (user.authProvider === 'google') {
    return res.status(400).json({
      message: 'This account uses Google Sign-In. Password reset is not available.'
    });
  }

  // Generate secure 6-digit numeric OTP (Requirement 1)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP and set to database fields
  const hashedOtp = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  user.passwordResetOtp = hashedOtp;

  // Set expiry to 10 minutes (Requirement 1)
  user.passwordResetOtpExpires = Date.now() + 10 * 60 * 1000;

  await user.save();

  // Professional GramConnect HTML email template with OTP details (Requirement 5)
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #22c55e; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Gram<span style="color: #2563eb;">Connect</span></h2>
        <p style="color: #64748b; font-size: 14px; margin: 6px 0 0 0; font-weight: 500;">Your Local Community Portal</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
      <p style="font-size: 16px; line-height: 1.6; color: #334155;">Dear <strong>${user.fullName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6; color: #334155;">We received a request to reset your GramConnect account password. Please use the following One-Time Password (OTP) to verify your identity. This OTP is valid for 10 minutes:</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <div style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 24px; display: inline-block; letter-spacing: 0.15em; font-size: 32px; font-weight: 800; color: #2563eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); font-family: monospace;">
          ${otp}
        </div>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #64748b; background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #22c55e; margin-bottom: 24px;">
        <strong>Expiry Notice:</strong> This code will automatically expire in 10 minutes. For security reasons, this OTP can only be verified once.
      </p>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
        <strong>Security Notice:</strong> If you did not request this OTP, please ignore this message and ensure your account password remains secure. Do not share this OTP with anyone.
      </p>
    </div>
  `;

  const textMessage = `Dear ${user.fullName},\n\nWe received a request to reset your password. Use the following OTP code to verify your identity:\n\nOTP: ${otp}\n\nThis code is valid for 10 minutes.\n\nSecurity Notice: If you did not make this request, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'GramConnect Account Password Reset OTP',
      message: textMessage,
      html: htmlContent
    });

    res.status(200).json({ success: true, message: 'OTP sent successfully to your email.' });
  } catch (err) {
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;
    await user.save();

    res.status(500).json({ message: err.message || 'Email sending failed' });
  }
});

// @desc    Verify OTP for password reset
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP code are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    return res.status(404).json({ message: 'User email not found' });
  }

  if (!user.passwordResetOtp || !user.passwordResetOtpExpires) {
    return res.status(400).json({ message: 'No active OTP verification session found' });
  }

  // Check expiry (Requirement 2)
  if (user.passwordResetOtpExpires <= Date.now()) {
    return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
  }

  // Hash incoming OTP to check matching values
  const hashedOtp = crypto
    .createHash('sha256')
    .update(otp.trim())
    .digest('hex');

  if (user.passwordResetOtp !== hashedOtp) {
    return res.status(400).json({ message: 'Incorrect OTP code.' });
  }

  res.status(200).json({ success: true, message: 'OTP verified successfully.' });
});

// @desc    Reset password using verified OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    return res.status(404).json({ message: 'User email not found' });
  }

  if (!user.passwordResetOtp || !user.passwordResetOtpExpires) {
    return res.status(400).json({ message: 'Invalid OTP verification session' });
  }

  // Verify OTP again (Requirement 7)
  if (user.passwordResetOtpExpires <= Date.now()) {
    return res.status(400).json({ message: 'OTP expired' });
  }

  const hashedOtp = crypto
    .createHash('sha256')
    .update(otp.trim())
    .digest('hex');

  if (user.passwordResetOtp !== hashedOtp) {
    return res.status(400).json({ message: 'Invalid or incorrect OTP' });
  }

  // Strong password validation helper (at least 8 chars, 1 letter, 1 number)
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  if (password.length < 8 || !hasLetter || !hasNumber) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long and contain both letters and numbers' });
  }

  // Update password and clear OTP fields to prevent reuse (Requirement 7)
  user.password = password;
  user.passwordResetOtp = undefined;
  user.passwordResetOtpExpires = undefined;

  await user.save();

  res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
});

// @desc    Auth user with Google token
// @route   POST /api/auth/google
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;

  console.log('[DEV] Backend received Google login request.');
  if (token) {
    console.log(`[DEV] Token received. Length: ${token.length} characters.`);
  } else {
    console.warn('[DEV] Missing token in request body.');
    return res.status(400).json({ success: false, message: 'Missing token' });
  }

  try {
    console.log('[DEV] Verifying Google ID Token against client ID:', process.env.GOOGLE_CLIENT_ID);
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    console.log('[DEV] Google Token verified successfully. Payload details:', {
      iss: payload.iss,
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      aud: payload.aud
    });

    const { sub: googleId, email, name: fullName, picture: profilePicture } = payload;

    if (!email) {
      console.error('[DEV] Google Profile does not contain an email address.');
      return res.status(400).json({ success: false, message: 'Invalid ID Token' });
    }

    // Check whether the user already exists in MongoDB
    let user = await User.findOne({ email, isDeleted: { $ne: true } });

    if (!user) {
      console.log('[DEV] User does not exist in MongoDB. Creating new record...');
      user = await User.create({
        fullName,
        email,
        googleId,
        authProvider: 'google',
        profilePicture,
        role: 'citizen',
        isVerified: true
      });
      console.log('[DEV] New user record created in MongoDB:', user._id);
    } else {
      console.log('[DEV] Existing user found in MongoDB:', user._id);
      let modified = false;
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        modified = true;
      }
      if (profilePicture && !user.profilePicture) {
        user.profilePicture = profilePicture;
        modified = true;
      }
      if (modified) {
        console.log('[DEV] Updating existing user record with Google metadata...');
        await user.save();
      }
    }

    if (user && (user.status === 'Blocked' || user.status === 'blocked')) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Reason: ' + (user.blockedReason || 'No reason specified') });
    }
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const jwtToken = generateToken(res, user._id);

    console.log('[DEV] JWT Session Token generated successfully.');
    res.status(200).json({
      success: true,
      token: jwtToken,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile || '',
        role: user.role,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture || '',
        address: user.address || '',
        houseName: user.houseName || '',
        street: user.street || '',
        landmark: user.landmark || '',
        pinCode: user.pinCode || '',
        district: user.district || '',
        localBody: user.localBody || '',
        localBodyType: user.localBodyType || '',
        ward: user.ward || ''
      }
    });
  } catch (error) {
    const errorMsg = error.message || '';
    let reason = 'Invalid ID Token';

    if (errorMsg.includes('audience') || errorMsg.includes('aud')) {
      reason = 'Audience mismatch';
    } else if (errorMsg.includes('client') || errorMsg.includes('recipient')) {
      reason = 'Client ID mismatch';
    } else if (errorMsg.includes('expired') || errorMsg.includes('too late')) {
      reason = 'Expired Token';
    } else if (errorMsg.includes('signature')) {
      reason = 'Token signature invalid';
    }

    console.error('[DEV] Google Token Verification Error:', errorMsg);
    console.error('[DEV] Mapped Verification Failure Reason:', reason);

    res.status(401).json({
      success: false,
      message: reason
    });
  }
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
  googleLogin
};

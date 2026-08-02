const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../utils/notificationHelper');

// Category to Department mapping
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

// @desc    Report a new civic issue
// @route   POST /api/issues
// @access  Private
const createComplaint = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    state,
    district,
    city,
    ward,
    landmark,
    pincode,
    latitude,
    longitude,
    anonymous,
    urgent
  } = req.body;

  // Basic validation (Requirement 13)
  if (!title || !description || !category || !state || !district || !city || !pincode) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  if (description.trim().length < 20) {
    return res.status(400).json({ message: 'Description must be at least 20 characters long' });
  }

  // Anti-spam guard: prevent duplicate submissions within 10 seconds (Requirement 13)
  const tenSecondsAgo = new Date(Date.now() - 10000);
  const potentialSpam = await Complaint.findOne({
    user: req.user._id,
    title: title.trim(),
    createdAt: { $gt: tenSecondsAgo }
  });

  if (potentialSpam) {
    return res.status(429).json({ message: 'Duplicate submission detected. Please wait a moment.' });
  }

  // Map Category to Assigned Department & AI Severity
  const departmentName = categoryDepartmentMap[category] || 'General Panchayat Administration';

  // Simulated AI Severity and Priority logic
  const isUrgent = urgent === 'true' || urgent === true;
  let severity = 'Low';
  let priorityLevel = 'Normal';

  const emergencyKeywords = ['danger', 'emergency', 'fire', 'flood', 'accident', 'injured', 'broken wire', 'short circuit'];
  const hasEmergencyKeywords = emergencyKeywords.some(keyword =>
    description.toLowerCase().includes(keyword) || title.toLowerCase().includes(keyword)
  );

  if (isUrgent || hasEmergencyKeywords) {
    severity = 'Critical';
    priorityLevel = 'Urgent';
  } else if (category === 'Public Safety' || category === 'Electricity') {
    severity = 'High';
    priorityLevel = 'High';
  } else if (category === 'Water Supply' || category === 'Drainage') {
    severity = 'Medium';
    priorityLevel = 'Medium';
  }

  // Handle uploaded images from Multer (Requirement 13)
  const imageUrls = [];
  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      // Formulate public URL (assuming backend is at port 5000)
      const relativePath = `/uploads/issues/${file.filename}`;
      imageUrls.push(`http://localhost:5000${relativePath}`);
    });
  }

  // Generate unique complaint ID (e.g. GC-982180)
  const complaintCode = `GC-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

  // Create complaint
  const complaint = await Complaint.create({
    complaintId: complaintCode,
    user: req.user._id,
    title: title.trim(),
    description: description.trim(),
    category,
    state,
    district,
    city,
    ward: ward || '',
    landmark: landmark || '',
    pincode,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    images: imageUrls,
    anonymous: anonymous === 'true' || anonymous === true,
    urgent: isUrgent,
    status: 'Pending',
    assignedDepartment: departmentName,
    priority: priorityLevel,
    aiCategory: category,
    aiSeverity: severity
  });

  // Create In-App Citizen Notification (Complaint Submitted)
  await createNotification({
    recipientUser: req.user._id,
    recipientRole: 'citizen',
    title: 'Complaint Submitted',
    message: `Your complaint "${complaint.title}" (${complaint.complaintId}) has been submitted successfully.`,
    type: 'Success',
    relatedComplaint: complaint._id
  });

  // Create Admin Notification (New Complaint Submitted)
  await createNotification({
    recipientRole: 'admin',
    title: 'New Complaint Submitted',
    message: `A new civic report "${complaint.title}" (${complaint.complaintId}) has been registered.`,
    type: 'Information',
    relatedComplaint: complaint._id
  });

  // Create Admin Notification if Urgent
  if (complaint.urgent || complaint.priority === 'Urgent') {
    await createNotification({
      recipientRole: 'admin',
      title: 'Urgent Complaint Submitted',
      message: `URGENT: A critical severity report "${complaint.title}" (${complaint.complaintId}) was filed.`,
      type: 'Warning',
      relatedComplaint: complaint._id
    });
  }

  res.status(201).json({
    success: true,
    message: 'Issue Reported Successfully',
    complaintId: complaintCode,
    complaint
  });
});

// @desc    Get user's complaints
// @route   GET /api/issues/my
// @access  Private
const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: complaints.length,
    complaints
  });
});

// @desc    Get a single complaint details by ID
// @route   GET /api/issues/:id
// @access  Private
const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate('user', 'fullName email');

  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  // Access check: Only owner or administrators can view
  if (complaint.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Unauthorized profile access to this complaint' });
  }

  res.status(200).json({
    success: true,
    complaint
  });
});

// @desc    Update a complaint
// @route   PUT /api/issues/:id
// @access  Private
const updateComplaint = asyncHandler(async (req, res) => {
  let complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  // Access check
  if (complaint.user.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Unauthorized profile access' });
  }

  complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'Complaint updated successfully',
    complaint
  });
});

// @desc    Delete/Cancel a pending complaint
// @route   DELETE /api/issues/:id
// @access  Private
const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  // Access check
  if (complaint.user.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Unauthorized profile access' });
  }

  // Only pending complaints can be deleted/canceled
  if (complaint.status !== 'Pending' && req.user.role !== 'admin' && req.user.role !== 'Admin') {
    return res.status(400).json({ message: 'Only pending complaints can be cancelled' });
  }

  await Complaint.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Complaint cancelled successfully'
  });
});

// @desc    Get dashboard statistics
// @route   GET /api/issues/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Retrieve count metrics grouped by status
  const total = await Complaint.countDocuments({ user: userId });
  const pending = await Complaint.countDocuments({ user: userId, status: 'Pending' });
  const inProgress = await Complaint.countDocuments({ user: userId, status: 'In Progress' });
  const resolved = await Complaint.countDocuments({ user: userId, status: 'Resolved' });

  // Get 5 most recent complaints
  const recent = await Complaint.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    stats: {
      total,
      pending,
      inProgress,
      resolved
    },
    recent
  });
});

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  getDashboardStats
};

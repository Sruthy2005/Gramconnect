const Complaint = require('../models/Complaint');
const Panchayat = require('../models/Panchayat');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../utils/notificationHelper');
const { classifyComplaint, CATEGORY_DEPARTMENT_MAP } = require('../utils/aiCategorizer');
const { checkDuplicateComplaint } = require('../utils/duplicateDetector');

// Category to Department mapping
const categoryDepartmentMap = {
  'Road Damage': 'Public Works Department (PWD)',
  'Garbage/Waste': 'Sanitation Department',
  'Garbage': 'Sanitation Department',
  'Drainage': 'Sewage & Drainage Board',
  'Water Leakage': 'Water Authority',
  'Water Supply': 'Water Authority',
  'Streetlight': 'Electricity Board',
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
  // Blocked user check
  if (req.user.status === 'Blocked' || req.user.status === 'blocked') {
    return res.status(403).json({ message: 'Your account is blocked and you cannot submit complaints.' });
  }

  const {
    title,
    description,
    category,
    state,
    district,
    taluk,
    localBody,
    localBodyType,
    city,
    ward,
    landmark,
    pincode,
    latitude,
    longitude,
    anonymous,
    priority,
    urgent
  } = req.body;

  // Basic validation (Requirement 13)
  if (
    !title ||
    !description ||
    !state ||
    !district ||
    !taluk ||
    !localBody ||
    !localBodyType ||
    !city ||
    !pincode ||
    latitude === undefined ||
    latitude === null ||
    latitude === '' ||
    longitude === undefined ||
    longitude === null ||
    longitude === '' ||
    !priority
  ) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  if (description.trim().length < 20) {
    return res.status(400).json({ message: 'Description must be at least 20 characters long' });
  }

  const parsedLat = parseFloat(latitude);
  const parsedLng = parseFloat(longitude);
  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return res.status(400).json({ message: 'Latitude and Longitude must be valid numbers' });
  }

  // Automatic AI Complaint Categorization
  const aiClassification = await classifyComplaint(title.trim(), description.trim());
  const detectedCategory = aiClassification.category;
  const detectedConfidence = aiClassification.confidence;

  // Determine final category: preserve citizen's manual choice if provided and not 'Auto-detect', else use AI
  let finalCategory = category && category !== 'Auto-detect' ? category.trim() : detectedCategory;
  if (!finalCategory) {
    finalCategory = detectedCategory;
  }

  // AI-based Duplicate Complaint Detection
  const duplicateCheck = await checkDuplicateComplaint({
    title: title.trim(),
    description: description.trim(),
    category: finalCategory,
    latitude: parsedLat,
    longitude: parsedLng,
    district: district.trim()
  });

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
  const departmentName = categoryDepartmentMap[finalCategory] || 'General Panchayat Administration';

  // Simulated AI Severity and Priority logic
  const isUrgent = urgent === 'true' || urgent === true || priority === 'Urgent';
  let severity = 'Low';
  let priorityLevel = priority || 'Normal';

  const emergencyKeywords = ['danger', 'emergency', 'fire', 'flood', 'accident', 'injured', 'broken wire', 'short circuit'];
  const hasEmergencyKeywords = emergencyKeywords.some(keyword =>
    description.toLowerCase().includes(keyword) || title.toLowerCase().includes(keyword)
  );

  if (isUrgent || hasEmergencyKeywords) {
    severity = 'Critical';
    priorityLevel = 'Urgent';
  } else if (finalCategory === 'Public Safety' || finalCategory === 'Electricity') {
    severity = 'High';
    priorityLevel = 'High';
  } else if (finalCategory === 'Water Leakage' || finalCategory === 'Water Supply' || finalCategory === 'Drainage') {
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

  // Validate selected Panchayat actually exists
  const panchayatMatch = await Panchayat.findOne({
    name: { $regex: new RegExp(`^${localBody.trim()}$`, 'i') },
    district: { $regex: new RegExp(`^${district.trim()}$`, 'i') },
    isDeleted: { $ne: true }
  });

  if (!panchayatMatch) {
    return res.status(400).json({ message: `Selected Panchayat/local body '${localBody}' in district '${district}' does not exist.` });
  }

  // Create complaint
  const complaint = await Complaint.create({
    complaintId: complaintCode,
    user: req.user._id,
    panchayatId: panchayatMatch._id,
    title: title.trim(),
    description: description.trim(),
    category: finalCategory,
    state: state.trim(),
    district: district.trim(),
    taluk: taluk.trim(),
    localBodyType: localBodyType.trim(),
    localBody: localBody.trim(),
    city: city.trim(),
    ward: ward || '',
    landmark: landmark || '',
    pincode: pincode.trim(),
    latitude: parsedLat,
    longitude: parsedLng,
    images: imageUrls,
    anonymous: anonymous === 'true' || anonymous === true,
    urgent: isUrgent,
    status: 'Pending',
    assignedDepartment: departmentName,
    priority: priorityLevel,
    aiCategory: detectedCategory,
    aiConfidence: detectedConfidence,
    aiSeverity: severity,
    isDuplicate: duplicateCheck.isDuplicate,
    duplicateOf: duplicateCheck.duplicateOf,
    duplicateConfidence: duplicateCheck.confidence
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
    relatedComplaint: complaint._id,
    districtTarget: req.user.district || 'ALL',
    panchayatTarget: req.user.panchayat || 'ALL'
  });

  // Create Admin Notification if Urgent
  if (complaint.urgent || complaint.priority === 'Urgent') {
    await createNotification({
      recipientRole: 'admin',
      title: 'Urgent Complaint Submitted',
      message: `URGENT: A critical severity report "${complaint.title}" (${complaint.complaintId}) was filed.`,
      type: 'Warning',
      relatedComplaint: complaint._id,
      districtTarget: req.user.district || 'ALL',
      panchayatTarget: req.user.panchayat || 'ALL'
    });
  }

  res.status(201).json({
    success: true,
    message: 'Issue Reported Successfully',
    complaintId: complaintCode,
    aiCategory: detectedCategory,
    aiConfidence: detectedConfidence,
    category: finalCategory,
    isDuplicate: duplicateCheck.isDuplicate,
    duplicateOf: duplicateCheck.duplicateOf,
    duplicateConfidence: duplicateCheck.confidence,
    matchedDuplicate: duplicateCheck.matchedComplaint,
    complaint
  });
});

// @desc    Check potential duplicate complaints
// @route   POST /api/issues/check-duplicate
// @access  Private
const previewDuplicateCheck = asyncHandler(async (req, res) => {
  const { title = '', description = '', category = '', latitude, longitude, district = '' } = req.body;
  const duplicateResult = await checkDuplicateComplaint({
    title,
    description,
    category,
    latitude,
    longitude,
    district
  });

  res.status(200).json({
    success: true,
    ...duplicateResult
  });
});

// @desc    Real-time AI categorization preview
// @route   POST /api/issues/classify
// @access  Private
const previewCategorization = asyncHandler(async (req, res) => {
  const { title = '', description = '' } = req.body;
  const classification = await classifyComplaint(title, description);

  res.status(200).json({
    success: true,
    category: classification.category,
    confidence: classification.confidence,
    matchedKeywords: classification.matchedKeywords
  });
});

// @desc    Get user's complaints
// @route   GET /api/issues/my
// @access  Private
const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ user: req.user._id })
    .populate('duplicateOf', 'complaintId title category status')
    .sort({ createdAt: -1 });

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
  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'fullName email')
    .populate('duplicateOf', 'complaintId title category status');

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

  // If title or description changed, optionally re-run AI categorization if category is not explicitly overridden
  if (req.body.title || req.body.description) {
    const updatedTitle = req.body.title || complaint.title;
    const updatedDesc = req.body.description || complaint.description;
    const aiResult = await classifyComplaint(updatedTitle, updatedDesc);
    req.body.aiCategory = aiResult.category;
    req.body.aiConfidence = aiResult.confidence;
    if (!req.body.category || req.body.category === 'Auto-detect') {
      req.body.category = aiResult.category;
    }
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
  previewDuplicateCheck,
  previewCategorization,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  getDashboardStats
};

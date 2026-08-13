const Announcement = require('../models/Announcement');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.log('[ANNOUNCEMENTS] Fetching announcements');
    console.log(`[ANNOUNCEMENTS] Requesting User - District: ${req.user.district || 'N/A'}, Panchayat: ${req.user.panchayat || 'N/A'}`);
  }
  const { search, category, priority, district, panchayat, status } = req.query;
  const filter = {};

  // For citizen view, return only Active and targeted announcements
  const isAdmin = req.user.role && ['admin', 'super_admin', 'panchayat_admin'].includes(req.user.role.toLowerCase());
  
  if (!isAdmin) {
    filter.status = 'Active';
    
    // Flexible location targeting: strip common suffixes so "Thiruvananthapuram" stored in
    // the announcement matches a user whose profile district is "Thiruvananthapuram District" etc.
    const userDistrict = (req.user.district || '').replace(/([\s]+district)$/i, '').trim();
    const userPanchayat = (req.user.panchayat || '').trim();

    // Escape special regex characters in user-supplied strings
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // WILDCARD announcement values that match every user
    const districtWildcards = ['All', 'All Districts', 'ALL', '', null];
    const panchayatWildcards = ['All', 'All Panchayats', 'ALL', '', null];

    const districtConditions = [{ district: { $in: districtWildcards } }];
    if (userDistrict) {
      districtConditions.push({ district: { $regex: new RegExp(`^${escapeRegex(userDistrict)}$`, 'i') } });
    }

    const panchayatConditions = [{ panchayat: { $in: panchayatWildcards } }];
    if (userPanchayat) {
      panchayatConditions.push({ panchayat: { $regex: new RegExp(`^${escapeRegex(userPanchayat)}$`, 'i') } });
    }

    filter.$and = [
      {
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gte: new Date() } }
        ]
      },
      { $or: districtConditions },
      { $or: panchayatConditions }
    ];
  } else {
    // Admin filtering options
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (district && district !== 'All') {
      filter.district = district;
    }
    if (panchayat && panchayat !== 'All') {
      filter.panchayat = panchayat;
    }
  }

  if (category && category !== 'All') {
    filter.category = category;
  }
  if (priority && priority !== 'All') {
    filter.priority = priority;
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    const searchCondition = {
      $or: [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } }
      ]
    };
    // Append to $and if it exists (citizen view), otherwise use top-level $or
    if (filter.$and) {
      filter.$and.push(searchCondition);
    } else {
      filter.$or = searchCondition.$or;
    }
  }

  const announcements = await Announcement.find(filter)
    .populate('publishedBy', 'fullName email profilePicture')
    .sort({ publishDate: -1, createdAt: -1 });

  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.log(`[ANNOUNCEMENTS] Found: ${announcements.length}`);
  }

  res.status(200).json({
    success: true,
    count: announcements.length,
    announcements
  });
});

// @desc    Get single announcement details
// @route   GET /api/announcements/:id
// @access  Private
const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id)
    .populate('publishedBy', 'fullName email profilePicture');

  if (!announcement) {
    return res.status(404).json({ success: false, message: 'Announcement not found' });
  }

  res.status(200).json({
    success: true,
    announcement
  });
});

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Private/Admin
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, description, category, priority, district, panchayat, publishDate, expiryDate } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ success: false, message: 'Please provide title, description and category' });
  }

  let attachmentUrl = '';
  if (req.file) {
    attachmentUrl = `/uploads/announcements/${req.file.filename}`;
  }

  let formattedExpiryDate = null;
  if (expiryDate) {
    const dateStr = typeof expiryDate === 'string' ? expiryDate.split('T')[0] : new Date(expiryDate).toISOString().split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    formattedExpiryDate = new Date(Date.UTC(year, month - 1, day, 18, 29, 59, 999));
  }

  const announcement = await Announcement.create({
    title,
    description,
    category,
    priority: priority || 'Normal',
    district: district || 'All',
    panchayat: panchayat || 'All',
    publishedBy: req.user._id,
    publishDate: publishDate || new Date(),
    expiryDate: formattedExpiryDate,
    attachment: attachmentUrl,
    status: 'Active'
  });

  // Trigger notification broadcast to citizens
  await createNotification({
    title: `🔔 New Announcement: ${title}`,
    message: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
    recipientRole: 'citizen',
    type: priority === 'Urgent' ? 'Warning' : 'Information',
    relatedAnnouncement: title
  });

  const populated = await Announcement.findById(announcement._id)
    .populate('publishedBy', 'fullName email profilePicture');

  res.status(201).json({
    success: true,
    message: 'Announcement published successfully',
    announcement: populated
  });
});

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private/Admin
const updateAnnouncement = asyncHandler(async (req, res) => {
  let announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({ success: false, message: 'Announcement not found' });
  }

  const updateData = { ...req.body };

  if (req.file) {
    updateData.attachment = `/uploads/announcements/${req.file.filename}`;
  }

  // Preserve existing attachment if no new file is uploaded
  if (!req.file && updateData.attachment === undefined) {
    delete updateData.attachment;
  }

  if (updateData.expiryDate) {
    const dateStr = typeof updateData.expiryDate === 'string' ? updateData.expiryDate.split('T')[0] : new Date(updateData.expiryDate).toISOString().split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    updateData.expiryDate = new Date(Date.UTC(year, month - 1, day, 18, 29, 59, 999));
  } else if (updateData.expiryDate === '') {
    updateData.expiryDate = null;
  }

  announcement = await Announcement.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  }).populate('publishedBy', 'fullName email profilePicture');

  res.status(200).json({
    success: true,
    message: 'Announcement updated successfully',
    announcement
  });
});

// @desc    Delete (Archive) announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({ success: false, message: 'Announcement not found' });
  }

  // Soft delete / Archival system
  announcement.status = 'Archived';
  await announcement.save();

  res.status(200).json({
    success: true,
    message: 'Announcement archived successfully'
  });
});

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};

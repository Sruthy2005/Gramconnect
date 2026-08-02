const Notification = require('../models/Notification');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');
const sse = require('../utils/sse');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get user's notifications (user-specific or role-based)
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const userRole = req.user.role ? req.user.role.toLowerCase() : 'citizen';
  
  const notifications = await Notification.find({
    $or: [
      { recipientUser: req.user._id },
      { 
        $and: [
          { recipientUser: null },
          { recipientRole: userRole === 'admin' ? { $in: ['admin', 'Admin'] } : { $in: ['citizen', 'Citizen'] } }
        ]
      }
    ]
  })
  .sort({ createdAt: -1 })
  .populate('relatedComplaint', 'complaintId title category status');

  res.status(200).json({
    success: true,
    notifications
  });
});

// @desc    Get count of unread notifications
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const userRole = req.user.role ? req.user.role.toLowerCase() : 'citizen';
  
  const count = await Notification.countDocuments({
    isRead: false,
    $or: [
      { recipientUser: req.user._id },
      { 
        $and: [
          { recipientUser: null },
          { recipientRole: userRole === 'admin' ? { $in: ['admin', 'Admin'] } : { $in: ['citizen', 'Citizen'] } }
        ]
      }
    ]
  });

  res.status(200).json({
    success: true,
    count
  });
});

// @desc    Mark a specific notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  notification.isRead = true;
  await notification.save();

  // Return populated notification
  const populated = await Notification.findById(notification._id)
    .populate('relatedComplaint', 'complaintId title category status');

  res.status(200).json({
    success: true,
    notification: populated
  });
});

// @desc    Mark all user's notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const userRole = req.user.role ? req.user.role.toLowerCase() : 'citizen';

  await Notification.updateMany(
    {
      isRead: false,
      $or: [
        { recipientUser: req.user._id },
        { 
          $and: [
            { recipientUser: null },
            { recipientRole: userRole === 'admin' ? { $in: ['admin', 'Admin'] } : { $in: ['citizen', 'Citizen'] } }
          ]
        }
      ]
    },
    { $set: { isRead: true } }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  await Notification.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/delete-read
// @access  Private
const deleteReadNotifications = asyncHandler(async (req, res) => {
  const filter = req.user.role.toLowerCase() === 'admin' 
    ? { recipientRole: 'admin', isRead: true }
    : { recipientUser: req.user._id, isRead: true };

  await Notification.deleteMany(filter);

  res.status(200).json({
    success: true,
    message: 'All read notifications deleted'
  });
});


// @desc    Real-time Server-Sent Events stream
// @route   GET /api/notifications/stream
// @access  Public (authenticates token from query parameters or cookies)
const streamNotifications = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders && res.flushHeaders();

  let token = req.query.token;
  if (!token && req.cookies) {
    token = req.cookies.token;
  }

  if (!token) {
    res.write('event: error\ndata: Unauthorized\n\n');
    return res.end();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforgramconnectauth123!');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.write('event: error\ndata: User not found\n\n');
      return res.end();
    }

    const client = {
      userId: user._id.toString(),
      role: user.role ? user.role.toLowerCase() : 'citizen',
      res
    };

    sse.addClient(client);

    // Initial message to confirm connection
    res.write('event: connected\ndata: "SSE Connection Established"\n\n');

    // Keepalive ping every 30s
    const keepAliveInterval = setInterval(() => {
      res.write(':keepalive\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAliveInterval);
      sse.removeClient(res);
    });
  } catch (err) {
    res.write('event: error\ndata: Invalid token\n\n');
    return res.end();
  }
};

// @desc    Simulate specific notification events
// @route   POST /api/notifications/simulate
// @access  Private
const simulateNotification = asyncHandler(async (req, res) => {
  const { eventType, complaintId, announcementText } = req.body;

  let recipientUser = null;
  let recipientRole = 'citizen';
  let title = '';
  let message = '';
  let type = 'Information';
  let relatedComplaint = null;

  // Attempt to load corresponding complaint
  let complaint = null;
  if (complaintId) {
    complaint = await Complaint.findById(complaintId);
  } else {
    complaint = await Complaint.findOne({ user: req.user._id });
    if (!complaint) {
      complaint = await Complaint.findOne();
    }
  }

  if (complaint) {
    relatedComplaint = complaint._id;
  }

  const compIdStr = complaint ? complaint.complaintId : 'GC-665340210';
  const compTitleStr = complaint ? complaint.title : 'Road Damage';
  const compCategoryStr = complaint ? complaint.category : 'Road Damage';

  switch (eventType) {
    // ----------------------------------------------------
    // User Notifications (13 cases)
    // ----------------------------------------------------
    case 'Complaint Submitted':
      recipientUser = req.user._id;
      recipientRole = 'citizen';
      title = 'Complaint Submitted';
      message = `Your complaint "${compTitleStr}" (${compIdStr}) has been submitted successfully.`;
      type = 'Success';
      break;

    case 'Complaint Verified':
      recipientUser = req.user._id;
      recipientRole = 'citizen';
      title = 'Complaint Verified';
      message = `Your ${compCategoryStr} complaint ${compIdStr} has been verified by the Panchayat Office.`;
      type = 'Success';
      break;

    case 'Complaint Assigned':
      recipientUser = req.user._id;
      recipientRole = 'citizen';
      title = 'Complaint Assigned';
      message = `Your complaint ${compIdStr} has been assigned to Public Works Department (PWD).`;
      type = 'Information';
      break;

    case 'Work Started':
      recipientUser = req.user._id;
      recipientRole = 'citizen';
      title = 'Work Started';
      message = `Work has started on your complaint ${compIdStr}.`;
      type = 'Information';
      break;

    case 'Complaint In Progress':
      recipientUser = req.user._id;
      recipientRole = 'citizen';
      title = 'Complaint In Progress';
      message = `Your complaint ${compIdStr} is currently in progress.`;
      type = 'Information';
      break;

    case 'Complaint Resolved':
      recipientUser = req.user._id;
      recipientRole = 'citizen';
      title = 'Complaint Resolved';
      message = `Your complaint ${compIdStr} has been resolved successfully by the field team.`;
      type = 'Success';
      break;

    case 'Complaint Rejected':
      recipientUser = req.user._id;
      recipientRole = 'citizen';
      title = 'Complaint Rejected';
      message = `Your complaint ${compIdStr} has been rejected. Details: Duplicate report.`;
      type = 'Error';
      break;

    case 'Additional Information Requested':
      recipientUser = req.user._id;
      recipientRole = 'citizen';
      title = 'Additional Information Requested';
      message = `Panchayat Office has requested additional details/photographs for complaint ${compIdStr}.`;
      type = 'Warning';
      break;

    case 'Announcement Published':
      recipientRole = 'citizen';
      title = 'Announcement Published';
      message = announcementText || 'A new Panchayat public announcement has been published regarding water rationing.';
      type = 'Information';
      break;

    case 'Community Post Approved':
      recipientUser = req.user._id;
      recipientRole = 'citizen';
      title = 'Community Post Approved';
      message = 'Your community forum thread regarding local street food vendors has been approved.';
      type = 'Success';
      break;

    case 'Community Post Rejected':
      recipientUser = req.user._id;
      recipientRole = 'citizen';
      title = 'Community Post Rejected';
      message = 'Your community post was rejected due to duplication and guideline violations.';
      type = 'Error';
      break;

    case 'Lost Item Matched':
      recipientUser = req.user._id;
      recipientRole = 'citizen';
      title = 'Lost Item Matched';
      message = 'A matching log entry was found for the black leather wallet you reported as lost.';
      type = 'Success';
      break;

    case 'Found Item Claimed':
      recipientUser = req.user._id;
      recipientRole = 'citizen';
      title = 'Found Item Claimed';
      message = 'The keys you deposited at the front desk have been successfully claimed by the owner.';
      type = 'Success';
      break;

    // ----------------------------------------------------
    // Admin Notifications (10 cases)
    // ----------------------------------------------------
    case 'New Complaint Submitted':
      recipientRole = 'admin';
      title = 'New Complaint Submitted';
      message = `A new civic report "${compTitleStr}" (${compIdStr}) has been registered.`;
      type = 'Information';
      break;

    case 'Urgent Complaint Submitted':
      recipientRole = 'admin';
      title = 'Urgent Complaint Submitted';
      message = `URGENT: A critical severity report "${compTitleStr}" (${compIdStr}) was filed.`;
      type = 'Warning';
      break;

    case 'Complaint Escalated':
      recipientRole = 'admin';
      title = 'Complaint Escalated';
      message = `Escalation: Complaint ${compIdStr} has breached resolving timeline threshold.`;
      type = 'Error';
      break;

    case 'New User Registered':
      recipientRole = 'admin';
      title = 'New User Registered';
      message = `New user profile created: "${req.user.fullName}" (${req.user.email}).`;
      type = 'Information';
      break;

    case 'New Community Report':
      recipientRole = 'admin';
      title = 'New Community Report';
      message = 'Moderation: A new post report has been flagged in the Community Hub.';
      type = 'Warning';
      break;

    case 'New Lost & Found Report':
      recipientRole = 'admin';
      title = 'New Lost & Found Report';
      message = 'A new item has been logged in the Lost & Found database.';
      type = 'Information';
      break;

    case 'Announcement Expiring Soon':
      recipientRole = 'admin';
      title = 'Announcement Expiring Soon';
      message = 'System reminder: "Panchayat Tax Subsidies Offer" announcement expires in 24 hours.';
      type = 'Warning';
      break;

    case 'System Error':
      recipientRole = 'admin';
      title = 'System Error';
      message = 'Fatal: Mail transporter failed to dispatch OTP verification queues.';
      type = 'Error';
      break;

    case 'Officer Accepted Assignment':
      recipientRole = 'admin';
      title = 'Officer Accepted Assignment';
      message = `Water Board Officer has formally accepted task routing for complaint ${compIdStr}.`;
      type = 'Success';
      break;

    case 'Officer Completed Work':
      recipientRole = 'admin';
      title = 'Officer Completed Work';
      message = `Completed: Assigned field officer reported resolution on complaint ${compIdStr}.`;
      type = 'Success';
      break;

    default:
      return res.status(400).json({ success: false, message: 'Invalid notification eventType' });
  }

  const notification = await createNotification({
    recipientUser,
    recipientRole,
    title,
    message,
    type,
    relatedComplaint,
    relatedAnnouncement: announcementText || null
  });

  res.status(201).json({
    success: true,
    notification
  });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  streamNotifications,
  simulateNotification
};

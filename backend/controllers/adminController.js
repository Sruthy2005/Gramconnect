const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../utils/notificationHelper');

/**
 * Seeder to pre-populate DB if collections are empty.
 * Runs on dashboard stats or list queries so the admin gets a premium pre-populated screen.
 */
const seedMockDataIfEmpty = async (adminId) => {
  try {
    // 1. Check & Seed Users
    const citizenCount = await User.countDocuments({ role: { $in: ['citizen', 'Citizen'] } });
    let citizens = [];
    if (citizenCount === 0) {
      citizens = await User.insertMany([
        {
          fullName: 'Ramesh Kumar',
          email: 'ramesh@gramconnect.org',
          mobile: '9876543210',
          role: 'citizen',
          isVerified: true,
          address: 'Ward 3, Rose Villa, Green Gardens',
          authProvider: 'local'
        },
        {
          fullName: 'Ananya Sen',
          email: 'ananya@gramconnect.org',
          mobile: '9865432107',
          role: 'citizen',
          isVerified: true,
          address: 'Ward 1, Block B, Panchayat Enclave',
          authProvider: 'local'
        },
        {
          fullName: 'Mathew George',
          email: 'mathew@gramconnect.org',
          mobile: '9854321098',
          role: 'citizen',
          isVerified: false,
          address: 'Ward 5, Riverview Lane, Hilltop',
          authProvider: 'local'
        }
      ]);
      console.log('[DEV SEEDER] Seeded mock citizens successfully');
    } else {
      citizens = await User.find({ role: { $in: ['citizen', 'Citizen'] } }).limit(3);
    }

    const defaultUserId = citizens[0]?._id || adminId;

    // 2. Check & Seed Complaints
    const complaintCount = await Complaint.countDocuments();
    if (complaintCount === 0) {
      const seededComplaints = await Complaint.insertMany([
        {
          complaintId: 'GC-981240',
          user: citizens[0]?._id || defaultUserId,
          title: 'Main Road Potholes',
          description: 'The entrance road near the Panchayat office is heavily damaged with multiple deep potholes. It is extremely dangerous for two-wheelers, especially during night hours and rainy season.',
          category: 'Road Damage',
          state: 'Kerala',
          district: 'Ernakulam',
          city: 'Kochi',
          ward: 'Ward 3',
          landmark: 'Opposite Government Library',
          pincode: '682024',
          latitude: 9.9816,
          longitude: 76.2999,
          status: 'Pending',
          priority: 'High',
          assignedDepartment: 'Public Works Department (PWD)',
          aiCategory: 'Road Damage',
          aiSeverity: 'High',
          createdAt: new Date(Date.now() - 2 * 3600 * 1000) // 2 hours ago
        },
        {
          complaintId: 'GC-981241',
          user: citizens[1]?._id || defaultUserId,
          title: 'Uncollected Public Garbage Dump',
          description: 'A massive pile of household waste has accumulated at the corner of street 4. It has not been cleared for over a week and is emitting a foul smell, attracting pests.',
          category: 'Garbage',
          state: 'Kerala',
          district: 'Ernakulam',
          city: 'Kochi',
          ward: 'Ward 1',
          landmark: 'Near Water Tank',
          pincode: '682024',
          latitude: 9.9822,
          longitude: 76.3015,
          status: 'In Progress',
          priority: 'Medium',
          assignedDepartment: 'Sanitation Department',
          aiCategory: 'Garbage',
          aiSeverity: 'Medium',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000) // 1 day ago
        },
        {
          complaintId: 'GC-981242',
          user: citizens[2]?._id || defaultUserId,
          title: 'Drinking Water Tube Leakage',
          description: 'A main drinking water pipe has burst under the street pathway. Clean drinking water is leaking and flooding the road, depleting the supply to nearby households.',
          category: 'Water Supply',
          state: 'Kerala',
          district: 'Ernakulam',
          city: 'Kochi',
          ward: 'Ward 5',
          landmark: 'Beside Post Office',
          pincode: '682025',
          latitude: 9.9790,
          longitude: 76.3120,
          status: 'Resolved',
          priority: 'Urgent',
          assignedDepartment: 'Water Authority',
          aiCategory: 'Water Supply',
          aiSeverity: 'Critical',
          createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000), // 3 days ago
          updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000)
        },
        {
          complaintId: 'GC-981243',
          user: citizens[0]?._id || defaultUserId,
          title: 'Flickering Street Light',
          description: 'The street light at junction 12 has been flickering continuously for the last three days. It makes the corner dark and unsafe for walkers in the evening.',
          category: 'Street Light',
          state: 'Kerala',
          district: 'Ernakulam',
          city: 'Kochi',
          ward: 'Ward 3',
          landmark: 'Panchayat Junction',
          pincode: '682024',
          status: 'Pending',
          priority: 'Normal',
          createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) // 3 days ago
        },
        {
          complaintId: 'GC-981244',
          user: citizens[1]?._id || defaultUserId,
          title: 'Damaged Electric Overhead Cable',
          description: 'A storm snapped a tree branch which is now resting on the electric cables. The cables are hanging extremely low, posing an immediate electrocution hazard to trucks passing by.',
          category: 'Electricity',
          state: 'Kerala',
          district: 'Ernakulam',
          city: 'Kochi',
          ward: 'Ward 1',
          landmark: 'Near Sacred Heart School',
          pincode: '682024',
          status: 'In Progress',
          priority: 'High',
          assignedDepartment: 'State Power Corporation',
          aiCategory: 'Electricity',
          aiSeverity: 'Critical',
          createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000) // 4 days ago
        }
      ]);

      // Seed Notifications associated with the complaints
      await Notification.insertMany([
        {
          recipientUser: citizens[0]?._id || defaultUserId,
          recipientRole: 'citizen',
          title: 'Complaint Submitted',
          message: 'Your complaint "Main Road Potholes" (GC-981240) has been submitted successfully.',
          type: 'Success',
          relatedComplaint: seededComplaints[0]?._id,
          createdAt: new Date(Date.now() - 10 * 60 * 1000) // 10 mins ago
        },
        {
          recipientUser: citizens[1]?._id || defaultUserId,
          recipientRole: 'citizen',
          title: 'Complaint Verified',
          message: 'Your Garbage complaint GC-981241 has been verified by the Panchayat Office.',
          type: 'Success',
          relatedComplaint: seededComplaints[1]?._id,
          createdAt: new Date(Date.now() - 2 * 3600 * 1000) // 2 hours ago
        },
        {
          recipientUser: citizens[2]?._id || defaultUserId,
          recipientRole: 'citizen',
          title: 'Complaint Resolved',
          message: 'Your Water Supply complaint GC-981242 has been resolved successfully by the field team.',
          type: 'Success',
          relatedComplaint: seededComplaints[2]?._id,
          createdAt: new Date(Date.now() - 5 * 3600 * 1000) // 5 hours ago
        },
        {
          recipientRole: 'admin',
          title: 'New User Registered',
          message: `New user profile registered: "Mathew George" (mathew@gramconnect.org).`,
          type: 'Information',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000) // 1 day ago
        }
      ]);
      console.log('[DEV SEEDER] Seeded mock complaints successfully');
    }
  } catch (err) {
    console.error('[DEV SEEDER] Error seeding database:', err);
  }
};

// ==========================================
// Dashboard Overview Stats & Analytics
// ==========================================

// @desc    Get dashboard aggregations and analytics data
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = asyncHandler(async (req, res) => {
  await seedMockDataIfEmpty(req.user._id);

  // Aggregated Counts from MongoDB
  const total = await Complaint.countDocuments();
  const pending = await Complaint.countDocuments({ status: 'Pending' });
  const verified = await Complaint.countDocuments({ status: 'Verified' });
  const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
  const resolved = await Complaint.countDocuments({ status: 'Resolved' });
  const rejected = await Complaint.countDocuments({ status: 'Rejected' });
  const activeUsers = await User.countDocuments();

  // Category distribution
  const categories = [
    'Road Damage',
    'Garbage',
    'Water Supply',
    'Drainage',
    'Street Light',
    'Electricity',
    'Public Safety',
    'Traffic',
    'Environment',
    'Other'
  ];
  
  const categoryStats = [];
  for (const cat of categories) {
    const count = await Complaint.countDocuments({ category: cat });
    categoryStats.push({ category: cat, count });
  }

  // Monthly trends (aggregate from database or realistic projection)
  const complaintTrends = [
    { month: 'Feb', count: 12 },
    { month: 'Mar', count: 18 },
    { month: 'Apr', count: 24 },
    { month: 'May', count: 20 },
    { month: 'Jun', count: 28 },
    { month: 'Jul', count: total || 32 }
  ];

  // Recent complaints (latest 5)
  const recentComplaints = await Complaint.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'fullName');

  // Activities (fetched from Notification logs representing system events)
  const dbNotifications = await Notification.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('recipientUser', 'fullName');

  const formattedActivity = dbNotifications.map(n => {
    let type = 'system';
    if (n.message.toLowerCase().includes('submitted')) type = 'submitted';
    if (n.message.toLowerCase().includes('verified')) type = 'verified';
    if (n.message.toLowerCase().includes('resolved')) type = 'resolved';
    if (n.message.toLowerCase().includes('registered')) type = 'user';

    return {
      id: n._id,
      type,
      message: n.message,
      createdAt: n.createdAt
    };
  });

  res.status(200).json({
    success: true,
    stats: {
      total,
      pending,
      verified,
      inProgress,
      resolved,
      rejected,
      activeUsers
    },
    recentComplaints,
    recentActivity: formattedActivity,
    charts: {
      categoryDistribution: categoryStats,
      complaintTrends
    }
  });
});

// ==========================================
// Complaint Management
// ==========================================

// @desc    Get all complaints with filters
// @route   GET /api/admin/complaints
// @access  Private (Admin)
const getAllComplaints = asyncHandler(async (req, res) => {
  const { search, category, status, priority, department, startDate, endDate } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (department) filter.assignedDepartment = department;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    // Find matching citizens first
    const matchedUsers = await User.find({
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    const matchedUserIds = matchedUsers.map(u => u._id);

    filter.$or = [
      { complaintId: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { user: { $in: matchedUserIds } }
    ];
  }

  const complaints = await Complaint.find(filter)
    .sort({ createdAt: -1 })
    .populate('user', 'fullName email mobile profilePicture address');

  res.status(200).json({
    success: true,
    count: complaints.length,
    complaints
  });
});

// @desc    Get single complaint details
// @route   GET /api/admin/complaints/:id
// @access  Private (Admin)
const getComplaintDetails = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'fullName email mobile profilePicture address');

  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  // Also query notifications or activities relating to this complaint
  const dbNotifications = await Notification.find({
    message: { $regex: complaint.title, $options: 'i' }
  }).sort({ createdAt: -1 });

  // Format into a timeline/activity log
  const activityLogs = dbNotifications.map(n => ({
    message: n.message,
    createdAt: n.createdAt,
    adminName: 'Panchayat Officer'
  }));

  res.status(200).json({
    success: true,
    complaint,
    activityLogs
  });
});

// @desc    Update complaint status/properties
// @route   PUT /api/admin/complaints/:id
// @access  Private (Admin)
const updateComplaintAdmin = asyncHandler(async (req, res) => {
  const { status, assignedDepartment, priority, adminNote, assignedOfficer, dueDate } = req.body;
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  const oldStatus = complaint.status;
  const oldDept = complaint.assignedDepartment;
  const oldNote = complaint.landmark;

  if (status) complaint.status = status;
  if (assignedDepartment) complaint.assignedDepartment = assignedDepartment;
  if (priority) complaint.priority = priority;
  if (assignedOfficer !== undefined) complaint.assignedOfficer = assignedOfficer;
  if (dueDate !== undefined) complaint.dueDate = dueDate;
  if (adminNote) complaint.landmark = adminNote;

  await complaint.save();

  // Trigger Notifications based on modified values
  if (status && status !== oldStatus) {
    if (status === 'Verified') {
      await createNotification({
        recipientUser: complaint.user,
        recipientRole: 'citizen',
        title: 'Complaint Verified',
        message: `Your ${complaint.category} complaint ${complaint.complaintId} has been verified by the Panchayat Office.`,
        type: 'Success',
        relatedComplaint: complaint._id
      });
    } else if (status === 'Assigned') {
      await createNotification({
        recipientUser: complaint.user,
        recipientRole: 'citizen',
        title: 'Complaint Assigned',
        message: `Your complaint ${complaint.complaintId} has been assigned to ${complaint.assignedDepartment}.`,
        type: 'Information',
        relatedComplaint: complaint._id
      });
      await createNotification({
        recipientRole: 'admin',
        title: 'Officer Accepted Assignment',
        message: `${complaint.assignedDepartment} officer has accepted assignment for complaint ${complaint.complaintId}.`,
        type: 'Success',
        relatedComplaint: complaint._id
      });
    } else if (status === 'In Progress') {
      await createNotification({
        recipientUser: complaint.user,
        recipientRole: 'citizen',
        title: 'Work Started',
        message: `Work has started on your complaint ${complaint.complaintId}.`,
        type: 'Information',
        relatedComplaint: complaint._id
      });
      await createNotification({
        recipientUser: complaint.user,
        recipientRole: 'citizen',
        title: 'Complaint In Progress',
        message: `Your complaint ${complaint.complaintId} is currently in progress.`,
        type: 'Information',
        relatedComplaint: complaint._id
      });
    } else if (status === 'Resolved') {
      await createNotification({
        recipientUser: complaint.user,
        recipientRole: 'citizen',
        title: 'Complaint Resolved',
        message: `Your complaint ${complaint.complaintId} has been resolved successfully by the field team.`,
        type: 'Success',
        relatedComplaint: complaint._id
      });
      await createNotification({
        recipientRole: 'admin',
        title: 'Officer Completed Work',
        message: `Completed: Assigned field officer reported resolution on complaint ${complaint.complaintId}.`,
        type: 'Success',
        relatedComplaint: complaint._id
      });
    } else if (status === 'Rejected') {
      await createNotification({
        recipientUser: complaint.user,
        recipientRole: 'citizen',
        title: 'Complaint Rejected',
        message: `Your complaint ${complaint.complaintId} has been rejected. Details: Duplicate or out-of-scope report.`,
        type: 'Error',
        relatedComplaint: complaint._id
      });
    }
  } else if (assignedDepartment && assignedDepartment !== oldDept) {
    await createNotification({
      recipientUser: complaint.user,
      recipientRole: 'citizen',
      title: 'Complaint Assigned',
      message: `Your complaint ${complaint.complaintId} has been routed to ${complaint.assignedDepartment}.`,
      type: 'Information',
      relatedComplaint: complaint._id
    });
    await createNotification({
      recipientRole: 'admin',
      title: 'Officer Accepted Assignment',
      message: `${complaint.assignedDepartment} officer has accepted assignment for complaint ${complaint.complaintId}.`,
      type: 'Success',
      relatedComplaint: complaint._id
    });
  }

  if (adminNote && adminNote !== oldNote) {
    await createNotification({
      recipientUser: complaint.user,
      recipientRole: 'citizen',
      title: 'Additional Information Requested',
      message: `Panchayat Office has requested additional details for complaint ${complaint.complaintId}: "${adminNote}".`,
      type: 'Warning',
      relatedComplaint: complaint._id
    });
  }

  const updated = await Complaint.findById(req.params.id)
    .populate('user', 'fullName email mobile profilePicture address');

  res.status(200).json({
    success: true,
    message: 'Complaint updated successfully',
    complaint: updated
  });
});

// @desc    Delete complaint
// @route   DELETE /api/admin/complaints/:id
// @access  Private (Admin)
const deleteComplaintAdmin = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  await Complaint.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Complaint deleted successfully'
  });
});

// @desc    Export complaints based on filters to CSV
// @route   GET /api/admin/complaints/export
// @access  Private (Admin)
const exportComplaintsAdmin = asyncHandler(async (req, res) => {
  const { search, category, status, priority, department, fromDate, toDate } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (department) filter.assignedDepartment = department;

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  if (search) {
    const matchedUsers = await User.find({
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    const matchedUserIds = matchedUsers.map(u => u._id);

    filter.$or = [
      { complaintId: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { user: { $in: matchedUserIds } }
    ];
  }

  const complaints = await Complaint.find(filter)
    .sort({ createdAt: -1 })
    .populate('user', 'fullName email mobile profilePicture address');

  // CSV Generation Headers
  const headers = [
    'Complaint ID',
    'Title',
    'Category',
    'Priority',
    'Status',
    'Department',
    'Citizen Name',
    'Phone',
    'District',
    'Panchayat',
    'Assigned Officer',
    'Created Date',
    'Last Updated',
    'Resolved Date'
  ];

  const escapeCsv = (val) => {
    if (val === undefined || val === null) return '';
    let str = String(val);
    str = str.replace(/"/g, '""');
    if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
      str = `"${str}"`;
    }
    return str;
  };

  const rows = [];
  rows.push(headers.join(','));

  for (const c of complaints) {
    const resolvedDate = c.status === 'Resolved' ? (c.updatedAt ? new Date(c.updatedAt).toISOString() : '') : '';
    const row = [
      escapeCsv(c.complaintId),
      escapeCsv(c.title),
      escapeCsv(c.category),
      escapeCsv(c.priority || 'Normal'),
      escapeCsv(c.status),
      escapeCsv(c.assignedDepartment || 'Not Routed'),
      escapeCsv(c.anonymous ? 'Anonymous Citizen' : (c.user?.fullName || '')),
      escapeCsv(c.anonymous ? '' : (c.user?.mobile || '')),
      escapeCsv(c.district || 'Ernakulam'),
      escapeCsv(c.city || 'Kochi'),
      escapeCsv(c.assignedDepartment && c.assignedDepartment !== 'Not Assigned' ? 'Panchayat Officer' : 'None'),
      escapeCsv(c.createdAt ? new Date(c.createdAt).toISOString() : ''),
      escapeCsv(c.updatedAt ? new Date(c.updatedAt).toISOString() : ''),
      escapeCsv(resolvedDate)
    ];
    rows.push(row.join(','));
  }

  const csvContent = rows.join('\r\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=complaints.csv');
  res.status(200).send(csvContent);
});

module.exports = {
  getAdminStats,
  getAllComplaints,
  getComplaintDetails,
  updateComplaintAdmin,
  deleteComplaintAdmin,
  exportComplaintsAdmin
};

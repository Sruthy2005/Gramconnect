const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Panchayat = require('../models/Panchayat');
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

  const { startDate, endDate } = req.query;
  const complaintFilter = {};
  if (startDate || endDate) {
    complaintFilter.createdAt = {};
    if (startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      complaintFilter.createdAt.$gte = sDate;
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      complaintFilter.createdAt.$lte = eDate;
    }
  }

  // Aggregated Counts from MongoDB
  const total = await Complaint.countDocuments(complaintFilter);
  const pending = await Complaint.countDocuments({ ...complaintFilter, status: 'Pending' });
  const verified = await Complaint.countDocuments({ ...complaintFilter, status: 'Verified' });
  const assigned = await Complaint.countDocuments({ ...complaintFilter, status: 'Assigned' });
  const inProgress = await Complaint.countDocuments({ ...complaintFilter, status: 'In Progress' });
  const resolved = await Complaint.countDocuments({ ...complaintFilter, status: 'Resolved' });
  const rejected = await Complaint.countDocuments({ ...complaintFilter, status: 'Rejected' });
  
  const totalCitizens = await User.countDocuments({ role: 'citizen', isDeleted: { $ne: true } });
  const activeUsers = await User.countDocuments({ status: 'Active', isDeleted: { $ne: true } });

  // Dynamic Departments count based on unique routed departments or categories map
  const uniqueDepts = await Complaint.distinct('assignedDepartment');
  const activeDepts = uniqueDepts.filter(d => d && d !== 'Not Assigned' && d !== 'Not Routed');
  const departmentsCount = Math.max(activeDepts.length, 10); // Standard Panchayat has 10 core sections/departments

  // Category distribution
  const categoryData = await Complaint.aggregate([
    { $match: complaintFilter },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  const countMap = {};
  categoryData.forEach(item => {
    if (item._id) {
      countMap[item._id] = item.count;
    }
  });

  const canonicalCategories = [
    'Road Damage',
    'Garbage/Waste',
    'Drainage',
    'Water Leakage',
    'Streetlight',
    'Other'
  ];

  const allCategoryKeys = Array.from(new Set([...canonicalCategories, ...Object.keys(countMap)]));

  const categoryStats = allCategoryKeys.map(cat => ({
    category: cat,
    count: countMap[cat] || 0
  }));

  categoryStats.sort((a, b) => b.count - a.count);

  // Monthly trends (dynamically fetch last 6 months from database)
  const complaintTrends = [];
  const currentDate = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthName = d.toLocaleString('en-US', { month: 'short' });

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 1);

    // Apply date range intersections if present
    const trendFilter = {
      createdAt: {
        $gte: startOfMonth,
        $lt: endOfMonth
      }
    };
    if (complaintFilter.createdAt) {
      if (complaintFilter.createdAt.$gte && trendFilter.createdAt.$gte < complaintFilter.createdAt.$gte) {
        trendFilter.createdAt.$gte = complaintFilter.createdAt.$gte;
      }
      if (complaintFilter.createdAt.$lte && trendFilter.createdAt.$lt > complaintFilter.createdAt.$lte) {
        trendFilter.createdAt.$lt = complaintFilter.createdAt.$lte;
      }
    }

    const count = (trendFilter.createdAt.$gte < trendFilter.createdAt.$lt) 
      ? await Complaint.countDocuments(trendFilter) 
      : 0;

    complaintTrends.push({ month: monthName, count });
  }

  // Daily trends (dynamically fetch last 7 days from database)
  const dailyTrends = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayLabel = d.toLocaleString('en-US', { weekday: 'short' });

    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

    const trendFilter = {
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    };
    if (complaintFilter.createdAt) {
      if (complaintFilter.createdAt.$gte && trendFilter.createdAt.$gte < complaintFilter.createdAt.$gte) {
        trendFilter.createdAt.$gte = complaintFilter.createdAt.$gte;
      }
      if (complaintFilter.createdAt.$lte && trendFilter.createdAt.$lt > complaintFilter.createdAt.$lte) {
        trendFilter.createdAt.$lt = complaintFilter.createdAt.$lte;
      }
    }

    const count = (trendFilter.createdAt.$gte < trendFilter.createdAt.$lt)
      ? await Complaint.countDocuments(trendFilter)
      : 0;

    dailyTrends.push({ day: dayLabel, count });
  }

  // Location Analytics (Top 5 locations/cities with highest complaints count)
  const locationStatsRaw = await Complaint.aggregate([
    { $match: complaintFilter },
    {
      $group: {
        _id: '$city',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 5
    }
  ]);

  const topLocations = locationStatsRaw.map(item => ({
    location: item._id || 'General Ward',
    count: item.count
  }));

  // Department-wise SLA & routing performance
  const deptPerformanceRaw = await Complaint.aggregate([
    { $match: complaintFilter },
    {
      $group: {
        _id: '$assignedDepartment',
        total: { $sum: 1 },
        resolved: {
          $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        }
      }
    }
  ]);

  const departmentsList = [
    'Public Works Department (PWD)',
    'Sanitation Department',
    'Water Authority',
    'Sewerage & Drainage Board',
    'Electricity & Street Light Section',
    'State Power Corporation',
    'Local Police Department',
    'Traffic Police Section',
    'Health & Environment Department',
    'General Panchayat Administration'
  ];

  const performanceMap = {};
  deptPerformanceRaw.forEach(item => {
    if (item._id && item._id !== 'Not Assigned') {
      performanceMap[item._id] = {
        total: item.total,
        resolved: item.resolved,
        pending: item.pending
      };
    }
  });

  const departmentPerformance = departmentsList.map(dept => {
    const data = performanceMap[dept] || { total: 0, resolved: 0, pending: 0 };
    const successRate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;
    return {
      department: dept,
      total: data.total,
      resolved: data.resolved,
      pending: data.pending,
      successRate
    };
  });

  departmentPerformance.sort((a, b) => b.total - a.total);

  // Priority distribution
  const priorityDataRaw = await Complaint.aggregate([
    { $match: complaintFilter },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const priorityStats = {
    Low: 0,
    Normal: 0,
    High: 0,
    Urgent: 0
  };
  priorityDataRaw.forEach(item => {
    const key = item._id || 'Normal';
    if (priorityStats[key] !== undefined) {
      priorityStats[key] = item.count;
    }
  });

  // Panchayath-wise comparison
  const panchayatStatsRaw = await Complaint.aggregate([
    { $match: complaintFilter },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $unwind: '$userInfo'
    },
    {
      $group: {
        _id: '$userInfo.panchayat',
        total: { $sum: 1 },
        resolved: {
          $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        }
      }
    }
  ]);

  const panchayatPerformance = panchayatStatsRaw.map(item => {
    const successRate = item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0;
    return {
      panchayat: item._id || 'General/Not Assigned',
      total: item.total,
      resolved: item.resolved,
      pending: item.pending,
      successRate
    };
  });
  
  panchayatPerformance.sort((a, b) => b.total - a.total);

  // Recent complaints (latest 5)
  const recentComplaints = await Complaint.find(complaintFilter)
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
      assigned,
      inProgress,
      resolved,
      rejected,
      activeUsers,
      totalCitizens,
      departments: departmentsCount
    },
    recentComplaints,
    recentActivity: formattedActivity,
    charts: {
      categoryDistribution: categoryStats,
      monthlyTrends: complaintTrends,
      dailyTrends,
      topLocations,
      departmentPerformance,
      priorityDistribution: priorityStats,
      panchayatPerformance
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

  // ─── PANCHAYAT ADMIN SCOPE ─────────────────────────────────────────────────
  const isPanchayatAdmin = req.user.role &&
    ['panchayat_admin', 'PANCHAYAT_ADMIN'].includes(req.user.role);
  if (isPanchayatAdmin) {
    console.log('--- PANCHAYAT ADMIN COMPLAINT FILTER DEBUG ---');
    console.log('Logged-in admin user ID:', req.user._id);
    console.log('Admin role:', req.user.role);
    console.log('Admin panchayatId:', req.user.panchayatId);

    if (!req.user.panchayatId) {
      console.log('No assigned Panchayat found for admin. Returning empty results.');
      console.log('Number of complaints returned: 0');
      console.log('----------------------------------------------');
      return res.status(200).json({
        success: true,
        count: 0,
        complaints: []
      });
    }

    filter.panchayatId = req.user.panchayatId;
    console.log('Complaint API filter:', filter);
  }
  // ──────────────────────────────────────────────────────────────────────────

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

    const searchCondition = {
      $or: [
        { complaintId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { user: { $in: matchedUserIds } }
      ]
    };

    // Merge with existing $and if present
    if (filter.user) {
      filter.$and = [{ user: filter.user }, searchCondition];
      delete filter.user;
    } else {
      Object.assign(filter, searchCondition);
    }
  }

  const complaints = await Complaint.find(filter)
    .sort({ createdAt: -1 })
    .populate('user', 'fullName email mobile profilePicture address')
    .populate('duplicateOf', 'complaintId title category status');

  if (isPanchayatAdmin) {
    console.log('Number of complaints returned:', complaints.length);
    console.log('----------------------------------------------');
  }

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
    .populate('user', 'fullName email mobile profilePicture address district localBody localBodyType ward houseName street landmark pinCode')
    .populate('duplicateOf', 'complaintId title category status');

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

  // Fallback defaults for legacy documents to prevent Mongoose schema validation failure on save
  if (!complaint.taluk || complaint.taluk === 'undefined') complaint.taluk = 'Kollam';
  if (!complaint.localBody || complaint.localBody === 'undefined') complaint.localBody = 'Eravipuram Panchayat';
  if (!complaint.localBodyType || complaint.localBodyType === 'undefined') complaint.localBodyType = 'Grama Panchayat';
  if (!complaint.city || complaint.city === 'undefined') complaint.city = 'Eravipuram';
  if (!complaint.pincode || complaint.pincode === 'undefined') complaint.pincode = '691011';
  if (complaint.latitude === undefined || complaint.latitude === null) complaint.latitude = 8.8932;
  if (complaint.longitude === undefined || complaint.longitude === null) complaint.longitude = 76.6141;
  if (!complaint.priority) complaint.priority = 'Normal';

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
        relatedComplaint: complaint._id,
        districtTarget: req.user.district || 'ALL',
        panchayatTarget: req.user.panchayat || 'ALL'
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
        relatedComplaint: complaint._id,
        districtTarget: req.user.district || 'ALL',
        panchayatTarget: req.user.panchayat || 'ALL'
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
      relatedComplaint: complaint._id,
      districtTarget: req.user.district || 'ALL',
      panchayatTarget: req.user.panchayat || 'ALL'
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
    'AI Category',
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
      escapeCsv(c.aiCategory || c.category),
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

// @desc    Get all users with filter, pagination & stats
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, status, verification, date, district, page = 1, limit } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = limit ? parseInt(limit, 10) : 1000;
  const skip = (pageNum - 1) * limitNum;

  // Base query: all registered users (citizens & admins), not deleted
  let query = { isDeleted: { $ne: true } };

  // ─── PANCHAYAT ADMIN SCOPE ─────────────────────────────────────────────────
  const isPanchayatAdminUser = req.user.role &&
    ['panchayat_admin', 'PANCHAYAT_ADMIN'].includes(req.user.role);
  if (isPanchayatAdminUser) {
    if (!req.user.panchayatId) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        users: []
      });
    }
    // Only show citizens in this panchayat's area
    query.role = { $in: ['citizen', 'Citizen'] };
    query.panchayatId = req.user.panchayatId;
  }
  // ──────────────────────────────────────────────────────────────────────────

  // Search by Name, Email, or Phone
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { mobile: searchRegex }
    ];
  }

  // Filter by Status (All, Active, Blocked)
  if (status && status !== 'All') {
    query.status = status;
  }

  // Filter by Verification (All, Verified, Unverified)
  if (verification && verification !== 'All') {
    query.isVerified = verification === 'Verified';
  }

  // Filter by District
  if (district && district !== 'All') {
    query.district = district;
  }

  // Filter by Registration Date
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    query.createdAt = { $gte: startOfDay, $lte: endOfDay };
  }


  // Execute query with pagination and safety deselect on passwords/tokens
  const users = await User.find(query)
    .select('-password -resetPasswordToken -resetPasswordExpire -passwordResetToken -passwordResetExpires -passwordResetOtp -passwordResetOtpExpires')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await User.countDocuments(query);

  // Compute complaint stats for each user in this page
  const usersWithStats = await Promise.all(
    users.map(async (u) => {
      const [totalComplaints, resolved, pending] = await Promise.all([
        Complaint.countDocuments({ user: u._id }),
        Complaint.countDocuments({ user: u._id, status: 'Resolved' }),
        Complaint.countDocuments({ user: u._id, status: { $in: ['Pending', 'Verified', 'In Progress'] } })
      ]);
      return {
        _id: u._id,
        fullName: u.fullName,
        email: u.email,
        mobile: u.mobile,
        district: u.district || '',
        panchayat: u.panchayat || '',
        panchayatId: u.panchayatId || null,
        localBody: u.localBody || '',
        localBodyType: u.localBodyType || '',
        ward: u.ward || '',
        address: u.address || '',
        houseName: u.houseName || '',
        street: u.street || '',
        landmark: u.landmark || '',
        pinCode: u.pinCode || '',
        status: u.status || 'Active',
        isVerified: u.isVerified,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin || null,
        totalComplaints,
        resolvedComplaints: resolved,
        pendingComplaints: pending
      };
    })
  );

  // Calculate summary metrics for the header statistics cards
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalUsersCount, activeUsersCount, blockedUsersCount, newUsersCount] = await Promise.all([
    User.countDocuments({ role: { $in: ['citizen', 'Citizen'] }, isDeleted: { $ne: true } }),
    User.countDocuments({ role: { $in: ['citizen', 'Citizen'] }, isDeleted: { $ne: true }, status: { $ne: 'Blocked' } }),
    User.countDocuments({ role: { $in: ['citizen', 'Citizen'] }, isDeleted: { $ne: true }, status: 'Blocked' }),
    User.countDocuments({ role: { $in: ['citizen', 'Citizen'] }, isDeleted: { $ne: true }, createdAt: { $gte: startOfMonth } })
  ]);

  res.status(200).json({
    success: true,
    users: usersWithStats,
    total,
    stats: {
      totalUsers: totalUsersCount,
      activeUsers: activeUsersCount,
      blockedUsers: blockedUsersCount,
      newUsersThisMonth: newUsersCount
    }
  });
});

// @desc    Get detailed user profile & history
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
    .select('-password -resetPasswordToken -resetPasswordExpire -passwordResetToken -passwordResetExpires -passwordResetOtp -passwordResetOtpExpires');
  if (!user) {
    return res.status(404).json({ message: 'User not found or has been deleted.' });
  }

  // Compute stats for Row 2 exactly as required
  const [total, resolved, pending, rejected, verified, inProgress] = await Promise.all([
    Complaint.countDocuments({ user: user._id }),
    Complaint.countDocuments({ user: user._id, status: 'Resolved' }),
    Complaint.countDocuments({ user: user._id, status: 'Pending' }),
    Complaint.countDocuments({ user: user._id, status: 'Rejected' }),
    Complaint.countDocuments({ user: user._id, status: 'Verified' }),
    Complaint.countDocuments({ user: user._id, status: 'In Progress' })
  ]);

  // Fetch all complaints
  const complaints = await Complaint.find({ user: user._id }).sort({ createdAt: -1 });

  // Compile Dynamic Activity Timeline
  const timeline = [];

  // Event A: Account Registration
  timeline.push({
    event: 'Registered Account',
    description: `Created a new citizen profile on GramConnect. Role: ${user.role || 'Citizen'}`,
    createdAt: user.createdAt
  });

  // Event B: Complaint Submissions & Actions
  for (const c of complaints) {
    timeline.push({
      event: 'Submitted Complaint',
      description: `Submitted complaint: ${c.complaintId} under category ${c.category}.`,
      createdAt: c.createdAt
    });

    if (c.status === 'Resolved') {
      timeline.push({
        event: 'Complaint Resolved',
        description: `Complaint ${c.complaintId} has been resolved successfully.`,
        createdAt: c.updatedAt
      });
    } else if (c.status === 'Verified') {
      timeline.push({
        event: 'Complaint Verified',
        description: `Complaint ${c.complaintId} was verified by the Panchayat Admin.`,
        createdAt: c.updatedAt
      });
    }
  }

  // Event C: Related User Notifications
  const userNotifs = await Notification.find({ recipientUser: user._id }).sort({ createdAt: -1 }).limit(10);
  for (const n of userNotifs) {
    // Avoid duplicate resolved/verified descriptors if they already exist
    const isDuplicate = timeline.some(t => t.description === n.message);
    if (!isDuplicate) {
      timeline.push({
        event: n.title,
        description: n.message,
        createdAt: n.createdAt
      });
    }
  }

  // Sort timeline by date descending
  timeline.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      district: user.district || '',
      panchayat: user.panchayat || '',
      localBody: user.localBody || '',
      localBodyType: user.localBodyType || '',
      ward: user.ward || '',
      address: user.address || '',
      houseName: user.houseName || '',
      street: user.street || '',
      landmark: user.landmark || '',
      pinCode: user.pinCode || '',
      isVerified: user.isVerified,
      status: user.status || 'Active',
      blockedReason: user.blockedReason || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin || null,
      role: user.role || 'Citizen',
      stats: {
        total,
        resolved,
        pending,
        rejected,
        verified,
        inProgress
      },
      complaints,
      timeline
    }
  });
});

// @desc    Update user details
// @route   PATCH /api/admin/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { fullName, email, mobile, address, district, panchayat, ward, isVerified } = req.body;

  if (fullName) user.fullName = fullName;
  if (email) user.email = email;
  if (mobile) user.mobile = mobile;
  if (address !== undefined) user.address = address;
  if (district !== undefined) user.district = district;
  if (panchayat !== undefined) user.panchayat = panchayat;
  if (ward !== undefined) user.ward = ward;
  if (isVerified !== undefined) user.isVerified = isVerified;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'User profile updated successfully',
    user
  });
});

// @desc    Block user with optional reason
// @route   PATCH /api/admin/users/:id/block
// @access  Private/Admin
const blockUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.status = 'Blocked';
  user.blockedReason = req.body.reason || 'No reason provided';
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User account has been blocked successfully',
    user
  });
});

// @desc    Unblock user
// @route   PATCH /api/admin/users/:id/unblock
// @access  Private/Admin
const unblockUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.status = 'Active';
  user.blockedReason = '';
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User account unblocked successfully',
    user
  });
});

// @desc    Soft delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.isDeleted = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User account has been soft-deleted successfully'
  });
});

// @desc    Reset user password
// @route   PATCH /api/admin/users/:id/reset-password
// @access  Private/Admin
const resetUserPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  user.password = password;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User password reset successfully'
  });
});

// @desc    Export filtered users as CSV/Excel
// @route   GET /api/admin/users/export
// @access  Private/Admin
const exportUsers = asyncHandler(async (req, res) => {
  const { search, status, verification, date, district, format } = req.query;

  let query = { role: { $in: ['citizen', 'Citizen'] }, isDeleted: { $ne: true } };

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { mobile: searchRegex }
    ];
  }
  if (status && status !== 'All') {
    query.status = status;
  }
  if (verification && verification !== 'All') {
    query.isVerified = verification === 'Verified';
  }
  if (district && district !== 'All') {
    query.district = district;
  }
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    query.createdAt = { $gte: startOfDay, $lte: endOfDay };
  }

  const users = await User.find(query).sort({ createdAt: -1 });

  const usersWithStats = await Promise.all(users.map(async (u) => {
    const [total, resolved, pending] = await Promise.all([
      Complaint.countDocuments({ user: u._id }),
      Complaint.countDocuments({ user: u._id, status: 'Resolved' }),
      Complaint.countDocuments({ user: u._id, status: { $in: ['Pending', 'Verified', 'In Progress'] } })
    ]);
    return {
      fullName: u.fullName,
      email: u.email,
      mobile: u.mobile || '',
      district: u.district || 'Ernakulam',
      panchayat: u.panchayat || '',
      ward: u.ward || '',
      registeredDate: u.createdAt.toISOString().split('T')[0],
      lastLogin: u.lastLogin ? u.lastLogin.toISOString().split('T')[0] : 'Never',
      isVerified: u.isVerified ? 'Verified' : 'Unverified',
      totalComplaints: total,
      resolvedComplaints: resolved,
      pendingComplaints: pending,
      status: u.status || 'Active'
    };
  }));

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '';
    const s = String(str);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  let rows = [];
  rows.push([
    'Full Name',
    'Email',
    'Phone',
    'District',
    'Panchayat',
    'Ward',
    'Registered Date',
    'Last Login',
    'Email Verified',
    'Total Complaints',
    'Resolved Complaints',
    'Pending Complaints',
    'Status'
  ].join(','));

  for (const u of usersWithStats) {
    const row = [
      escapeCsv(u.fullName),
      escapeCsv(u.email),
      escapeCsv(u.mobile),
      escapeCsv(u.district),
      escapeCsv(u.panchayat),
      escapeCsv(u.ward),
      escapeCsv(u.registeredDate),
      escapeCsv(u.lastLogin),
      escapeCsv(u.isVerified),
      u.totalComplaints,
      u.resolvedComplaints,
      u.pendingComplaints,
      escapeCsv(u.status)
    ];
    rows.push(row.join(','));
  }

  const csvContent = rows.join('\r\n');

  const filename = format === 'excel' ? 'users_export.xls' : 'users_export.csv';
  const contentType = format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.status(200).send(csvContent);
});

// ==========================================
// Panchayat Admin Management
// ==========================================

// @desc    Get all panchayat admins with filters and stats
// @route   GET /api/admin/panchayat-admins
// @access  Private (Super Admin / Main Admin)
const getPanchayatAdmins = asyncHandler(async (req, res) => {
  const { search, district, panchayat, status } = req.query;

  const filter = {
    role: { $in: ['panchayat_admin', 'PANCHAYAT_ADMIN'] },
    isDeleted: { $ne: true }
  };

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } }
    ];
  }
  if (district) filter.district = district;
  if (panchayat) filter.panchayat = panchayat;
  if (status && status !== 'All') filter.status = status;

  const admins = await User.find(filter)
    .select('-password -resetPasswordToken -resetPasswordExpire -passwordResetToken -passwordResetExpires -passwordResetOtp -passwordResetOtpExpires')
    .sort({ createdAt: -1 });

  const total = await User.countDocuments({ role: { $in: ['panchayat_admin', 'PANCHAYAT_ADMIN'] }, isDeleted: { $ne: true } });
  const active = await User.countDocuments({ role: { $in: ['panchayat_admin', 'PANCHAYAT_ADMIN'] }, isDeleted: { $ne: true }, status: 'Active' });
  const inactive = await User.countDocuments({ role: { $in: ['panchayat_admin', 'PANCHAYAT_ADMIN'] }, isDeleted: { $ne: true }, status: { $ne: 'Active' } });

  res.status(200).json({
    success: true,
    admins,
    stats: { total, active, inactive }
  });
});

const generatePanchayatCodeHelper = async (districtName, panchayatName) => {
  const distAbbr = (districtName || 'GEN').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';
  const cleanPanch = (panchayatName || 'PAN')
    .replace(/\s*(Panchayat|Corporation|Municipality|Grama|Nagar|Town)\s*/gi, '')
    .trim();
  const panchAbbr = (cleanPanch || panchayatName || 'PAN').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'PAN';

  const prefix = `${distAbbr}-${panchAbbr}`;

  const existingWithPrefix = await Panchayat.countDocuments({
    panchayatCode: { $regex: `^${prefix}-`, $options: 'i' }
  });

  const seqNum = existingWithPrefix + 1;
  return `${prefix}-${String(seqNum).padStart(3, '0')}`;
};

// @desc    Create a new panchayat admin
// @route   POST /api/admin/panchayat-admins
// @access  Private (Super Admin / Main Admin)
const createPanchayatAdmin = asyncHandler(async (req, res) => {
  const { fullName, email, mobile, password, confirmPassword, district, localBodyType, panchayat, panchayatCode, status } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────
  const nameRegex = /^[A-Za-z\s]+$/;
  const phoneRegex = /^\d{10}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ success: false, message: 'Full Name is required.' });
  }
  if (!nameRegex.test(fullName.trim())) {
    return res.status(400).json({ success: false, message: 'Full Name must contain letters and spaces only.' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
  }
  if (!mobile || !mobile.trim()) {
    return res.status(400).json({ success: false, message: 'Phone Number is required.' });
  }
  if (!phoneRegex.test(mobile.trim())) {
    return res.status(400).json({ success: false, message: 'Phone Number must be exactly 10 digits.' });
  }
  if (!district) {
    return res.status(400).json({ success: false, message: 'District is required.' });
  }
  if (!localBodyType) {
    return res.status(400).json({ success: false, message: 'Local Body Type is required.' });
  }
  if (!panchayat) {
    return res.status(400).json({ success: false, message: localBodyType === 'Municipality' ? 'Municipality is required.' : 'Panchayath is required.' });
  }
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }
  if (!confirmPassword) {
    return res.status(400).json({ success: false, message: 'Please confirm your password.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  const emailExists = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });
  if (emailExists) {
    return res.status(400).json({ message: 'An account with this email already exists' });
  }

  // Lookup or create Panchayat matching by name (panchayat) and district
  let panchayatMatch = await Panchayat.findOne({
    name: { $regex: new RegExp(`^${panchayat.trim()}$`, 'i') },
    district: { $regex: new RegExp(`^${district.trim()}$`, 'i') },
    isDeleted: { $ne: true }
  });

  if (!panchayatMatch) {
    const generatedCode = await generatePanchayatCodeHelper(district, panchayat);
    panchayatMatch = await Panchayat.create({
      name: panchayat.trim(),
      district: district.trim(),
      status: 'Active',
      panchayatCode: generatedCode
    });
  }

  const admin = await User.create({
    fullName,
    email: email.toLowerCase(),
    mobile,
    password,
    role: 'panchayat_admin',
    district,
    panchayat,
    panchayatId: panchayatMatch._id,
    localBodyType: localBodyType || 'Grama Panchayath',
    panchayatCode: panchayatCode || '',
    status: status || 'Active',
    isVerified: true
  });

  panchayatMatch.adminId = admin._id;
  await panchayatMatch.save();

  res.status(201).json({
    success: true,
    admin: {
      _id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      mobile: admin.mobile,
      role: admin.role,
      district: admin.district,
      panchayat: admin.panchayat,
      panchayatId: admin.panchayatId,
      localBodyType: admin.localBodyType,
      panchayatCode: admin.panchayatCode,
      status: admin.status,
      createdAt: admin.createdAt
    }
  });
});

// @desc    Update panchayat admin details
// @route   PUT /api/admin/panchayat-admins/:id
// @access  Private (Super Admin / Main Admin)
const updatePanchayatAdmin = asyncHandler(async (req, res) => {
  const { fullName, mobile, district, localBodyType, panchayat, panchayatCode, status } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────
  const nameRegex = /^[A-Za-z\s]+$/;
  const phoneRegex = /^\d{10}$/;

  if (fullName !== undefined) {
    if (!fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full Name is required.' });
    }
    if (!nameRegex.test(fullName.trim())) {
      return res.status(400).json({ success: false, message: 'Full Name must contain letters and spaces only.' });
    }
  }
  if (mobile !== undefined) {
    if (!mobile.trim()) {
      return res.status(400).json({ success: false, message: 'Phone Number is required.' });
    }
    if (!phoneRegex.test(mobile.trim())) {
      return res.status(400).json({ success: false, message: 'Phone Number must be exactly 10 digits.' });
    }
  }
  if (status !== undefined && !['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be Active or Inactive.' });
  }
  const admin = await User.findOne({
    _id: req.params.id,
    role: { $in: ['panchayat_admin', 'PANCHAYAT_ADMIN'] },
    isDeleted: { $ne: true }
  });

  if (!admin) {
    return res.status(404).json({ message: 'Panchayat Admin not found' });
  }

  if (fullName) admin.fullName = fullName;
  if (mobile) admin.mobile = mobile;
  if (district) admin.district = district;
  if (localBodyType) admin.localBodyType = localBodyType;
  if (panchayat) admin.panchayat = panchayat;
  if (panchayatCode !== undefined) admin.panchayatCode = panchayatCode;
  if (status) admin.status = status;

  // Sync panchayatId if panchayat or district changed
  if (panchayat || district) {
    const searchPanchayat = admin.panchayat;
    const searchDistrict = admin.district;
    let panchayatMatch = await Panchayat.findOne({
      name: { $regex: new RegExp(`^${searchPanchayat.trim()}$`, 'i') },
      district: { $regex: new RegExp(`^${searchDistrict.trim()}$`, 'i') },
      isDeleted: { $ne: true }
    });
    if (!panchayatMatch) {
      const generatedCode = await generatePanchayatCodeHelper(searchDistrict, searchPanchayat);
      panchayatMatch = await Panchayat.create({
        name: searchPanchayat.trim(),
        district: searchDistrict.trim(),
        status: 'Active',
        adminId: admin._id,
        panchayatCode: generatedCode
      });
    } else {
      panchayatMatch.adminId = admin._id;
      await panchayatMatch.save();
    }
    admin.panchayatId = panchayatMatch._id;
  }

  await admin.save();

  res.status(200).json({
    success: true,
    admin: {
      _id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      mobile: admin.mobile,
      role: admin.role,
      district: admin.district,
      panchayat: admin.panchayat,
      localBodyType: admin.localBodyType,
      panchayatCode: admin.panchayatCode,
      status: admin.status,
      createdAt: admin.createdAt
    }
  });
});

// @desc    Toggle panchayat admin status Active <-> Inactive
// @route   PATCH /api/admin/panchayat-admins/:id/status
// @access  Private (Super Admin / Main Admin)
const togglePanchayatAdminStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status || !['Active', 'Inactive', 'Blocked'].includes(status)) {
    return res.status(400).json({ message: 'Valid status required (Active / Inactive)' });
  }

  const admin = await User.findOne({
    _id: req.params.id,
    role: { $in: ['panchayat_admin', 'PANCHAYAT_ADMIN'] },
    isDeleted: { $ne: true }
  });

  if (!admin) {
    return res.status(404).json({ message: 'Panchayat Admin not found' });
  }

  admin.status = status;
  await admin.save();

  res.status(200).json({
    success: true,
    message: `Panchayat Admin status updated to ${status}`,
    admin: { _id: admin._id, status: admin.status }
  });
});

// @desc    Soft delete panchayat admin
// @route   DELETE /api/admin/panchayat-admins/:id
// @access  Private (Super Admin / Main Admin)
const deletePanchayatAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findOne({
    _id: req.params.id,
    role: { $in: ['panchayat_admin', 'PANCHAYAT_ADMIN'] },
    isDeleted: { $ne: true }
  });

  if (!admin) {
    return res.status(404).json({ message: 'Panchayat Admin not found' });
  }

  admin.isDeleted = true;
  admin.panchayatId = null;
  await admin.save();

  res.status(200).json({
    success: true,
    message: 'Panchayat Admin removed successfully'
  });
});

// @desc    Get dashboard stats scoped to panchayat admin's area
// @route   GET /api/admin/panchayat-admin/stats
// @access  Private (panchayat_admin)
const getPanchayatAdminDashboardStats = asyncHandler(async (req, res) => {
  const { panchayat, district } = req.user;
  const isPanchayatAdmin = req.user.role &&
    ['panchayat_admin', 'PANCHAYAT_ADMIN'].includes(req.user.role);

  if (isPanchayatAdmin && !req.user.panchayatId) {
    return res.status(200).json({
      success: true,
      panchayat: req.user.panchayat || '',
      district: req.user.district || '',
      stats: {
        totalCitizens: 0,
        totalComplaints: 0,
        pendingComplaints: 0,
        inProgressComplaints: 0,
        resolvedComplaints: 0
      },
      recentComplaints: []
    });
  }

  // Get citizens in this panchayat
  const citizenQuery = {
    role: { $in: ['citizen', 'Citizen'] },
    isDeleted: { $ne: true },
    $or: [
      { panchayatId: req.user.panchayatId },
      { panchayat: req.user.panchayat }
    ]
  };

  const complaintFilter = { panchayatId: req.user.panchayatId };

  const [
    totalCitizens,
    totalComplaints,
    pendingComplaints,
    inProgressComplaints,
    resolvedComplaints
  ] = await Promise.all([
    User.countDocuments(citizenQuery),
    Complaint.countDocuments(complaintFilter),
    Complaint.countDocuments({ ...complaintFilter, status: 'Pending' }),
    Complaint.countDocuments({ ...complaintFilter, status: 'In Progress' }),
    Complaint.countDocuments({ ...complaintFilter, status: 'Resolved' })
  ]);

  // Recent complaints
  const recentComplaints = await Complaint.find(complaintFilter)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'fullName');

  res.status(200).json({
    success: true,
    panchayat: panchayat || '',
    district: district || '',
    stats: {
      totalCitizens,
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints
    },
    recentComplaints
  });
});

module.exports = {
  getAdminStats,
  getAllComplaints,
  getComplaintDetails,
  updateComplaintAdmin,
  deleteComplaintAdmin,
  exportComplaintsAdmin,
  getAllUsers,
  getUserDetails,
  updateUser,
  blockUser,
  unblockUser,
  deleteUser,
  resetUserPassword,
  exportUsers,
  // Panchayat Admin Management
  getPanchayatAdmins,
  createPanchayatAdmin,
  updatePanchayatAdmin,
  togglePanchayatAdminStatus,
  deletePanchayatAdmin,
  getPanchayatAdminDashboardStats
};


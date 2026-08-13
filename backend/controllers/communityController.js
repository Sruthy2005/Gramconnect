const CommunityPost = require('../models/CommunityPost');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../utils/notificationHelper');

/**
 * Seeder to pre-populate DB with mock community posts if empty.
 */
const seedCommunityPostsIfEmpty = async () => {
  try {
    const postCount = await CommunityPost.countDocuments();
    if (postCount > 0) return;

    console.log('[DEV SEEDER] Seeding community posts...');

    // 1. Create or find mock users
    const usersData = [
      {
        fullName: 'Arun Kumar',
        email: 'arun_kr@gramconnect.org',
        mobile: '9876543201',
        password: 'Password@123',
        role: 'citizen',
        isVerified: true,
        district: 'Ernakulam',
        profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
      },
      {
        fullName: 'Reshma R',
        email: 'resh_28@gramconnect.org',
        mobile: '9876543202',
        password: 'Password@123',
        role: 'citizen',
        isVerified: true,
        district: 'Trivandrum',
        profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
      },
      {
        fullName: 'Jithin Jose',
        email: 'jithin_j@gramconnect.org',
        mobile: '9876543203',
        password: 'Password@123',
        role: 'citizen',
        isVerified: true,
        district: 'Kozhikode',
        profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      },
      {
        fullName: 'Meera Nair',
        email: 'meera_nair@gramconnect.org',
        mobile: '9876543204',
        password: 'Password@123',
        role: 'citizen',
        isVerified: true,
        district: 'Thrissur',
        profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
      },
      {
        fullName: 'Vishnu V',
        email: 'vishnu_v@gramconnect.org',
        mobile: '9876543205',
        password: 'Password@123',
        role: 'citizen',
        isVerified: true,
        district: 'Kollam',
        profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
      },
      {
        fullName: 'Nandana P',
        email: 'nandana_p@gramconnect.org',
        mobile: '9876543206',
        password: 'Password@123',
        role: 'citizen',
        isVerified: true,
        district: 'Alappuzha',
        profilePicture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
      }
    ];

    const seededUsers = [];
    for (const u of usersData) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create(u);
      }
      seededUsers.push(user);
    }

    // 2. Insert mock community posts
    const postsData = [
      {
        user: seededUsers[0]._id,
        caption: 'നമ്മുടെ പ്രദേശത്തെ റോഡ് പരിഹരിക്കുന്നത് പുരോഗമിക്കുന്നു. #RoadWork',
        image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600',
        likes: 23,
        comments: 5,
        status: 'Pending',
        district: 'Ernakulam',
        createdAt: new Date('2026-05-08T10:30:00Z')
      },
      {
        user: seededUsers[1]._id,
        caption: 'പരിസ്ഥിതി ദിനാചരണം ഞങ്ങളുടെ വാർഡിൽ. #Environment',
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600',
        likes: 58,
        comments: 12,
        status: 'Approved',
        district: 'Trivandrum',
        createdAt: new Date('2026-05-07T16:15:00Z')
      },
      {
        user: seededUsers[2]._id,
        caption: 'Blood donation camp this Sunday at Community Hall. Everyone welcome! #BloodDonation',
        image: 'https://images.unsplash.com/photo-1615461066841-6116ecd1258a?w=600',
        likes: 34,
        comments: 7,
        status: 'Approved',
        district: 'Kozhikode',
        createdAt: new Date('2026-05-07T09:20:00Z')
      },
      {
        user: seededUsers[3]._id,
        caption: 'ഈ ഭാഗത്തെ തെരുവ് വിളക്ക് പ്രശ്നം പരിഹരിച്ചു. #StreetLight',
        image: 'https://images.unsplash.com/photo-1509024644558-2f56ce76c490?w=600',
        likes: 41,
        comments: 9,
        status: 'Approved',
        district: 'Thrissur',
        createdAt: new Date('2026-05-06T20:45:00Z')
      },
      {
        user: seededUsers[4]._id,
        caption: 'ഈ നായയെ ആരെങ്കിലും തിരിച്ചുറിയുന്നുണ്ടോ? #Help',
        image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600',
        likes: 3,
        comments: 2,
        status: 'Rejected',
        district: 'Kollam',
        createdAt: new Date('2026-05-06T11:10:00Z')
      },
      {
        user: seededUsers[5]._id,
        caption: "Clean & Green Drive this Saturday. Let's make our village clean! #CleanGreen",
        image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600',
        likes: 11,
        comments: 1,
        status: 'Pending',
        district: 'Alappuzha',
        createdAt: new Date('2026-05-05T18:30:00Z')
      }
    ];

    await CommunityPost.insertMany(postsData);
    console.log('[DEV SEEDER] Seeded mock community posts successfully.');
  } catch (error) {
    console.error('[DEV SEEDER] Error seeding community posts:', error);
  }
};

/**
 * @desc    Get all community posts with filters, search, sorting & stats
 * @route   GET /api/admin/community/posts
 * @access  Private (Admin)
 */
const getAllCommunityPosts = asyncHandler(async (req, res) => {
  // Trigger mock seeder if empty
  await seedCommunityPostsIfEmpty();

  const { search, status, district, startDate, endDate, sortBy, myPosts } = req.query;
  const filter = {};

  if (myPosts === 'true') {
    filter.user = req.user.id;
  } else if (status && status !== 'All') {
    filter.status = status;
  }
  if (district && district !== 'All') {
    filter.district = district;
  }

  // Date Range filter
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  // Search filter (Caption or User Name)
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    
    // Find users matching search regex
    const matchedUsers = await User.find({
      fullName: { $regex: searchRegex }
    }).select('_id');
    const matchedUserIds = matchedUsers.map(u => u._id);

    filter.$or = [
      { caption: { $regex: searchRegex } },
      { user: { $in: matchedUserIds } }
    ];
  }

  // Sorting
  let sortOption = { createdAt: -1 }; // Default: Newest
  if (sortBy === 'Oldest') {
    sortOption = { createdAt: 1 };
  } else if (sortBy === 'Most Liked') {
    sortOption = { likes: -1 };
  } else if (sortBy === 'Most Commented') {
    sortOption = { comments: -1 };
  }

  // Fetch all posts with user details
  const posts = await CommunityPost.find(filter)
    .populate('user', 'fullName email mobile profilePicture district')
    .sort(sortOption);

  // Compute stats across all posts in collection
  const totalPosts = await CommunityPost.countDocuments();
  const pendingReview = await CommunityPost.countDocuments({ status: 'Pending' });
  const approvedPosts = await CommunityPost.countDocuments({ status: 'Approved' });
  const rejectedPosts = await CommunityPost.countDocuments({ status: 'Rejected' });

  res.status(200).json({
    success: true,
    count: posts.length,
    stats: {
      totalPosts,
      pendingReview,
      approvedPosts,
      rejectedPosts
    },
    posts
  });
});

/**
 * @desc    Approve community post
 * @route   PATCH /api/admin/community/posts/:id/approve
 * @access  Private (Admin)
 */
const approveCommunityPost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id).populate('user');
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  post.status = 'Approved';
  await post.save();

  // Create notifications
  await createNotification({
    recipientUser: post.user._id,
    recipientRole: 'citizen',
    title: 'Community Post Approved',
    message: `Your community post regarding "${post.caption.substring(0, 40)}..." has been approved.`,
    type: 'Success'
  });

  res.status(200).json({
    success: true,
    message: 'Post approved successfully',
    post
  });
});

/**
 * @desc    Reject community post
 * @route   PATCH /api/admin/community/posts/:id/reject
 * @access  Private (Admin)
 */
const rejectCommunityPost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id).populate('user');
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  post.status = 'Rejected';
  await post.save();

  // Create notification
  await createNotification({
    recipientUser: post.user._id,
    recipientRole: 'citizen',
    title: 'Community Post Rejected',
    message: `Your community post regarding "${post.caption.substring(0, 40)}..." was rejected due to content guidelines.`,
    type: 'Warning'
  });

  res.status(200).json({
    success: true,
    message: 'Post rejected successfully',
    post
  });
});

/**
 * @desc    Delete community post
 * @route   DELETE /api/admin/community/posts/:id
 * @access  Private (Admin)
 */
const deleteCommunityPost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  await post.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully'
  });
});

/**
 * @desc    Export community posts as CSV/Excel (.xls)
 * @route   GET /api/admin/community/posts/export
 * @access  Private (Admin)
 */
const exportCommunityPosts = asyncHandler(async (req, res) => {
  const { search, status, district, startDate, endDate, format } = req.query;
  const filter = {};

  if (status && status !== 'All') {
    filter.status = status;
  }
  if (district && district !== 'All') {
    filter.district = district;
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    const matchedUsers = await User.find({
      fullName: { $regex: searchRegex }
    }).select('_id');
    const matchedUserIds = matchedUsers.map(u => u._id);

    filter.$or = [
      { caption: { $regex: searchRegex } },
      { user: { $in: matchedUserIds } }
    ];
  }

  const posts = await CommunityPost.find(filter)
    .populate('user', 'fullName email mobile')
    .sort({ createdAt: -1 });

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '';
    const s = String(str);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headers = [
    'Post ID',
    'User Name',
    'User Email',
    'User Phone',
    'Caption',
    'District',
    'Likes',
    'Comments',
    'Status',
    'Created Date'
  ];

  let rows = [];
  rows.push(headers.join(','));

  for (const p of posts) {
    const row = [
      p._id.toString(),
      escapeCsv(p.user?.fullName || ''),
      escapeCsv(p.user?.email || ''),
      escapeCsv(p.user?.mobile || ''),
      escapeCsv(p.caption),
      escapeCsv(p.district),
      p.likes,
      p.comments,
      p.status,
      p.createdAt.toISOString()
    ];
    rows.push(row.join(','));
  }

  const csvContent = rows.join('\r\n');
  const filename = format === 'excel' ? 'community_posts_export.xls' : 'community_posts_export.csv';
  const contentType = format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.status(200).send(csvContent);
});

module.exports = {
  getAllCommunityPosts,
  approveCommunityPost,
  rejectCommunityPost,
  deleteCommunityPost,
  exportCommunityPosts
};

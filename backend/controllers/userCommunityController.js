const CommunityPost = require('../models/CommunityPost');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../utils/notificationHelper');

/**
 * @desc    Get approved posts for the feed (search, filter, sort, paginate)
 * @route   GET /api/community/posts
 * @access  Private (Citizen)
 */
const getApprovedPosts = asyncHandler(async (req, res) => {
  const { search, category, sortBy, page = 1, limit = 10, myPosts } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  const query = {};
  const andConditions = [];

  if (myPosts === 'true' || category === 'My Posts') {
    andConditions.push({ user: req.user.id });
  } else {
    andConditions.push({ status: 'Approved' });
    if (category && category !== 'All Posts') {
      andConditions.push({ category });
    }

    const userDistrict = req.user.district || '';
    const districtFilterCondition = {
      $or: [
        { isOfficial: { $ne: true } },
        {
          isOfficial: true,
          $or: [
            { districtTarget: { $exists: false } },
            { districtTarget: 'ALL' },
            { districtTarget: 'All Districts' },
            { districtTarget: userDistrict }
          ]
        }
      ]
    };

    // Admins should still see every post
    const isAdmin = req.user.role && req.user.role.toLowerCase() === 'admin';
    if (!isAdmin) {
      andConditions.push(districtFilterCondition);
    }
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    const matchedUsers = await User.find({
      fullName: { $regex: searchRegex }
    }).select('_id');
    const matchedUserIds = matchedUsers.map(u => u._id);

    andConditions.push({
      $or: [
        { caption: { $regex: searchRegex } },
        { user: { $in: matchedUserIds } }
      ]
    });
  }

  if (andConditions.length > 0) {
    query.$and = andConditions;
  }

  // Sorting options
  let sortOption = { createdAt: -1 }; // Newest
  if (sortBy === 'Oldest') {
    sortOption = { createdAt: 1 };
  } else if (sortBy === 'Most Liked') {
    sortOption = { likes: -1 };
  } else if (sortBy === 'Most Commented') {
    sortOption = { commentsCount: -1 };
  }

  // Count total matching posts
  const totalPosts = await CommunityPost.countDocuments(query);
  const totalPages = Math.ceil(totalPosts / limitNum);

  // Retrieve posts
  const posts = await CommunityPost.find(query)
    .populate('user', 'fullName email mobile profilePicture district')
    .populate('comments.user', 'fullName profilePicture email')
    .populate('comments.replies.user', 'fullName profilePicture email')
    .sort(sortOption)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    page: pageNum,
    totalPages,
    totalPosts,
    hasMore: pageNum < totalPages,
    posts
  });
});

/**
 * @desc    Create a new community post (pending moderation)
 * @route   POST /api/community/posts
 * @access  Private (Citizen)
 */
const createPost = asyncHandler(async (req, res) => {
  const { caption, category, image, images = [], video = '', visibility = 'Public', district, location, districtTarget = 'ALL' } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────
  const KERALA_DISTRICTS = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
    'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram',
    'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
  ];

  if (!caption || !caption.trim()) {
    return res.status(400).json({ success: false, message: 'Caption is required.' });
  }
  if (!category || !category.trim()) {
    return res.status(400).json({ success: false, message: 'Category is required.' });
  }

  const resolvedDistrict = (district || location || req.user.district || '').trim();
  if (!resolvedDistrict) {
    return res.status(400).json({ success: false, message: 'Location (district) is required.' });
  }
  if (!KERALA_DISTRICTS.includes(resolvedDistrict)) {
    return res.status(400).json({ success: false, message: 'Please select a valid Kerala district.' });
  }

  let imageUrl = '';
  if (req.file) {
    imageUrl = `/uploads/community/${req.file.filename}`;
  } else if (image) {
    imageUrl = image;
  }

  const userRole = req.user.role ? req.user.role.toLowerCase() : 'citizen';
  const isAdmin = ['admin', 'super_admin', 'panchayat_admin'].includes(userRole);

  const post = await CommunityPost.create({
    user: req.user.id,
    caption: caption.trim(),
    category: category.trim(),
    image: imageUrl,
    images: images.length ? images : (imageUrl ? [imageUrl] : []),
    video,
    visibility,
    district: resolvedDistrict,
    status: isAdmin ? 'Approved' : 'Pending',
    role: isAdmin ? 'admin' : 'citizen',
    isOfficial: isAdmin,
    approvedBy: isAdmin ? req.user.id : undefined,
    approvedAt: isAdmin ? new Date() : undefined,
    districtTarget
  });

  const populatedPost = await CommunityPost.findById(post._id).populate('user', 'fullName email profilePicture district');

  if (isAdmin) {
    await createNotification({
      recipientUser: null,
      recipientRole: 'citizen',
      title: 'Official Announcement',
      message: `An official update was posted by GramConnect Admin: "${caption.substring(0, 45)}..."`,
      type: 'Information',
      districtTarget
    });
  }

  res.status(201).json({
    success: true,
    message: isAdmin ? 'Official post published successfully!' : 'Post submitted successfully. It will be visible once approved by an admin.',
    post: populatedPost
  });
});

/**
 * @desc    Edit a user's own community post
 * @route   PUT /api/community/posts/:id
 * @access  Private (Citizen)
 */
const editPost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  // Verify post ownership
  if (post.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized to edit this post' });
  }

  const isAdmin = req.user.role && req.user.role.toLowerCase() === 'admin';

  // Edit their own post (only while Pending, unless admin)
  if (post.status !== 'Pending' && !isAdmin) {
    return res.status(400).json({ success: false, message: 'Post can only be edited while pending approval.' });
  }

  const { caption, category, image, images, video, visibility, district, location, districtTarget } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────
  const KERALA_DISTRICTS = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
    'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram',
    'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
  ];

  if (caption !== undefined && !caption.trim()) {
    return res.status(400).json({ success: false, message: 'Caption cannot be empty.' });
  }
  if (category !== undefined && !category.trim()) {
    return res.status(400).json({ success: false, message: 'Category cannot be empty.' });
  }
  const resolvedDistrict = district || location;
  if (resolvedDistrict !== undefined && resolvedDistrict !== null) {
    if (!resolvedDistrict.trim()) {
      return res.status(400).json({ success: false, message: 'Location (district) cannot be empty.' });
    }
    if (!KERALA_DISTRICTS.includes(resolvedDistrict.trim())) {
      return res.status(400).json({ success: false, message: 'Please select a valid Kerala district.' });
    }
  }

  let imageUrl = post.image;
  if (req.file) {
    imageUrl = `/uploads/community/${req.file.filename}`;
  } else if (image) {
    imageUrl = image;
  }

  if (caption) post.caption = caption.trim();
  if (category) post.category = category.trim();
  post.image = imageUrl;
  post.images = images && images.length ? images : [imageUrl];
  if (video !== undefined) post.video = video;
  if (visibility) post.visibility = visibility;
  if (resolvedDistrict) post.district = resolvedDistrict.trim();
  if (districtTarget && isAdmin) {
    post.districtTarget = districtTarget;
  }
  
  // Re-verify status back to pending after edit (unless admin)
  post.status = isAdmin ? 'Approved' : 'Pending';

  await post.save();

  res.status(200).json({
    success: true,
    message: 'Post updated successfully and is pending review.',
    post
  });
});

/**
 * @desc    Delete a user's own community post
 * @route   DELETE /api/community/posts/:id
 * @access  Private (Citizen)
 */
const deletePost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  // Verify ownership or Admin role
  const isAdmin = req.user.role && req.user.role.toLowerCase() === 'admin';
  if (post.user.toString() !== req.user.id && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Unauthorized to delete this post' });
  }

  await post.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully'
  });
});

/**
 * @desc    Toggle post like/unlike
 * @route   POST /api/community/posts/:id/like
 * @access  Private (Citizen)
 */
const toggleLikePost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  const likedIndex = post.likesList.indexOf(req.user.id);
  const alreadyLiked = likedIndex !== -1;

  if (alreadyLiked) {
    // Unlike post
    post.likesList.splice(likedIndex, 1);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    // Like post
    post.likesList.push(req.user.id);
    post.likes += 1;
  }

  await post.save();

  res.status(200).json({
    success: true,
    likes: post.likes,
    likesList: post.likesList,
    liked: !alreadyLiked
  });
});

/**
 * @desc    Toggle post bookmark/unbookmark
 * @route   POST /api/community/posts/:id/bookmark
 * @access  Private (Citizen)
 */
const toggleBookmarkPost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  const bookmarkIndex = post.bookmarksList.indexOf(req.user.id);
  const alreadyBookmarked = bookmarkIndex !== -1;

  if (alreadyBookmarked) {
    post.bookmarksList.splice(bookmarkIndex, 1);
  } else {
    post.bookmarksList.push(req.user.id);
  }

  await post.save();

  res.status(200).json({
    success: true,
    bookmarksList: post.bookmarksList,
    bookmarked: !alreadyBookmarked
  });
});

/**
 * @desc    Increment share count
 * @route   POST /api/community/posts/:id/share
 * @access  Private (Citizen)
 */
const incrementSharePost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  post.shares = (post.shares || 0) + 1;
  await post.save();

  res.status(200).json({
    success: true,
    shares: post.shares
  });
});

/**
 * @desc    Add a comment to a post
 * @route   POST /api/community/posts/:id/comments
 * @access  Private (Citizen)
 */
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, message: 'Comment text is required' });
  }

  const post = await CommunityPost.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  // Push new comment
  post.comments.push({
    user: req.user.id,
    text
  });

  post.commentsCount = post.comments.length;
  await post.save();

  // Retrieve post populated to get fresh comments list with populated user avatars
  const populatedPost = await CommunityPost.findById(post._id)
    .populate('comments.user', 'fullName profilePicture email')
    .populate('comments.replies.user', 'fullName profilePicture email');

  res.status(201).json({
    success: true,
    comments: populatedPost.comments,
    commentsCount: populatedPost.commentsCount
  });
});

/**
 * @desc    Delete a comment
 * @route   DELETE /api/community/posts/:id/comments/:commentId
 * @access  Private (Citizen)
 */
const deleteComment = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  const comment = post.comments.id(req.params.commentId);
  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  // Verify comment ownership (or post owner can delete comments too!)
  if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized to delete this comment' });
  }

  comment.deleteOne();
  post.commentsCount = post.comments.length;
  await post.save();

  res.status(200).json({
    success: true,
    comments: post.comments,
    commentsCount: post.commentsCount
  });
});

/**
 * @desc    Toggle comment like
 * @route   POST /api/community/posts/:id/comments/:commentId/like
 * @access  Private (Citizen)
 */
const toggleLikeComment = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  const comment = post.comments.id(req.params.commentId);
  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  const likedIndex = comment.likes.indexOf(req.user.id);
  const alreadyLiked = likedIndex !== -1;

  if (alreadyLiked) {
    comment.likes.splice(likedIndex, 1);
  } else {
    comment.likes.push(req.user.id);
  }

  await post.save();

  res.status(200).json({
    success: true,
    likes: comment.likes,
    liked: !alreadyLiked
  });
});

/**
 * @desc    Reply to a comment
 * @route   POST /api/community/posts/:id/comments/:commentId/replies
 * @access  Private (Citizen)
 */
const addCommentReply = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, message: 'Reply text is required' });
  }

  const post = await CommunityPost.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  const comment = post.comments.id(req.params.commentId);
  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  comment.replies.push({
    user: req.user.id,
    text
  });

  await post.save();

  const populatedPost = await CommunityPost.findById(post._id)
    .populate('comments.user', 'fullName profilePicture email')
    .populate('comments.replies.user', 'fullName profilePicture email');

  const updatedComment = populatedPost.comments.id(req.params.commentId);

  res.status(201).json({
    success: true,
    replies: updatedComment.replies
  });
});

/**
 * @desc    Get currently logged-in user's own posts
 * @route   GET /api/community/my-posts
 * @access  Private (Citizen)
 */
const getMyPosts = asyncHandler(async (req, res) => {
  const { search, sortBy, page = 1, limit = 5 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = { user: req.user.id };

  if (search) {
    query.caption = new RegExp(search, 'i');
  }

  let sortOption = { createdAt: -1 };
  if (sortBy === 'Oldest') {
    sortOption = { createdAt: 1 };
  } else if (sortBy === 'Most Liked') {
    sortOption = { likes: -1 };
  } else if (sortBy === 'Most Commented') {
    sortOption = { commentsCount: -1 };
  }

  const posts = await CommunityPost.find(query)
    .populate('user', 'fullName email profilePicture district')
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

  const totalPosts = await CommunityPost.countDocuments(query);

  res.status(200).json({
    success: true,
    posts,
    totalPosts,
    hasMore: skip + posts.length < totalPosts
  });
});

/**
 * @desc    Get a single community post details
 * @route   GET /api/community/post/:id
 * @access  Private (Citizen)
 */
const getSinglePost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id)
    .populate('user', 'fullName email profilePicture district')
    .populate('comments.user', 'fullName profilePicture')
    .populate('comments.replies.user', 'fullName profilePicture');

  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  res.status(200).json({
    success: true,
    post
  });
});

module.exports = {
  getApprovedPosts,
  createPost,
  editPost,
  deletePost,
  toggleLikePost,
  toggleBookmarkPost,
  incrementSharePost,
  addComment,
  deleteComment,
  toggleLikeComment,
  addCommentReply,
  getMyPosts,
  getSinglePost
};

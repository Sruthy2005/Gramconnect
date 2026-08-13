const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
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
} = require('../controllers/userCommunityController');
const {
  approveCommunityPost,
  rejectCommunityPost
} = require('../controllers/communityController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Setup Multer Storage Engine for Community posts
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/community');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(protect);

// My Posts endpoint
router.get('/my-posts', getMyPosts);

// Plural routes (posts)
router.route('/posts')
  .get(getApprovedPosts)
  .post(upload.single('image'), createPost);

router.route('/posts/:id')
  .get(getSinglePost)
  .put(upload.single('image'), editPost)
  .delete(deletePost);

router.post('/posts/:id/like', toggleLikePost);
router.post('/posts/:id/bookmark', toggleBookmarkPost);
router.post('/posts/:id/share', incrementSharePost);

// Singular routes (post)
router.route('/post/:id')
  .get(getSinglePost)
  .put(upload.single('image'), editPost)
  .delete(deletePost);

router.patch('/post/:id/approve', authorize('admin'), approveCommunityPost);
router.patch('/post/:id/reject', authorize('admin'), rejectCommunityPost);

// Root fallbacks (legacy)
router.route('/')
  .get(getApprovedPosts)
  .post(upload.single('image'), createPost);

router.route('/:id')
  .get(getSinglePost)
  .put(upload.single('image'), editPost)
  .delete(deletePost);

router.post('/:id/like', toggleLikePost);
router.post('/:id/bookmark', toggleBookmarkPost);
router.post('/:id/share', incrementSharePost);

// Comments integration (aliased for plural, singular and root formats)
const registerCommentRoutes = (prefix) => {
  router.post(`${prefix}/comments`, addComment);
  router.delete(`${prefix}/comments/:commentId`, deleteComment);
  router.post(`${prefix}/comments/:commentId/like`, toggleLikeComment);
  router.post(`${prefix}/comments/:commentId/replies`, addCommentReply);
};

registerCommentRoutes('/posts/:id');
registerCommentRoutes('/post/:id');
registerCommentRoutes('/:id');

module.exports = router;

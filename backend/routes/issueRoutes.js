const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  getDashboardStats
} = require('../controllers/issueController');
const { protect } = require('../middleware/authMiddleware');

// Setup Multer Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/issues');
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

// Enforce image MIME types validation (Requirement 13)
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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB size limit (Requirement 13)
});

// Secure all endpoints with authentication guard (Requirement 10)
router.route('/')
  .post(protect, upload.array('images', 5), createComplaint);

router.get('/my', protect, getMyComplaints);
router.get('/stats', protect, getDashboardStats);

router.route('/:id')
  .get(protect, getComplaintById)
  .put(protect, updateComplaint)
  .delete(protect, deleteComplaint);

module.exports = router;

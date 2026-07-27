const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  changePassword
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// Mount routes and secure them with token validation middleware
router.route('/')
  .get(protect, getProfile)
  .put(protect, updateProfile);

router.put('/photo', protect, updateProfilePhoto);
router.put('/change-password', protect, changePassword);

module.exports = router;

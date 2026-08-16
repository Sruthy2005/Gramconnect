const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  changePassword,
  getSettings,
  updateSettings,
  deleteAccount
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// Mount routes and secure them with token validation middleware
router.route('/')
  .get(protect, getProfile)
  .put(protect, updateProfile)
  .delete(protect, deleteAccount);

router.put('/photo', protect, updateProfilePhoto);
router.put('/change-password', protect, changePassword);

router.route('/settings')
  .get(protect, getSettings)
  .put(protect, updateSettings);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllComplaints,
  getComplaintDetails,
  updateComplaintAdmin,
  deleteComplaintAdmin,
  exportComplaintsAdmin
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const adminGuard = [protect, authorize('Admin', 'admin')];

router.get('/stats', adminGuard, getAdminStats);

router.route('/complaints')
  .get(adminGuard, getAllComplaints);

router.get('/complaints/export', adminGuard, exportComplaintsAdmin);

router.route('/complaints/:id')
  .get(adminGuard, getComplaintDetails)
  .put(adminGuard, updateComplaintAdmin)
  .delete(adminGuard, deleteComplaintAdmin);

module.exports = router;

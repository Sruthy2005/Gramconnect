const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const {
  getAllCommunityPosts,
  approveCommunityPost,
  rejectCommunityPost,
  deleteCommunityPost,
  exportCommunityPosts
} = require('../controllers/communityController');
const { protect, authorize } = require('../middleware/authMiddleware');

const {
  getPanchayats,
  getPanchayatById,
  createPanchayat,
  updatePanchayat,
  updatePanchayatStatus,
  deletePanchayat,
  getPotentialAdmins,
  getPanchayatCode
} = require('../controllers/panchayatController');

const adminGuard = [protect, authorize('Admin', 'admin', 'SUPER_ADMIN', 'super_admin', 'PANCHAYAT_ADMIN', 'panchayat_admin')];
const superAdminGuard = [protect, authorize('SUPER_ADMIN', 'super_admin', 'Admin', 'admin')];

router.get('/stats', adminGuard, getAdminStats);

router.route('/complaints')
  .get(adminGuard, getAllComplaints);

router.get('/complaints/export', adminGuard, exportComplaintsAdmin);

router.route('/complaints/:id')
  .get(adminGuard, getComplaintDetails)
  .put(adminGuard, updateComplaintAdmin)
  .delete(adminGuard, deleteComplaintAdmin);

// Users Routing
router.get('/users/export', adminGuard, exportUsers);

router.route('/users')
  .get(adminGuard, getAllUsers);

router.route('/users/:id')
  .get(adminGuard, getUserDetails)
  .patch(adminGuard, updateUser)
  .delete(adminGuard, deleteUser);

router.patch('/users/:id/block', adminGuard, blockUser);
router.patch('/users/:id/unblock', adminGuard, unblockUser);
router.patch('/users/:id/reset-password', adminGuard, resetUserPassword);

// Community Posts Routing
router.get('/community/posts', adminGuard, getAllCommunityPosts);
router.get('/community/posts/export', adminGuard, exportCommunityPosts);
router.patch('/community/posts/:id/approve', adminGuard, approveCommunityPost);
router.patch('/community/posts/:id/reject', adminGuard, rejectCommunityPost);
router.delete('/community/posts/:id', adminGuard, deleteCommunityPost);

// Panchayat Management Routing (existing - panchayat entity CRUD)
router.route('/panchayats')
  .get(superAdminGuard, getPanchayats)
  .post(superAdminGuard, createPanchayat);

router.get('/panchayats/admins/potential', superAdminGuard, getPotentialAdmins);

// Auto-generate/lookup panchayat code (must be BEFORE /:id to avoid route conflict)
router.get('/panchayats/code', superAdminGuard, getPanchayatCode);

router.route('/panchayats/:id')
  .get(superAdminGuard, getPanchayatById)
  .put(superAdminGuard, updatePanchayat)
  .delete(superAdminGuard, deletePanchayat);

router.patch('/panchayats/:id/status', superAdminGuard, updatePanchayatStatus);

// Panchayat Admin User Management Routing (new)
// Stats scoped to panchayat admin's own area (accessible by panchayat_admin too)
router.get('/panchayat-admin/stats', adminGuard, getPanchayatAdminDashboardStats);

// CRUD for managing panchayat admins (main admin only)
router.route('/panchayat-admins')
  .get(superAdminGuard, getPanchayatAdmins)
  .post(superAdminGuard, createPanchayatAdmin);

router.route('/panchayat-admins/:id')
  .put(superAdminGuard, updatePanchayatAdmin)
  .delete(superAdminGuard, deletePanchayatAdmin);

router.patch('/panchayat-admins/:id/status', superAdminGuard, togglePanchayatAdminStatus);

module.exports = router;

const Panchayat = require('../models/Panchayat');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all panchayats with filters and summary stats
// @route   GET /api/admin/panchayats
// @access  Private (Super Admin)
const getPanchayats = asyncHandler(async (req, res) => {
  const { search, district, status } = req.query;

  const filter = { isDeleted: { $ne: true } };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { panchayatCode: { $regex: search, $options: 'i' } },
      { district: { $regex: search, $options: 'i' } },
      { block: { $regex: search, $options: 'i' } }
    ];
  }

  if (district) {
    filter.district = district;
  }

  if (status) {
    filter.status = status;
  }

  const panchayats = await Panchayat.find(filter)
    .populate('adminId', 'fullName email mobile')
    .sort({ createdAt: -1 });

  // Calculate summary counts (Total, Active, Inactive) based on all non-deleted Panchayats
  const total = await Panchayat.countDocuments({ isDeleted: { $ne: true } });
  const active = await Panchayat.countDocuments({ isDeleted: { $ne: true }, status: 'Active' });
  const inactive = await Panchayat.countDocuments({ isDeleted: { $ne: true }, status: 'Inactive' });

  res.status(200).json({
    success: true,
    panchayats,
    stats: { total, active, inactive }
  });
});

// @desc    Get single panchayat details
// @route   GET /api/admin/panchayats/:id
// @access  Private (Super Admin)
const getPanchayatById = asyncHandler(async (req, res) => {
  const panchayat = await Panchayat.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
    .populate('adminId', 'fullName email mobile');

  if (!panchayat) {
    return res.status(404).json({ message: 'Panchayat not found' });
  }

  res.status(200).json({
    success: true,
    panchayat
  });
});

// @desc    Create a new panchayat
// @route   POST /api/admin/panchayats
// @access  Private (Super Admin)
const createPanchayat = asyncHandler(async (req, res) => {
  const {
    name,
    district,
    block,
    address,
    contactNumber,
    email,
    status,
    adminAssignmentMode, // 'existing' or 'new'
    assignedAdminId,
    adminName,
    adminEmail,
    password,
    confirmPassword,
    adminPhone
  } = req.body;

  if (!name || !district) {
    return res.status(400).json({ message: 'Please provide Panchayat Name and District' });
  }

  let finalAdminId = null;

  if (adminAssignmentMode === 'new') {
    if (!adminName || !adminEmail || !password) {
      return res.status(400).json({ message: 'Please provide administrator name, email, and password' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    const emailExists = await User.findOne({ email: adminEmail.toLowerCase(), isDeleted: { $ne: true } });
    if (emailExists) {
      return res.status(400).json({ message: 'Administrator email already registered in system' });
    }

    const newAdmin = await User.create({
      fullName: adminName,
      email: adminEmail,
      mobile: adminPhone || '9999999999',
      password,
      role: 'PANCHAYAT_ADMIN',
      isVerified: true
    });
    finalAdminId = newAdmin._id;
  } else if (adminAssignmentMode === 'existing' && assignedAdminId) {
    finalAdminId = assignedAdminId;
  }

  const panchayat = await Panchayat.create({
    name,
    state: req.body.state || 'Kerala',
    district,
    block: block || '',
    pinCode: req.body.pinCode || '',
    address: address || '',
    contactNumber: contactNumber || '',
    email: email || '',
    status: status || 'Active',
    adminId: finalAdminId
  });

  if (finalAdminId) {
    await User.findByIdAndUpdate(finalAdminId, {
      role: 'PANCHAYAT_ADMIN',
      panchayatId: panchayat._id
    });
  }

  res.status(201).json({
    success: true,
    panchayat
  });
});

// @desc    Update panchayat details
// @route   PUT /api/admin/panchayats/:id
// @access  Private (Super Admin)
const updatePanchayat = asyncHandler(async (req, res) => {
  const {
    name,
    district,
    block,
    address,
    contactNumber,
    email,
    status,
    adminAssignmentMode, // 'existing', 'new', or 'keep'
    assignedAdminId,
    adminName,
    adminEmail,
    password,
    confirmPassword,
    adminPhone
  } = req.body;

  const panchayat = await Panchayat.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!panchayat) {
    return res.status(404).json({ message: 'Panchayat not found' });
  }



  panchayat.name = name || panchayat.name;
  panchayat.state = req.body.state || panchayat.state || 'Kerala';
  panchayat.district = district || panchayat.district;
  panchayat.block = block !== undefined ? block : panchayat.block;
  panchayat.pinCode = req.body.pinCode !== undefined ? req.body.pinCode : panchayat.pinCode;
  panchayat.address = address !== undefined ? address : panchayat.address;
  panchayat.contactNumber = contactNumber !== undefined ? contactNumber : panchayat.contactNumber;
  panchayat.email = email !== undefined ? email : panchayat.email;
  panchayat.status = status || panchayat.status;

  const oldAdminId = panchayat.adminId;
  let newAdminId = oldAdminId;

  if (adminAssignmentMode === 'new') {
    if (!adminName || !adminEmail || !password) {
      return res.status(400).json({ message: 'Please provide administrator name, email, and password' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    const emailExists = await User.findOne({ email: adminEmail.toLowerCase(), isDeleted: { $ne: true } });
    if (emailExists) {
      return res.status(400).json({ message: 'Administrator email already registered in system' });
    }

    const newAdmin = await User.create({
      fullName: adminName,
      email: adminEmail,
      mobile: adminPhone || '9999999999',
      password,
      role: 'PANCHAYAT_ADMIN',
      isVerified: true
    });
    newAdminId = newAdmin._id;
  } else if (adminAssignmentMode === 'existing' && assignedAdminId) {
    newAdminId = assignedAdminId;
  }

  // If admin has changed
  if (newAdminId && newAdminId.toString() !== (oldAdminId ? oldAdminId.toString() : '')) {
    // Clear old admin
    if (oldAdminId) {
      await User.findByIdAndUpdate(oldAdminId, {
        panchayatId: null,
        role: 'Citizen'
      });
    }
    // Update new admin
    await User.findByIdAndUpdate(newAdminId, {
      role: 'PANCHAYAT_ADMIN',
      panchayatId: panchayat._id
    });
    panchayat.adminId = newAdminId;
  }

  await panchayat.save();

  res.status(200).json({
    success: true,
    panchayat
  });
});

// @desc    Update status of panchayat
// @route   PATCH /api/admin/panchayats/:id/status
// @access  Private (Super Admin)
const updatePanchayatStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!status || !['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ message: 'Valid status is required' });
  }

  const panchayat = await Panchayat.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!panchayat) {
    return res.status(404).json({ message: 'Panchayat not found' });
  }

  panchayat.status = status;
  await panchayat.save();

  res.status(200).json({
    success: true,
    panchayat
  });
});

// @desc    Soft delete panchayat
// @route   DELETE /api/admin/panchayats/:id
// @access  Private (Super Admin)
const deletePanchayat = asyncHandler(async (req, res) => {
  const panchayat = await Panchayat.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!panchayat) {
    return res.status(404).json({ message: 'Panchayat not found' });
  }

  panchayat.isDeleted = true;
  await panchayat.save();

  if (panchayat.adminId) {
    await User.findByIdAndUpdate(panchayat.adminId, {
      panchayatId: null,
      role: 'Citizen'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Panchayat soft-deleted successfully'
  });
});

// @desc    Get potential non-super admin users to select as Panchayat Admin
// @route   GET /api/admin/panchayats/admins/potential
// @access  Private (Super Admin)
const getPotentialAdmins = asyncHandler(async (req, res) => {
  const users = await User.find({
    role: { $nin: ['SUPER_ADMIN', 'super_admin'] },
    isDeleted: { $ne: true }
  })
    .select('fullName email role')
    .sort({ fullName: 1 });

  res.status(200).json({
    success: true,
    users
  });
});

module.exports = {
  getPanchayats,
  getPanchayatById,
  createPanchayat,
  updatePanchayat,
  updatePanchayatStatus,
  deletePanchayat,
  getPotentialAdmins
};

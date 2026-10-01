const LostFoundItem = require('../models/LostFoundItem');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all lost and found items
// @route   GET /api/lost-found
// @access  Private
const getAllItems = asyncHandler(async (req, res) => {
  const { search, type, status } = req.query;
  const filter = {};

  if (type && type !== 'All') {
    filter.type = type;
  }
  if (status && status !== 'All') {
    filter.status = status;
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { itemName: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
      { location: { $regex: searchRegex } }
    ];
  }

  const items = await LostFoundItem.find(filter)
    .populate('user', 'fullName email mobile profilePicture')
    .populate('foundBy', 'fullName email mobile profilePicture')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: items.length,
    items
  });
});

// @desc    Get single item details
// @route   GET /api/lost-found/:id
// @access  Private
const getItemById = asyncHandler(async (req, res) => {
  const item = await LostFoundItem.findById(req.params.id)
    .populate('user', 'fullName email mobile profilePicture')
    .populate('foundBy', 'fullName email mobile profilePicture');

  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  res.status(200).json({
    success: true,
    item
  });
});

// @desc    Create a lost or found report
// @route   POST /api/lost-found
// @access  Private
const createItem = asyncHandler(async (req, res) => {
  const { type, itemName, description, category, location, date, contactInformation } = req.body;

  // ── Per-field validation ────────────────────────────────────────────────
  const phoneRegex = /^[+]?[\d\s\-().]{7,15}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const VALID_TYPES = ['Lost', 'Found', 'lost', 'found'];
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ success: false, message: 'Report Type must be Lost or Found.' });
  }
  if (!itemName || !itemName.trim()) {
    return res.status(400).json({ success: false, message: 'Item Name is required.' });
  }
  if (!category || !category.trim()) {
    return res.status(400).json({ success: false, message: 'Category is required.' });
  }
  if (!description || !description.trim()) {
    return res.status(400).json({ success: false, message: 'Description is required.' });
  }
  if (!location || !location.trim()) {
    return res.status(400).json({ success: false, message: 'Location is required.' });
  }
  if (location.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Please provide a more specific location.' });
  }
  if (!date) {
    return res.status(400).json({ success: false, message: 'Date is required.' });
  }
  const todayStr = new Date().toISOString().split('T')[0];
  if (date > todayStr) {
    return res.status(400).json({ success: false, message: 'Date cannot be in the future.' });
  }
  if (!contactInformation || !contactInformation.trim()) {
    return res.status(400).json({ success: false, message: 'Contact Information is required.' });
  }
  const contact = contactInformation.trim();
  if (!phoneRegex.test(contact) && !emailRegex.test(contact)) {
    return res.status(400).json({ success: false, message: 'Contact Information must be a valid phone number or email address.' });
  }

  let imageUrl = '';
  if (req.file) {
    imageUrl = `/uploads/lost-found/${req.file.filename}`;
  }

  // Normalize type casing (lost/found -> Lost/Found) to match model schema
  let normalizedType = type;
  const typeLower = type.toLowerCase();
  if (typeLower === 'lost') normalizedType = 'Lost';
  if (typeLower === 'found') normalizedType = 'Found';

  const initialStatus = normalizedType === 'Found' ? 'FOUND' : 'LOST';

  const item = await LostFoundItem.create({
    user: req.user._id,
    type: normalizedType,
    itemName: itemName.trim(),
    description: description.trim(),
    category: category.trim(),
    location: location.trim(),
    date,
    contactInformation: contact,
    image: imageUrl,
    status: initialStatus
  });

  const populatedItem = await LostFoundItem.findById(item._id)
    .populate('user', 'fullName email mobile profilePicture');

  res.status(201).json({
    success: true,
    message: 'Report created successfully',
    item: populatedItem
  });
});

// @desc    Update item status (e.g. resolve or reopen)
// @route   PUT /api/lost-found/:id
// @access  Private
const updateItem = asyncHandler(async (req, res) => {
  const item = await LostFoundItem.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  // Allow admin or the owner to update status
  const isAdmin = req.user.role && ['admin', 'super_admin', 'panchayat_admin'].includes(req.user.role.toLowerCase());
  const isOwner = item.user.toString() === req.user.id;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ success: false, message: 'Unauthorized to update this item' });
  }

  const { status } = req.body;
  if (status) {
    item.status = status;
  }

  await item.save();

  const populatedItem = await LostFoundItem.findById(item._id)
    .populate('user', 'fullName email mobile profilePicture');

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    item: populatedItem
  });
});

// @desc    Delete item report
// @route   DELETE /api/lost-found/:id
// @access  Private
const deleteItem = asyncHandler(async (req, res) => {
  const item = await LostFoundItem.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  const isAdmin = req.user.role && ['admin', 'super_admin', 'panchayat_admin'].includes(req.user.role.toLowerCase());
  const isOwner = item.user.toString() === req.user.id;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ success: false, message: 'Unauthorized to delete this item' });
  }

  await item.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Report deleted successfully'
  });
});

// @desc    Mark a lost item as found
// @route   POST /api/lost-found/:id/found
// @access  Private
const markAsFound = asyncHandler(async (req, res) => {
  const item = await LostFoundItem.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  // Prevent original owner from marking their own item as found
  if (item.user.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'As the owner, you cannot mark your own item as found. Another user must do this.' });
  }

  item.status = 'FOUND';
  item.foundBy = req.user._id;
  item.foundAt = new Date();

  await item.save();

  const populatedItem = await LostFoundItem.findById(item._id)
    .populate('user', 'fullName email mobile profilePicture')
    .populate('foundBy', 'fullName email mobile profilePicture');

  res.status(200).json({
    success: true,
    message: 'Item reported as found successfully',
    item: populatedItem
  });
});

// @desc    Confirm item has been returned to owner
// @route   POST /api/lost-found/:id/returned
// @access  Private
const confirmReturned = asyncHandler(async (req, res) => {
  const item = await LostFoundItem.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  // Ensure only the original owner can confirm receipt
  if (item.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the original owner can confirm that this item was received' });
  }

  item.status = 'RETURNED';
  item.returnedAt = new Date();

  await item.save();

  const populatedItem = await LostFoundItem.findById(item._id)
    .populate('user', 'fullName email mobile profilePicture')
    .populate('foundBy', 'fullName email mobile profilePicture');

  res.status(200).json({
    success: true,
    message: 'Item recovery confirmed by owner',
    item: populatedItem
  });
});

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  markAsFound,
  confirmReturned
};

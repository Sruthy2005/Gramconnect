const keralaLocations = require('../data/keralaLocations');

// @desc    Get all districts of Kerala
// @route   GET /api/location/districts
// @access  Public
const getDistricts = (req, res) => {
  try {
    const districts = Object.keys(keralaLocations.districts);
    res.status(200).json({
      success: true,
      state: keralaLocations.state,
      districts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load locations. Please try again.' });
  }
};

// @desc    Get blocks of a specific district
// @route   GET /api/location/blocks
// @access  Public
const getBlocks = (req, res) => {
  try {
    const { district } = req.query;
    if (!district) {
      return res.status(400).json({ success: false, message: 'District parameter is required' });
    }

    const blocks = keralaLocations.districts[district];
    if (!blocks) {
      return res.status(404).json({ success: false, message: `District '${district}' not found` });
    }

    res.status(200).json({
      success: true,
      district,
      blocks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load locations. Please try again.' });
  }
};

// @desc    Get Grama Panchayats of a specific block
// @route   GET /api/location/panchayats
// @access  Public
const getPanchayats = (req, res) => {
  try {
    const { block } = req.query;
    if (!block) {
      return res.status(400).json({ success: false, message: 'Block parameter is required' });
    }

    let list = keralaLocations.panchayats[block];
    if (!list) {
      list = []; // Clean empty list, no mock fallback values
    }

    res.status(200).json({
      success: true,
      block,
      panchayats: list
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load Panchayats. Please try again.' });
  }
};

// @desc    Get PIN code for a specific Panchayat
// @route   GET /api/location/pincode
// @access  Public
const getPinCode = (req, res) => {
  try {
    const { block, panchayat } = req.query;
    if (!block || !panchayat) {
      return res.status(400).json({ success: false, message: 'Block and Panchayat parameters are required' });
    }

    let list = keralaLocations.panchayats[block];
    if (!list) {
      list = [];
    }

    const match = list.find(p => p.name === panchayat);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Panchayat location details not found' });
    }

    res.status(200).json({
      success: true,
      panchayat: match.name,
      pinCode: match.pinCodes[0],
      pinCodes: match.pinCodes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch PIN code for this Panchayat.' });
  }
};

module.exports = {
  getDistricts,
  getBlocks,
  getPanchayats,
  getPinCode
};

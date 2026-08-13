const express = require('express');
const router = express.Router();
const { 
  getDistricts, 
  getBlocks,
  getPanchayats,
  getPinCode
} = require('../controllers/locationController');

router.get('/districts', getDistricts);
router.get('/blocks', getBlocks);
router.get('/panchayats', getPanchayats);
router.get('/pincode', getPinCode);

module.exports = router;

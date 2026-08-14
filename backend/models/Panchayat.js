const mongoose = require('mongoose');

const panchayatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a Panchayat name'],
      trim: true
    },

    state: {
      type: String,
      default: 'Kerala',
      trim: true
    },
    district: {
      type: String,
      required: [true, 'Please add a district'],
      trim: true
    },
    block: {
      type: String,
      default: '',
      trim: true
    },
    pinCode: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      default: '',
      trim: true
    },
    contactNumber: {
      type: String,
      default: '',
      trim: true
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    panchayatCode: {
      type: String,
      default: '',
      trim: true,
      // sparse unique: only enforced when a value is present
      index: { sparse: true }
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Panchayat', panchayatSchema);

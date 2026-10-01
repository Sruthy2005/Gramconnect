const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    panchayatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Panchayat',
      default: null
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      minlength: [20, 'Description must be at least 20 characters']
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Road Damage',
        'Garbage/Waste',
        'Garbage',
        'Drainage',
        'Water Leakage',
        'Water Supply',
        'Streetlight',
        'Street Light',
        'Electricity',
        'Public Safety',
        'Traffic',
        'Environment',
        'Other'
      ]
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    district: {
      type: String,
      required: [true, 'District is required']
    },
    taluk: {
      type: String,
      required: [true, 'Taluk is required']
    },
    localBodyType: {
      type: String,
      required: [true, 'Local Body Type is required']
    },
    localBody: {
      type: String,
      required: [true, 'Local Body is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    ward: {
      type: String,
      default: ''
    },
    landmark: {
      type: String,
      default: ''
    },
    pincode: {
      type: String,
      required: [true, 'PIN Code is required']
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required']
    },
    images: {
      type: [String],
      default: []
    },
    anonymous: {
      type: Boolean,
      default: false
    },
    urgent: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['Pending', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending'
    },
    assignedDepartment: {
      type: String,
      default: 'Not Assigned'
    },
    assignedOfficer: {
      type: String,
      default: ''
    },
    dueDate: {
      type: String,
      default: ''
    },
    priority: {
      type: String,
      required: [true, 'Priority level is required'],
      enum: ['Normal', 'Medium', 'High', 'Urgent'],
      default: 'Normal'
    },
    aiCategory: {
      type: String,
      default: ''
    },
    aiConfidence: {
      type: Number,
      default: 0
    },
    aiSeverity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low'
    },
    isDuplicate: {
      type: Boolean,
      default: false
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null
    },
    duplicateConfidence: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Complaint', complaintSchema);

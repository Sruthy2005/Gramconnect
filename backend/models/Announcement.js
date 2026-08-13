const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true
    },
    category: {
      type: String,
      enum: ['General', 'Public Notice', 'Emergency', 'Road & Transport', 'Water', 'Electricity', 'Health', 'Community', 'Other'],
      required: [true, 'Please select a category']
    },
    priority: {
      type: String,
      enum: ['Normal', 'Important', 'Urgent'],
      default: 'Normal'
    },
    district: {
      type: String,
      default: 'All'
    },
    panchayat: {
      type: String,
      default: 'All'
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    publishDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date
    },
    attachment: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Active', 'Archived'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Announcement', announcementSchema);

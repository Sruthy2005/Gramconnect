const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Optional, can be null for admin-wide or broadcast notifications
    },
    recipientRole: {
      type: String,
      enum: ['Citizen', 'Admin', 'citizen', 'admin'],
      default: 'citizen'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['Success', 'Warning', 'Information', 'Error'],
      default: 'Information'
    },
    relatedComplaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: false
    },
    relatedAnnouncement: {
      type: String,
      required: false
    },
    isRead: {
      type: Boolean,
      default: false
    },
    districtTarget: {
      type: String,
      default: 'ALL'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', notificationSchema);

const mongoose = require('mongoose');

const lostFoundItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['Lost', 'Found'],
      required: [true, 'Please specify whether the item is Lost or Found']
    },
    itemName: {
      type: String,
      required: [true, 'Please add the item name'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true
    },
    category: {
      type: String,
      enum: ['Documents', 'Mobile / Electronics', 'Keys', 'Wallet / Purse', 'Jewellery', 'Pets', 'Other'],
      required: [true, 'Please select a category']
    },
    location: {
      type: String,
      required: [true, 'Please specify the location']
    },
    date: {
      type: Date,
      required: [true, 'Please specify the date']
    },
    image: {
      type: String,
      default: ''
    },
    contactInformation: {
      type: String,
      required: [true, 'Please add contact information']
    },
    status: {
      type: String,
      enum: ['LOST', 'FOUND', 'RETURNED', 'Active', 'Resolved'],
      default: 'LOST'
    },
    foundBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    foundAt: {
      type: Date
    },
    returnedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('LostFoundItem', lostFoundItemSchema);

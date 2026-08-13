const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Please add comment text'],
    trim: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const communityPostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    caption: {
      type: String,
      required: [true, 'Please add a caption'],
      trim: true
    },
    image: {
      type: String,
      required: [true, 'Please add a main image URL'],
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    video: {
      type: String,
      default: ''
    },
    likes: {
      type: Number,
      default: 0
    },
    likesList: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    bookmarksList: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    commentsCount: {
      type: Number,
      default: 0
    },
    comments: [commentSchema],
    shares: {
      type: Number,
      default: 0
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      default: 'Ernakulam'
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      default: 'General'
    },
    visibility: {
      type: String,
      enum: ['Public', 'Community Only'],
      default: 'Public'
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    role: {
      type: String,
      enum: ['citizen', 'admin'],
      default: 'citizen'
    },
    isOfficial: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    districtTarget: {
      type: String,
      default: 'ALL'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for userId
communityPostSchema.virtual('userId').get(function() {
  return this.user;
});

// Virtual for fullName
communityPostSchema.virtual('fullName').get(function() {
  return this.user && typeof this.user === 'object' ? this.user.fullName : '';
});

// Virtual for profileImage
communityPostSchema.virtual('profileImage').get(function() {
  return this.user && typeof this.user === 'object' ? this.user.profilePicture : '';
});

// Virtual for location
communityPostSchema.virtual('location').get(function() {
  return this.district;
});

module.exports = mongoose.model('CommunityPost', communityPostSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please add a full name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please add an email address'],
      unique: true,
      lowercase: true,
      trim: true
    },
    mobile: {
      type: String,
      required: [
        function() {
          return this.authProvider !== 'google';
        },
        'Please add a mobile number'
      ]
    },
    password: {
      type: String,
      required: [
        function() {
          return this.authProvider !== 'google';
        },
        'Please add a password'
      ],
      minlength: [8, 'Password must be at least 8 characters']
    },
    role: {
      type: String,
      enum: ['Citizen', 'Admin', 'citizen', 'admin', 'SUPER_ADMIN', 'super_admin', 'PANCHAYAT_ADMIN', 'panchayat_admin'],
      default: 'citizen'
    },
    panchayatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Panchayat',
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    profilePicture: {
      type: String
    },
    address: {
      type: String,
      default: ''
    },
    houseName: {
      type: String,
      default: ''
    },
    street: {
      type: String,
      default: ''
    },
    landmark: {
      type: String,
      default: ''
    },
    pinCode: {
      type: String,
      default: ''
    },
    district: {
      type: String,
      default: ''
    },
    panchayat: {
      type: String,
      default: ''
    },
    ward: {
      type: String,
      default: ''
    },
    localBody: {
      type: String,
      default: ''
    },
    localBodyType: {
      type: String,
      default: ''
    },
    panchayatCode: {
      type: String,
      default: ''
    },
    googleId: {
      type: String
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    status: {
      type: String,
      enum: ['Active', 'Blocked', 'active', 'blocked'],
      default: 'Active'
    },
    blockedReason: {
      type: String,
      default: ''
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordResetOtp: String,
    passwordResetOtpExpires: Date,
    notificationPreferences: {
      complaintUpdates: {
        type: Boolean,
        default: true
      },
      announcements: {
        type: Boolean,
        default: true
      },
      communityNotifs: {
        type: Boolean,
        default: true
      },
      emailNotifs: {
        type: Boolean,
        default: true
      }
    },
    privacySettings: {
      profilePublic: {
        type: Boolean,
        default: true
      },
      communityVisible: {
        type: Boolean,
        default: true
      }
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  if (!this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password hashes
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;

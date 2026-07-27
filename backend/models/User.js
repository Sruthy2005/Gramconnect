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
      enum: ['Citizen', 'Admin', 'citizen', 'admin'],
      default: 'citizen'
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
    googleId: {
      type: String
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordResetOtp: String,
    passwordResetOtpExpires: Date
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

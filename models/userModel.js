const crypto = require('crypto')
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const catchAsyncError = require('../utils/catchAsyncError');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must have a Name!'],
  },
  email: {
    type: String,
    required: [true, 'User must have a email!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide a password'],
    validate: {
      // Works only when we create a new person object not if we update the same object
      validator: function (pass) {
        return pass === this.password;
      },
    },
    message: 'Password must be same',
  },
    passwordChangedAt: Date,
    role: {
        type: String,
        enum: ['user', 'guide', 'admin'],
        default: 'user',
        // select: false
    },
    passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
    
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;
  }
  next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    // Sometimes database is slow so we here write in database and if someone wants to change password again they could even though writes are slower
    this.passwordChangedAt = Date.now() - 1000;
    next();

})

userSchema.pre('/^find/', function (next) {
  this.find({ active: { $ne: false } });
  next();
})

// Cannot wrap in catchAsync as it will not be able to return something
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return changedAt > JWTTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;

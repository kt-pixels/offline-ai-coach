const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: null
    },
    age: {
      type: Number,
      default: null
    },
    height: {
      type: Number,
      default: null
    },
    weight: {
      type: Number,
      default: null
    },
    goalWeight: {
      type: Number,
      default: null
    },
    dietPreference: {
      type: String,
      enum: ['vegetarian', 'vegan', 'eggetarian', 'non-vegetarian'],
      default: null
    },
    budget: {
      type: Number,
      default: null
    },
    fitnessLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: null
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    caloriePlan: {
      bmr: { type: Number, default: null },
      maintenanceCalories: { type: Number, default: null },
      calorieAdjustment: { type: Number, default: null },
      dailyCalorieGoal: { type: Number, default: null }
    },
    points: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

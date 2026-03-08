const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    age: {
      type: Number,
      required: true,
      min: 10,
      max: 100
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female', 'other']
    },
    heightCm: {
      type: Number,
      required: true,
      min: 100,
      max: 260
    },
    currentWeightKg: {
      type: Number,
      required: true,
      min: 25,
      max: 300
    },
    targetWeightKg: {
      type: Number,
      required: true,
      min: 25,
      max: 350
    },
    initialWeightKg: {
      type: Number,
      required: true,
      min: 25,
      max: 350
    },
    dietPreference: {
      type: String,
      required: true,
      enum: ['vegetarian', 'vegan', 'eggetarian', 'non-vegetarian']
    },
    goalSetting: {
      type: String,
      required: true,
      enum: ['weight_gain', 'muscle_gain', 'weight_loss']
    },
    timelinePreference: {
      type: String,
      required: true,
      enum: ['aggressive', 'moderate', 'slow']
    },
    lifestyle: {
      activityLevel: {
        type: String,
        required: true,
        enum: ['sedentary', 'light', 'moderate', 'high', 'athlete']
      },
      workoutDaysPerWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 7
      },
      sleepTime: {
        type: String,
        required: true
      },
      mealFrequency: {
        type: Number,
        required: true,
        min: 3,
        max: 6
      }
    },
    dailySchedule: {
      breakfastTime: { type: String, required: true },
      snackTime: { type: String, required: true },
      lunchTime: { type: String, required: true },
      eveningSnackTime: { type: String, required: true },
      dinnerTime: { type: String, required: true }
    },
    caloriePlan: {
      bmr: { type: Number, required: true },
      maintenanceCalories: { type: Number, required: true },
      calorieAdjustment: { type: Number, required: true },
      dailyCalorieGoal: { type: Number, required: true },
      weeklyWeightTargetKg: { type: Number, required: true }
    },
    mealTargets: [
      {
        mealType: {
          type: String,
          enum: ['breakfast', 'mid_morning_snack', 'lunch', 'evening_snack', 'dinner']
        },
        targetCalories: Number
      }
    ],
    onboardingCompleted: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);

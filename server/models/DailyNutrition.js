const mongoose = require('mongoose');

const dailyNutritionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    calorieTarget: {
      type: Number,
      required: true
    },
    caloriesConsumed: {
      type: Number,
      default: 0
    },
    proteinConsumed: {
      type: Number,
      default: 0
    },
    carbsConsumed: {
      type: Number,
      default: 0
    },
    fatConsumed: {
      type: Number,
      default: 0
    },
    calorieDelta: {
      type: Number,
      default: 0
    },
    mealDistribution: [
      {
        mealType: {
          type: String,
          enum: ['breakfast', 'mid_morning_snack', 'lunch', 'evening_snack', 'dinner']
        },
        scheduledTime: String,
        targetCalories: Number,
        consumedCalories: {
          type: Number,
          default: 0
        },
        remainingCalories: {
          type: Number,
          default: 0
        }
      }
    ],
    alerts: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

dailyNutritionSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyNutrition', dailyNutritionSchema);

const mongoose = require('mongoose');

const mealEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    mealType: {
      type: String,
      required: true,
      enum: ['breakfast', 'mid_morning_snack', 'lunch', 'evening_snack', 'dinner'],
    },
    food: {
      foodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodDatabase',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
    },
    grams: {
      type: Number,
      required: true,
      min: 1,
      max: 3000,
    },
    calories: {
      type: Number,
      required: true,
    },
    protein: {
      type: Number,
      required: true,
    },
    carbs: {
      type: Number,
      required: true,
    },
    fat: {
      type: Number,
      required: true,
    },
    cost: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

mealEntrySchema.index({ user: 1, date: 1, mealType: 1 });

module.exports = mongoose.model('MealEntry', mealEntrySchema);

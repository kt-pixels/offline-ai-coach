const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    calories: {
      type: Number,
      default: 0
    },
    protein: {
      type: Number,
      default: 0
    },
    carbs: {
      type: Number,
      default: 0
    },
    fats: {
      type: Number,
      default: 0
    },
    cost: {
      type: Number,
      default: 0
    },
    isVegetarian: {
      type: Boolean,
      default: true
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MealLog', mealLogSchema);

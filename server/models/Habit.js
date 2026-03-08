const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['discipline', 'workout', 'nutrition', 'sleep', 'productivity'],
      default: 'discipline'
    },
    targetPerDay: {
      type: Number,
      default: 1
    },
    completionDates: {
      type: [Date],
      default: []
    },
    streak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastCompletedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Habit', habitSchema);

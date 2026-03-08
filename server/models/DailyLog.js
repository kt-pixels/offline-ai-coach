const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    weight: {
      type: Number,
      default: 0
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
    sleepHours: {
      type: Number,
      default: 0
    },
    workoutDone: {
      type: Boolean,
      default: false
    },
    workoutDuration: {
      type: Number,
      default: 0
    },
    tasksPlanned: {
      type: Number,
      default: 0
    },
    tasksCompleted: {
      type: Number,
      default: 0
    },
    habitsTarget: {
      type: Number,
      default: 0
    },
    habitsCompleted: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);

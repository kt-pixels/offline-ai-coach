const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    duration: {
      type: Number,
      default: 30
    },
    intensity: {
      type: Number,
      default: 5
    },
    focus: {
      type: String,
      default: 'full-body'
    },
    completed: {
      type: Boolean,
      default: true
    },
    exercises: [
      {
        name: String,
        sets: Number,
        reps: Number,
        completed: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);

// Adaptive workout planner that responds to user level and inactivity patterns.
function daysSince(dateInput) {
  if (!dateInput) return 999;
  const date = new Date(dateInput);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

const WORKOUT_LIBRARY = {
  beginner: [
    {
      title: 'Foundation Full Body',
      focus: 'full-body',
      duration: 35,
      exercises: [
        { name: 'Bodyweight Squats', sets: 4, reps: 12 },
        { name: 'Knee Pushups', sets: 4, reps: 10 },
        { name: 'Glute Bridge', sets: 3, reps: 15 },
        { name: 'Plank', sets: 3, reps: 40 }
      ]
    },
    {
      title: 'Upper Build Starter',
      focus: 'upper-body',
      duration: 30,
      exercises: [
        { name: 'Incline Pushups', sets: 4, reps: 12 },
        { name: 'Chair Dips', sets: 3, reps: 10 },
        { name: 'Pike Pushups', sets: 3, reps: 8 },
        { name: 'Dead Bug', sets: 3, reps: 12 }
      ]
    }
  ],
  intermediate: [
    {
      title: 'Muscle Gain Split A',
      focus: 'push',
      duration: 45,
      exercises: [
        { name: 'Pushups', sets: 5, reps: 16 },
        { name: 'Dumbbell Press', sets: 4, reps: 10 },
        { name: 'Bulgarian Split Squat', sets: 4, reps: 12 },
        { name: 'Hollow Hold', sets: 3, reps: 45 }
      ]
    },
    {
      title: 'Muscle Gain Split B',
      focus: 'pull',
      duration: 48,
      exercises: [
        { name: 'Bent-over Rows', sets: 4, reps: 10 },
        { name: 'Romanian Deadlifts', sets: 4, reps: 10 },
        { name: 'Reverse Lunges', sets: 4, reps: 12 },
        { name: 'Side Plank', sets: 3, reps: 40 }
      ]
    }
  ],
  advanced: [
    {
      title: 'Strength + Hypertrophy Hybrid',
      focus: 'full-body',
      duration: 60,
      exercises: [
        { name: 'Barbell Squat', sets: 5, reps: 6 },
        { name: 'Bench Press', sets: 5, reps: 6 },
        { name: 'Pull Ups', sets: 4, reps: 8 },
        { name: 'Romanian Deadlift', sets: 4, reps: 8 },
        { name: 'Hanging Knee Raise', sets: 4, reps: 12 }
      ]
    }
  ]
};

function generateWorkout({ profile, workoutLogs = [], behavior }) {
  const level = profile.fitnessLevel || 'beginner';
  const safeLibrary = WORKOUT_LIBRARY[level] || WORKOUT_LIBRARY.beginner;

  const lastWorkout = workoutLogs[0];
  const gap = daysSince(lastWorkout?.date);

  if (gap >= 3) {
    return {
      title: 'Discipline Reset Session',
      focus: 'momentum',
      duration: 20,
      intensity: 5,
      reason: 'You have a workout gap of 3+ days. Momentum-first protocol activated.',
      exercises: [
        { name: 'Pushups', sets: 4, reps: 10 },
        { name: 'Air Squats', sets: 4, reps: 20 },
        { name: 'Mountain Climbers', sets: 4, reps: 30 },
        { name: 'Plank', sets: 3, reps: 45 }
      ]
    };
  }

  const rotationIndex = workoutLogs.length % safeLibrary.length;
  const baseWorkout = safeLibrary[rotationIndex];

  const intensityAdjust = behavior.failureRisk > 70 ? -1 : behavior.disciplineScore > 75 ? 1 : 0;

  return {
    ...baseWorkout,
    intensity: Math.max(3, Math.min(9, 6 + intensityAdjust)),
    reason:
      behavior.failureRisk > 70
        ? 'High failure risk detected. Moderate intensity to protect consistency.'
        : 'Current consistency allows progression on volume and effort.'
  };
}

module.exports = {
  generateWorkout
};


// Behavior analysis engine that scores discipline and predicts consistency risk.
function toDateKey(input) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function percent(value, total) {
  if (!total) return 0;
  return (value / total) * 100;
}

function findWorkoutSkipStreak(dailyLogs) {
  let skipStreak = 0;

  for (const log of dailyLogs) {
    if (log.workoutDone) break;
    skipStreak += 1;
  }

  return skipStreak;
}

function analyzeHabits(habits = [], todayKey) {
  const missedHabits = [];
  let completedInLast7 = 0;

  const last7Keys = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Keys.push(toDateKey(d));
  }

  habits.forEach((habit) => {
    const dateSet = new Set((habit.completionDates || []).map((d) => toDateKey(d)));
    const hitLast2Days = last7Keys.slice(0, 2).some((key) => dateSet.has(key));

    if (!hitLast2Days) {
      missedHabits.push(habit.name);
    }

    completedInLast7 += last7Keys.filter((key) => dateSet.has(key)).length;
  });

  return {
    missedHabits,
    completedInLast7,
    habitTargetLast7: habits.reduce((sum, habit) => sum + (habit.targetPerDay || 1) * 7, 0)
  };
}

function analyzeBehavior({ dailyLogs = [], tasks = [], habits = [] }) {
  const todayKey = toDateKey(new Date());

  const lowProductivityDays = dailyLogs.filter((log) => {
    if ((log.tasksPlanned || 0) < 3) return false;
    return percent(log.tasksCompleted || 0, log.tasksPlanned || 1) < 50;
  });

  const taskCompletionRate =
    tasks.length === 0
      ? 0
      : percent(
          tasks.filter((task) => task.completed).length,
          tasks.length
        );

  const habitStats = analyzeHabits(habits, todayKey);
  const workoutSkipStreak = findWorkoutSkipStreak(dailyLogs);

  const disciplineScore = Math.max(
    0,
    Math.round(
      taskCompletionRate * 0.45 +
        percent(habitStats.completedInLast7, Math.max(habitStats.habitTargetLast7, 1)) * 0.4 +
        Math.max(0, 100 - workoutSkipStreak * 12) * 0.15
    )
  );

  const failureRisk = Math.min(
    100,
    Math.round(
      lowProductivityDays.length * 8 +
        habitStats.missedHabits.length * 10 +
        workoutSkipStreak * 14 +
        Math.max(0, 60 - taskCompletionRate) * 0.45
    )
  );

  const alerts = [];

  if (habitStats.missedHabits.length) {
    alerts.push(`Missed habits: ${habitStats.missedHabits.join(', ')}.`);
  }

  if (workoutSkipStreak >= 3) {
    alerts.push('You skipped workouts 3 days in a row. Add a 20-minute reboot session today.');
  }

  if (lowProductivityDays.length >= 3) {
    alerts.push('Pattern detected: low productivity on multiple recent days. Reduce daily task load and tighten priorities.');
  }

  if (!alerts.length) {
    alerts.push('Behavior trend is stable. Keep your execution rhythm.');
  }

  return {
    disciplineScore,
    failureRisk,
    lowProductivityDays: lowProductivityDays.length,
    workoutSkipStreak,
    missedHabits: habitStats.missedHabits,
    alerts
  };
}

module.exports = {
  analyzeBehavior
};


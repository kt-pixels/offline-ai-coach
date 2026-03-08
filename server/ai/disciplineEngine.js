const {
  buildDayKey,
  clamp,
  round,
  toNumber,
} = require('./nutritionCalculator');

function scoreLabel(score) {
  if (score >= 90) return 'elite';
  if (score >= 70) return 'strong discipline';
  if (score >= 40) return 'average';
  return 'poor';
}

function mealConsistencyScore(dailyNutrition = {}, date = new Date()) {
  const meals = Array.isArray(dailyNutrition.mealDistribution) ? dailyNutrition.mealDistribution : [];

  if (!meals.length) {
    return 55;
  }

  const now = new Date(date);
  const sameDay = buildDayKey(now) === buildDayKey(date);

  const total = meals.reduce((sum, meal) => {
    const targetCalories = Math.max(1, toNumber(meal.targetCalories, 1));
    const consumedCalories = toNumber(meal.consumedCalories);
    let score = clamp(100 - Math.abs(1 - consumedCalories / targetCalories) * 120, 0, 100);

    if (sameDay && consumedCalories === 0 && typeof meal.scheduledTime === 'string') {
      const [hours, minutes] = meal.scheduledTime.split(':').map((part) => Number(part));
      if (Number.isFinite(hours) && Number.isFinite(minutes)) {
        const scheduled = new Date(now);
        scheduled.setHours(hours, minutes, 0, 0);
        if (scheduled > now) {
          score = 65;
        }
      }
    }

    return sum + score;
  }, 0);

  return round(total / meals.length, 0);
}

function calorieGoalScore(dailyNutrition = {}) {
  const targetCalories = Math.max(1, toNumber(dailyNutrition.calorieTarget, 1));
  const consumedCalories = toNumber(dailyNutrition.caloriesConsumed);
  const ratio = consumedCalories / targetCalories;
  return round(clamp(100 - Math.abs(1 - ratio) * 140, 0, 100), 0);
}

function taskCompletionScore(dailyLog = {}, tasks = [], date = new Date()) {
  const dayKey = buildDayKey(date);
  const tasksPlanned = toNumber(dailyLog.tasksPlanned, 0);
  const tasksCompleted = toNumber(dailyLog.tasksCompleted, 0);
  const completedFromTasks = tasks.filter((task) => task.completedAt && buildDayKey(task.completedAt) === dayKey).length;
  const effectiveCompleted = Math.max(tasksCompleted, completedFromTasks);
  const effectivePlanned = Math.max(tasksPlanned, effectiveCompleted, tasks.filter((task) => !task.completed).length ? 3 : 0);

  if (effectivePlanned === 0) {
    return effectiveCompleted > 0 ? 85 : 60;
  }

  return round(clamp((effectiveCompleted / effectivePlanned) * 100, 0, 100), 0);
}

function workoutCompletionScore(profile = {}, dailyLog = {}, workouts = [], date = new Date()) {
  const dayKey = buildDayKey(date);
  const targetWorkouts = Math.max(0, toNumber(profile?.lifestyle?.workoutDaysPerWeek || profile.workoutDaysPerWeek, 3));
  const todayWorkout = Boolean(dailyLog.workoutDone) || workouts.some((item) => buildDayKey(item.date) === dayKey && item.completed !== false);

  if (todayWorkout) {
    return 100;
  }

  const windowStart = new Date(date);
  windowStart.setDate(windowStart.getDate() - 6);
  const weeklyCompleted = workouts.filter((item) => item.completed !== false && new Date(item.date) >= windowStart).length;

  if (targetWorkouts === 0) {
    return weeklyCompleted > 0 ? 85 : 70;
  }

  return round(clamp((weeklyCompleted / targetWorkouts) * 100, 25, 95), 0);
}

function habitScore(dailyLog = {}, habits = [], date = new Date()) {
  const dayKey = buildDayKey(date);
  const habitsTarget = Math.max(toNumber(dailyLog.habitsTarget, 0), habits.length);
  const habitsCompleted = Math.max(
    toNumber(dailyLog.habitsCompleted, 0),
    habits.filter((habit) => (habit.completionDates || []).some((entry) => buildDayKey(entry) === dayKey)).length,
  );

  const complianceScore = habitsTarget > 0 ? clamp((habitsCompleted / habitsTarget) * 100, 0, 100) : 60;

  if (!habits.length) {
    return round(complianceScore || 60, 0);
  }

  const streakSignal =
    habits.reduce((sum, habit) => {
      const streak = toNumber(habit.streak, 0);
      const longestStreak = Math.max(streak, toNumber(habit.longestStreak, 1));
      return sum + clamp((streak / longestStreak) * 100, 0, 100);
    }, 0) / habits.length;

  return round(clamp(complianceScore * 0.7 + streakSignal * 0.3, 0, 100), 0);
}

function calculateDisciplineScore({
  dailyNutrition = {},
  dailyLog = {},
  tasks = [],
  habits = [],
  workouts = [],
  profile = {},
  date = new Date(),
}) {
  const components = {
    mealConsistency: mealConsistencyScore(dailyNutrition, date),
    calorieGoalCompletion: calorieGoalScore(dailyNutrition),
    taskCompletion: taskCompletionScore(dailyLog, tasks, date),
    workoutCompletion: workoutCompletionScore(profile, dailyLog, workouts, date),
    habitStreaks: habitScore(dailyLog, habits, date),
  };

  const weightedScore =
    components.mealConsistency * 0.24 +
    components.calorieGoalCompletion * 0.24 +
    components.taskCompletion * 0.18 +
    components.workoutCompletion * 0.18 +
    components.habitStreaks * 0.16;

  const score = round(clamp(weightedScore, 0, 100), 0);
  const label = scoreLabel(score);

  return {
    score,
    label,
    components,
    summary: `Discipline is ${label} today with strongest signal in ${Object.entries(components).sort((a, b) => b[1] - a[1])[0][0]}.`,
  };
}

function buildDisciplineTrend({
  nutritionRows = [],
  dailyLogs = [],
  tasks = [],
  habits = [],
  workoutLogs = [],
  profile = {},
  days = 30,
}) {
  const nutritionByDay = new Map((nutritionRows || []).map((row) => [buildDayKey(row.date), row]));
  const logByDay = new Map((dailyLogs || []).map((row) => [buildDayKey(row.date), row]));
  const safeDays = Math.max(7, Math.min(90, toNumber(days, 30)));
  const trend = [];

  for (let offset = safeDays - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const dayKey = buildDayKey(date);

    const relatedTasks = tasks.filter((task) => task.completedAt && buildDayKey(task.completedAt) === dayKey);
    const relatedWorkouts = workoutLogs.filter((workout) => buildDayKey(workout.date) === dayKey && workout.completed !== false);

    const discipline = calculateDisciplineScore({
      dailyNutrition: nutritionByDay.get(dayKey) || {},
      dailyLog: logByDay.get(dayKey) || {},
      tasks: relatedTasks,
      habits,
      workouts: relatedWorkouts,
      profile,
      date,
    });

    trend.push({
      date: dayKey,
      score: discipline.score,
      label: discipline.label,
    });
  }

  return trend;
}

module.exports = {
  buildDisciplineTrend,
  calculateDisciplineScore,
  scoreLabel,
};

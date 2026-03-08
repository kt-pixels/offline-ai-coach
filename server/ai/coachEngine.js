const { predictBodyGrowth } = require('./bodyGrowthPredictor');
const { calculateDisciplineScore } = require('./disciplineEngine');
const {
  buildDayKey,
  round,
  toNumber,
} = require('./nutritionCalculator');

function latestWeight(profile = {}, dailyLogs = []) {
  const weightLog = (dailyLogs || []).find((row) => toNumber(row.weight) > 0);
  return toNumber(weightLog?.weight, profile.currentWeightKg || profile.weight || 0);
}

function averageCalories(nutritionRows = [], fallback = 0) {
  const usable = (nutritionRows || []).filter((row) => toNumber(row.caloriesConsumed) > 0);
  if (!usable.length) {
    return toNumber(fallback);
  }

  return usable.reduce((sum, row) => sum + toNumber(row.caloriesConsumed), 0) / usable.length;
}

function workoutStats(profile = {}, workoutLogs = []) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const completed = (workoutLogs || []).filter((workout) => workout.completed !== false && new Date(workout.date) >= sevenDaysAgo).length;
  const target = Math.max(0, toNumber(profile?.lifestyle?.workoutDaysPerWeek || profile.workoutDaysPerWeek, 3));
  return { completed, target };
}

function workoutSkipStreak(workoutLogs = []) {
  const workoutDays = new Set((workoutLogs || []).filter((row) => row.completed !== false).map((row) => buildDayKey(row.date)));
  let streak = 0;
  const cursor = new Date();

  while (!workoutDays.has(buildDayKey(cursor)) && streak < 21) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildMissedHabits(habits = []) {
  const todayKey = buildDayKey(new Date());
  return habits
    .filter((habit) => !(habit.completionDates || []).some((entry) => buildDayKey(entry) === todayKey))
    .slice(0, 4)
    .map((habit) => habit.name);
}

function generateCoachMessages({ nutrition, discipline, progress, workoutSummary, missedHabits, mealPlan }) {
  const messages = [];
  const calorieGap = nutrition.calorieGap;

  if (Math.abs(calorieGap) <= 120) {
    messages.push('Your calorie pacing is inside the target zone today. Keep the remaining meals on schedule.');
  } else if (calorieGap > 0) {
    messages.push(`You are eating ${Math.round(calorieGap)} calories below your goal.`);
  } else {
    messages.push(`You are eating ${Math.abs(Math.round(calorieGap))} calories above your goal.`);
  }

  if (workoutSummary.completed < workoutSummary.target) {
    messages.push(`You missed ${Math.max(0, workoutSummary.target - workoutSummary.completed)} planned workouts this week.`);
  } else {
    messages.push('Workout consistency is on track this week.');
  }

  messages.push(progress.summary);
  messages.push(`Discipline score is ${discipline.score}/100, which rates as ${discipline.label}.`);

  if (missedHabits.length) {
    messages.push(`Habits currently off pace: ${missedHabits.join(', ')}.`);
  } else {
    messages.push('Habit streaks are intact today.');
  }

  if (mealPlan?.meals?.length) {
    const nextMeal = mealPlan.meals.find((meal) => (meal.foods || []).length);
    if (nextMeal) {
      messages.push(`Next high-value meal: ${nextMeal.label} with ${nextMeal.foods.slice(0, 3).map((food) => food.name).join(', ')}.`);
    }
  }

  return messages;
}

function buildMotivation({ discipline, progress, calorieGap }) {
  const actionOfDay = calorieGap > 0
    ? 'Close the calorie gap with one decisive meal instead of grazing.'
    : 'Protect the evening routine and log every completed action.';

  return {
    headline: discipline.score >= 85 ? 'Execution Locked In' : 'Stay On The Rails',
    line: discipline.score >= 70
      ? 'Consistency is compounding. Keep meal timing and training precision high.'
      : 'You need a cleaner execution block today to keep progress moving.',
    actionOfDay,
    growthSignal: progress.summary,
  };
}

function generateCoachInsights({
  profile = {},
  dailyLogs = [],
  workoutLogs = [],
  tasks = [],
  habits = [],
  dailyNutrition = {},
  nutritionRows = [],
  mealPlan = null,
}) {
  const currentWeightKg = latestWeight(profile, dailyLogs);
  const targetCalories = toNumber(dailyNutrition.calorieTarget, profile?.caloriePlan?.dailyCalorieGoal || 0);
  const consumedCalories = toNumber(dailyNutrition.caloriesConsumed, dailyLogs[0]?.calories || 0);
  const calorieGap = round(targetCalories - consumedCalories, 0);

  const discipline = calculateDisciplineScore({
    dailyNutrition,
    dailyLog: dailyLogs[0] || {},
    tasks,
    habits,
    workouts: workoutLogs,
    profile,
    date: new Date(),
  });

  const progress = predictBodyGrowth({
    profile,
    currentWeightKg,
    targetWeightKg: profile.targetWeightKg || profile.goalWeight,
    dailyCalories: averageCalories(nutritionRows, targetCalories || consumedCalories),
    workoutsPerWeek: profile?.lifestyle?.workoutDaysPerWeek || profile.workoutDaysPerWeek,
    durationWeeks: 12,
  });

  const workoutSummary = workoutStats(profile, workoutLogs);
  const missedHabits = buildMissedHabits(habits);
  const messages = generateCoachMessages({ nutrition: { calorieGap }, discipline, progress, workoutSummary, missedHabits, mealPlan });
  const recommendedFoods = (mealPlan?.meals || []).flatMap((meal) => meal.foods || []).slice(0, 6);
  const proteinTarget = Math.max(0, round(currentWeightKg * (profile.goalSetting === 'muscle_gain' ? 2 : 1.8), 0));
  const proteinConsumed = toNumber(dailyNutrition.proteinConsumed, dailyLogs[0]?.protein || 0);
  const carbsConsumed = toNumber(dailyNutrition.carbsConsumed, dailyLogs[0]?.carbs || 0);
  const fatConsumed = toNumber(dailyNutrition.fatConsumed, dailyLogs[0]?.fats || 0);

  return {
    diet: {
      targetCalories,
      consumedCalories,
      calorieGap,
      deficits: {
        calories: Math.max(0, calorieGap),
        protein: Math.max(0, proteinTarget - proteinConsumed),
        carbs: Math.max(0, round((targetCalories * 0.5) / 4 - carbsConsumed, 0)),
        fats: Math.max(0, round((targetCalories * 0.25) / 9 - fatConsumed, 0)),
      },
      recommendedFoods,
      feedback: messages.slice(0, 3),
    },
    nutrition: {
      targetCalories,
      consumedCalories,
      calorieGap,
      proteinConsumed,
      carbsConsumed,
      fatConsumed,
    },
    behavior: {
      disciplineScore: discipline.score,
      label: discipline.label,
      components: discipline.components,
      failureRisk: round(100 - discipline.score + Math.min(18, Math.abs(calorieGap) / 40), 0),
      workoutSkipStreak: workoutSkipStreak(workoutLogs),
      missedHabits,
    },
    progress: {
      currentWeightKg,
      targetWeightKg: toNumber(profile.targetWeightKg || profile.goalWeight, currentWeightKg),
      weeklyGain: progress.expectedWeeklyChangeKg,
      projectedWeightWeek12: progress.finalWeightKg,
      requiredDailySurplus: progress.requiredDailySurplus,
      summary: progress.summary,
      projection: progress.projection,
      milestones: progress.milestones,
    },
    motivation: buildMotivation({ discipline, progress, calorieGap }),
    coachFeed: messages,
    suggestions: Array.from(new Set(messages)).slice(0, 8),
  };
}

function generateCoachReply({ message = '', insights = {}, mealPlan = null }) {
  const query = String(message || '').trim().toLowerCase();
  const calorieGap = toNumber(insights?.diet?.calorieGap, 0);

  if (!query) {
    return insights?.suggestions?.[0] || 'Stay consistent with meals, workouts, and task completion today.';
  }

  if (query.includes('calorie') || query.includes('eat') || query.includes('nutrition')) {
    if (calorieGap > 0) {
      return `You are ${Math.round(calorieGap)} calories short. Prioritize ${((mealPlan?.meals || []).flatMap((meal) => meal.foods || []).slice(0, 3).map((food) => food.name).join(', ')) || 'rice, milk, and nuts'} in the next two meals.`;
    }

    return `Calorie pacing is stable. Keep protein above ${Math.round((insights?.nutrition?.proteinConsumed || 0) + Math.max(0, insights?.diet?.deficits?.protein || 0))} g by the end of the day.`;
  }

  if (query.includes('meal') || query.includes('plan') || query.includes('food')) {
    const lines = (mealPlan?.meals || [])
      .slice(0, 3)
      .map((meal) => `${meal.label}: ${meal.foods.slice(0, 3).map((food) => food.name).join(', ')}`)
      .join(' ');
    return lines || 'Meal plan is not available yet. Refresh the nutrition workspace and retry.';
  }

  if (query.includes('discipline') || query.includes('habit') || query.includes('streak')) {
    return `Discipline score is ${insights?.behavior?.disciplineScore || 0}/100. Main pressure points: meal consistency ${insights?.behavior?.components?.mealConsistency || 0}, tasks ${insights?.behavior?.components?.taskCompletion || 0}, habits ${insights?.behavior?.components?.habitStreaks || 0}.`;
  }

  if (query.includes('workout') || query.includes('train')) {
    return insights?.behavior?.workoutSkipStreak > 1
      ? `You missed ${insights.behavior.workoutSkipStreak} workout days in a row. Schedule a shorter recovery session today instead of waiting for a perfect slot.`
      : 'Workout consistency is acceptable. Focus on showing up at the planned time and logging the session immediately after.';
  }

  if (query.includes('weight') || query.includes('progress') || query.includes('future') || query.includes('gain') || query.includes('loss')) {
    const milestone = insights?.progress?.milestones?.map((point) => `${point.label} -> ${point.weightKg} kg`).join(', ');
    return milestone
      ? `Projected body-weight path: ${milestone}.`
      : insights?.progress?.summary || 'Weight projection is not available yet.';
  }

  return insights?.suggestions?.[0] || 'Focus on one meal, one workout, and one completed task block before the day ends.';
}

module.exports = {
  generateCoachInsights,
  generateCoachReply,
};

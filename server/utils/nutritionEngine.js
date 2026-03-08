const MEAL_TYPES = [
  'breakfast',
  'mid_morning_snack',
  'lunch',
  'evening_snack',
  'dinner'
];

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  mid_morning_snack: 'Mid Morning Snack',
  lunch: 'Lunch',
  evening_snack: 'Evening Snack',
  dinner: 'Dinner'
};

const DEFAULT_MEAL_TIMES = {
  breakfast: '08:00',
  mid_morning_snack: '11:00',
  lunch: '14:00',
  evening_snack: '17:00',
  dinner: '21:00'
};

function toNumber(input, fallback = 0) {
  const num = Number(input);
  return Number.isFinite(num) ? num : fallback;
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function startOfDay(inputDate = new Date()) {
  const date = new Date(inputDate);
  date.setHours(0, 0, 0, 0);
  return date;
}

function normalizeTimeText(timeText, fallback = '12:00') {
  if (typeof timeText !== 'string') {
    return fallback;
  }

  const trimmed = timeText.trim();
  if (!trimmed.includes(':')) {
    return fallback;
  }

  const [hourPart, minutePart] = trimmed.split(':');
  const hours = Number(hourPart);
  const minutes = Number(minutePart);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return fallback;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function resolveMealTime(mealType, timeText) {
  return normalizeTimeText(timeText, DEFAULT_MEAL_TIMES[mealType] || '12:00');
}

function parseTimeToDate(timeText, date = new Date(), mealType = 'lunch') {
  const safeTime = resolveMealTime(mealType, timeText);
  const [hourPart, minutePart] = safeTime.split(':');
  const hours = toNumber(hourPart, 0);
  const minutes = toNumber(minutePart, 0);

  const parsed = new Date(date);
  parsed.setHours(hours, minutes, 0, 0);
  return parsed;
}

function calculateCaloriePlan(profileInput) {
  const profile = {
    age: toNumber(profileInput.age),
    gender: profileInput.gender,
    heightCm: toNumber(profileInput.heightCm),
    currentWeightKg: toNumber(profileInput.currentWeightKg),
    targetWeightKg: toNumber(profileInput.targetWeightKg),
    goalSetting: profileInput.goalSetting,
    timelinePreference: profileInput.timelinePreference,
    activityLevel: profileInput.activityLevel,
    workoutDaysPerWeek: toNumber(profileInput.workoutDaysPerWeek)
  };

  let bmr = 10 * profile.currentWeightKg + 6.25 * profile.heightCm - 5 * profile.age;
  if (profile.gender === 'male') bmr += 5;
  else if (profile.gender === 'female') bmr -= 161;
  else bmr -= 78;

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    high: 1.725,
    athlete: 1.9
  };

  const workoutBoost = profile.workoutDaysPerWeek >= 5 ? 0.06 : profile.workoutDaysPerWeek >= 3 ? 0.03 : 0;
  const activityMultiplier = (multipliers[profile.activityLevel] || 1.2) + workoutBoost;
  const maintenanceCalories = bmr * activityMultiplier;

  const adjustmentMap = {
    weight_gain: { aggressive: 520, moderate: 320, slow: 180 },
    muscle_gain: { aggressive: 360, moderate: 240, slow: 140 },
    weight_loss: { aggressive: -620, moderate: -420, slow: -280 }
  };

  const weeklyTargetMap = {
    weight_gain: { aggressive: 0.7, moderate: 0.45, slow: 0.25 },
    muscle_gain: { aggressive: 0.45, moderate: 0.3, slow: 0.18 },
    weight_loss: { aggressive: -0.8, moderate: -0.5, slow: -0.3 }
  };

  const calorieAdjustment =
    adjustmentMap[profile.goalSetting]?.[profile.timelinePreference] ?? adjustmentMap.weight_gain.moderate;

  const dailyCalorieGoal = Math.max(1200, Math.round(maintenanceCalories + calorieAdjustment));

  return {
    bmr: Math.round(bmr),
    maintenanceCalories: Math.round(maintenanceCalories),
    calorieAdjustment: Math.round(calorieAdjustment),
    dailyCalorieGoal,
    weeklyWeightTargetKg: weeklyTargetMap[profile.goalSetting]?.[profile.timelinePreference] ?? 0.45
  };
}

function buildMealDistribution({ dailyCalorieGoal, dailySchedule, mealFrequency = 5 }) {
  let weights = {
    breakfast: 0.25,
    mid_morning_snack: 0.1,
    lunch: 0.3,
    evening_snack: 0.1,
    dinner: 0.25
  };

  if (mealFrequency <= 3) {
    weights = {
      breakfast: 0.3,
      mid_morning_snack: 0,
      lunch: 0.4,
      evening_snack: 0,
      dinner: 0.3
    };
  } else if (mealFrequency === 4) {
    weights = {
      breakfast: 0.27,
      mid_morning_snack: 0.08,
      lunch: 0.33,
      evening_snack: 0,
      dinner: 0.32
    };
  }

  const safeSchedule = dailySchedule || {};

  return MEAL_TYPES.map((mealType) => {
    const targetCalories = Math.round(dailyCalorieGoal * weights[mealType]);
    const scheduleMap = {
      breakfast: safeSchedule.breakfastTime,
      mid_morning_snack: safeSchedule.snackTime,
      lunch: safeSchedule.lunchTime,
      evening_snack: safeSchedule.eveningSnackTime,
      dinner: safeSchedule.dinnerTime
    };

    return {
      mealType,
      label: MEAL_LABELS[mealType],
      scheduledTime: resolveMealTime(mealType, scheduleMap[mealType]),
      targetCalories,
      consumedCalories: 0,
      remainingCalories: targetCalories
    };
  });
}

function calculateNextMealCountdown(mealDistribution, currentTime = new Date()) {
  if (!Array.isArray(mealDistribution) || mealDistribution.length === 0) {
    return null;
  }

  let next = null;

  for (const meal of mealDistribution) {
    const mealDate = parseTimeToDate(meal.scheduledTime, currentTime, meal.mealType);
    if (!mealDate) continue;

    if (mealDate.getTime() > currentTime.getTime()) {
      const countdownSeconds = Math.floor((mealDate.getTime() - currentTime.getTime()) / 1000);
      next = {
        mealType: meal.mealType,
        label: meal.label || MEAL_LABELS[meal.mealType],
        scheduledTime: resolveMealTime(meal.mealType, meal.scheduledTime),
        countdownSeconds
      };
      break;
    }
  }

  if (next) return next;

  const tomorrow = new Date(currentTime);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const firstMeal = mealDistribution[0];
  const firstMealDate = parseTimeToDate(firstMeal?.scheduledTime, tomorrow, firstMeal?.mealType);

  return {
    mealType: firstMeal?.mealType || 'breakfast',
    label: firstMeal?.label || MEAL_LABELS[firstMeal?.mealType] || 'Breakfast',
    scheduledTime: resolveMealTime(firstMeal?.mealType, firstMeal?.scheduledTime),
    countdownSeconds: Math.max(0, Math.floor((firstMealDate.getTime() - currentTime.getTime()) / 1000))
  };
}

function buildSmartAlerts({ dailyNutrition, currentTime = new Date() }) {
  const alerts = [];
  const mealDistribution = Array.isArray(dailyNutrition?.mealDistribution) ? dailyNutrition.mealDistribution : [];

  const remaining = Math.max(0, toNumber(dailyNutrition?.calorieTarget) - toNumber(dailyNutrition?.caloriesConsumed));

  if (remaining > toNumber(dailyNutrition?.calorieTarget) * 0.45 && currentTime.getHours() >= 15) {
    alerts.push('You are behind your calorie goal today. Add one calorie-dense meal now.');
  }

  const nextMeal = calculateNextMealCountdown(mealDistribution, currentTime);
  const nextDistribution = nextMeal ? mealDistribution.find((meal) => meal.mealType === nextMeal.mealType) : null;

  if (nextDistribution && nextDistribution.remainingCalories > 0) {
    const mealLabel = (nextDistribution.label || MEAL_LABELS[nextDistribution.mealType] || nextDistribution.mealType || 'next meal').toLowerCase();
    alerts.push(`You have ${Math.round(nextDistribution.remainingCalories)} calories remaining for ${mealLabel}.`);
  }

  if (!alerts.length) {
    alerts.push('Calorie pacing looks stable. Maintain meal timing discipline.');
  }

  return alerts;
}

module.exports = {
  DEFAULT_MEAL_TIMES,
  MEAL_TYPES,
  MEAL_LABELS,
  round,
  startOfDay,
  calculateCaloriePlan,
  buildMealDistribution,
  calculateNextMealCountdown,
  buildSmartAlerts,
  resolveMealTime
};

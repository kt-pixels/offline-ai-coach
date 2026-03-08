const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const FoodDatabase = require('../models/FoodDatabase');
const MealEntry = require('../models/MealEntry');
const DailyNutrition = require('../models/DailyNutrition');
const DailyLog = require('../models/DailyLog');
const MealLog = require('../models/MealLog');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const WorkoutLog = require('../models/WorkoutLog');
const { predictBodyGrowth } = require('../ai/bodyGrowthPredictor');
const { calculateDisciplineScore, buildDisciplineTrend } = require('../ai/disciplineEngine');
const { generateMealPlan } = require('../ai/mealGenerator');
const {
  calculateServingNutrition,
  clamp,
  inferDietTags,
  normalizeDietType,
  normalizeText,
  round,
  toNumber,
} = require('../ai/nutritionCalculator');
const {
  MEAL_TYPES,
  MEAL_LABELS,
  startOfDay,
  calculateCaloriePlan,
  buildMealDistribution,
  calculateNextMealCountdown,
  buildSmartAlerts,
} = require('../utils/nutritionEngine');

function endOfDay(inputDate = new Date()) {
  const date = new Date(inputDate);
  date.setHours(23, 59, 59, 999);
  return date;
}

function ensureText(value) {
  return normalizeText(value);
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateOnboardingPayload(payload) {
  const required = [
    'age',
    'gender',
    'heightCm',
    'currentWeightKg',
    'targetWeightKg',
    'dietPreference',
    'goalSetting',
    'timelinePreference',
    'activityLevel',
    'workoutDaysPerWeek',
    'sleepTime',
    'mealFrequency',
    'breakfastTime',
    'snackTime',
    'lunchTime',
    'eveningSnackTime',
    'dinnerTime',
  ];

  const missing = required.filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === '');

  return {
    valid: missing.length === 0,
    missing,
  };
}

function deriveFitnessLevel(workoutDaysPerWeek) {
  if (workoutDaysPerWeek >= 5) return 'advanced';
  if (workoutDaysPerWeek >= 3) return 'intermediate';
  return 'beginner';
}

async function ensureDailyNutrition(userId, profile, dateInput = new Date()) {
  const date = startOfDay(dateInput);
  const baseDistribution = buildMealDistribution({
    dailyCalorieGoal: profile.caloriePlan.dailyCalorieGoal,
    dailySchedule: profile.dailySchedule,
    mealFrequency: profile.lifestyle.mealFrequency,
  });

  let daily = await DailyNutrition.findOne({ user: userId, date });

  if (!daily) {
    daily = await DailyNutrition.create({
      user: userId,
      date,
      calorieTarget: profile.caloriePlan.dailyCalorieGoal,
      caloriesConsumed: 0,
      proteinConsumed: 0,
      carbsConsumed: 0,
      fatConsumed: 0,
      calorieDelta: -profile.caloriePlan.dailyCalorieGoal,
      mealDistribution: baseDistribution,
      alerts: [],
    });
    return daily;
  }

  daily.calorieTarget = profile.caloriePlan.dailyCalorieGoal;
  daily.mealDistribution = baseDistribution.map((baseMeal) => {
    const existing = (daily.mealDistribution || []).find((item) => item.mealType === baseMeal.mealType);
    const consumed = existing?.consumedCalories || 0;

    return {
      ...baseMeal,
      consumedCalories: round(consumed),
      remainingCalories: round(Math.max(0, baseMeal.targetCalories - consumed)),
    };
  });

  await daily.save();
  return daily;
}

async function getOnboardingStatus(req, res) {
  const profile = await UserProfile.findOne({ user: req.user.id });

  if (!profile) {
    return res.json({ onboardingCompleted: false, profile: null });
  }

  return res.json({ onboardingCompleted: true, profile });
}

async function saveOnboarding(req, res) {
  const payload = req.body || {};
  const check = validateOnboardingPayload(payload);

  if (!check.valid) {
    return res.status(400).json({ message: `Missing required onboarding fields: ${check.missing.join(', ')}` });
  }

  const existingProfile = await UserProfile.findOne({ user: req.user.id });

  const baseProfile = {
    age: toNumber(payload.age),
    gender: ensureText(payload.gender),
    heightCm: toNumber(payload.heightCm),
    currentWeightKg: toNumber(payload.currentWeightKg),
    targetWeightKg: toNumber(payload.targetWeightKg),
    dietPreference: normalizeDietType(payload.dietPreference),
    goalSetting: ensureText(payload.goalSetting),
    timelinePreference: ensureText(payload.timelinePreference),
    activityLevel: ensureText(payload.activityLevel),
    workoutDaysPerWeek: toNumber(payload.workoutDaysPerWeek),
    sleepTime: String(payload.sleepTime || ''),
    mealFrequency: toNumber(payload.mealFrequency),
    breakfastTime: String(payload.breakfastTime || ''),
    snackTime: String(payload.snackTime || ''),
    lunchTime: String(payload.lunchTime || ''),
    eveningSnackTime: String(payload.eveningSnackTime || ''),
    dinnerTime: String(payload.dinnerTime || ''),
  };

  const caloriePlan = calculateCaloriePlan(baseProfile);

  const mealTargets = buildMealDistribution({
    dailyCalorieGoal: caloriePlan.dailyCalorieGoal,
    dailySchedule: {
      breakfastTime: baseProfile.breakfastTime,
      snackTime: baseProfile.snackTime,
      lunchTime: baseProfile.lunchTime,
      eveningSnackTime: baseProfile.eveningSnackTime,
      dinnerTime: baseProfile.dinnerTime,
    },
    mealFrequency: baseProfile.mealFrequency,
  }).map((meal) => ({
    mealType: meal.mealType,
    targetCalories: meal.targetCalories,
  }));

  const profile = await UserProfile.findOneAndUpdate(
    { user: req.user.id },
    {
      $set: {
        age: baseProfile.age,
        gender: baseProfile.gender,
        heightCm: baseProfile.heightCm,
        currentWeightKg: baseProfile.currentWeightKg,
        targetWeightKg: baseProfile.targetWeightKg,
        dietPreference: baseProfile.dietPreference,
        goalSetting: baseProfile.goalSetting,
        timelinePreference: baseProfile.timelinePreference,
        lifestyle: {
          activityLevel: baseProfile.activityLevel,
          workoutDaysPerWeek: baseProfile.workoutDaysPerWeek,
          sleepTime: baseProfile.sleepTime,
          mealFrequency: baseProfile.mealFrequency,
        },
        dailySchedule: {
          breakfastTime: baseProfile.breakfastTime,
          snackTime: baseProfile.snackTime,
          lunchTime: baseProfile.lunchTime,
          eveningSnackTime: baseProfile.eveningSnackTime,
          dinnerTime: baseProfile.dinnerTime,
        },
        caloriePlan,
        mealTargets,
        onboardingCompleted: true,
        initialWeightKg: existingProfile?.initialWeightKg || baseProfile.currentWeightKg,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  await User.findByIdAndUpdate(req.user.id, {
    age: baseProfile.age,
    gender: baseProfile.gender,
    height: baseProfile.heightCm,
    weight: baseProfile.currentWeightKg,
    goalWeight: baseProfile.targetWeightKg,
    dietPreference: baseProfile.dietPreference,
    fitnessLevel: deriveFitnessLevel(baseProfile.workoutDaysPerWeek),
    onboardingCompleted: true,
    caloriePlan: {
      bmr: caloriePlan.bmr,
      maintenanceCalories: caloriePlan.maintenanceCalories,
      calorieAdjustment: caloriePlan.calorieAdjustment,
      dailyCalorieGoal: caloriePlan.dailyCalorieGoal,
    },
  });

  await ensureDailyNutrition(req.user.id, profile, new Date());

  return res.json({
    onboardingCompleted: true,
    profile,
  });
}

async function searchFoods(req, res) {
  const query = ensureText(req.query.q);
  const mealType = ensureText(req.query.mealType);
  const limit = clamp(toNumber(req.query.limit, 20), 1, 30);

  const baseFilters = mealType ? { mealTags: mealType } : {};
  let candidates = [];

  if (!query) {
    candidates = await FoodDatabase.find(baseFilters).sort({ popularityScore: -1 }).limit(120).lean();
  } else {
    const regex = new RegExp(escapeRegex(query), 'i');
    candidates = await FoodDatabase.find({
      ...baseFilters,
      $or: [{ name: regex }, { aliases: regex }, { category: regex }, { cuisine: regex }],
    })
      .limit(180)
      .lean();
  }

  const tokens = query.split(' ').filter(Boolean);
  const scored = candidates
    .map((item) => {
      const name = normalizeText(item.name);
      const aliases = (item.aliases || []).map(normalizeText);
      const category = normalizeText(item.category);
      const cuisine = normalizeText(item.cuisine);
      let score = toNumber(item.popularityScore, 50) / 2;

      if (!query) {
        score += 20;
      }

      if (name === query) score += 140;
      if (name.startsWith(query)) score += 90;
      if (name.includes(query)) score += 45;
      if (category.includes(query)) score += 18;
      if (cuisine.includes(query)) score += 12;
      if (mealType && (item.mealTags || []).includes(mealType)) score += 30;
      if (aliases.some((alias) => alias === query)) score += 65;
      if (aliases.some((alias) => alias.startsWith(query))) score += 28;

      tokens.forEach((token) => {
        if (name.includes(token)) score += 12;
        if (aliases.some((alias) => alias.includes(token))) score += 8;
        if (category.includes(token)) score += 5;
      });

      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => ({
      id: item._id,
      name: item.name,
      category: item.category,
      cuisine: item.cuisine,
      calories_per_gram: item.calories_per_gram,
      protein_per_gram: item.protein_per_gram,
      carbs_per_gram: item.carbs_per_gram,
      fat_per_gram: item.fat_per_gram,
      price_per_100g: item.price_per_100g,
      dietTags: item.dietTags || inferDietTags(item),
      mealTags: item.mealTags || [],
    }));

  return res.json({ foods: scored });
}

function mealTypeDisplay(mealType) {
  return MEAL_LABELS[mealType] || mealType;
}
async function recalculateDailyNutrition(userId, profile, targetDate = new Date()) {
  const date = startOfDay(targetDate);
  const daily = await ensureDailyNutrition(userId, profile, date);

  const entries = await MealEntry.find({
    user: userId,
    date: {
      $gte: startOfDay(date),
      $lte: endOfDay(date),
    },
  })
    .sort({ createdAt: -1 })
    .lean();

  const totals = entries.reduce(
    (acc, item) => ({
      calories: acc.calories + toNumber(item.calories),
      protein: acc.protein + toNumber(item.protein),
      carbs: acc.carbs + toNumber(item.carbs),
      fat: acc.fat + toNumber(item.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const entriesByMeal = MEAL_TYPES.reduce((acc, mealType) => {
    acc[mealType] = entries.filter((entry) => entry.mealType === mealType);
    return acc;
  }, {});

  daily.caloriesConsumed = round(totals.calories);
  daily.proteinConsumed = round(totals.protein);
  daily.carbsConsumed = round(totals.carbs);
  daily.fatConsumed = round(totals.fat);
  daily.calorieDelta = round(daily.caloriesConsumed - daily.calorieTarget);

  daily.mealDistribution = (daily.mealDistribution || []).map((meal) => {
    const consumedCalories = round((entriesByMeal[meal.mealType] || []).reduce((sum, entry) => sum + toNumber(entry.calories), 0));

    return {
      mealType: meal.mealType,
      scheduledTime: meal.scheduledTime,
      targetCalories: meal.targetCalories,
      consumedCalories,
      remainingCalories: round(Math.max(0, meal.targetCalories - consumedCalories)),
    };
  });

  const now = new Date();
  daily.alerts = buildSmartAlerts({ dailyNutrition: daily, currentTime: now });
  await daily.save();

  const nextMeal = calculateNextMealCountdown(
    daily.mealDistribution.map((meal) => ({ ...meal, label: mealTypeDisplay(meal.mealType) })),
    now,
  );

  const latestWeightLog = await DailyLog.findOne({ user: userId, weight: { $gt: 0 } }).sort({ date: -1 }).select('weight').lean();
  const currentWeightKg = latestWeightLog?.weight || profile.currentWeightKg;
  const initialWeight = profile.initialWeightKg || profile.currentWeightKg;
  let progressPercent = 0;

  if (profile.goalSetting === 'weight_loss') {
    const totalDrop = Math.max(0.01, initialWeight - profile.targetWeightKg);
    progressPercent = ((initialWeight - currentWeightKg) / totalDrop) * 100;
  } else {
    const totalGain = Math.max(0.01, profile.targetWeightKg - initialWeight);
    progressPercent = ((currentWeightKg - initialWeight) / totalGain) * 100;
  }

  const mealDistribution = daily.mealDistribution.map((meal) => ({
    mealType: meal.mealType,
    label: mealTypeDisplay(meal.mealType),
    scheduledTime: meal.scheduledTime,
    targetCalories: meal.targetCalories,
    consumedCalories: meal.consumedCalories,
    remainingCalories: meal.remainingCalories,
    foodsConsumed: (entriesByMeal[meal.mealType] || []).map((entry) => ({
      id: entry._id,
      name: entry.food?.name || 'Food',
      grams: entry.grams,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
    })),
  }));

  return {
    daily,
    mealDistribution,
    nextMeal,
    currentWeightKg,
    progressPercent: clamp(Math.round(progressPercent), 0, 100),
  };
}

async function fetchFoodPoolForMeals(mealDistribution) {
  const mealTypes = (mealDistribution || []).map((meal) => meal.mealType);
  return FoodDatabase.find({ mealTags: { $in: mealTypes } }).sort({ popularityScore: -1 }).limit(5000).lean();
}

async function buildNutritionIntelligence(userId, profile, dateInput = new Date()) {
  const date = startOfDay(dateInput);
  const last60Days = new Date(date);
  last60Days.setDate(last60Days.getDate() - 59);
  const last30Days = new Date(date);
  last30Days.setDate(last30Days.getDate() - 29);

  const recalculated = await recalculateDailyNutrition(userId, profile, date);

  const [dayLog, recentNutritionRows, recentLogs, tasks, habits, workouts, foodPool] = await Promise.all([
    DailyLog.findOne({ user: userId, date }).lean(),
    DailyNutrition.find({ user: userId, date: { $gte: startOfDay(last30Days) } }).sort({ date: 1 }).lean(),
    DailyLog.find({ user: userId, date: { $gte: startOfDay(last60Days) } }).sort({ date: 1 }).lean(),
    Task.find({ user: userId }).sort({ createdAt: -1 }).limit(100).lean(),
    Habit.find({ user: userId }).lean(),
    WorkoutLog.find({ user: userId, date: { $gte: startOfDay(last30Days) } }).sort({ date: -1 }).lean(),
    fetchFoodPoolForMeals(recalculated.mealDistribution),
  ]);

  const mealPlan = generateMealPlan({
    foods: foodPool,
    calorieTarget: profile.caloriePlan.dailyCalorieGoal,
    dietType: profile.dietPreference,
    mealDistribution: recalculated.mealDistribution,
  });

  const averageDailyCalories =
    recentNutritionRows.filter((row) => toNumber(row.caloriesConsumed) > 0).reduce((sum, row, _, rows) => sum + toNumber(row.caloriesConsumed) / rows.length, 0) ||
    profile.caloriePlan.dailyCalorieGoal;

  const growthPrediction = predictBodyGrowth({
    profile,
    currentWeightKg: recalculated.currentWeightKg,
    targetWeightKg: profile.targetWeightKg,
    dailyCalories: averageDailyCalories,
    workoutsPerWeek: profile.lifestyle.workoutDaysPerWeek,
    durationWeeks: 12,
  });

  const discipline = calculateDisciplineScore({
    dailyNutrition: recalculated.daily.toObject ? recalculated.daily.toObject() : recalculated.daily,
    dailyLog: dayLog || {},
    tasks,
    habits,
    workouts,
    profile,
    date,
  });

  return {
    recalculated,
    dayLog,
    recentNutritionRows,
    recentLogs,
    tasks,
    habits,
    workouts,
    mealPlan,
    growthPrediction,
    discipline,
  };
}

async function addMealEntry(req, res) {
  const profile = await UserProfile.findOne({ user: req.user.id });

  if (!profile) {
    return res.status(400).json({ message: 'Complete onboarding before meal logging.' });
  }

  const mealType = ensureText(req.body.mealType);
  const grams = toNumber(req.body.grams);

  if (!MEAL_TYPES.includes(mealType)) {
    return res.status(400).json({ message: 'Invalid meal type.' });
  }

  if (!grams || grams <= 0) {
    return res.status(400).json({ message: 'Grams must be greater than 0.' });
  }

  let food = null;

  if (req.body.foodId) {
    food = await FoodDatabase.findById(req.body.foodId);
  } else if (req.body.foodName) {
    const regex = new RegExp(`^${escapeRegex(req.body.foodName)}$`, 'i');
    food = await FoodDatabase.findOne({ name: regex });
  }

  if (!food) {
    return res.status(404).json({ message: 'Food not found in database.' });
  }

  const date = req.body.date ? new Date(req.body.date) : new Date();
  const nutrition = calculateServingNutrition(food, grams);
  const dietTags = food.dietTags || inferDietTags(food);
  const isVegetarian = dietTags.includes('vegan') || dietTags.includes('vegetarian');

  const entry = await MealEntry.create({
    user: req.user.id,
    date,
    mealType,
    food: {
      foodId: food._id,
      name: food.name,
      category: food.category,
    },
    grams: nutrition.grams,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    cost: nutrition.cost,
  });

  await MealLog.create({
    user: req.user.id,
    date,
    name: `${food.name} (${nutrition.grams}g)`,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fats: nutrition.fat,
    cost: nutrition.cost,
    isVegetarian,
    tags: [mealType, food.category || ''],
  });

  const day = startOfDay(date);

  await DailyLog.findOneAndUpdate(
    { user: req.user.id, date: day },
    {
      $setOnInsert: { user: req.user.id, date: day },
      $inc: {
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fats: nutrition.fat,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  const recalculated = await recalculateDailyNutrition(req.user.id, profile, date);

  return res.status(201).json({
    entry,
    daily: {
      calorieTarget: recalculated.daily.calorieTarget,
      caloriesConsumed: recalculated.daily.caloriesConsumed,
      caloriesRemaining: Math.max(0, recalculated.daily.calorieTarget - recalculated.daily.caloriesConsumed),
      mealDistribution: recalculated.mealDistribution,
      alerts: recalculated.daily.alerts,
    },
  });
}

async function getDailyNutritionDashboard(req, res) {
  const profile = await UserProfile.findOne({ user: req.user.id }).lean();

  if (!profile) {
    return res.json({ onboardingRequired: true });
  }

  const date = req.query.date ? new Date(req.query.date) : new Date();
  const intelligence = await buildNutritionIntelligence(req.user.id, profile, date);

  return res.json({
    onboardingRequired: false,
    profile,
    caloriePlan: profile.caloriePlan,
    today: {
      date: startOfDay(date),
      calorieTarget: intelligence.recalculated.daily.calorieTarget,
      caloriesConsumed: intelligence.recalculated.daily.caloriesConsumed,
      caloriesRemaining: Math.max(0, intelligence.recalculated.daily.calorieTarget - intelligence.recalculated.daily.caloriesConsumed),
      proteinConsumed: intelligence.recalculated.daily.proteinConsumed,
      carbsConsumed: intelligence.recalculated.daily.carbsConsumed,
      fatConsumed: intelligence.recalculated.daily.fatConsumed,
      calorieDelta: intelligence.recalculated.daily.calorieDelta,
      currentWeightKg: intelligence.recalculated.currentWeightKg,
      targetWeightKg: profile.targetWeightKg,
      progressPercent: intelligence.recalculated.progressPercent,
      mealDistribution: intelligence.recalculated.mealDistribution,
      nextMeal: intelligence.recalculated.nextMeal,
      notifications: intelligence.recalculated.daily.alerts,
    },
    discipline: intelligence.discipline,
    mealPlan: intelligence.mealPlan,
    growthPrediction: intelligence.growthPrediction,
    simulationDefaults: {
      dailyCalories: intelligence.growthPrediction.dailyCalories,
      workoutsPerWeek: profile.lifestyle.workoutDaysPerWeek,
    },
  });
}

async function getMealEntries(req, res) {
  const profile = await UserProfile.findOne({ user: req.user.id }).lean();

  if (!profile) {
    return res.status(400).json({ message: 'Complete onboarding first.' });
  }

  const date = req.query.date ? new Date(req.query.date) : new Date();
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const entries = await MealEntry.find({
    user: req.user.id,
    date: { $gte: dayStart, $lte: dayEnd },
  })
    .sort({ createdAt: -1 })
    .lean();

  const recalculated = await recalculateDailyNutrition(req.user.id, profile, date);

  return res.json({
    date: dayStart,
    entries,
    mealDistribution: recalculated.mealDistribution,
    calorieTarget: recalculated.daily.calorieTarget,
    caloriesConsumed: recalculated.daily.caloriesConsumed,
    caloriesRemaining: Math.max(0, recalculated.daily.calorieTarget - recalculated.daily.caloriesConsumed),
  });
}
async function getNutritionAnalytics(req, res) {
  const profile = await UserProfile.findOne({ user: req.user.id }).lean();

  if (!profile) {
    return res.status(400).json({ message: 'Complete onboarding first.' });
  }

  const last60Days = new Date();
  last60Days.setDate(last60Days.getDate() - 59);
  const habitWindow = 28;

  const [nutritionRows, weightRows, dailyLogs, tasks, habits, workoutLogs] = await Promise.all([
    DailyNutrition.find({ user: req.user.id, date: { $gte: startOfDay(last60Days) } }).sort({ date: 1 }).lean(),
    DailyLog.find({ user: req.user.id, date: { $gte: startOfDay(last60Days) }, weight: { $gt: 0 } }).sort({ date: 1 }).lean(),
    DailyLog.find({ user: req.user.id, date: { $gte: startOfDay(last60Days) } }).sort({ date: 1 }).lean(),
    Task.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(120).lean(),
    Habit.find({ user: req.user.id }).lean(),
    WorkoutLog.find({ user: req.user.id, date: { $gte: startOfDay(last60Days) } }).sort({ date: -1 }).lean(),
  ]);

  const dailyCalories = nutritionRows.map((row) => ({
    date: row.date.toISOString().slice(0, 10),
    consumed: row.caloriesConsumed,
    target: row.calorieTarget,
  }));

  const weeklyMap = {};
  nutritionRows.forEach((row) => {
    const date = new Date(row.date);
    const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
    if (!weeklyMap[weekKey]) {
      weeklyMap[weekKey] = { week: weekKey, calories: 0, target: 0 };
    }
    weeklyMap[weekKey].calories += row.caloriesConsumed;
    weeklyMap[weekKey].target += row.calorieTarget;
  });

  const weightProgress = weightRows.map((row) => ({
    date: row.date.toISOString().slice(0, 10),
    weight: row.weight,
  }));

  const deficitSurplus = nutritionRows.map((row) => ({
    date: row.date.toISOString().slice(0, 10),
    delta: row.calorieDelta,
  }));

  const calorieHeatmap = dailyCalories.slice(-56).map((row) => {
    const ratio = row.target ? row.consumed / row.target : 0;
    return {
      date: row.date,
      calories: row.consumed,
      level: Math.min(4, Math.max(0, Math.round(ratio * 4))),
    };
  });

  const habitTimeline = habits.map((habit) => {
    const keys = new Set((habit.completionDates || []).map((date) => startOfDay(date).toISOString().slice(0, 10)));
    const series = [];

    for (let i = habitWindow - 1; i >= 0; i -= 1) {
      const cursor = new Date();
      cursor.setDate(cursor.getDate() - i);
      const key = cursor.toISOString().slice(0, 10);
      series.push({ date: key, done: keys.has(key) });
    }

    return {
      id: habit._id,
      name: habit.name,
      category: habit.category,
      streak: habit.streak,
      longestStreak: habit.longestStreak,
      series,
    };
  });

  const disciplineTrend = buildDisciplineTrend({
    nutritionRows,
    dailyLogs,
    tasks,
    habits,
    workoutLogs,
    profile,
    days: 30,
  });

  const averageConsumed =
    nutritionRows.filter((row) => toNumber(row.caloriesConsumed) > 0).reduce((sum, row, _, rows) => sum + toNumber(row.caloriesConsumed) / rows.length, 0) ||
    profile.caloriePlan.dailyCalorieGoal;

  const currentWeightKg = weightProgress.length ? weightProgress[weightProgress.length - 1].weight : profile.currentWeightKg;
  const growthPrediction = predictBodyGrowth({
    profile,
    currentWeightKg,
    targetWeightKg: profile.targetWeightKg,
    dailyCalories: averageConsumed,
    workoutsPerWeek: profile.lifestyle.workoutDaysPerWeek,
    durationWeeks: 12,
  });

  return res.json({
    dailyCalories,
    weeklyIntake: Object.values(weeklyMap),
    weightProgress,
    deficitSurplus,
    calorieHeatmap,
    habitTimeline,
    disciplineTrend,
    bodyProjection: growthPrediction.projection,
    growthPrediction,
    simulationDefaults: {
      dailyCalories: growthPrediction.dailyCalories,
      workoutsPerWeek: profile.lifestyle.workoutDaysPerWeek,
    },
  });
}

async function generateMealPlanPreview(req, res) {
  const profile = await UserProfile.findOne({ user: req.user.id }).lean();

  if (!profile) {
    return res.status(400).json({ message: 'Complete onboarding before generating a meal plan.' });
  }

  const calorieTarget = Math.max(1200, toNumber(req.body?.calorieTarget, profile.caloriePlan.dailyCalorieGoal));
  const dietType = normalizeDietType(req.body?.dietType || profile.dietPreference);
  const mealFrequency = clamp(toNumber(req.body?.mealFrequency, profile.lifestyle.mealFrequency), 3, 6);
  const mealSchedule = {
    breakfastTime: req.body?.mealTiming?.breakfastTime || profile.dailySchedule.breakfastTime,
    snackTime: req.body?.mealTiming?.snackTime || profile.dailySchedule.snackTime,
    lunchTime: req.body?.mealTiming?.lunchTime || profile.dailySchedule.lunchTime,
    eveningSnackTime: req.body?.mealTiming?.eveningSnackTime || profile.dailySchedule.eveningSnackTime,
    dinnerTime: req.body?.mealTiming?.dinnerTime || profile.dailySchedule.dinnerTime,
  };

  const mealDistribution = buildMealDistribution({
    dailyCalorieGoal: calorieTarget,
    dailySchedule: mealSchedule,
    mealFrequency,
  });

  const foodPool = await fetchFoodPoolForMeals(mealDistribution);
  const mealPlan = generateMealPlan({
    foods: foodPool,
    calorieTarget,
    dietType,
    mealDistribution,
  });

  return res.json({ mealPlan });
}

async function simulateFutureBody(req, res) {
  const profile = await UserProfile.findOne({ user: req.user.id }).lean();

  if (!profile) {
    return res.status(400).json({ message: 'Complete onboarding before running body simulation.' });
  }

  const latestWeightLog = await DailyLog.findOne({ user: req.user.id, weight: { $gt: 0 } }).sort({ date: -1 }).lean();
  const dailyCalories = Math.max(1000, toNumber(req.body?.dailyCalories, profile.caloriePlan.dailyCalorieGoal));
  const workoutsPerWeek = clamp(toNumber(req.body?.workoutsPerWeek, profile.lifestyle.workoutDaysPerWeek), 0, 14);
  const durationWeeks = clamp(toNumber(req.body?.durationWeeks, 12), 4, 24);

  const simulation = predictBodyGrowth({
    profile,
    currentWeightKg: latestWeightLog?.weight || profile.currentWeightKg,
    targetWeightKg: profile.targetWeightKg,
    dailyCalories,
    workoutsPerWeek,
    durationWeeks,
  });

  return res.json({
    inputs: {
      dailyCalories,
      workoutsPerWeek,
      durationWeeks,
    },
    simulation,
  });
}

module.exports = {
  getOnboardingStatus,
  saveOnboarding,
  searchFoods,
  addMealEntry,
  getMealEntries,
  getDailyNutritionDashboard,
  getNutritionAnalytics,
  generateMealPlanPreview,
  simulateFutureBody,
};



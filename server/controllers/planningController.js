const FoodDatabase = require('../models/FoodDatabase');
const UserProfile = require('../models/UserProfile');
const DailyLog = require('../models/DailyLog');
const DailyNutrition = require('../models/DailyNutrition');
const { generateMealPlan } = require('../ai/mealGenerator');
const { buildWeeklyGroceryPlan } = require('../ai/groceryPlanner');
const { generateBudgetMealPlan } = require('../ai/budgetMealPlanner');
const { buildBodyVisualization } = require('../ai/bodyVisualizer');
const { buildRoutine, spreadWorkoutDays } = require('../ai/routineBuilder');
const { predictBodyGrowth } = require('../ai/bodyGrowthPredictor');
const { buildMealDistribution, startOfDay } = require('../utils/nutritionEngine');
const { normalizeDietType, toNumber } = require('../ai/nutritionCalculator');

async function getProfile(userId) {
  const profile = await UserProfile.findOne({ user: userId }).lean();
  return profile;
}

async function resolveSelectedFoods(selectedFoods = []) {
  if (!Array.isArray(selectedFoods) || !selectedFoods.length) return [];
  const names = selectedFoods.map((item) => (typeof item === 'string' ? item : item?.name)).filter(Boolean);
  const ids = selectedFoods.map((item) => (typeof item === 'object' ? item?.id || item?._id : null)).filter(Boolean);
  const queries = [];
  if (names.length) {
    queries.push({ name: { $in: names.map((name) => new RegExp(`^${String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) } });
  }
  if (ids.length) {
    queries.push({ _id: { $in: ids } });
  }
  if (!queries.length) return [];
  return FoodDatabase.find({ $or: queries }).limit(60).lean();
}

async function buildDefaultMealPlan(profile, overrides = {}) {
  const calorieTarget = Math.max(1200, toNumber(overrides.calorieTarget, profile.caloriePlan.dailyCalorieGoal));
  const mealDistribution = buildMealDistribution({
    dailyCalorieGoal: calorieTarget,
    dailySchedule: overrides.mealTiming || profile.dailySchedule,
    mealFrequency: toNumber(overrides.mealFrequency, profile.lifestyle.mealFrequency),
  });
  const foods = await FoodDatabase.find({ mealTags: { $in: mealDistribution.map((meal) => meal.mealType) } }).sort({ popularityScore: -1 }).limit(6000).lean();
  return generateMealPlan({ foods, calorieTarget, dietType: overrides.dietType || profile.dietPreference, mealDistribution });
}

async function getOverview(req, res) {
  const profile = await getProfile(req.user.id);
  if (!profile) {
    return res.status(400).json({ message: 'Complete onboarding before opening planning modules.' });
  }

  const [mealPlan, latestWeightLog] = await Promise.all([
    buildDefaultMealPlan(profile),
    DailyLog.findOne({ user: req.user.id, weight: { $gt: 0 } }).sort({ date: -1 }).lean(),
  ]);

  const groceryPlan = buildWeeklyGroceryPlan({ mealPlan, weeklyCalorieNeeds: profile.caloriePlan.dailyCalorieGoal * 7 });
  const routine = buildRoutine({
    wakeTime: req.query.wakeTime || '07:00',
    workHours: { start: '09:00', end: '18:00' },
    mealSchedule: profile.dailySchedule,
    workoutDays: spreadWorkoutDays(profile.lifestyle.workoutDaysPerWeek),
    sleepTime: profile.lifestyle.sleepTime,
  });
  const bodySnapshot = predictBodyGrowth({
    profile,
    currentWeightKg: latestWeightLog?.weight || profile.currentWeightKg,
    targetWeightKg: profile.targetWeightKg,
    dailyCalories: profile.caloriePlan.dailyCalorieGoal,
    workoutsPerWeek: profile.lifestyle.workoutDaysPerWeek,
    durationWeeks: 12,
  });

  return res.json({ groceryPlan, routine, bodySnapshot });
}

async function generateGroceryPlan(req, res) {
  const profile = await getProfile(req.user.id);
  if (!profile) {
    return res.status(400).json({ message: 'Complete onboarding before generating a grocery plan.' });
  }

  const mealPlan = req.body?.mealPlan?.meals?.length ? req.body.mealPlan : await buildDefaultMealPlan(profile, req.body || {});
  const selectedFoods = await resolveSelectedFoods(req.body?.selectedFoods || []);
  const groceryPlan = buildWeeklyGroceryPlan({
    mealPlan,
    weeklyCalorieNeeds: toNumber(req.body?.weeklyCalorieNeeds, profile.caloriePlan.dailyCalorieGoal * 7),
    selectedFoods,
  });

  return res.json({ groceryPlan });
}

async function generateBudgetPlan(req, res) {
  const profile = await getProfile(req.user.id);
  if (!profile) {
    return res.status(400).json({ message: 'Complete onboarding before generating a budget meal plan.' });
  }

  const foods = await FoodDatabase.find({}).sort({ popularityScore: -1 }).limit(8000).lean();
  const mealDistribution = buildMealDistribution({
    dailyCalorieGoal: Math.max(1200, toNumber(req.body?.calorieTarget, profile.caloriePlan.dailyCalorieGoal)),
    dailySchedule: profile.dailySchedule,
    mealFrequency: toNumber(req.body?.mealFrequency, profile.lifestyle.mealFrequency),
  });

  const budgetMealPlan = generateBudgetMealPlan({
    foods,
    dailyBudget: toNumber(req.body?.dailyBudget, 120),
    calorieTarget: Math.max(1200, toNumber(req.body?.calorieTarget, profile.caloriePlan.dailyCalorieGoal)),
    dietType: normalizeDietType(req.body?.dietType || profile.dietPreference),
    mealDistribution,
  });

  return res.json({ budgetMealPlan });
}

async function getBodyAnalytics(req, res) {
  const profile = await getProfile(req.user.id);
  if (!profile) {
    return res.status(400).json({ message: 'Complete onboarding before viewing body analytics.' });
  }

  const last60Days = new Date();
  last60Days.setDate(last60Days.getDate() - 59);
  const [nutritionRows, weightRows, latestWeightLog] = await Promise.all([
    DailyNutrition.find({ user: req.user.id, date: { $gte: startOfDay(last60Days) } }).sort({ date: 1 }).lean(),
    DailyLog.find({ user: req.user.id, date: { $gte: startOfDay(last60Days) }, weight: { $gt: 0 } }).sort({ date: 1 }).lean(),
    DailyLog.findOne({ user: req.user.id, weight: { $gt: 0 } }).sort({ date: -1 }).lean(),
  ]);

  const weightProgress = weightRows.map((row) => ({ date: row.date.toISOString().slice(0, 10), weight: row.weight }));
  const deficitSurplus = nutritionRows.map((row) => ({ date: row.date.toISOString().slice(0, 10), delta: row.calorieDelta }));
  const averageCalories = nutritionRows.length
    ? nutritionRows.reduce((sum, row) => sum + toNumber(row.caloriesConsumed || row.calorieTarget), 0) / nutritionRows.length
    : profile.caloriePlan.dailyCalorieGoal;

  const growthPrediction = predictBodyGrowth({
    profile,
    currentWeightKg: latestWeightLog?.weight || profile.currentWeightKg,
    targetWeightKg: profile.targetWeightKg,
    dailyCalories: averageCalories,
    workoutsPerWeek: profile.lifestyle.workoutDaysPerWeek,
    durationWeeks: toNumber(req.query.durationWeeks, 12),
  });

  const bodyAnalytics = buildBodyVisualization({
    weightProgress,
    deficitSurplus,
    growthPrediction,
    currentWeightKg: latestWeightLog?.weight || profile.currentWeightKg,
    targetWeightKg: profile.targetWeightKg,
  });

  return res.json({ bodyAnalytics });
}

async function generateRoutine(req, res) {
  const profile = await getProfile(req.user.id);
  if (!profile) {
    return res.status(400).json({ message: 'Complete onboarding before generating a routine.' });
  }

  const routine = buildRoutine({
    wakeTime: req.body?.wakeTime || '07:00',
    workHours: {
      start: req.body?.workHours?.start || '09:00',
      end: req.body?.workHours?.end || '18:00',
    },
    mealSchedule: {
      breakfastTime: req.body?.mealSchedule?.breakfastTime || profile.dailySchedule.breakfastTime,
      snackTime: req.body?.mealSchedule?.snackTime || profile.dailySchedule.eveningSnackTime,
      lunchTime: req.body?.mealSchedule?.lunchTime || profile.dailySchedule.lunchTime,
      dinnerTime: req.body?.mealSchedule?.dinnerTime || profile.dailySchedule.dinnerTime,
      eveningSnackTime: req.body?.mealSchedule?.eveningSnackTime || profile.dailySchedule.eveningSnackTime,
    },
    workoutDays: Array.isArray(req.body?.workoutDays) && req.body.workoutDays.length ? req.body.workoutDays : spreadWorkoutDays(profile.lifestyle.workoutDaysPerWeek),
    sleepTime: req.body?.sleepTime || profile.lifestyle.sleepTime,
  });

  return res.json({ routine });
}

module.exports = {
  getOverview,
  generateGroceryPlan,
  generateBudgetPlan,
  getBodyAnalytics,
  generateRoutine,
};

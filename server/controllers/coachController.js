const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const DailyLog = require('../models/DailyLog');
const DailyNutrition = require('../models/DailyNutrition');
const WorkoutLog = require('../models/WorkoutLog');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const FoodDatabase = require('../models/FoodDatabase');
const { generateCoachInsights, generateCoachReply } = require('../ai/coachEngine');
const { generateMealPlan } = require('../ai/mealGenerator');
const { buildMealDistribution, startOfDay } = require('../utils/nutritionEngine');

function profileFromOnboarding(user, profile) {
  return {
    age: profile.age,
    heightCm: profile.heightCm,
    currentWeightKg: profile.currentWeightKg,
    targetWeightKg: profile.targetWeightKg,
    dietPreference: profile.dietPreference,
    goalSetting: profile.goalSetting,
    caloriePlan: profile.caloriePlan,
    lifestyle: profile.lifestyle,
    weight: profile.currentWeightKg,
    goalWeight: profile.targetWeightKg,
    fitnessLevel:
      user.fitnessLevel ||
      (profile.lifestyle.workoutDaysPerWeek >= 5
        ? 'advanced'
        : profile.lifestyle.workoutDaysPerWeek >= 3
          ? 'intermediate'
          : 'beginner'),
  };
}

async function loadCoachContext(userId) {
  const [user, userProfile, dailyLogs, nutritionRows, workoutLogs, tasks, habits] = await Promise.all([
    User.findById(userId),
    UserProfile.findOne({ user: userId }),
    DailyLog.find({ user: userId }).sort({ date: -1 }).limit(45).lean(),
    DailyNutrition.find({ user: userId }).sort({ date: -1 }).limit(30).lean(),
    WorkoutLog.find({ user: userId }).sort({ date: -1 }).limit(30).lean(),
    Task.find({ user: userId }).sort({ createdAt: -1 }).limit(80).lean(),
    Habit.find({ user: userId }).lean(),
  ]);

  if (!user) {
    return { user: null };
  }

  if (!userProfile) {
    return { user, userProfile: null };
  }

  const mealDistribution = (nutritionRows[0]?.mealDistribution || []).length
    ? nutritionRows[0].mealDistribution.map((meal) => ({
        mealType: meal.mealType,
        label:
          meal.mealType === 'mid_morning_snack'
            ? 'Mid Morning Snack'
            : meal.mealType === 'evening_snack'
              ? 'Evening Snack'
              : meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1),
        scheduledTime: meal.scheduledTime,
        targetCalories: meal.targetCalories,
      }))
    : buildMealDistribution({
        dailyCalorieGoal: userProfile.caloriePlan.dailyCalorieGoal,
        dailySchedule: userProfile.dailySchedule,
        mealFrequency: userProfile.lifestyle.mealFrequency,
      });

  const foodPool = await FoodDatabase.find({ mealTags: { $in: mealDistribution.map((meal) => meal.mealType) } })
    .sort({ popularityScore: -1 })
    .limit(5000)
    .lean();

  const mealPlan = generateMealPlan({
    foods: foodPool,
    calorieTarget: userProfile.caloriePlan.dailyCalorieGoal,
    dietType: userProfile.dietPreference,
    mealDistribution,
  });

  return {
    user,
    userProfile,
    dailyLogs,
    nutritionRows,
    workoutLogs,
    tasks,
    habits,
    mealPlan,
  };
}

async function getCoachInsights(req, res) {
  const userId = req.user.id;
  const context = await loadCoachContext(userId);

  if (!context.user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (!context.userProfile) {
    return res.json({
      onboardingRequired: true,
      insights: {
        suggestions: ['Complete onboarding to unlock fully personalized nutrition, prediction, and discipline intelligence.'],
        behavior: {
          disciplineScore: 0,
          failureRisk: 0,
          workoutSkipStreak: 0,
          missedHabits: [],
        },
        motivation: {
          headline: 'Onboarding Required',
          line: 'Your AI coach needs your real metrics before generating guidance.',
          actionOfDay: 'Complete onboarding now.',
          growthSignal: 'No assumptions are used.',
        },
      },
    });
  }

  const insights = generateCoachInsights({
    profile: profileFromOnboarding(context.user, context.userProfile),
    dailyLogs: context.dailyLogs,
    workoutLogs: context.workoutLogs,
    tasks: context.tasks,
    habits: context.habits,
    dailyNutrition: context.nutritionRows[0] || {},
    nutritionRows: [...context.nutritionRows].reverse(),
    mealPlan: context.mealPlan,
  });

  return res.json({
    onboardingRequired: false,
    insights,
    mealPlan: context.mealPlan,
  });
}

async function postCoachChat(req, res) {
  const message = String(req.body?.message || '').trim();

  if (!message) {
    return res.status(400).json({ message: 'Message is required.' });
  }

  const context = await loadCoachContext(req.user.id);

  if (!context.user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (!context.userProfile) {
    return res.status(400).json({ message: 'Complete onboarding before using the AI coach chat.' });
  }

  const insights = generateCoachInsights({
    profile: profileFromOnboarding(context.user, context.userProfile),
    dailyLogs: context.dailyLogs,
    workoutLogs: context.workoutLogs,
    tasks: context.tasks,
    habits: context.habits,
    dailyNutrition: context.nutritionRows[0] || {},
    nutritionRows: [...context.nutritionRows].reverse(),
    mealPlan: context.mealPlan,
  });

  const reply = generateCoachReply({
    message,
    insights,
    mealPlan: context.mealPlan,
  });

  return res.json({
    reply,
    insights,
  });
}

module.exports = {
  getCoachInsights,
  postCoachChat,
};

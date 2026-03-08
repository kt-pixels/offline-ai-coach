const User = require("../models/User");
const DailyLog = require("../models/DailyLog");
const MealLog = require("../models/MealLog");
const WorkoutLog = require("../models/WorkoutLog");
const Task = require("../models/Task");
const Habit = require("../models/Habit");
const { calculateTargets } = require("../ai/dietEngine");

function startOfDay(input) {
  const date = input ? new Date(input) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(input) {
  const date = startOfDay(input);
  date.setHours(23, 59, 59, 999);
  return date;
}

function dayKey(input) {
  const date = startOfDay(input);
  return date.toISOString().slice(0, 10);
}

function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function calculateStreaks(completionDates) {
  const uniqueKeys = [
    ...new Set((completionDates || []).map((d) => dayKey(d))),
  ].sort();
  const keySet = new Set(uniqueKeys);

  let current = 0;
  let cursor = new Date();

  while (keySet.has(dayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  let longest = 0;
  let running = 0;
  let prevDate = null;

  uniqueKeys.forEach((key) => {
    const date = new Date(key);

    if (!prevDate) {
      running = 1;
      longest = 1;
    } else {
      const diff = Math.round(
        (date.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000),
      );
      running = diff === 1 ? running + 1 : 1;
      longest = Math.max(longest, running);
    }

    prevDate = date;
  });

  return { current, longest };
}

// Recompute points, level, and streak from persisted behavior data.
async function refreshGamification(userId) {
  const [user, tasks, habits, workouts] = await Promise.all([
    User.findById(userId),
    Task.find({ user: userId, completed: true }).select("completedAt"),
    Habit.find({ user: userId }).select("completionDates"),
    WorkoutLog.find({ user: userId, completed: true }).select("date"),
  ]);

  if (!user) return null;

  const habitCompletions = habits.reduce(
    (sum, habit) => sum + (habit.completionDates?.length || 0),
    0,
  );
  const points =
    tasks.length * 12 + habitCompletions * 8 + workouts.length * 20;
  const level = Math.max(1, Math.floor(points / 250) + 1);

  const activeDays = new Set();
  tasks.forEach((task) => {
    if (task.completedAt) activeDays.add(dayKey(task.completedAt));
  });

  habits.forEach((habit) => {
    (habit.completionDates || []).forEach((date) =>
      activeDays.add(dayKey(date)),
    );
  });

  workouts.forEach((workout) => {
    activeDays.add(dayKey(workout.date));
  });

  let streak = 0;
  const cursor = new Date();

  while (activeDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  user.points = points;
  user.level = level;
  user.currentStreak = streak;
  user.longestStreak = Math.max(user.longestStreak || 0, streak);

  await user.save();

  return user;
}

async function adjustTodayLogCounters(
  userId,
  { taskDelta = 0, habitDelta = 0 } = {},
) {
  if (!taskDelta && !habitDelta) return;

  const today = startOfDay();
  const update = {
    $setOnInsert: {
      user: userId,
      date: today,
    },
    $inc: {},
  };

  if (taskDelta) update.$inc.tasksCompleted = taskDelta;
  if (habitDelta) update.$inc.habitsCompleted = habitDelta;

  const log = await DailyLog.findOneAndUpdate(
    { user: userId, date: today },
    update,
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  if (log.tasksCompleted < 0) log.tasksCompleted = 0;
  if (log.habitsCompleted < 0) log.habitsCompleted = 0;

  await log.save();
}

async function getDashboard(req, res) {
  const userId = req.user.id;

  const [dailyLogs, tasks, habits, meals, workouts, updatedUser] =
    await Promise.all([
      DailyLog.find({ user: userId }).sort({ date: -1 }).limit(45),
      Task.find({ user: userId }).sort({ createdAt: -1 }).limit(30),
      Habit.find({ user: userId }).sort({ createdAt: -1 }),
      MealLog.find({ user: userId }).sort({ date: -1 }).limit(15),
      WorkoutLog.find({ user: userId }).sort({ date: -1 }).limit(15),
      refreshGamification(userId),
    ]);

  const user = updatedUser || (await User.findById(userId));

  if (!user?.onboardingCompleted) {
    return res.status(400).json({
      message: 'Complete onboarding before generating dashboard analytics.',
      onboardingRequired: true
    });
  }

  const today = startOfDay();
  const todayLog = dailyLogs.find((log) => dayKey(log.date) === dayKey(today));

  const targetInfo = calculateTargets(user, dailyLogs.slice(0, 14));

  const completionRate = todayLog?.tasksPlanned
    ? Math.round(
        ((todayLog.tasksCompleted || 0) / Math.max(todayLog.tasksPlanned, 1)) *
          100,
      )
    : Math.round(
        (tasks.filter((task) => task.completed).length /
          Math.max(tasks.length, 1)) *
          100,
      );

  const habitCompletionRate = todayLog?.habitsTarget
    ? Math.round(
        ((todayLog.habitsCompleted || 0) / Math.max(todayLog.habitsTarget, 1)) *
          100,
      )
    : 0;

  const chronologicalLogs = [...dailyLogs].reverse();

  const weightHistory = chronologicalLogs
    .filter((log) => log.weight)
    .map((log) => ({
      date: dayKey(log.date),
      weight: log.weight,
    }));

  const calorieHistory = chronologicalLogs.map((log) => ({
    date: dayKey(log.date),
    calories: log.calories || 0,
    target: targetInfo.targetCalories,
  }));

  const habitTimeline = habits.map((habit) => {
    const keys = new Set(
      (habit.completionDates || []).map((date) => dayKey(date)),
    );
    const series = [];

    for (let i = 13; i >= 0; i -= 1) {
      const cursor = new Date();
      cursor.setDate(cursor.getDate() - i);
      const key = dayKey(cursor);
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

  const calorieHeatmap = [];
  for (let i = 27; i >= 0; i -= 1) {
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - i);
    const key = dayKey(cursor);
    const log = dailyLogs.find((item) => dayKey(item.date) === key);
    const calories = log?.calories || 0;
    const ratio = calories / Math.max(targetInfo.targetCalories, 1);

    calorieHeatmap.push({
      date: key,
      calories,
      level: clamp(Math.round(ratio * 4), 0, 4),
    });
  }

  return res.json({
    profile: {
      id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      height: user.height,
      weight: user.weight,
      goalWeight: user.goalWeight,
      dietPreference: user.dietPreference,
      budget: user.budget,
      fitnessLevel: user.fitnessLevel,
    },
    stats: {
      todayCalories: todayLog?.calories || 0,
      todayProtein: todayLog?.protein || 0,
      todayCarbs: todayLog?.carbs || 0,
      todaySleep: todayLog?.sleepHours || 0,
      taskCompletionRate: completionRate,
      habitCompletionRate,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      points: user.points,
      level: user.level,
      calorieTarget: targetInfo.targetCalories,
      proteinTarget: targetInfo.targetProtein,
    },
    charts: {
      weightHistory,
      calorieHistory,
      habitTimeline,
      calorieHeatmap,
    },
    tasks,
    habits,
    latestLog: todayLog || null,
    recentMeals: meals,
    recentWorkouts: workouts,
  });
}

async function listDailyLogs(req, res) {
  const logs = await DailyLog.find({ user: req.user.id })
    .sort({ date: -1 })
    .limit(45);
  res.json({ logs });
}

async function upsertDailyLog(req, res) {
  const date = startOfDay(req.body.date);
  const userId = req.user.id;

  const payload = {
    weight: toNumber(req.body.weight),
    calories: toNumber(req.body.calories),
    protein: toNumber(req.body.protein),
    carbs: toNumber(req.body.carbs),
    fats: toNumber(req.body.fats),
    sleepHours: toNumber(req.body.sleepHours),
    workoutDone: Boolean(req.body.workoutDone),
    workoutDuration: toNumber(req.body.workoutDuration),
    tasksPlanned: toNumber(req.body.tasksPlanned),
    tasksCompleted: toNumber(req.body.tasksCompleted),
    habitsTarget: toNumber(req.body.habitsTarget),
    habitsCompleted: toNumber(req.body.habitsCompleted),
    notes: req.body.notes || "",
  };

  const log = await DailyLog.findOneAndUpdate(
    { user: userId, date },
    { $set: payload, $setOnInsert: { user: userId, date } },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  if (payload.weight > 0) {
    await User.findByIdAndUpdate(userId, { weight: payload.weight });
  }

  return res.status(201).json({ log });
}

async function listMeals(req, res) {
  const meals = await MealLog.find({ user: req.user.id })
    .sort({ date: -1 })
    .limit(30);
  res.json({ meals });
}

async function createMeal(req, res) {
  const meal = await MealLog.create({
    user: req.user.id,
    date: req.body.date ? new Date(req.body.date) : new Date(),
    name: req.body.name,
    calories: toNumber(req.body.calories),
    protein: toNumber(req.body.protein),
    carbs: toNumber(req.body.carbs),
    fats: toNumber(req.body.fats),
    cost: toNumber(req.body.cost),
    isVegetarian: req.body.isVegetarian !== false,
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
  });

  const day = startOfDay(meal.date);

  await DailyLog.findOneAndUpdate(
    { user: req.user.id, date: day },
    {
      $setOnInsert: { user: req.user.id, date: day },
      $inc: {
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  res.status(201).json({ meal });
}

async function listWorkouts(req, res) {
  const workouts = await WorkoutLog.find({ user: req.user.id })
    .sort({ date: -1 })
    .limit(20);
  res.json({ workouts });
}

async function createWorkout(req, res) {
  const workout = await WorkoutLog.create({
    user: req.user.id,
    date: req.body.date ? new Date(req.body.date) : new Date(),
    title: req.body.title,
    level: req.body.level || "beginner",
    duration: toNumber(req.body.duration, 30),
    intensity: toNumber(req.body.intensity, 5),
    focus: req.body.focus || "full-body",
    completed: req.body.completed !== false,
    exercises: Array.isArray(req.body.exercises) ? req.body.exercises : [],
  });

  const day = startOfDay(workout.date);

  await DailyLog.findOneAndUpdate(
    { user: req.user.id, date: day },
    {
      $setOnInsert: { user: req.user.id, date: day },
      $set: {
        workoutDone: workout.completed,
        workoutDuration: workout.duration,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  await refreshGamification(req.user.id);

  res.status(201).json({ workout });
}

async function listTasks(req, res) {
  const tasks = await Task.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ tasks });
}

async function createTask(req, res) {
  if (!req.body.title) {
    return res.status(400).json({ message: "Task title is required." });
  }

  const task = await Task.create({
    user: req.user.id,
    title: req.body.title,
    description: req.body.description || "",
    disciplineArea: req.body.disciplineArea || "productivity",
    priority: req.body.priority || "medium",
    dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
  });

  res.status(201).json({ task });
}

async function toggleTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  const previousCompleted = task.completed;
  const previousCompletedAt = task.completedAt;

  task.completed = !task.completed;
  task.completedAt = task.completed ? new Date() : null;

  await task.save();

  let delta = 0;

  if (
    !previousCompleted &&
    task.completed &&
    dayKey(task.completedAt) === dayKey(new Date())
  ) {
    delta = 1;
  }

  if (
    previousCompleted &&
    !task.completed &&
    previousCompletedAt &&
    dayKey(previousCompletedAt) === dayKey(new Date())
  ) {
    delta = -1;
  }

  if (delta !== 0) {
    await adjustTodayLogCounters(req.user.id, { taskDelta: delta });
  }

  await refreshGamification(req.user.id);

  return res.json({ task });
}

async function deleteTask(req, res) {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  if (task.completedAt && dayKey(task.completedAt) === dayKey(new Date())) {
    await adjustTodayLogCounters(req.user.id, { taskDelta: -1 });
  }

  await refreshGamification(req.user.id);

  return res.json({ message: "Task deleted." });
}

async function listHabits(req, res) {
  const habits = await Habit.find({ user: req.user.id }).sort({
    createdAt: -1,
  });
  res.json({ habits });
}

async function createHabit(req, res) {
  if (!req.body.name) {
    return res.status(400).json({ message: "Habit name is required." });
  }

  const habit = await Habit.create({
    user: req.user.id,
    name: req.body.name,
    category: req.body.category || "discipline",
    targetPerDay: toNumber(req.body.targetPerDay, 1),
  });

  const count = await Habit.countDocuments({ user: req.user.id });
  const today = startOfDay();

  await DailyLog.findOneAndUpdate(
    { user: req.user.id, date: today },
    {
      $setOnInsert: { user: req.user.id, date: today },
      $set: { habitsTarget: count },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return res.status(201).json({ habit });
}

async function toggleHabit(req, res) {
  const habit = await Habit.findOne({ _id: req.params.id, user: req.user.id });

  if (!habit) {
    return res.status(404).json({ message: "Habit not found." });
  }

  const targetDate = startOfDay(req.body.date || new Date());
  const key = dayKey(targetDate);
  const index = (habit.completionDates || []).findIndex(
    (date) => dayKey(date) === key,
  );

  let delta = 0;

  if (index >= 0) {
    habit.completionDates.splice(index, 1);
    delta = dayKey(targetDate) === dayKey(new Date()) ? -1 : 0;
  } else {
    habit.completionDates.push(targetDate);
    habit.lastCompletedAt = targetDate;
    delta = dayKey(targetDate) === dayKey(new Date()) ? 1 : 0;
  }

  const streaks = calculateStreaks(habit.completionDates);
  habit.streak = streaks.current;
  habit.longestStreak = streaks.longest;

  await habit.save();

  if (delta !== 0) {
    await adjustTodayLogCounters(req.user.id, { habitDelta: delta });
  }

  await refreshGamification(req.user.id);

  return res.json({ habit });
}

async function deleteHabit(req, res) {
  const habit = await Habit.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!habit) {
    return res.status(404).json({ message: "Habit not found." });
  }

  const count = await Habit.countDocuments({ user: req.user.id });
  const today = startOfDay();

  await DailyLog.findOneAndUpdate(
    { user: req.user.id, date: today },
    {
      $setOnInsert: { user: req.user.id, date: today },
      $set: { habitsTarget: count },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  await refreshGamification(req.user.id);

  return res.json({ message: "Habit deleted." });
}

module.exports = {
  getDashboard,
  listDailyLogs,
  upsertDailyLog,
  listMeals,
  createMeal,
  listWorkouts,
  createWorkout,
  listTasks,
  createTask,
  toggleTask,
  deleteTask,
  listHabits,
  createHabit,
  toggleHabit,
  deleteHabit,
};






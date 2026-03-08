const express = require('express');
const {
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
  deleteHabit
} = require('../controllers/lifeController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(protect);

router.get('/dashboard', asyncHandler(getDashboard));

router.get('/daily-logs', asyncHandler(listDailyLogs));
router.post('/daily-logs', asyncHandler(upsertDailyLog));

router.get('/meals', asyncHandler(listMeals));
router.post('/meals', asyncHandler(createMeal));

router.get('/workouts', asyncHandler(listWorkouts));
router.post('/workouts', asyncHandler(createWorkout));

router.get('/tasks', asyncHandler(listTasks));
router.post('/tasks', asyncHandler(createTask));
router.patch('/tasks/:id/toggle', asyncHandler(toggleTask));
router.delete('/tasks/:id', asyncHandler(deleteTask));

router.get('/habits', asyncHandler(listHabits));
router.post('/habits', asyncHandler(createHabit));
router.post('/habits/:id/toggle', asyncHandler(toggleHabit));
router.delete('/habits/:id', asyncHandler(deleteHabit));

module.exports = router;

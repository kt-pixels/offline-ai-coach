const express = require('express');
const {
  getOnboardingStatus,
  saveOnboarding,
  searchFoods,
  addMealEntry,
  getMealEntries,
  getDailyNutritionDashboard,
  getNutritionAnalytics,
  generateMealPlanPreview,
  simulateFutureBody,
} = require('../controllers/nutritionController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(protect);

router.get('/onboarding', asyncHandler(getOnboardingStatus));
router.post('/onboarding', asyncHandler(saveOnboarding));

router.get('/foods/search', asyncHandler(searchFoods));
router.post('/meals', asyncHandler(addMealEntry));
router.get('/meals', asyncHandler(getMealEntries));
router.post('/meal-plan', asyncHandler(generateMealPlanPreview));
router.post('/simulation', asyncHandler(simulateFutureBody));

router.get('/dashboard', asyncHandler(getDailyNutritionDashboard));
router.get('/analytics', asyncHandler(getNutritionAnalytics));

module.exports = router;

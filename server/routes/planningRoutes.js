const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const {
  getOverview,
  generateGroceryPlan,
  generateBudgetPlan,
  getBodyAnalytics,
  generateRoutine,
} = require('../controllers/planningController');

const router = express.Router();

router.use(protect);
router.get('/overview', asyncHandler(getOverview));
router.post('/grocery', asyncHandler(generateGroceryPlan));
router.post('/budget-meals', asyncHandler(generateBudgetPlan));
router.get('/body-analytics', asyncHandler(getBodyAnalytics));
router.post('/routine', asyncHandler(generateRoutine));

module.exports = router;

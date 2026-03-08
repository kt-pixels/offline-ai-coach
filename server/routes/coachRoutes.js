const express = require('express');
const { getCoachInsights, postCoachChat } = require('../controllers/coachController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/insights', protect, asyncHandler(getCoachInsights));
router.post('/chat', protect, asyncHandler(postCoachChat));

module.exports = router;

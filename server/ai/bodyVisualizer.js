const { clamp, round, toNumber } = require('./nutritionCalculator');

function buildWeeklyBalance(deficitSurplus = []) {
  const buckets = [];
  for (let index = 0; index < deficitSurplus.length; index += 7) {
    const slice = deficitSurplus.slice(index, index + 7);
    if (!slice.length) continue;
    buckets.push({
      label: `Week ${buckets.length + 1}`,
      balance: round(slice.reduce((sum, item) => sum + toNumber(item.delta), 0), 0),
      averageDailyBalance: round(slice.reduce((sum, item) => sum + toNumber(item.delta), 0) / slice.length, 0),
    });
  }
  return buckets;
}

function buildBodyVisualization({ weightProgress = [], deficitSurplus = [], growthPrediction = {}, currentWeightKg = 0, targetWeightKg = 0 }) {
  const projection = growthPrediction.projection || [];
  const loggedTimeline = weightProgress.map((point) => ({ label: point.date, weightKg: toNumber(point.weight), source: 'logged' }));
  const predictedTimeline = projection.map((point) => ({ label: point.label, weightKg: toNumber(point.weightKg), source: 'projected' }));
  const weeklyCalorieBalance = buildWeeklyBalance(deficitSurplus.slice(-56));
  const startWeight = loggedTimeline.length ? loggedTimeline[0].weightKg : currentWeightKg;
  const currentWeight = loggedTimeline.length ? loggedTimeline[loggedTimeline.length - 1].weightKg : currentWeightKg;
  const targetWeight = toNumber(targetWeightKg, currentWeight);
  const predictedWeight = toNumber(growthPrediction.finalWeightKg, currentWeight);
  const totalDistance = Math.max(0.01, Math.abs(targetWeight - startWeight));
  const progressPercent = clamp(Math.round((Math.abs(currentWeight - startWeight) / totalDistance) * 100), 0, 100);
  const projectedProgressPercent = clamp(Math.round((Math.abs(predictedWeight - startWeight) / totalDistance) * 100), 0, 100);
  const avgWeeklyBalance = weeklyCalorieBalance.length
    ? round(weeklyCalorieBalance.reduce((sum, item) => sum + item.balance, 0) / weeklyCalorieBalance.length, 0)
    : 0;

  return {
    stats: {
      currentWeightKg: round(currentWeight, 1),
      targetWeightKg: round(targetWeight, 1),
      predictedWeightKg: round(predictedWeight, 1),
      progressPercent,
      projectedProgressPercent,
      expectedWeeklyChangeKg: round(growthPrediction.expectedWeeklyChangeKg, 2),
      averageWeeklyCalorieBalance: avgWeeklyBalance,
      confidence: round(growthPrediction.confidence, 0),
    },
    weightTimeline: loggedTimeline,
    predictionTimeline: predictedTimeline,
    calorieSurplusTimeline: deficitSurplus.slice(-30).map((row) => ({ date: row.date, delta: round(row.delta, 0) })),
    weeklyCalorieBalance,
    milestones: (growthPrediction.milestones || []).map((point) => ({
      label: point.label,
      week: point.week,
      weightKg: round(point.weightKg, 1),
      weeklyChangeKg: round(point.weeklyChangeKg, 2),
    })),
    summary: growthPrediction.summary || 'Body visualization updated from your logged weight and calorie balance.',
  };
}

module.exports = {
  buildBodyVisualization,
};

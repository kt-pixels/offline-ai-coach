// Lightweight trend predictor using local linear regression on bodyweight logs.
function linearRegression(series) {
  if (series.length < 2) {
    return { slope: 0, intercept: series[0]?.value || 0 };
  }

  const n = series.length;
  const sumX = series.reduce((sum, point) => sum + point.x, 0);
  const sumY = series.reduce((sum, point) => sum + point.value, 0);
  const sumXY = series.reduce((sum, point) => sum + point.x * point.value, 0);
  const sumX2 = series.reduce((sum, point) => sum + point.x * point.x, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

function predictProgress({ profile, dailyLogs = [] }) {
  const filtered = dailyLogs
    .filter((log) => Number(log.weight) > 0)
    .slice()
    .reverse()
    .map((log, index) => ({ x: index, value: Number(log.weight) }));

  if (!filtered.length) {
    return {
      weeklyGain: 0,
      predictedWeightIn2Weeks: Number(profile.weight || 0),
      status: 'insufficient-data',
      summary: 'Add at least 3 days of weight logs for reliable prediction.'
    };
  }

  const regression = linearRegression(filtered);
  const latestWeight = filtered[filtered.length - 1].value;
  const predictedWeightIn2Weeks = latestWeight + regression.slope * 14;
  const weeklyGain = regression.slope * 7;

  let status = 'on-track';
  let summary = 'Weight trajectory aligns with lean-gain targets.';

  if (weeklyGain < 0.15) {
    status = 'under-target';
    summary = 'Weight gain trend is too slow. Increase calories by 200-300 daily.';
  }

  if (weeklyGain > 0.7) {
    status = 'too-fast';
    summary = 'Weight gain is too aggressive. Slightly reduce surplus for cleaner bulk.';
  }

  return {
    weeklyGain: Number(weeklyGain.toFixed(2)),
    predictedWeightIn2Weeks: Number(predictedWeightIn2Weeks.toFixed(2)),
    status,
    summary
  };
}

module.exports = {
  predictProgress
};


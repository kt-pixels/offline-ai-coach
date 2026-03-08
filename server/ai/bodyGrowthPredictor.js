const {
  clamp,
  round,
  toNumber,
} = require('./nutritionCalculator');

const GOAL_RULES = {
  weight_gain: {
    efficiency: 0.92,
    minWeeklyChange: 0.1,
    maxWeeklyChange: 0.9,
  },
  muscle_gain: {
    efficiency: 0.78,
    minWeeklyChange: 0.08,
    maxWeeklyChange: 0.55,
  },
  weight_loss: {
    efficiency: 0.88,
    minWeeklyChange: -1,
    maxWeeklyChange: -0.1,
  },
};

function estimateMaintenanceCalories({ profile = {}, workoutsPerWeek }) {
  const baselineMaintenance =
    toNumber(profile?.caloriePlan?.maintenanceCalories) ||
    toNumber(profile.maintenanceCalories) ||
    toNumber(profile?.caloriePlan?.dailyCalorieGoal) ||
    2200;

  const baselineWorkouts =
    toNumber(profile?.lifestyle?.workoutDaysPerWeek) ||
    toNumber(profile.workoutDaysPerWeek) ||
    3;

  const effectiveWorkouts = clamp(toNumber(workoutsPerWeek, baselineWorkouts), 0, 14);
  const maintenanceShift = (effectiveWorkouts - baselineWorkouts) * 45;

  return round(baselineMaintenance + maintenanceShift, 0);
}

function calculateRequiredCalorieSurplus({
  currentWeightKg,
  targetWeightKg,
  goalSetting = 'weight_gain',
  timelineWeeks = 12,
}) {
  const current = toNumber(currentWeightKg);
  const target = toNumber(targetWeightKg, current);
  const rules = GOAL_RULES[goalSetting] || GOAL_RULES.weight_gain;
  const weeks = Math.max(1, toNumber(timelineWeeks, 12));
  const totalDelta = round(target - current, 2);

  if (Math.abs(totalDelta) < 0.05) {
    return {
      totalWeightChangeKg: 0,
      requiredWeeklyChangeKg: 0,
      requiredDailySurplus: 0,
    };
  }

  const unclampedWeeklyChange = totalDelta / weeks;
  const requiredWeeklyChangeKg = clamp(unclampedWeeklyChange, rules.minWeeklyChange, rules.maxWeeklyChange);
  const requiredDailySurplus = (requiredWeeklyChangeKg * 7700) / (7 * rules.efficiency);

  return {
    totalWeightChangeKg: round(totalDelta, 2),
    requiredWeeklyChangeKg: round(requiredWeeklyChangeKg, 2),
    requiredDailySurplus: round(requiredDailySurplus, 0),
  };
}

function predictBodyGrowth({
  profile = {},
  currentWeightKg,
  targetWeightKg,
  dailyCalories,
  workoutsPerWeek,
  durationWeeks = 12,
}) {
  const goalSetting = profile.goalSetting || 'weight_gain';
  const rules = GOAL_RULES[goalSetting] || GOAL_RULES.weight_gain;
  const maintenanceCalories = estimateMaintenanceCalories({ profile, workoutsPerWeek });
  const projectedDailyCalories = Math.max(1000, toNumber(dailyCalories, profile?.caloriePlan?.dailyCalorieGoal || maintenanceCalories));
  const rawDailySurplus = projectedDailyCalories - maintenanceCalories;

  let expectedWeeklyChangeKg = ((rawDailySurplus * 7) / 7700) * rules.efficiency;
  expectedWeeklyChangeKg = clamp(expectedWeeklyChangeKg, rules.minWeeklyChange, rules.maxWeeklyChange);

  const safeDuration = Math.max(1, Math.min(52, toNumber(durationWeeks, 12)));
  const startWeight = toNumber(currentWeightKg, profile.currentWeightKg || profile.weight || 0);
  const desiredTarget = toNumber(targetWeightKg, profile.targetWeightKg || profile.goalWeight || startWeight);
  const required = calculateRequiredCalorieSurplus({
    currentWeightKg: startWeight,
    targetWeightKg: desiredTarget,
    goalSetting,
    timelineWeeks: safeDuration,
  });

  let runningWeight = startWeight;
  const projection = [];

  for (let week = 1; week <= safeDuration; week += 1) {
    const adaptation = 1 - Math.min(0.28, (week - 1) * 0.018);
    let weeklyChange = expectedWeeklyChangeKg * adaptation;

    if (goalSetting === 'weight_loss') {
      if (runningWeight + weeklyChange < desiredTarget) {
        weeklyChange = desiredTarget - runningWeight;
      }
    } else if (desiredTarget > startWeight && runningWeight + weeklyChange > desiredTarget) {
      weeklyChange = desiredTarget - runningWeight;
    }

    runningWeight = round(runningWeight + weeklyChange, 2);
    projection.push({
      week,
      label: `Week ${week}`,
      weightKg: round(runningWeight, 1),
      weeklyChangeKg: round(weeklyChange, 2),
      calorieDelta: round(rawDailySurplus, 0),
    });
  }

  const milestones = [4, 8, 12]
    .map((week) => projection.find((point) => point.week === week))
    .filter(Boolean);

  const finalPoint = projection[projection.length - 1] || { weightKg: startWeight };
  const confidence = clamp(
    58 + Math.min(18, Math.abs(rawDailySurplus) / 60) - Math.abs(required.requiredDailySurplus - rawDailySurplus) / 35,
    35,
    92,
  );

  return {
    maintenanceCalories,
    dailyCalories: round(projectedDailyCalories, 0),
    requiredDailyCalories: round(maintenanceCalories + required.requiredDailySurplus, 0),
    requiredDailySurplus: required.requiredDailySurplus,
    projectedDailySurplus: round(rawDailySurplus, 0),
    expectedWeeklyChangeKg: round(expectedWeeklyChangeKg, 2),
    projection,
    milestones,
    finalWeightKg: round(finalPoint.weightKg, 1),
    confidence: round(confidence, 0),
    summary: `At ${round(projectedDailyCalories, 0)} kcal/day you are projected to reach ${round(finalPoint.weightKg, 1)} kg by week ${safeDuration}.`,
  };
}

module.exports = {
  calculateRequiredCalorieSurplus,
  estimateMaintenanceCalories,
  predictBodyGrowth,
};

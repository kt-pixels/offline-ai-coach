// Rule-based nutrition engine for offline calorie and macro coaching.
const FOOD_BANK = [
  {
    name: 'Peanut Butter Banana Sandwich',
    calories: 420,
    protein: 16,
    carbs: 52,
    fats: 16,
    cost: 1.2,
    tags: ['vegetarian', 'vegan', 'high-carb']
  },
  {
    name: 'Oats with Soy Milk and Dates',
    calories: 510,
    protein: 20,
    carbs: 76,
    fats: 14,
    cost: 1.4,
    tags: ['vegetarian', 'vegan', 'bulking']
  },
  {
    name: 'Rice + Dal + Olive Oil',
    calories: 640,
    protein: 24,
    carbs: 96,
    fats: 18,
    cost: 1.8,
    tags: ['vegetarian', 'vegan', 'budget']
  },
  {
    name: 'Paneer Wrap',
    calories: 560,
    protein: 32,
    carbs: 44,
    fats: 24,
    cost: 2.2,
    tags: ['vegetarian', 'high-protein']
  },
  {
    name: 'Boiled Eggs + Potato + Banana',
    calories: 490,
    protein: 28,
    carbs: 50,
    fats: 18,
    cost: 1.7,
    tags: ['eggetarian', 'budget']
  },
  {
    name: 'Chicken Rice Bowl',
    calories: 670,
    protein: 43,
    carbs: 62,
    fats: 21,
    cost: 2.8,
    tags: ['non-vegetarian', 'muscle']
  }
];

function value(num, fallback = 0) {
  return Number.isFinite(Number(num)) ? Number(num) : fallback;
}

function calculateTargets(profile, dailyLogs = []) {
  const age = value(profile.age, 21);
  const height = value(profile.height, 170);
  const weight = value(profile.weight, 60);

  const workoutDays = dailyLogs.filter((log) => log.workoutDone).length;
  const activityScore = dailyLogs.length ? workoutDays / dailyLogs.length : 0.45;

  let activityMultiplier = 1.35;
  if (activityScore >= 0.55) activityMultiplier = 1.5;
  if (activityScore >= 0.75) activityMultiplier = 1.65;

  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const maintenance = bmr * activityMultiplier;

  return {
    bmr: Math.round(bmr),
    maintenanceCalories: Math.round(maintenance),
    targetCalories: Math.round(maintenance + 320),
    targetProtein: Math.round(weight * 1.8),
    targetCarbs: Math.round(weight * 4.6),
    targetFats: Math.round(weight * 0.9)
  };
}

function currentTotals(dailyLogs = []) {
  if (!dailyLogs.length) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    };
  }

  const latest = dailyLogs[0];

  return {
    calories: value(latest.calories),
    protein: value(latest.protein),
    carbs: value(latest.carbs),
    fats: value(latest.fats)
  };
}

function computeDeficits(targets, totals) {
  return {
    calories: Math.max(0, targets.targetCalories - totals.calories),
    protein: Math.max(0, targets.targetProtein - totals.protein),
    carbs: Math.max(0, targets.targetCarbs - totals.carbs),
    fats: Math.max(0, targets.targetFats - totals.fats)
  };
}

function buildFeedback(deficits, targets, totals, preference = 'vegetarian') {
  const messages = [];

  if (totals.calories < targets.targetCalories * 0.8) {
    messages.push('Your calorie intake is too low today. Add one dense meal before sleep.');
  }

  if (deficits.carbs > 80) {
    messages.push('Increase carbohydrate intake with rice, oats, potatoes, or bananas.');
  }

  if (deficits.protein > 30) {
    if (preference === 'vegan') {
      messages.push('Protein is lagging. Add tofu, lentils, soy milk, and beans in your next meal.');
    } else {
      messages.push('Protein is lagging. Add paneer, eggs, lentils, or milk in your next meal.');
    }
  }

  if (deficits.fats > 15) {
    messages.push('Healthy fats are under target. Add nuts, peanut butter, or olive oil.');
  }

  if (messages.length === 0) {
    messages.push('Nutrition is on track today. Keep meal timing consistent.');
  }

  return messages;
}

function rankFoods(deficits, budget, preference = 'vegetarian') {
  const budgetValue = value(budget, 0);

  const filteredByPreference = FOOD_BANK.filter((food) => {
    if (preference === 'vegan') {
      return food.tags.includes('vegan');
    }

    if (preference === 'vegetarian') {
      return food.tags.includes('vegetarian');
    }

    if (preference === 'eggetarian') {
      return food.tags.includes('vegetarian') || food.tags.includes('eggetarian');
    }

    return true;
  });

  const options = budgetValue > 0
    ? filteredByPreference.filter((food) => food.cost <= Math.max(1.2, budgetValue / 100))
    : filteredByPreference;

  return options
    .map((food) => {
      const score =
        Math.min(deficits.calories / Math.max(food.calories, 1), 1) * 40 +
        Math.min(deficits.protein / Math.max(food.protein, 1), 1) * 35 +
        Math.min(deficits.carbs / Math.max(food.carbs, 1), 1) * 25 -
        food.cost * 5;

      return {
        ...food,
        score: Number(score.toFixed(2))
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function generateDietRecommendations({ profile, dailyLogs, mealLogs }) {
  const targets = calculateTargets(profile, dailyLogs);
  const totals = currentTotals(dailyLogs);
  const deficits = computeDeficits(targets, totals);
  const feedback = buildFeedback(deficits, targets, totals, profile.dietPreference);
  const foods = rankFoods(deficits, profile.budget, profile.dietPreference);

  const avgMealCost = mealLogs.length
    ? mealLogs.reduce((sum, meal) => sum + value(meal.cost), 0) / mealLogs.length
    : 0;

  const budgetProvided = Number.isFinite(Number(profile.budget)) && Number(profile.budget) > 0;

  return {
    targets,
    totals,
    deficits,
    feedback,
    budgetInsights: {
      dailyBudget: budgetProvided ? value(profile.budget) : null,
      averageMealCost: Number(avgMealCost.toFixed(2)),
      note: budgetProvided
        ? avgMealCost > 0 && avgMealCost > value(profile.budget) / 4
          ? 'Your average meal cost is high. Lean into oats, rice, lentils, and peanut butter.'
          : 'Budget utilization is sustainable for steady bulking.'
        : 'Budget not set. Add your budget in settings to unlock cost-aware diet insights.'
    },
    recommendedFoods: foods
  };
}

module.exports = {
  calculateTargets,
  generateDietRecommendations
};

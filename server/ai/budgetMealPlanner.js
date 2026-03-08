const {
  calculateServingNutrition,
  inferMealScore,
  isFoodAllowedForDiet,
  normalizeDietType,
  round,
  sumNutrition,
  toNumber,
} = require('./nutritionCalculator');

const DEFAULT_MEALS = [
  { mealType: 'breakfast', label: 'Breakfast', targetCalories: 0.27 },
  { mealType: 'lunch', label: 'Lunch', targetCalories: 0.38 },
  { mealType: 'dinner', label: 'Dinner', targetCalories: 0.27 },
  { mealType: 'evening_snack', label: 'Snack', targetCalories: 0.08 },
];

const MEAL_TEMPLATES = {
  breakfast: [
    { category: 'fruits', share: 0.35 },
    { category: 'dairy', share: 0.3 },
    { category: 'grains', share: 0.35 },
  ],
  lunch: [
    { category: 'grains', share: 0.45 },
    { category: 'legumes', share: 0.33 },
    { category: 'vegetables', share: 0.22 },
  ],
  dinner: [
    { category: 'grains', share: 0.38 },
    { category: 'legumes', share: 0.32 },
    { category: 'vegetables', share: 0.2 },
    { category: 'dairy', share: 0.1 },
  ],
  evening_snack: [
    { category: 'fruits', share: 0.55 },
    { category: 'nuts', share: 0.45 },
  ],
};

const CATEGORY_BOUNDS = {
  fruits: [80, 280], vegetables: [80, 260], grains: [50, 320], legumes: [50, 260], dairy: [100, 280], nuts: [15, 60],
};

function caloriePerRupee(food) {
  const caloriesPer100g = toNumber(food.calories_per_gram) * 100;
  const price = Math.max(1, toNumber(food.price_per_100g));
  return caloriesPer100g / price;
}

function pickCandidate(foods, category, mealType, selectedNames) {
  return foods
    .filter((food) => food.category === category && !selectedNames.has(food.name))
    .sort((a, b) => {
      const scoreA = caloriePerRupee(a) * 10 + toNumber(a.protein_per_gram) * 120 + inferMealScore(a, mealType);
      const scoreB = caloriePerRupee(b) * 10 + toNumber(b.protein_per_gram) * 120 + inferMealScore(b, mealType);
      return scoreB - scoreA;
    })[0] || null;
}

function gramsFor(food, targetCalories) {
  const [min, max] = CATEGORY_BOUNDS[food.category] || [40, 280];
  const grams = targetCalories / Math.max(0.05, toNumber(food.calories_per_gram));
  return round(Math.min(max, Math.max(min, grams)), 0);
}

function buildMeal(meal, foods, selectedNames) {
  const template = MEAL_TEMPLATES[meal.mealType] || [];
  const items = template.map((slot) => {
    const food = pickCandidate(foods, slot.category, meal.mealType, selectedNames);
    if (!food) return null;
    selectedNames.add(food.name);
    return { source: food, ...calculateServingNutrition(food, gramsFor(food, meal.targetCalories * slot.share)) };
  }).filter(Boolean);

  const totals = sumNutrition(items);
  return {
    mealType: meal.mealType,
    label: meal.label,
    targetCalories: round(meal.targetCalories, 0),
    foods: items,
    totalCalories: round(totals.calories, 0),
    estimatedCost: round(totals.cost, 2),
  };
}

function cheapestTopUps(foods) {
  return foods
    .filter((food) => ['grains', 'legumes', 'fruits', 'dairy', 'nuts'].includes(food.category))
    .sort((a, b) => caloriePerRupee(b) - caloriePerRupee(a));
}

function findMealForTopUp(meals, category) {
  if (category === 'fruits' || category === 'nuts') return meals.find((meal) => meal.mealType === 'evening_snack') || meals[0];
  if (category === 'dairy') return meals.find((meal) => meal.mealType === 'breakfast') || meals[0];
  return meals.find((meal) => meal.mealType === 'lunch') || meals[0];
}

function reduceCost(meals, budget) {
  let totals = sumNutrition(meals.flatMap((meal) => meal.foods));
  while (totals.cost > budget) {
    const allFoods = meals.flatMap((meal) => meal.foods.map((food) => ({ food, meal })));
    const expensive = allFoods.sort((a, b) => (toNumber(b.food.cost) / Math.max(1, toNumber(b.food.calories))) - (toNumber(a.food.cost) / Math.max(1, toNumber(a.food.calories))))[0];
    if (!expensive || expensive.food.grams <= 30) break;
    expensive.food.grams = Math.max(30, expensive.food.grams - 15);
    Object.assign(expensive.food, calculateServingNutrition(expensive.food.source, expensive.food.grams));
    totals = sumNutrition(meals.flatMap((meal) => meal.foods));
    meals.forEach((meal) => {
      const mealTotals = sumNutrition(meal.foods);
      meal.totalCalories = round(mealTotals.calories, 0);
      meal.estimatedCost = round(mealTotals.cost, 2);
    });
  }
  return totals;
}

function generateBudgetMealPlan({ foods = [], dailyBudget = 120, calorieTarget = 2200, dietType = 'vegetarian', mealDistribution = [] }) {
  const normalizedDiet = normalizeDietType(dietType);
  const budget = Math.max(40, toNumber(dailyBudget, 120));
  const allowedFoods = foods.filter((food) => isFoodAllowedForDiet(food, normalizedDiet) && !['fast foods', 'desserts'].includes(food.category));
  const slots = (mealDistribution.length ? mealDistribution : DEFAULT_MEALS).map((meal) => ({ ...meal, targetCalories: toNumber(meal.targetCalories) > 1 ? toNumber(meal.targetCalories) : calorieTarget * toNumber(meal.targetCalories) }));
  const selectedNames = new Set();
  const meals = slots.map((meal) => buildMeal(meal, allowedFoods, selectedNames));

  const topUps = cheapestTopUps(allowedFoods);
  let totals = sumNutrition(meals.flatMap((meal) => meal.foods));
  let guard = 0;
  while (totals.calories < calorieTarget && totals.cost < budget && guard < 120) {
    const topFood = topUps[guard % Math.max(1, topUps.length)];
    if (!topFood) break;
    const meal = findMealForTopUp(meals, topFood.category);
    const existing = meal.foods.find((food) => food.name === topFood.name);
    if (existing) {
      existing.grams += topFood.category === 'nuts' ? 10 : 25;
      Object.assign(existing, calculateServingNutrition(topFood, existing.grams), { source: topFood });
    } else {
      meal.foods.push({ source: topFood, ...calculateServingNutrition(topFood, topFood.category === 'nuts' ? 20 : 60) });
    }
    const mealTotals = sumNutrition(meal.foods);
    meal.totalCalories = round(mealTotals.calories, 0);
    meal.estimatedCost = round(mealTotals.cost, 2);
    totals = sumNutrition(meals.flatMap((item) => item.foods));
    guard += 1;
  }

  totals = reduceCost(meals, budget);
  const dailySavings = round(Math.max(0, budget - totals.cost), 2);
  const cheapestCalorieSources = topUps.slice(0, 5).map((food) => ({
    name: food.name,
    category: food.category,
    price_per_100g: food.price_per_100g,
    calories_per_100g: round(toNumber(food.calories_per_gram) * 100, 0),
  }));

  return {
    dietType: normalizedDiet,
    dailyBudget: budget,
    calorieTarget: round(calorieTarget, 0),
    totalCalories: round(totals.calories, 0),
    estimatedCost: round(totals.cost, 2),
    savings: dailySavings,
    budgetUtilization: round((totals.cost / budget) * 100, 0),
    macros: {
      protein: round(totals.protein, 1),
      carbs: round(totals.carbs, 1),
      fat: round(totals.fat, 1),
    },
    meals,
    cheapestCalorieSources,
    summary: `Built a ${normalizedDiet} meal plan that prioritizes cheap calorie sources and stays close to Rs. ${budget} per day.`,
    notes: totals.calories < calorieTarget ? ['Budget is extremely tight, so the plan is slightly under target.'] : ['Plan stays within budget and keeps calories on target using low-cost staples.'],
  };
}

module.exports = {
  generateBudgetMealPlan,
};

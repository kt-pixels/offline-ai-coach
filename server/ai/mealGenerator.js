const {
  calculateServingNutrition,
  clamp,
  inferMealScore,
  isFoodAllowedForDiet,
  mealLabel,
  normalizeDietType,
  normalizeText,
  round,
  sumNutrition,
  toNumber,
} = require('./nutritionCalculator');

const MEAL_TEMPLATES = {
  breakfast: [
    { categories: ['grains', 'dairy', 'fruits'], ratios: [0.4, 0.35, 0.25] },
    { categories: ['fruits', 'dairy', 'nuts'], ratios: [0.38, 0.37, 0.25] },
    { categories: ['indian foods', 'drinks', 'fruits'], ratios: [0.52, 0.23, 0.25] },
    { categories: ['grains', 'seeds', 'drinks'], ratios: [0.48, 0.17, 0.35] },
  ],
  mid_morning_snack: [
    { categories: ['fruits', 'nuts'], ratios: [0.6, 0.4] },
    { categories: ['drinks', 'fruits'], ratios: [0.55, 0.45] },
    { categories: ['snacks', 'drinks'], ratios: [0.55, 0.45] },
    { categories: ['dairy', 'fruits'], ratios: [0.52, 0.48] },
  ],
  lunch: [
    { categories: ['grains', 'legumes', 'vegetables'], ratios: [0.42, 0.34, 0.24] },
    { categories: ['indian foods', 'vegetables', 'dairy'], ratios: [0.58, 0.22, 0.2] },
    { categories: ['asian foods', 'vegetables', 'drinks'], ratios: [0.58, 0.22, 0.2] },
    { categories: ['european foods', 'vegetables', 'legumes'], ratios: [0.56, 0.2, 0.24] },
  ],
  evening_snack: [
    { categories: ['snacks', 'drinks'], ratios: [0.55, 0.45] },
    { categories: ['fruits', 'nuts'], ratios: [0.6, 0.4] },
    { categories: ['desserts', 'drinks'], ratios: [0.58, 0.42] },
    { categories: ['dairy', 'fruits'], ratios: [0.55, 0.45] },
  ],
  dinner: [
    { categories: ['indian foods', 'vegetables', 'dairy'], ratios: [0.56, 0.22, 0.22] },
    { categories: ['asian foods', 'vegetables', 'legumes'], ratios: [0.56, 0.22, 0.22] },
    { categories: ['european foods', 'vegetables', 'legumes'], ratios: [0.54, 0.22, 0.24] },
    { categories: ['grains', 'legumes', 'vegetables'], ratios: [0.38, 0.34, 0.28] },
  ],
};

const GRAM_BOUNDS = {
  fruits: [80, 260], vegetables: [90, 280], grains: [70, 260], legumes: [70, 240], dairy: [100, 280],
  nuts: [20, 70], seeds: [18, 60], oils: [5, 20], 'indian foods': [140, 320], 'asian foods': [140, 320],
  'european foods': [140, 320], 'american foods': [140, 320], snacks: [30, 120], desserts: [40, 140], drinks: [180, 420], 'fast foods': [120, 260],
};

function gramBounds(category) {
  return GRAM_BOUNDS[normalizeText(category)] || [60, 250];
}

function caloriesCloseness(food, targetCalories) {
  const caloriesPer100g = toNumber(food.calories_per_gram) * 100;
  if (!caloriesPer100g || !targetCalories) return 0;
  return 100 - Math.min(100, Math.abs(targetCalories - caloriesPer100g) * 0.25);
}

function pickCandidate(candidates, { category, mealType, usedNames, targetCalories }) {
  const normalizedCategory = normalizeText(category);
  const filtered = candidates.filter((food) => normalizeText(food.category) === normalizedCategory && !usedNames.has(food.name));
  const source = filtered.length ? filtered : candidates.filter((food) => !usedNames.has(food.name));

  return [...source]
    .sort((a, b) => {
      const scoreA = inferMealScore(a, mealType) + caloriesCloseness(a, targetCalories) + toNumber(a.popularityScore, 50) / 5;
      const scoreB = inferMealScore(b, mealType) + caloriesCloseness(b, targetCalories) + toNumber(b.popularityScore, 50) / 5;
      return scoreB - scoreA;
    })[0] || null;
}

function calculateGrams(food, targetCalories) {
  const caloriesPerGram = Math.max(0.05, toNumber(food.calories_per_gram, 0.5));
  const [minGrams, maxGrams] = gramBounds(food.category);
  return round(clamp(targetCalories / caloriesPerGram, minGrams, maxGrams), 0);
}

function buildMealSlot(meal, foods, dietType, usedNames) {
  const templates = MEAL_TEMPLATES[meal.mealType] || [];
  const mealCandidates = foods.filter((food) => isFoodAllowedForDiet(food, dietType) && inferMealScore(food, meal.mealType) > 0);
  const fallbackTemplate = { categories: [mealCandidates[0]?.category].filter(Boolean), ratios: [1] };

  const template = [...templates].sort((a, b) => {
    const scoreFor = (templateInput) => templateInput.categories.reduce((sum, category, index) => {
      const candidate = pickCandidate(mealCandidates, { category, mealType: meal.mealType, usedNames, targetCalories: toNumber(meal.targetCalories) * templateInput.ratios[index] });
      return sum + (candidate ? 1 : 0);
    }, 0);
    return scoreFor(b) - scoreFor(a);
  })[0] || fallbackTemplate;

  const selectedFoods = [];
  template.categories.forEach((category, index) => {
    const targetCalories = Math.max(80, toNumber(meal.targetCalories) * template.ratios[index]);
    const food = pickCandidate(mealCandidates, { category, mealType: meal.mealType, usedNames, targetCalories });
    if (!food) return;
    usedNames.add(food.name);
    selectedFoods.push({ id: food._id?.toString?.() || food.id || food.name, ...calculateServingNutrition(food, calculateGrams(food, targetCalories)), cuisine: food.cuisine });
  });

  if (!selectedFoods.length && mealCandidates.length) {
    const fallback = mealCandidates[0];
    selectedFoods.push({ id: fallback._id?.toString?.() || fallback.id || fallback.name, ...calculateServingNutrition(fallback, calculateGrams(fallback, Math.max(120, toNumber(meal.targetCalories)))), cuisine: fallback.cuisine });
  }

  const totals = sumNutrition(selectedFoods);
  const delta = toNumber(meal.targetCalories) - totals.calories;
  if (selectedFoods.length && Math.abs(delta) > 45) {
    const adjustable = selectedFoods[selectedFoods.length - 1];
    const sourceFood = mealCandidates.find((food) => food.name === adjustable.name) || {};
    const updated = calculateServingNutrition(sourceFood, calculateGrams(sourceFood, Math.max(80, adjustable.calories + delta)));
    selectedFoods[selectedFoods.length - 1] = { ...adjustable, ...updated, cuisine: sourceFood.cuisine };
  }

  const finalTotals = sumNutrition(selectedFoods);
  return {
    mealType: meal.mealType,
    label: meal.label || mealLabel(meal.mealType),
    time: meal.scheduledTime,
    targetCalories: round(toNumber(meal.targetCalories), 0),
    totalCalories: round(finalTotals.calories, 0),
    estimatedCost: round(finalTotals.cost, 2),
    foods: selectedFoods,
    macros: {
      protein: round(finalTotals.protein, 1),
      carbs: round(finalTotals.carbs, 1),
      fat: round(finalTotals.fat, 1),
    },
    guidance: `Aim to keep this meal within ${Math.max(50, Math.round(Math.abs(toNumber(meal.targetCalories) - finalTotals.calories)))} kcal of target.`,
  };
}

function buildShoppingList(meals = []) {
  const aggregate = new Map();
  meals.forEach((meal) => {
    (meal.foods || []).forEach((food) => {
      const current = aggregate.get(food.name) || { name: food.name, grams: 0, category: food.category, cost: 0 };
      current.grams += toNumber(food.grams);
      current.cost += toNumber(food.cost);
      aggregate.set(food.name, current);
    });
  });
  return [...aggregate.values()].map((item) => ({ ...item, grams: round(item.grams, 0), cost: round(item.cost, 2) }));
}

function generateMealPlan({ foods = [], calorieTarget, dietType = 'vegetarian', mealDistribution = [] }) {
  const normalizedDiet = normalizeDietType(dietType);
  const usedNames = new Set();
  const meals = (Array.isArray(mealDistribution) ? mealDistribution : []).map((meal) => buildMealSlot(meal, foods, normalizedDiet, usedNames));
  const totals = sumNutrition(meals.flatMap((meal) => meal.foods || []));
  const shoppingList = buildShoppingList(meals);

  return {
    dietType: normalizedDiet,
    calorieTarget: round(toNumber(calorieTarget), 0),
    totalCalories: round(totals.calories, 0),
    estimatedCost: round(totals.cost, 2),
    macros: {
      protein: round(totals.protein, 1),
      carbs: round(totals.carbs, 1),
      fat: round(totals.fat, 1),
    },
    meals,
    shoppingList,
    summary: `Generated a ${normalizedDiet} meal plan with ${meals.length} meals using the local food database.`,
  };
}

module.exports = {
  generateMealPlan,
};

const { round, sumNutrition, toNumber } = require('./nutritionCalculator');

const GROUP_MAP = {
  fruits: 'fruits',
  vegetables: 'vegetables',
  grains: 'grains',
  dairy: 'dairy',
  legumes: 'protein sources',
  nuts: 'protein sources',
  seeds: 'protein sources',
  oils: 'pantry and oils',
  'indian foods': 'prepared meals',
  'asian foods': 'prepared meals',
  'european foods': 'prepared meals',
  'american foods': 'prepared meals',
  snacks: 'snacks and treats',
  desserts: 'snacks and treats',
  drinks: 'drinks',
  'fast foods': 'prepared meals',
};

const LIQUID_TOKENS = ['milk', 'lassi', 'buttermilk', 'kefir', 'juice', 'smoothie', 'shake', 'coffee', 'chai', 'water', 'lemonade'];

function groupFor(category) {
  return GROUP_MAP[category] || 'essentials';
}

function isLiquid(item) {
  const text = `${item.name || ''} ${item.category || ''}`.toLowerCase();
  return item.category === 'drinks' || LIQUID_TOKENS.some((token) => text.includes(token));
}

function formatQuantity(item) {
  const grams = toNumber(item.grams);
  if (isLiquid(item)) {
    if (grams >= 1000) return `${round(grams / 1000, 1)} liters`;
    return `${round(grams, 0)} ml`;
  }
  if (grams >= 1000) return `${round(grams / 1000, 2)} kg`;
  return `${round(grams, 0)} g`;
}

function defaultWeeklyGrams(food) {
  const categoryDefaults = {
    fruits: 900,
    vegetables: 1200,
    grains: 1400,
    dairy: 1800,
    legumes: 900,
    nuts: 280,
    seeds: 220,
    drinks: 2100,
  };
  return categoryDefaults[food.category] || 600;
}

function aggregateFoods(items = []) {
  const map = new Map();
  items.forEach((item) => {
    const key = `${item.name}__${item.category}`;
    const existing = map.get(key) || { name: item.name, category: item.category, grams: 0, estimatedCost: 0, calories: 0 };
    existing.grams += toNumber(item.grams);
    existing.estimatedCost += toNumber(item.cost || item.estimatedCost);
    existing.calories += toNumber(item.calories);
    map.set(key, existing);
  });
  return [...map.values()];
}

function buildWeeklyGroceryPlan({ mealPlan, weeklyCalorieNeeds = 0, selectedFoods = [] }) {
  const meals = mealPlan?.meals || [];
  const dailyFoods = meals.flatMap((meal) => (meal.foods || []).map((food) => ({ ...food, mealType: meal.mealType })));
  const dailyCalories = Math.max(1, toNumber(mealPlan?.totalCalories || sumNutrition(dailyFoods).calories));
  const desiredWeeklyCalories = Math.max(dailyCalories * 7, toNumber(weeklyCalorieNeeds, dailyCalories * 7));
  const scale = desiredWeeklyCalories / (dailyCalories * 7);

  const scaledFoods = dailyFoods.map((food) => ({
    ...food,
    grams: toNumber(food.grams) * 7 * scale,
    calories: toNumber(food.calories) * 7 * scale,
    cost: toNumber(food.cost) * 7 * scale,
  }));

  selectedFoods.forEach((food) => {
    const existing = scaledFoods.find((item) => item.name === food.name);
    if (existing) {
      existing.grams *= 1.18;
      existing.calories *= 1.18;
      existing.cost *= 1.18;
      return;
    }
    const grams = defaultWeeklyGrams(food) * scale;
    scaledFoods.push({
      name: food.name,
      category: food.category,
      grams,
      calories: grams * toNumber(food.calories_per_gram),
      cost: (grams / 100) * toNumber(food.price_per_100g),
    });
  });

  const groceryList = aggregateFoods(scaledFoods)
    .map((item) => ({
      ...item,
      grams: round(item.grams, 0),
      estimatedCost: round(item.estimatedCost, 2),
      calories: round(item.calories, 0),
      group: groupFor(item.category),
      quantityLabel: formatQuantity(item),
    }))
    .sort((a, b) => b.grams - a.grams);

  const groupedMap = new Map();
  groceryList.forEach((item) => {
    const existing = groupedMap.get(item.group) || { group: item.group, totalCost: 0, totalGrams: 0, items: [] };
    existing.totalCost += item.estimatedCost;
    existing.totalGrams += item.grams;
    existing.items.push(item);
    groupedMap.set(item.group, existing);
  });

  const groupedGroceries = [...groupedMap.values()]
    .map((group) => ({
      ...group,
      totalCost: round(group.totalCost, 2),
      items: group.items.slice(0, 12),
    }))
    .sort((a, b) => b.totalGrams - a.totalGrams);

  const reminderItems = groceryList.slice(0, 4).map((item) => `${item.name} -> ${item.quantityLabel}`);
  const estimatedWeeklyCost = round(groceryList.reduce((sum, item) => sum + item.estimatedCost, 0), 2);

  return {
    weeklyCalorieNeeds: round(desiredWeeklyCalories, 0),
    dailyPlanCalories: round(dailyCalories, 0),
    estimatedWeeklyCost,
    groceryList,
    groupedGroceries,
    reminders: reminderItems,
    summary: `Generated a weekly grocery list from ${meals.length} meals and ${round(desiredWeeklyCalories, 0)} planned calories.`,
  };
}

module.exports = {
  buildWeeklyGroceryPlan,
};

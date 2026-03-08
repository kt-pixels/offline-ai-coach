function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((toNumber(value) + Number.EPSILON) * factor) / factor;
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function buildDayKey(value) {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function normalizeDietType(value) {
  const clean = normalizeText(value);
  if (!clean) return 'vegetarian';
  if (['veg', 'vegetarian'].includes(clean)) return 'vegetarian';
  if (clean === 'vegan') return 'vegan';
  if (['eggetarian', 'egg'].includes(clean)) return 'eggetarian';
  if (['non veg', 'non-veg', 'non vegetarian', 'non-vegetarian', 'omnivore'].includes(clean)) return 'non-vegetarian';
  return clean;
}

const NON_VEG_TOKENS = [
  'chicken',
  'fish',
  'mutton',
  'beef',
  'pork',
  'lamb',
  'turkey',
  'tuna',
  'salmon',
  'shrimp',
  'prawn',
  'crab',
  'pepperoni',
  'shawarma',
  'hot dog',
  'bbq chicken',
  'fried chicken',
];
const EGG_TOKENS = ['egg', 'omelette', 'omelet', 'frittata', 'mayo'];
const DAIRY_TOKENS = [
  'milk',
  'paneer',
  'cheese',
  'curd',
  'yogurt',
  'ghee',
  'butter',
  'kefir',
  'lassi',
  'cream',
  'whey',
  'mozzarella',
  'cheddar',
  'cottage cheese',
  'ice cream',
  'milkshake',
  'latte',
];

function inferDietTags(foodInput = {}) {
  if (Array.isArray(foodInput.dietTags) && foodInput.dietTags.length) {
    return Array.from(new Set(foodInput.dietTags.map(normalizeDietType)));
  }

  const text = normalizeText(`${foodInput.name || ''} ${foodInput.category || ''} ${foodInput.cuisine || ''} ${(foodInput.aliases || []).join(' ')}`);

  if (NON_VEG_TOKENS.some((token) => text.includes(token))) {
    return ['non-vegetarian'];
  }
  if (EGG_TOKENS.some((token) => text.includes(token))) {
    return ['eggetarian', 'non-vegetarian'];
  }
  if ((foodInput.category || '') === 'dairy' || DAIRY_TOKENS.some((token) => text.includes(token))) {
    return ['vegetarian', 'eggetarian', 'non-vegetarian'];
  }
  return ['vegan', 'vegetarian', 'eggetarian', 'non-vegetarian'];
}

function isFoodAllowedForDiet(foodInput = {}, dietType = 'vegetarian') {
  const cleanDiet = normalizeDietType(dietType);
  const tags = inferDietTags(foodInput);
  if (cleanDiet === 'non-vegetarian') return true;
  if (cleanDiet === 'eggetarian') return tags.includes('vegan') || tags.includes('vegetarian') || tags.includes('eggetarian');
  if (cleanDiet === 'vegan') return tags.includes('vegan');
  return tags.includes('vegan') || tags.includes('vegetarian');
}

const MEAL_CATEGORY_SCORES = {
  breakfast: {
    fruits: 26,
    grains: 24,
    dairy: 22,
    nuts: 20,
    seeds: 18,
    drinks: 18,
    'indian foods': 16,
    'american foods': 12,
    desserts: 8,
    snacks: 10,
  },
  mid_morning_snack: {
    fruits: 24,
    nuts: 22,
    seeds: 20,
    drinks: 22,
    snacks: 18,
    dairy: 18,
    desserts: 12,
  },
  lunch: {
    grains: 24,
    legumes: 24,
    vegetables: 22,
    'indian foods': 26,
    'asian foods': 24,
    'european foods': 22,
    'american foods': 20,
    dairy: 16,
    oils: 8,
    'fast foods': 12,
  },
  evening_snack: {
    snacks: 24,
    drinks: 22,
    fruits: 20,
    nuts: 18,
    seeds: 16,
    dairy: 16,
    desserts: 16,
    'fast foods': 12,
  },
  dinner: {
    vegetables: 24,
    legumes: 22,
    'indian foods': 26,
    'asian foods': 24,
    'european foods': 22,
    'american foods': 20,
    grains: 18,
    dairy: 16,
    oils: 8,
    'fast foods': 10,
  },
};

const MEAL_KEYWORDS = {
  breakfast: ['oats', 'toast', 'banana', 'milk', 'smoothie', 'upma', 'poha', 'idli', 'dosa', 'fruit', 'pancake'],
  mid_morning_snack: ['fruit', 'juice', 'yogurt', 'nuts', 'bar', 'shake', 'coffee'],
  lunch: ['rice', 'dal', 'paneer', 'rajma', 'bowl', 'salad', 'wrap', 'pulao', 'biryani', 'ramen', 'pasta'],
  evening_snack: ['snack', 'shake', 'tea', 'coffee', 'chips', 'makhana', 'bar', 'dessert'],
  dinner: ['curry', 'grill', 'roti', 'chawal', 'bowl', 'salad', 'soup', 'paneer', 'wrap', 'pizza'],
};

function inferMealScore(foodInput = {}, mealType = 'breakfast') {
  const category = normalizeText(foodInput.category);
  const text = normalizeText(`${foodInput.name || ''} ${(foodInput.aliases || []).join(' ')} ${(foodInput.mealTags || []).join(' ')}`);
  let score = MEAL_CATEGORY_SCORES[mealType]?.[category] || 0;

  if (Array.isArray(foodInput.mealTags) && foodInput.mealTags.includes(mealType)) {
    score += 25;
  }

  (MEAL_KEYWORDS[mealType] || []).forEach((keyword) => {
    if (text.includes(keyword)) score += 6;
  });

  score += toNumber(foodInput.popularityScore, 50) / 10;
  return score;
}

function calculateServingNutrition(foodInput = {}, grams = 0) {
  const quantity = clamp(toNumber(grams), 0, 5000);
  return {
    name: foodInput.name,
    category: foodInput.category,
    grams: round(quantity, 0),
    calories: round(quantity * toNumber(foodInput.calories_per_gram), 1),
    protein: round(quantity * toNumber(foodInput.protein_per_gram), 1),
    carbs: round(quantity * toNumber(foodInput.carbs_per_gram), 1),
    fat: round(quantity * toNumber(foodInput.fat_per_gram), 1),
    cost: round((quantity / 100) * toNumber(foodInput.price_per_100g), 2),
    price_per_100g: round(toNumber(foodInput.price_per_100g), 2),
  };
}

function sumNutrition(entries = []) {
  return entries.reduce(
    (acc, entry) => ({
      calories: round(acc.calories + toNumber(entry.calories), 1),
      protein: round(acc.protein + toNumber(entry.protein), 1),
      carbs: round(acc.carbs + toNumber(entry.carbs), 1),
      fat: round(acc.fat + toNumber(entry.fat), 1),
      cost: round(acc.cost + toNumber(entry.cost), 2),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 },
  );
}

function mealLabel(mealType) {
  const labels = {
    breakfast: 'Breakfast',
    mid_morning_snack: 'Mid Morning Snack',
    lunch: 'Lunch',
    evening_snack: 'Evening Snack',
    dinner: 'Dinner',
  };
  return labels[mealType] || mealType;
}

module.exports = {
  buildDayKey,
  calculateServingNutrition,
  clamp,
  inferDietTags,
  inferMealScore,
  isFoodAllowedForDiet,
  mealLabel,
  normalizeDietType,
  normalizeText,
  round,
  sumNutrition,
  toNumber,
};

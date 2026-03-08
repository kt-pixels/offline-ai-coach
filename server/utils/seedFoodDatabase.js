const fs = require('fs');
const path = require('path');
const FoodDatabase = require('../models/FoodDatabase');

const REQUIRED_CATEGORIES = [
  'fruits',
  'vegetables',
  'grains',
  'legumes',
  'dairy',
  'nuts',
  'seeds',
  'oils',
  'indian foods',
  'asian foods',
  'european foods',
  'american foods',
  'snacks',
  'desserts',
  'drinks',
  'fast foods',
];

function resolveDatabasePath() {
  const rootDatabasePath = path.join(__dirname, '..', '..', 'data', 'foodDatabase.json');
  const legacyDatabasePath = path.join(__dirname, '..', 'data', 'foodDatabase.json');
  return fs.existsSync(rootDatabasePath) ? rootDatabasePath : legacyDatabasePath;
}

async function requiresRefresh() {
  const existingCount = await FoodDatabase.estimatedDocumentCount();
  if (existingCount < 10000) {
    return true;
  }

  const sample = await FoodDatabase.findOne().select('price_per_100g category').lean();
  if (!sample || typeof sample.price_per_100g !== 'number') {
    return true;
  }

  const categories = await FoodDatabase.distinct('category');
  return REQUIRED_CATEGORIES.some((category) => !categories.includes(category));
}

async function seedFoodDatabase() {
  if (!(await requiresRefresh())) {
    return;
  }

  const filePath = resolveDatabasePath();
  if (!fs.existsSync(filePath)) {
    console.warn('foodDatabase.json not found. Skipping nutrition food seed.');
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const foods = JSON.parse(raw);
  if (!Array.isArray(foods) || !foods.length) {
    console.warn('foodDatabase.json has no entries. Skipping seed.');
    return;
  }

  await FoodDatabase.deleteMany({});

  try {
    await FoodDatabase.insertMany(foods, { ordered: false });
  } catch (error) {
    const inserted = await FoodDatabase.estimatedDocumentCount();
    console.warn(`Food seed completed with dedupe warnings. Inserted: ${inserted}`);
    return;
  }

  console.log(`Food database seeded with ${foods.length} foods.`);
}

module.exports = {
  seedFoodDatabase,
};

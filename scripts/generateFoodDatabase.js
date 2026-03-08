const fs = require("fs");
const path = require("path");

const round = (value, decimals = 4) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const normalizeText = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

function hashText(input) {
  let hash = 2166136261;
  for (const char of String(input || "")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function random() {
    t += 0x6d2b79f5;
    let result = Math.imul(t ^ (t >>> 15), t | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

const PREP_FACTORS = [
  [1, 1, 1, 1],
  [1.02, 0.99, 1.02, 1.04],
  [1.04, 1.02, 1.08, 1.08],
  [1.01, 1.03, 1.12, 1.12],
  [1.06, 0.97, 0.95, 1.08],
  [1.01, 1.01, 1.03, 1.05],
];
const CUISINE_FACTORS = [
  [1, 1, 1, 1],
  [1.01, 1.01, 1.02, 1.02],
  [1.02, 1, 1.03, 1.04],
  [1.01, 1.02, 1.01, 1.05],
  [1, 1.03, 1.02, 1.05],
  [1.03, 0.99, 1, 1.07],
];
const CONTEXTS = [
  {
    label: "classic pack",
    protein: 1,
    carbs: 1,
    fat: 1,
    price: 1,
    popularity: 10,
  },
  {
    label: "performance pack",
    protein: 1.05,
    carbs: 0.99,
    fat: 0.97,
    price: 1.08,
    popularity: 4,
  },
];

const CATEGORY_LIMITS = {
  fruits: 0.42,
  vegetables: 0.35,
  grains: 0.82,
  legumes: 0.62,
  dairy: 0.58,
  nuts: 0.9,
  seeds: 0.92,
  oils: 1,
  "indian foods": 0.84,
  "asian foods": 0.84,
  "european foods": 0.84,
  "american foods": 0.84,
  snacks: 0.92,
  desserts: 0.84,
  drinks: 0.38,
  "fast foods": 0.86,
};
const CONFIG = {
  fruits: {
    items:
      "banana|apple|mango|orange|papaya|pineapple|grapes|guava|pomegranate|kiwi|watermelon",
    mealTags: ["breakfast", "mid_morning_snack", "evening_snack"],
    preps: [
      "fresh",
      "chilled",
      "sliced",
      "sun dried",
      "smoothie ready",
      "market ripe",
    ],
    cuisines: [
      "global",
      "indian market",
      "tropical",
      "mediterranean",
      "southeast asian",
      "latin american",
    ],
    p: [0.003, 0.028],
    c: [0.07, 0.24],
    f: [0.001, 0.015],
    price: [4, 28],
  },
  vegetables: {
    items:
      "potato|sweet potato|spinach|broccoli|carrot|cauliflower|cabbage|beetroot|okra|bell pepper|mushroom",
    mealTags: ["lunch", "dinner", "mid_morning_snack"],
    preps: ["raw", "steamed", "grilled", "roasted", "stir fried", "curry cut"],
    cuisines: [
      "garden fresh",
      "indian home",
      "mediterranean",
      "east asian",
      "farm market",
      "street cart",
    ],
    p: [0.008, 0.032],
    c: [0.03, 0.2],
    f: [0.001, 0.01],
    price: [3, 18],
  },
  grains: {
    items:
      "rice cooked|brown rice cooked|oats dry|quinoa cooked|whole wheat bread|pasta cooked|roti|poha|millet cooked|barley cooked|couscous cooked",
    mealTags: ["breakfast", "lunch", "dinner"],
    preps: [
      "steamed",
      "toasted",
      "pilaf style",
      "porridge style",
      "tiffin style",
      "roasted",
    ],
    cuisines: [
      "global pantry",
      "indian",
      "middle eastern",
      "east asian",
      "mediterranean",
      "meal prep",
    ],
    p: [0.02, 0.17],
    c: [0.2, 0.7],
    f: [0.002, 0.08],
    price: [6, 28],
  },
  legumes: {
    items:
      "lentils cooked|chickpeas cooked|kidney beans cooked|black beans cooked|green moong cooked|soybeans cooked|toor dal cooked|black chana cooked|edamame|tofu firm|tempeh",
    mealTags: ["lunch", "dinner", "mid_morning_snack"],
    preps: [
      "soaked",
      "cooked",
      "sprouted",
      "curry style",
      "salad style",
      "masala style",
    ],
    cuisines: [
      "global pantry",
      "indian",
      "mediterranean",
      "middle eastern",
      "latin",
      "high protein",
    ],
    p: [0.07, 0.22],
    c: [0.03, 0.28],
    f: [0.004, 0.12],
    price: [12, 38],
  },
  dairy: {
    items:
      "milk|curd|greek yogurt|paneer|cottage cheese|mozzarella|cheddar cheese|buttermilk|lassi|whey shake|kefir",
    mealTags: ["breakfast", "mid_morning_snack", "evening_snack"],
    preps: ["fresh", "cultured", "low fat", "whipped", "chilled", "fortified"],
    cuisines: [
      "global dairy",
      "indian dairy",
      "cafe bar",
      "breakfast kitchen",
      "artisan creamery",
      "performance",
    ],
    p: [0.02, 0.68],
    c: [0, 0.16],
    f: [0.004, 0.34],
    price: [5, 90],
  },
  nuts: {
    items:
      "almonds|peanuts|cashews|walnuts|pistachios|hazelnuts|macadamia|peanut butter|almond butter|trail mix|mixed nuts",
    mealTags: ["breakfast", "mid_morning_snack", "evening_snack"],
    preps: [
      "raw",
      "dry roasted",
      "salted",
      "crushed",
      "trail mix cut",
      "butter blend",
    ],
    cuisines: [
      "global pantry",
      "indian snack",
      "mediterranean",
      "breakfast bowl",
      "dessert topper",
      "performance",
    ],
    p: [0.08, 0.28],
    c: [0.08, 0.32],
    f: [0.28, 0.76],
    price: [18, 95],
  },
  seeds: {
    items:
      "chia seeds|flax seeds|sunflower seeds|pumpkin seeds|sesame seeds|hemp seeds|basil seeds|watermelon seeds|poppy seeds|melon seed mix|seed butter",
    mealTags: ["breakfast", "mid_morning_snack", "evening_snack"],
    preps: ["raw", "toasted", "ground", "soaked", "trail mix", "sprouted"],
    cuisines: [
      "global pantry",
      "smoothie bar",
      "breakfast bowl",
      "indian pantry",
      "fitness kitchen",
      "salad topper",
    ],
    p: [0.12, 0.32],
    c: [0.08, 0.46],
    f: [0.2, 0.55],
    price: [16, 46],
  },
  oils: {
    items:
      "olive oil|coconut oil|mustard oil|sesame oil|sunflower oil|groundnut oil|rice bran oil|avocado oil|canola oil|chili oil|herb infused oil",
    mealTags: ["breakfast", "lunch", "dinner"],
    preps: [
      "cold pressed",
      "extra virgin",
      "infused",
      "cooking grade",
      "roasted seed",
      "drizzle",
    ],
    cuisines: [
      "global pantry",
      "indian kitchen",
      "mediterranean",
      "asian kitchen",
      "gourmet",
      "meal prep",
    ],
    p: [0, 0],
    c: [0, 0],
    f: [1, 1],
    price: [10, 28],
  },
  "indian foods": {
    items:
      "dal tadka|khichdi|paneer butter masala|chole masala|rajma chawal|aloo paratha|masala dosa|idli sambar|palak paneer|vegetable pulao|biryani",
    mealTags: ["breakfast", "lunch", "dinner"],
    preps: [
      "home style",
      "grilled",
      "sauced",
      "bowl style",
      "street style",
      "low oil",
    ],
    cuisines: [
      "north indian",
      "south indian",
      "west indian",
      "east indian",
      "tiffin service",
      "performance",
    ],
    p: [0.03, 0.18],
    c: [0.07, 0.4],
    f: [0.02, 0.18],
    price: [10, 34],
  },
  "asian foods": {
    items:
      "sushi roll|ramen bowl|pad thai|bibimbap|fried rice|soba noodles|dim sum|miso soup bowl|satay rice bowl|pho bowl|teriyaki tofu bowl",
    mealTags: ["lunch", "dinner", "evening_snack"],
    preps: [
      "home style",
      "grilled",
      "sauced",
      "bowl style",
      "street style",
      "low oil",
    ],
    cuisines: [
      "chinese",
      "japanese",
      "korean",
      "thai",
      "southeast asian",
      "fusion",
    ],
    p: [0.03, 0.16],
    c: [0.06, 0.34],
    f: [0.02, 0.12],
    price: [14, 32],
  },
  "european foods": {
    items:
      "risotto|lasagna|paella|greek salad bowl|spaghetti arrabbiata|ratatouille pasta|moussaka|gnocchi bowl|croissant sandwich|pesto penne|herb roasted potatoes",
    mealTags: ["breakfast", "lunch", "dinner"],
    preps: [
      "home style",
      "grilled",
      "sauced",
      "bowl style",
      "street style",
      "low oil",
    ],
    cuisines: ["italian", "french", "spanish", "greek", "german", "british"],
    p: [0.03, 0.14],
    c: [0.05, 0.34],
    f: [0.02, 0.16],
    price: [14, 34],
  },
  "american foods": {
    items:
      "burrito bowl|bbq chicken plate|mac and cheese|turkey sandwich|chili bowl|pancake stack|cobb salad|bagel sandwich|grilled corn bowl|pulled chicken wrap|oatmeal peanut bowl",
    mealTags: ["breakfast", "lunch", "dinner"],
    preps: [
      "home style",
      "grilled",
      "sauced",
      "bowl style",
      "street style",
      "low oil",
    ],
    cuisines: [
      "california",
      "tex-mex",
      "southern",
      "new york deli",
      "midwest",
      "east coast cafe",
    ],
    p: [0.03, 0.18],
    c: [0.05, 0.36],
    f: [0.02, 0.16],
    price: [12, 32],
  },
  snacks: {
    items:
      "protein bar|granola bar|popcorn|nacho chips|roasted makhana|sev mix|banana chips|dark chocolate|cookies|rice cakes|samosa",
    mealTags: ["breakfast", "mid_morning_snack", "evening_snack"],
    preps: ["roasted", "baked", "fried", "spicy", "protein blend", "crunchy"],
    cuisines: [
      "global pantry",
      "indian snack shop",
      "office desk",
      "travel pack",
      "cinema",
      "fitness desk",
    ],
    p: [0.02, 0.25],
    c: [0.24, 0.82],
    f: [0.02, 0.44],
    price: [8, 45],
  },
  desserts: {
    items:
      "ice cream vanilla|gulab jamun|brownie bite|cheesecake slice|kheer cup|fruit custard|chocolate mousse|rice pudding|frozen yogurt|apple pie|donut glazed",
    mealTags: ["breakfast", "evening_snack", "dinner"],
    preps: ["chilled", "baked", "festive", "low sugar", "creamy", "cafe serve"],
    cuisines: [
      "global patisserie",
      "indian sweet shop",
      "cafe bakery",
      "frozen bar",
      "festive table",
      "wellness kitchen",
    ],
    p: [0.02, 0.08],
    c: [0.18, 0.5],
    f: [0.04, 0.26],
    price: [10, 34],
  },
  drinks: {
    items:
      "orange juice|apple juice|banana smoothie|mango shake|sweet lassi|protein shake|black coffee|masala chai|coconut water|lemonade|green smoothie",
    mealTags: ["breakfast", "mid_morning_snack", "evening_snack"],
    preps: [
      "chilled",
      "fresh pressed",
      "blended",
      "iced",
      "creamy",
      "recovery",
    ],
    cuisines: [
      "cafe bar",
      "home kitchen",
      "gym bar",
      "street stand",
      "tropical",
      "indian beverage",
    ],
    p: [0, 0.18],
    c: [0.001, 0.18],
    f: [0, 0.04],
    price: [4, 26],
  },
  "fast foods": {
    items:
      "veg burger|chicken burger|pizza margherita|pepperoni pizza|french fries|fried chicken|shawarma wrap|taco|sub sandwich|loaded nachos|hot dog",
    mealTags: ["lunch", "dinner", "evening_snack"],
    preps: ["classic", "grilled", "cheesy", "loaded", "crispy", "street style"],
    cuisines: [
      "global chain",
      "american diner",
      "indian outlet",
      "food court",
      "late night",
      "street cart",
    ],
    p: [0.03, 0.24],
    c: [0.12, 0.42],
    f: [0.06, 0.2],
    price: [18, 44],
  },
};

const SPECIALS = {
  banana: { p: 0.011, c: 0.23, f: 0.003, price: 6.5 },
  apple: { p: 0.003, c: 0.14, f: 0.002, price: 12 },
  milk: { p: 0.032, c: 0.048, f: 0.033, price: 6 },
  "rice cooked": { p: 0.024, c: 0.28, f: 0.003, price: 8 },
  peanuts: { p: 0.26, c: 0.16, f: 0.49, price: 22 },
  "olive oil": { p: 0, c: 0, f: 1, price: 22 },
};
const NON_VEG = [
  "chicken",
  "fish",
  "mutton",
  "beef",
  "pork",
  "lamb",
  "turkey",
  "tuna",
  "salmon",
  "shrimp",
  "prawn",
  "crab",
  "pepperoni",
  "shawarma",
  "hot dog",
];
const EGG = ["egg", "omelette", "omelet", "frittata"];
const DAIRY = [
  "milk",
  "paneer",
  "cheese",
  "curd",
  "yogurt",
  "ghee",
  "butter",
  "kefir",
  "lassi",
  "cream",
  "whey",
  "mozzarella",
  "cheddar",
  "ice cream",
  "milkshake",
  "latte",
];
const TOKENS = {
  protein: [
    "beans",
    "dal",
    "chickpea",
    "chana",
    "rajma",
    "tofu",
    "tempeh",
    "paneer",
    "whey",
    "protein",
    "chicken",
    "turkey",
    "satay",
  ],
  carbs: [
    "rice",
    "bread",
    "pasta",
    "oats",
    "poha",
    "roti",
    "dosa",
    "pulao",
    "biryani",
    "noodles",
    "bagel",
    "pancake",
    "fries",
    "pizza",
  ],
  fatty: [
    "butter",
    "cheese",
    "cream",
    "oil",
    "nuts",
    "seeds",
    "chocolate",
    "mousse",
    "burger",
    "nachos",
    "fries",
  ],
  light: ["salad", "soup", "water", "coffee", "tea", "juice", "lemonade"],
};

function rangeValue(rng, min, max) {
  return min + (max - min) * rng();
}
function fitMacros(category, protein, carbs, fat) {
  const total = protein + carbs + fat;
  const limit = CATEGORY_LIMITS[category] || 0.85;
  if (!total || total <= limit) return { protein, carbs, fat };
  const scale = limit / total;
  return { protein: protein * scale, carbs: carbs * scale, fat: fat * scale };
}
function inferDietTags(name, category) {
  const text = normalizeText(`${name} ${category}`);
  if (NON_VEG.some((token) => text.includes(token))) return ["non-vegetarian"];
  if (EGG.some((token) => text.includes(token)))
    return ["eggetarian", "non-vegetarian"];
  if (category === "dairy" || DAIRY.some((token) => text.includes(token)))
    return ["vegetarian", "eggetarian", "non-vegetarian"];
  return ["vegan", "vegetarian", "eggetarian", "non-vegetarian"];
}
function baseProfile(name, category) {
  const key = normalizeText(name);
  if (SPECIALS[key]) return SPECIALS[key];
  const cfg = CONFIG[category];
  const rng = mulberry32(hashText(`${category}:${key}`));
  let protein = rangeValue(rng, cfg.p[0], cfg.p[1]);
  let carbs = rangeValue(rng, cfg.c[0], cfg.c[1]);
  let fat = rangeValue(rng, cfg.f[0], cfg.f[1]);
  if (TOKENS.protein.some((token) => key.includes(token))) protein *= 1.35;
  if (TOKENS.carbs.some((token) => key.includes(token))) carbs *= 1.18;
  if (TOKENS.fatty.some((token) => key.includes(token))) fat *= 1.28;
  if (TOKENS.light.some((token) => key.includes(token))) {
    carbs *= 0.72;
    fat *= 0.5;
    protein *= 0.75;
  }
  if (category === "oils") {
    protein = 0;
    carbs = 0;
    fat = 1;
  }
  const macros = fitMacros(category, protein, carbs, fat);
  let price = rangeValue(rng, cfg.price[0], cfg.price[1]);
  if (TOKENS.protein.some((token) => key.includes(token))) price *= 1.12;
  if (TOKENS.light.some((token) => key.includes(token))) price *= 0.92;
  if (TOKENS.fatty.some((token) => key.includes(token))) price *= 1.08;
  return { p: macros.protein, c: macros.carbs, f: macros.fat, price };
}
function aliases(name, prep, cuisine, context) {
  return Array.from(
    new Set(
      [
        name,
        `${prep} ${name}`,
        `${name} ${prep}`,
        `${cuisine} ${name}`,
        `${name} ${cuisine}`,
        `${name} ${context}`,
      ].map(normalizeText),
    ),
  );
}
function entry(
  name,
  category,
  cuisine,
  aliasesList,
  mealTags,
  popularity,
  p,
  c,
  f,
  price,
) {
  const macros = fitMacros(category, p, c, f);
  return {
    name: normalizeText(name),
    category,
    cuisine: normalizeText(cuisine),
    aliases: aliasesList,
    calories_per_gram: round(
      clamp(macros.protein * 4 + macros.carbs * 4 + macros.fat * 9, 0.01, 9.2),
      4,
    ),
    protein_per_gram: round(macros.protein, 4),
    carbs_per_gram: round(macros.carbs, 4),
    fat_per_gram: round(macros.fat, 4),
    price_per_100g: round(price, 2),
    dietTags: inferDietTags(name, category),
    mealTags,
    popularityScore: popularity,
  };
}

const foods = [];
const seen = new Set();
Object.entries(CONFIG).forEach(([category, cfg], categoryIndex) => {
  cfg.items.split("|").forEach((name, itemIndex) => {
    const base = baseProfile(name, category);
    const baseEntry = entry(
      name,
      category,
      cfg.cuisines[0],
      [normalizeText(name)],
      cfg.mealTags,
      60 + ((itemIndex * 7) % 34),
      base.p,
      base.c,
      base.f,
      base.price,
    );
    const baseKey = `${baseEntry.name}__${baseEntry.category}__${baseEntry.cuisine}`;
    if (!seen.has(baseKey)) {
      seen.add(baseKey);
      foods.push(baseEntry);
    }
    cfg.preps.forEach((prep, prepIndex) => {
      cfg.cuisines.forEach((cuisine, cuisineIndex) => {
        CONTEXTS.forEach((context, contextIndex) => {
          const rng = mulberry32(
            hashText(`${category}:${name}:${prep}:${cuisine}:${context.label}`),
          );
          const prepFactor = PREP_FACTORS[prepIndex];
          const cuisineFactor = CUISINE_FACTORS[cuisineIndex];
          const p =
            base.p *
            prepFactor[0] *
            cuisineFactor[0] *
            context.protein *
            rangeValue(rng, 0.97, 1.03);
          const c =
            base.c *
            prepFactor[1] *
            cuisineFactor[1] *
            context.carbs *
            rangeValue(rng, 0.97, 1.03);
          const f =
            base.f *
            prepFactor[2] *
            cuisineFactor[2] *
            context.fat *
            rangeValue(rng, 0.97, 1.03);
          const price = clamp(
            base.price *
              prepFactor[3] *
              cuisineFactor[3] *
              context.price *
              rangeValue(rng, 0.96, 1.08),
            cfg.price[0],
            cfg.price[1] * 3,
          );
          const variant = entry(
            `${name} ${prep} ${cuisine} ${context.label}`,
            category,
            cuisine,
            aliases(name, prep, cuisine, context.label),
            cfg.mealTags,
            48 +
              ((categoryIndex * 11 +
                itemIndex * 7 +
                prepIndex * 5 +
                cuisineIndex * 3 +
                contextIndex * 17) %
                48) +
              context.popularity,
            p,
            c,
            f,
            price,
          );
          const key = `${variant.name}__${variant.category}__${variant.cuisine}`;
          if (!seen.has(key)) {
            seen.add(key);
            foods.push(variant);
          }
        });
      });
    });
  });
});
foods.sort(
  (a, b) =>
    a.category.localeCompare(b.category) ||
    a.name.localeCompare(b.name) ||
    a.cuisine.localeCompare(b.cuisine),
);
const outFile = path.join(__dirname, "..", "data", "foodDatabase.json");
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(foods, null, 2));
console.log(`Generated ${foods.length} foods at ${outFile}`);

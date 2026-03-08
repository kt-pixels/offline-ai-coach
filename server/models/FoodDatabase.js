const mongoose = require('mongoose');

const foodDatabaseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    cuisine: {
      type: String,
      default: 'global',
      index: true,
    },
    aliases: {
      type: [String],
      default: [],
    },
    calories_per_gram: {
      type: Number,
      required: true,
    },
    protein_per_gram: {
      type: Number,
      required: true,
    },
    carbs_per_gram: {
      type: Number,
      required: true,
    },
    fat_per_gram: {
      type: Number,
      required: true,
    },
    price_per_100g: {
      type: Number,
      required: true,
      min: 0,
    },
    dietTags: {
      type: [String],
      default: [],
      index: true,
    },
    mealTags: {
      type: [String],
      default: [],
      index: true,
    },
    popularityScore: {
      type: Number,
      default: 50,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

foodDatabaseSchema.index({ name: 'text', aliases: 'text', category: 'text', cuisine: 'text' });
foodDatabaseSchema.index({ name: 1, category: 1, cuisine: 1 }, { unique: true });

module.exports = mongoose.model('FoodDatabase', foodDatabaseSchema);

import api from './api';

export async function getOnboardingStatus() {
  const { data } = await api.get('/nutrition/onboarding');
  return data;
}

export async function saveOnboarding(payload) {
  const { data } = await api.post('/nutrition/onboarding', payload);
  return data;
}

export async function getNutritionDashboard(date) {
  const { data } = await api.get('/nutrition/dashboard', {
    params: date ? { date } : undefined,
  });
  return data;
}

export async function searchFoods(query, limit = 12, mealType) {
  const { data } = await api.get('/nutrition/foods/search', {
    params: {
      q: query,
      limit,
      ...(mealType ? { mealType } : {}),
    },
  });
  return data;
}

export async function addMealEntry(payload) {
  const { data } = await api.post('/nutrition/meals', payload);
  return data;
}

export async function getMealEntries(date) {
  const { data } = await api.get('/nutrition/meals', {
    params: date ? { date } : undefined,
  });
  return data;
}

export async function getNutritionAnalytics() {
  const { data } = await api.get('/nutrition/analytics');
  return data;
}

export async function generateMealPlan(payload) {
  const { data } = await api.post('/nutrition/meal-plan', payload);
  return data;
}

export async function simulateFutureBody(payload) {
  const { data } = await api.post('/nutrition/simulation', payload);
  return data;
}

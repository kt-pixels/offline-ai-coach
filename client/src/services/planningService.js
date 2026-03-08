import api from './api';

export async function getPlanningOverview() {
  const { data } = await api.get('/planning/overview');
  return data;
}

export async function generateGroceryPlan(payload) {
  const { data } = await api.post('/planning/grocery', payload);
  return data;
}

export async function generateBudgetMealPlan(payload) {
  const { data } = await api.post('/planning/budget-meals', payload);
  return data;
}

export async function getBodyAnalytics(params) {
  const { data } = await api.get('/planning/body-analytics', { params });
  return data;
}

export async function generateRoutine(payload) {
  const { data } = await api.post('/planning/routine', payload);
  return data;
}

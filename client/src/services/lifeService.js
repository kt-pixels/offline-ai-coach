import api from './api';

export async function getDashboard() {
  const { data } = await api.get('/life/dashboard');
  return data;
}

export async function getDailyLogs() {
  const { data } = await api.get('/life/daily-logs');
  return data;
}

export async function saveDailyLog(payload) {
  const { data } = await api.post('/life/daily-logs', payload);
  return data;
}

export async function createMeal(payload) {
  const { data } = await api.post('/life/meals', payload);
  return data;
}

export async function createWorkout(payload) {
  const { data } = await api.post('/life/workouts', payload);
  return data;
}

export async function createTask(payload) {
  const { data } = await api.post('/life/tasks', payload);
  return data;
}

export async function toggleTask(id) {
  const { data } = await api.patch(`/life/tasks/${id}/toggle`);
  return data;
}

export async function deleteTask(id) {
  const { data } = await api.delete(`/life/tasks/${id}`);
  return data;
}

export async function createHabit(payload) {
  const { data } = await api.post('/life/habits', payload);
  return data;
}

export async function toggleHabit(id) {
  const { data } = await api.post(`/life/habits/${id}/toggle`);
  return data;
}

export async function deleteHabit(id) {
  const { data } = await api.delete(`/life/habits/${id}`);
  return data;
}

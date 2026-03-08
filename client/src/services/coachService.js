import api from './api';

export async function getInsights() {
  const { data } = await api.get('/coach/insights');
  return data;
}

export async function sendCoachMessage(message) {
  const { data } = await api.post('/coach/chat', { message });
  return data;
}

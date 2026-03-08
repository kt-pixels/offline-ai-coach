import { useCallback, useEffect, useState } from 'react';
import * as lifeService from '../services/lifeService';
import * as coachService from '../services/coachService';

export function useDashboardData() {
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [dashboardData, coachData] = await Promise.all([
        lifeService.getDashboard(),
        coachService.getInsights()
      ]);
      setDashboard(dashboardData);
      setInsights(coachData.insights);
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to load dashboard.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    dashboard,
    insights,
    loading,
    error,
    refresh: load,
    actions: {
      saveDailyLog: lifeService.saveDailyLog,
      createMeal: lifeService.createMeal,
      createWorkout: lifeService.createWorkout,
      createTask: lifeService.createTask,
      toggleTask: lifeService.toggleTask,
      deleteTask: lifeService.deleteTask,
      createHabit: lifeService.createHabit,
      toggleHabit: lifeService.toggleHabit,
      deleteHabit: lifeService.deleteHabit
    }
  };
}

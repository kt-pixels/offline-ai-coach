import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as lifeService from '../../services/lifeService';
import * as coachService from '../../services/coachService';
import * as nutritionService from '../../services/nutritionService';
import * as planningService from '../../services/planningService';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights] = useState(null);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [nutritionDashboard, setNutritionDashboard] = useState(null);
  const [nutritionAnalytics, setNutritionAnalytics] = useState(null);
  const [planningOverview, setPlanningOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const nutritionData = await nutritionService.getNutritionDashboard();
      setNutritionDashboard(nutritionData);

      if (nutritionData?.onboardingRequired) {
        setDashboard(null);
        setInsights(null);
        setDailyLogs([]);
        setNutritionAnalytics(null);
        setPlanningOverview(null);
        setLoading(false);
        return;
      }

      const [dashboardData, coachData, logData, analyticsData, planningData] = await Promise.all([
        lifeService.getDashboard(),
        coachService.getInsights(),
        lifeService.getDailyLogs(),
        nutritionService.getNutritionAnalytics(),
        planningService.getPlanningOverview(),
      ]);

      setDashboard(dashboardData);
      setInsights(coachData.insights);
      setDailyLogs(logData.logs || []);
      setNutritionAnalytics(analyticsData);
      setPlanningOverview(planningData);
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to load workspace.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const withRefresh = useCallback(
    async (operation) => {
      const result = await operation();
      await loadWorkspace();
      return result;
    },
    [loadWorkspace],
  );

  const actions = useMemo(
    () => ({
      saveDailyLog: (payload) => withRefresh(() => lifeService.saveDailyLog(payload)),
      createMeal: (payload) => withRefresh(() => lifeService.createMeal(payload)),
      createWorkout: (payload) => withRefresh(() => lifeService.createWorkout(payload)),
      createTask: (payload) => withRefresh(() => lifeService.createTask(payload)),
      toggleTask: (id) => withRefresh(() => lifeService.toggleTask(id)),
      deleteTask: (id) => withRefresh(() => lifeService.deleteTask(id)),
      createHabit: (payload) => withRefresh(() => lifeService.createHabit(payload)),
      toggleHabit: (id) => withRefresh(() => lifeService.toggleHabit(id)),
      deleteHabit: (id) => withRefresh(() => lifeService.deleteHabit(id)),
      addMealEntry: (payload) => withRefresh(() => nutritionService.addMealEntry(payload)),
      searchFoods: (query, limit, mealType) => nutritionService.searchFoods(query, limit, mealType),
      getMealEntries: (date) => nutritionService.getMealEntries(date),
      generateMealPlan: (payload) => nutritionService.generateMealPlan(payload),
      simulateFutureBody: (payload) => nutritionService.simulateFutureBody(payload),
      generateGroceryPlan: (payload) => planningService.generateGroceryPlan(payload),
      generateBudgetMealPlan: (payload) => planningService.generateBudgetMealPlan(payload),
      getBodyAnalytics: (params) => planningService.getBodyAnalytics(params),
      generateRoutine: (payload) => planningService.generateRoutine(payload),
      coachChat: (message) => coachService.sendCoachMessage(message),
    }),
    [withRefresh],
  );

  const value = useMemo(
    () => ({
      dashboard,
      insights,
      dailyLogs,
      nutritionDashboard,
      nutritionAnalytics,
      planningOverview,
      loading,
      error,
      refresh: loadWorkspace,
      actions,
    }),
    [dashboard, insights, dailyLogs, nutritionDashboard, nutritionAnalytics, planningOverview, loading, error, loadWorkspace, actions],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspaceContext must be used inside WorkspaceProvider');
  }
  return context;
}

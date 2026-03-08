import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './layouts/ProtectedRoute';
import SaaSLayout from './layouts/SaaSLayout';
import { WorkspaceProvider } from './features/workspace/WorkspaceProvider';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import WeightAnalyticsPage from './pages/WeightAnalyticsPage';
import DietPlannerPage from './pages/DietPlannerPage';
import WorkoutBuilderPage from './pages/WorkoutBuilderPage';
import HabitTrackerPage from './pages/HabitTrackerPage';
import TaskManagerPage from './pages/TaskManagerPage';
import AICoachPage from './pages/AICoachPage';
import ProgressAnalyticsPage from './pages/ProgressAnalyticsPage';
import SimulationPage from './pages/SimulationPage';
import SettingsPage from './pages/SettingsPage';
import GroceryPlannerPage from './pages/GroceryPlannerPage';
import BudgetMealPlannerPage from './pages/BudgetMealPlannerPage';
import BodyAnalyticsPage from './pages/BodyAnalyticsPage';
import RoutinePlannerPage from './pages/RoutinePlannerPage';

function RequireOnboarding({ children }) {
  const { user } = useAuth();
  if (!user?.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return children;
}

function RedirectIfOnboarded({ children }) {
  const { user } = useAuth();
  if (user?.onboardingCompleted) return <Navigate to="/app/dashboard" replace />;
  return children;
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-panel-950 text-slate-300">
        <div className="glass-card px-6 py-4">Loading account...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <RedirectIfOnboarded>
              <OnboardingPage />
            </RedirectIfOnboarded>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <RequireOnboarding>
              <WorkspaceProvider>
                <SaaSLayout />
              </WorkspaceProvider>
            </RequireOnboarding>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="weight" element={<WeightAnalyticsPage />} />
        <Route path="diet" element={<DietPlannerPage />} />
        <Route path="workouts" element={<WorkoutBuilderPage />} />
        <Route path="habits" element={<HabitTrackerPage />} />
        <Route path="tasks" element={<TaskManagerPage />} />
        <Route path="coach" element={<AICoachPage />} />
        <Route path="analytics" element={<ProgressAnalyticsPage />} />
        <Route path="simulation" element={<SimulationPage />} />
        <Route path="grocery-planner" element={<GroceryPlannerPage />} />
        <Route path="budget-meal-planner" element={<BudgetMealPlannerPage />} />
        <Route path="body-analytics" element={<BodyAnalyticsPage />} />
        <Route path="routine-planner" element={<RoutinePlannerPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/grocery-planner" element={<Navigate to="/app/grocery-planner" replace />} />
      <Route path="/budget-meal-planner" element={<Navigate to="/app/budget-meal-planner" replace />} />
      <Route path="/body-analytics" element={<Navigate to="/app/body-analytics" replace />} />
      <Route path="/routine-planner" element={<Navigate to="/app/routine-planner" replace />} />
      <Route path="*" element={<Navigate to={user ? (user.onboardingCompleted ? '/app/dashboard' : '/onboarding') : '/login'} replace />} />
    </Routes>
  );
}

export default App;

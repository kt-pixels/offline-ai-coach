import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../hooks/useWorkspace';
import ChartCard from '../components/ui/ChartCard';
import StatCard from '../components/ui/StatCard';

function BudgetMealPlannerPage() {
  const { nutritionDashboard, actions } = useWorkspace();
  const profile = nutritionDashboard?.profile;
  const [dailyBudget, setDailyBudget] = useState(120);
  const [calorieTarget, setCalorieTarget] = useState(nutritionDashboard?.today?.calorieTarget || 2200);
  const [dietType, setDietType] = useState(profile?.dietPreference || 'vegetarian');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setCalorieTarget(nutritionDashboard?.today?.calorieTarget || 2200);
    setDietType(profile?.dietPreference || 'vegetarian');
  }, [nutritionDashboard?.today?.calorieTarget, profile?.dietPreference]);

  const generatePlan = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const data = await actions.generateBudgetMealPlan({ dailyBudget: Number(dailyBudget), calorieTarget: Number(calorieTarget), dietType });
      setPlan(data.budgetMealPlan);
      setMessage('Budget meal plan optimized using the local food database.');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to generate budget meal plan right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Daily Budget" value={`Rs. ${dailyBudget}`} hint="Budget cap per day" tone="blue" />
        <StatCard label="Target Calories" value={`${Math.round(Number(calorieTarget) || 0)} kcal`} hint="Daily intake target" tone="emerald" />
        <StatCard label="Estimated Cost" value={`Rs. ${plan?.estimatedCost || 0}`} hint={`Savings Rs. ${plan?.savings || 0}`} tone="amber" />
        <StatCard label="Protein" value={`${Math.round(plan?.macros?.protein || 0)} g`} hint={`${plan?.budgetUtilization || 0}% budget used`} tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card space-y-4 p-4" onSubmit={generatePlan}>
          <div>
            <p className="panel-title">Budget Meal Planner</p>
            <p className="mt-1 text-sm text-slate-400">Enter a rupee budget per day and the planner will build meals around the cheapest calorie sources that still support your target.</p>
          </div>

          <label>
            <span className="mb-1 block text-xs uppercase text-slate-400">Budget Per Day (Rs.)</span>
            <input className="input-base" type="number" min="40" value={dailyBudget} onChange={(event) => setDailyBudget(event.target.value)} />
          </label>
          <label>
            <span className="mb-1 block text-xs uppercase text-slate-400">Calorie Target</span>
            <input className="input-base" type="number" min="1200" value={calorieTarget} onChange={(event) => setCalorieTarget(event.target.value)} />
          </label>
          <label>
            <span className="mb-1 block text-xs uppercase text-slate-400">Diet Type</span>
            <select className="input-base" value={dietType} onChange={(event) => setDietType(event.target.value)}>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="eggetarian">Eggetarian</option>
              <option value="non-vegetarian">Non-Vegetarian</option>
            </select>
          </label>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Optimizing...' : 'Generate Budget Plan'}
          </button>
        </motion.form>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
          <ChartCard title="Optimization Summary" subtitle={plan?.summary || 'Generate a plan to compare calories and budget.'}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-700 bg-panel-950/60 p-4 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Macros</p>
                <p className="mt-2">Protein {Math.round(plan?.macros?.protein || 0)} g</p>
                <p>Carbs {Math.round(plan?.macros?.carbs || 0)} g</p>
                <p>Fat {Math.round(plan?.macros?.fat || 0)} g</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-panel-950/60 p-4 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Cheapest Calorie Sources</p>
                <div className="mt-2 space-y-2">
                  {(plan?.cheapestCalorieSources || []).slice(0, 4).map((food) => (
                    <div key={food.name} className="text-xs text-slate-400">{food.name} • Rs. {food.price_per_100g}/100g • {food.calories_per_100g} kcal</div>
                  ))}
                </div>
              </div>
            </div>
          </ChartCard>

          {plan?.notes?.length ? (
            <ChartCard title="Planner Notes" subtitle="Budget guardrails and calorie coverage">
              <div className="space-y-2 text-sm text-slate-300">
                {plan.notes.map((note) => (
                  <div key={note} className="rounded-2xl border border-slate-700 bg-panel-950/60 p-3">{note}</div>
                ))}
              </div>
            </ChartCard>
          ) : null}
        </motion.div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {(plan?.meals || []).map((meal) => (
          <ChartCard key={meal.mealType} title={meal.label} subtitle={`${meal.totalCalories} kcal • Rs. ${meal.estimatedCost}`}>
            <div className="space-y-3">
              {meal.foods.map((food) => (
                <div key={`${meal.mealType}-${food.name}`} className="rounded-2xl border border-slate-700 bg-panel-950/60 p-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-100">{food.name}</span>
                    <span>{food.grams} g</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{food.calories} kcal • Protein {food.protein} g • Rs. {food.cost}</p>
                </div>
              ))}
            </div>
          </ChartCard>
        ))}
      </section>

      {message ? <p className="text-sm text-slate-300">{message}</p> : null}
    </div>
  );
}

export default BudgetMealPlannerPage;

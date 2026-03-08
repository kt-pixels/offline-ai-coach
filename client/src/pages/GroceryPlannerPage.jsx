import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../hooks/useWorkspace';
import ChartCard from '../components/ui/ChartCard';
import StatCard from '../components/ui/StatCard';

function GroceryPlannerPage() {
  const { nutritionDashboard, planningOverview, actions } = useWorkspace();
  const [weeklyCalories, setWeeklyCalories] = useState((nutritionDashboard?.today?.calorieTarget || 2200) * 7);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [plan, setPlan] = useState(planningOverview?.groceryPlan || null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setPlan(planningOverview?.groceryPlan || null);
    setWeeklyCalories((nutritionDashboard?.today?.calorieTarget || 2200) * 7);
  }, [planningOverview?.groceryPlan, nutritionDashboard?.today?.calorieTarget]);

  useEffect(() => {
    let active = true;
    if (!query.trim()) {
      setResults([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const data = await actions.searchFoods(query.trim(), 8);
        if (active) setResults(data.foods || []);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [actions, query]);

  const generatePlan = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const data = await actions.generateGroceryPlan({
        weeklyCalorieNeeds: Number(weeklyCalories),
        mealPlan: nutritionDashboard?.mealPlan,
        selectedFoods,
      });
      setPlan(data.groceryPlan);
      setMessage('Weekly grocery list updated from your meal plan and selected foods.');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to generate grocery plan right now.');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    items: plan?.groceryList?.length || 0,
    cost: plan?.estimatedWeeklyCost || 0,
    groups: plan?.groupedGroceries?.length || 0,
  }), [plan]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Weekly Calories" value={`${Math.round(Number(weeklyCalories) || 0)} kcal`} hint="Target grocery volume" tone="blue" />
        <StatCard label="Grocery Items" value={`${stats.items}`} hint="Auto-aggregated from meals" tone="emerald" />
        <StatCard label="Estimated Spend" value={`Rs. ${stats.cost}`} hint="Weekly shopping estimate" tone="amber" />
        <StatCard label="Groups" value={`${stats.groups}`} hint="Fruits to protein sources" tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card space-y-4 p-4" onSubmit={generatePlan}>
          <div>
            <p className="panel-title">AI Grocery Planner</p>
            <p className="mt-1 text-sm text-slate-400">Analyze the current meal plan, weekly calories, and preferred foods to generate a shopping list grouped by category.</p>
          </div>

          <label>
            <span className="mb-1 block text-xs uppercase text-slate-400">Weekly Calorie Need</span>
            <input className="input-base" type="number" min="7000" value={weeklyCalories} onChange={(event) => setWeeklyCalories(event.target.value)} />
          </label>

          <div>
            <span className="mb-1 block text-xs uppercase text-slate-400">Preferred Foods</span>
            <input className="input-base" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search and add foods to prioritize" />
            {searching ? <p className="mt-2 text-xs text-slate-500">Searching food database...</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedFoods.map((food) => (
                <button key={food.name} type="button" className="rounded-full border border-linear-500/40 bg-linear-500/10 px-3 py-1 text-xs text-slate-100" onClick={() => setSelectedFoods((prev) => prev.filter((item) => item.name !== food.name))}>
                  {food.name}
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {results.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => setSelectedFoods((prev) => (prev.some((item) => item.name === food.name) ? prev : [...prev, food]))}
                  className="w-full rounded-2xl border border-slate-700 bg-panel-950/60 p-3 text-left hover:border-slate-500"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-100">{food.name}</span>
                    <span className="text-slate-400">Rs. {food.price_per_100g}/100g</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{food.category} • {food.cuisine}</p>
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Grocery List'}
          </button>
        </motion.form>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
          <ChartCard title="Grocery Reminders" subtitle="Highest-volume items from the current weekly plan">
            <div className="space-y-3">
              {(plan?.reminders || []).map((item) => (
                <div key={item} className="rounded-2xl border border-slate-700 bg-panel-950/60 p-3 text-sm text-slate-200">{item}</div>
              ))}
              {!plan?.reminders?.length ? <p className="text-sm text-slate-500">Generate a plan to see reminders.</p> : null}
            </div>
          </ChartCard>

          <ChartCard title="Plan Summary" subtitle={plan?.summary || 'Shopping intelligence will appear here'}>
            <div className="grid gap-3 md:grid-cols-2">
              {(plan?.groupedGroceries || []).slice(0, 4).map((group) => (
                <div key={group.group} className="rounded-2xl border border-slate-700 bg-panel-950/60 p-4">
                  <p className="text-sm font-semibold capitalize text-slate-100">{group.group}</p>
                  <p className="mt-2 text-xs text-slate-500">{group.items.length} items • Rs. {group.totalCost}</p>
                </div>
              ))}
            </div>
          </ChartCard>
        </motion.div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {(plan?.groupedGroceries || []).map((group) => (
          <ChartCard key={group.group} title={group.group} subtitle={`Rs. ${group.totalCost} estimated spend`}>
            <div className="space-y-3">
              {group.items.map((item) => (
                <div key={`${group.group}-${item.name}`} className="rounded-2xl border border-slate-700 bg-panel-950/60 p-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-100">{item.name}</span>
                    <span>{item.quantityLabel}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.category} • Rs. {item.estimatedCost}</p>
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

export default GroceryPlannerPage;

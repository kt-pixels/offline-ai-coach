import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { ensureChartsRegistered } from '../components/data/chartSetup';
import { useWorkspace } from '../hooks/useWorkspace';
import ChartCard from '../components/ui/ChartCard';
import StatCard from '../components/ui/StatCard';

ensureChartsRegistered();

const chartOptions = {
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#cbd5e1' } } },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } },
    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } },
  },
};

function SimulationPage() {
  const { nutritionDashboard, nutritionAnalytics, actions } = useWorkspace();
  const defaults = nutritionAnalytics?.simulationDefaults || nutritionDashboard?.simulationDefaults;
  const [dailyCalories, setDailyCalories] = useState(defaults?.dailyCalories || nutritionDashboard?.today?.calorieTarget || 2400);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(defaults?.workoutsPerWeek || 3);
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [simulation, setSimulation] = useState(
    nutritionDashboard?.growthPrediction
      ? { inputs: { dailyCalories, workoutsPerWeek, durationWeeks }, simulation: nutritionDashboard.growthPrediction }
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!defaults || initialized) return;
    setDailyCalories(defaults.dailyCalories || nutritionDashboard?.today?.calorieTarget || 2400);
    setWorkoutsPerWeek(defaults.workoutsPerWeek || 3);
    setInitialized(true);
  }, [defaults, initialized, nutritionDashboard?.today?.calorieTarget]);

  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');
        const data = await actions.simulateFutureBody({
          dailyCalories,
          workoutsPerWeek,
          durationWeeks,
        });
        if (active) {
          setSimulation(data);
        }
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.message || 'Unable to run future body simulation.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 280);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [dailyCalories, workoutsPerWeek, durationWeeks, actions]);

  const chartData = useMemo(
    () => ({
      labels: ['Start', ...(simulation?.simulation?.projection || []).map((point) => point.label)],
      datasets: [
        {
          label: 'Simulated Weight',
          data: [nutritionDashboard?.today?.currentWeightKg || 0, ...(simulation?.simulation?.projection || []).map((point) => point.weightKg)],
          borderColor: '#28d8c4',
          backgroundColor: 'rgba(40,216,196,0.15)',
          fill: true,
          tension: 0.35,
        },
      ],
    }),
    [simulation?.simulation?.projection, nutritionDashboard?.today?.currentWeightKg],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Daily Calories" value={`${dailyCalories} kcal`} hint="Simulation input" tone="blue" />
        <StatCard label="Workouts / Week" value={workoutsPerWeek} hint="Simulation input" tone="emerald" />
        <StatCard label="Projected Week 12" value={`${simulation?.simulation?.finalWeightKg || 0} kg`} hint="Future body state" tone="amber" />
        <StatCard label="Projected Surplus" value={`${simulation?.simulation?.projectedDailySurplus || 0} kcal`} hint="Daily calorie delta" tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form className="glass-card space-y-5 p-4" onSubmit={(event) => event.preventDefault()}>
          <div>
            <p className="panel-title">Future Body Simulation</p>
            <p className="mt-1 text-sm text-slate-400">Adjust calories and training frequency to see how your bodyweight trajectory changes.</p>
          </div>

          <label className="block">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>Daily Calories</span>
              <span>{dailyCalories} kcal</span>
            </div>
            <input className="w-full" type="range" min="1200" max="4500" step="50" value={dailyCalories} onChange={(event) => setDailyCalories(Number(event.target.value))} />
          </label>

          <label className="block">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>Workouts Per Week</span>
              <span>{workoutsPerWeek}</span>
            </div>
            <input className="w-full" type="range" min="0" max="10" step="1" value={workoutsPerWeek} onChange={(event) => setWorkoutsPerWeek(Number(event.target.value))} />
          </label>

          <label className="block">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>Duration</span>
              <span>{durationWeeks} weeks</span>
            </div>
            <input className="w-full" type="range" min="4" max="24" step="1" value={durationWeeks} onChange={(event) => setDurationWeeks(Number(event.target.value))} />
          </label>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            {(simulation?.simulation?.milestones || []).map((point) => (
              <div key={point.week} className="rounded-xl border border-slate-700 bg-panel-950/50 p-3 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{point.label}</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">{point.weightKg} kg</p>
                <p className="mt-1 text-xs text-slate-500">Delta {point.weeklyChangeKg} kg</p>
              </div>
            ))}
          </div>

          {loading ? <p className="text-sm text-slate-400">Running simulation...</p> : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </form>

        <ChartCard title="Simulated Bodyweight Path" subtitle={simulation?.simulation?.summary || 'Bodyweight response to calorie and workout changes'}>
          <div className="h-[400px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </ChartCard>
      </section>
    </div>
  );
}

export default SimulationPage;

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import { ensureChartsRegistered } from "../components/data/chartSetup";
import { useWorkspace } from "../hooks/useWorkspace";
import StatCard from "../components/ui/StatCard";
import ProgressRing from "../components/ui/ProgressRing";
import ChartCard from "../components/ui/ChartCard";
import ActivityHeatmap from "../components/ui/ActivityHeatmap";

ensureChartsRegistered();

const chartOptions = {
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "#cbd5e1" } } },
  scales: {
    x: {
      ticks: { color: "#94a3b8" },
      grid: { color: "rgba(148,163,184,0.08)" },
    },
    y: {
      ticks: { color: "#94a3b8" },
      grid: { color: "rgba(148,163,184,0.08)" },
    },
  },
};

function DashboardPage() {
  const {
    dashboard,
    insights,
    nutritionDashboard,
    nutritionAnalytics,
    planningOverview,
  } = useWorkspace();

  const today = nutritionDashboard?.today;
  const mealDistribution = today?.mealDistribution || [];
  const discipline = nutritionDashboard?.discipline || {
    score: 0,
    label: "poor",
    components: {},
  };
  const growthPrediction = nutritionDashboard?.growthPrediction;
  const heatmapData = nutritionAnalytics?.calorieHeatmap || [];
  const habitCards = (dashboard?.habits || [])
    .slice()
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3);
  const routineSummary = planningOverview?.routine;
  const groceryPlan = planningOverview?.groceryPlan;

  const mealCompletion = useMemo(() => {
    if (!mealDistribution.length) return 0;
    return Math.round(
      mealDistribution.reduce((sum, meal) => {
        if (!meal.targetCalories) return sum;
        return (
          sum +
          Math.min(100, (meal.consumedCalories / meal.targetCalories) * 100)
        );
      }, 0) / mealDistribution.length,
    );
  }, [mealDistribution]);

  const growthChart = useMemo(() => {
    const projection = growthPrediction?.projection || [];
    return {
      labels: projection.map((point) => point.label),
      datasets: [
        {
          label: "Projected Weight",
          data: projection.map((point) => point.weightKg),
          borderColor: "#4f8dff",
          backgroundColor: "rgba(79,141,255,0.16)",
          fill: true,
          tension: 0.35,
        },
        {
          label: "Target Weight",
          data: projection.map(
            () =>
              nutritionDashboard?.profile?.targetWeightKg ||
              today?.targetWeightKg ||
              0,
          ),
          borderColor: "#28d8c4",
          borderDash: [6, 5],
          pointRadius: 0,
          tension: 0,
        },
      ],
    };
  }, [
    growthPrediction?.projection,
    nutritionDashboard?.profile?.targetWeightKg,
    today?.targetWeightKg,
  ]);

  const disciplineChart = useMemo(() => {
    const trend = nutritionAnalytics?.disciplineTrend || [];
    return {
      labels: trend.map((point) => point.date),
      datasets: [
        {
          label: "Discipline Score",
          data: trend.map((point) => point.score),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245,158,11,0.16)",
          fill: true,
          tension: 0.35,
        },
      ],
    };
  }, [nutritionAnalytics?.disciplineTrend]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto w-full max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12"
    >
      <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(79,141,255,0.35),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(40,216,196,0.22),transparent_25%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))] p-4 sm:p-6 lg:p-8 xl:p-10 shadow-card">
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr] items-start xl:items-end">
          <div className="w-full">
            <p className="panel-title">Next Generation Fitness Intelligence</p>
            <h1 className="mt-3 max-w-3xl text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-50">
              Drive body growth, nutrition precision, and discipline with a
              fully local AI operating system.
            </h1>
            <p className="mt-4 max-w-2xl text-sm sm:text-base leading-6 text-slate-300">
              Your dashboard now combines a 10k+ food database, local meal
              generation, bodyweight forecasting, habit-driven discipline
              scoring, and adaptive coaching.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-3 w-full">
              <Link
                className="btn-primary w-full sm:w-auto text-center"
                to="/app/coach"
              >
                Open AI Coach
              </Link>
              <Link
                className="btn-subtle w-full sm:w-auto text-center"
                to="/app/simulation"
              >
                Run Future Simulation
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1 gap-3 w-full">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Projected Week 12
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-50">
                {growthPrediction?.finalWeightKg || today?.currentWeightKg || 0}{" "}
                kg
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                Required surplus: {growthPrediction?.requiredDailySurplus || 0}{" "}
                kcal/day
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Daily Discipline
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-50">
                {discipline.score || 0}/100
              </p>
              <p className="mt-1 text-xs sm:text-sm capitalize text-slate-300">
                {discipline.label}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Meal Completion
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-50">
                {mealCompletion}%
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                Across {mealDistribution.length || 0} scheduled meals
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          label="Today's Calorie Target"
          value={`${today?.calorieTarget || 0} kcal`}
          hint="Adaptive nutrition target"
          tone="blue"
        />
        <StatCard
          label="Calories Consumed"
          value={`${today?.caloriesConsumed || 0} kcal`}
          hint={`Remaining ${today?.caloriesRemaining || 0} kcal`}
          tone="emerald"
        />
        <StatCard
          label="Current vs Target Weight"
          value={`${today?.currentWeightKg || 0} / ${today?.targetWeightKg || 0} kg`}
          hint="Live bodyweight trajectory"
          tone="amber"
        />
        <StatCard
          label="Projected Weekly Change"
          value={`${growthPrediction?.expectedWeeklyChangeKg || 0} kg`}
          hint={
            growthPrediction?.summary || "Projection updates from your data"
          }
          tone="rose"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <section className="glass-card p-4 sm:p-5 h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="panel-title">Routine Summary</p>
            <Link
              className="btn-subtle w-full sm:w-auto text-center"
              to="/app/routine-planner"
            >
              Open Routine
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
            <div className="rounded-2xl border border-slate-700 bg-panel-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Discipline Score
              </p>
              <p className="mt-3 text-xl sm:text-2xl font-semibold text-slate-50">
                {routineSummary?.disciplineScore || 0}/100
              </p>
              <p className="mt-1 text-sm text-slate-400 break-words">
                {routineSummary?.routineSummary ||
                  "Generate a routine to structure your day."}
              </p>
            </div>
            <div className="space-y-2">
              {(routineSummary?.todayPlan?.items || [])
                .slice(0, 4)
                .map((item) => (
                  <div
                    key={`${item.time}-${item.label}`}
                    className="rounded-2xl border border-slate-700 bg-panel-950/60 p-3 text-sm text-slate-300"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">{item.label}</span>
                      <span className="font-medium text-slate-100 shrink-0">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        <section className="glass-card p-4 sm:p-5 h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="panel-title">Grocery Reminder</p>
            <Link
              className="btn-subtle w-full sm:w-auto text-center"
              to="/app/grocery-planner"
            >
              Open Grocery
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
            <div className="rounded-2xl border border-slate-700 bg-panel-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Weekly Spend
              </p>
              <p className="mt-3 text-xl sm:text-2xl font-semibold text-slate-50">
                Rs. {groceryPlan?.estimatedWeeklyCost || 0}
              </p>
              <p className="mt-1 text-sm text-slate-400 break-words">
                {groceryPlan?.summary ||
                  "Generate a grocery plan from your meal stack."}
              </p>
            </div>
            <div className="space-y-2">
              {(groceryPlan?.reminders || []).slice(0, 4).map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-700 bg-panel-950/60 p-3 text-sm text-slate-300 break-words"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <ChartCard title="Calorie Ring" subtitle="Current intake vs target">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full">
            <ProgressRing
              value={today?.caloriesConsumed || 0}
              max={today?.calorieTarget || 1}
              label="Calories"
              sublabel={`${today?.proteinConsumed || 0}g protein`}
            />
            <ProgressRing
              value={discipline.score || 0}
              max={100}
              label="Discipline"
              sublabel={discipline.label}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-300">
            <div className="rounded-xl border border-slate-700 bg-panel-950/50 p-3 text-center sm:text-left">
              Protein {Math.round(today?.proteinConsumed || 0)} g
            </div>
            <div className="rounded-xl border border-slate-700 bg-panel-950/50 p-3 text-center sm:text-left">
              Carbs {Math.round(today?.carbsConsumed || 0)} g
            </div>
            <div className="rounded-xl border border-slate-700 bg-panel-950/50 p-3 text-center sm:text-left">
              Fats {Math.round(today?.fatConsumed || 0)} g
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Body Growth Projection"
          subtitle="12-week forecast from your current calorie pacing"
        >
          <div className="h-64 sm:h-72 lg:h-80 xl:h-96 w-full">
            <Line data={growthChart} options={chartOptions} />
          </div>
        </ChartCard>

        <section className="glass-card p-4 sm:p-5 h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="panel-title">AI Coach Widget</p>
            <Link
              className="btn-subtle w-full sm:w-auto text-center"
              to="/app/coach"
            >
              Chat
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {(insights?.coachFeed || insights?.suggestions || [])
              .slice(0, 4)
              .map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-700 bg-panel-950/60 p-3 text-sm text-slate-200 break-words"
                >
                  {item}
                </div>
              ))}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
            {habitCards.map((habit) => (
              <div
                key={habit._id}
                className="rounded-2xl border border-slate-700 bg-panel-950/60 p-3"
              >
                <p className="text-sm font-semibold text-slate-100">
                  {habit.name}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Streak {habit.streak} days • Best {habit.longestStreak}
                </p>
              </div>
            ))}
            {!habitCards.length ? (
              <p className="text-sm text-slate-500">
                Create habits to unlock streak cards.
              </p>
            ) : null}
          </div>
        </section>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1.05fr_0.95fr] gap-6">
        <ChartCard
          title="Discipline Trend"
          subtitle="Rolling discipline score over the last 30 days"
        >
          <div className="h-64 sm:h-72 lg:h-80 w-full">
            <Line data={disciplineChart} options={chartOptions} />
          </div>
        </ChartCard>

        <section className="glass-card p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="panel-title">AI Meal Execution</p>
            <Link
              className="btn-subtle w-full sm:w-auto text-center"
              to="/app/diet"
            >
              Open Planner
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {mealDistribution.map((meal) => {
              const progress = meal.targetCalories
                ? Math.min(
                    100,
                    Math.round(
                      (meal.consumedCalories / meal.targetCalories) * 100,
                    ),
                  )
                : 0;
              return (
                <div
                  key={meal.mealType}
                  className="rounded-2xl border border-slate-700 bg-panel-950/60 p-3"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-100 truncate">
                      {meal.label}
                    </span>
                    <span className="text-slate-400 shrink-0">
                      {meal.consumedCalories}/{meal.targetCalories} kcal
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-linear-500 to-accent-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 break-words">
                    {meal.scheduledTime} • Remaining {meal.remainingCalories}{" "}
                    kcal
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <ActivityHeatmap title="Calorie Heatmap" data={heatmapData} />

        <section className="glass-card p-4 sm:p-5">
          <p className="panel-title">Week 4 / 8 / 12 Milestones</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(growthPrediction?.milestones || []).map((point) => (
              <div
                key={point.week}
                className="rounded-2xl border border-slate-700 bg-panel-950/60 p-4"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  {point.label}
                </p>
                <p className="mt-3 text-xl sm:text-2xl font-semibold text-slate-50">
                  {point.weightKg} kg
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Weekly change {point.weeklyChangeKg} kg
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </motion.div>
  );
}

export default DashboardPage;
